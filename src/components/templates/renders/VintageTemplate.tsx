import type { Resume } from '../../../types/resume';
import { fullName, formatDate } from './shared-utils';
import { useT } from '../../../lib/i18n';

export default function VintageTemplate({ resume }: { resume: Resume }) {
  const t = useT();
  const { personalInfo: info, workExperience, education, skills, languages } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"Playfair Display", "Palatino Linotype", Georgia, serif', background: '#faf7f2', minHeight: '297mm', padding: '28px 32px', color: '#2c2416' }}>
      {/* Ornamental header */}
      <div style={{ textAlign: 'center', borderBottom: `3px double ${color}`, paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>{t("Curriculum Vitae")}</div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '0.05em', color: '#1a1206' }}>{name}</h1>
        {info.title && <div style={{ fontSize: 14, color, fontStyle: 'italic', marginTop: 4 }}>{info.title}</div>}
        <div style={{ fontSize: 10, color: '#888', marginTop: 10, display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {[info.email, info.phone, info.location].filter(Boolean).map((v, i) => (
            <span key={i}>{v}</span>
          ))}
        </div>
      </div>

      {info.summary && (
        <div style={{ marginBottom: 20, textAlign: 'center', fontStyle: 'italic', fontSize: 13, color: '#666', lineHeight: 1.8, maxWidth: '80%', margin: '0 auto 20px' }}>
          "{info.summary}"
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        <div>
          {workExperience.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color, textAlign: 'center', borderBottom: `1px solid ${color}40`, paddingBottom: 6, marginBottom: 14, letterSpacing: '0.08em' }}>
                ✦ Berufliche Laufbahn ✦
              </h2>
              {workExperience.map(job => (
                <div key={job.id} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{job.position}</div>
                  <div style={{ fontSize: 12, color, fontStyle: 'italic' }}>{job.company}</div>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>
                    {formatDate(job.startDate)} – {job.current ? t('heute') : formatDate(job.endDate)} | {job.location}
                  </div>
                  {job.description && <p style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>{job.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {education.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color, textAlign: 'center', borderBottom: `1px solid ${color}40`, paddingBottom: 6, marginBottom: 14, letterSpacing: '0.08em' }}>
                ✦ Bildungsweg ✦
              </h2>
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}</div>
                  <div style={{ fontSize: 11, color, fontStyle: 'italic' }}>{edu.institution}</div>
                  <div style={{ fontSize: 10, color: '#888' }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
                </div>
              ))}
            </div>
          )}

          {skills.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color, textAlign: 'center', borderBottom: `1px solid ${color}40`, paddingBottom: 6, marginBottom: 12, letterSpacing: '0.08em' }}>
                ✦ Kenntnisse ✦
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {skills.map(sk => (
                  <span key={sk.id} style={{ fontSize: 11, padding: '3px 10px', border: `1px solid ${color}50`, borderRadius: 2, color: '#444', background: `${color}08` }}>{sk.name}</span>
                ))}
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color, textAlign: 'center', borderBottom: `1px solid ${color}40`, paddingBottom: 6, marginBottom: 10, letterSpacing: '0.08em' }}>
                ✦ Sprachen ✦
              </h2>
              {languages.map(lang => (
                <div key={lang.id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 12, marginBottom: 5, borderBottom: '1px dotted #ddd', paddingBottom: 4 }}>
                  <span style={{ fontStyle: 'italic' }}>{lang.name}</span>
                  <span style={{ color: '#888', fontSize: 11 }}>{lang.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
