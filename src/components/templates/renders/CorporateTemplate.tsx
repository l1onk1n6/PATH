import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SkillDots } from './shared';

export default function CorporateTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, certificates } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: 'Georgia, serif', background: '#fff', minHeight: '297mm', display: 'flex' }}>
      <div style={{ width: '32%', background: '#1e3a5f', color: '#fff', padding: '24px 16px' }}>
        {info.photo && <img src={info.photo} alt="" style={{ width: '80%', borderRadius: 4, marginBottom: 14, display: 'block', margin: '0 auto 14px' }} />}
        <h1 style={{ fontSize: 16, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>{name}</h1>
        {info.title && <div style={{ fontSize: 11, textAlign: 'center', color, marginBottom: 16 }}>{info.title}</div>}

        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 20, lineHeight: 1.8 }}>
          {[info.email, info.phone, info.location].filter(Boolean).map((v, i) => <div key={i}>{v}</div>)}
        </div>

        <div style={{ borderTop: `1px solid rgba(255,255,255,0.15)`, paddingTop: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color, marginBottom: 10 }}>Kernkompetenzen</div>
          {skills.map(sk => <SkillDots key={sk.id} skill={sk} color={color} />)}
        </div>

        {languages.length > 0 && (
          <div style={{ borderTop: `1px solid rgba(255,255,255,0.15)`, paddingTop: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color, marginBottom: 10 }}>Sprachen</div>
            {languages.map(lang => (
              <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4, color: 'rgba(255,255,255,0.8)' }}>
                <span>{lang.name}</span>
                <span style={{ opacity: 0.6, fontSize: 9 }}>{lang.level}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '24px 20px' }}>
        {info.summary && (
          <div style={{ marginBottom: 20, borderBottom: `2px solid ${color}`, paddingBottom: 14 }}>
            <p style={{ fontSize: 11, color: '#4a5568', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{info.summary}</p>
          </div>
        )}

        {workExperience.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Berufserfahrung</h2>
            {workExperience.map(job => (
              <div key={job.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{job.position}</div>
                  <div style={{ fontSize: 10, color: '#718096' }}>{formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)}</div>
                </div>
                <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 4 }}>{job.company} · {job.location}</div>
                {job.description && <p style={{ fontSize: 11, color: '#555', lineHeight: 1.5, margin: 0 }}>{job.description}</p>}
              </div>
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Ausbildung</h2>
            {education.map(edu => (
              <div key={edu.id} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree} – {edu.field}</div>
                <div style={{ fontSize: 11, color }}>{edu.institution}</div>
                <div style={{ fontSize: 10, color: '#718096' }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
              </div>
            ))}
          </div>
        )}

        {certificates.length > 0 && (
          <div>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Zertifikate</h2>
            {certificates.map(cert => (
              <div key={cert.id} style={{ marginBottom: 6, fontSize: 11 }}>
                <span style={{ fontWeight: 600 }}>{cert.name}</span> · <span style={{ color: '#718096' }}>{cert.issuer}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
