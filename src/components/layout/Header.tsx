import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, Edit3, Download, Save } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getActivePerson, getActiveResume } = useResumeStore();

  const person = getActivePerson();
  const resume = getActiveResume();

  const pageTitle: Record<string, string> = {
    '/': 'Dashboard',
    '/editor': 'Editor',
    '/preview': 'Vorschau',
    '/settings': 'Einstellungen',
  };

  const title = pageTitle[location.pathname] ?? 'AICV';
  const subtitle = person
    ? `${person.name}${resume?.personalInfo.title ? ` · ${resume.personalInfo.title}` : ''}`
    : 'Kein Profil ausgewählt';

  return (
    <header
      className="glass"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 16,
        flexShrink: 0,
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>{title}</h1>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{subtitle}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {location.pathname === '/editor' && (
          <>
            <button className="btn-glass btn-sm" onClick={() => navigate('/preview')}>
              <Eye size={14} /> Vorschau
            </button>
            <button className="btn-glass btn-success btn-sm" onClick={() => {}}>
              <Save size={14} /> Gespeichert
            </button>
          </>
        )}
        {location.pathname === '/preview' && (
          <>
            <button className="btn-glass btn-sm" onClick={() => navigate('/editor')}>
              <Edit3 size={14} /> Bearbeiten
            </button>
            <button className="btn-glass btn-primary btn-sm" onClick={() => window.print()}>
              <Download size={14} /> Exportieren
            </button>
          </>
        )}
        {location.pathname === '/' && (
          <button className="btn-glass btn-primary btn-sm" onClick={() => navigate('/editor')}>
            <Edit3 size={14} /> Öffnen
          </button>
        )}
      </div>
    </header>
  );
}
