import type { Resume } from '../../../types/resume';
import { fullName, formatDate, WorkEntry, EduEntry, SkillBar } from './shared';

export default function MinimalTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, certificates } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{
      fontFamily: 'Georgia, "Times New Roman", serif',
      background: '#fff',
      color: '#1a1a1a',
      minHeight: '297mm',
      padding: '16mm 18mm',
      fontSize: 12,
      lineHeight: 1.5,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20, borderBottom: `2px solid ${color}`, paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {info.photo && (
            <img src={info.photo} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}` }} />
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' }}>{name}</h1>
            {info.title && <div style={{ fontSize: 14, color, fontWeight: 600, marginTop: 2 }}>{info.title}</div>}
            <div style={{ fontSize: 11, color: '#666', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              {info.email && <span>{info.email}</span>}
              {info.phone && <span>{info.phone}</span>}
              {info.location && <span>{info.location}</span>}
              {info.website && <span>{info.website}</span>}
            </div>
          </div>
        </div>
      </div>

      {info.summary && (
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Profil</h2>
          <p style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}>{info.summary}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left */}
        <div>
          {workExperience.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, borderBottom: `1px solid ${color}20`, paddingBottom: 4 }}>Berufserfahrung</h2>
              {workExperience.map(job => <WorkEntry key={job.id} job={job} color={color} />)}
            </div>
          )}
          {education.length > 0 && (
            <div>
              <h2 style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, borderBottom: `1px solid ${color}20`, paddingBottom: 4 }}>Ausbildung</h2>
              {education.map(edu => <EduEntry key={edu.id} edu={edu} color={color} />)}
            </div>
          )}
        </div>

        {/* Right */}
        <div>
          {skills.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Fähigkeiten</h2>
              {skills.map(skill => <SkillBar key={skill.id} skill={skill} color={color} />)}
            </div>
          )}
          {languages.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Sprachen</h2>
              {languages.map(lang => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span>{lang.name}</span>
                  <span style={{ color: '#666' }}>{lang.level}</span>
                </div>
              ))}
            </div>
          )}
          {certificates.length > 0 && (
            <div>
              <h2 style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Zertifikate</h2>
              {certificates.map(cert => (
                <div key={cert.id} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{cert.name}</div>
                  <div style={{ fontSize: 10, color: '#666' }}>{cert.issuer} · {formatDate(cert.date)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
