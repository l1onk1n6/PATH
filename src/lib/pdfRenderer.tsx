/**
 * Vektor-PDF-Pipeline (@react-pdf/renderer).
 *
 * Phase 2 (dormant): nur Registry + Renderer-Helper. Wird erst in Phase 3
 * von Preview.tsx benutzt. Bis dahin aendert sich nichts am Export-Verhalten.
 *
 * Architektur:
 * - `registerPdfTemplate` bindet eine Template-ID (gleich wie in
 *   templateConfig) an ein @react-pdf-Document-Component.
 * - `renderResumePdf` erzeugt daraus Uint8Array (fuer savePdf / pdf-lib-Merge).
 * - `hasPdfTemplate` sagt dem Aufrufer ob der neue Pfad fuer ein Template
 *   schon existiert — sonst muss er auf html2canvas-pro zurueckfallen.
 */
import { pdf, type DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import type { Resume, TemplateId, UploadedDocument } from '../types/resume';
import MinimalPdf from '../components/templates/pdf/MinimalPdf';
import { StandardPdf, TEMPLATE_VARIANTS } from '../components/templates/pdf/StandardPdf';
import CoverLetterPdf from '../components/templates/pdf/CoverLetterPdf';
import DocumentImagePdf from '../components/templates/pdf/DocumentImagePdf';

type PdfTemplateComponent = React.ComponentType<{ resume: Resume }>;

/** Templates mit eigenem, handgebautem PDF-Component. */
const dedicated: Partial<Record<TemplateId, PdfTemplateComponent>> = {
  minimal: MinimalPdf,
};

export function hasPdfTemplate(id: TemplateId): boolean {
  return Boolean(dedicated[id] || TEMPLATE_VARIANTS[id]);
}

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

