import { useState } from 'react';
import { Lock, X, Sparkles, Loader2 } from 'lucide-react';
import { usePlan, PRO_FEATURES } from '../../lib/plan';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase';

// ── Checkout helper ────────────────────────────────────────
async function startCheckout(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error || !data?.url) {
    console.error('Checkout error:', error ?? data);
    return null;
  }
  return data.url as string;
}

// ── Upgrade Modal ──────────────────────────────────────────
export function UpgradeModal({ onClose, highlightId }: { onClose: () => void; highlightId?: string }) {
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  async function handleUpgrade() {
    setLoading(true);
    setCheckoutError('');
    const url = await startCheckout();
    if (url) {
      window.location.href = url;
    } else {
      setCheckoutError('Fehler beim Starten des Checkouts. Bitte versuche es erneut oder kontaktiere uns.');
      setLoading(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card animate-scale-in"
        style={{
          padding: '28px 24px', width: 660, maxWidth: '92vw', maxHeight: '88vh', overflow: 'auto',
          background: 'rgba(16, 16, 26, 0.97)',
          backdropFilter: 'blur(32px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #FF9F0A, #FF375F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} style={{ color: '#fff' }} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>PATH Pro</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              Alle Funktionen für professionelle Bewerbungen
            </p>
          </div>
          <button className="btn-glass btn-icon" onClick={onClose} style={{ padding: 6, flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        {/* Feature list */}
        <div style={{ marginBottom: 24 }}>
          {/* Available now */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(52,199,89,0.8)', textTransform: 'uppercase', padding: '2px 4px', marginBottom: 8 }}>
            ✓ Jetzt verfügbar
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 6, marginBottom: 14 }}>
            {PRO_FEATURES.filter(f => f.available).map((f) => (
              <div key={f.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', borderRadius: 10,
                background: f.id === highlightId ? 'rgba(255,159,10,0.12)' : 'rgba(52,199,89,0.07)',
                border: `1px solid ${f.id === highlightId ? 'rgba(255,159,10,0.3)' : 'rgba(52,199,89,0.2)'}`,
              }}>
                <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.4 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{f.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Coming soon */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', padding: '2px 4px', marginBottom: 8 }}>
            ⏳ In Entwicklung
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 6 }}>
            {PRO_FEATURES.filter(f => !f.available).map((f) => (
              <div key={f.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', borderRadius: 10,
                background: f.id === highlightId ? 'rgba(255,159,10,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${f.id === highlightId ? 'rgba(255,159,10,0.3)' : 'rgba(255,255,255,0.07)'}`,
                opacity: 0.7,
              }}>
                <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.4 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{f.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="btn-glass"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 20px', borderRadius: 12, fontSize: 15, fontWeight: 700,
              background: loading
                ? 'rgba(255,159,10,0.15)'
                : 'linear-gradient(135deg, rgba(255,159,10,0.4), rgba(255,55,95,0.35))',
              border: '1px solid rgba(255,159,10,0.5)',
              color: '#fff', opacity: loading ? 0.8 : 1, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Weiterleitung zu Stripe…</>
              : <><Sparkles size={14} /> Jetzt upgraden — PATH Pro</>
            }
          </button>

          {checkoutError && (
            <p style={{ margin: 0, fontSize: 12, color: '#FF6B6B', textAlign: 'center' }}>
              {checkoutError}
            </p>
          )}

          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            Sichere Zahlung via Stripe · Jederzeit kündbar
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── ProGate — wraps Pro-only UI elements ──────────────────
interface ProGateProps {
  featureId: string;
  children: React.ReactNode;
  /** If true, shows a small inline "PRO" badge instead of overlaying */
  badge?: boolean;
}

export default function ProGate({ featureId, children, badge = false }: ProGateProps) {
  const { isPro } = usePlan();
  const [showModal, setShowModal] = useState(false);

  if (isPro) return <>{children}</>;

  if (badge) {
    return (
      <>
        {showModal && <UpgradeModal onClose={() => setShowModal(false)} highlightId={featureId} />}
        <div
          style={{ position: 'relative', display: 'inline-flex', marginRight: 6 }}
          onClick={() => setShowModal(true)}
          title="Pro-Feature"
        >
          <div style={{ opacity: 0.4, pointerEvents: 'none', filter: 'grayscale(0.5)' }}>{children}</div>
          <span style={{
            position: 'absolute', top: -5, right: -14,
            fontSize: 9, fontWeight: 800, letterSpacing: '0.04em',
            padding: '2px 4px', borderRadius: 3,
            background: 'linear-gradient(135deg, #FF9F0A, #FF375F)',
            color: '#fff', pointerEvents: 'none', whiteSpace: 'nowrap',
            zIndex: 1,
          }}>PRO</span>
        </div>
      </>
    );
  }

  return (
    <>
      {showModal && <UpgradeModal onClose={() => setShowModal(false)} highlightId={featureId} />}
      <div
        style={{ position: 'relative', cursor: 'pointer' }}
        onClick={() => setShowModal(true)}
        title="Pro-Feature — klicken für mehr Infos"
      >
        <div style={{ opacity: 0.35, pointerEvents: 'none', filter: 'grayscale(0.4)' }}>{children}</div>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, borderRadius: 'inherit',
          background: 'rgba(0,0,0,0.15)',
        }}>
          <Lock size={12} style={{ color: 'rgba(255,255,255,0.7)' }} />
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
            padding: '3px 7px', borderRadius: 6,
            background: 'linear-gradient(135deg, #FF9F0A, #FF375F)',
            color: '#fff',
          }}>PRO</span>
        </div>
      </div>
    </>
  );
}
