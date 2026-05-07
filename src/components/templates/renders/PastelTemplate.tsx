import type { Resume } from '../../../types/resume';
import { fullName, formatDate } from './shared-utils';
import { SafeImg } from './shared';
import { useT } from '../../../lib/i18n';

function SectionTitle({ title, color, pastelBg, pastelBorder }: { title: string; color: string; pastelBg: string; pastelBorder: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 18 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: pastelBg, border: `2px solid ${pastelBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      </div>
      <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</h2>
    </div>
  );
}

export default function PastelTemplate({ resume }: { resume: Resume }) {
  const t = useT();
  const { personalInfo: info, workExperience, education, skills, languages, certificates } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  const pastelBg = `${color}18`;
  const pastelBorder = `${color}40`;

  return (
    <div style={{ fontFamily: '"Nunito", "Segoe UI", Arial, sans-serif', background: '#fdfcff', minHeight: '297mm', padding: '24px 28px', color: '#333' }}>
      {/* Soft pastel header */}
      <div style={{ background: pastelBg, borderRadius: 16, padding: '24px 28px', marginBottom: 20, border: `1px solid ${pastelBorder}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#2a2a2a', letterSpacing: '-0.3px' }}>{name}</h1>
            {info.title && <div style={{ fontSize: 13, color, fontWeight: 600, marginTop: 4 }}>{info.title}</div>}
          </div>
          {info.photo && (
            <SafeImg src={info.photo} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${color}50` }} />
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
          {[info.email, info.phone, info.location, info.linkedin].filter(Boolean).map((v, i) => (
            <span key={i} style={{ fontSize: 11, color: '#666', background: '#fff', padding: '3px 10px', borderRadius: 20, border: `1px solid ${pastelBorder}` }}>{v}</span>
          ))}
        </div>
      </div>

      {info.summary && (
        <p style={{ fontSize: 12, color: '#666', lineHeight: 1.8, marginBottom: 4, fontStyle: 'italic' }}>{info.summary}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 24 }}>
        <div>
          {workExperience.length > 0 && (
            <>
              <SectionTitle color={color} pastelBg={pastelBg} pastelBorder={pastelBorder} title={t("Berufserfahrung")} />
              {workExperience.map(job => (
                <div key={job.id} style={{ marginBottom: 14, background: '#fff', borderRadius: 10, padding: '10px 14px', border: `1px solid #f0f0f0`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{job.position}</div>
                      <div style={{ fontSize: 12, color, fontWeight: 600 }}>{job.company}</div>
                    </div>
                    <span style={{ fontSize: 10, color: '#aaa', background: pastelBg, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>
                      {formatDate(job.startDate)} – {job.current ? t('heute') : formatDate(job.endDate)}
                    </span>
                  </div>
                  {job.description && <p style={{ fontSize: 11, color: '#777', marginTop: 6, lineHeight: 1.6 }}>{job.description}</p>}
                </div>
              ))}
            </>
          )}

          {education.length > 0 && (
            <>
              <SectionTitle color={color} pastelBg={pastelBg} pastelBorder={pastelBorder} title={t("Ausbildung")} />
              {education.map(edu => (
                <div key={edu.id} style={{ marginBottom: 10, background: '#fff', borderRadius: 10, padding: '10px 14px', border: `1px solid #f0f0f0`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree}{edu.field ? ` · ${edu.field}` : ''}</div>
                  <div style={{ fontSize: 11, color }}>{edu.institution}</div>
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
                </div>
              ))}
            </>
          )}
        </div>

        <div>
          {skills.length > 0 && (
            <>
              <SectionTitle color={color} pastelBg={pastelBg} pastelBorder={pastelBorder} title={t("Skills")} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {skills.map(sk => (
                  <div key={sk.id}>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 3, fontWeight: 600 }}>{sk.name}</div>
                    <div style={{ height: 6, background: '#f0eeff', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${sk.level * 20}%`, background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {languages.length > 0 && (
            <>
              <SectionTitle color={color} pastelBg={pastelBg} pastelBorder={pastelBorder} title={t("Sprachen")} />
              {languages.map(lang => (
                <div key={lang.id} style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 11 }}>
                  <span style={{ fontWeight: 600, color: '#555' }}>{lang.name}</span>
                  <span style={{ color: '#aaa' }}>{lang.level}</span>
                </div>
              ))}
            </>
          )}

          {certificates.length > 0 && (
            <>
              <SectionTitle color={color} pastelBg={pastelBg} pastelBorder={pastelBorder} title={t("Zertifikate")} />
              {certificates.map(cert => (
                <div key={cert.id} style={{ marginBottom: 6, fontSize: 11, background: pastelBg, borderRadius: 8, padding: '5px 8px' }}>
                  <div style={{ fontWeight: 600, color: '#555' }}>{cert.name}</div>
                  <div style={{ color: '#888' }}>{cert.issuer}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
