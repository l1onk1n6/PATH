import { useState } from 'react';
import { X, Loader2, Check, AlertCircle, Smartphone, Monitor } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { getSupabase } from '../../lib/supabase';
import { userError } from '../../lib/userError';

interface ParsedData {
  firstName?: string;
  lastName?: string;
  title?: string;
  summary?: string;
  workExperiences: Array<{
    position: string;
    company: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  educations: Array<{
    degree: string;
    field: string;
    institution: string;
    startDate: string;
    endDate: string;
  }>;
  skills: Array<{ name: string }>;
}

interface Props {
  onClose: () => void;
}

export default function LinkedInImportDialog({ onClose }: Props) {
  const [step, setStep]     = useState<1 | 2>(1);
  const [text, setText]     = useState('');
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState('');

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Supabase nicht konfiguriert');

      const { data, error: fnError } = await supabase.functions.invoke('parse-linkedin', {
        body: { text },
      });

      if (fnError || data?.error) throw new Error(fnError?.message ?? data?.error);

      setParsed(data as ParsedData);
      setStep(2);
    } catch (e) {
      setError(userError('Der LinkedIn-Import hat nicht funktioniert', e));
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!parsed) return;
    const store = useResumeStore.getState();
    const resume = store.getActiveResume();
    if (!resume) return;

    const { updatePersonalInfo, addWorkExperience, updateWorkExperience, addEducation, updateEducation, addSkill, updateSkill } = store;

    const personalUpdate: Record<string, string> = {};
    if (parsed.firstName) personalUpdate.firstName = parsed.firstName;
    if (parsed.lastName)  personalUpdate.lastName  = parsed.lastName;
    if (parsed.title)     personalUpdate.title     = parsed.title;
    if (parsed.summary)   personalUpdate.summary   = parsed.summary;
    if (Object.keys(personalUpdate).length > 0) updatePersonalInfo(resume.id, personalUpdate);

    for (const we of parsed.workExperiences) {
      addWorkExperience(resume.id);
      const fresh = useResumeStore.getState().getActiveResume();
      if (!fresh) continue;
      const newItem = fresh.workExperience[fresh.workExperience.length - 1];
      updateWorkExperience(resume.id, newItem.id, {
        position: we.position, company: we.company,
        startDate: we.startDate, endDate: we.endDate,
        current: we.current, description: we.description,
      });
    }

    for (const edu of parsed.educations) {
      addEducation(resume.id);
      const fresh = useResumeStore.getState().getActiveResume();
      if (!fresh) continue;
      const newItem = fresh.education[fresh.education.length - 1];
      updateEducation(resume.id, newItem.id, {
        institution: edu.institution, degree: edu.degree,
        field: edu.field, startDate: edu.startDate, endDate: edu.endDate,
      });
    }

    for (const sk of parsed.skills) {
      addSkill(resume.id);
      const fresh = useResumeStore.getState().getActiveResume();
      if (!fresh) continue;
      const newItem = fresh.skills[fresh.skills.length - 1];
      updateSkill(resume.id, newItem.id, { name: sk.name });
    }

    setDone(true);
    setTimeout(onClose, 900);
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card animate-scale-in"
        style={{ padding: '24px 22px', width: 520, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(14,14,24,0.98)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
              <rect width="72" height="72" rx="10" fill="#0A66C2"/>
              <path d="M20.4 28.8h8.1v23.4h-8.1V28.8zm4.05-12.96c2.59 0 4.69 2.1 4.69 4.69s-2.1 4.69-4.69 4.69-4.69-2.1-4.69-4.69 2.1-4.69 4.69-4.69zM33.3 28.8h7.76v3.2h.11c1.08-2.05 3.72-4.21 7.66-4.21 8.2 0 9.71 5.39 9.71 12.4v14h-8.1V41.7c0-3.02-.05-6.91-4.21-6.91-4.21 0-4.86 3.29-4.86 6.69v10.76H33.3V28.8z" fill="white"/>
            </svg>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>LinkedIn importieren</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>Schritt {step} von 2 · KI-gestützt</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {step === 1 && (
          <>
            {/* Desktop instructions */}
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(10,102,194,0.08)', border: '1px solid rgba(10,102,194,0.2)', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#fff', fontWeight: 600 }}>
                <Monitor size={14} /> Desktop
              </div>
              <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <li>Öffne dein LinkedIn-Profil im Browser</li>
                <li>Drücke <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>Ctrl+A</kbd> dann <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>Ctrl+C</kbd></li>
                <li>Füge den Text unten ein</li>
              </ol>
            </div>

            {/* Mobile instructions */}
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,159,10,0.06)', border: '1px solid rgba(255,159,10,0.2)', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#FF9F0A', fontWeight: 600 }}>
                <Smartphone size={14} /> Mobile
              </div>
              <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <li>Öffne <strong>Safari oder Chrome</strong> (nicht die LinkedIn-App)</li>
                <li>Gehe zu <strong>linkedin.com/in/deinname</strong></li>
                <li>Wenn die App-Weiterleitung kommt: Tippe auf <strong>„Im Browser öffnen"</strong> oder wähle in den Browser-Einstellungen <strong>„Desktop-Website anfordern"</strong></li>
                <li>Tippe lang auf die Seite → <strong>„Alles auswählen"</strong> → Kopieren</li>
                <li>Füge den Text unten ein</li>
              </ol>
            </div>

            <div style={{ marginBottom: 6 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, opacity: 0.7 }}>
                LinkedIn-Profil Text einfügen
              </label>
              <textarea
                className="input-glass"
                placeholder="Text deines LinkedIn-Profils hier einfügen…"
                value={text}
                onChange={e => setText(e.target.value)}
                rows={9}
                style={{ width: '100%', resize: 'vertical', fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>

            {!text.trim() && !error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                <AlertCircle size={12} /> Füge den kopierten LinkedIn-Text ein, um fortzufahren.
              </div>
            )}

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#FF453A', marginBottom: 12, padding: '8px 10px', background: 'rgba(255,69,58,0.08)', borderRadius: 8 }}>
                <AlertCircle size={12} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-glass" onClick={onClose} style={{ fontSize: 13 }}>Abbrechen</button>
              <button className="btn-glass btn-primary" onClick={handleParse} disabled={!text.trim() || loading} style={{ fontSize: 13, gap: 6 }}>
                {loading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> KI analysiert…</> : 'Importieren'}
              </button>
            </div>
          </>
        )}

        {step === 2 && parsed && (
          <>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)', fontSize: 13, marginBottom: 16 }}>
              <strong style={{ color: '#34C759', display: 'block', marginBottom: 8 }}>✓ KI hat extrahiert</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, color: 'rgba(255,255,255,0.75)' }}>
                {(parsed.firstName || parsed.lastName) && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ opacity: 0.5, minWidth: 110 }}>Name:</span>
                    <span>{[parsed.firstName, parsed.lastName].filter(Boolean).join(' ')}</span>
                  </div>
                )}
                {parsed.title && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ opacity: 0.5, minWidth: 110 }}>Berufsbezeichnung:</span>
                    <span style={{ flex: 1 }}>{parsed.title}</span>
                  </div>
                )}
                {parsed.summary && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ opacity: 0.5, minWidth: 110 }}>Zusammenfassung:</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parsed.summary.slice(0, 80)}{parsed.summary.length > 80 ? '…' : ''}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ opacity: 0.5, minWidth: 110 }}>Erfahrungen:</span>
                  <span>{parsed.workExperiences.length} Einträge</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ opacity: 0.5, minWidth: 110 }}>Ausbildung:</span>
                  <span>{parsed.educations.length} Einträge</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ opacity: 0.5, minWidth: 110 }}>Kenntnisse:</span>
                  <span>{parsed.skills.length} Skills</span>
                </div>
              </div>
            </div>

            {parsed.workExperiences.length === 0 && parsed.educations.length === 0 && parsed.skills.length === 0 && !parsed.firstName && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.25)', fontSize: 12, color: '#FF9F0A', marginBottom: 14 }}>
                Es konnten keine Daten erkannt werden. Stelle sicher, dass du den vollständigen LinkedIn-Profiltext eingefügt hast.
              </div>
            )}

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px', lineHeight: 1.55 }}>
              Die Daten werden zu deinem aktuellen Lebenslauf hinzugefügt (bestehende Einträge bleiben erhalten).
            </p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-glass" onClick={() => setStep(1)} style={{ fontSize: 13 }}>Zurück</button>
              <button className="btn-glass" onClick={onClose} style={{ fontSize: 13 }}>Abbrechen</button>
              <button className="btn-glass btn-primary" onClick={handleApply} disabled={done} style={{ fontSize: 13, gap: 6 }}>
                {done ? <><Check size={13} /> Übernommen!</> : 'Übernehmen'}
              </button>
            </div>
          </>
        )}

        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    </div>
  );
}
