import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SkillDots, SafeImg, fullAddress } from './shared';

export default function ExecutiveTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '-apple-system, "Segoe UI", sans-serif', background: '#fff', color: '#1a1a1a', minHeight: '297mm', display: 'flex' }}>
      {/* Left sidebar */}
      <div style={{ width: '35%', background: '#1a1a2e', color: '#fff', padding: '24px 18px', flexShrink: 0 }}>
        {info.photo && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <SafeImg src={info.photo} alt="" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${color}` }} />
          </div>
        )}
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4, lineHeight: 1.2 }}>{name}</h1>
        {info.title && <div style={{ fontSize: 12, color, fontWeight: 600, marginBottom: 16 }}>{info.title}</div>}

        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
          {[info.email, info.phone, fullAddress(info), info.linkedin].filter(Boolean).map((v, i) => (
            <div key={i} style={{ marginBottom: 4 }}>{v}</div>
          ))}
        </div>

        {skills.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Kompetenzen</div>
            {skills.map(skill => <SkillDots key={skill.id} skill={skill} color={color} />)}
          </div>
        )}

        {languages.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Sprachen</div>
            {languages.map(lang => (
              <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: 'rgba(255,255,255,0.8)' }}>
                <span>{lang.name}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{lang.level}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right content */}
      <div style={{ flex: 1, padding: '24px 20px' }}>
        {info.summary && (
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `2px solid ${color}` }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Executive Summary</h2>
            <p style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}>{info.summary}</p>
          </div>
        )}

        {workExperience.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Berufliche Laufbahn</h2>
            {workExperience.map(job => (
              <div key={job.id} style={{ marginBottom: 14, paddingLeft: 12, borderLeft: `2px solid ${color}30` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{job.position}</div>
                    <div style={{ fontSize: 11, color, fontWeight: 600 }}>{job.company} · {job.location}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#888' }}>
                    {formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)}
                  </div>
                </div>
                {job.description && <p style={{ fontSize: 11, color: '#555', marginTop: 4, lineHeight: 1.5 }}>{job.description}</p>}
              </div>
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div>
            <h2 style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Ausbildung</h2>
            {education.map(edu => (
              <div key={edu.id} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree} – {edu.field}</div>
                <div style={{ fontSize: 11, color, fontWeight: 600 }}>{edu.institution}</div>
                <div style={{ fontSize: 10, color: '#888' }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
