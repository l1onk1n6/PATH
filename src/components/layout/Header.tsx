import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, Edit3, Download, Menu, Cloud, Loader } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';

interface Props {
  isMobile?: boolean;
  onMenuToggle?: () => void;
}

export default function Header({ isMobile, onMenuToggle }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { getActivePerson, getActiveResume, savePending, syncing } = useResumeStore();

  const person = getActivePerson();
  const resume = getActiveResume();

  const pageTitle: Record<string, string> = {
    '/': 'Dashboard',
    '/editor': 'Editor',
    '/preview': 'Vorschau',
    '/settings': 'Einstellungen',
  };

  const title = pageTitle[location.pathname] ?? 'Path';
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
        padding: isMobile ? '10px 14px' : '12px 20px',
        borderRadius: 'var(--radius-lg)',
        marginBottom: isMobile ? 10 : 16,
        flexShrink: 0,
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {/* Burger button — mobile only */}
        {isMobile && (
          <button
            className="btn-glass btn-icon"
            onClick={onMenuToggle}
            aria-label="Menü öffnen"
            style={{ padding: 8, flexShrink: 0, boxShadow: 'none' }}
          >
            <Menu size={18} />
          </button>
        )}

        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 17 : 20, fontWeight: 700, letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
            {title}
          </h1>
          {!isMobile && (
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        {/* Sync status — always visible when active */}
        {(savePending || syncing) ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
            {!isMobile && 'Speichert…'}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            <Cloud size={13} />
            {!isMobile && 'Gespeichert'}
          </div>
        )}

        {location.pathname === '/editor' && (
          <>
            <button className="btn-glass btn-sm" onClick={() => navigate('/preview')}>
              <Eye size={14} />
              {!isMobile && ' Vorschau'}
            </button>
          </>
        )}
        {location.pathname === '/preview' && (
          <>
            <button className="btn-glass btn-sm" onClick={() => navigate('/editor')}>
              <Edit3 size={14} />
              {!isMobile && ' Bearbeiten'}
            </button>
            <button className="btn-glass btn-primary btn-sm" onClick={() => navigate('/preview')}>
              <Download size={14} />
              {!isMobile && ' Exportieren'}
            </button>
          </>
        )}
        {location.pathname === '/' && (
          <button className="btn-glass btn-primary btn-sm" onClick={() => navigate('/editor')}>
            <Edit3 size={14} />
            {!isMobile && ' Öffnen'}
          </button>
        )}
      </div>
    </header>
  );
}
