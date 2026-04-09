import type { Resume, WorkExperience, Education, Skill } from '../../../types/resume';
import { sanitizePhotoUrl } from '../../../lib/security';

// Safe img wrapper — rejects non-image URLs to prevent XSS via javascript: or data: non-image URIs
export function SafeImg({ src, alt, style }: { src: string; alt: string; style?: React.CSSProperties }) {
  const safe = sanitizePhotoUrl(src);
  if (!safe) return null;
  return <img src={safe} alt={alt} style={style} />;
}

export function formatDate(dateStr: string) {
  if (!dateStr) return '';
  // Year-only format (YYYY)
  if (!dateStr.includes('-')) return dateStr;
  const [year, month] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export function fullName(resume: Resume) {
  const { firstName, lastName } = resume.personalInfo;
  return [firstName, lastName].filter(Boolean).join(' ') || 'Ihr Name';
}

export function fullAddress(info: Resume['personalInfo']): string {
  return [info.street, info.location].filter(Boolean).join(', ');
}

export function SkillBar({ skill, color }: { skill: Skill; color: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span>{skill.name}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(0,0,0,0.1)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${skill.level * 20}%`, background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

export function SkillDots({ skill, color }: { skill: Skill; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
      <span style={{ fontSize: 12 }}>{skill.name}</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: skill.level >= i ? color : 'rgba(0,0,0,0.15)',
          }} />
        ))}
      </div>
    </div>
  );
}

export function WorkEntry({ job, color, dark = false }: { job: WorkExperience; color: string; dark?: boolean }) {
  const textColor = dark ? 'rgba(255,255,255,0.6)' : '#666';
  const headingColor = dark ? '#fff' : '#1a1a1a';

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: headingColor }}>{job.position}</div>
          <div style={{ fontSize: 12, color, fontWeight: 600 }}>{job.company}</div>
        </div>
        <div style={{ fontSize: 10, color: textColor, textAlign: 'right', flexShrink: 0 }}>
          <div>{job.location}</div>
          <div>{formatDate(job.startDate)} – {job.current ? 'Heute' : formatDate(job.endDate)}</div>
        </div>
      </div>
      {job.description && (
        <p style={{ fontSize: 11, color: textColor, marginTop: 4, lineHeight: 1.5 }}>{job.description}</p>
      )}
    </div>
  );
}

export function EduEntry({ edu, color, dark = false }: { edu: Education; color: string; dark?: boolean }) {
  const textColor = dark ? 'rgba(255,255,255,0.6)' : '#666';
  const headingColor = dark ? '#fff' : '#1a1a1a';

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: headingColor }}>{edu.degree}</div>
          <div style={{ fontSize: 11, color, fontWeight: 600 }}>{edu.institution}</div>
          {edu.field && <div style={{ fontSize: 11, color: textColor }}>{edu.field}</div>}
        </div>
        <div style={{ fontSize: 10, color: textColor, textAlign: 'right', flexShrink: 0 }}>
          <div>{formatDate(edu.startDate)} – {formatDate(edu.endDate)}</div>
          {edu.grade && <div>Note: {edu.grade}</div>}
        </div>
      </div>
    </div>
  );
}
