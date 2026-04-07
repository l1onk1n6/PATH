import { useNavigate } from 'react-router-dom';
import { AlertCircle, Download, ZoomIn, ZoomOut, Loader2, Layers, X, FileEdit, FileText, FolderDown, Lock } from 'lucide-react';
import { useState, useRef } from 'react';
import { useResumeStore } from '../store/resumeStore';
import ProGate from '../components/ui/ProGate';
import ResumePreview from '../components/templates/ResumePreview';
import { TEMPLATES } from '../components/templates/templateConfig';
import { useIsMobile } from '../hooks/useBreakpoint';
import type { Resume } from '../types/resume';

const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

// Renders an HTML element to jsPDF pages, returns the doc
async function renderElementToPdfDoc(
  element: HTMLElement,
  quality = 0.92,
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const html2canvas = (await import('html2canvas')).default;
  const jsPDF = (await import('jspdf')).default;

  const canvas = await html2canvas(element, {
    scale: 2, useCORS: true, allowTaint: true,
    backgroundColor: '#ffffff', width: 794, height: element.scrollHeight,
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const ratio = pdfW / (canvas.width / 2);
  const contentH = (canvas.height / 2) * ratio;

  let yOffset = 0;
  let pageCount = 0;
  while (yOffset < contentH) {
    if (pageCount > 0) pdf.addPage();
    const srcY = (yOffset / ratio) * 2;
    const srcH = Math.min((pdfH / ratio) * 2, canvas.height - srcY);
    const pg = document.createElement('canvas');
    pg.width = canvas.width; pg.height = srcH;
    pg.getContext('2d')!.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
    pdf.addImage(pg.toDataURL('image/jpeg', quality), 'JPEG', 0, 0, pdfW, srcH * ratio / 2);
    yOffset += pdfH;
    pageCount++;
  }

  return { pdfBytes: pdf.output('arraybuffer') as unknown as Uint8Array, pageCount };
}

// Merge multiple PDFs (as Uint8Array/ArrayBuffer) using pdf-lib
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

// Embed an image dataUrl as a full A4 page in a new PDF
async function imageToPdfBytes(dataUrl: string): Promise<Uint8Array | null> {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.create();
    const isJpeg = dataUrl.includes('data:image/jpeg') || dataUrl.includes('data:image/jpg');
    const base64 = dataUrl.split(',')[1];
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const img = isJpeg ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
    const a4w = 595.28, a4h = 841.89; // pts
    const scale = Math.min(a4w / img.width, a4h / img.height);
    const w = img.width * scale, h = img.height * scale;
    const page = doc.addPage([a4w, a4h]);
    page.drawImage(img, { x: (a4w - w) / 2, y: (a4h - h) / 2, width: w, height: h });
    return doc.save();
  } catch { return null; }
}

// Adaptive quality: reduce JPEG quality until under MAX_PDF_BYTES
async function exportAdaptive(
  parts: HTMLElement[],
  docDataUrls: { dataUrl: string; type: string }[],
): Promise<Uint8Array> {
  let quality = 0.92;

  for (let attempt = 0; attempt < 4; attempt++) {
    const pdfParts: Uint8Array[] = [];

    for (const el of parts) {
      const { pdfBytes } = await renderElementToPdfDoc(el, quality);
      pdfParts.push(pdfBytes);
    }

    for (const { dataUrl, type } of docDataUrls) {
      if (type === 'application/pdf' || dataUrl.startsWith('data:application/pdf')) {
        const base64 = dataUrl.split(',')[1];
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        pdfParts.push(bytes);
      } else {
        const imgPdf = await imageToPdfBytes(dataUrl);
        if (imgPdf) pdfParts.push(imgPdf);
      }
    }

    const merged = await mergePdfs(pdfParts);
    if (merged.length <= MAX_PDF_BYTES || quality <= 0.55) return merged;
    quality -= 0.12;
  }

  // Fallback – merge with lowest quality
  const pdfParts: Uint8Array[] = [];
  for (const el of parts) {
    const { pdfBytes } = await renderElementToPdfDoc(el, 0.55);
    pdfParts.push(pdfBytes);
  }
  return mergePdfs(pdfParts);
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
  const resume = getActiveResume();
  const [zoom, setZoom] = useState(isMobile ? 0.42 : 0.7);
  const [exporting, setExporting] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [activeView, setActiveView] = useState<'resume' | 'cover-letter'>('resume');
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

  // Export current view only
  const handleExport = async () => {
    if (!previewRef.current || exporting) return;
    setExporting(true);
    try {
      const { pdfBytes } = await renderElementToPdfDoc(previewRef.current);
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      const first = resume.personalInfo.firstName || 'Lebenslauf';
      const last = resume.personalInfo.lastName ? '_' + resume.personalInfo.lastName : '';
      a.download = `${first}${last}_CV.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch (err) { console.error('PDF export failed:', err); }
    finally { setExporting(false); }
  };

  // Export full Bewerbungsmappe: cover letter + resume + documents
  const handleExportMappe = async () => {
    if (!previewRef.current || exporting) return;
    setExporting(true);
    try {
      const elements: HTMLElement[] = [];

      // 1. Cover letter (if content exists)
      const cl = resume.coverLetter;
      const hasContent = cl?.body || cl?.subject || cl?.recipient;
      if (hasContent && coverLetterRef.current) {
        elements.push(coverLetterRef.current);
      }

      // 2. Resume (always)
      const resumeEl = resumePageRef.current;
      if (resumeEl) elements.push(resumeEl);

      const docs = (resume.documents ?? []).map(d => ({ dataUrl: d.dataUrl, type: d.type }));
      const merged = await exportAdaptive(elements, docs);

      const blob = new Blob([merged.buffer as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = buildFilename(resume);
      a.click(); URL.revokeObjectURL(url);
    } catch (err) { console.error('Mappe export failed:', err); }
    finally { setExporting(false); }
  };

  const cl = resume.coverLetter ?? { recipient: '', subject: '', body: '', closing: 'Mit freundlichen Grüssen' };
  const pi = resume.personalInfo;
  const senderName = [pi.firstName, pi.lastName].filter(Boolean).join(' ');

  const CoverLetterPage = () => (
    <div style={{
      width: 794, minHeight: 1123, background: '#fff', color: '#111',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: 13, lineHeight: 1.7, padding: '80px 80px 60px',
      boxSizing: 'border-box',
    }}>
      {/* Sender info top right */}
      <div style={{ textAlign: 'right', marginBottom: 40, fontSize: 12, color: '#555' }}>
        {senderName && <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{senderName}</div>}
        {pi.title && <div>{pi.title}</div>}
        {pi.location && <div>{pi.location}</div>}
        {pi.email && <div>{pi.email}</div>}
        {pi.phone && <div>{pi.phone}</div>}
      </div>

      {/* Recipient */}
      {cl.recipient && (
        <div style={{ marginBottom: 32, whiteSpace: 'pre-line', fontSize: 13 }}>
          {cl.recipient}
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
        <div style={{ marginBottom: 48 }}>{cl.closing || 'Mit freundlichen Grüssen'}</div>
        {senderName && <div style={{ fontWeight: 700 }}>{senderName}</div>}
      </div>
    </div>
  );

  const TemplatePicker = () => (
    <>
      {TEMPLATES.map((tmpl) => {
        const isSelected = resume.templateId === tmpl.id;
        return (
          <button
            key={tmpl.id}
            onClick={() => { setTemplate(resume.id, tmpl.id); if (isMobile) setTemplatePickerOpen(false); }}
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 6 }}
          >
            <div
              className="glass-card"
              style={{ padding: 10, border: isSelected ? `2px solid ${resume.accentColor}` : '1px solid rgba(255,255,255,0.12)' }}
            >
              <div style={{ height: 40, borderRadius: 6, background: tmpl.preview, marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontWeight: isSelected ? 700 : 500, textAlign: 'left' }}>{tmpl.name}</div>
            </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* View tabs */}
            <button
              className="btn-glass btn-sm"
              onClick={() => setActiveView('resume')}
              style={{
                padding: '5px 10px', gap: 5,
                background: activeView === 'resume' ? 'rgba(0,122,255,0.2)' : undefined,
                borderColor: activeView === 'resume' ? 'rgba(0,122,255,0.4)' : undefined,
              }}
            >
              <FileText size={12} />{!isMobile && ' Lebenslauf'}
            </button>
            <button
              className="btn-glass btn-sm"
              onClick={() => setActiveView('cover-letter')}
              style={{
                padding: '5px 10px', gap: 5,
                background: activeView === 'cover-letter' ? 'rgba(0,122,255,0.2)' : undefined,
                borderColor: activeView === 'cover-letter' ? 'rgba(0,122,255,0.4)' : undefined,
              }}
            >
              <FileEdit size={12} />{!isMobile && ' Anschreiben'}
            </button>

            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />

            {/* Mobile: template picker toggle (only for resume view) */}
            {isMobile && activeView === 'resume' && (
              <button
                className="btn-glass btn-sm btn-icon"
                onClick={() => setTemplatePickerOpen(true)}
                style={{ padding: 7 }}
                title="Templates"
              >
                <Layers size={14} />
              </button>
            )}
            <button className="btn-glass btn-sm btn-icon" onClick={() => setZoom(Math.max(0.25, zoom - 0.1))} style={{ padding: 7 }}>
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: 11, minWidth: 36, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button className="btn-glass btn-sm btn-icon" onClick={() => setZoom(Math.min(1.2, zoom + 0.1))} style={{ padding: 7 }}>
              <ZoomIn size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn-glass btn-sm"
              onClick={handleExport}
              disabled={exporting}
              title="Nur aktuelle Seite exportieren"
              style={{ opacity: exporting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {exporting
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <Download size={13} />
              }
              {!isMobile && ' PDF'}
            </button>
            <ProGate featureId="password" badge>
              <button className="btn-glass btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Lock size={13} />{!isMobile && ' Passwort'}
              </button>
            </ProGate>
            <button
              className="btn-glass btn-primary btn-sm"
              onClick={handleExportMappe}
              disabled={exporting}
              title="Ganze Bewerbungsmappe exportieren (Anschreiben + CV + Dokumente)"
              style={{ opacity: exporting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {exporting
                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />{!isMobile && ' Exportiere…'}</>
                : <><FolderDown size={13} />{!isMobile && ' Ganze Mappe'}</>
              }
            </button>
          </div>
        </div>

        {/* Preview scroll area */}
        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? 12 : 24, background: '#555' }}>
          <div style={{
            width: 794,
            margin: '0 auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            transformOrigin: 'top center',
            transform: `scale(${zoom})`,
            marginBottom: `calc((${zoom} - 1) * -100%)`,
          }}>
            <div ref={previewRef}>
              {activeView === 'resume'
                ? <div ref={resumePageRef}><ResumePreview resume={resume} /></div>
                : <div ref={coverLetterRef}><CoverLetterPage /></div>
              }
            </div>
            {/* Hidden off-screen renders for Mappe export */}
            <div style={{ position: 'absolute', left: -9999, top: 0, pointerEvents: 'none' }}>
              <div ref={activeView === 'resume' ? coverLetterRef : resumePageRef}>
                {activeView === 'resume' ? <CoverLetterPage /> : <ResumePreview resume={resume} />}
              </div>
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

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
