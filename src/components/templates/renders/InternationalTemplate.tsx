import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SafeImg } from './shared';

export default function InternationalTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, certificates } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"Georgia", "Times New Roman", serif', background: '#fff', minHeight: '297mm', padding: 0, color: '#1a1a1a' }}>
      {/* International/Euro CV style header */}
      <div style={{ background: `linear-gradient(180deg, ${color}15 0%, transparent 100%)`, padding: '24px 32px 20px', borderBottom: `2px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '0.02em' }}>{name}</h1>
            {info.title && <div style={{ fontSize: 13, color, marginTop: 4, fontStyle: 'italic' }}>{info.title}</div>}
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: '4px 20px', fontSize: 11, color: '#555' }}>
              {info.email && <span>✉ {info.email}</span>}
              {info.phone && <span>✆ {info.phone}</span>}
              {info.location && <span>⌂ {info.location}</span>}
              {info.linkedin && <span>in {info.linkedin}</span>}
              {info.website && <span>↗ {info.website}</span>}
            </div>
          </div>
          {info.photo && (
            <SafeImg src={info.photo} alt="" style={{ width: 88, height: 110, objectFit: 'cover', border: `1px solid #ccc`, marginLeft: 20 }} />
          )}
        </div>
      </div>

      <div style={{ padding: '20px 32px' }}>
        {info.summary && (
          <div style={{ marginBottom: 18 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ width: 140, verticalAlign: 'top', paddingRight: 16, paddingTop: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color }}>Profil</span>
                  </td>
                  <td>
                    <p style={{ fontSize: 12, color: '#444', lineHeight: 1.8, margin: 0 }}>{info.summary}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {workExperience.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ borderTop: `1px solid ${color}40`, paddingTop: 14, marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color }}>Berufserfahrung</span>
            </div>
            {workExperience.map(job => (
              <table key={job.id} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                <tbody>
                  <tr>
                    <td style={{ width: 140, verticalAlign: 'top', paddingRight: 16, fontSize: 10, color: '#888', lineHeight: 1.6 }}>
                      <div>{formatDate(job.startDate)} –</div>
                      <div>{job.current ? 'Heute' : formatDate(job.endDate)}</div>
                      {job.location && <div style={{ marginTop: 4, color: '#aaa' }}>{job.location}</div>}
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{job.position}</div>
                      <div style={{ fontSize: 12, color, fontStyle: 'italic', marginBottom: 4 }}>{job.company}</div>
                      {job.description && <p style={{ fontSize: 11, color: '#555', lineHeight: 1.7, margin: 0 }}>{job.description}</p>}
                    </td>
                  </tr>
                </tbody>
              </table>
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ borderTop: `1px solid ${color}40`, paddingTop: 14, marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color }}>Ausbildung</span>
            </div>
            {education.map(edu => (
              <table key={edu.id} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
                <tbody>
                  <tr>
                    <td style={{ width: 140, verticalAlign: 'top', paddingRight: 16, fontSize: 10, color: '#888', lineHeight: 1.6 }}>
                      <div>{formatDate(edu.startDate)} –</div>
                      <div>{formatDate(edu.endDate)}</div>
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                      <div style={{ fontSize: 11, color, fontStyle: 'italic' }}>{edu.institution}{edu.location ? `, ${edu.location}` : ''}</div>
                      {edu.grade && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>Note: {edu.grade}</div>}
                    </td>
                  </tr>
                </tbody>
              </table>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, borderTop: `1px solid ${color}40`, paddingTop: 14 }}>
          {skills.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color, marginBottom: 10 }}>Kenntnisse</div>
              {skills.map(sk => (
                <div key={sk.id} style={{ fontSize: 11, color: '#555', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{sk.name}</span>
                  <span style={{ color: '#aaa', fontSize: 10 }}>{'●'.repeat(sk.level)}{'○'.repeat(5 - sk.level)}</span>
                </div>
              ))}
            </div>
          )}

          {languages.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color, marginBottom: 10 }}>Sprachen</div>
              {languages.map(lang => (
                <div key={lang.id} style={{ fontSize: 11, color: '#555', marginBottom: 5 }}>
                  <div style={{ fontWeight: 600 }}>{lang.name}</div>
                  <div style={{ fontSize: 10, color: '#888' }}>{lang.level}</div>
                </div>
              ))}
            </div>
          )}

          {certificates.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color, marginBottom: 10 }}>Zertifikate</div>
              {certificates.map(cert => (
                <div key={cert.id} style={{ fontSize: 11, color: '#555', marginBottom: 5 }}>
                  <div style={{ fontWeight: 600 }}>{cert.name}</div>
                  <div style={{ fontSize: 10, color: '#888' }}>{cert.issuer}{cert.date ? ` · ${formatDate(cert.date)}` : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
