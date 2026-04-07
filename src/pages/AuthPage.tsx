import { useState, useRef, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ShieldAlert, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { LogoIcon } from '../components/layout/Logo';
import { passwordStrength, STRENGTH_LABEL, STRENGTH_COLOR, RateLimiter } from '../lib/security';

const limiter = new RateLimiter(5, 30_000);

type Mode = 'login' | 'register' | 'forgot' | 'reset';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resetSent, setResetSent] = useState(false);
  const [pwMismatch, setPwMismatch] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { signIn, signUp, sendPasswordReset, updatePassword, loading, error, clearError, passwordRecovery } = useAuthStore();

  // Switch to reset mode when coming from password recovery email
  useEffect(() => {
    if (passwordRecovery) setMode('reset');
  }, [passwordRecovery]);

  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      const secs = limiter.secondsRemaining();
      setCooldown(secs);
      if (secs <= 0 && cooldownRef.current) clearInterval(cooldownRef.current);
    }, 500);
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [cooldown]);

  const isLocked = limiter.isLocked();
  const strength = mode === 'register' && password.length > 0 ? passwordStrength(password) : null;

  function switchMode(m: Mode) {
    setMode(m);
    clearError();
    setPassword('');
    setConfirmPassword('');
    setResetSent(false);
    setPwMismatch(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setPwMismatch(false);

    if (mode === 'login') {
      if (limiter.isLocked()) return;
      await signIn(email, password);
      setTimeout(() => {
        if (useAuthStore.getState().error) {
          limiter.recordFailure();
          if (limiter.isLocked()) setCooldown(limiter.secondsRemaining());
        } else {
          limiter.reset();
        }
      }, 0);
    } else if (mode === 'register') {
      if (password.length < 8) return;
      await signUp(email, password, name);
    } else if (mode === 'forgot') {
      await sendPasswordReset(email);
      if (!useAuthStore.getState().error) setResetSent(true);
    } else if (mode === 'reset') {
      if (password !== confirmPassword) { setPwMismatch(true); return; }
      if (password.length < 8) return;
      await updatePassword(password);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px', boxSizing: 'border-box', overflow: 'auto',
    }}>
      <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: 380, padding: '24px 22px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ marginBottom: 8 }}><LogoIcon size={40} /></div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 2px', letterSpacing: '-0.4px' }}>Path</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>by pixmatic</p>
        </div>

        {/* ── Login / Register tabs ── */}
        {(mode === 'login' || mode === 'register') && (
          <>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)', padding: 3, marginBottom: 16 }}>
              {(['login', 'register'] as const).map((m) => (
                <button key={m} onClick={() => switchMode(m)} className="btn-glass" style={{
                  flex: 1, borderRadius: 'var(--radius-full)', padding: '8px 0', boxShadow: 'none',
                  background: mode === m ? 'rgba(255,255,255,0.12)' : 'transparent',
                  border: 'none', fontSize: 14, fontWeight: mode === m ? 600 : 400,
                }}>
                  {m === 'login' ? 'Anmelden' : 'Registrieren'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div style={{ marginBottom: 12 }}>
                  <label className="section-label"><User size={9} style={{ display: 'inline', marginRight: 3 }} />Name</label>
                  <input className="input-glass" placeholder="Max Mustermann" value={name}
                    onChange={(e) => setName(e.target.value)} required autoFocus />
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label className="section-label"><Mail size={9} style={{ display: 'inline', marginRight: 3 }} />E-Mail</label>
                <input className="input-glass" type="email" placeholder="max@beispiel.de" value={email}
                  onChange={(e) => setEmail(e.target.value)} required autoFocus={mode === 'login'}
                  autoComplete={mode === 'login' ? 'username' : 'email'} />
              </div>

              <div style={{ marginBottom: strength ? 6 : 8, position: 'relative' }}>
                <label className="section-label"><Lock size={9} style={{ display: 'inline', marginRight: 3 }} />Passwort</label>
                <input className="input-glass" type={showPw ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Mindestens 8 Zeichen' : 'Passwort eingeben'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required minLength={mode === 'register' ? 8 : 1}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={{ paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: 12, bottom: 10, background: 'none',
                  border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0,
                }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {strength && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%',
                      background: STRENGTH_COLOR[strength], transition: 'width 0.3s, background 0.3s',
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: STRENGTH_COLOR[strength] }}>Passwortstärke: {STRENGTH_LABEL[strength]}</span>
                </div>
              )}

              {/* Passwort vergessen – nur im Login-Modus */}
              {mode === 'login' && (
                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                  <button type="button" onClick={() => switchMode('forgot')} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: 0,
                  }}>
                    Passwort vergessen?
                  </button>
                </div>
              )}

              {!strength && mode !== 'login' && <div style={{ marginBottom: 16 }} />}

              {isLocked && (
                <div style={{ background: 'rgba(255,149,0,0.15)', border: '1px solid rgba(255,149,0,0.35)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ff9500', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={15} /> Zu viele Versuche. Bitte warte {cooldown} Sekunden.
                </div>
              )}

              {error && !isLocked && (
                <div style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ff6b6b' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-glass btn-primary"
                disabled={loading || isLocked || (mode === 'register' && password.length < 8)}
                style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', opacity: (loading || isLocked) ? 0.7 : 1 }}>
                {loading ? 'Bitte warten…' : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
              </button>
            </form>
          </>
        )}

        {/* ── Passwort vergessen ── */}
        {mode === 'forgot' && (
          <>
            <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: 13, padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Zurück zur Anmeldung
            </button>

            {resetSent ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <CheckCircle size={40} style={{ color: '#34c759', marginBottom: 12 }} />
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>E-Mail gesendet</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 20px' }}>
                  Wir haben dir einen Link zum Zurücksetzen deines Passworts geschickt. Bitte prüfe dein Postfach.
                </p>
                <button onClick={() => switchMode('login')} className="btn-glass" style={{ width: '100%', justifyContent: 'center', padding: '12px 20px' }}>
                  Zurück zur Anmeldung
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Passwort zurücksetzen</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 18px', lineHeight: 1.5 }}>
                  Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label className="section-label"><Mail size={9} style={{ display: 'inline', marginRight: 3 }} />E-Mail</label>
                  <input className="input-glass" type="email" placeholder="max@beispiel.de" value={email}
                    onChange={(e) => setEmail(e.target.value)} required autoFocus />
                </div>

                {error && (
                  <div style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ff6b6b' }}>
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-glass btn-primary" disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Wird gesendet…' : 'Reset-Link senden'}
                </button>
              </form>
            )}
          </>
        )}

        {/* ── Neues Passwort setzen (nach Klick auf Reset-Link) ── */}
        {mode === 'reset' && (
          <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Neues Passwort</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 18px', lineHeight: 1.5 }}>
              Wähle ein neues Passwort für dein Konto.
            </p>

            <div style={{ marginBottom: 12, position: 'relative' }}>
              <label className="section-label"><Lock size={9} style={{ display: 'inline', marginRight: 3 }} />Neues Passwort</label>
              <input className="input-glass" type={showPw ? 'text' : 'password'}
                placeholder="Mindestens 8 Zeichen" value={password}
                onChange={(e) => { setPassword(e.target.value); setPwMismatch(false); }}
                required minLength={8} autoFocus autoComplete="new-password" style={{ paddingRight: 42 }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{
                position: 'absolute', right: 12, bottom: 10, background: 'none',
                border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0,
              }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {password.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: passwordStrength(password) === 'weak' ? '33%' : passwordStrength(password) === 'medium' ? '66%' : '100%',
                    background: STRENGTH_COLOR[passwordStrength(password)], transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ fontSize: 11, color: STRENGTH_COLOR[passwordStrength(password)] }}>
                  Passwortstärke: {STRENGTH_LABEL[passwordStrength(password)]}
                </span>
              </div>
            )}

            <div style={{ marginBottom: 16, position: 'relative' }}>
              <label className="section-label"><Lock size={9} style={{ display: 'inline', marginRight: 3 }} />Passwort bestätigen</label>
              <input className="input-glass" type={showConfirmPw ? 'text' : 'password'}
                placeholder="Passwort wiederholen" value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPwMismatch(false); }}
                required autoComplete="new-password"
                style={{ paddingRight: 42, borderColor: pwMismatch ? 'rgba(255,59,48,0.6)' : undefined }} />
              <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} style={{
                position: 'absolute', right: 12, bottom: 10, background: 'none',
                border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0,
              }}>
                {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {pwMismatch && (
              <div style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ff6b6b' }}>
                Die Passwörter stimmen nicht überein.
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ff6b6b' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-glass btn-primary" disabled={loading || password.length < 8}
              style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Wird gespeichert…' : 'Passwort speichern'}
            </button>
          </form>
        )}

      </div>

      <footer style={{
        marginTop: 20,
        fontSize: 11,
        color: 'rgba(255,255,255,0.2)',
        userSelect: 'none',
      }}>
        by pixmatic · v1.3.0
      </footer>
    </div>
  );
}
