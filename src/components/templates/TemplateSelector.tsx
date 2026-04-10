import { Check, Palette } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { TEMPLATES } from './templateConfig';
import type { TemplateId } from '../../types/resume';

export function TemplateThumbnail({ id, preview, accent }: { id: string; preview: string; accent: string }) {
  const SIDEBAR_IDS = ['modern', 'corporate', 'executive', 'tech', 'freelancer', 'international'];
  const SIDEBAR_COLORS: Record<string, string> = {
    modern: '#1a1a2e', corporate: '#1e3a5f', executive: '#1a2332',
    tech: '#0d1117', freelancer: '#0f0f0f', international: '#1a237e',
  };

  if (SIDEBAR_IDS.includes(id)) {
    return (
      <div style={{ height: 70, display: 'flex', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ width: '32%', background: SIDEBAR_COLORS[id], padding: '8px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: accent, marginBottom: 3 }} />
          <div style={{ height: 2, width: '80%', background: 'rgba(255,255,255,0.5)', borderRadius: 2 }} />
          <div style={{ height: 2, width: '65%', background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 2, width: `${70 - i * 10}%`, background: 'rgba(255,255,255,0.15)', borderRadius: 2, marginTop: i === 0 ? 4 : 0 }} />
          ))}
        </div>
        <div style={{ flex: 1, background: '#f8f9fa', padding: '8px 7px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 5, width: '65%', background: '#555', borderRadius: 2 }} />
          <div style={{ height: 3, width: '45%', background: accent, borderRadius: 2, opacity: 0.8, marginBottom: 3 }} />
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 2, width: `${85 - i * 8}%`, background: '#ccc', borderRadius: 2 }} />
          ))}
        </div>
      </div>
    );
  }

  if (id === 'creative') {
    return (
      <div style={{ height: 70, display: 'flex', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ width: '40%', background: '#2d1b69', padding: '8px 5px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: accent, marginBottom: 3 }} />
          <div style={{ height: 2, width: '80%', background: 'rgba(255,255,255,0.5)', borderRadius: 2 }} />
          <div style={{ height: 2, width: '65%', background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 2, width: `${70 - i * 10}%`, background: 'rgba(255,255,255,0.15)', borderRadius: 2, marginTop: i === 0 ? 4 : 0 }} />
          ))}
        </div>
        <div style={{ flex: 1, background: '#f8f9fa', padding: '8px 7px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 5, width: '65%', background: '#333', borderRadius: 2 }} />
          <div style={{ height: 3, width: '45%', background: accent, borderRadius: 2, opacity: 0.8, marginBottom: 3 }} />
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 2, width: `${85 - i * 8}%`, background: '#ccc', borderRadius: 2 }} />
          ))}
        </div>
      </div>
    );
  }

  if (id === 'vibrant') {
    return (
      <div style={{ height: 70, borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
        <div style={{ height: 28, background: `linear-gradient(135deg, ${accent}, #5856D6)`, display: 'flex', alignItems: 'flex-end', padding: '0 8px 5px' }}>
          <div style={{ height: 5, width: '50%', background: 'rgba(255,255,255,0.9)', borderRadius: 2 }} />
        </div>
        <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 3, width: '35%', background: 'rgba(255,255,255,0.7)', borderRadius: 2 }} />
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 2, width: `${80 - i * 8}%`, background: '#ccc', borderRadius: 2 }} />
          ))}
        </div>
      </div>
    );
  }

  if (id === 'bold') {
    return (
      <div style={{ height: 70, borderRadius: 8, overflow: 'hidden', background: '#000' }}>
        <div style={{ height: 4, background: accent }} />
        <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 6, width: '55%', background: '#fff', borderRadius: 2 }} />
          <div style={{ height: 3, width: '38%', background: accent, borderRadius: 2, opacity: 0.85, marginBottom: 3 }} />
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 2, width: `${80 - i * 8}%`, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
          ))}
        </div>
      </div>
    );
  }

  if (id === 'startup') {
    return (
      <div style={{ height: 70, borderRadius: 8, overflow: 'hidden', background: '#0a0a0a' }}>
        <div style={{ height: 4, background: accent }} />
        <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 6, width: '55%', background: '#fff', borderRadius: 2 }} />
          <div style={{ height: 3, width: '38%', background: accent, borderRadius: 2, opacity: 0.85, marginBottom: 3 }} />
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 2, width: `${80 - i * 8}%`, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
          ))}
        </div>
      </div>
    );
  }

  if (id === 'geometric') {
    return (
      <div style={{ height: 70, borderRadius: 8, overflow: 'hidden', background: '#1a1a2e', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: -10, right: -10, width: 32, height: 32,
          background: accent, opacity: 0.3, transform: 'rotate(45deg)',
        }} />
        <div style={{
          position: 'absolute', top: 8, right: 8, width: 18, height: 18,
          background: accent, opacity: 0.5, transform: 'rotate(45deg)',
        }} />
        <div style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 6, width: '55%', background: '#fff', borderRadius: 2 }} />
          <div style={{ height: 3, width: '38%', background: accent, borderRadius: 2, opacity: 0.85, marginBottom: 3 }} />
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 2, width: `${75 - i * 8}%`, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
          ))}
        </div>
      </div>
    );
  }

  if (id === 'magazine') {
    return (
      <div style={{ height: 70, display: 'flex', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ width: '50%', background: '#1a1a1a', padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 6, width: '80%', background: '#fff', borderRadius: 2 }} />
          <div style={{ height: 3, width: '60%', background: accent, borderRadius: 2, opacity: 0.85 }} />
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 2, width: `${75 - i * 10}%`, background: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: i === 0 ? 3 : 0 }} />
          ))}
        </div>
        <div style={{ width: '50%', background: accent, opacity: 0.85 }} />
      </div>
    );
  }

  if (id === 'timeline') {
    return (
      <div style={{ height: 70, borderRadius: 8, overflow: 'hidden', background: '#f0f8ff', display: 'flex' }}>
        <div style={{ width: 4, background: accent, flexShrink: 0, marginLeft: 10 }} />
        <div style={{ flex: 1, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ height: 5, width: '55%', background: '#555', borderRadius: 2 }} />
          <div style={{ height: 3, width: '38%', background: accent, borderRadius: 2, opacity: 0.8 }} />
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 2, width: `${80 - i * 8}%`, background: '#aaa', borderRadius: 2 }} />
          ))}
        </div>
      </div>
    );
  }

  if (id === 'vintage') {
    return (
      <div style={{ height: 70, borderRadius: 8, overflow: 'hidden', background: '#faf7f2', border: '2px solid #c8b89a', outline: '1px solid #c8b89a', outlineOffset: -5 }}>
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ height: 5, width: '45%', background: '#5c4a2a', borderRadius: 2 }} />
          <div style={{ height: 3, width: '35%', background: '#8a7050', borderRadius: 2, opacity: 0.8, marginBottom: 2 }} />
          <div style={{ height: 1, width: '70%', background: '#c8b89a', marginBottom: 2 }} />
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ height: 2, width: `${70 - i * 10}%`, background: '#bbb', borderRadius: 2 }} />
          ))}
        </div>
      </div>
    );
  }

  if (id === 'pastel') {
    return (
      <div style={{ height: 70, borderRadius: 8, overflow: 'hidden', background: '#fce4ec' }}>
        <div style={{ height: 3, background: accent, borderRadius: '8px 8px 0 0' }} />
        <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 5, width: '42%', background: '#555', borderRadius: 6 }} />
          <div style={{ height: 3, width: '28%', background: accent, borderRadius: 6, opacity: 0.7, marginBottom: 3 }} />
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 2, width: `${80 - i * 8}%`, background: '#e0a0b0', borderRadius: 6 }} />
          ))}
        </div>
      </div>
    );
  }

  // Default: minimal, nordic, elegant, compact, academic and any others
  const bgColor = preview.includes('faf7f2') ? '#faf7f2' : preview.includes('fce4ec') ? '#fce4ec' : '#f8f9fa';
  return (
    <div style={{ height: 70, borderRadius: 8, overflow: 'hidden', background: bgColor }}>
      <div style={{ height: 3, background: accent }} />
      <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ height: 5, width: '42%', background: '#555', borderRadius: 2 }} />
        <div style={{ height: 3, width: '28%', background: accent, borderRadius: 2, opacity: 0.7, marginBottom: 3 }} />
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ height: 2, width: `${80 - i * 8}%`, background: '#ccc', borderRadius: 2 }} />
        ))}
      </div>
    </div>
  );
}

const ACCENT_COLORS = [
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#FF3B30',
  '#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#00C7BE',
  '#1C1C1E', '#636366',
];

export default function TemplateSelector() {
  const { getActiveResume, setTemplate, setAccentColor } = useResumeStore();
  const resume = getActiveResume();

  if (!resume) return null;

  return (
    <div className="animate-fade-in">
      {/* Accent Color */}
      <div className="section-label" style={{ marginBottom: 10 }}>Akzentfarbe</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {ACCENT_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setAccentColor(resume.id, color)}
            title={color}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: color,
              border: resume.accentColor === color
                ? '3px solid #fff'
                : '2px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              transform: resume.accentColor === color ? 'scale(1.2)' : 'scale(1)',
              boxShadow: resume.accentColor === color
                ? `0 0 12px ${color}80`
                : 'none',
            }}
          />
        ))}

        {/* Custom color */}
        <label title="Eigene Farbe" style={{ position: 'relative', cursor: 'pointer' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'conic-gradient(red, yellow, green, blue, red)',
            border: '2px solid var(--text-muted)',
            cursor: 'pointer',
          }} />
          <input
            type="color"
            value={resume.accentColor}
            onChange={(e) => setAccentColor(resume.id, e.target.value)}
            style={{
              position: 'absolute', inset: 0, opacity: 0,
              width: '100%', height: '100%', cursor: 'pointer',
            }}
          />
        </label>
      </div>

      {/* Template Grid */}
      <div className="section-label" style={{ marginBottom: 12 }}>
        <Palette size={10} style={{ display: 'inline', marginRight: 4 }} />
        Template wählen
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        marginBottom: 24,
        paddingRight: 2,
      }}>
        {TEMPLATES.map((tmpl) => {
          const isSelected = resume.templateId === tmpl.id;
          return (
            <button
              key={tmpl.id}
              onClick={() => setTemplate(resume.id, tmpl.id as TemplateId)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                className="glass-card"
                style={{
                  padding: 12,
                  border: isSelected
                    ? `2px solid ${resume.accentColor}`
                    : '1px solid rgba(255,255,255,0.15)',
                  boxShadow: isSelected
                    ? `0 0 0 1px ${resume.accentColor}40, 0 8px 24px rgba(0,0,0,0.2)`
                    : 'var(--glass-shadow)',
                  transition: 'all 0.2s',
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  height: 80,
                  borderRadius: 8,
                  marginBottom: 10,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <TemplateThumbnail id={tmpl.id} preview={tmpl.preview} accent={resume.accentColor} />
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 20, height: 20, borderRadius: '50%',
                      background: resume.accentColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{tmpl.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.3 }}>
                  {tmpl.description}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {tmpl.tags.map((tag) => (
                    <span key={tag} className="badge" style={{ fontSize: 10 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}
