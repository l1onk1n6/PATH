import { Plus, Trash2, Briefcase, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';

export default function ExperienceEditor() {
  const { getActiveResume, addWorkExperience, updateWorkExperience, removeWorkExperience, reorderWorkExperience } = useResumeStore();
  const resume = getActiveResume();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  if (!resume) return null;
  const { workExperience: jobs } = resume;

  function handleDrop(to: number) {
    if (dragging !== null && dragging !== to) reorderWorkExperience(resume!.id, dragging, to);
    setDragging(null); setDragOver(null);
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 0 }}>
          <Briefcase size={10} style={{ display: 'inline', marginRight: 4 }} />
          {jobs.length} Einträge
        </div>
        <button className="btn-glass btn-primary btn-sm" onClick={() => addWorkExperience(resume.id)}>
          <Plus size={13} /> Hinzufügen
        </button>
      </div>

      {jobs.length === 0 && (
        <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          <Briefcase size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div style={{ fontSize: 14 }}>Noch keine Berufserfahrung eingetragen</div>
        </div>
      )}

      {jobs.map((job, i) => (
        <div
          key={job.id}
          className="glass-card animate-fade-in"
          draggable
          onDragStart={() => setDragging(i)}
          onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
          onDrop={() => handleDrop(i)}
          onDragEnd={() => { setDragging(null); setDragOver(null); }}
          style={{
            padding: 16, marginBottom: 10,
            opacity: dragging === i ? 0.5 : 1,
            border: dragOver === i && dragging !== i ? '1px solid rgba(0,122,255,0.6)' : undefined,
            transition: 'opacity 0.15s, border 0.15s',
          }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setExpanded(expanded === job.id ? null : job.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <GripVertical size={14} style={{ opacity: 0.3, flexShrink: 0, cursor: 'grab' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {job.position || job.company || `Eintrag ${i + 1}`}
                </div>
                {job.company && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                    {job.company}{job.location ? ` · ${job.location}` : ''}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <button
                className="btn-glass btn-danger btn-sm btn-icon"
                onClick={(e) => { e.stopPropagation(); removeWorkExperience(resume.id, job.id); }}
                style={{ padding: 6 }}
              >
                <Trash2 size={12} />
              </button>
              {expanded === job.id ? <ChevronUp size={14} style={{ opacity: 0.5 }} /> : <ChevronDown size={14} style={{ opacity: 0.5 }} />}
            </div>
          </div>

          {expanded === job.id && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label className="section-label">Position</label>
                  <input className="input-glass" placeholder="z.B. Senior Developer" value={job.position}
                    onChange={(e) => updateWorkExperience(resume.id, job.id, { position: e.target.value })} />
                </div>
                <div>
                  <label className="section-label">Unternehmen</label>
                  <input className="input-glass" placeholder="z.B. Tech GmbH" value={job.company}
                    onChange={(e) => updateWorkExperience(resume.id, job.id, { company: e.target.value })} />
                </div>
                <div>
                  <label className="section-label">Standort</label>
                  <input className="input-glass" placeholder="Berlin" value={job.location}
                    onChange={(e) => updateWorkExperience(resume.id, job.id, { location: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={job.current}
                      onChange={(e) => updateWorkExperience(resume.id, job.id, { current: e.target.checked })} />
                    Aktuell tätig
                  </label>
                </div>
                <div>
                  <label className="section-label">Von</label>
                  <input className="input-glass" type="month" value={job.startDate}
                    onChange={(e) => updateWorkExperience(resume.id, job.id, { startDate: e.target.value })} />
                </div>
                <div>
                  <label className="section-label">Bis</label>
                  <input className="input-glass" type="month" value={job.endDate} disabled={job.current}
                    onChange={(e) => updateWorkExperience(resume.id, job.id, { endDate: e.target.value })}
                    style={{ opacity: job.current ? 0.4 : 1 }} />
                </div>
              </div>
              <div>
                <label className="section-label">Beschreibung / Aufgaben</label>
                <textarea className="input-glass"
                  placeholder="Beschreiben Sie Ihre Aufgaben und Verantwortlichkeiten..."
                  value={job.description}
                  onChange={(e) => updateWorkExperience(resume.id, job.id, { description: e.target.value })} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
