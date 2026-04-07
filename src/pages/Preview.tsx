import { useNavigate } from 'react-router-dom';
import { AlertCircle, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { useResumeStore } from '../store/resumeStore';
import ResumePreview from '../components/templates/ResumePreview';
import { TEMPLATES } from '../components/templates/templateConfig';

export default function Preview() {
  const navigate = useNavigate();
  const { getActiveResume, setTemplate } = useResumeStore();
  const resume = getActiveResume();
  const [zoom, setZoom] = useState(0.7);

  if (!resume) {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: '48px 32px', textAlign: 'center', margin: 'auto' }}>
        <AlertCircle size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Kein Lebenslauf ausgewählt</h3>
        <button className="btn-glass btn-primary" onClick={() => navigate('/')}>Zum Dashboard</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: 16, height: '100%', overflow: 'hidden' }}>
      {/* Template picker sidebar */}
      <aside style={{ width: 160, flexShrink: 0, overflow: 'auto' }}>
        <div className="section-label" style={{ marginBottom: 8 }}>Templates</div>
        {TEMPLATES.map((tmpl) => {
          const isSelected = resume.templateId === tmpl.id;
          return (
            <button
              key={tmpl.id}
              onClick={() => setTemplate(resume.id, tmpl.id)}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                cursor: 'pointer', padding: 0, marginBottom: 6,
              }}
            >
              <div
                className="glass-card"
                style={{
                  padding: 10,
                  border: isSelected ? `2px solid ${resume.accentColor}` : '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div style={{ height: 50, borderRadius: 6, background: tmpl.preview, marginBottom: 6 }} />
                <div style={{ fontSize: 11, fontWeight: isSelected ? 700 : 500, textAlign: 'left' }}>{tmpl.name}</div>
              </div>
            </button>
          );
        })}
      </aside>

      {/* Preview area */}
      <div
        className="glass"
        style={{
          flex: 1,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn-glass btn-sm btn-icon" onClick={() => setZoom(Math.max(0.3, zoom - 0.1))} style={{ padding: 7 }}>
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: 12, minWidth: 42, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button className="btn-glass btn-sm btn-icon" onClick={() => setZoom(Math.min(1.2, zoom + 0.1))} style={{ padding: 7 }}>
              <ZoomIn size={13} />
            </button>
          </div>

          <button className="btn-glass btn-primary btn-sm" onClick={() => window.print()}>
            <Download size={13} /> PDF exportieren
          </button>
        </div>

        {/* Preview scroll area */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, background: '#555' }}>
          <div style={{
            width: 794,
            margin: '0 auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            transformOrigin: 'top center',
            transform: `scale(${zoom})`,
            marginBottom: `calc((${zoom} - 1) * -100%)`,
          }}>
            <ResumePreview resume={resume} />
          </div>
        </div>
      </div>
    </div>
  );
}
