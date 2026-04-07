import { useState } from 'react';
import { FileText, Mail, Lock, User, Eye, EyeOff, Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function AuthPage({ onSetup }: { onSetup: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);

  const { signIn, signUp, loading, error, clearError } = useAuthStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (mode === 'login') {
      await signIn(email, password);
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
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, var(--ios-blue), var(--ios-indigo))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,122,255,0.4)',
          }}>
            <FileText size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.4px' }}>AICV</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>Lebenslauf-Editor</p>
        </div>

        {/* Tab */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)',
          padding: 3, marginBottom: 24,
        }}>
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); clearError(); }}
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
            <input className="input-glass" type="email" placeholder="max@beispiel.de" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoFocus={mode === 'login'} />
          </div>

          <div style={{ marginBottom: 24, position: 'relative' }}>
            <label className="section-label"><Lock size={9} style={{ display: 'inline', marginRight: 3 }} />Passwort</label>
            <input
              className="input-glass"
              type={showPw ? 'text' : 'password'}
              placeholder="Mindestens 6 Zeichen"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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

          {error && (
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
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', opacity: loading ? 0.7 : 1 }}
          >
            {loading
              ? 'Bitte warten…'
              : mode === 'login' ? 'Anmelden' : 'Konto erstellen'
            }
          </button>
        </form>

        <div className="divider" style={{ margin: '20px 0' }} />

        <button
          className="btn-glass btn-sm"
          onClick={onSetup}
          style={{ width: '100%', justifyContent: 'center', fontSize: 12, opacity: 0.6 }}
        >
          <Settings size={12} /> Supabase neu konfigurieren
        </button>
      </div>
    </div>
  );
}
