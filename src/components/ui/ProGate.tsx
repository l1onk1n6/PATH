import { useState } from 'react';
import { Lock, X, Sparkles, Mail } from 'lucide-react';
import { usePlan, PRO_FEATURES } from '../../lib/plan';

// ── Upgrade Modal ──────────────────────────────────────────
export function UpgradeModal({ onClose, highlightId }: { onClose: () => void; highlightId?: string }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card animate-scale-in"
        style={{ padding: '28px 24px', width: 380, maxWidth: '92vw', maxHeight: '85vh', overflow: 'auto' }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {PRO_FEATURES.map((f) => (
            <div
              key={f.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 10,
                background: f.id === highlightId ? 'rgba(255,159,10,0.12)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${f.id === highlightId ? 'rgba(255,159,10,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{f.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a
            href="mailto:info@pixmatic.ch?subject=PATH Pro Anfrage"
            className="btn-glass"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 20px', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 600,
              background: 'linear-gradient(135deg, rgba(255,159,10,0.3), rgba(255,55,95,0.25))',
              border: '1px solid rgba(255,159,10,0.4)',
            }}
          >
            <Mail size={14} /> Pro anfragen · info@pixmatic.ch
          </a>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            Demnächst verfügbar — frühzeitig anfragen für Early-Access
          </p>
        </div>
      </div>
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
        <div style={{ position: 'relative', display: 'inline-flex' }} onClick={() => setShowModal(true)}>
          <div style={{ opacity: 0.4, pointerEvents: 'none', filter: 'grayscale(0.5)' }}>{children}</div>
          <span style={{
            position: 'absolute', top: -6, right: -8,
            fontSize: 9, fontWeight: 800, letterSpacing: '0.05em',
            padding: '2px 5px', borderRadius: 4,
            background: 'linear-gradient(135deg, #FF9F0A, #FF375F)',
            color: '#fff', pointerEvents: 'none',
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
