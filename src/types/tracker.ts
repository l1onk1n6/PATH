export type ApplicationStatus =
  | 'offen'
  | 'beworben'
  | 'interview'
  | 'angebot'
  | 'abgelehnt'
  | 'zurueckgezogen';

export type ApplicationType =
  | 'online'
  | 'email'
  | 'postalisch'
  | 'persoenlich'
  | 'telefonisch';

export interface Application {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  type: ApplicationType;
  appliedDate: string;  // YYYY-MM-DD
  deadline: string;     // YYYY-MM-DD
  notes: string;
  url: string;
  resumeId: string;
}
