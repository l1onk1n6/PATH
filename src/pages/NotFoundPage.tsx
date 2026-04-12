import { Home, ArrowLeft } from 'lucide-react';
import { LogoIcon } from '../components/layout/Logo';

export default function NotFoundPage() {
  return (
    <div style={{
      height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, padding: 32, textAlign: 'center',
    }}>
      <LogoIcon size={40} />
      <div>
        <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-2px', color: 'rgba(255,255,255,0.12)', lineHeight: 1 }}>
          404
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '8px 0 8px' }}>Seite nicht gefunden</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: 280 }}>
          Diese Seite existiert nicht oder wurde verschoben.
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
          <Home size={14} /> Startseite
        </button>
      </div>
    </div>
  );
}
