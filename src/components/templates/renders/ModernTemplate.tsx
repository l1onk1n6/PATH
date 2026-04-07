import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SkillBar, SafeImg } from './shared';

export default function ModernTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, certificates } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', background: '#ffffff', minHeight: '297mm', color: '#1a1a1a' }}>
      {/* Top accent line */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}66)` }} />

      <div style={{ padding: '28px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid #f0f0f0` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {info.photo && <SafeImg src={info.photo} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover' }} />}
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', color: '#0d0d0d' }}>{name}</h1>
              {info.title && <div style={{ fontSize: 13, color, fontWeight: 600, marginTop: 3, letterSpacing: '0.02em' }}>{info.title}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#888', lineHeight: 2 }}>
            {[info.email, info.phone, info.location, info.linkedin].filter(Boolean).map((v, i) => <div key={i}>{v}</div>)}
          </div>
        </div>

        {info.summary && (
          <div style={{ marginBottom: 22, padding: '12px 16px', background: `${color}08`, borderRadius: 8, borderLeft: `3px solid ${color}` }}>
            <p style={{ margin: 0, fontSize: 12, color: '#444', lineHeight: 1.7 }}>{info.summary}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 28 }}>
          <div>
            {workExperience.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 8, height: 2, background: '#fff', borderRadius: 1 }} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1a1a1a' }}>Berufserfahrung</h2>
                </div>
                {workExperience.map(job => (
                  <div key={job.id} style={{ marginBottom: 14, paddingLeft: 28, borderLeft: `1px solid #eee` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{job.position}</div>
                        <div style={{ fontSize: 12, color, fontWeight: 600 }}>{job.company}</div>
                      </div>
                      <div style={{ fontSize: 10, color: '#aaa', textAlign: 'right' }}>
                        <div>{job.location}</div>
                        <div>{formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)}</div>
                      </div>
                    </div>
                    {job.description && <p style={{ fontSize: 11, color: '#666', marginTop: 5, lineHeight: 1.6 }}>{job.description}</p>}
                  </div>
                ))}
              </div>
            )}
            {education.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Ausbildung</h2>
                </div>
                {education.map(edu => (
                  <div key={edu.id} style={{ marginBottom: 10, paddingLeft: 28 }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}</div>
                    <div style={{ fontSize: 11, color }}>{edu.institution}</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {skills.length > 0 && (
              <div style={{ marginBottom: 18, background: '#f9f9f9', borderRadius: 10, padding: 14 }}>
                <h2 style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1a1a1a' }}>Skills</h2>
                {skills.map(sk => <SkillBar key={sk.id} skill={sk} color={color} />)}
              </div>
            )}
            {languages.length > 0 && (
              <div style={{ background: '#f9f9f9', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <h2 style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Sprachen</h2>
                {languages.map(lang => (
                  <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600 }}>{lang.name}</span>
                    <span style={{ color: '#999', fontSize: 10 }}>{lang.level}</span>
                  </div>
                ))}
              </div>
            )}
            {certificates.length > 0 && (
              <div style={{ background: '#f9f9f9', borderRadius: 10, padding: 14 }}>
                <h2 style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Zertifikate</h2>
                {certificates.map(cert => (
                  <div key={cert.id} style={{ marginBottom: 6, fontSize: 11 }}>
                    <div style={{ fontWeight: 600 }}>{cert.name}</div>
                    <div style={{ color: '#999', fontSize: 10 }}>{cert.issuer}</div>
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
