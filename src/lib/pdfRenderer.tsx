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

export async function renderDocumentImagePdf(doc: UploadedDocument): Promise<Uint8Array> {
  return renderDoc(<DocumentImagePdf doc={doc} />);
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
    const isPdf = d.type === 'application/pdf' || d.dataUrl.startsWith('data:application/pdf');
    if (isPdf) {
      const base64 = d.dataUrl.split(',')[1];
      if (!base64) continue;
      parts.push(Uint8Array.from(atob(base64), c => c.charCodeAt(0)));
    } else {
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
