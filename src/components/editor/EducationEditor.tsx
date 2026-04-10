import { Plus, Trash2, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import MonthYearPicker from '../ui/MonthYearPicker';
import { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function EducationEditor() {
  const { getActiveResume, addEducation, updateEducation, removeEducation } = useResumeStore();
  const resume = getActiveResume();
  const [expanded, setExpanded] = useState<string | null>(null);
  const isMobile = useIsMobile();

  if (!resume) return null;
  const { education } = resume;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 0 }}>
          <GraduationCap size={10} style={{ display: 'inline', marginRight: 4 }} />
          {education.length} Einträge
        </div>
        <button className="btn-glass btn-primary btn-sm" onClick={() => addEducation(resume.id)}>
          <Plus size={13} /> Hinzufügen
        </button>
      </div>

      {education.length === 0 && (
        <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          <GraduationCap size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div style={{ fontSize: 14 }}>Noch keine Ausbildung eingetragen</div>
        </div>
      )}

      {education.map((edu, i) => (
        <div key={edu.id} className="glass-card animate-fade-in" style={{ padding: 16, marginBottom: 10 }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setExpanded(expanded === edu.id ? null : edu.id)}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {edu.degree || edu.institution || `Eintrag ${i + 1}`}
              </div>
              {edu.institution && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {edu.institution}{edu.field ? ` · ${edu.field}` : ''}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <button
                className="btn-glass btn-danger btn-sm btn-icon"
                onClick={(e) => { e.stopPropagation(); removeEducation(resume.id, edu.id); }}
                style={{ padding: 6 }}
              >
                <Trash2 size={12} />
              </button>
              {expanded === edu.id ? <ChevronUp size={14} style={{ opacity: 0.5 }} /> : <ChevronDown size={14} style={{ opacity: 0.5 }} />}
            </div>
          </div>

          {expanded === edu.id && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label className="section-label">Abschluss</label>
                  <input className="input-glass" placeholder="z.B. Bachelor of Science" value={edu.degree} maxLength={150}
                    onChange={(e) => updateEducation(resume.id, edu.id, { degree: e.target.value })} />
                </div>
                <div>
                  <label className="section-label">Fachrichtung</label>
                  <input className="input-glass" placeholder="z.B. Informatik" value={edu.field} maxLength={150}
                    onChange={(e) => updateEducation(resume.id, edu.id, { field: e.target.value })} />
                </div>
                <div>
                  <label className="section-label">Institution</label>
                  <input className="input-glass" placeholder="z.B. TU Berlin" value={edu.institution} maxLength={150}
                    onChange={(e) => updateEducation(resume.id, edu.id, { institution: e.target.value })} />
                </div>
                <div>
                  <label className="section-label">Standort</label>
                  <input className="input-glass" placeholder="Berlin" value={edu.location} maxLength={100}
                    onChange={(e) => updateEducation(resume.id, edu.id, { location: e.target.value })} />
                </div>
                <div>
                  <label className="section-label">Von</label>
                  <MonthYearPicker value={edu.startDate} onChange={(v) => updateEducation(resume.id, edu.id, { startDate: v })} />
                </div>
                <div>
                  <label className="section-label">Bis</label>
                  <MonthYearPicker value={edu.endDate} onChange={(v) => updateEducation(resume.id, edu.id, { endDate: v })} />
                </div>
                <div>
                  <label className="section-label">Note / GPA</label>
                  <input className="input-glass" placeholder="z.B. 1,5 oder 3.8" value={edu.grade} maxLength={20}
                    onChange={(e) => updateEducation(resume.id, edu.id, { grade: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="section-label">Beschreibung / Schwerpunkte</label>
                <textarea
                  className="input-glass"
                  placeholder="Beschreiben Sie Schwerpunkte, Projekte oder besondere Leistungen..."
                  value={edu.description} maxLength={1000}
                  onChange={(e) => updateEducation(resume.id, edu.id, { description: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
