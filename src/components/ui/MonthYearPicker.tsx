import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONTHS_FULL  = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

interface Props {
  value: string;          // YYYY-MM or ''
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function MonthYearPicker({ value, onChange, disabled, placeholder = 'Monat / Jahr', style }: Props) {
  const [open, setOpen]       = useState(false);
  const ref                   = useRef<HTMLDivElement>(null);
  const parsed                = value ? { year: parseInt(value.slice(0, 4)), month: parseInt(value.slice(5, 7)) - 1 } : null;
  const [viewYear, setViewYear] = useState(parsed?.year ?? new Date().getFullYear());

  // sync viewYear when value changes externally
  useEffect(() => { if (parsed) setViewYear(parsed.year); }, [value]);

  useEffect(() => {
    if (!open) return;
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open]);

  const displayText = parsed ? `${MONTHS_FULL[parsed.month]} ${parsed.year}` : '';

  function pick(month: number) {
    onChange(`${viewYear}-${String(month + 1).padStart(2, '0')}`);
    setOpen(false);
  }

  function pickNow() {
    const d = new Date();
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) { setOpen(o => !o); } }}
        className="input-glass"
        style={{
          width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <span style={{ color: displayText ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 14 }}>
          {displayText || placeholder}
        </span>
        <ChevronDown size={13} style={{ opacity: 0.45, flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="animate-scale-in"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 400,
            background: 'rgba(20,20,34,0.98)', backdropFilter: 'blur(24px)',
            borderRadius: 14, padding: '10px 10px 8px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Year row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button type="button" onClick={() => setViewYear(y => y - 1)}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.07)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>{viewYear}</span>
            <button type="button" onClick={() => setViewYear(y => y + 1)}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.07)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Month grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {MONTHS_SHORT.map((m, i) => {
              const sel = parsed?.month === i && parsed?.year === viewYear;
              return (
                <button key={m} type="button" onClick={() => pick(i)}
                  style={{
                    padding: '9px 0', fontSize: 12, fontWeight: sel ? 700 : 400,
                    borderRadius: 9, border: sel ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer', transition: 'all 0.12s',
                    background: sel ? 'var(--ios-blue)' : 'rgba(255,255,255,0.05)',
                    color: sel ? '#fff' : 'rgba(255,255,255,0.75)',
                    boxShadow: sel ? '0 2px 8px rgba(0,122,255,0.4)' : 'none',
                  }}>
                  {m}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button type="button"
              style={{ fontSize: 12, color: 'var(--ios-red)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px', fontFamily: 'var(--font-sf)' }}
              onClick={() => { onChange(''); setOpen(false); }}>
              Löschen
            </button>
            <button type="button"
              style={{ fontSize: 12, color: 'var(--ios-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px', fontFamily: 'var(--font-sf)' }}
              onClick={pickNow}>
              Aktueller Monat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
