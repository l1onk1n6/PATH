import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SafeImg } from './shared';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

export default function ModernTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, certificates, customSections } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  const SideLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.55)', marginBottom: 10, marginTop: 18 }}>{children}</div>
  );

  const MainLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 3, height: 14, background: color, borderRadius: 2 }} />
      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#1a1a2e' }}>{children}</span>
    </div>
  );

  return (
    <div style={{
      fontFamily: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
      background: '#ffffff',
      minHeight: '297mm',
      display: 'flex',
    }}>
      {/* Sidebar */}
      <div style={{ width: '33%', background: '#1a1a2e', color: '#fff', padding: '28px 18px', display: 'flex', flexDirection: 'column', gap: 0, flexShrink: 0 }}>
        {info.photo && (
          <SafeImg src={info.photo} alt="" style={{
            width: 90, height: 90, borderRadius: '50%', objectFit: 'cover',
            border: `3px solid ${color}`, marginBottom: 16, display: 'block',
          }} />
        )}
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', lineHeight: 1.2, color: '#fff', letterSpacing: '-0.3px' }}>{name}</h1>
        {info.title && (
          <div style={{ fontSize: 10.5, color, fontWeight: 600, marginBottom: 16, lineHeight: 1.4 }}>{info.title}</div>
        )}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14 }}>
          <SideLabel>Kontakt</SideLabel>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.9 }}>
            {info.email && <div>{info.email}</div>}
            {info.phone && <div>{info.phone}</div>}
            {info.street && <div>{info.street}</div>}
            {info.location && <div>{info.location}</div>}
            {info.website && <div>{info.website}</div>}
            {info.linkedin && <div>{info.linkedin}</div>}
            {info.birthDate && <div>{fmtDate(info.birthDate)}</div>}
          </div>
        </div>

        {skills.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14, marginTop: 14 }}>
            <SideLabel>Fähigkeiten</SideLabel>
            {skills.map(skill => (
              <div key={skill.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{skill.name}</span>
                  {skill.category && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>{skill.category}</span>}
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${skill.level * 20}%`, background: color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {languages.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14, marginTop: 14 }}>
            <SideLabel>Sprachen</SideLabel>
            {languages.map(lang => (
              <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 6, color: 'rgba(255,255,255,0.8)' }}>
                <span style={{ fontWeight: 600 }}>{lang.name}</span>
                <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)' }}>{lang.level}</span>
              </div>
            ))}
          </div>
        )}

        {certificates.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14, marginTop: 14 }}>
            <SideLabel>Zertifikate</SideLabel>
            {certificates.map(cert => (
              <div key={cert.id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#fff' }}>{cert.name}</div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)' }}>{cert.issuer}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '28px 22px', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}>
        {info.summary && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: `${color}0d`, borderRadius: 6, borderLeft: `3px solid ${color}` }}>
            <p style={{ margin: 0, fontSize: 11.5, color: '#3a3a4c', lineHeight: 1.75 }}>{info.summary}</p>
          </div>
        )}

        {workExperience.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <MainLabel>Berufserfahrung</MainLabel>
            {workExperience.map(job => (
              <div key={job.id} style={{ marginBottom: 14, paddingLeft: 14, borderLeft: '2px solid #f0f0f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{job.position}</div>
                    <div style={{ fontSize: 11.5, color, fontWeight: 600 }}>{job.company}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#9696a8', textAlign: 'right', flexShrink: 0 }}>
                    {job.location && <div>{job.location}</div>}
                    <div>{formatDate(job.startDate)}{job.startDate ? ' – ' : ''}{job.current ? 'heute' : formatDate(job.endDate)}</div>
                  </div>
                </div>
                {job.description && <p style={{ fontSize: 11, color: '#555', marginTop: 5, lineHeight: 1.65 }}>{job.description}</p>}
              </div>
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <MainLabel>Ausbildung</MainLabel>
            {education.map(edu => (
              <div key={edu.id} style={{ marginBottom: 12, paddingLeft: 14, borderLeft: '2px solid #f0f0f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}</div>
                    {edu.field && <div style={{ fontSize: 11, color: '#555' }}>{edu.field}</div>}
                    <div style={{ fontSize: 11, color, fontWeight: 600 }}>{edu.institution}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#9696a8', textAlign: 'right', flexShrink: 0 }}>
                    <div>{formatDate(edu.startDate)}{edu.startDate ? ' – ' : ''}{formatDate(edu.endDate)}</div>
                    {edu.grade && <div>Note: {edu.grade}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {(customSections ?? []).filter(s => s.items.some(i => i.trim())).map(section => (
          <div key={section.id} style={{ marginBottom: 22 }}>
            <MainLabel>{section.title || 'Eigene Sektion'}</MainLabel>
            {section.items.filter(i => i.trim()).map((item, idx) => (
              <div key={idx} style={{ fontSize: 11, marginBottom: 4, lineHeight: 1.6, color: '#555' }}>{item}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
