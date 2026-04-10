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

// ── Date helpers ──────────────────────────────────────────

function parseMonthYear(raw: string): string {
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mär: '03', mar: '03', apr: '04',
    mai: '05', may: '05', jun: '06', jul: '07', aug: '08',
    sep: '09', okt: '10', oct: '10', nov: '11', dez: '12', dec: '12',
  };
  const m = raw.match(/([a-zäöü]+)\.?\s*(\d{4})/i);
  if (m) {
    const month = monthMap[m[1].toLowerCase().slice(0, 3)] ?? '01';
    return `${m[2]}-${month}`;
  }
  const yearOnly = raw.match(/(\d{4})/);
  return yearOnly ? `${yearOnly[1]}-01` : '';
}

function parseDateRange(line: string): { startDate: string; endDate: string; current: boolean } {
  const current = /heute|today|aktuell|present/i.test(line);
  // Split on em-dash, en-dash, or " - "
  const parts = line.split(/\s*[–—]\s*|\s+-\s+/).map(s => s.trim());
  const startDate = parseMonthYear(parts[0] ?? '');
  const endDate = current ? '' : parseMonthYear(parts[1] ?? '');
  return { startDate, endDate, current };
}

function isDateRangeLine(line: string): boolean {
  return (
    /\d{4}\s*[–—]/.test(line) ||
    /[–—]\s*(heute|today|aktuell|present)/i.test(line) ||
    /(jan|feb|mär|mar|apr|mai|may|jun|jul|aug|sep|okt|oct|nov|dez|dec)\.?\s*\d{4}/i.test(line) &&
      /[–—]/.test(line)
  );
}

// ── Experience parser ─────────────────────────────────────

function parseExperience(lines: string[]): ParsedData['workExperiences'] {
  // Remove logo lines, work-mode labels, skills-count refs, blanks
  const clean = lines
    .map(l => l.trim())
    .filter(l =>
      l.length > 0 &&
      !/^Logo von /i.test(l) &&
      !/^(Hybrid|Remote|Vor Ort|On-site|Home Office)$/i.test(l) &&
      !/und \+\d+ Kenntnisse$/i.test(l) &&
      !/^\d+ Kenntnisse$/i.test(l) &&
      !/^Alle anzeigen$/i.test(l)
    );

  // "Vollzeit · 4 Jahre 2 Monate"  →  true   (employment type comes first)
  const isTypeDuration = (l: string) =>
    /^(Vollzeit|Teilzeit|Selbstständig|Freiberuflich|Praktikum|Saisonal|Interim|Full-time|Part-time)\s*[·,]/i.test(l);

  // "PIXMATIC · Selbstständig"  →  true   (company name comes first)
  const isCompanyType = (l: string) =>
    l.includes('·') &&
    !isTypeDuration(l) &&
    !isDateRangeLine(l) &&
    /(Vollzeit|Teilzeit|Selbstständig|Freiberuflich|Praktikum|Full-time|Part-time)/i.test(l);

  const jobs: ParsedData['workExperiences'] = [];
  let currentCompany = '';

  for (let i = 0; i < clean.length; i++) {
    const line = clean[i];

    // ── Type·Duration line: "Vollzeit · 4 Jahre" → skip, sets nothing
    if (isTypeDuration(line)) continue;

    // ── Company·Type line: "PIXMATIC · Selbstständig"
    //    Job title is the PREVIOUS line; date range is the NEXT line
    if (isCompanyType(line)) {
      currentCompany = line.split('·')[0].trim();
      const prev = clean[i - 1];
      const next = clean[i + 1];
      if (prev && !isDateRangeLine(prev) && !isTypeDuration(prev) && prev.length > 2 &&
          next && isDateRangeLine(next)) {
        const { startDate, endDate, current } = parseDateRange(next.split('·')[0].trim());
        jobs.push({ position: prev, company: currentCompany, startDate, endDate, current, description: '' });
        i += 1; // skip the date range line we just consumed
      }
      continue;
    }

    // ── Date range line following a job title directly (multi-role at same company)
    if (isDateRangeLine(line)) {
      const prev = clean[i - 1];
      if (prev && !isTypeDuration(prev) && !isDateRangeLine(prev) && prev.length > 2) {
        const { startDate, endDate, current } = parseDateRange(line.split('·')[0].trim());
        jobs.push({ position: prev, company: currentCompany, startDate, endDate, current, description: '' });
      }
      continue;
    }

    // ── Standalone company name: followed by a TypeDuration line
    //    (multi-role header like "Kinderdorf Pestalozzi" then "Vollzeit · 4 Jahre")
    const nextLine = clean[i + 1];
    if (nextLine && isTypeDuration(nextLine)) {
      currentCompany = line;
    }
  }

  return jobs;
}

// ── Education parser ──────────────────────────────────────

function parseEducation(lines: string[]): ParsedData['educations'] {
  const clean = lines
    .map(l => l.trim())
    .filter(l => l.length > 0 && !/^Logo von /i.test(l) && !/^Alle anzeigen$/i.test(l));

  const isYearRange = (l: string) => /^\d{4}[–—-]\d{4}$/.test(l) || /^\d{4}$/.test(l);

  const edus: ParsedData['educations'] = [];
  let i = 0;
  while (i < clean.length) {
    const line = clean[i];
    if (isDateRangeLine(line) || isYearRange(line)) { i++; continue; }

    const institution = line;
    let degree = '';
    let field = '';
    let startDate = '';
    let endDate = '';

    i++;
    // Degree / field line
    if (i < clean.length && !isDateRangeLine(clean[i]) && !isYearRange(clean[i])) {
      const parts = clean[i].split(/[·,]/);
      degree = parts[0].trim();
      field = parts.slice(1).join(',').trim();
      i++;
    }
    // Date or year range
    if (i < clean.length && (isDateRangeLine(clean[i]) || isYearRange(clean[i]))) {
      const raw = clean[i];
      if (isYearRange(raw) && /^\d{4}$/.test(raw)) {
        startDate = `${raw}-01`;
      } else if (/^\d{4}[–—-]\d{4}$/.test(raw)) {
        const yr = raw.split(/[–—-]/);
        startDate = `${yr[0]}-01`;
        endDate = `${yr[1]}-01`;
      } else {
        const parsed = parseDateRange(raw);
        startDate = parsed.startDate;
        endDate = parsed.endDate;
      }
      i++;
    }
    // Skip trailing noise (grade, description short lines)
    while (i < clean.length && !isDateRangeLine(clean[i]) && !isYearRange(clean[i]) && clean[i].length < 80) {
      i++;
    }

    if (institution) edus.push({ institution, degree, field, startDate, endDate });
  }
  return edus;
}

// ── Skills parser ─────────────────────────────────────────

function parseSkills(lines: string[]): ParsedData['skills'] {
  const noise = [
    /^Alle anzeigen$/i,
    /LinkedIn Kenntnistest/i,
    /Nachweis/i,
    /Ausgestellt/i,
    /und Microsoft/i,
    /und \+\d+/i,
  ];

  const skills: ParsedData['skills'] = [];
  let lastName = '';

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.length > 70) continue;
    if (noise.some(p => p.test(line))) continue;
    // Skip endorsement lines that start with the previous skill name (more specific variant)
    if (lastName && line.toLowerCase().startsWith(lastName.toLowerCase()) && line !== lastName) continue;
    skills.push({ name: line });
    lastName = line;
  }
  return skills;
}

// ── Main parser ───────────────────────────────────────────

function parseLinkedIn(text: string): ParsedData {
  const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const result: ParsedData = { workExperiences: [], educations: [], skills: [] };
  if (rawLines.length === 0) return result;

  // Find the index of each major section (take first occurrence)
  const sectionIdx = {
    info:       rawLines.findIndex(l => /^Info$/.test(l)),
    experience: rawLines.findIndex(l => /^(Erfahrung|Experience)$/.test(l)),
    education:  rawLines.findIndex(l => /^(Ausbildung|Education)$/.test(l)),
    skills:     rawLines.findIndex(l => /^Kenntnisse(\s*\(\d+\))?$|^Skills(\s*\(\d+\))?$/.test(l)),
    certs:      rawLines.findIndex(l => /^Bescheinigungen/.test(l)),
  };

  // All found section starts, sorted ascending
  const allStarts = Object.values(sectionIdx).filter(i => i >= 0).sort((a, b) => a - b);

  function getSectionLines(startIdx: number): string[] {
    if (startIdx < 0) return [];
    const nextStart = allStarts.find(i => i > startIdx) ?? rawLines.length;
    return rawLines.slice(startIdx + 1, nextStart);
  }

  // ── Name: the line immediately before a gender pronoun (Er/Sie/He/She)
  const pronounIdx = rawLines.findIndex(l => /^(Er|Sie|Es|He|She|They)$/.test(l));
  if (pronounIdx > 0) {
    const candidate = rawLines[pronounIdx - 1];
    if (/^[A-ZÄÖÜ]/.test(candidate) && candidate.split(/\s+/).length >= 2) {
      const parts = candidate.split(/\s+/);
      result.firstName = parts.slice(0, -1).join(' ');
      result.lastName = parts[parts.length - 1];
    }
  }

  // ── Summary: first long line in Info section
  if (sectionIdx.info >= 0) {
    const infoLines = getSectionLines(sectionIdx.info)
      .filter(l => l.length > 40 && !/^(mehr|… mehr|Alle anzeigen|Serviceleistungen)$/i.test(l));
    if (infoLines.length > 0) {
      result.summary = infoLines[0].replace(/…?\s*mehr$/, '').trim();
    }
  }

  // ── Experience
  if (sectionIdx.experience >= 0) {
    result.workExperiences = parseExperience(getSectionLines(sectionIdx.experience));
  }

  // ── Education
  if (sectionIdx.education >= 0) {
    result.educations = parseEducation(getSectionLines(sectionIdx.education));
  }

  // ── Skills
  if (sectionIdx.skills >= 0) {
    result.skills = parseSkills(getSectionLines(sectionIdx.skills));
  }

  // ── Title from most recent position
  if (result.workExperiences.length > 0 && !result.title) {
    result.title = result.workExperiences[0].position;
  }

  return result;
}

interface Props {
  onClose: () => void;
  linkedinUrl?: string;
}

export default function LinkedInImportDialog({ onClose, linkedinUrl }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Normalise URL so it always has https://
  const profileUrl = linkedinUrl
    ? linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`
    : null;

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
          overflowY: 'auto',
          background: 'rgba(20, 24, 40, 0.92)',
          backdropFilter: 'blur(40px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
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
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                Schritt {step} von 2
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {step === 1 && (
          <>
            {profileUrl && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 14,
                background: 'rgba(10,102,194,0.12)', border: '1px solid rgba(10,102,194,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'rgba(10,102,194,0.9)', fontWeight: 600, marginBottom: 2 }}>
                    Dein gespeichertes Profil
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profileUrl}
                  </div>
                </div>
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glass btn-sm"
                  style={{ fontSize: 12, flexShrink: 0, textDecoration: 'none', color: 'inherit' }}
                >
                  Profil öffnen ↗
                </a>
              </div>
            )}

            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(10,102,194,0.08)', border: '1px solid rgba(10,102,194,0.2)',
              fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16,
            }}>
              <strong style={{ display: 'block', marginBottom: 6, color: 'var(--text-primary)' }}>So funktioniert's:</strong>
              <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>{profileUrl ? 'Öffne dein Profil oben' : 'Öffne dein LinkedIn-Profil im Browser'}</li>
                <li>Wähle den gesamten Seiteninhalt aus (<kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>Ctrl+A</kbd>)</li>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--text-secondary)' }}>
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

            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.55 }}>
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
