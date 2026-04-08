import { useState } from 'react';
import { X, Loader2, Check, AlertCircle } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';

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

function parseDate(raw: string): { date: string; current: boolean } {
  const current = /heute|today|aktuell|present/i.test(raw);
  if (current) return { date: '', current: true };

  // Match "Jan. 2020", "Jan 2020", "January 2020", "Januar 2020", "2020"
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', mär: '03', apr: '04',
    mai: '05', may: '05', jun: '06', jul: '07', aug: '08',
    sep: '09', okt: '10', oct: '10', nov: '11', dez: '12', dec: '12',
  };
  const m = raw.match(/([a-zä]+)\.?\s+(\d{4})/i);
  if (m) {
    const monthKey = m[1].toLowerCase().slice(0, 3);
    const month = monthMap[monthKey] ?? '01';
    return { date: `${m[2]}-${month}`, current: false };
  }
  const yearOnly = raw.match(/(\d{4})/);
  if (yearOnly) return { date: `${yearOnly[1]}-01`, current: false };
  return { date: '', current: false };
}

function parseDateRange(line: string): { startDate: string; endDate: string; current: boolean } {
  // "Jan. 2020 – März 2022" or "2020 – heute"
  const parts = line.split(/[–—-]/).map(s => s.trim());
  if (parts.length >= 2) {
    const start = parseDate(parts[0]);
    const end = parseDate(parts[1]);
    return {
      startDate: start.date,
      endDate: end.current ? '' : end.date,
      current: end.current,
    };
  }
  const single = parseDate(line);
  return { startDate: single.date, endDate: '', current: single.current };
}

function isDateRangeLine(line: string): boolean {
  return /(\d{4}|jan|feb|mär|mar|apr|mai|may|jun|jul|aug|sep|okt|oct|nov|dez|dec).*[–—].*(\d{4}|heute|today|aktuell|present)/i.test(line);
}

function parseLinkedIn(text: string): ParsedData {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const result: ParsedData = {
    workExperiences: [],
    educations: [],
    skills: [],
  };

  if (lines.length === 0) return result;

  // First non-empty line = full name
  const nameLine = lines[0];
  const nameParts = nameLine.trim().split(/\s+/);
  if (nameParts.length >= 2) {
    result.firstName = nameParts.slice(0, -1).join(' ');
    result.lastName = nameParts[nameParts.length - 1];
  } else {
    result.firstName = nameLine;
  }

  // Second line = headline/title
  if (lines[1] && !isSectionHeader(lines[1])) {
    result.title = lines[1];
  }

  // Find section boundaries
  const sectionKeywords = {
    about: /^(über mich|about|zusammenfassung|summary)$/i,
    experience: /^(berufserfahrung|erfahrung|experience|work experience|tätigkeiten)$/i,
    education: /^(ausbildung|bildung|education|studium)$/i,
    skills: /^(kenntnisse|fähigkeiten|skills|kompetenzen|top kenntnisse|top skills)$/i,
  };

  type SectionName = 'about' | 'experience' | 'education' | 'skills' | null;

  const sections: Array<{ name: SectionName; startIdx: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const [name, re] of Object.entries(sectionKeywords)) {
      if (re.test(line)) {
        sections.push({ name: name as SectionName, startIdx: i });
        break;
      }
    }
  }

  function getSectionLines(name: SectionName): string[] {
    const idx = sections.findIndex(s => s.name === name);
    if (idx === -1) return [];
    const start = sections[idx].startIdx + 1;
    const end = idx + 1 < sections.length ? sections[idx + 1].startIdx : lines.length;
    return lines.slice(start, end);
  }

  // About / Summary
  const aboutLines = getSectionLines('about');
  if (aboutLines.length > 0) {
    result.summary = aboutLines.join('\n');
  }

  // Work Experience
  const expLines = getSectionLines('experience');
  if (expLines.length > 0) {
    // Parse blocks: position → company → date range → (location) → (description...)
    // Each job starts when we see a non-date, non-location line after a date range
    const jobs: ParsedData['workExperiences'] = [];
    let i = 0;
    while (i < expLines.length) {
      const line = expLines[i];
      if (isSectionHeader(line) || line.length === 0) { i++; continue; }

      // Try to identify job position (usually first in a block)
      // Heuristic: position line doesn't look like a date range and isn't too short
      if (!isDateRangeLine(line) && line.length > 2) {
        const position = line;
        let company = '';
        let startDate = '';
        let endDate = '';
        let current = false;
        const descLines: string[] = [];

        i++;
        // Next line: company (may contain " · Vollzeit" etc.)
        if (i < expLines.length && !isDateRangeLine(expLines[i])) {
          company = expLines[i].split('·')[0].trim();
          i++;
        }
        // Next line: date range
        if (i < expLines.length && isDateRangeLine(expLines[i])) {
          const parsed = parseDateRange(expLines[i]);
          startDate = parsed.startDate;
          endDate = parsed.endDate;
          current = parsed.current;
          i++;
        }
        // Next line might be duration ("1 Jahr 3 Monate") or location — skip
        if (i < expLines.length && /\d+\s*(Jahr|Monat|month|year)/i.test(expLines[i])) {
          i++;
        }
        // Next might be location
        if (i < expLines.length && !isDateRangeLine(expLines[i]) && expLines[i].length < 60 && !expLines[i].includes('·')) {
          // Could be location — if it looks like a city/country, skip it, but don't skip if it looks like description
          if (/^[A-ZÄÖÜ]/.test(expLines[i]) && expLines[i].split(' ').length <= 4) {
            i++; // skip location
          }
        }
        // Remaining lines until next job block are description
        while (i < expLines.length) {
          const next = expLines[i];
          if (isDateRangeLine(next)) break;
          if (!isSectionHeader(next) && next.length > 0) {
            // Stop if this looks like the start of a new job entry
            // (short line followed by company pattern or date)
            if (i + 1 < expLines.length && (isDateRangeLine(expLines[i + 1]) || expLines[i + 1].includes('·'))) break;
            descLines.push(next);
          }
          i++;
        }

        if (position || company) {
          jobs.push({ position, company, startDate, endDate, current, description: descLines.join('\n') });
        }
      } else {
        i++;
      }
    }
    result.workExperiences = jobs;
  }

  // Education
  const eduLines = getSectionLines('education');
  if (eduLines.length > 0) {
    const edus: ParsedData['educations'] = [];
    let i = 0;
    while (i < eduLines.length) {
      const line = eduLines[i];
      if (isSectionHeader(line) || line.length === 0) { i++; continue; }

      if (!isDateRangeLine(line)) {
        const institution = line;
        let degree = '';
        let field = '';
        let startDate = '';
        let endDate = '';
        i++;
        if (i < eduLines.length && !isDateRangeLine(eduLines[i])) {
          // "Bachelor of Science · Informatik" or just "Bachelor Informatik"
          const degLine = eduLines[i];
          const parts = degLine.split(/[·,]/);
          degree = parts[0].trim();
          field = parts[1]?.trim() ?? '';
          i++;
        }
        if (i < eduLines.length && isDateRangeLine(eduLines[i])) {
          const parsed = parseDateRange(eduLines[i]);
          startDate = parsed.startDate;
          endDate = parsed.endDate;
          i++;
        }
        // Skip duration / grade lines
        while (i < eduLines.length && !isSectionHeader(eduLines[i]) && !isDateRangeLine(eduLines[i]) && eduLines[i].length < 80) {
          i++;
        }
        if (institution) {
          edus.push({ institution, degree, field, startDate, endDate });
        }
      } else {
        i++;
      }
    }
    result.educations = edus;
  }

  // Skills
  const skillLines = getSectionLines('skills');
  const skills: ParsedData['skills'] = [];
  for (const line of skillLines) {
    if (isSectionHeader(line)) continue;
    // Skills may be comma-separated on one line or one per line
    if (line.includes(',')) {
      for (const part of line.split(',')) {
        const name = part.trim();
        if (name.length > 0 && name.length < 60) skills.push({ name });
      }
    } else if (line.length > 0 && line.length < 60) {
      skills.push({ name: line });
    }
  }
  result.skills = skills;

  return result;
}

function isSectionHeader(line: string): boolean {
  return /^(über mich|about|zusammenfassung|summary|berufserfahrung|erfahrung|experience|work experience|tätigkeiten|ausbildung|bildung|education|studium|kenntnisse|fähigkeiten|skills|kompetenzen|top kenntnisse|top skills)$/i.test(line);
}

interface Props {
  onClose: () => void;
}

export default function LinkedInImportDialog({ onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const result = parseLinkedIn(text);
      setParsed(result);
      setStep(2);
      setLoading(false);
    }, 300);
  }

  function handleApply() {
    if (!parsed) return;
    const store = useResumeStore.getState();
    const resume = store.getActiveResume();
    if (!resume) return;

    const { updatePersonalInfo, addWorkExperience, updateWorkExperience, addEducation, updateEducation, addSkill, updateSkill } = store;

    // Personal info
    const personalUpdate: Record<string, string> = {};
    if (parsed.firstName) personalUpdate.firstName = parsed.firstName;
    if (parsed.lastName) personalUpdate.lastName = parsed.lastName;
    if (parsed.title) personalUpdate.title = parsed.title;
    if (parsed.summary) personalUpdate.summary = parsed.summary;
    if (Object.keys(personalUpdate).length > 0) {
      updatePersonalInfo(resume.id, personalUpdate);
    }

    // Work experiences
    for (const we of parsed.workExperiences) {
      addWorkExperience(resume.id);
      const fresh = useResumeStore.getState().getActiveResume();
      if (!fresh) continue;
      const newItem = fresh.workExperience[fresh.workExperience.length - 1];
      updateWorkExperience(resume.id, newItem.id, {
        position: we.position,
        company: we.company,
        startDate: we.startDate,
        endDate: we.endDate,
        current: we.current,
        description: we.description,
      });
    }

    // Education
    for (const edu of parsed.educations) {
      addEducation(resume.id);
      const fresh = useResumeStore.getState().getActiveResume();
      if (!fresh) continue;
      const newItem = fresh.education[fresh.education.length - 1];
      updateEducation(resume.id, newItem.id, {
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        startDate: edu.startDate,
        endDate: edu.endDate,
      });
    }

    // Skills
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
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card animate-scale-in"
        style={{
          padding: '28px 24px', width: 500, maxWidth: '95vw', maxHeight: '90vh',
          overflowY: 'auto', background: 'rgba(14,14,24,0.98)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(10,102,194,0.2)', border: '1px solid rgba(10,102,194,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14, color: '#0A66C2',
            }}>in</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>LinkedIn importieren</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                Schritt {step} von 2
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {step === 1 && (
          <>
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(10,102,194,0.08)', border: '1px solid rgba(10,102,194,0.2)',
              fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 16,
            }}>
              <strong style={{ display: 'block', marginBottom: 6, color: '#fff' }}>So funktioniert's:</strong>
              <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Öffne dein LinkedIn-Profil im <strong>Browser</strong> (nicht in der App)</li>
                <li>Wähle den gesamten Seiteninhalt aus
                  <br /><span style={{ opacity: 0.6, fontSize: 12 }}>Desktop: <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>Ctrl+A</kbd> &nbsp;|&nbsp; Mobile: Tippe lang → „Alles auswählen"</span>
                </li>
                <li>Kopiere und füge den Text unten ein</li>
              </ol>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, opacity: 0.7 }}>
                LinkedIn-Profil Text einfügen
              </label>
              <textarea
                className="input-glass"
                placeholder="Text deines LinkedIn-Profils hier einfügen…"
                value={text}
                onChange={e => setText(e.target.value)}
                rows={10}
                style={{ width: '100%', resize: 'vertical', fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>

            {!text.trim() && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                <AlertCircle size={12} />
                Füge den kopierten LinkedIn-Text ein, um fortzufahren.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-glass" onClick={onClose} style={{ fontSize: 13 }}>
                Abbrechen
              </button>
              <button
                className="btn-glass btn-primary"
                onClick={handleParse}
                disabled={!text.trim() || loading}
                style={{ fontSize: 13, gap: 6 }}
              >
                {loading
                  ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analysiere…</>
                  : 'Importieren'}
              </button>
            </div>
          </>
        )}

        {step === 2 && parsed && (
          <>
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)',
              fontSize: 13, marginBottom: 16,
            }}>
              <strong style={{ color: '#34C759', display: 'block', marginBottom: 8 }}>Extrahierte Daten</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'rgba(255,255,255,0.75)' }}>
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
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {parsed.summary.slice(0, 80)}{parsed.summary.length > 80 ? '…' : ''}
                    </span>
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
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.25)',
                fontSize: 12, color: '#FF9F0A', marginBottom: 14,
              }}>
                Es konnten keine Daten erkannt werden. Stelle sicher, dass du den vollständigen LinkedIn-Profiltext eingefügt hast.
              </div>
            )}

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px', lineHeight: 1.55 }}>
              Die Daten werden zu deinem aktuellen Lebenslauf hinzugefügt (bestehende Einträge bleiben erhalten).
            </p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-glass" onClick={() => setStep(1)} style={{ fontSize: 13 }}>
                Zurück
              </button>
              <button className="btn-glass" onClick={onClose} style={{ fontSize: 13 }}>
                Abbrechen
              </button>
              <button
                className="btn-glass btn-primary"
                onClick={handleApply}
                disabled={done}
                style={{ fontSize: 13, gap: 6 }}
              >
                {done
                  ? <><Check size={13} /> Übernommen!</>
                  : 'Übernehmen'}
              </button>
            </div>
          </>
        )}

        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    </div>
  );
}
