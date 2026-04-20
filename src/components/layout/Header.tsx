import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, Edit3, Menu, Sparkles } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { usePlan } from '../../lib/plan';
import { useState } from 'react';
import { UpgradeModal } from '../ui/ProGate';

interface Props {
  isMobile?: boolean;
  onMenuToggle?: () => void;
}

export default function Header({ isMobile, onMenuToggle }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { getActivePerson, getActiveResume } = useResumeStore();
  const { plan, isPro } = usePlan();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const person = getActivePerson();
  const resume = getActiveResume();

  const pageTitle: Record<string, string> = {
    '/': 'Dashboard',
    '/editor': 'Editor',
    '/preview': 'Vorschau',
    '/account': 'Konto',
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
        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
        <button
          onClick={() => !isPro && setShowUpgrade(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 20,
            fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', cursor: isPro ? 'default' : 'pointer',
            background: isPro
              ? 'linear-gradient(135deg, rgba(255,159,10,0.25), rgba(255,55,95,0.2))'
              : 'rgba(255,255,255,0.08)',
            border: isPro
              ? '1px solid rgba(255,159,10,0.4)'
              : '1px solid rgba(255,255,255,0.15)',
            color: isPro ? '#FF9F0A' : 'rgba(255,255,255,0.45)',
          }}
          title={isPro ? 'PATH Pro — alle Features aktiv' : 'Upgrade auf PATH Pro'}
        >
          {isPro && <Sparkles size={14} />}
          {isPro ? 'PRO' : plan.toUpperCase()}
        </button>

        {location.pathname === '/editor' && (
          <>
            <button className="btn-glass btn-sm" onClick={() => navigate('/preview')}>
              <Eye size={18} />
              {!isMobile && ' Vorschau'}
            </button>
          </>
        )}
        {location.pathname === '/preview' && (
          <button className="btn-glass btn-sm" onClick={() => navigate('/editor')}>
            <Edit3 size={18} />
            {!isMobile && ' Bearbeiten'}
          </button>
        )}
      </div>
    </header>
  );
}
