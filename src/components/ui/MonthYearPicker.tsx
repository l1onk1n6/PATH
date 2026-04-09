import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONTHS_FULL  = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

interface Props {
  value: string;          // YYYY-MM, YYYY, or ''
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
}

function parseValue(value: string) {
  if (!value) return null;
  if (!value.includes('-')) return { year: parseInt(value), month: null };
  return { year: parseInt(value.slice(0, 4)), month: parseInt(value.slice(5, 7)) - 1 };
}

function displayValue(value: string): string {
  if (!value) return '';
  const p = parseValue(value);
  if (!p) return '';
  if (p.month === null) return String(p.year);
  return `${MONTHS_FULL[p.month]} ${p.year}`;
}

export default function MonthYearPicker({ value, onChange, disabled, placeholder = 'Jahr (+ Monat optional)', style }: Props) {
  const [open, setOpen]         = useState(false);
  const [dropPos, setDropPos]   = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef              = useRef<HTMLButtonElement>(null);
  const dropRef                 = useRef<HTMLDivElement>(null);

  const parsed      = parseValue(value);
  const [viewYear, setViewYear] = useState(parsed?.year ?? new Date().getFullYear());
  const displayText = displayValue(value);

  useEffect(() => { if (parsed) setViewYear(parsed.year); }, [value]);

  function openDropdown() {
    if (disabled || !triggerRef.current) return;
    const r   = triggerRef.current.getBoundingClientRect();
    const dropH = 260;
    const top = r.bottom + dropH > window.innerHeight ? r.top - dropH - 4 : r.bottom + 4;
    setDropPos({ top, left: r.left, width: r.width });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function outside(e: MouseEvent) {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open]);

  function pickMonth(month: number) {
    onChange(`${viewYear}-${String(month + 1).padStart(2, '0')}`);
    setOpen(false);
  }

  function pickYearOnly() {
    onChange(String(viewYear));
    setOpen(false);
  }

  function pickNow() {
    const d = new Date();
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setOpen(false);
  }

  const dropdown = open && dropPos && createPortal(
    <div
      ref={dropRef}
      className="animate-scale-in"
      style={{
        position: 'fixed',
        top: dropPos.top,
        left: dropPos.left,
        width: dropPos.width,
        zIndex: 9999,
        background: 'var(--modal-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 14,
        padding: '10px 10px 8px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.65)',
      }}
    >
      {/* Year row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button type="button" onClick={() => setViewYear(y => y - 1)}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.07)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={14} />
        </button>
        <button type="button" onClick={pickYearOnly}
          title="Nur Jahr speichern"
          style={{
            fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px', color: 'var(--text-primary)',
            background: parsed?.month === null && parsed?.year === viewYear ? 'var(--ios-blue)' : 'none',
            border: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer',
            fontFamily: 'var(--font-sf)',
          }}>
          {viewYear}
        </button>
        <button type="button" onClick={() => setViewYear(y => y + 1)}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.07)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Year-only hint */}
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 8 }}>
        Jahr klicken = nur Jahr · Monat wählen = Monat + Jahr
      </div>

      {/* Month grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {MONTHS_SHORT.map((m, i) => {
          const sel = parsed?.month === i && parsed?.year === viewYear;
          return (
            <button key={m} type="button" onClick={() => pickMonth(i)}
              style={{
                padding: '9px 0', fontSize: 12, fontWeight: sel ? 700 : 400,
                borderRadius: 9, border: sel ? 'none' : '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer', transition: 'all 0.12s',
                background: sel ? 'var(--ios-blue)' : 'rgba(255,255,255,0.05)',
                color: sel ? '#fff' : 'var(--text-secondary)',
                boxShadow: sel ? '0 2px 8px rgba(0,122,255,0.4)' : 'none',
                fontFamily: 'var(--font-sf)',
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
    </div>,
    document.body
  );

  return (
    <div style={{ position: 'relative', ...style }}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={openDropdown}
        className="input-glass"
        style={{
          width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <span style={{ color: displayText ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 14 }}>
          {displayText || placeholder}
        </span>
        <ChevronDown size={13} style={{ opacity: 0.45, flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {dropdown}
    </div>
  );
}
