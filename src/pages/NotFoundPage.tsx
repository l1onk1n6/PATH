import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 20, padding: 32, textAlign: 'center',
    }}>
      {/* Big emoji */}
      <div style={{ fontSize: 72, lineHeight: 1, userSelect: 'none' }}>📄</div>

      <div>
        <div style={{
          fontSize: 96, fontWeight: 800, letterSpacing: '-4px',
          color: 'rgba(255,255,255,0.07)', lineHeight: 1, marginBottom: 4,
        }}>
          404
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>
          Diese Seite hat sich wohl beworben — und wurde abgelehnt.
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: 320, lineHeight: 1.7 }}>
          Entweder fehlte das Anschreiben, der Lebenslauf war unvollständig,<br />
          oder die URL hat schlicht zu viel Berufserfahrung erfunden.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn-glass"
          onClick={() => history.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px' }}
          aria-label="Zurück navigieren"
        >
          <ArrowLeft size={14} /> Zurück
        </button>
        <button
          className="btn-glass btn-primary"
          onClick={() => { window.location.hash = '/'; }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px' }}
          aria-label="Zur Startseite"
        >
          <Home size={14} /> Bewerbung neu starten
        </button>
      </div>
    </div>
  );
}
