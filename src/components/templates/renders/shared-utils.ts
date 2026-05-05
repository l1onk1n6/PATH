import type { Resume } from '../../../types/resume';

export function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export function fullName(resume: Resume) {
  const { firstName, lastName } = resume.personalInfo;
  return [firstName, lastName].filter(Boolean).join(' ') || 'Ihr Name';
}
