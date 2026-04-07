import { Link, Calendar, Sparkles, Bell } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import ProGate from '../ui/ProGate';

export default function CoverLetterEditor() {
  const { getActiveResume, updateCoverLetter, updateResume } = useResumeStore();
  const resume = getActiveResume();
  if (!resume) return null;

  const cl = resume.coverLetter ?? { recipient: '', subject: '', body: '', closing: 'Mit freundlichen Grüssen' };

  function update(field: keyof typeof cl, value: string) {
    updateCoverLetter(resume!.id, { [field]: value });
  }

  // Deadline color
  const deadlineColor = (() => {
    if (!resume.deadline) return undefined;
    const diff = (new Date(resume.deadline).getTime() - Date.now()) / 86400000;
    if (diff < 0) return 'var(--ios-red)';
    if (diff <= 7) return 'var(--ios-yellow, #FF9F0A)';
    return 'var(--ios-green)';
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

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
          <label style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>
            Anschreiben-Text
          </label>
          <ProGate featureId="ai" badge>
            <button className="btn-glass btn-sm" style={{ fontSize: 11, gap: 5 }}>
              <Sparkles size={11} /> KI generieren
            </button>
          </ProGate>
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
    </div>
  );
}
