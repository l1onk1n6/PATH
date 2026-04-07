import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SkillBar } from './shared';

export default function ElegantTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"Palatino Linotype", Palatino, Georgia, serif', background: '#fdfcfb', minHeight: '297mm', padding: '28px 28px', color: '#2c2c2c' }}>
      {/* Elegant Header */}
      <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 20 }}>
        {info.photo && <img src={info.photo} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}`, marginBottom: 12 }} />}
        <h1 style={{ fontSize: 30, fontWeight: 400, letterSpacing: '0.05em', margin: '0 0 6px', color: '#1a1a1a' }}>{name}</h1>
        {info.title && <div style={{ fontSize: 13, color, fontStyle: 'italic', marginBottom: 10 }}>{info.title}</div>}
        <div style={{ width: 60, height: 1, background: color, margin: '0 auto 10px' }} />
        <div style={{ fontSize: 11, color: '#888', display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {[info.email, info.phone, info.location, info.website].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
        </div>
      </div>

      {info.summary && (
        <div style={{ marginBottom: 22, textAlign: 'center', maxWidth: '75%', margin: '0 auto 22px', fontStyle: 'italic', fontSize: 12, color: '#555', lineHeight: 1.8 }}>
          <p>{info.summary}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        <div>
          {workExperience.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: 12, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1a1a1a', margin: '0 0 6px' }}>Berufserfahrung</h2>
                <div style={{ width: 40, height: 1, background: color, margin: '0 auto' }} />
              </div>
              {workExperience.map(job => (
                <div key={job.id} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#1a1a1a' }}>{job.position}</div>
                  <div style={{ fontSize: 11, color, fontStyle: 'italic' }}>{job.company}</div>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>{formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)}</div>
                  {job.description && <p style={{ fontSize: 10, color: '#666', lineHeight: 1.6 }}>{job.description}</p>}
                </div>
              ))}
            </div>
          )}

          {education.length > 0 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: 12, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1a1a1a', margin: '0 0 6px' }}>Ausbildung</h2>
                <div style={{ width: 40, height: 1, background: color, margin: '0 auto' }} />
              </div>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}</div>
                  <div style={{ fontSize: 11, color, fontStyle: 'italic' }}>{edu.institution}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {skills.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: 12, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1a1a1a', margin: '0 0 6px' }}>Fähigkeiten</h2>
                <div style={{ width: 40, height: 1, background: color, margin: '0 auto' }} />
              </div>
              {skills.map(sk => <SkillBar key={sk.id} skill={sk} color={color} />)}
            </div>
          )}

          {languages.length > 0 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: 12, fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1a1a1a', margin: '0 0 6px' }}>Sprachen</h2>
                <div style={{ width: 40, height: 1, background: color, margin: '0 auto' }} />
              </div>
              {languages.map(lang => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6, borderBottom: '1px dotted #ddd', paddingBottom: 4 }}>
                  <span style={{ fontStyle: 'italic' }}>{lang.name}</span>
                  <span style={{ color: '#888' }}>{lang.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
