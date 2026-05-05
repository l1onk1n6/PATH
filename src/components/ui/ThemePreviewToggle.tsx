import { useState, useEffect } from 'react';

/**
 * Temporaärer Theme-Toggle fuer den Design-Vergleich (Glass vs. Calm).
 * Wenn die Designentscheidung gefallen ist, kann diese Komponente
 * + die theme-calm-Block-Regeln in index.css + der Bootstrap in main.tsx
 * ersatzlos entfernt werden.
 */
export default function ThemePreviewToggle() {
  const [isCalm, setIsCalm] = useState(() => document.body.classList.contains('theme-calm'));

  useEffect(() => {
    document.body.classList.toggle('theme-calm', isCalm);
    localStorage.setItem('path-theme', isCalm ? 'calm' : 'glass');
  }, [isCalm]);

  return (
    <button
      onClick={() => setIsCalm(v => !v)}
      title="Design wechseln (Glass / Calm Dark)"
      style={{
        position: 'fixed',
        bottom: 14,
        right: 14,
        zIndex: 9999,
        padding: '8px 14px',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: 'rgba(255,255,255,0.85)',
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 999,
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        userSelect: 'none',
      }}
    >
      Theme: {isCalm ? 'Calm Dark' : 'Glass'} — klicken zum Wechseln
    </button>
  );
}
