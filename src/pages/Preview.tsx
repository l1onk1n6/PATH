import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Download, ZoomIn, ZoomOut, Loader2, Layers, X, FolderDown, Lock, FileBox } from 'lucide-react';
import { useState, useRef } from 'react';
import { useResumeStore } from '../store/resumeStore';
import ProGate from '../components/ui/ProGate';
import ResumePreview from '../components/templates/ResumePreview';
import { TEMPLATES } from '../components/templates/templateConfig';
import { useIsMobile } from '../hooks/useBreakpoint';
import { usePlan, FREE_TEMPLATE_IDS } from '../lib/plan';
import { canExportPdf, incrementPdfExport, getPdfExportCount, savePdf } from '../lib/pdfExports';
import { renderResumePdf, renderCoverLetterPdf, renderDocumentImagePdf } from '../lib/pdfRenderer';
import type { Resume, UploadedDocument } from '../types/resume';

/** Rendert ein hochgeladenes Dokument als A4-Seite in der Vorschau.
 *  Bilder werden voll angezeigt, PDFs als Platzhalter-Kachel mit
 *  Dateiname/Kategorie (die Export-Pipeline fuegt die echten PDF-Seiten
 *  beim Mappen-Export hinzu, im Live-Preview waere ein pdf.js-Renderer
 *  unverhaeltnismaessig teuer). */
function DocumentPagePreview({ doc, style }: { doc: UploadedDocument; style?: React.CSSProperties }) {
  const isImage = doc.type.startsWith('image/');
  const categoryLabel = {
    certificate: 'Zertifikat',
    reference: 'Zeugnis',
    portfolio: 'Portfolio',
    other: 'Dokument',
  }[doc.category] ?? 'Dokument';

  return (
    <div style={{
      width: 794, minHeight: 1123, background: '#fff', color: '#111',
      boxSizing: 'border-box', position: 'relative',
      display: 'flex', flexDirection: 'column',
      ...style,
    }}>
      <div style={{
        padding: '28px 60px 18px', borderBottom: '1px solid #eee',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>{categoryLabel}</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{doc.name}</div>
      </div>
      <div style={{ flex: 1, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isImage ? (
          <img
            src={doc.dataUrl}
            alt={doc.name}
            style={{ maxWidth: '100%', maxHeight: 980, objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <div style={{
            textAlign: 'center', color: '#666',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            <FileBox size={64} style={{ opacity: 0.35, marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 500 }}>PDF-Dokument</div>
            <div style={{ fontSize: 13, marginTop: 6, opacity: 0.7 }}>
              Der Inhalt wird beim Export in die Mappe eingefuegt.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Merge multiple PDFs (as Uint8Array/ArrayBuffer) using pdf-lib.
// Wird gebraucht, um Anschreiben + Lebenslauf + Dokumente zu einer Mappe
// zu verketten. pdf-lib bleibt Teil der Pipeline, html2canvas/jspdf nicht.
async function mergePdfs(parts: Uint8Array[]): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const merged = await PDFDocument.create();

  for (const part of parts) {
    try {
      const src = await PDFDocument.load(part, { ignoreEncryption: true });
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach(p => merged.addPage(p));
    } catch { /* skip corrupt/encrypted pages */ }
  }

  return merged.save();
}

function buildFilename(resume: Resume): string {
  const first = resume.personalInfo.firstName || '';
  const last = resume.personalInfo.lastName || '';
  const name = [first, last].filter(Boolean).join('_') || 'Bewerbung';
  return `${name}_Bewerbungsmappe.pdf`;
}

export default function Preview() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { getActiveResume, setTemplate } = useResumeStore();
  const { limits, isPro } = usePlan();
  const resume = getActiveResume();
  const [zoom, setZoom] = useState(isMobile ? 0.42 : 0.7);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const resumePageRef = useRef<HTMLDivElement>(null);
  const coverLetterRef = useRef<HTMLDivElement>(null);

  if (!resume) {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: '48px 32px', textAlign: 'center', margin: 'auto' }}>
        <AlertCircle size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Kein Lebenslauf ausgewählt</h3>
        <button className="btn-glass btn-primary" onClick={() => navigate('/')}>Zum Dashboard</button>
      </div>
    );
  }

  // Export nur Lebenslauf (Vektor via @react-pdf).
  const handleExport = async () => {
    if (exporting) return;
    if (!canExportPdf(limits.pdfExportsPerMonth)) {
      setExportError(`PDF-Export-Limit erreicht (${limits.pdfExportsPerMonth}/Monat). Upgrade auf Pro für mehr Exporte.`);
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      const first = resume.personalInfo.firstName || 'Lebenslauf';
      const last = resume.personalInfo.lastName ? '_' + resume.personalInfo.lastName : '';
      const filename = `${first}${last}_CV.pdf`;
      const pdfBytes = await renderResumePdf(resume);
      await savePdf(pdfBytes, filename);
      await incrementPdfExport();
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportError(`PDF-Export fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
    }
    finally { setExporting(false); }
  };

  // Export full Bewerbungsmappe: cover letter + resume + documents
  const handleExportMappe = async () => {
    if (exporting) return;
    if (!canExportPdf(limits.pdfExportsPerMonth)) {
      setExportError(`PDF-Export-Limit erreicht (${limits.pdfExportsPerMonth}/Monat). Upgrade auf Pro für mehr Exporte.`);
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      const pdfParts: Uint8Array[] = [];

      // 1. Cover letter (if content exists) — Vektor
      const cl = resume.coverLetter;
      const hasContent = cl?.body || cl?.subject || cl?.recipient;
      if (hasContent) {
        pdfParts.push(await renderCoverLetterPdf(resume));
      }

      // 2. Resume — Vektor (alle Template-IDs sind registriert)
      pdfParts.push(await renderResumePdf(resume));

      // 3. Hochgeladene Dokumente: PDFs direkt einmergen, Bilder via @react-pdf.
      //    Kaputte Eintraege (kein dataUrl / leerer Body) sammeln wir namentlich
      //    und zeigen am Ende einen Hinweis — nicht stumm ueberspringen.
      const skipped: string[] = [];
      for (const d of resume.documents ?? []) {
        if (!d?.dataUrl) { skipped.push(d?.name || 'Unbekannt'); continue; }
        const isPdf = d.type === 'application/pdf' || d.dataUrl.startsWith('data:application/pdf');
        if (isPdf) {
          const base64 = d.dataUrl.split(',')[1];
          if (!base64) { skipped.push(d.name); continue; }
          pdfParts.push(Uint8Array.from(atob(base64), c => c.charCodeAt(0)));
        } else {
          pdfParts.push(await renderDocumentImagePdf(d));
        }
      }

      const merged = await mergePdfs(pdfParts);
      await savePdf(merged, buildFilename(resume));
      await incrementPdfExport();
      if (skipped.length > 0) {
        setExportError(`Export erstellt, aber ${skipped.length} Dokument(e) konnten nicht eingefügt werden: ${skipped.join(', ')}. Bitte im Editor neu hochladen.`);
      }
    } catch (err) {
      console.error('Mappe export failed:', err);
      setExportError(`Mappen-Export fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`);
    }
    finally { setExporting(false); }
  };

  const cl = resume.coverLetter ?? { recipient: '', subject: '', body: '', closing: 'Mit freundlichen Grüssen' };
  const pi = resume.personalInfo;
  const senderName = [pi.firstName, pi.lastName].filter(Boolean).join(' ');
  const hasCoverLetterContent = Boolean(cl.body || cl.subject || cl.recipient);
  const pageShadow: React.CSSProperties = { boxShadow: '0 20px 60px rgba(0,0,0,0.4)' };

  const CoverLetterPage = () => (
    <div style={{
      width: 794, minHeight: 1123, background: '#fff', color: '#111',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: 13, lineHeight: 1.7, padding: '80px 80px 60px',
      boxSizing: 'border-box', position: 'relative',
    }}>
      {/* Page break indicator — visible in preview only, ignored by html2canvas */}
      <div data-html2canvas-ignore="true" style={{
        position: 'absolute', top: 1123, left: 0, right: 0, pointerEvents: 'none',
        borderTop: '1.5px dashed rgba(180,180,220,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: 9, color: 'rgba(100,100,180,0.7)', background: '#fff',
          padding: '0 8px', letterSpacing: '0.05em', fontFamily: 'sans-serif',
        }}>— Seite 2 —</span>
      </div>
      {/* Sender info top right */}
      <div style={{ textAlign: 'right', marginBottom: 40, fontSize: 12, color: '#555' }}>
        {senderName && <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{senderName}</div>}
        {pi.title && <div>{pi.title}</div>}
        {pi.location && <div>{pi.location}</div>}
        {pi.email && <div>{pi.email}</div>}
        {pi.phone && <div>{pi.phone}</div>}
      </div>

      {/* Recipient — leere Zeilen zwischen ausgefuellten Feldern ausblenden,
          damit das Adressblock sauber bleibt. Der CoverLetterEditor speichert
          leere Positionen, um den Cursor nicht ins falsche Feld zu werfen. */}
      {cl.recipient && cl.recipient.trim() && (
        <div style={{ marginBottom: 32, whiteSpace: 'pre-line', fontSize: 13 }}>
          {cl.recipient.split('\n').filter(l => l.trim()).join('\n')}
        </div>
      )}

      {/* Date */}
      <div style={{ textAlign: 'right', marginBottom: 28, color: '#555', fontSize: 12 }}>
        {pi.location ? pi.location + ', ' : ''}{new Date().toLocaleDateString('de-CH', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>

      {/* Subject */}
      {cl.subject && (
        <div style={{ fontWeight: 700, marginBottom: 24, fontSize: 14 }}>
          {cl.subject}
        </div>
      )}

      {/* Body */}
      <div style={{ whiteSpace: 'pre-wrap', marginBottom: 40 }}>
        {cl.body || <span style={{ color: '#aaa' }}>Kein Anschreiben-Text vorhanden.</span>}
      </div>

      {/* Closing */}
      <div>
        <div style={{ marginBottom: 48, whiteSpace: 'pre-wrap' }}>{cl.closing || 'Mit freundlichen Grüssen'}</div>
        {senderName && <div style={{ fontWeight: 700 }}>{senderName}</div>}
      </div>
    </div>
  );

  const TemplatePicker = () => (
    <>
      {TEMPLATES.map((tmpl) => {
        const isSelected = resume.templateId === tmpl.id;
        const isFreeTemplate = (FREE_TEMPLATE_IDS as readonly string[]).includes(tmpl.id);
        const locked = !isPro && !isFreeTemplate;

        const card = (
          <div
            className="glass-card"
            style={{ padding: 10, border: isSelected ? `2px solid ${resume.accentColor}` : '1px solid rgba(255,255,255,0.12)', opacity: locked ? 0.55 : 1, position: 'relative' }}
          >
            <div style={{ height: 40, borderRadius: 6, background: tmpl.preview, marginBottom: 6 }} />
            <div style={{ fontSize: 11, fontWeight: isSelected ? 700 : 500, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
              {tmpl.name}
              {locked && <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 3, background: 'linear-gradient(135deg, #FF9F0A, #FF375F)', color: '#fff' }}>PRO</span>}
            </div>
          </div>
        );

        if (locked) {
          return (
            <ProGate key={tmpl.id} featureId="templates">
              {card}
            </ProGate>
          );
        }

        return (
          <button
            key={tmpl.id}
            onClick={() => { setTemplate(resume.id, tmpl.id); if (isMobile) setTemplatePickerOpen(false); }}
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 6 }}
          >
            {card}
          </button>
        );
      })}
    </>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: 16, height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* ── Desktop: template sidebar ── */}
      {!isMobile && (
        <aside style={{ width: 160, flexShrink: 0, overflow: 'auto' }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Templates</div>
          <TemplatePicker />
        </aside>
      )}

      {/* ── Preview area ── */}
      <div
        className="glass"
        style={{ flex: 1, borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '8px 12px' : '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Mobile: template picker toggle */}
            {isMobile && (
              <button
                className="btn-glass btn-sm btn-icon"
                onClick={() => setTemplatePickerOpen(true)}
                style={{ padding: 9 }}
                title="Templates"
              >
                <Layers size={18} />
              </button>
            )}
            {/* Zoom-Buttons nur auf Desktop — mobile nutzt Pinch-to-Zoom */}
            {!isMobile && (
              <>
                <button className="btn-glass btn-sm btn-icon" onClick={() => setZoom(Math.max(0.25, zoom - 0.1))} style={{ padding: 9 }}>
                  <ZoomOut size={16} />
                </button>
                <span style={{ fontSize: 12, minWidth: 40, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button className="btn-glass btn-sm btn-icon" onClick={() => setZoom(Math.min(1.2, zoom + 0.1))} style={{ padding: 9 }}>
                  <ZoomIn size={16} />
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {!isMobile && limits.pdfExportsPerMonth !== Infinity && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                {getPdfExportCount()}/{limits.pdfExportsPerMonth} PDF
              </span>
            )}
            <button
              className="btn-glass btn-sm"
              onClick={handleExport}
              disabled={exporting}
              title="Nur Lebenslauf exportieren"
              style={{ opacity: exporting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px' }}
            >
              {exporting
                ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                : <Download size={16} />
              }
              {!isMobile && ' PDF'}
            </button>
            <ProGate featureId="password" badge>
              <button className="btn-glass btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px' }}>
                <Lock size={16} />{!isMobile && ' Passwort'}
              </button>
            </ProGate>
            <button
              className="btn-glass btn-primary btn-sm"
              onClick={handleExportMappe}
              disabled={exporting}
              title="Ganze Bewerbungsmappe exportieren (Anschreiben + CV + Dokumente)"
              style={{ opacity: exporting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px' }}
            >
              {exporting
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />{!isMobile && ' Exportiere…'}</>
                : <><FolderDown size={16} />{!isMobile && ' Ganze Mappe'}</>
              }
            </button>
          </div>
        </div>

        {/* Preview scroll area */}
        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? 12 : 24, background: '#555' }}>
          {/* Outer wrapper haelt die tatsaechlich sichtbare Groesse (794 * zoom)
              damit margin: 0 auto den skalierten Inhalt korrekt zentriert.
              Transform-Scale veraendert sonst nur die Darstellung, nicht das
              Layout-Box — das liess die Vorschau auf Mobile nach rechts rutschen. */}
          <div style={{
            width: 794 * zoom,
            margin: '0 auto',
            maxWidth: '100%',
          }}>
            <div style={{
              width: 794,
              transformOrigin: 'top left',
              transform: `scale(${zoom})`,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                {hasCoverLetterContent && <div style={pageShadow}><CoverLetterPage /></div>}
                <div style={pageShadow}><ResumePreview resume={resume} /></div>
                {(resume.documents ?? []).map((doc) => (
                  <DocumentPagePreview key={doc.id} doc={doc} style={pageShadow} />
                ))}
              </div>
            </div>
          </div>

          {/* Zweiter, unsichtbarer 1:1-Render ausschliesslich fuer den PDF-
              Export. html2canvas mis-rechnet Koordinaten, wenn der Capture-
              Root in einem transform:scale()-Ancestor liegt (Zeichen ueber-
              lappen im Anschreiben). Deshalb haengen die Export-Refs hier
              dran statt am skalierten Baum oben. */}
          <div
            aria-hidden
            style={{ position: 'absolute', left: -99999, top: 0, pointerEvents: 'none' }}
          >
            <div ref={previewRef} style={{ display: 'flex', flexDirection: 'column', gap: 40, width: 794 }}>
              {hasCoverLetterContent && (
                <div ref={coverLetterRef}><CoverLetterPage /></div>
              )}
              <div ref={resumePageRef}><ResumePreview resume={resume} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: template picker modal ── */}
      {isMobile && templatePickerOpen && (
        <>
          <div
            onClick={() => setTemplatePickerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
            maxHeight: '70vh', display: 'flex', flexDirection: 'column',
          }}>
            <div className="glass" style={{ borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Templates</span>
                <button className="btn-glass btn-icon btn-sm" onClick={() => setTemplatePickerOpen(false)} style={{ padding: 6 }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ overflowY: 'auto', padding: '12px 16px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <TemplatePicker />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Export error toast */}
      {exportError && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 300, padding: '12px 20px', borderRadius: 12,
          background: 'rgba(255,59,48,0.95)', backdropFilter: 'blur(12px)',
          color: '#fff', fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          maxWidth: '90vw',
        }}>
          <span>{exportError}</span>
          <button onClick={() => setExportError(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7, padding: 2 }}>
            <X size={14} />
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
