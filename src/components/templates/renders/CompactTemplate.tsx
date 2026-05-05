import type { Resume } from '../../../types/resume';
import { fullName, formatDate } from './shared-utils';

function Section({ title, color }: { title: string; color: string }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color, borderBottom: `1px solid ${color}`, paddingBottom: 2, marginBottom: 6, marginTop: 14 }}>
      {title}
    </div>
  );
}

export default function CompactTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, certificates } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"Arial Narrow", Arial, sans-serif', background: '#fff', minHeight: '297mm', padding: '18px 22px', color: '#111', fontSize: 11 }}>
      {/* Compact header */}
      <div style={{ borderBottom: `2px solid ${color}`, paddingBottom: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>{name}</h1>
            {info.title && <div style={{ fontSize: 11, color, fontWeight: 600 }}>{info.title}</div>}
          </div>
          <div style={{ textAlign: 'right', fontSize: 10, color: '#555', lineHeight: 1.7 }}>
            {[info.email, info.phone, info.location, info.linkedin, info.github].filter(Boolean).map((v, i) => (
              <span key={i} style={{ marginLeft: 12 }}>{v}</span>
            ))}
          </div>
        </div>
      </div>

      {info.summary && (
        <p style={{ fontSize: 10, color: '#444', lineHeight: 1.5, marginBottom: 0 }}>{info.summary}</p>
      )}

      {workExperience.length > 0 && (
        <>
          <Section color={color} title="Berufserfahrung" />
          {workExperience.map(job => (
            <div key={job.id} style={{ marginBottom: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>{job.position}</span>
                <span style={{ color: '#888', fontSize: 10 }}>{formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)}</span>
              </div>
              <div style={{ color: '#555', fontSize: 10 }}>{job.company}{job.location ? ` | ${job.location}` : ''}</div>
              {job.description && <div style={{ fontSize: 10, color: '#666', marginTop: 2, lineHeight: 1.4 }}>{job.description}</div>}
            </div>
          ))}
        </>
      )}

      {education.length > 0 && (
        <>
          <Section color={color} title="Ausbildung" />
          {education.map(edu => (
            <div key={edu.id} style={{ marginBottom: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>{edu.degree}{edu.field ? `, ${edu.field}` : ''}</span>
                <span style={{ color: '#888', fontSize: 10 }}>{formatDate(edu.endDate)}</span>
              </div>
              <div style={{ color: '#555', fontSize: 10 }}>{edu.institution}{edu.location ? ` | ${edu.location}` : ''}{edu.grade ? ` | Note: ${edu.grade}` : ''}</div>
            </div>
          ))}
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 2 }}>
        {skills.length > 0 && (
          <div>
            <Section color={color} title="Fähigkeiten" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {skills.map(sk => (
                <span key={sk.id} style={{ fontSize: 10, padding: '1px 7px', border: `1px solid ${color}50`, borderRadius: 2, color: '#444' }}>{sk.name}</span>
              ))}
            </div>
          </div>
        )}
        <div>
          {languages.length > 0 && (
            <>
              <Section color={color} title="Sprachen" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {languages.map(lang => (
                  <span key={lang.id} style={{ fontSize: 10, color: '#444' }}>{lang.name} ({lang.level})</span>
                ))}
              </div>
            </>
          )}
          {certificates.length > 0 && (
            <>
              <Section color={color} title="Zertifikate" />
              {certificates.map(cert => (
                <div key={cert.id} style={{ fontSize: 10, color: '#444', marginBottom: 2 }}>
                  {cert.name} – {cert.issuer}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
