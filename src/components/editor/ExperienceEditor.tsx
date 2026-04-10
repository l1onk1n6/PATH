import { Plus, Trash2, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import MonthYearPicker from '../ui/MonthYearPicker';
import { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function ExperienceEditor() {
  const { getActiveResume, addWorkExperience, updateWorkExperience, removeWorkExperience } = useResumeStore();
  const resume = getActiveResume();
  const [expanded, setExpanded] = useState<string | null>(null);
  const isMobile = useIsMobile();

  if (!resume) return null;
  const { workExperience: jobs } = resume;

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
        <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Briefcase size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div style={{ fontSize: 14 }}>Noch keine Berufserfahrung eingetragen</div>
        </div>
      )}

      {jobs.map((job, i) => (
        <div key={job.id} className="glass-card animate-fade-in" style={{ padding: 16, marginBottom: 10 }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setExpanded(expanded === job.id ? null : job.id)}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {job.position || job.company || `Eintrag ${i + 1}`}
              </div>
              {job.company && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {job.company}{job.location ? ` · ${job.location}` : ''}
                </div>
              )}
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
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label className="section-label">Position</label>
                  <input className="input-glass" placeholder="z.B. Senior Developer" value={job.position} maxLength={150}
                    onChange={(e) => updateWorkExperience(resume.id, job.id, { position: e.target.value })} />
                </div>
                <div>
                  <label className="section-label">Unternehmen</label>
                  <input className="input-glass" placeholder="z.B. Tech GmbH" value={job.company} maxLength={150}
                    onChange={(e) => updateWorkExperience(resume.id, job.id, { company: e.target.value })} />
                </div>
                <div>
                  <label className="section-label">Standort</label>
                  <input className="input-glass" placeholder="Berlin" value={job.location} maxLength={100}
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
                  <MonthYearPicker value={job.startDate} onChange={(v) => updateWorkExperience(resume.id, job.id, { startDate: v })} />
                </div>
                <div>
                  <label className="section-label">Bis</label>
                  <MonthYearPicker value={job.endDate} disabled={job.current} onChange={(v) => updateWorkExperience(resume.id, job.id, { endDate: v })} />
                </div>
              </div>
              <div>
                <label className="section-label">Beschreibung / Aufgaben</label>
                <textarea className="input-glass"
                  placeholder="Beschreiben Sie Ihre Aufgaben und Verantwortlichkeiten..."
                  value={job.description} maxLength={1500}
                  onChange={(e) => updateWorkExperience(resume.id, job.id, { description: e.target.value })} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
