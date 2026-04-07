import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SkillBar, SafeImg } from './shared';

export default function NordicTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif', background: '#f8fafb', minHeight: '297mm', padding: '24px 28px', color: '#2d3748' }}>
      {/* Clean Header */}
      <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid #e2e8f0` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {info.photo && <SafeImg src={info.photo} alt="" style={{ width: 68, height: 68, borderRadius: 8, objectFit: 'cover' }} />}
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 300, letterSpacing: '-0.5px', color: '#1a202c' }}>{name}</h1>
              {info.title && <div style={{ fontSize: 13, color, fontWeight: 500, marginTop: 3 }}>{info.title}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#718096', lineHeight: 1.8 }}>
            {[info.email, info.phone, info.location].filter(Boolean).map((v, i) => <div key={i}>{v}</div>)}
          </div>
        </div>
        {info.summary && (
          <p style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.7, marginTop: 14, marginBottom: 0, maxWidth: '80%' }}>{info.summary}</p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 28 }}>
        <div>
          {workExperience.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 14 }}>Berufserfahrung</h2>
              {workExperience.map(job => (
                <div key={job.id} style={{ marginBottom: 16, paddingLeft: 14, borderLeft: `1px solid ${color}` }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1a202c' }}>{job.position}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ fontSize: 11, color, fontWeight: 500 }}>{job.company}</span>
                    <span style={{ fontSize: 10, color: '#a0aec0' }}>{formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)}</span>
                  </div>
                  {job.description && <p style={{ fontSize: 11, color: '#718096', marginTop: 5, lineHeight: 1.6 }}>{job.description}</p>}
                </div>
              ))}
            </div>
          )}

          {education.length > 0 && (
            <div>
              <h2 style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 14 }}>Ausbildung</h2>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 12, paddingLeft: 14, borderLeft: `1px solid #e2e8f0` }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: '#1a202c' }}>{edu.degree} {edu.field && `– ${edu.field}`}</div>
                  <div style={{ fontSize: 11, color, fontWeight: 500 }}>{edu.institution}</div>
                  <div style={{ fontSize: 10, color: '#a0aec0' }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {skills.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Skills</h2>
              {skills.map(skill => <SkillBar key={skill.id} skill={skill} color={color} />)}
            </div>
          )}
          {languages.length > 0 && (
            <div>
              <h2 style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Sprachen</h2>
              {languages.map(lang => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5, color: '#4a5568' }}>
                  <span>{lang.name}</span>
                  <span style={{ color: '#a0aec0' }}>{lang.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
