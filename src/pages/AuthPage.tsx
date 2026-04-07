import { useState, useRef, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { LogoIcon } from '../components/layout/Logo';
import {
  passwordStrength, STRENGTH_LABEL, STRENGTH_COLOR, RateLimiter,
} from '../lib/security';

const limiter = new RateLimiter(5, 30_000);

export default function AuthPage({ onSetup }: { onSetup: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [logoTaps, setLogoTaps] = useState(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleLogoTap() {
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    if (next >= 5) { setLogoTaps(0); onSetup(); return; }
    logoTapTimer.current = setTimeout(() => setLogoTaps(0), 2000);
  }
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { signIn, signUp, loading, error, clearError } = useAuthStore();

  // Countdown tick while locked
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    if (limiter.isLocked()) return;

    if (mode === 'register' && password.length < 8) return;

    if (mode === 'login') {
      await signIn(email, password);
      // Record failure if error appears after the call
      setTimeout(() => {
        if (useAuthStore.getState().error) {
          limiter.recordFailure();
          if (limiter.isLocked()) setCooldown(limiter.secondsRemaining());
        } else {
          limiter.reset();
        }
      }, 0);
    } else {
      await signUp(email, password, name);
    }
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: 420, padding: 36 }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div
            style={{ marginBottom: 14, cursor: 'default', userSelect: 'none' }}
            onClick={handleLogoTap}
          >
            <LogoIcon size={52} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.4px' }}>Path</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0, fontWeight: 400 }}>by pixmatic</p>
        </div>

        {/* Tab */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)',
          padding: 3, marginBottom: 24,
        }}>
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); clearError(); setPassword(''); }}
              className="btn-glass"
              style={{
                flex: 1, borderRadius: 'var(--radius-full)', padding: '8px 0', boxShadow: 'none',
                background: mode === m ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: 'none', fontSize: 14, fontWeight: mode === m ? 600 : 400,
              }}
            >
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
            <input
              className="input-glass"
              type="email"
              placeholder="max@beispiel.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus={mode === 'login'}
              autoComplete={mode === 'login' ? 'username' : 'email'}
            />
          </div>

          <div style={{ marginBottom: strength ? 8 : 24, position: 'relative' }}>
            <label className="section-label"><Lock size={9} style={{ display: 'inline', marginRight: 3 }} />Passwort</label>
            <input
              className="input-glass"
              type={showPw ? 'text' : 'password'}
              placeholder={mode === 'register' ? 'Mindestens 8 Zeichen' : 'Passwort eingeben'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'register' ? 8 : 1}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{ paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute', right: 12, bottom: 10, background: 'none', border: 'none',
                cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0,
              }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Password strength meter (register only) */}
          {strength && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%',
                  background: STRENGTH_COLOR[strength],
                  transition: 'width 0.3s, background 0.3s',
                }} />
              </div>
              <span style={{ fontSize: 11, color: STRENGTH_COLOR[strength] }}>
                Passwortstärke: {STRENGTH_LABEL[strength]}
              </span>
            </div>
          )}

          {/* Rate-limit lockout banner */}
          {isLocked && (
            <div style={{
              background: 'rgba(255,149,0,0.15)', border: '1px solid rgba(255,149,0,0.35)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16,
              fontSize: 13, color: '#ff9500', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <ShieldAlert size={15} />
              Zu viele Versuche. Bitte warte {cooldown} Sekunden.
            </div>
          )}

          {error && !isLocked && (
            <div style={{
              background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16,
              fontSize: 13, color: '#ff6b6b',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-glass btn-primary"
            disabled={loading || isLocked || (mode === 'register' && password.length < 8)}
            style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', opacity: (loading || isLocked) ? 0.7 : 1 }}
          >
            {loading ? 'Bitte warten…' : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>

      </div>
    </div>
  );
}
