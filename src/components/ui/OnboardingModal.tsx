import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, FileText, Sparkles, Share2, Bell } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { LogoIcon } from '../layout/Logo';

const ONBOARDING_KEY = 'path_onboarding_done';

export function isOnboardingDone(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === '1';
}

export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_KEY);
  window.dispatchEvent(new CustomEvent('start-onboarding'));
}

export function markOnboardingDone() {
  localStorage.setItem(ONBOARDING_KEY, '1');
}

const FEATURES = [
  { icon: <FileText size={18} />, color: 'var(--ios-blue)', title: 'Bewerbungsmappen', desc: 'Erstelle für jede Stelle eine eigene Mappe mit Lebenslauf und Anschreiben.' },
  { icon: <Sparkles size={18} />, color: '#FF9F0A', title: 'KI-Unterstützung', desc: 'Lass dir Anschreiben generieren, Texte verbessern und in andere Sprachen übersetzen.' },
  { icon: <Share2 size={18} />, color: '#5856D6', title: 'Link teilen & Export', desc: 'Teile deinen Lebenslauf als Link oder exportiere ihn als professionelles PDF.' },
  { icon: <Bell size={18} />, color: 'var(--ios-green)', title: 'Deadline-Reminder', desc: 'Verpasse keine Bewerbungsfrist — erhalte Erinnerungen per E-Mail.' },
];

interface Props {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const { addPerson } = useResumeStore();
  const navigate = useNavigate();

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    await addPerson(name.trim());
    setCreating(false);
    setStep(2);
  }

  function finish() {
    markOnboardingDone();
    onClose();
    navigate('/editor');
  }

  function skip() {
    markOnboardingDone();
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)',
      padding: '20px 16px',
    }}>
      <div className="glass-card animate-scale-in" style={{
        width: '100%', maxWidth: 440, padding: '32px 28px',
        background: 'rgba(16,16,28,0.98)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      }}>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 16 }}><LogoIcon size={56} /></div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
              Willkommen bei PATH
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 28px', lineHeight: 1.6 }}>
              Dein persönlicher Bewerbungsassistent.<br />
              Lass uns in 2 Minuten alles einrichten.
            </p>
            <button className="btn-glass btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontWeight: 700, fontSize: 15, gap: 8 }}
              onClick={() => setStep(1)}>
              Loslegen <ArrowRight size={16} />
            </button>
            <button onClick={skip} style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'var(--font-sf)' }}>
              Überspringen
            </button>
          </div>
        )}

        {/* Step 1: Create person */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ios-blue)', marginBottom: 6 }}>SCHRITT 1 VON 2</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.4px' }}>Wie heisst du?</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                Wir legen dein erstes Profil an.
              </p>
            </div>
            <input
              className="input-glass"
              placeholder="Vorname Nachname"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && handleCreate()}
              autoFocus
              style={{ marginBottom: 16, fontSize: 15 }}
            />
            <button className="btn-glass btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontWeight: 700, gap: 8 }}
              disabled={!name.trim() || creating}
              onClick={handleCreate}>
              {creating ? 'Erstelle…' : <>Profil anlegen <ArrowRight size={15} /></>}
            </button>
          </div>
        )}

        {/* Step 2: Feature overview */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ios-blue)', marginBottom: 6 }}>SCHRITT 2 VON 2</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.4px' }}>Was PATH kann</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                Ein kurzer Überblick — du findest alles auch später wieder.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `${f.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: f.color,
                  }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-glass btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontWeight: 700, fontSize: 15, gap: 8 }}
              onClick={finish}>
              <Check size={16} /> Zum Editor
            </button>
          </div>
        )}

        {/* Progress dots */}
        {step > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                width: s === step ? 20 : 6, height: 6, borderRadius: 3,
                background: s === step ? 'var(--ios-blue)' : 'rgba(255,255,255,0.15)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
