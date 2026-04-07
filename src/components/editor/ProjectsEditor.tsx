import { Plus, Trash2, FolderOpen, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';

export default function ProjectsEditor() {
  const {
    getActiveResume,
    addProject, updateProject, removeProject,
    addCertificate, updateCertificate, removeCertificate,
  } = useResumeStore();
  const resume = getActiveResume();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  if (!resume) return null;

  const { projects, certificates } = resume;

  return (
    <div className="animate-fade-in">
      {/* Projects */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>
            <FolderOpen size={10} style={{ display: 'inline', marginRight: 4 }} />
            Projekte ({projects.length})
          </div>
          <button className="btn-glass btn-primary btn-sm" onClick={() => addProject(resume.id)}>
            <Plus size={13} /> Hinzufügen
          </button>
        </div>

        {projects.map((project, i) => (
          <div key={project.id} className="glass-card animate-fade-in" style={{ padding: 14, marginBottom: 8 }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>{project.name || `Projekt ${i + 1}`}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn-glass btn-danger btn-sm btn-icon"
                  onClick={(e) => { e.stopPropagation(); removeProject(resume.id, project.id); }}
                  style={{ padding: 6 }}
                >
                  <Trash2 size={12} />
                </button>
                {expandedProject === project.id ? <ChevronUp size={14} style={{ opacity: 0.5 }} /> : <ChevronDown size={14} style={{ opacity: 0.5 }} />}
              </div>
            </div>

            {expandedProject === project.id && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label className="section-label">Projektname</label>
                    <input className="input-glass" placeholder="z.B. E-Commerce App" value={project.name}
                      onChange={(e) => updateProject(resume.id, project.id, { name: e.target.value })} />
                  </div>
                  <div>
                    <label className="section-label">URL</label>
                    <input className="input-glass" placeholder="github.com/..." value={project.url}
                      onChange={(e) => updateProject(resume.id, project.id, { url: e.target.value })} />
                  </div>
                  <div>
                    <label className="section-label">Von</label>
                    <input className="input-glass" type="month" value={project.startDate}
                      onChange={(e) => updateProject(resume.id, project.id, { startDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="section-label">Bis</label>
                    <input className="input-glass" type="month" value={project.endDate}
                      onChange={(e) => updateProject(resume.id, project.id, { endDate: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="section-label">Technologien (Komma-getrennt)</label>
                    <input className="input-glass"
                      placeholder="z.B. React, TypeScript, Node.js"
                      value={project.technologies.join(', ')}
                      onChange={(e) => updateProject(resume.id, project.id, { technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} />
                  </div>
                </div>
                <div>
                  <label className="section-label">Beschreibung</label>
                  <textarea className="input-glass" placeholder="Was wurde entwickelt?" value={project.description}
                    onChange={(e) => updateProject(resume.id, project.id, { description: e.target.value })} />
                </div>
              </div>
            )}
          </div>
        ))}

        {projects.length === 0 && (
          <div className="glass-card" style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            <FolderOpen size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div>Noch keine Projekte eingetragen</div>
          </div>
        )}
      </div>

      <div className="divider" />

      {/* Certificates */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>
            <Award size={10} style={{ display: 'inline', marginRight: 4 }} />
            Zertifikate ({certificates.length})
          </div>
          <button className="btn-glass btn-primary btn-sm" onClick={() => addCertificate(resume.id)}>
            <Plus size={13} /> Hinzufügen
          </button>
        </div>

        {certificates.map((cert) => (
          <div key={cert.id} className="glass-card animate-fade-in" style={{ padding: 14, marginBottom: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="section-label">Zertifikat</label>
                <input className="input-glass" placeholder="z.B. AWS Certified" value={cert.name}
                  onChange={(e) => updateCertificate(resume.id, cert.id, { name: e.target.value })} />
              </div>
              <div>
                <label className="section-label">Aussteller</label>
                <input className="input-glass" placeholder="z.B. Amazon Web Services" value={cert.issuer}
                  onChange={(e) => updateCertificate(resume.id, cert.id, { issuer: e.target.value })} />
              </div>
              <div>
                <label className="section-label">Datum</label>
                <input className="input-glass" type="month" value={cert.date}
                  onChange={(e) => updateCertificate(resume.id, cert.id, { date: e.target.value })} />
              </div>
              <div>
                <label className="section-label">URL</label>
                <input className="input-glass" placeholder="Zertifikat-Link" value={cert.url}
                  onChange={(e) => updateCertificate(resume.id, cert.id, { url: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <button className="btn-glass btn-danger btn-sm" onClick={() => removeCertificate(resume.id, cert.id)}>
                <Trash2 size={12} /> Entfernen
              </button>
            </div>
          </div>
        ))}

        {certificates.length === 0 && (
          <div className="glass-card" style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            Noch keine Zertifikate eingetragen
          </div>
        )}
      </div>
    </div>
  );
}
