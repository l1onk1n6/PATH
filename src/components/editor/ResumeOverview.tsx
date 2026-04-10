import { useState } from 'react';
import { ExternalLink, Pencil, Check, X, Calendar, Link2, Briefcase, GraduationCap, Zap, FileEdit, CheckCircle2, Circle } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '../../types/resume';
import type { EditorSection } from '../../types/resume';

export default function ResumeOverview() {
  const { getActiveResume, getActivePerson, renameResume, updateResume, setActiveSection } = useResumeStore();
  const resume = getActiveResume();
  const person = getActivePerson();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  if (!resume || !person) return null;

  const info = resume.personalInfo;

  function startRename() {
    setNameValue(resume!.name || '');
    setEditingName(true);
  }
  function commitRename() {
    if (nameValue.trim()) renameResume(resume!.id, nameValue.trim());
    setEditingName(false);
  }

  const sections: { label: string; section: EditorSection; icon: React.ReactNode; done: boolean; hint: string }[] = [
    {
      label: 'Persönliche Daten',
      section: 'personal',
      icon: <Briefcase size={14} />,
      done: !!(info.firstName && info.lastName && info.email),
      hint: 'Name & Kontakt',
    },
    {
      label: 'Berufserfahrung',
      section: 'experience',
      icon: <Briefcase size={14} />,
      done: resume.workExperience.length > 0,
      hint: `${resume.workExperience.length} Einträge`,
    },
    {
      label: 'Ausbildung',
      section: 'education',
      icon: <GraduationCap size={14} />,
      done: resume.education.length > 0,
      hint: `${resume.education.length} Einträge`,
    },
    {
      label: 'Fähigkeiten',
      section: 'skills',
      icon: <Zap size={14} />,
      done: resume.skills.length > 0,
      hint: `${resume.skills.length} Skills`,
    },
    {
      label: 'Motivationsschreiben',
      section: 'cover-letter',
      icon: <FileEdit size={14} />,
      done: resume.coverLetter.body.length > 50,
      hint: resume.coverLetter.body.length > 0 ? `${resume.coverLetter.body.length} Zeichen` : 'Nicht ausgefüllt',
    },
  ];

  const doneCount = sections.filter(s => s.done).length;
  const percent = Math.round((doneCount / sections.length) * 100);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 520 }}>

      {/* Resume name */}
      <div style={{ marginBottom: 24 }}>
        {editingName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              className="input-glass"
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingName(false); }}
              autoFocus
              maxLength={80}
              style={{ fontSize: 18, fontWeight: 700, flex: 1, padding: '8px 12px' }}
            />
            <button className="btn-glass btn-sm" onClick={commitRename} style={{ padding: '8px 10px' }}>
              <Check size={14} />
            </button>
            <button className="btn-glass btn-sm" onClick={() => setEditingName(false)} style={{ padding: '8px 10px' }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, flex: 1 }}>
              {resume.name || 'Bewerbungsmappe'}
            </h2>
            <button
              className="btn-glass btn-sm"
              onClick={startRename}
              title="Umbenennen"
              style={{ padding: '6px 8px', opacity: 0.6 }}
            >
              <Pencil size={13} />
            </button>
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          Bewerbungsmappe von {person.name}
        </div>
      </div>

      {/* Status + Deadline row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label className="section-label">Status</label>
          <select
            className="input-glass"
            value={resume.status}
            onChange={e => updateResume(resume.id, { status: e.target.value as typeof resume.status })}
            style={{ width: '100%' }}
          >
            {Object.entries(APPLICATION_STATUS_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="section-label">
            <Calendar size={9} style={{ display: 'inline', marginRight: 4 }} />Bewerbungsfrist
          </label>
          <input
            className="input-glass"
            type="date"
            value={resume.deadline}
            onChange={e => updateResume(resume.id, { deadline: e.target.value })}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Job URL */}
      <div style={{ marginBottom: 20 }}>
        <label className="section-label">
          <Link2 size={9} style={{ display: 'inline', marginRight: 4 }} />Stellenausschreibung
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input-glass"
            type="url"
            placeholder="https://example.com/jobs/..."
            value={resume.jobUrl}
            onChange={e => updateResume(resume.id, { jobUrl: e.target.value })}
            style={{ flex: 1 }}
          />
          {resume.jobUrl && (
            <a
              href={resume.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glass btn-sm"
              style={{ textDecoration: 'none', color: 'inherit', padding: '0 12px', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
            >
              <ExternalLink size={13} /> Öffnen
            </a>
          )}
        </div>
      </div>

      {/* Completeness */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>Vollständigkeit</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: percent === 100 ? 'var(--ios-green)' : 'var(--text-muted)' }}>
            {doneCount}/{sections.length}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginBottom: 14, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2, transition: 'width 0.4s ease',
            width: `${percent}%`,
            background: percent === 100 ? 'var(--ios-green)' : 'var(--ios-blue)',
          }} />
        </div>
        {sections.map(({ label, section, done, hint }) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 10px', borderRadius: 8, marginBottom: 2, textAlign: 'left',
              color: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            {done
              ? <CheckCircle2 size={15} style={{ color: 'var(--ios-green)', flexShrink: 0 }} />
              : <Circle size={15} style={{ opacity: 0.35, flexShrink: 0 }} />
            }
            <span style={{ flex: 1, fontSize: 13, opacity: done ? 1 : 0.65 }}>{label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
