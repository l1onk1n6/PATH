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
