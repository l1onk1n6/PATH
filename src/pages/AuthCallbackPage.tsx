import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { LogoIcon } from '../components/layout/Logo';
import { useAuthStore } from '../store/authStore';

type AuthType = 'signup' | 'magiclink' | 'recovery' | 'invite' | 'unknown';
type Status = 'loading' | 'success' | 'error';

const CONFIG: Record<AuthType, { icon: string; title: string; subtitle: string; successTitle: string; successSubtitle: string }> = {
  signup: {
    icon: '✉️',
    title: 'E-Mail wird bestätigt…',
    subtitle: 'Bitte warte einen Moment.',
    successTitle: 'E-Mail bestätigt!',
    successSubtitle: 'Dein Konto ist jetzt aktiv. Du wirst weitergeleitet…',
  },
  magiclink: {
    icon: '⚡',
    title: 'Anmeldung läuft…',
    subtitle: 'Du wirst gleich eingeloggt.',
    successTitle: 'Erfolgreich angemeldet!',
    successSubtitle: 'Du wirst zur App weitergeleitet…',
  },
  recovery: {
    icon: '🔐',
    title: 'Passwort-Reset wird vorbereitet…',
    subtitle: 'Bitte warte einen Moment.',
    successTitle: 'Bereit!',
    successSubtitle: 'Du kannst jetzt dein neues Passwort setzen.',
  },
  invite: {
    icon: '🎉',
    title: 'Einladung wird verarbeitet…',
    subtitle: 'Gleich kannst du dein Konto einrichten.',
    successTitle: 'Einladung angenommen!',
    successSubtitle: 'Du wirst weitergeleitet…',
  },
  unknown: {
    icon: '🔗',
    title: 'Wird verarbeitet…',
    subtitle: 'Bitte warte einen Moment.',
    successTitle: 'Fertig!',
    successSubtitle: 'Du wirst weitergeleitet…',
  },
};

export default function AuthCallbackPage({ authType }: { authType: AuthType }) {
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const { user, passwordRecovery, error } = useAuthStore();

  const cfg = CONFIG[authType];

  useEffect(() => {
    if (error) {
      setStatus('error');
      setErrorMsg(error);
      return;
    }
    if (authType === 'recovery' && passwordRecovery) {
      setStatus('success');
      return;
    }
    if (user && !passwordRecovery) {
      setStatus('success');
    }
  }, [user, passwordRecovery, error, authType]);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px',
    }}>
      <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: 380, padding: '36px 28px', textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <LogoIcon size={36} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '6px 0 0' }}>by pixmatic</p>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
            }}>
              {cfg.icon}
            </div>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--ios-blue)', marginBottom: 14 }} />
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.3px' }}>{cfg.title}</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{cfg.subtitle}</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
              background: 'rgba(52,199,89,0.12)', border: '1px solid rgba(52,199,89,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={36} style={{ color: '#34c759' }} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.3px' }}>{cfg.successTitle}</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{cfg.successSubtitle}</p>
            {authType === 'recovery' && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 16 }}>
                Das Formular zum Passwort setzen erscheint gleich…
              </p>
            )}
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
              background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <XCircle size={36} style={{ color: '#ff3b30' }} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.3px' }}>Fehler aufgetreten</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,59,48,0.8)', margin: '0 0 20px', lineHeight: 1.5 }}>
              {errorMsg || 'Der Link ist ungültig oder abgelaufen.'}
            </p>
            <button
              className="btn-glass"
              onClick={() => window.location.href = window.location.pathname}
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px' }}
            >
              Zurück zur Anmeldung
            </button>
          </>
        )}

      </div>
    </div>
  );
}
