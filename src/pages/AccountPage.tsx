import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Trash2, ChevronLeft, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { passwordStrength, STRENGTH_LABEL, STRENGTH_COLOR } from '../lib/security';

// ─── Subscription plan type (prepared for future use) ───────────────────────
export type Plan = 'free' | 'pro';

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, loading, error, updateName, updatePassword, deleteAccount, clearError } = useAuthStore();

  // Profil
  const currentName = (user?.user_metadata?.full_name as string) ?? '';
  const [name, setName] = useState(currentName);
  const [nameSaved, setNameSaved] = useState(false);

  // Passwort
  const [pw, setPw] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const strength = passwordStrength(pw);

  // Account löschen
  const [deletePhase, setDeletePhase] = useState<'idle' | 'confirm'>('idle');
  const [deleteInput, setDeleteInput] = useState('');

  async function handleSaveName() {
    if (!name.trim() || name === currentName) return;
    clearError();
    await updateName(name.trim());
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  }

  async function handleSavePassword() {
    if (pw.length < 8 || pw !== pwConfirm) return;
    clearError();
    await updatePassword(pw);
    setPw(''); setPwConfirm('');
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2500);
  }

  async function handleDeleteAccount() {
    if (deleteInput !== user?.email) return;
    await deleteAccount();
  }

  const pwMismatch = pwConfirm.length > 0 && pw !== pwConfirm;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 560, margin: '0 auto', padding: '0 4px 32px' }}>

      {/* Back */}
      <button
        className="btn-glass btn-sm"
        onClick={() => navigate('/')}
        style={{ marginBottom: 20, gap: 6, padding: '6px 12px', boxShadow: 'none' }}
      >
        <ChevronLeft size={14} /> Zurück
      </button>

      {/* Avatar + E-Mail Header */}
      <div className="glass-card" style={{ padding: '24px 24px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, var(--ios-blue), var(--ios-purple))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, color: '#fff',
        }}>
          {currentName ? currentName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() ?? '?')}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{currentName || 'Kein Name'}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {/* ── Profil ── */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <User size={14} style={{ color: 'var(--ios-blue)' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Profil</span>
        </div>

        <label className="section-label">Anzeigename</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input-glass"
            placeholder="Dein Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            style={{ flex: 1 }}
          />
          <button
            className="btn-glass btn-primary btn-sm"
            onClick={handleSaveName}
            disabled={loading || !name.trim() || name === currentName}
            style={{ flexShrink: 0, minWidth: 80 }}
          >
            {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : nameSaved ? <><Check size={13} /> Gespeichert</> : 'Speichern'}
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <label className="section-label">E-Mail-Adresse</label>
          <input className="input-glass" value={user?.email ?? ''} readOnly style={{ opacity: 0.6, cursor: 'default' }} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            E-Mail-Änderungen müssen per Link bestätigt werden — auf Anfrage möglich.
          </div>
        </div>
      </div>

      {/* ── Sicherheit ── */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Lock size={14} style={{ color: 'var(--ios-green)' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Sicherheit</span>
        </div>

        <label className="section-label">Neues Passwort</label>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            className="input-glass"
            type={showPw ? 'text' : 'password'}
            placeholder="Mindestens 8 Zeichen"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            style={{ paddingRight: 40 }}
          />
          <button
            onClick={() => setShowPw(v => !v)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0 }}
          >
            {showPw ? '🙈' : '👁'}
          </button>
        </div>

        {pw.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginBottom: 4 }}>
              <div style={{ height: '100%', borderRadius: 2, width: strength === 'strong' ? '100%' : strength === 'medium' ? '60%' : '25%', background: STRENGTH_COLOR[strength], transition: 'width 0.3s, background 0.3s' }} />
            </div>
            <div style={{ fontSize: 11, color: STRENGTH_COLOR[strength] }}>{STRENGTH_LABEL[strength]}</div>
          </div>
        )}

        <label className="section-label">Passwort bestätigen</label>
        <input
          className="input-glass"
          type={showPw ? 'text' : 'password'}
          placeholder="Passwort wiederholen"
          value={pwConfirm}
          onChange={(e) => setPwConfirm(e.target.value)}
          style={{ marginBottom: 8, borderColor: pwMismatch ? 'rgba(255,59,48,0.5)' : undefined }}
        />
        {pwMismatch && <div style={{ fontSize: 12, color: '#ff6b6b', marginBottom: 8 }}>Passwörter stimmen nicht überein.</div>}

        <button
          className="btn-glass btn-primary btn-sm"
          onClick={handleSavePassword}
          disabled={loading || pw.length < 8 || pw !== pwConfirm}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : pwSaved ? <><Check size={13} /> Passwort geändert</> : 'Passwort ändern'}
        </button>
      </div>

      {/* ── Konto löschen ── */}
      <div className="glass-card" style={{ padding: 20, border: '1px solid rgba(255,59,48,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <AlertTriangle size={14} style={{ color: 'var(--ios-red)' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Konto löschen</span>
        </div>

        {deletePhase === 'idle' ? (
          <>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 14px' }}>
              Dein Account und alle gespeicherten Daten werden unwiderruflich gelöscht.
            </p>
            <button
              className="btn-glass btn-danger btn-sm"
              onClick={() => setDeletePhase('confirm')}
              style={{ gap: 6 }}
            >
              <Trash2 size={13} /> Konto löschen
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 12px' }}>
              Gib deine E-Mail-Adresse ein um zu bestätigen:
            </p>
            <input
              className="input-glass"
              placeholder={user?.email}
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              style={{ marginBottom: 10, borderColor: 'rgba(255,59,48,0.4)' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-glass btn-sm"
                onClick={() => { setDeletePhase('idle'); setDeleteInput(''); }}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Abbrechen
              </button>
              <button
                className="btn-glass btn-danger btn-sm"
                onClick={handleDeleteAccount}
                disabled={deleteInput !== user?.email || loading}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : 'Endgültig löschen'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
