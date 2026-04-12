import { Home, ArrowLeft } from 'lucide-react';
import { LogoIcon } from '../components/layout/Logo';
import { useAuthStore } from '../store/authStore';
import { useIsMobile } from '../hooks/useBreakpoint';

export default function NotFoundPage() {
  const { user } = useAuthStore();
  const isMobile = useIsMobile();

  const content = (
    <div style={{
      flex: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 20, padding: 32, textAlign: 'center',
    }}>
      <div style={{ fontSize: 72, lineHeight: 1, userSelect: 'none' }}>📄</div>

      <div>
        <div style={{
          fontSize: 96, fontWeight: 800, letterSpacing: '-4px',
          color: 'rgba(255,255,255,0.07)', lineHeight: 1, marginBottom: 4,
        }}>
          404
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>
          Seite nicht gefunden
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: 320, lineHeight: 1.7 }}>
          Diese Seite existiert nicht oder wurde verschoben.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn-glass"
          onClick={() => history.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px' }}
        >
          <ArrowLeft size={14} /> Zurück
        </button>
        <button
          className="btn-glass btn-primary"
          onClick={() => { window.location.hash = '/'; }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px' }}
        >
          <Home size={14} /> Zur Startseite
        </button>
      </div>
    </div>
  );

  // Inside AppShell (authenticated): no extra chrome needed
  if (user) {
    return <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>{content}</div>;
  }

  // Standalone (unauthenticated): render with nav + footer
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '14px 20px' : '16px 48px',
        background: 'rgba(8,15,30,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <LogoIcon size={30} />
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>PATH</span>
          {!isMobile && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: 'rgba(0,122,255,0.2)', border: '1px solid rgba(0,122,255,0.35)', color: 'var(--ios-blue)', marginLeft: 2 }}>
              by pixmatic
            </span>
          )}
        </a>
        <button
          onClick={() => { window.location.hash = '/'; }}
          style={{
            background: 'rgba(0,122,255,0.9)', border: 'none', cursor: 'pointer',
            color: '#fff', fontSize: isMobile ? 13 : 14, fontWeight: 600,
            padding: isMobile ? '8px 14px' : '9px 18px', borderRadius: 10,
          }}
        >
          {isMobile ? 'Starten' : 'Kostenlos starten'}
        </button>
      </nav>

      {content}

      {/* ── Footer ── */}
      <footer style={{
        padding: isMobile ? '28px 24px' : '36px 48px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoIcon size={22} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>PATH</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>by pixmatic</span>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              ['https://pixmatic.ch/datenschutz', 'Datenschutz'],
              ['https://pixmatic.ch/agb', 'AGB'],
              ['mailto:info@pixmatic.ch', 'Kontakt'],
            ].map(([href, label]) => (
              <a key={label} href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
                {label}
              </a>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            © {new Date().getFullYear()} pixmatic. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>

    </div>
  );
}
