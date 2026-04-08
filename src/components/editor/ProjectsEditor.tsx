import { Plus, Trash2, FolderOpen, Award, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import MonthYearPicker from '../ui/MonthYearPicker';
import { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function ProjectsEditor() {
  const {
    getActiveResume,
    addProject, updateProject, removeProject, reorderProjects,
    addCertificate, updateCertificate, removeCertificate, reorderCertificates,
  } = useResumeStore();
  const resume = getActiveResume();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [draggingP, setDraggingP] = useState<number | null>(null);
  const [dragOverP, setDragOverP] = useState<number | null>(null);
  const [draggingC, setDraggingC] = useState<number | null>(null);
  const [dragOverC, setDragOverC] = useState<number | null>(null);
  const isMobile = useIsMobile();

  if (!resume) return null;

  const { projects, certificates } = resume;

  function handleDropP(to: number) {
    if (draggingP !== null && draggingP !== to) reorderProjects(resume!.id, draggingP, to);
    setDraggingP(null); setDragOverP(null);
  }

  function handleDropC(to: number) {
    if (draggingC !== null && draggingC !== to) reorderCertificates(resume!.id, draggingC, to);
    setDraggingC(null); setDragOverC(null);
  }

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
          <div
            key={project.id}
            className="glass-card animate-fade-in"
            draggable={!isMobile}
            onDragStart={!isMobile ? () => setDraggingP(i) : undefined}
            onDragOver={!isMobile ? (e) => { e.preventDefault(); setDragOverP(i); } : undefined}
            onDrop={!isMobile ? () => handleDropP(i) : undefined}
            onDragEnd={!isMobile ? () => { setDraggingP(null); setDragOverP(null); } : undefined}
            style={{
              padding: 14, marginBottom: 8,
              opacity: draggingP === i ? 0.5 : 1,
              border: dragOverP === i && draggingP !== i ? '1px solid rgba(0,122,255,0.6)' : undefined,
              transition: 'opacity 0.15s, border 0.15s',
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                {isMobile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-glass btn-icon"
                      disabled={i === 0}
                      onClick={() => reorderProjects(resume.id, i, i - 1)}
                      style={{ padding: 3, opacity: i === 0 ? 0.2 : 0.6, boxShadow: 'none', background: 'transparent', border: 'none' }}
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      className="btn-glass btn-icon"
                      disabled={i === projects.length - 1}
                      onClick={() => reorderProjects(resume.id, i, i + 1)}
                      style={{ padding: 3, opacity: i === projects.length - 1 ? 0.2 : 0.6, boxShadow: 'none', background: 'transparent', border: 'none' }}
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>
                ) : (
                  <GripVertical size={14} style={{ opacity: 0.3, flexShrink: 0, cursor: 'grab' }} />
                )}
                <div style={{ fontWeight: 600, fontSize: 14 }}>{project.name || `Projekt ${i + 1}`}</div>
              </div>
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
                    <MonthYearPicker value={project.startDate} onChange={(v) => updateProject(resume.id, project.id, { startDate: v })} />
                  </div>
                  <div>
                    <label className="section-label">Bis</label>
                    <MonthYearPicker value={project.endDate} onChange={(v) => updateProject(resume.id, project.id, { endDate: v })} />
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

        {certificates.map((cert, i) => (
          <div
            key={cert.id}
            className="glass-card animate-fade-in"
            draggable={!isMobile}
            onDragStart={!isMobile ? () => setDraggingC(i) : undefined}
            onDragOver={!isMobile ? (e) => { e.preventDefault(); setDragOverC(i); } : undefined}
            onDrop={!isMobile ? () => handleDropC(i) : undefined}
            onDragEnd={!isMobile ? () => { setDraggingC(null); setDragOverC(null); } : undefined}
            style={{
              padding: 14, marginBottom: 8,
              opacity: draggingC === i ? 0.5 : 1,
              border: dragOverC === i && draggingC !== i ? '1px solid rgba(0,122,255,0.6)' : undefined,
              transition: 'opacity 0.15s, border 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              {isMobile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0, paddingTop: 4 }}>
                  <button
                    className="btn-glass btn-icon"
                    disabled={i === 0}
                    onClick={() => reorderCertificates(resume.id, i, i - 1)}
                    style={{ padding: 3, opacity: i === 0 ? 0.2 : 0.6, boxShadow: 'none', background: 'transparent', border: 'none' }}
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    className="btn-glass btn-icon"
                    disabled={i === certificates.length - 1}
                    onClick={() => reorderCertificates(resume.id, i, i + 1)}
                    style={{ padding: 3, opacity: i === certificates.length - 1 ? 0.2 : 0.6, boxShadow: 'none', background: 'transparent', border: 'none' }}
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>
              )}
              {!isMobile && <GripVertical size={14} style={{ opacity: 0.3, flexShrink: 0, cursor: 'grab', marginTop: 4 }} />}
              <div style={{ flex: 1 }}>
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
                    <MonthYearPicker value={cert.date} onChange={(v) => updateCertificate(resume.id, cert.id, { date: v })} placeholder="Monat / Jahr" />
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
