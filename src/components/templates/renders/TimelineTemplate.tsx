import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SafeImg } from './shared';

export default function TimelineTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"Inter", Arial, sans-serif', background: '#fff', minHeight: '297mm', padding: '24px 28px', color: '#1a1a1a' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid #eee` }}>
        {info.photo && <SafeImg src={info.photo} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}` }} />}
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>{name}</h1>
          {info.title && <div style={{ fontSize: 13, color, fontWeight: 600, marginTop: 2 }}>{info.title}</div>}
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: '#888', lineHeight: 1.9 }}>
          {[info.email, info.phone, info.location].filter(Boolean).map((v, i) => <div key={i}>{v}</div>)}
        </div>
      </div>

      {info.summary && (
        <p style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: 22 }}>{info.summary}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 28 }}>
        <div>
          {workExperience.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16, color: '#1a1a1a' }}>Berufserfahrung</h2>
              <div style={{ position: 'relative', paddingLeft: 20, borderLeft: `2px solid ${color}20` }}>
                {workExperience.map((job, i) => (
                  <div key={job.id} style={{ marginBottom: 16, position: 'relative' }}>
                    {/* Timeline dot */}
                    <div style={{
                      position: 'absolute', left: -25, top: 3,
                      width: 10, height: 10, borderRadius: '50%',
                      background: i === 0 ? color : '#fff',
                      border: `2px solid ${color}`,
                    }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{job.position}</div>
                        <div style={{ fontSize: 12, color, fontWeight: 600 }}>{job.company} · {job.location}</div>
                      </div>
                      <span style={{
                        fontSize: 9, padding: '2px 8px', borderRadius: 12,
                        background: i === 0 ? color : '#f0f0f0',
                        color: i === 0 ? '#fff' : '#888',
                        fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)}
                      </span>
                    </div>
                    {job.description && <p style={{ fontSize: 11, color: '#666', marginTop: 4, lineHeight: 1.5 }}>{job.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div>
              <h2 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16, color: '#1a1a1a' }}>Ausbildung</h2>
              <div style={{ position: 'relative', paddingLeft: 20, borderLeft: `2px solid ${color}20` }}>
                {education.map((edu, i) => (
                  <div key={edu.id} style={{ marginBottom: 14, position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: -25, top: 3,
                      width: 10, height: 10, borderRadius: '50%',
                      background: i === 0 ? color : '#fff',
                      border: `2px solid ${color}`,
                    }} />
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree} {edu.field && `– ${edu.field}`}</div>
                    <div style={{ fontSize: 11, color }}>{edu.institution}</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {skills.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, color: '#1a1a1a' }}>Skills</h2>
              {skills.map(sk => (
                <div key={sk.id} style={{ marginBottom: 7 }}>
                  <div style={{ fontSize: 11, marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{sk.name}</span>
                    <span style={{ fontSize: 9, color: '#aaa' }}>{sk.level * 20}%</span>
                  </div>
                  <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${sk.level * 20}%`, background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {languages.length > 0 && (
            <div>
              <h2 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Sprachen</h2>
              {languages.map(lang => (
                <div key={lang.id} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600 }}>{lang.name}</span>
                  </div>
                  <div style={{ fontSize: 9, color: '#888' }}>{lang.level}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
