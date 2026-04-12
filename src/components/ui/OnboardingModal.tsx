import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, FileText, Sparkles, Share2, Bell, Wand2 } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import type { TemplateId } from '../../types/resume';
import { LogoIcon } from '../layout/Logo';
import { useIsMobile } from '../../hooks/useBreakpoint';

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
  { icon: <FileText size={16} />, color: 'var(--ios-blue)', title: 'Bewerbungsmappen', desc: 'Für jede Stelle eine eigene Mappe mit Lebenslauf und Anschreiben.' },
  { icon: <Sparkles size={16} />, color: '#FF9F0A', title: 'KI-Unterstützung', desc: 'Anschreiben generieren, Texte verbessern, automatisch übersetzen.' },
  { icon: <Share2 size={16} />, color: '#5856D6', title: 'Teilen & PDF-Export', desc: 'Als Link teilen oder als druckfertiges PDF herunterladen.' },
  { icon: <Bell size={16} />, color: 'var(--ios-green)', title: 'Deadline-Reminder', desc: 'Keine Frist verpassen — Erinnerungen per E-Mail.' },
];

const TEMPLATES: { id: string; label: string; bg: string; headerBg: string; accent: string; dark: boolean; sidebar: boolean }[] = [
  { id: 'minimal',   label: 'Minimal',   bg: '#f8f9fa', headerBg: '#ffffff', accent: '#007AFF', dark: false, sidebar: false },
  { id: 'modern',    label: 'Modern',    bg: '#1a1a2e', headerBg: '#16213e', accent: '#00b4d8', dark: true,  sidebar: true  },
  { id: 'corporate', label: 'Corporate', bg: '#1e3a5f', headerBg: '#1e3a5f', accent: '#f0c040', dark: true,  sidebar: false },
  { id: 'creative',  label: 'Creative',  bg: '#7209b7', headerBg: '#560bad', accent: '#f72585', dark: true,  sidebar: true  },
  { id: 'tech',      label: 'Tech',      bg: '#0d1117', headerBg: '#161b22', accent: '#58a6ff', dark: true,  sidebar: true  },
  { id: 'nordic',    label: 'Nordic',    bg: '#f0f4f8', headerBg: '#e2ecf3', accent: '#2b7a78', dark: false, sidebar: false },
];

const ACCENT_COLORS = ['#007AFF', '#5856D6', '#FF2D55', '#FF9F0A', '#34C759', '#7209b7'];

function buildSampleData(firstName: string, lastName: string) {
  const fn = firstName || 'Max';
  const ln = lastName || 'Mustermann';
  return {
    personalInfo: {
      firstName: fn, lastName: ln,
      title: 'Senior Softwareentwickler',
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@beispiel.ch`,
      phone: '+41 79 123 45 67',
      street: 'Musterstrasse 12',
      location: '8001 Zürich',
      website: `www.${ln.toLowerCase()}.ch`,
      linkedin: `linkedin.com/in/${fn.toLowerCase()}${ln.toLowerCase()}`,
      github: `github.com/${fn.toLowerCase()}${ln.toLowerCase()}`,
      summary: 'Erfahrener Softwareentwickler mit über 5 Jahren Erfahrung in der Entwicklung moderner Webanwendungen. Leidenschaft für sauberen Code, nutzerzentriertes Design und agile Teamarbeit.',
    },
    workExperience: [
      {
        id: 'sample-job-1',
        company: 'Tech Solutions AG', position: 'Senior Frontend Entwickler',
        location: 'Zürich', startDate: '2022-03', endDate: '', current: true,
        description: 'Entwicklung einer Enterprise SaaS-Plattform mit React und TypeScript. Leitung eines 4-köpfigen Frontend-Teams, Code Reviews und technisches Mentoring.',
        highlights: [],
      },
      {
        id: 'sample-job-2',
        company: 'Digital Agency GmbH', position: 'Frontend Entwickler',
        location: 'Basel', startDate: '2019-06', endDate: '2022-02', current: false,
        description: 'Umsetzung von Kundenprojekten in React und Vue.js. Optimierung der Core Web Vitals um 40 %.',
        highlights: [],
      },
    ],
    education: [
      {
        id: 'sample-edu-1',
        degree: 'Bachelor of Science', field: 'Informatik',
        institution: 'ETH Zürich', location: 'Zürich',
        startDate: '2015-09', endDate: '2019-06', grade: '5.4',
        description: 'Schwerpunkte: Software Engineering, verteilte Systeme.',
      },
    ],
    skills: [
      { id: 's1', name: 'React',      level: 5 as const, category: 'Frontend' },
      { id: 's2', name: 'TypeScript', level: 5 as const, category: 'Frontend' },
      { id: 's3', name: 'Node.js',    level: 4 as const, category: 'Backend'  },
      { id: 's4', name: 'PostgreSQL', level: 3 as const, category: 'Backend'  },
      { id: 's5', name: 'Docker',     level: 3 as const, category: 'DevOps'   },
      { id: 's6', name: 'Git',        level: 5 as const, category: 'Tools'    },
    ],
    languages: [
      { id: 'l1', name: 'Deutsch',    level: 'Muttersprache'  as const },
      { id: 'l2', name: 'Englisch',   level: 'Fließend'       as const },
      { id: 'l3', name: 'Französisch',level: 'Grundkenntnisse'as const },
    ],
  };
}

/** Realistic mini CV card used in the welcome screen */
function MiniCvCard() {
  return (
    <div style={{
      width: 130, flexShrink: 0,
      background: '#fff', borderRadius: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2)',
      overflow: 'hidden', fontSize: 0,
      animation: 'floatCard 4s ease-in-out infinite',
    }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)', padding: '10px 10px 8px' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', marginBottom: 5 }} />
        <div style={{ height: 5, width: '80%', background: 'rgba(255,255,255,0.85)', borderRadius: 2, marginBottom: 3 }} />
        <div style={{ height: 3, width: '55%', background: 'rgba(255,255,255,0.5)', borderRadius: 2 }} />
      </div>
      {/* Body */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Section label */}
        <div style={{ height: 2, width: '50%', background: '#007AFF', borderRadius: 1 }} />
        {[70, 85, 60].map((w, i) => (
          <div key={i} style={{ height: 2.5, width: `${w}%`, background: '#e5e7eb', borderRadius: 1 }} />
        ))}
        {/* Section 2 */}
        <div style={{ height: 2, width: '45%', background: '#007AFF', borderRadius: 1, marginTop: 2 }} />
        {[75, 65].map((w, i) => (
          <div key={i} style={{ height: 2.5, width: `${w}%`, background: '#e5e7eb', borderRadius: 1 }} />
        ))}
        {/* Skills row */}
        <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
          {[30, 36, 28].map((w, i) => (
            <div key={i} style={{ height: 7, width: w, background: 'rgba(0,122,255,0.15)', borderRadius: 2, border: '1px solid rgba(0,122,255,0.25)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Template thumbnail for the picker — shows a realistic mini CV layout */
function TemplateThumbnail({ t, selected, accent }: {
  t: typeof TEMPLATES[number];
  selected: boolean;
  accent: string;
}) {
  const lineColor = t.dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';
  const textColor = t.dark ? 'rgba(255,255,255,0.7)'  : 'rgba(0,0,0,0.45)';
  return (
    <div style={{
      width: '100%', height: 72, borderRadius: 8, overflow: 'hidden',
      background: t.bg,
      border: selected ? `2px solid var(--ios-blue)` : '2px solid rgba(255,255,255,0.08)',
      boxShadow: selected ? '0 0 0 3px rgba(0,122,255,0.25)' : 'none',
      transition: 'all 0.2s', position: 'relative', cursor: 'pointer',
    }}>
      {/* Header strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 22,
        background: t.sidebar
          ? `linear-gradient(135deg, ${accent}bb, ${accent}66)`
          : t.headerBg,
        borderBottom: `1px solid ${accent}44`,
        display: 'flex', alignItems: 'center', gap: 5, padding: '0 7px',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.dark ? 'rgba(255,255,255,0.4)' : `${accent}66`, flexShrink: 0 }} />
        <div>
          <div style={{ height: 2.5, width: 30, background: t.dark ? 'rgba(255,255,255,0.7)' : '#333', borderRadius: 1, marginBottom: 2 }} />
          <div style={{ height: 1.5, width: 22, background: textColor, borderRadius: 1 }} />
        </div>
      </div>
      {/* Body */}
      <div style={{ position: 'absolute', top: 24, left: 0, right: 0, bottom: 0, display: 'flex' }}>
        {/* Optional sidebar */}
        {t.sidebar && (
          <div style={{ width: 28, background: `${accent}22`, borderRight: `1px solid ${accent}33`, padding: '4px 4px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[14, 18, 12, 16].map((w, i) => (
              <div key={i} style={{ height: 2, width: w, background: textColor, borderRadius: 1 }} />
            ))}
          </div>
        )}
        {/* Main content */}
        <div style={{ flex: 1, padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 1.5, width: '40%', background: accent, borderRadius: 1 }} />
          {[65, 80, 55, 70].map((w, i) => (
            <div key={i} style={{ height: 2, width: `${w}%`, background: lineColor, borderRadius: 1 }} />
          ))}
        </div>
      </div>
      {/* Selected checkmark */}
      {selected && (
        <div style={{
          position: 'absolute', top: 4, right: 4,
          width: 14, height: 14, borderRadius: '50%',
          background: 'var(--ios-blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={8} color="#fff" />
        </div>
      )}
    </div>
  );
}

interface Props { onClose: () => void }

export default function OnboardingModal({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('minimal');
  const [selectedAccent, setSelectedAccent] = useState<string>('#007AFF');
  const { addPerson, persons, updateResume } = useResumeStore();
  const navigate = useNavigate();
  const hasPersons = persons.length > 0;
  const isMobile = useIsMobile();

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    await addPerson(name.trim());
    setCreating(false);
    setStep(2);
  }

  function goNext() { setStep(hasPersons ? 2 : 1); }

  function applyTemplateSelection() {
    const { persons: p, resumes: r } = useResumeStore.getState();
    const resume = r.find(res => res.personId === p[0]?.id);
    if (resume) updateResume(resume.id, { templateId: selectedTemplate as TemplateId, accentColor: selectedAccent });
    setStep(3);
  }

  function finish(withSampleData: boolean) {
    markOnboardingDone();
    if (withSampleData) {
      const { persons: p, resumes: r } = useResumeStore.getState();
      const resume = r.find(res => res.personId === p[0]?.id);
      if (resume) {
        const parts = (name.trim() || p[0]?.name || '').split(' ');
        updateResume(resume.id, buildSampleData(parts[0] ?? '', (parts.slice(1).join(' ') || parts[0]) ?? ''));
      }
    }
    onClose();
    navigate('/editor');
  }

  function skip() { markOnboardingDone(); onClose(); }

  const progressPct = step === 1 ? 33 : step === 2 ? 66 : step === 3 ? 100 : 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(16px)',
      padding: '20px 16px',
    }}>
      <style>{`
        @keyframes floatCard {
          0%,100% { transform: translateY(0) rotate(-1deg); }
          50%      { transform: translateY(-8px) rotate(-1deg); }
        }
      `}</style>

      <div className="glass-card animate-scale-in" style={{
        width: '100%', maxWidth: 460,
        background: 'var(--modal-bg)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
        overflow: 'hidden',
      }}>

        {/* Progress bar (steps 1-3) */}
        {step > 0 && (
          <div style={{ height: 3, background: 'rgba(255,255,255,0.07)' }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #007AFF, #5856D6)',
              transition: 'width 0.4s cubic-bezier(0.34,1.2,0.64,1)',
            }} />
          </div>
        )}

        <div style={{ padding: isMobile ? '24px 18px' : '28px 28px' }}>

          {/* ── Step 0: Welcome ────────────────────────────────── */}
          {step === 0 && (
            <div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 24 }}>
                {/* Left: text */}
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 10 }}><LogoIcon size={44} /></div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
                    Willkommen bei PATH
                  </h1>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                    Dein persönlicher Bewerbungsassistent. In&nbsp;2&nbsp;Minuten eingerichtet.
                  </p>
                </div>
                {/* Right: mini CV card */}
                {!isMobile && <MiniCvCard />}
              </div>

              {/* Feature pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 24 }}>
                {[
                  { emoji: '📄', text: '15+ Vorlagen' },
                  { emoji: '✦', text: 'Claude AI' },
                  { emoji: '⬇', text: 'PDF-Export' },
                  { emoji: '🔗', text: 'Link teilen' },
                ].map(p => (
                  <div key={p.text} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500,
                  }}>
                    <span style={{ fontSize: 12 }}>{p.emoji}</span>
                    <span>{p.text}</span>
                  </div>
                ))}
              </div>

              <button className="btn-glass btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontWeight: 700, fontSize: 15, gap: 8 }}
                onClick={goNext}>
                Loslegen <ArrowRight size={16} />
              </button>
              <button onClick={skip} style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-sf)', width: '100%' }}>
                Überspringen
              </button>
            </div>
          )}

          {/* ── Step 1: Name ───────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ios-blue)', marginBottom: 6, letterSpacing: '0.06em' }}>SCHRITT 1 VON 3</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.4px' }}>Wie heisst du?</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Wir legen dein erstes Profil an.</p>
              </div>
              <input
                className="input-glass"
                placeholder="Vorname Nachname"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && name.trim() && handleCreate()}
                autoFocus maxLength={100}
                style={{ marginBottom: 14, fontSize: 15 }}
              />
              <button className="btn-glass btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontWeight: 700, gap: 8 }}
                disabled={!name.trim() || creating}
                onClick={handleCreate}>
                {creating ? 'Erstelle…' : <>Profil anlegen <ArrowRight size={15} /></>}
              </button>
              <button onClick={skip} style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-sf)', width: '100%' }}>
                Überspringen
              </button>
            </div>
          )}

          {/* ── Step 2: Template & Color ────────────────────────── */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ios-blue)', marginBottom: 6, letterSpacing: '0.06em' }}>SCHRITT 2 VON 3</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 5px', letterSpacing: '-0.4px' }}>Wähle dein Design</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Jederzeit änderbar im Editor.</p>
              </div>

              {/* Template grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
                  >
                    <TemplateThumbnail t={t} selected={selectedTemplate === t.id} accent={selectedAccent} />
                    <span style={{
                      fontSize: 11, fontWeight: selectedTemplate === t.id ? 600 : 400,
                      color: selectedTemplate === t.id ? 'var(--ios-blue)' : 'var(--text-secondary)',
                      transition: 'color 0.2s',
                    }}>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Accent colors */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Akzentfarbe
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {ACCENT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedAccent(color)}
                      style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: color, border: 'none', cursor: 'pointer', padding: 0,
                        boxShadow: selectedAccent === color
                          ? `0 0 0 2px var(--modal-bg), 0 0 0 4px ${color}`
                          : '0 0 0 2px rgba(255,255,255,0.1)',
                        transition: 'box-shadow 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {selectedAccent === color && <Check size={11} color="#fff" />}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn-glass btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontWeight: 700, gap: 8 }}
                onClick={applyTemplateSelection}>
                Weiter <ArrowRight size={15} />
              </button>
              <button onClick={() => setStep(3)} style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-sf)', width: '100%' }}>
                Überspringen
              </button>
            </div>
          )}

          {/* ── Step 3: Features + sample data ─────────────────── */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ios-blue)', marginBottom: 6, letterSpacing: '0.06em' }}>SCHRITT 3 VON 3</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 5px', letterSpacing: '-0.4px' }}>Bereit zum Starten</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  Alles eingerichtet — ein letzter Schritt.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {FEATURES.map(f => (
                  <div key={f.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: `${f.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color }}>
                      {f.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>{f.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sample data card */}
              <div style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <Wand2 size={13} style={{ color: 'var(--ios-blue)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Mit Beispieldaten starten</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                  Sieh sofort wie dein Lebenslauf aussieht — mit realistischen Musterdaten vorausgefüllt.
                </p>
                <button className="btn-glass btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px', fontWeight: 700, fontSize: 13, gap: 7 }}
                  onClick={() => finish(true)}>
                  <Wand2 size={13} /> Beispieldaten laden &amp; starten
                </button>
              </div>

              <button className="btn-glass" style={{ width: '100%', justifyContent: 'center', padding: '10px', gap: 7, fontSize: 13 }}
                onClick={() => finish(false)}>
                <Check size={13} /> Ohne Beispieldaten starten
              </button>

              <button onClick={skip} style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-sf)', width: '100%' }}>
                Schliessen
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
