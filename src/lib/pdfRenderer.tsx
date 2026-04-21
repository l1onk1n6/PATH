/**
 * Vektor-PDF-Pipeline (@react-pdf/renderer).
 *
 * - `dedicated`: Templates mit handgebautem PDF-Component (wenn spezielles
 *   Layout gewuenscht ist). Hat Vorrang vor StandardPdf.
 * - `StandardPdf` + `TEMPLATE_VARIANTS`: parametrischer Fallback fuer alle
 *   anderen Template-IDs ueber eine Config.
 * - `renderResumePdf` / `renderCoverLetterPdf` / `renderDocumentImagePdf`
 *   liefern Uint8Array fuer savePdf() und pdf-lib-Merge.
 */
import { pdf, type DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import type { Resume, TemplateId, UploadedDocument } from '../types/resume';
import MinimalPdf from '../components/templates/pdf/MinimalPdf';
import ElegantPdf from '../components/templates/pdf/ElegantPdf';
import TimelinePdf from '../components/templates/pdf/TimelinePdf';
import { StandardPdf, TEMPLATE_VARIANTS } from '../components/templates/pdf/StandardPdf';
import CoverLetterPdf from '../components/templates/pdf/CoverLetterPdf';
import DocumentImagePdf from '../components/templates/pdf/DocumentImagePdf';

type PdfTemplateComponent = React.ComponentType<{ resume: Resume }>;

// Template-IDs mit handgebautem, visuell markantem PDF-Component.
// Alle anderen fallen auf StandardPdf + Variant zurueck.
const dedicated: Partial<Record<TemplateId, PdfTemplateComponent>> = {
  minimal:  MinimalPdf,
  elegant:  ElegantPdf,
  timeline: TimelinePdf,
};

async function renderDoc(element: ReactElement<DocumentProps>): Promise<Uint8Array> {
  const blob = await pdf(element).toBlob();
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function renderResumePdf(resume: Resume): Promise<Uint8Array> {
  const Dedicated = dedicated[resume.templateId];
  const variant = TEMPLATE_VARIANTS[resume.templateId];
  const element = Dedicated
    ? <Dedicated resume={resume} />
    : variant
      ? <StandardPdf resume={resume} variant={variant} />
      : null;
  if (!element) throw new Error(`Kein PDF-Template fuer "${resume.templateId}" registriert`);
  return renderDoc(element);
}

export async function renderCoverLetterPdf(resume: Resume): Promise<Uint8Array> {
  return renderDoc(<CoverLetterPdf resume={resume} />);
}

/** base64 helper fuer Bytes → data: URL (Workaround gegen @react-pdf CORS-Issues). */
async function urlToDataUrl(url: string, fallbackMime: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const blob = await res.blob();
    const mime = blob.type || fallbackMime || 'application/octet-stream';
    const buf = await blob.arrayBuffer();
    // btoa mit grossen Uint8Arrays crashed → chunkweise
    let binary = '';
    const bytes = new Uint8Array(buf);
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return `data:${mime};base64,${btoa(binary)}`;
  } catch {
    return url;
  }
}

export async function renderDocumentImagePdf(doc: UploadedDocument): Promise<Uint8Array> {
  // Signed HTTPS URLs → zu data: URL vorwandeln, damit @react-pdf sicher embedden kann
  const embedDoc: UploadedDocument = /^https?:\/\//i.test(doc.dataUrl)
    ? { ...doc, dataUrl: await urlToDataUrl(doc.dataUrl, doc.type) }
    : doc;
  return renderDoc(<DocumentImagePdf doc={embedDoc} />);
}

/**
 * Kompletten Mappen-PDF bauen: Anschreiben (falls Inhalt) + Lebenslauf +
 * hochgeladene Dokumente, via pdf-lib zu einem PDF verkettet.
 * Einheit fuer Live-Vorschau und 'Ganze Mappe'-Export.
 */
export async function buildMappePdfBytes(resume: Resume): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const parts: Uint8Array[] = [];

  const cl = resume.coverLetter;
  if (cl?.body || cl?.subject || cl?.recipient) {
    parts.push(await renderCoverLetterPdf(resume));
  }
  parts.push(await renderResumePdf(resume));

  for (const d of resume.documents ?? []) {
    if (!d?.dataUrl) continue;
    const isHttpUrl = /^https?:\/\//i.test(d.dataUrl);
    const isPdf = d.type === 'application/pdf' || d.dataUrl.startsWith('data:application/pdf');

    if (isPdf) {
      // PDF-Bytes holen — aus base64 (Altbestand) oder Signed URL (Storage)
      let bytes: Uint8Array | null = null;
      if (isHttpUrl) {
        try {
          const res = await fetch(d.dataUrl);
          if (res.ok) bytes = new Uint8Array(await res.arrayBuffer());
        } catch { /* ignore */ }
      } else {
        const base64 = d.dataUrl.split(',')[1];
        if (base64) bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      }
      if (bytes) parts.push(bytes);
    } else {
      // Bilder — @react-pdf's Image unterstuetzt sowohl data: als auch https:
      parts.push(await renderDocumentImagePdf(d));
    }
  }

  const merged = await PDFDocument.create();
  for (const part of parts) {
    try {
      const src = await PDFDocument.load(part, { ignoreEncryption: true });
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach(p => merged.addPage(p));
    } catch { /* beschaedigte Teile ueberspringen */ }
  }
  return merged.save();
}
