import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SafeImg } from './shared';

export default function MinimalTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, certificates } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  const SectionHeading = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: `${color}33` }} />
    </div>
  );

  return (
    <div style={{
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      background: '#fff',
      color: '#1c1c1e',
      minHeight: '297mm',
      padding: '14mm 16mm',
      fontSize: 11,
      lineHeight: 1.55,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          {info.photo && (
            <SafeImg src={info.photo} alt="" style={{ width: 76, height: 76, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 3px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px', color: '#1c1c1e', lineHeight: 1.1 }}>{name}</h1>
            {info.title && (
              <div style={{ fontSize: 13, fontWeight: 500, color, marginBottom: 10 }}>{info.title}</div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 18px', fontSize: 10.5, color: '#6e6e73' }}>
              {info.email && <span>{info.email}</span>}
              {info.phone && <span>{info.phone}</span>}
              {(info.street || info.location) && <span>{[info.street, info.location].filter(Boolean).join(', ')}</span>}
              {info.website && <span>{info.website}</span>}
              {info.linkedin && <span>{info.linkedin}</span>}
            </div>
          </div>
        </div>
        {info.summary && (
          <p style={{ margin: '14px 0 0', fontSize: 11, color: '#444', lineHeight: 1.7, borderLeft: `3px solid ${color}`, paddingLeft: 12 }}>{info.summary}</p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 185px', gap: 26 }}>
        {/* Main column */}
        <div>
          {workExperience.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SectionHeading>Berufserfahrung</SectionHeading>
              {workExperience.map(job => (
                <div key={job.id} style={{ marginBottom: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 12.5 }}>{job.position}</span>
                      {job.company && <span style={{ fontSize: 11.5, color, fontWeight: 600 }}> · {job.company}</span>}
                    </div>
                    <span style={{ fontSize: 10, color: '#8e8e93', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatDate(job.startDate)}{job.startDate ? ' – ' : ''}{job.current ? 'heute' : formatDate(job.endDate)}
                    </span>
                  </div>
                  {job.location && <div style={{ fontSize: 10, color: '#8e8e93', marginTop: 1 }}>{job.location}</div>}
                  {job.description && <p style={{ fontSize: 11, color: '#555', marginTop: 4, lineHeight: 1.6 }}>{job.description}</p>}
                </div>
              ))}
            </div>
          )}

          {education.length > 0 && (
            <div>
              <SectionHeading>Ausbildung</SectionHeading>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}</span>
                      {edu.field && <span style={{ fontSize: 11, color: '#555' }}> – {edu.field}</span>}
                    </div>
                    <span style={{ fontSize: 10, color: '#8e8e93', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatDate(edu.startDate)}{edu.startDate ? ' – ' : ''}{formatDate(edu.endDate)}
                    </span>
                  </div>
                  {edu.institution && <div style={{ fontSize: 11, color, fontWeight: 500 }}>{edu.institution}</div>}
                  {edu.grade && <div style={{ fontSize: 10, color: '#8e8e93' }}>Note: {edu.grade}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side column */}
        <div>
          {skills.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <SectionHeading>Fähigkeiten</SectionHeading>
              {skills.map(skill => (
                <div key={skill.id} style={{ marginBottom: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ fontWeight: 500 }}>{skill.name}</span>
                  </div>
                  <div style={{ height: 3, background: '#f0f0f0', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${skill.level * 20}%`, background: color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {languages.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <SectionHeading>Sprachen</SectionHeading>
              {languages.map(lang => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5, alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>{lang.name}</span>
                  <span style={{ fontSize: 10, color: '#8e8e93' }}>{lang.level}</span>
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
                  <div style={{ fontSize: 10, color: '#8e8e93' }}>{cert.issuer}{cert.date ? ` · ${formatDate(cert.date)}` : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
