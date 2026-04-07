import { useNavigate } from 'react-router-dom';
import { AlertCircle, Download, ZoomIn, ZoomOut, Loader2, Layers, X, FileEdit, FileText } from 'lucide-react';
import { useState, useRef } from 'react';
import { useResumeStore } from '../store/resumeStore';
import ResumePreview from '../components/templates/ResumePreview';
import { TEMPLATES } from '../components/templates/templateConfig';
import { useIsMobile } from '../hooks/useBreakpoint';

async function exportPDF(element: HTMLElement, filename: string) {
  const html2canvas = (await import('html2canvas')).default;
  const jsPDF = (await import('jspdf')).default;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: 794,
    height: element.scrollHeight,
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = pdfWidth / (imgWidth / 2);
  const contentHeight = (imgHeight / 2) * ratio;

  let yOffset = 0;
  let pageCount = 0;

  while (yOffset < contentHeight) {
    if (pageCount > 0) pdf.addPage();
    const sourceY = (yOffset / ratio) * 2;
    const sourceH = Math.min((pdfHeight / ratio) * 2, imgHeight - sourceY);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = imgWidth;
    pageCanvas.height = sourceH;
    const ctx = pageCanvas.getContext('2d')!;
    ctx.drawImage(canvas, 0, sourceY, imgWidth, sourceH, 0, 0, imgWidth, sourceH);
    const pageImg = pageCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(pageImg, 'JPEG', 0, 0, pdfWidth, sourceH * ratio / 2);
    yOffset += pdfHeight;
    pageCount++;
  }

  pdf.save(filename);
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

  if (!resume) {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: '48px 32px', textAlign: 'center', margin: 'auto' }}>
        <AlertCircle size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Kein Lebenslauf ausgewählt</h3>
        <button className="btn-glass btn-primary" onClick={() => navigate('/')}>Zum Dashboard</button>
      </div>
    );
  }

  const handleExport = async () => {
    if (!previewRef.current || exporting) return;
    setExporting(true);
    try {
      const firstName = resume.personalInfo.firstName || 'Lebenslauf';
      const lastName = resume.personalInfo.lastName || '';
      const filename = `${firstName}${lastName ? '_' + lastName : ''}_CV.pdf`;
      await exportPDF(previewRef.current, filename);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
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

          <button
            className="btn-glass btn-primary btn-sm"
            onClick={handleExport}
            disabled={exporting}
            style={{ opacity: exporting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {exporting
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />{!isMobile && ' Exportiere…'}</>
              : <><Download size={13} />{!isMobile && ' PDF exportieren'}</>
            }
          </button>
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
                ? <ResumePreview resume={resume} />
                : <CoverLetterPage />
              }
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
