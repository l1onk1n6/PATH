import type { Resume } from '../../../types/resume';
import { fullName, formatDate } from './shared-utils';
import { SafeImg } from './shared';
import { useT } from '../../../lib/i18n';

function SectionHeading({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ fontFamily: '"Lora", Georgia, serif', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: '#2c2c2c', margin: '0 0 6px', fontStyle: 'normal' }}>{children}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 24, height: 1.5, background: color }} />
        <div style={{ flex: 1, height: 1, background: '#e8e0d5' }} />
      </div>
    </div>
  );
}

export default function ElegantTemplate({ resume }: { resume: Resume }) {
  const t = useT();
  const { personalInfo: info, workExperience, education, skills, languages, certificates } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{
      fontFamily: '"Lato", "Helvetica Neue", Arial, sans-serif',
      background: '#fdfcf9',
      color: '#2c2c2c',
      minHeight: '297mm',
      padding: '16mm 18mm',
      fontSize: 11,
      lineHeight: 1.6,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 26, paddingBottom: 22, borderBottom: '1px solid #e8e0d5' }}>
        {info.photo && (
          <SafeImg src={info.photo} alt="" style={{
            width: 88, height: 88, borderRadius: '50%', objectFit: 'cover',
            border: `3px solid ${color}`, marginBottom: 14, display: 'block', margin: '0 auto 14px',
          }} />
        )}
        <h1 style={{
          fontFamily: '"Lora", Georgia, serif', margin: '0 0 5px',
          fontSize: 32, fontWeight: 700, letterSpacing: '0.02em', color: '#1a1a1a', lineHeight: 1.1,
        }}>{name}</h1>
        {info.title && (
          <div style={{ fontSize: 13, color, fontWeight: 400, fontStyle: 'italic', marginBottom: 12 }}>{info.title}</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '4px 20px', fontSize: 10.5, color: '#888' }}>
          {info.email && <span>{info.email}</span>}
          {info.phone && <span>{info.phone}</span>}
          {(info.street || info.location) && <span>{[info.street, info.location].filter(Boolean).join(', ')}</span>}
          {info.website && <span>{info.website}</span>}
          {info.linkedin && <span>{info.linkedin}</span>}
        </div>
      </div>

      {info.summary && (
        <div style={{ textAlign: 'center', maxWidth: '78%', margin: '0 auto 24px' }}>
          <p style={{ fontStyle: 'italic', fontSize: 12, color: '#555', lineHeight: 1.8, margin: 0 }}>{info.summary}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 190px', gap: 28 }}>
        {/* Main */}
        <div>
          {workExperience.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <SectionHeading color={color}>{t("Berufserfahrung")}</SectionHeading>
              {workExperience.map(job => (
                <div key={job.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12.5 }}>{job.position}</div>
                      <div style={{ fontSize: 11.5, color, fontStyle: 'italic' }}>{job.company}</div>
                    </div>
                    <div style={{ fontSize: 10, color: '#999', textAlign: 'right', flexShrink: 0 }}>
                      {job.location && <div>{job.location}</div>}
                      <div>{formatDate(job.startDate)}{job.startDate ? ' – ' : ''}{job.current ? t('heute') : formatDate(job.endDate)}</div>
                    </div>
                  </div>
                  {job.description && <p style={{ fontSize: 11, color: '#555', marginTop: 4, lineHeight: 1.65 }}>{job.description}</p>}
                </div>
              ))}
            </div>
          )}

          {education.length > 0 && (
            <div>
              <SectionHeading color={color}>{t("Ausbildung")}</SectionHeading>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}</div>
                      {edu.field && <div style={{ fontSize: 11, color: '#666' }}>{edu.field}</div>}
                      <div style={{ fontSize: 11, color, fontStyle: 'italic' }}>{edu.institution}</div>
                    </div>
                    <div style={{ fontSize: 10, color: '#999', textAlign: 'right', flexShrink: 0 }}>
                      <div>{formatDate(edu.startDate)}{edu.startDate ? ' – ' : ''}{formatDate(edu.endDate)}</div>
                      {edu.grade && <div>{t('Note')} {edu.grade}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side */}
        <div>
          {skills.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SectionHeading color={color}>{t("Fähigkeiten")}</SectionHeading>
              {skills.map(skill => (
                <div key={skill.id} style={{ marginBottom: 7 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 3 }}>{skill.name}</div>
                  <div style={{ height: 3, background: '#e8e0d5', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${skill.level * 20}%`, background: color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {languages.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <SectionHeading color={color}>{t("Sprachen")}</SectionHeading>
              {languages.map(lang => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 11, marginBottom: 6, borderBottom: '1px dotted #e0d8cc', paddingBottom: 5 }}>
                  <span style={{ fontStyle: 'italic' }}>{lang.name}</span>
                  <span style={{ color: '#999', fontSize: 10 }}>{lang.level}</span>
                </div>
              ))}
            </div>
          )}

          {certificates.length > 0 && (
            <div>
              <SectionHeading color={color}>{t("Zertifikate")}</SectionHeading>
              {certificates.map(cert => (
                <div key={cert.id} style={{ marginBottom: 7 }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{cert.name}</div>
                  <div style={{ fontSize: 10, color: '#999', fontStyle: 'italic' }}>{cert.issuer}{cert.date ? ` · ${formatDate(cert.date)}` : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
