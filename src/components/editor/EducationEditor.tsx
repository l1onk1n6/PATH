import { Plus, Trash2, GraduationCap, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import MonthYearPicker from '../ui/MonthYearPicker';
import { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function EducationEditor() {
  const { getActiveResume, addEducation, updateEducation, removeEducation, reorderEducation } = useResumeStore();
  const resume = getActiveResume();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const isMobile = useIsMobile();

  if (!resume) return null;
  const { education } = resume;

  function handleDrop(to: number) {
    if (dragging !== null && dragging !== to) reorderEducation(resume!.id, dragging, to);
    setDragging(null); setDragOver(null);
  }

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
        <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          <GraduationCap size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div style={{ fontSize: 14 }}>Noch keine Ausbildung eingetragen</div>
        </div>
      )}

      {education.map((edu, i) => (
        <div
          key={edu.id}
          className="glass-card animate-fade-in"
          draggable={!isMobile}
          onDragStart={!isMobile ? () => setDragging(i) : undefined}
          onDragOver={!isMobile ? (e) => { e.preventDefault(); setDragOver(i); } : undefined}
          onDrop={!isMobile ? () => handleDrop(i) : undefined}
          onDragEnd={!isMobile ? () => { setDragging(null); setDragOver(null); } : undefined}
          style={{
            padding: 16, marginBottom: 10,
            opacity: dragging === i ? 0.5 : 1,
            border: dragOver === i && dragging !== i ? '1px solid rgba(0,122,255,0.6)' : undefined,
            transition: 'opacity 0.15s, border 0.15s',
          }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setExpanded(expanded === edu.id ? null : edu.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn-glass btn-icon" disabled={i === 0} onClick={() => reorderEducation(resume!.id, i, i - 1)}
                    style={{ padding: 3, opacity: i === 0 ? 0.2 : 0.6, boxShadow: 'none', background: 'transparent', border: 'none' }}>
                    <ChevronUp size={13} />
                  </button>
                  <button className="btn-glass btn-icon" disabled={i === education.length - 1} onClick={() => reorderEducation(resume!.id, i, i + 1)}
                    style={{ padding: 3, opacity: i === education.length - 1 ? 0.2 : 0.6, boxShadow: 'none', background: 'transparent', border: 'none' }}>
                    <ChevronDown size={13} />
                  </button>
                </div>
              ) : (
                <GripVertical size={14} style={{ opacity: 0.3, flexShrink: 0, cursor: 'grab' }} />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {edu.degree || edu.institution || `Eintrag ${i + 1}`}
                </div>
                {edu.institution && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                    {edu.institution}{edu.field ? ` · ${edu.field}` : ''}
                  </div>
                )}
              </div>
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
