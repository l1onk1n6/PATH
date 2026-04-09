import type { Resume } from '../../../types/resume';
import { fullName, formatDate, fullAddress } from './shared';

export default function GeometricTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, projects } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"Inter", Arial, sans-serif', background: '#fff', minHeight: '297mm', position: 'relative', overflow: 'hidden' }}>
      {/* Geometric decorative shapes */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: `${color}12`, borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', transform: 'rotate(15deg)' }} />
      <div style={{ position: 'absolute', top: 60, right: 20, width: 80, height: 80, background: `${color}20`, borderRadius: 12, transform: 'rotate(30deg)' }} />
      <div style={{ position: 'absolute', bottom: 60, left: -30, width: 150, height: 150, background: `${color}08`, borderRadius: '50%' }} />

      <div style={{ position: 'relative', padding: '28px 32px' }}>
        {/* Header with geometric accent */}
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `3px solid ${color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 32, height: 32, background: color, borderRadius: 6, transform: 'rotate(12deg)' }} />
                <div style={{ width: 20, height: 20, background: `${color}50`, borderRadius: 4, transform: 'rotate(-8deg)' }} />
              </div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#111', letterSpacing: '-0.5px' }}>{name}</h1>
              {info.title && <div style={{ fontSize: 13, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{info.title}</div>}
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#666', lineHeight: 1.9 }}>
              {[info.email, info.phone, fullAddress(info), info.linkedin].filter(Boolean).map((v, i) => (
                <div key={i}>{v}</div>
              ))}
            </div>
          </div>
        </div>

        {info.summary && (
          <p style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: 22, padding: '12px 16px', background: `${color}08`, borderLeft: `4px solid ${color}`, borderRadius: '0 8px 8px 0' }}>
            {info.summary}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          <div>
            {workExperience.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 12, height: 12, background: color, borderRadius: 2, transform: 'rotate(45deg)' }} />
                  <h2 style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#333' }}>Berufserfahrung</h2>
                </div>
                {workExperience.map(job => (
                  <div key={job.id} style={{ marginBottom: 14, paddingLeft: 16, borderLeft: `2px solid ${color}30` }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{job.position}</div>
                    <div style={{ fontSize: 12, color, fontWeight: 600 }}>{job.company}</div>
                    <div style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>
                      {formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)} {job.location ? `· ${job.location}` : ''}
                    </div>
                    {job.description && <p style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>{job.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {projects.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 12, height: 12, background: color, borderRadius: 2, transform: 'rotate(45deg)' }} />
                  <h2 style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#333' }}>Projekte</h2>
                </div>
                {projects.map(proj => (
                  <div key={proj.id} style={{ marginBottom: 10, padding: '8px 12px', background: '#f8f8f8', borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{proj.name}</div>
                    {proj.description && <p style={{ fontSize: 10, color: '#666', margin: '3px 0 0', lineHeight: 1.4 }}>{proj.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {education.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 12, height: 12, background: color, borderRadius: 2, transform: 'rotate(45deg)' }} />
                  <h2 style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#333' }}>Ausbildung</h2>
                </div>
                {education.map(edu => (
                  <div key={edu.id} style={{ marginBottom: 12, paddingLeft: 16, borderLeft: `2px solid ${color}30` }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}{edu.field ? ` – ${edu.field}` : ''}</div>
                    <div style={{ fontSize: 11, color }}>{edu.institution}</div>
                    <div style={{ fontSize: 10, color: '#999' }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
                  </div>
                ))}
              </div>
            )}

            {skills.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 12, height: 12, background: color, borderRadius: 2, transform: 'rotate(45deg)' }} />
                  <h2 style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#333' }}>Skills</h2>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {skills.map(sk => (
                    <span key={sk.id} style={{
                      fontSize: 10, padding: '4px 10px',
                      background: sk.level >= 4 ? color : `${color}15`,
                      color: sk.level >= 4 ? '#fff' : '#333',
                      borderRadius: 6, fontWeight: 600,
                      clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                    }}>{sk.name}</span>
                  ))}
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 12, height: 12, background: color, borderRadius: 2, transform: 'rotate(45deg)' }} />
                  <h2 style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#333' }}>Sprachen</h2>
                </div>
                {languages.map(lang => (
                  <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, padding: '4px 8px', background: `${color}08`, borderRadius: 4 }}>
                    <span style={{ fontWeight: 600 }}>{lang.name}</span>
                    <span style={{ color: '#888', fontSize: 11 }}>{lang.level}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
