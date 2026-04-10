import type { Resume } from '../../../types/resume';
import { fullName, formatDate, fullAddress } from './shared';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

export default function AcademicTemplate({ resume }: { resume: Resume }) {
  const { personalInfo: info, workExperience, education, skills, certificates, projects, customSections } = resume;
  const color = resume.accentColor;
  const name = fullName(resume);

  return (
    <div style={{ fontFamily: '"Times New Roman", Times, serif', background: '#fff', color: '#1a1a1a', minHeight: '297mm', padding: '20px 24px 24px' }}>
      {/* Academic header */}
      <div style={{ textAlign: 'center', borderBottom: `2px solid #1a1a1a`, paddingBottom: 14, marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', letterSpacing: '0.02em' }}>{name}</h1>
        {info.title && <div style={{ fontSize: 13, color: '#444', marginBottom: 8 }}>{info.title}</div>}
        <div style={{ fontSize: 11, color: '#555', display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {[info.email, info.phone, fullAddress(info), info.linkedin, info.github, fmtDate(info.birthDate)].filter(Boolean).map((v, i) => (
            <span key={i}>{v}</span>
          ))}
        </div>
      </div>

      {info.summary && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${color}`, paddingBottom: 3, marginBottom: 8 }}>Kurzprofil</h2>
          <p style={{ fontSize: 11, color: '#444', lineHeight: 1.7 }}>{info.summary}</p>
        </section>
      )}

      {education.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${color}`, paddingBottom: 3, marginBottom: 8 }}>Akademischer Werdegang</h2>
          {education.map(edu => (
            <div key={edu.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: 12 }}>{edu.degree}{edu.field ? `, ${edu.field}` : ''}</strong><br />
                  <span style={{ fontSize: 11, color: '#444', fontStyle: 'italic' }}>{edu.institution}{edu.location ? `, ${edu.location}` : ''}</span>
                  {edu.grade && <span style={{ fontSize: 10, color: '#666' }}> · Note: {edu.grade}</span>}
                </div>
                <div style={{ fontSize: 10, color: '#888', textAlign: 'right' }}>
                  {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                </div>
              </div>
              {edu.description && <p style={{ fontSize: 10, color: '#555', marginTop: 4, lineHeight: 1.5 }}>{edu.description}</p>}
            </div>
          ))}
        </section>
      )}

      {workExperience.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${color}`, paddingBottom: 3, marginBottom: 8 }}>Beruflicher Werdegang</h2>
          {workExperience.map(job => (
            <div key={job.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: 12 }}>{job.position}</strong><br />
                  <span style={{ fontSize: 11, fontStyle: 'italic', color: '#444' }}>{job.company}{job.location ? `, ${job.location}` : ''}</span>
                </div>
                <div style={{ fontSize: 10, color: '#888' }}>{formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)}</div>
              </div>
              {job.description && <p style={{ fontSize: 10, color: '#555', marginTop: 4, lineHeight: 1.5 }}>{job.description}</p>}
            </div>
          ))}
        </section>
      )}

      {projects.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${color}`, paddingBottom: 3, marginBottom: 8 }}>Forschung & Projekte</h2>
          {projects.map(proj => (
            <div key={proj.id} style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: 11 }}>{proj.name}</strong>
              {proj.description && <p style={{ fontSize: 10, color: '#555', marginTop: 2, lineHeight: 1.5 }}>{proj.description}</p>}
            </div>
          ))}
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {skills.length > 0 && (
          <section>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${color}`, paddingBottom: 3, marginBottom: 8 }}>Fähigkeiten</h2>
            <div style={{ fontSize: 11, color: '#444', lineHeight: 1.8 }}>
              {skills.map(sk => sk.name).join(' · ')}
            </div>
          </section>
        )}
        {certificates.length > 0 && (
          <section>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${color}`, paddingBottom: 3, marginBottom: 8 }}>Zertifikate</h2>
            {certificates.map(cert => (
              <div key={cert.id} style={{ fontSize: 11, marginBottom: 4, color: '#444' }}>
                {cert.name} – {cert.issuer} ({formatDate(cert.date)})
              </div>
            ))}
          </section>
        )}
      </div>

      {(customSections ?? []).filter(s => s.items.some(i => i.trim())).map(section => (
        <section key={section.id} style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${color}`, paddingBottom: 3, marginBottom: 8 }}>{section.title || 'Eigene Sektion'}</h2>
          {section.items.filter(i => i.trim()).map((item, idx) => (
            <div key={idx} style={{ fontSize: 11, marginBottom: 4, lineHeight: 1.6, color: '#444' }}>{item}</div>
          ))}
        </section>
      ))}
    </div>
  );
}
