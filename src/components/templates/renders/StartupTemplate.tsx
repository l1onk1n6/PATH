import type { Resume } from '../../../types/resume';
import { fullName, formatDate } from './shared-utils';
import { SafeImg } from './shared';
import { useT } from '../../../lib/i18n';

export default function StartupTemplate({ resume }: { resume: Resume }) {
  const t = useT();
  const { personalInfo: info, workExperience, education, skills, languages, projects } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', background: '#fff', minHeight: '297mm' }}>
      {/* Top gradient bar */}
      <div style={{ background: `linear-gradient(90deg, ${color}, #34C759)`, height: 4 }} />

      <div style={{ padding: '20px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {info.photo ? (
              <SafeImg src={info.photo} alt="" style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${color}, #34C759)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff' }}>
                {name.charAt(0)}
              </div>
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>{name}</h1>
              {info.title && (
                <div style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 700,
                  background: `${color}15`, color, padding: '3px 10px', borderRadius: 20, marginTop: 4,
                }}>
                  {info.title}
                </div>
              )}
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#888', textAlign: 'right', lineHeight: 1.9 }}>
            {[info.email, info.phone, info.location].filter(Boolean).map((v, i) => <div key={i}>{v}</div>)}
          </div>
        </div>

        {info.summary && (
          <div style={{ marginBottom: 18, background: `${color}08`, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${color}` }}>
            <p style={{ fontSize: 12, color: '#444', lineHeight: 1.7, margin: 0 }}>{info.summary}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 20 }}>
          <div>
            {workExperience.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#111', marginBottom: 12 }}>
                  Erfahrung <span style={{ color, marginLeft: 6 }}>→</span>
                </h2>
                {workExperience.map(job => (
                  <div key={job.id} style={{ marginBottom: 12, background: '#fafafa', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{job.position}</div>
                        <div style={{ fontSize: 11, color, fontWeight: 600, marginTop: 1 }}>{job.company}</div>
                      </div>
                      <span style={{
                        fontSize: 9, padding: '3px 8px', background: `${color}15`, color,
                        borderRadius: 20, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {formatDate(job.startDate)} – {job.current ? 'Now' : formatDate(job.endDate)}
                      </span>
                    </div>
                    {job.description && <p style={{ fontSize: 10, color: '#666', lineHeight: 1.5, margin: '6px 0 0' }}>{job.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {projects.length > 0 && (
              <div>
                <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#111', marginBottom: 12 }}>
                  Projekte <span style={{ color, marginLeft: 6 }}>→</span>
                </h2>
                {projects.map(proj => (
                  <div key={proj.id} style={{ marginBottom: 10, background: '#fafafa', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{proj.name}</div>
                    {proj.technologies.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {proj.technologies.map(t => (
                          <span key={t} style={{ fontSize: 9, padding: '2px 7px', background: `${color}15`, color, borderRadius: 12, fontWeight: 600 }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {proj.description && <p style={{ fontSize: 10, color: '#666', margin: '5px 0 0', lineHeight: 1.5 }}>{proj.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {education.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#111', marginBottom: 10 }}>{t("Ausbildung")}</h2>
                {education.map(edu => (
                  <div key={edu.id} style={{ marginBottom: 8, background: '#fafafa', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontWeight: 700, fontSize: 11, color: '#111' }}>{edu.degree}</div>
                    <div style={{ fontSize: 10, color, fontWeight: 600 }}>{edu.institution}</div>
                    <div style={{ fontSize: 9, color: '#999' }}>{formatDate(edu.endDate)}</div>
                  </div>
                ))}
              </div>
            )}

            {skills.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#111', marginBottom: 10 }}>{t("Skills")}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {skills.map(sk => (
                    <span key={sk.id} style={{
                      fontSize: 10, padding: '4px 9px',
                      background: sk.level >= 4 ? color : `${color}20`,
                      color: sk.level >= 4 ? '#fff' : color,
                      borderRadius: 20, fontWeight: 600,
                    }}>{sk.name}</span>
                  ))}
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div>
                <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#111', marginBottom: 10 }}>{t("Sprachen")}</h2>
                {languages.map(lang => (
                  <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 11, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#333' }}>{lang.name}</span>
                    <span style={{ fontSize: 10, color: '#999' }}>{lang.level}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
