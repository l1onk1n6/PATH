import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SafeImg, fullAddress } from './shared';

export default function VibrantTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, customSections } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"Inter", Arial, sans-serif', background: '#fff', minHeight: '297mm' }}>
      {/* Vibrant diagonal header */}
      <div style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 60%, ${color}44 100%)`,
        padding: '32px 28px 48px',
        clipPath: 'polygon(0 0, 100% 0, 100% 75%, 0 100%)',
        marginBottom: -20,
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {info.photo ? (
            <SafeImg src={info.photo} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.6)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>
              {name.charAt(0)}
            </div>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: '-0.8px' }}>{name}</h1>
            {info.title && <div style={{ fontSize: 14, opacity: 0.9, fontWeight: 500, marginTop: 4 }}>{info.title}</div>}
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 8, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[info.email, info.phone, fullAddress(info)].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 28px 20px', display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24 }}>
        <div>
          {info.summary && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#555', lineHeight: 1.7, margin: 0 }}>{info.summary}</p>
            </div>
          )}
          {workExperience.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, paddingBottom: 6, borderBottom: `2px solid ${color}20` }}>Erfahrung</h2>
              {workExperience.map(job => (
                <div key={job.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a' }}>{job.position}</div>
                      <div style={{ fontSize: 12, color, fontWeight: 600 }}>{job.company}</div>
                    </div>
                    <div style={{ fontSize: 10, color: '#999', textAlign: 'right' }}>
                      <div>{job.location}</div>
                      <div>{formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)}</div>
                    </div>
                  </div>
                  {job.description && <p style={{ fontSize: 11, color: '#666', marginTop: 5, lineHeight: 1.6 }}>{job.description}</p>}
                </div>
              ))}
            </div>
          )}
          {education.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, paddingBottom: 6, borderBottom: `2px solid ${color}20` }}>Ausbildung</h2>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}</div>
                  <div style={{ fontSize: 11, color }}>{edu.institution}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
                </div>
              ))}
            </div>
          )}

          {(customSections ?? []).filter(s => s.items.some(i => i.trim())).map(section => (
            <div key={section.id} style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, paddingBottom: 6, borderBottom: `2px solid ${color}20` }}>{section.title || 'Eigene Sektion'}</h2>
              {section.items.filter(i => i.trim()).map((item, idx) => (
                <div key={idx} style={{ fontSize: 11, marginBottom: 4, lineHeight: 1.6, color: '#666' }}>{item}</div>
              ))}
            </div>
          ))}
        </div>

        <div>
          {skills.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Skills</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {skills.map(sk => (
                  <span key={sk.id} style={{
                    fontSize: 10, padding: '4px 10px', borderRadius: 20,
                    background: sk.level >= 4 ? color : `${color}18`,
                    color: sk.level >= 4 ? '#fff' : color,
                    fontWeight: 600, border: `1px solid ${color}40`,
                  }}>{sk.name}</span>
                ))}
              </div>
            </div>
          )}
          {languages.length > 0 && (
            <div>
              <h2 style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Sprachen</h2>
              {languages.map(lang => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: '#333' }}>{lang.name}</span>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 10,
                    background: `${color}15`, color, fontWeight: 600,
                  }}>{lang.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
