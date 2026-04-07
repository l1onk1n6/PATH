import { useResumeStore } from '../../store/resumeStore';

export default function CoverLetterEditor() {
  const { getActiveResume, updateCoverLetter } = useResumeStore();
  const resume = getActiveResume();
  if (!resume) return null;

  const cl = resume.coverLetter ?? { recipient: '', subject: '', body: '', closing: 'Mit freundlichen Grüssen' };

  function update(field: keyof typeof cl, value: string) {
    updateCoverLetter(resume!.id, { [field]: value });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, opacity: 0.7 }}>
          Anschreiben-Text
        </label>
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
        <input
          className="input-glass"
          placeholder="Mit freundlichen Grüssen"
          value={cl.closing}
          onChange={(e) => update('closing', e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
