import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SafeImg } from './shared';

export default function FreelancerTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, projects, certificates } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"Inter", Arial, sans-serif', background: '#0f0f0f', minHeight: '297mm', color: '#e8e8e8' }}>
      {/* Dark header with neon accent */}
      <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid #222` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 6 }}>Portfolio · Lebenslauf</div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: '#fff' }}>{name}</h1>
            {info.title && (
              <div style={{ fontSize: 14, color: '#aaa', marginTop: 6, fontWeight: 400 }}>{info.title}</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            {info.photo && (
              <SafeImg src={info.photo} alt="" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}`, marginBottom: 8, display: 'block', marginLeft: 'auto' }} />
            )}
            <div style={{ fontSize: 11, color: '#666', lineHeight: 1.8 }}>
              {[info.email, info.phone, info.location].filter(Boolean).map((v, i) => <div key={i}>{v}</div>)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 0 }}>
        {/* Main content */}
        <div style={{ padding: '24px 32px', borderRight: '1px solid #1e1e1e' }}>
          {info.summary && (
            <p style={{ fontSize: 13, color: '#bbb', lineHeight: 1.8, marginBottom: 28, borderLeft: `3px solid ${color}`, paddingLeft: 16 }}>{info.summary}</p>
          )}

          {projects.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color, marginBottom: 16 }}>Projekte</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {projects.map(proj => (
                  <div key={proj.id} style={{ background: '#1a1a1a', borderRadius: 8, padding: '12px 14px', border: `1px solid #282828` }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#fff', marginBottom: 4 }}>{proj.name}</div>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                        {proj.technologies.map((t, i) => (
                          <span key={i} style={{ fontSize: 9, padding: '1px 6px', background: `${color}20`, color, borderRadius: 3, fontWeight: 600 }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {proj.description && <p style={{ fontSize: 10, color: '#888', margin: 0, lineHeight: 1.5 }}>{proj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {workExperience.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color, marginBottom: 16 }}>Erfahrung</h2>
              {workExperience.map(job => (
                <div key={job.id} style={{ marginBottom: 16, display: 'flex', gap: 14 }}>
                  <div style={{ width: 2, background: `${color}40`, borderRadius: 1, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{job.position}</div>
                    <div style={{ fontSize: 12, color, fontWeight: 600 }}>{job.company}</div>
                    <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>
                      {formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)} {job.location ? `· ${job.location}` : ''}
                    </div>
                    {job.description && <p style={{ fontSize: 11, color: '#999', lineHeight: 1.6, margin: 0 }}>{job.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {education.length > 0 && (
            <div>
              <h2 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color, marginBottom: 16 }}>Ausbildung</h2>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 10, display: 'flex', gap: 14 }}>
                  <div style={{ width: 2, background: `${color}30`, borderRadius: 1, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#fff' }}>{edu.degree}{edu.field ? ` – ${edu.field}` : ''}</div>
                    <div style={{ fontSize: 11, color }}>{edu.institution}</div>
                    <div style={{ fontSize: 10, color: '#555' }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ padding: '24px 20px' }}>
          {skills.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color, marginBottom: 14 }}>Skills</h2>
              {skills.map(sk => (
                <div key={sk.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#ccc', marginBottom: 4 }}>
                    <span>{sk.name}</span>
                    <span style={{ color: '#555', fontSize: 10 }}>{sk.level * 20}%</span>
                  </div>
                  <div style={{ height: 3, background: '#222', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${sk.level * 20}%`, background: color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {languages.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color, marginBottom: 14 }}>Sprachen</h2>
              {languages.map(lang => (
                <div key={lang.id} style={{ marginBottom: 8, fontSize: 11 }}>
                  <div style={{ color: '#ddd', fontWeight: 600 }}>{lang.name}</div>
                  <div style={{ fontSize: 10, color: '#555' }}>{lang.level}</div>
                </div>
              ))}
            </div>
          )}

          {certificates.length > 0 && (
            <div>
              <h2 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color, marginBottom: 14 }}>Zertifikate</h2>
              {certificates.map(cert => (
                <div key={cert.id} style={{ marginBottom: 8, padding: '6px 8px', background: '#1a1a1a', borderRadius: 6, borderLeft: `2px solid ${color}` }}>
                  <div style={{ fontSize: 11, color: '#ddd', fontWeight: 600 }}>{cert.name}</div>
                  <div style={{ fontSize: 10, color: '#666' }}>{cert.issuer}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
