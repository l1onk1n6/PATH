import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SafeImg, fullAddress } from './shared';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

export default function BoldTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, customSections } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', background: '#000', color: '#fff', minHeight: '297mm' }}>
      {/* Bold header with accent stripe */}
      <div style={{ background: color, height: 6 }} />
      <div style={{ padding: '24px 28px', background: '#111' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {info.photo && <SafeImg src={info.photo} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover' }} />}
            <div>
              <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: '-1.5px', textTransform: 'uppercase' }}>{name}</h1>
              {info.title && <div style={{ fontSize: 13, color, fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{info.title}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
            {[info.email, info.phone, fullAddress(info), fmtDate(info.birthDate)].filter(Boolean).map((v, i) => <div key={i}>{v}</div>)}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24 }}>
        <div>
          {info.summary && (
            <div style={{ marginBottom: 20, borderLeft: `4px solid ${color}`, paddingLeft: 12 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0 }}>{info.summary}</p>
            </div>
          )}

          {workExperience.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color, marginBottom: 14 }}>Erfahrung</h2>
              {workExperience.map(job => (
                <div key={job.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.3px' }}>{job.position}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                      {formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{job.company}</div>
                  {job.description && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>{job.description}</p>}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginTop: 12 }} />
                </div>
              ))}
            </div>
          )}

          {education.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color, marginBottom: 14 }}>Ausbildung</h2>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{edu.degree}</div>
                  <div style={{ fontSize: 11, color, fontWeight: 700 }}>{edu.institution}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
                </div>
              ))}
            </div>
          )}

          {(customSections ?? []).filter(s => s.items.some(i => i.trim())).map(section => (
            <div key={section.id} style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color, marginBottom: 14 }}>{section.title || 'Eigene Sektion'}</h2>
              {section.items.filter(i => i.trim()).map((item, idx) => (
                <div key={idx} style={{ fontSize: 11, marginBottom: 4, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>{item}</div>
              ))}
            </div>
          ))}
        </div>

        <div>
          {skills.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color, marginBottom: 12 }}>Skills</h2>
              {skills.map(sk => (
                <div key={sk.id} style={{ marginBottom: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600 }}>{sk.name}</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${sk.level * 20}%`, background: color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {languages.length > 0 && (
            <div>
              <h2 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color, marginBottom: 12 }}>Sprachen</h2>
              {languages.map(lang => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600 }}>{lang.name}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{lang.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
