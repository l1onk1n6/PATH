import type { Resume } from '../../../types/resume';
import { fullName, formatDate, SkillBar } from './shared';

export default function MagazineTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, languages, projects } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif', background: '#fff', minHeight: '297mm', display: 'grid', gridTemplateColumns: '280px 1fr' }}>
      {/* Left column */}
      <div style={{ background: '#1a1a1a', color: '#fff', padding: '28px 20px' }}>
        {info.photo ? (
          <img src={info.photo} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', marginBottom: 16, display: 'block' }} />
        ) : (
          <div style={{ width: '100%', aspectRatio: '1', background: `${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900, color, marginBottom: 16 }}>
            {name.charAt(0)}
          </div>
        )}

        <h1 style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.1, margin: '0 0 4px', letterSpacing: '-0.5px' }}>{name}</h1>
        {info.title && <div style={{ fontSize: 11, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>{info.title}</div>}

        <div style={{ borderTop: `1px solid #333`, paddingTop: 14, marginBottom: 18 }}>
          {[
            { label: 'E-Mail', value: info.email },
            { label: 'Telefon', value: info.phone },
            { label: 'Ort', value: info.location },
            { label: 'Web', value: info.website },
          ].filter(i => i.value).map(({ label, value }) => (
            <div key={label} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
              <div style={{ fontSize: 11, color: '#ddd' }}>{value}</div>
            </div>
          ))}
        </div>

        {skills.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 9, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Skills</div>
            {skills.map(sk => <SkillBar key={sk.id} skill={sk} color={color} />)}
          </div>
        )}

        {languages.length > 0 && (
          <div>
            <div style={{ fontSize: 9, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Sprachen</div>
            {languages.map(lang => (
              <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5, color: '#ccc' }}>
                <span>{lang.name}</span>
                <span style={{ color: '#888', fontSize: 10 }}>{lang.level}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right column */}
      <div style={{ padding: '28px 24px' }}>
        {info.summary && (
          <div style={{ marginBottom: 22, paddingBottom: 16, borderBottom: `2px solid ${color}` }}>
            <p style={{ fontSize: 13, color: '#333', lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>{info.summary}</p>
          </div>
        )}

        {workExperience.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#1a1a1a', marginBottom: 14, borderLeft: `4px solid ${color}`, paddingLeft: 10 }}>Erfahrung</h2>
            {workExperience.map(job => (
              <div key={job.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{job.position}</div>
                    <div style={{ fontSize: 12, color, fontWeight: 600 }}>{job.company}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#aaa', textAlign: 'right' }}>
                    <div>{job.location}</div>
                    <div>{formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)}</div>
                  </div>
                </div>
                {job.description && <p style={{ fontSize: 11, color: '#555', marginTop: 5, lineHeight: 1.6 }}>{job.description}</p>}
              </div>
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#1a1a1a', marginBottom: 14, borderLeft: `4px solid ${color}`, paddingLeft: 10 }}>Ausbildung</h2>
            {education.map(edu => (
              <div key={edu.id} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree} – {edu.field}</div>
                <div style={{ fontSize: 11, color }}>{edu.institution}</div>
                <div style={{ fontSize: 10, color: '#aaa' }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
              </div>
            ))}
          </div>
        )}

        {projects.length > 0 && (
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#1a1a1a', marginBottom: 14, borderLeft: `4px solid ${color}`, paddingLeft: 10 }}>Projekte</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {projects.map(proj => (
                <div key={proj.id} style={{ background: '#f8f8f8', borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ fontWeight: 700, fontSize: 11 }}>{proj.name}</div>
                  {proj.description && <p style={{ fontSize: 10, color: '#666', margin: '4px 0 0', lineHeight: 1.4 }}>{proj.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
