import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, FileText, Sparkles, Share2, Bell, Wand2 } from 'lucide-react';
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

const TEMPLATES = [
  { id: 'minimal',    label: 'Minimal',    bg: '#f8f9fa',  text: '#333',   dark: false },
  { id: 'modern',     label: 'Modern',     bg: '#1a1a2e',  text: '#fff',   dark: true  },
  { id: 'corporate',  label: 'Corporate',  bg: '#1e3a5f',  text: '#fff',   dark: true  },
  { id: 'creative',   label: 'Creative',   bg: '#7209b7',  text: '#fff',   dark: true  },
  { id: 'tech',       label: 'Tech',       bg: '#0d1117',  text: '#fff',   dark: true  },
  { id: 'nordic',     label: 'Nordic',     bg: '#f0f4f8',  text: '#333',   dark: false },
];

const ACCENT_COLORS = [
  '#007AFF', // ios blue
  '#5856D6', // indigo
  '#FF2D55', // red
  '#FF9F0A', // orange
  '#34C759', // green
  '#7209b7', // purple
];

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
      summary: 'Erfahrener Softwareentwickler mit über 5 Jahren Erfahrung in der Entwicklung moderner Webanwendungen. Leidenschaft für sauberen Code, nutzerzentriertes Design und agile Teamarbeit. Spezialisiert auf React, TypeScript und Node.js.',
    },
    workExperience: [
      {
        id: 'sample-job-1',
        company: 'Tech Solutions AG', position: 'Senior Frontend Entwickler',
        location: 'Zürich', startDate: '2022-03', endDate: '', current: true,
        description: 'Entwicklung und Wartung einer Enterprise SaaS-Plattform mit React und TypeScript. Leitung eines 4-köpfigen Frontend-Teams, Code Reviews und technisches Mentoring. Einführung von automatisierten Tests und Reduktion der Bug-Rate um 60 %.',
        highlights: [],
      },
      {
        id: 'sample-job-2',
        company: 'Digital Agency GmbH', position: 'Frontend Entwickler',
        location: 'Basel', startDate: '2019-06', endDate: '2022-02', current: false,
        description: 'Umsetzung von Kundenprojekten in React und Vue.js. Enge Zusammenarbeit mit UI/UX-Designern. Optimierung der Core Web Vitals und Verbesserung der PageSpeed-Scores um durchschnittlich 40 %.',
        highlights: [],
      },
    ],
    education: [
      {
        id: 'sample-edu-1',
        degree: 'Bachelor of Science', field: 'Informatik',
        institution: 'ETH Zürich', location: 'Zürich',
        startDate: '2015-09', endDate: '2019-06', grade: '5.4',
        description: 'Schwerpunkte: Software Engineering, verteilte Systeme und Mensch-Computer-Interaktion.',
      },
    ],
    skills: [
      { id: 's1', name: 'React', level: 5 as const, category: 'Frontend' },
      { id: 's2', name: 'TypeScript', level: 5 as const, category: 'Frontend' },
      { id: 's3', name: 'Node.js', level: 4 as const, category: 'Backend' },
      { id: 's4', name: 'PostgreSQL', level: 3 as const, category: 'Backend' },
      { id: 's5', name: 'Docker', level: 3 as const, category: 'DevOps' },
      { id: 's6', name: 'Git', level: 5 as const, category: 'Tools' },
    ],
    languages: [
      { id: 'l1', name: 'Deutsch', level: 'Muttersprache' as const },
      { id: 'l2', name: 'Englisch', level: 'Fließend' as const },
      { id: 'l3', name: 'Französisch', level: 'Grundkenntnisse' as const },
    ],
  };
}

interface Props {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('minimal');
  const [selectedAccent, setSelectedAccent] = useState<string>('#007AFF');
  const { addPerson, persons, updateResume } = useResumeStore();
  const navigate = useNavigate();
  const hasPersons = persons.length > 0;

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    await addPerson(name.trim());
    setCreating(false);
    setStep(2);
  }

  function goNext() {
    setStep(hasPersons ? 2 : 1);
  }

  function applyTemplateSelection() {
    const { persons: currentPersons, resumes: currentResumes } = useResumeStore.getState();
    const activePerson = currentPersons[0];
    if (activePerson) {
      const resume = currentResumes.find(r => r.personId === activePerson.id);
      if (resume) {
        updateResume(resume.id, { templateId: selectedTemplate, accentColor: selectedAccent });
      }
    }
    setStep(3);
  }

  function finish(withSampleData: boolean) {
    markOnboardingDone();
    if (withSampleData) {
      const { persons: currentPersons, resumes: currentResumes } = useResumeStore.getState();
      const activePerson = currentPersons[0];
      if (activePerson) {
        const resume = currentResumes.find(r => r.personId === activePerson.id);
        if (resume) {
          const nameParts = (name.trim() || activePerson.name).split(' ');
          const firstName = nameParts[0] ?? '';
          const lastName = nameParts.slice(1).join(' ') || firstName;
          updateResume(resume.id, buildSampleData(firstName, lastName));
        }
      }
    }
    onClose();
    navigate('/editor');
  }

  function skip() {
    markOnboardingDone();
    onClose();
  }

  // Total steps shown in progress dots: 1, 2, 3, 4 (steps > 0)
  const TOTAL_STEPS = 4;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)',
      padding: '20px 16px',
    }}>
      <div className="glass-card animate-scale-in" style={{
        width: '100%', maxWidth: 440, padding: '32px 28px',
        background: 'var(--modal-bg)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
      }}>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 16 }}><LogoIcon size={56} /></div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
              Willkommen bei PATH
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.6 }}>
              Dein persönlicher Bewerbungsassistent.<br />
              Lass uns in 2 Minuten alles einrichten.
            </p>

            {/* Feature teaser pills */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
              {[
                { emoji: '📄', text: 'Professionelle PDFs' },
                { emoji: '✦', text: 'KI-Assistent' },
                { emoji: '🔗', text: 'Link teilen' },
              ].map(pill => (
                <div key={pill.text} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 12, color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}>
                  <span style={{ fontSize: 13 }}>{pill.emoji}</span>
                  <span>{pill.text}</span>
                </div>
              ))}
            </div>

            <button className="btn-glass btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontWeight: 700, fontSize: 15, gap: 8 }}
              onClick={goNext}>
              Loslegen <ArrowRight size={16} />
            </button>
            <button onClick={skip} style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-sf)' }}>
              Überspringen
            </button>
          </div>
        )}

        {/* Step 1: Create person */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ios-blue)', marginBottom: 6 }}>SCHRITT 1 VON 4</div>
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
              style={{ marginBottom: 16, fontSize: 15 }}
            />
            <button className="btn-glass btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontWeight: 700, gap: 8 }}
              disabled={!name.trim() || creating}
              onClick={handleCreate}>
              {creating ? 'Erstelle…' : <>Profil anlegen <ArrowRight size={15} /></>}
            </button>
            <button onClick={skip} style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-sf)', width: '100%' }}>
              Überspringen
            </button>
          </div>
        )}

        {/* Step 2: Template & Color picker */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ios-blue)', marginBottom: 6 }}>SCHRITT 2 VON 4</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.4px' }}>Wähle dein Design</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                Du kannst das jederzeit in den Einstellungen ändern.
              </p>
            </div>

            {/* Template grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
              {TEMPLATES.map(t => {
                const isSelected = selectedTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    }}
                  >
                    {/* Preview box */}
                    <div style={{
                      width: '100%', height: 50,
                      borderRadius: 8,
                      background: t.bg,
                      border: isSelected
                        ? `2px solid var(--ios-blue)`
                        : '2px solid rgba(255,255,255,0.08)',
                      boxShadow: isSelected ? '0 0 0 3px rgba(0,122,255,0.25)' : 'none',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      {/* Minimal mock layout lines */}
                      <div style={{
                        position: 'absolute', top: 8, left: 8, right: 8,
                        height: 3, borderRadius: 2,
                        background: t.dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.2)',
                      }} />
                      <div style={{
                        position: 'absolute', top: 15, left: 8, width: '55%',
                        height: 2, borderRadius: 2,
                        background: t.dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
                      }} />
                      <div style={{
                        position: 'absolute', top: 21, left: 8, width: '40%',
                        height: 2, borderRadius: 2,
                        background: t.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                      }} />
                      <div style={{
                        position: 'absolute', bottom: 8, left: 8, right: 8,
                        height: 2, borderRadius: 2,
                        background: selectedAccent + '88',
                      }} />
                      {isSelected && (
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
                    <span style={{
                      fontSize: 11, fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? 'var(--ios-blue)' : 'var(--text-secondary)',
                      transition: 'color 0.2s',
                    }}>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Accent color swatches */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Akzentfarbe
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {ACCENT_COLORS.map(color => {
                  const isActive = selectedAccent === color;
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedAccent(color)}
                      style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: color, border: 'none', cursor: 'pointer', padding: 0,
                        boxShadow: isActive
                          ? `0 0 0 2px var(--modal-bg), 0 0 0 4px ${color}`
                          : '0 0 0 2px rgba(255,255,255,0.1)',
                        transition: 'box-shadow 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {isActive && <Check size={11} color="#fff" />}
                    </button>
                  );
                })}
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

        {/* Step 3: Features + sample data choice */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ios-blue)', marginBottom: 6 }}>SCHRITT 3 VON 4</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.4px' }}>Was PATH kann</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                Ein kurzer Überblick — du findest alles auch später wieder.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${f.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sample data card */}
            <div style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Wand2 size={13} style={{ color: 'var(--ios-blue)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Mit Beispieldaten starten</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                Sieh sofort wie dein Lebenslauf aussehen könnte — wir füllen ihn mit realistischen Musterdaten vor.
              </p>
              <button className="btn-glass btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontWeight: 700, fontSize: 13, gap: 7 }}
                onClick={() => finish(true)}>
                <Wand2 size={13} /> Beispieldaten laden & starten
              </button>
            </div>

            <button className="btn-glass" style={{ width: '100%', justifyContent: 'center', padding: '11px', gap: 7, fontSize: 13 }}
              onClick={() => finish(false)}>
              <Check size={13} /> Ohne Beispieldaten starten
            </button>

            <button onClick={skip} style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-sf)', width: '100%' }}>
              Schliessen
            </button>
          </div>
        )}

        {/* Progress dots (steps 1–4) */}
        {step > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
              <div key={s} style={{
                width: s === step ? 20 : 6,
                height: 6, borderRadius: 3,
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
