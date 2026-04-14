import { useEffect, useState } from 'react';
import { Copy, CheckCircle, X, Zap } from 'lucide-react';
import { EARLY_BIRD, earlyBirdActive, earlyBirdCountdown } from '../../lib/earlyBird';

const DISMISS_KEY = 'path_earlybird_dismissed';

interface Props {
  /** 'top' = sticky bar above page content (Landing)
   *  'inline' = embedded callout inside a modal (UpgradeModal) */
  variant?: 'top' | 'inline';
}

export default function EarlyBirdBanner({ variant = 'top' }: Props) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cd, setCd] = useState(earlyBirdCountdown());

  useEffect(() => {
    if (!earlyBirdActive()) return;
    if (variant === 'top' && localStorage.getItem(DISMISS_KEY)) return;
    setVisible(true);

    const id = setInterval(() => {
      if (!earlyBirdActive()) { setVisible(false); clearInterval(id); return; }
      setCd(earlyBirdCountdown());
    }, 1000);
    return () => clearInterval(id);
  }, [variant]);

  if (!visible) return null;

  function copy() {
    navigator.clipboard.writeText(EARLY_BIRD.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function dismiss() {
    if (variant === 'top') localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  // ── Countdown label ──────────────────────────────────────
  const countdownLabel = cd.days > 1
    ? `Noch ${cd.days} Tage`
    : cd.days === 1
      ? `Noch 1 Tag ${cd.hours}h`
      : `Noch ${cd.hours}h ${cd.minutes}m`;

  // ── Inline variant (inside UpgradeModal) ─────────────────
  if (variant === 'inline') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'linear-gradient(135deg, rgba(255,159,10,0.12), rgba(255,55,95,0.08))',
        border: '1px solid rgba(255,159,10,0.3)',
        borderRadius: 10, padding: '10px 14px', marginBottom: 12,
      }}>
        <Zap size={14} style={{ color: '#FF9F0A', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#FF9F0A' }}>
            {EARLY_BIRD.label}: {EARLY_BIRD.discount}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 6 }}>
            · {countdownLabel}
          </span>
        </div>
        <button
          onClick={copy}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,159,10,0.18)', border: '1px solid rgba(255,159,10,0.4)',
            borderRadius: 7, padding: '4px 10px', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, color: '#FF9F0A', whiteSpace: 'nowrap', fontFamily: 'monospace',
          }}
        >
          {copied
            ? <><CheckCircle size={11} /> Kopiert</>
            : <><Copy size={11} /> {EARLY_BIRD.code}</>}
        </button>
      </div>
    );
  }

  // ── Top banner variant (Landing page) ───────────────────
  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(90deg, #FF9F0A 0%, #FF6B35 50%, #FF375F 100%)',
      padding: '9px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 10, flexWrap: 'wrap',
      zIndex: 99,
    }}>
      <Zap size={13} style={{ color: '#fff', flexShrink: 0 }} />

      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
        {EARLY_BIRD.label}: {EARLY_BIRD.discount}
      </span>

      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
        — {countdownLabel}
      </span>

      {/* Code pill */}
      <button
        onClick={copy}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
          fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '0.04em',
          fontFamily: 'monospace', whiteSpace: 'nowrap',
          transition: 'background 0.15s',
        }}
        title="Code kopieren"
      >
        {copied
          ? <><CheckCircle size={11} /> Kopiert!</>
          : <><Copy size={11} /> {EARLY_BIRD.code}</>}
      </button>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.7)', padding: 4, display: 'flex',
        }}
        title="Schliessen"
      >
        <X size={14} />
      </button>
    </div>
  );
}
