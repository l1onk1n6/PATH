export interface PersonalInfo {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
  photo?: string; // base64
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  highlights: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  grade: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
  category: string;
}

export interface Language {
  id: string;
  name: string;
  level: 'Grundkenntnisse' | 'Fortgeschritten' | 'Fließend' | 'Muttersprache';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  technologies: string[];
  startDate: string;
  endDate: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
  category: 'certificate' | 'reference' | 'portfolio' | 'other';
}

export type TemplateId =
  | 'minimal'
  | 'executive'
  | 'creative'
  | 'nordic'
  | 'corporate'
  | 'tech'
  | 'elegant'
  | 'bold'
  | 'academic'
  | 'startup'
  | 'modern'
  | 'vibrant'
  | 'vintage'
  | 'magazine'
  | 'timeline'
  | 'compact'
  | 'pastel'
  | 'geometric'
  | 'freelancer'
  | 'international';

export interface Resume {
  id: string;
  personId: string;
  name: string;
  templateId: TemplateId;
  accentColor: string;
  personalInfo: PersonalInfo;
  coverLetter: CoverLetter;
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  projects: Project[];
  certificates: Certificate[];
  documents: UploadedDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  avatar?: string; // base64
  resumeIds: string[];
  activeResumeId: string;
  createdAt: string;
}

export interface CoverLetter {
  recipient: string;
  subject: string;
  body: string;
  closing: string;
}

export type EditorSection =
  | 'personal'
  | 'cover-letter'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'projects'
  | 'certificates'
  | 'documents'
  | 'template';
