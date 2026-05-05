import type { Resume } from '../../../types/resume';
import { fullName, formatDate } from './shared-utils';
import { SafeImg } from './shared';

function SideLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.5)', marginBottom: 9, marginTop: 16 }}>{children}</div>;
}

function MainHeading({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h2 style={{ fontFamily: '"Merriweather", Georgia, serif', fontSize: 11, fontWeight: 700, color: '#1e3a5f', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{children}</h2>
      <div style={{ height: 2, background: color, width: 32, borderRadius: 1 }} />
    </div>
  );
}

export default function CorporateTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, certificates } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{
      fontFamily: '"Lato", "Helvetica Neue", Arial, sans-serif',
      background: '#ffffff',
      minHeight: '297mm',
      display: 'flex',
    }}>
      {/* Sidebar */}
      <div style={{ width: '30%', background: '#1e3a5f', color: '#fff', padding: '28px 16px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        {info.photo && (
          <SafeImg src={info.photo} alt="" style={{
            width: 84, height: 84, borderRadius: 4, objectFit: 'cover',
            display: 'block', margin: '0 auto 16px', border: `2px solid ${color}`,
          }} />
        )}
        <h1 style={{ fontFamily: '"Merriweather", Georgia, serif', fontSize: 15.5, fontWeight: 700, textAlign: 'center', margin: '0 0 4px', lineHeight: 1.3, color: '#fff' }}>{name}</h1>
        {info.title && (
          <div style={{ fontSize: 10.5, textAlign: 'center', color, marginBottom: 16, fontWeight: 400, lineHeight: 1.4 }}>{info.title}</div>
        )}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 14 }}>
          <SideLabel>Kontakt</SideLabel>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', lineHeight: 2 }}>
            {info.email && <div>{info.email}</div>}
            {info.phone && <div>{info.phone}</div>}
            {info.street && <div>{info.street}</div>}
            {info.location && <div>{info.location}</div>}
            {info.website && <div>{info.website}</div>}
            {info.linkedin && <div>{info.linkedin}</div>}
          </div>
        </div>

        {skills.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 14 }}>
            <SideLabel>Kernkompetenzen</SideLabel>
            {skills.map(skill => (
              <div key={skill.id} style={{ marginBottom: 7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 3, color: 'rgba(255,255,255,0.85)' }}>
                  <span>{skill.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ width: '18%', height: 3, borderRadius: 2, background: skill.level >= i ? color : 'rgba(255,255,255,0.15)' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {languages.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 14 }}>
            <SideLabel>Sprachen</SideLabel>
            {languages.map(lang => (
              <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 10.5, marginBottom: 5, color: 'rgba(255,255,255,0.8)' }}>
                <span style={{ fontWeight: 700 }}>{lang.name}</span>
                <span style={{ fontSize: 9.5, opacity: 0.55 }}>{lang.level}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '28px 20px', fontSize: 11, color: '#2c2c2c' }}>
        {info.summary && (
          <div style={{ marginBottom: 22, padding: '12px 14px', background: '#f7f9fc', borderLeft: `3px solid ${color}`, borderRadius: '0 4px 4px 0' }}>
            <p style={{ fontSize: 11.5, color: '#444', lineHeight: 1.75, margin: 0, fontStyle: 'italic', fontFamily: '"Merriweather", Georgia, serif', fontWeight: 300 }}>{info.summary}</p>
          </div>
        )}

        {workExperience.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <MainHeading color={color}>Berufserfahrung</MainHeading>
            {workExperience.map(job => (
              <div key={job.id} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: '#1a1a1a' }}>{job.position}</div>
                    <div style={{ fontSize: 11.5, color, fontWeight: 700 }}>{job.company}{job.location ? ` · ${job.location}` : ''}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#888', textAlign: 'right', flexShrink: 0 }}>
                    {formatDate(job.startDate)}{job.startDate ? ' – ' : ''}{job.current ? 'heute' : formatDate(job.endDate)}
                  </div>
                </div>
                {job.description && <p style={{ fontSize: 11, color: '#555', lineHeight: 1.6, margin: '5px 0 0' }}>{job.description}</p>}
              </div>
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <MainHeading color={color}>Ausbildung</MainHeading>
            {education.map(edu => (
              <div key={edu.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}{edu.field ? ` – ${edu.field}` : ''}</div>
                    <div style={{ fontSize: 11, color, fontWeight: 600 }}>{edu.institution}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#888', flexShrink: 0 }}>
                    {formatDate(edu.startDate)}{edu.startDate ? ' – ' : ''}{formatDate(edu.endDate)}
                    {edu.grade ? ` · Note: ${edu.grade}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {certificates.length > 0 && (
          <div>
            <MainHeading color={color}>Zertifikate</MainHeading>
            {certificates.map(cert => (
              <div key={cert.id} style={{ marginBottom: 7, fontSize: 11 }}>
                <span style={{ fontWeight: 700 }}>{cert.name}</span>
                {cert.issuer && <span style={{ color: '#888' }}> · {cert.issuer}</span>}
                {cert.date && <span style={{ color: '#888' }}> · {formatDate(cert.date)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
