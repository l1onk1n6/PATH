import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SafeImg, fullAddress } from './shared';

export default function CreativeTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, customSections } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '-apple-system, "Segoe UI", sans-serif', background: '#fff', minHeight: '297mm' }}>
      {/* Gradient Header */}
      <div style={{
        background: `linear-gradient(135deg, ${color}, ${color}88)`,
        padding: '28px 24px 20px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}>
        {info.photo ? (
          <SafeImg src={info.photo} alt="" style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.5)', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700 }}>
            {name.charAt(0)}
          </div>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-1px' }}>{name}</h1>
          {info.title && <div style={{ fontSize: 14, opacity: 0.9, marginTop: 3 }}>{info.title}</div>}
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[info.email, info.phone, fullAddress(info)].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
        {/* Main */}
        <div>
          {info.summary && (
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 13, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Über mich</h2>
              <p style={{ fontSize: 11, color: '#555', lineHeight: 1.7 }}>{info.summary}</p>
            </div>
          )}

          {workExperience.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 13, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Erfahrung</h2>
              {workExperience.map(job => (
                <div key={job.id} style={{ marginBottom: 14, display: 'flex', gap: 12 }}>
                  <div style={{ width: 3, background: color, borderRadius: 2, alignSelf: 'stretch', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{job.position}</div>
                    <div style={{ fontSize: 12, color, fontWeight: 600 }}>{job.company}</div>
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>{job.location} · {formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)}</div>
                    {job.description && <p style={{ fontSize: 11, color: '#555', lineHeight: 1.5, margin: 0 }}>{job.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {education.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 13, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Ausbildung</h2>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}</div>
                  <div style={{ fontSize: 11, color }}>{edu.institution}</div>
                  <div style={{ fontSize: 10, color: '#888' }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
                </div>
              ))}
            </div>
          )}

          {(customSections ?? []).filter(s => s.items.some(i => i.trim())).map(section => (
            <div key={section.id} style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 13, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{section.title || 'Eigene Sektion'}</h2>
              {section.items.filter(i => i.trim()).map((item, idx) => (
                <div key={idx} style={{ fontSize: 11, marginBottom: 4, lineHeight: 1.6, color: '#555' }}>{item}</div>
              ))}
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div>
          {skills.length > 0 && (
            <div style={{ marginBottom: 18, background: `${color}10`, borderRadius: 12, padding: 14 }}>
              <h2 style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Skills</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {skills.map(skill => (
                  <span key={skill.id} style={{
                    padding: '4px 10px', borderRadius: 20, background: color,
                    color: '#fff', fontSize: 10, fontWeight: 600,
                    opacity: 0.6 + skill.level * 0.08,
                  }}>{skill.name}</span>
                ))}
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <div style={{ background: `${color}10`, borderRadius: 12, padding: 14 }}>
              <h2 style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Sprachen</h2>
              {languages.map(lang => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600 }}>{lang.name}</span>
                  <span style={{ color: '#888' }}>{lang.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
