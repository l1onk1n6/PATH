import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  User, Shield, Lock, Sparkles, Mail, ExternalLink,
  ChevronRight, AlertTriangle, Download, Trash2, KeyRound,
  CreditCard, Loader2, CheckCircle,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useResumeStore } from '../store/resumeStore';
import { usePlan, PRO_FEATURES, LIMITS } from '../lib/plan';
import { UpgradeModal } from '../components/ui/ProGate';
import { useIsMobile } from '../hooks/useBreakpoint';
import { getPdfExportCount } from '../lib/pdfExports';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

type Section = 'plan' | 'account' | 'security' | 'privacy';

const NAV: { id: Section; label: string; icon: React.ComponentType<{ size: number }> }[] = [
  { id: 'plan',     label: 'Plan & Features',    icon: Sparkles },
  { id: 'account',  label: 'Konto',               icon: User },
  { id: 'security', label: 'Sicherheit',           icon: Lock },
  { id: 'privacy',  label: 'Datenschutz',          icon: Shield },
];

// ── Section: Plan ──────────────────────────────────────────
function PlanSection() {
  const { isPro, plan, limits } = usePlan();
  const { persons, resumes } = useResumeStore();
  const { refreshUser, user } = useAuthStore();
  const location = useLocation();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const pdfCount = getPdfExportCount();
  const activeShareLinks = resumes.filter(r => r.shareToken).length;
  const isGift = user?.user_metadata?.gift_pro === true;

  // Detect Stripe success redirect + always refresh metadata on mount
  useEffect(() => {
    const isSuccess = location.search.includes('success=1') || location.hash.includes('success=1');
    if (isSuccess) {
      setShowSuccess(true);
      window.history.replaceState(null, '', window.location.pathname + window.location.hash.replace('?success=1', ''));
      // Webhook is async — poll until plan is updated (max 5 attempts, 2s apart)
      let attempts = 0;
      const poll = async () => {
        await refreshUser();
        attempts++;
        // useAuthStore state is updated by refreshUser; check via getState
        const { user: u } = useAuthStore.getState();
        if (u?.user_metadata?.plan !== 'pro' && attempts < 5) {
          setTimeout(poll, 2000);
        }
      };
      setTimeout(poll, 1500); // first check after 1.5s
    } else {
      refreshUser();
    }
  }, []);

  async function handlePortal() {
    if (!isSupabaseConfigured()) return;
    setPortalLoading(true);
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!error && data?.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* Payment success banner */}
      {showSuccess && (
        <div className="glass-card" style={{ padding: '14px 16px', border: '1px solid rgba(52,199,89,0.4)', background: 'rgba(52,199,89,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle size={18} style={{ color: 'var(--ios-green)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ios-green)' }}>Willkommen bei PATH Pro!</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Dein Upgrade war erfolgreich. Alle Pro-Features sind jetzt aktiv.</div>
          </div>
        </div>
      )}

      {/* Current plan card */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800,
                background: isPro
                  ? 'linear-gradient(135deg, rgba(255,159,10,0.3), rgba(255,55,95,0.25))'
                  : 'rgba(255,255,255,0.1)',
                border: isPro ? '1px solid rgba(255,159,10,0.5)' : '1px solid rgba(255,255,255,0.2)',
                color: isPro ? '#FF9F0A' : 'rgba(255,255,255,0.6)',
              }}>
                {isPro ? '✦ PRO' : 'FREE'}
              </span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              PATH {isPro ? 'Pro' : 'Free'}
              {isGift && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(52,199,89,0.15)', border: '1px solid rgba(52,199,89,0.3)', color: 'var(--ios-green)' }}>
                  Geschenkt ✦
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              {isPro ? 'Alle Features freigeschaltet' : 'Grundfunktionen — kostenlos'}
            </div>
          </div>
          {isPro && !isGift ? (
            <button
              className="btn-glass btn-sm"
              onClick={handlePortal}
              disabled={portalLoading}
              style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {portalLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <CreditCard size={12} />}
              Abo verwalten
            </button>
          ) : !isPro ? (
            <button
              className="btn-glass"
              onClick={() => setShowUpgrade(true)}
              style={{
                padding: '10px 18px', fontWeight: 700, fontSize: 13,
                background: 'linear-gradient(135deg, rgba(255,159,10,0.3), rgba(255,55,95,0.2))',
                border: '1px solid rgba(255,159,10,0.4)', color: '#FF9F0A',
              }}
            >
              <Sparkles size={14} /> Upgrade
            </button>
          ) : null}
        </div>

        <div className="divider" style={{ margin: '12px 0' }} />

        {/* Usage limits */}
        {[
          { label: 'Personen', used: persons.length, max: LIMITS[plan].persons },
          { label: 'Bewerbungsmappen', used: resumes.length, max: LIMITS[plan].resumes },
          { label: 'PDF-Exporte diesen Monat', used: pdfCount, max: LIMITS[plan].pdfExportsPerMonth },
          { label: 'Aktive Share-Links', used: activeShareLinks, max: LIMITS[plan].shareLinks },
          { label: 'Foto-Upload-Grösse', used: null, max: LIMITS[plan].photoMb, unit: 'MB' },
          { label: 'Eigene Sektionen / Mappe', used: null, max: LIMITS[plan].customSections },
          { label: 'Templates', used: null, max: LIMITS[plan].templates },
          { label: 'Dokumente gesamt', used: null, max: LIMITS[plan].documentsMb, unit: 'MB' },
          { label: 'CV-Versionshistorie', used: null, max: limits.versionHistory ? 1 : 0, isBoolean: true },
        ].map(({ label, used, max, unit, isBoolean }) => {
          const pct = used !== null ? used / max : 0;
          const color = pct >= 1 ? 'var(--ios-red)' : pct >= 0.8 ? '#FF9F0A' : 'var(--ios-green)';
          const maxDisplay = max === Infinity ? '∞' : `${max}${unit ? ' ' + unit : ''}`;

          if (isBoolean) {
            const enabled = limits.versionHistory;
            return (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: enabled ? 'var(--ios-green)' : 'rgba(255,255,255,0.3)' }}>
                    {enabled ? '✓ Aktiv' : '—'}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                <span style={{ fontWeight: 600, color: used !== null ? color : 'rgba(255,255,255,0.5)' }}>
                  {used !== null ? `${used} / ${maxDisplay}` : maxDisplay}
                </span>
              </div>
              {used !== null && max !== Infinity && (
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, pct * 100)}%`, borderRadius: 2, background: color, transition: 'width 0.3s' }} />
                </div>
              )}
            </div>
          );
        })}

        <div className="divider" style={{ margin: '12px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PRO_FEATURES.map((f) => {
            const status = !isPro ? 'locked' : f.available ? 'active' : 'soon';
            return (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 15, opacity: status === 'soon' ? 0.4 : 1 }}>{f.icon}</span>
                <span style={{ fontSize: 13, flex: 1, opacity: status === 'soon' ? 0.4 : 1 }}>{f.label}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                  background: status === 'active'
                    ? 'rgba(52,199,89,0.15)'
                    : status === 'soon'
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(255,159,10,0.12)',
                  border: status === 'active'
                    ? '1px solid rgba(52,199,89,0.3)'
                    : status === 'soon'
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(255,159,10,0.25)',
                  color: status === 'active'
                    ? 'var(--ios-green)'
                    : status === 'soon'
                    ? 'rgba(255,255,255,0.22)'
                    : '#FF9F0A',
                }}>
                  {status === 'active' ? '✓ Aktiv' : status === 'soon' ? 'Bald' : 'PRO'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Section: Account ───────────────────────────────────────
function AccountSection() {
  const { user } = useAuthStore();
  const { exportGdprData, persons, resumes } = useResumeStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, opacity: 0.6 }}>KONTO-DETAILS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>E-Mail</span>
            <span style={{ fontWeight: 500 }}>{user?.email ?? '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Personen</span>
            <span style={{ fontWeight: 500 }}>{persons.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Bewerbungsmappen</span>
            <span style={{ fontWeight: 500 }}>{resumes.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Mitglied seit</span>
            <span style={{ fontWeight: 500 }}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' }) : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, opacity: 0.6 }}>DATEN-EXPORT (DSGVO Art. 20)</div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
          Lade alle deine Daten als JSON-Datei herunter. Dokumentenanhänge (Base64) werden aus Datenschutzgründen nicht mitexportiert.
        </p>
        <button className="btn-glass btn-sm" onClick={exportGdprData} style={{ gap: 6 }}>
          <Download size={13} /> Daten herunterladen
        </button>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, opacity: 0.6 }}>SUPPORT</div>
        <a href="mailto:info@pixmatic.ch" className="btn-glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontSize: 13, padding: '8px 14px' }}>
          <Mail size={13} /> info@pixmatic.ch
        </a>
      </div>
    </div>
  );
}

// ── Section: Security ──────────────────────────────────────
function SecuritySection() {
  const { sendPasswordReset, user, loading } = useAuthStore();
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!user?.email) return;
    await sendPasswordReset(user.email);
    setSent(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, opacity: 0.6 }}>PASSWORT</div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
          Wir senden einen Link an {user?.email} zum Zurücksetzen des Passworts.
        </p>
        {sent ? (
          <div style={{ fontSize: 13, color: 'var(--ios-green)', display: 'flex', alignItems: 'center', gap: 6 }}>
            ✓ E-Mail gesendet — bitte prüfe dein Postfach.
          </div>
        ) : (
          <button className="btn-glass btn-sm" onClick={handleReset} disabled={loading} style={{ gap: 6 }}>
            <KeyRound size={13} /> Passwort zurücksetzen
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, opacity: 0.6 }}>AKTIVE SITZUNG</div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          Du bist aktuell mit <strong>{user?.email}</strong> angemeldet. Alle Daten sind verschlüsselt in der Schweizer Supabase-Region gespeichert.
        </p>
      </div>
    </div>
  );
}

// ── Section: Privacy ───────────────────────────────────────
function PrivacySection() {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, opacity: 0.6 }}>RECHTLICHES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Datenschutzerklärung', href: 'https://pixmatic.ch/datenschutz' },
            { label: 'AGB', href: 'https://pixmatic.ch/agb' },
          ].map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className="btn-glass"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', textDecoration: 'none', fontSize: 13 }}>
              {label}
              <ExternalLink size={13} style={{ opacity: 0.5 }} />
            </a>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, opacity: 0.6 }}>DATENVERARBEITUNG</div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
          <li>Deine Daten werden ausschliesslich für die App-Funktionalität verwendet</li>
          <li>Keine Weitergabe an Dritte</li>
          <li>Speicherung auf Supabase-Servern (EU/Schweiz)</li>
          <li>Passwörter werden gehasht gespeichert (bcrypt)</li>
          <li>Datenexport jederzeit möglich (DSGVO Art. 20)</li>
        </ul>
      </div>

      <div className="glass-card" style={{ padding: 20, border: '1px solid rgba(255,59,48,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--ios-red)', opacity: 0.9 }}>
          <AlertTriangle size={13} /> GEFAHRENZONE
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>
          Zum Löschen deines Kontos kontaktiere uns bitte direkt — wir entfernen alle Daten innerhalb von 30 Tagen.
        </p>
        <a
          href="mailto:info@pixmatic.ch?subject=Konto löschen – PATH"
          className="btn-glass btn-danger"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontSize: 13, padding: '8px 14px' }}
        >
          <Trash2 size={13} /> Konto löschen anfragen
        </a>
      </div>
    </div>
  );
}

// ── Main Account Page ──────────────────────────────────────
export default function AccountPage() {
  const [section, setSection] = useState<Section>('plan');
  const isMobile = useIsMobile();

  const renderSection = () => {
    switch (section) {
      case 'plan':     return <PlanSection />;
      case 'account':  return <AccountSection />;
      case 'security': return <SecuritySection />;
      case 'privacy':  return <PrivacySection />;
    }
  };

  const current = NAV.find(n => n.id === section);

  if (isMobile) {
    return (
      <div className="animate-fade-in" style={{ height: '100%', overflow: 'auto' }}>
        {/* Mobile tab bar */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: 6, paddingBottom: 8, flexShrink: 0, scrollbarWidth: 'none' }}>
          {NAV.map(({ id, label, icon: Icon }) => {
            const isActive = section === id;
            return (
              <button key={id} className="btn-glass btn-nav" onClick={() => setSection(id)}
                style={{ flexShrink: 0, padding: '8px 12px', borderRadius: 'var(--radius-sm)', boxShadow: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
                  background: isActive ? 'linear-gradient(135deg, rgba(0,122,255,0.3), rgba(88,86,214,0.25))' : 'rgba(255,255,255,0.07)',
                  border: isActive ? '1px solid rgba(0,122,255,0.45)' : '1px solid rgba(255,255,255,0.1)',
                }}>
                <Icon size={13} />
                <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400 }}>{label}</span>
              </button>
            );
          })}
        </div>
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '16px', overflow: 'auto' }}>
          {renderSection()}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: 16, height: '100%', overflow: 'hidden' }}>
      {/* Sidebar nav */}
      <aside style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = section === id;
          return (
            <button key={id} className="btn-glass btn-nav" onClick={() => setSection(id)}
              style={{ justifyContent: 'space-between', padding: '10px 12px', borderRadius: 'var(--radius-sm)', boxShadow: 'none',
                background: isActive ? 'linear-gradient(135deg, rgba(0,122,255,0.25), rgba(88,86,214,0.2))' : 'rgba(255,255,255,0.05)',
                border: isActive ? '1px solid rgba(0,122,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={14} />
                <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400 }}>{label}</span>
              </div>
              {isActive && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
            </button>
          );
        })}
      </aside>

      {/* Content */}
      <div className="glass" style={{ flex: 1, borderRadius: 'var(--radius-lg)', overflow: 'auto', padding: '20px 22px' }}>
        <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {current && (
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,122,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <current.icon size={15} />
              </div>
            )}
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{current?.label}</h2>
          </div>
        </div>
        {renderSection()}
      </div>
    </div>
  );
}
