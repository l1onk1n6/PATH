import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, Edit3, Menu, Sparkles, Cloud, CloudOff, Loader2, Check } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { usePlan } from '../../lib/plan';
import { useState, useEffect, useRef } from 'react';
import { UpgradeModal } from '../ui/ProGate';
import { displayPersonName } from '../../lib/displayName';
import { isSupabaseConfigured } from '../../lib/supabase';

interface Props {
  isMobile?: boolean;
  onMenuToggle?: () => void;
}

function SaveStatusPill({ isMobile }: { isMobile?: boolean }) {
  const savePending = useResumeStore(s => s.savePending);
  const syncing     = useResumeStore(s => s.syncing);
  const cloudOn     = isSupabaseConfigured();
  const [justSaved, setJustSaved] = useState(false);
  const prevPendingRef = useRef(savePending);

  // Flash "Gespeichert" for 1.6s after pending falls to false
  useEffect(() => {
    const prev = prevPendingRef.current;
    prevPendingRef.current = savePending;
    if (prev && !savePending) {
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 1600);
      return () => clearTimeout(t);
    }
  }, [savePending]);

  let Icon: typeof Cloud = Cloud;
  let text = 'Synchronisiert';
  let color = 'rgba(255,255,255,0.45)';
  let bg = 'transparent';
  let border = '1px solid transparent';

  if (!cloudOn) {
    Icon = CloudOff; text = 'Lokal'; color = 'rgba(255,255,255,0.4)';
  } else if (syncing) {
    Icon = Loader2; text = 'Synchronisiert…'; color = '#007AFF';
    bg = 'rgba(0,122,255,0.1)'; border = '1px solid rgba(0,122,255,0.25)';
  } else if (savePending) {
    Icon = Loader2; text = 'Speichert…'; color = '#FF9F0A';
    bg = 'rgba(255,159,10,0.1)'; border = '1px solid rgba(255,159,10,0.25)';
  } else if (justSaved) {
    Icon = Check; text = 'Gespeichert'; color = '#34C759';
    bg = 'rgba(52,199,89,0.12)'; border = '1px solid rgba(52,199,89,0.3)';
  }

  const spinning = Icon === Loader2;

  return (
    <div
      title={text}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: isMobile ? '5px 8px' : '6px 10px',
        borderRadius: 16, fontSize: 11, fontWeight: 600, color, background: bg, border,
        transition: 'all 0.25s ease',
        flexShrink: 0,
      }}
    >
      <Icon size={12} style={spinning ? { animation: 'spin 1s linear infinite' } : undefined} />
      {!isMobile && <span>{text}</span>}
    </div>
  );
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
    '/tracker': 'Bewerbungs-Tracker',
  };

  const title = pageTitle[location.pathname] ?? 'PATH';
  const personName = displayPersonName(person, resume);
  const subtitle = person
    ? `${personName}${resume?.personalInfo.title ? ` · ${resume.personalInfo.title}` : ''}`
    : 'Kein Profil ausgewählt';

  return (
    <header
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
        <SaveStatusPill isMobile={isMobile} />
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
