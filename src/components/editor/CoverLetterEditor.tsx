import { useState } from 'react';
import { Link, Calendar, Sparkles, Bell, Loader2, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { usePlan } from '../../lib/plan';
import { generateCoverLetter, improveText } from '../../lib/ai';
import ProGate from '../ui/ProGate';
import { UpgradeModal } from '../ui/ProGate';

export default function CoverLetterEditor() {
  const { getActiveResume, updateCoverLetter, updateResume } = useResumeStore();
  const { isPro } = usePlan();
  const resume = getActiveResume();

  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiJobTitle, setAiJobTitle] = useState('');
  const [aiCompany, setAiCompany] = useState('');
  const [aiJobDesc, setAiJobDesc] = useState('');
  const [generatingCL, setGeneratingCL] = useState(false);
  const [improvingBody, setImprovingBody] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (!resume) return null;

  const cl = resume.coverLetter ?? { recipient: '', subject: '', body: '', closing: 'Mit freundlichen Grüssen' };

  function update(field: keyof typeof cl, value: string) {
    updateCoverLetter(resume!.id, { [field]: value });
  }

  const deadlineColor = (() => {
    if (!resume.deadline) return undefined;
    const diff = (new Date(resume.deadline).getTime() - Date.now()) / 86400000;
    if (diff < 0) return 'var(--ios-red)';
    if (diff <= 7) return 'var(--ios-yellow, #FF9F0A)';
    return 'var(--ios-green)';
  })();

  async function handleGenerateCL() {
    if (!isPro) { setShowUpgrade(true); return; }
    setGeneratingCL(true);
    const summary = resume!.personalInfo.summary ?? '';
    const experience = resume!.workExperience
      .slice(0, 3)
      .map(j => `${j.position} bei ${j.company}${j.description ? ': ' + j.description : ''}`)
      .join('\n');

    const result = await generateCoverLetter({
      jobTitle:       aiJobTitle || resume!.personalInfo.title,
      company:        aiCompany,
      jobDescription: aiJobDesc,
      summary,
      experience,
    });
    if (result) update('body', result);
    setGeneratingCL(false);
    setShowAiPanel(false);
  }

  async function handleImproveBody() {
    if (!isPro) { setShowUpgrade(true); return; }
    if (!cl.body.trim()) return;
    setImprovingBody(true);
    const result = await improveText(cl.body, `Bewerbung als ${resume!.personalInfo.title || 'Fachkraft'}`);
    if (result) update('body', result);
    setImprovingBody(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} highlightId="ai" />}

      {/* Job details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, marginBottom: 6, opacity: 0.7 }}>
            <Link size={11} /> Stellenausschreibung URL
          </label>
          <input
            className="input-glass"
            placeholder="https://jobs.beispiel.ch/stelle-xyz"
            value={resume.jobUrl ?? ''}
            onChange={(e) => updateResume(resume.id, { jobUrl: e.target.value })}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, marginBottom: 6, opacity: 0.7 }}>
            <Calendar size={11} /> Bewerbungsfrist
          </label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              className="input-glass"
              type="date"
              value={resume.deadline ?? ''}
              onChange={(e) => updateResume(resume.id, { deadline: e.target.value })}
              style={{ flex: 1, color: deadlineColor ?? undefined }}
            />
            <ProGate featureId="reminder" badge>
              <button className="btn-glass btn-icon" style={{ padding: 8 }} title="Deadline-Reminder">
                <Bell size={13} />
              </button>
            </ProGate>
          </div>
          {resume.deadline && deadlineColor === 'var(--ios-red)' && (
            <div style={{ fontSize: 11, color: 'var(--ios-red)', marginTop: 4 }}>Frist abgelaufen</div>
          )}
        </div>
      </div>

      <div className="divider" />

      {/* AI panel */}
      <div className="glass-card" style={{
        padding: 0, overflow: 'hidden',
        border: showAiPanel ? '1px solid rgba(255,159,10,0.35)' : '1px solid rgba(255,255,255,0.1)',
        background: showAiPanel ? 'rgba(255,159,10,0.04)' : 'rgba(255,255,255,0.04)',
      }}>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px',
            background: 'none', border: 'none', cursor: 'pointer', color: 'inherit',
          }}
          onClick={() => isPro ? setShowAiPanel(v => !v) : setShowUpgrade(true)}
        >
          <Sparkles size={14} style={{ color: isPro ? '#FF9F0A' : 'rgba(255,255,255,0.4)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, flex: 1, textAlign: 'left', color: isPro ? '#FF9F0A' : 'rgba(255,255,255,0.5)' }}>
            KI-Assistent — Anschreiben generieren
          </span>
          {!isPro && (
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'linear-gradient(135deg, #FF9F0A, #FF375F)', color: '#fff' }}>PRO</span>
          )}
          {isPro && (showAiPanel ? <ChevronUp size={14} style={{ opacity: 0.5 }} /> : <ChevronDown size={14} style={{ opacity: 0.5 }} />)}
        </button>

        {showAiPanel && (
          <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, opacity: 0.6, display: 'block', marginBottom: 4 }}>Stelle</label>
                <input className="input-glass" placeholder={resume.personalInfo.title || 'z.B. Software Engineer'} value={aiJobTitle}
                  onChange={e => setAiJobTitle(e.target.value)} style={{ width: '100%', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, opacity: 0.6, display: 'block', marginBottom: 4 }}>Unternehmen</label>
                <input className="input-glass" placeholder="z.B. Acme AG" value={aiCompany}
                  onChange={e => setAiCompany(e.target.value)} style={{ width: '100%', fontSize: 13 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, opacity: 0.6, display: 'block', marginBottom: 4 }}>
                Stellenbeschreibung (optional einfügen für bessere Ergebnisse)
              </label>
              <textarea className="input-glass" placeholder="Stellenbeschreibung hier einfügen…" value={aiJobDesc}
                onChange={e => setAiJobDesc(e.target.value)} rows={4}
                style={{ width: '100%', resize: 'vertical', fontSize: 13 }} />
            </div>
            <button
              className="btn-glass"
              onClick={handleGenerateCL}
              disabled={generatingCL}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 16px', background: generatingCL ? 'rgba(255,159,10,0.1)' : 'linear-gradient(135deg, rgba(255,159,10,0.3), rgba(255,55,95,0.2))',
                border: '1px solid rgba(255,159,10,0.4)', color: '#FF9F0A', fontWeight: 700, fontSize: 13,
              }}
            >
              {generatingCL
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Wird generiert…</>
                : <><Sparkles size={14} /> Anschreiben generieren</>}
            </button>
          </div>
        )}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, opacity: 0.7 }}>
          Empfänger / Adresse
        </label>
        <textarea
          className="input-glass"
          placeholder={"Muster AG\nHR-Abteilung\nMusterstrasse 1\n8000 Zürich"}
          value={cl.recipient}
          onChange={(e) => update('recipient', e.target.value)}
          rows={4}
          style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, opacity: 0.7 }}>
          Betreff
        </label>
        <input
          className="input-glass"
          placeholder="Bewerbung als Senior Developer – Ihre Ausschreibung vom 01.04.2026"
          value={cl.subject}
          onChange={(e) => update('subject', e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>Anschreiben-Text</label>
          <button
            className="btn-glass btn-sm"
            style={{ fontSize: 11, gap: 5, opacity: !isPro || !cl.body.trim() ? 0.45 : 1 }}
            onClick={handleImproveBody}
            disabled={improvingBody || !cl.body.trim()}
            title={!isPro ? 'Pro-Feature' : 'Text mit KI verbessern'}
          >
            {improvingBody
              ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Verbessert…</>
              : <><Wand2 size={11} /> Verbessern{!isPro && ' ✦'}</>}
          </button>
        </div>
        <textarea
          className="input-glass"
          placeholder={"Sehr geehrte Damen und Herren,\n\nmit grossem Interesse habe ich Ihre Stellenausschreibung gelesen...\n\nIch freue mich auf ein persönliches Gespräch."}
          value={cl.body}
          onChange={(e) => update('body', e.target.value)}
          rows={14}
          style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, opacity: 0.7 }}>
          Grussformel
        </label>
        <textarea
          className="input-glass"
          placeholder={"Mit freundlichen Grüssen\n\nMax Mustermann"}
          value={cl.closing}
          onChange={(e) => update('closing', e.target.value)}
          rows={3}
          style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
