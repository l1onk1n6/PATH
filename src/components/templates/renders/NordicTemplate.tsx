import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SafeImg } from './shared';

export default function NordicTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, certificates, customSections } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  const SectionHeading = ({ children }: { children: React.ReactNode }) => (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color, margin: '0 0 6px' }}>{children}</h2>
      <div style={{ height: 1, background: '#e8edf2' }} />
    </div>
  );

  return (
    <div style={{
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      background: '#f8fafb',
      minHeight: '297mm',
      color: '#2d3748',
      fontSize: 11,
      lineHeight: 1.6,
    }}>
      {/* Top bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />

      <div style={{ padding: '22px 26px 26px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {info.photo && (
              <SafeImg src={info.photo} alt="" style={{ width: 70, height: 70, borderRadius: 8, objectFit: 'cover', border: '2px solid #e2e8f0', flexShrink: 0 }} />
            )}
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 25, fontWeight: 300, letterSpacing: '-0.4px', color: '#1a202c', lineHeight: 1.1 }}>{name}</h1>
              {info.title && <div style={{ fontSize: 12.5, color, fontWeight: 600 }}>{info.title}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 10.5, color: '#718096', lineHeight: 2 }}>
            {info.email && <div>{info.email}</div>}
            {info.phone && <div>{info.phone}</div>}
            {info.street && <div>{info.street}</div>}
            {info.location && <div>{info.location}</div>}
            {info.website && <div>{info.website}</div>}
            {info.linkedin && <div>{info.linkedin}</div>}
          </div>
        </div>

        {info.summary && (
          <p style={{ fontSize: 11.5, color: '#4a5568', lineHeight: 1.8, margin: '0 0 22px', maxWidth: '82%' }}>{info.summary}</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 26 }}>
          {/* Main */}
          <div>
            {workExperience.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <SectionHeading>Berufserfahrung</SectionHeading>
                {workExperience.map(job => (
                  <div key={job.id} style={{ marginBottom: 14, paddingLeft: 12, borderLeft: `2px solid ${color}` }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: '#1a202c' }}>{job.position}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, gap: 8 }}>
                      <span style={{ fontSize: 11.5, color, fontWeight: 600 }}>{job.company}</span>
                      <span style={{ fontSize: 10, color: '#a0aec0', flexShrink: 0 }}>{formatDate(job.startDate)}{job.startDate ? ' – ' : ''}{job.current ? 'heute' : formatDate(job.endDate)}</span>
                    </div>
                    {job.location && <div style={{ fontSize: 10, color: '#a0aec0' }}>{job.location}</div>}
                    {job.description && <p style={{ fontSize: 11, color: '#718096', marginTop: 5, lineHeight: 1.65 }}>{job.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {education.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <SectionHeading>Ausbildung</SectionHeading>
                {education.map(edu => (
                  <div key={edu.id} style={{ marginBottom: 11, paddingLeft: 12, borderLeft: '2px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#1a202c' }}>{edu.degree}{edu.field ? ` – ${edu.field}` : ''}</div>
                    <div style={{ fontSize: 11, color, fontWeight: 600 }}>{edu.institution}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 10, color: '#a0aec0' }}>{formatDate(edu.startDate)}{edu.startDate ? ' – ' : ''}{formatDate(edu.endDate)}</span>
                      {edu.grade && <span style={{ fontSize: 10, color: '#a0aec0' }}>Note: {edu.grade}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(customSections ?? []).filter(s => s.items.some(i => i.trim())).map(section => (
              <div key={section.id} style={{ marginBottom: 22 }}>
                <SectionHeading>{section.title || 'Eigene Sektion'}</SectionHeading>
                {section.items.filter(i => i.trim()).map((item, idx) => (
                  <div key={idx} style={{ fontSize: 11, marginBottom: 4, lineHeight: 1.6, color: '#718096' }}>{item}</div>
                ))}
              </div>
            ))}
          </div>

          {/* Side */}
          <div>
            {skills.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <SectionHeading>Skills</SectionHeading>
                {skills.map(skill => (
                  <div key={skill.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 3, color: '#2d3748' }}>{skill.name}</div>
                    <div style={{ height: 3, background: '#e2e8f0', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${skill.level * 20}%`, background: color, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {languages.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <SectionHeading>Sprachen</SectionHeading>
                {languages.map(lang => (
                  <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6, color: '#4a5568' }}>
                    <span style={{ fontWeight: 600 }}>{lang.name}</span>
                    <span style={{ color: '#a0aec0', fontSize: 10 }}>{lang.level}</span>
                  </div>
                ))}
              </div>
            )}

            {certificates.length > 0 && (
              <div>
                <SectionHeading>Zertifikate</SectionHeading>
                {certificates.map(cert => (
                  <div key={cert.id} style={{ marginBottom: 7 }}>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{cert.name}</div>
                    <div style={{ fontSize: 10, color: '#a0aec0' }}>{cert.issuer}</div>
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
