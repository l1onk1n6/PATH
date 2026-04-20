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
import { pdf } from '@react-pdf/renderer';
import type { Resume, TemplateId } from '../types/resume';
import MinimalPdf from '../components/templates/pdf/MinimalPdf';

type PdfTemplateComponent = React.ComponentType<{ resume: Resume }>;

const registry: Partial<Record<TemplateId, PdfTemplateComponent>> = {
  minimal: MinimalPdf,
};

export function hasPdfTemplate(id: TemplateId): boolean {
  return Boolean(registry[id]);
}

export async function renderResumePdf(resume: Resume): Promise<Uint8Array> {
  const Component = registry[resume.templateId];
  if (!Component) throw new Error(`Kein PDF-Template fuer "${resume.templateId}" registriert`);
  const blob = await pdf(<Component resume={resume} />).toBlob();
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

