import type { Resume } from '../../../types/resume';
import { fullName, formatDate } from './shared';

export default function TechTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, projects } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"SF Mono", "Fira Code", Consolas, monospace', background: '#0d1117', color: '#c9d1d9', minHeight: '297mm', padding: '24px 24px' }}>
      {/* Terminal-style header */}
      <div style={{ background: '#161b22', borderRadius: 8, padding: '16px 20px', marginBottom: 20, border: '1px solid #30363d' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['#FF5F56','#FFBD2E','#27C93F'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ fontSize: 11, color: '#58a6ff' }}><span style={{ color: '#3fb950' }}>~</span> cat profile.json</div>
        <div style={{ marginTop: 8 }}>
          <span style={{ color: '#58a6ff' }}>{'{'}</span>
          <div style={{ paddingLeft: 16 }}>
            <div><span style={{ color: '#79c0ff' }}>"name"</span>: <span style={{ color: '#a5d6ff' }}>"{name}"</span>,</div>
            {info.title && <div><span style={{ color: '#79c0ff' }}>"role"</span>: <span style={{ color: '#a5d6ff' }}>"{info.title}"</span>,</div>}
            {info.email && <div><span style={{ color: '#79c0ff' }}>"email"</span>: <span style={{ color: '#a5d6ff' }}>"{info.email}"</span>,</div>}
            {info.location && <div><span style={{ color: '#79c0ff' }}>"location"</span>: <span style={{ color: '#a5d6ff' }}>"{info.location}"</span></div>}
          </div>
          <span style={{ color: '#58a6ff' }}>{'}'}</span>
        </div>
      </div>

      {info.summary && (
        <div style={{ marginBottom: 20, background: '#161b22', borderRadius: 8, padding: '12px 16px', border: `1px solid ${color}40` }}>
          <div style={{ fontSize: 9, color: color, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>// ABOUT</div>
          <p style={{ fontSize: 11, color: '#8b949e', lineHeight: 1.7, margin: 0 }}>{info.summary}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 16 }}>
        <div>
          {workExperience.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: color, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>// EXPERIENCE</div>
              {workExperience.map(job => (
                <div key={job.id} style={{ marginBottom: 14, background: '#161b22', borderRadius: 6, padding: '10px 14px', border: '1px solid #30363d' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#e6edf3' }}>{job.position}</div>
                    <span style={{ fontSize: 9, color: '#58a6ff' }}>{formatDate(job.startDate)}–{job.current ? 'now' : formatDate(job.endDate)}</span>
                  </div>
                  <div style={{ fontSize: 11, color, marginBottom: 4 }}>{job.company}</div>
                  {job.description && <p style={{ fontSize: 10, color: '#8b949e', lineHeight: 1.5, margin: 0 }}>{job.description}</p>}
                </div>
              ))}
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <div style={{ fontSize: 9, color: color, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>// PROJECTS</div>
              {projects.map(proj => (
                <div key={proj.id} style={{ marginBottom: 10, background: '#161b22', borderRadius: 6, padding: '10px 14px', border: '1px solid #30363d' }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#e6edf3' }}>{proj.name}</div>
                  {proj.technologies.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {proj.technologies.map(t => (
                        <span key={t} style={{ fontSize: 9, padding: '2px 6px', background: `${color}20`, color, borderRadius: 4 }}>{t}</span>
                      ))}
                    </div>
                  )}
                  {proj.description && <p style={{ fontSize: 10, color: '#8b949e', lineHeight: 1.5, margin: '6px 0 0' }}>{proj.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {skills.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: color, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10 }}>// STACK</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {skills.map(sk => (
                  <div key={sk.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, opacity: 0.4 + sk.level * 0.12 }} />
                    <span style={{ color: '#c9d1d9' }}>{sk.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: color, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10 }}>// EDUCATION</div>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 8, fontSize: 10, color: '#8b949e' }}>
                  <div style={{ color: '#e6edf3', fontWeight: 600 }}>{edu.degree}</div>
                  <div style={{ color }}>{edu.institution}</div>
                  <div>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
                </div>
              ))}
            </div>
          )}

          {languages.length > 0 && (
            <div>
              <div style={{ fontSize: 9, color: color, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10 }}>// LANGUAGES</div>
              {languages.map(lang => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 10, marginBottom: 4, color: '#8b949e' }}>
                  <span>{lang.name}</span>
                  <span style={{ color: color, fontSize: 9 }}>{lang.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
