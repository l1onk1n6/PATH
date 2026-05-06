/**
 * Kuratierte Skill-Bibliothek fuer Autocomplete-Vorschlaege.
 * Jeder Skill hat einen vorgeschlagenen Kategorie-Namen, der beim Pick
 * automatisch ins Kategorie-Feld uebernommen werden kann.
 */

export interface SkillSuggestion {
  name: string;
  category: string;
}

export const SKILLS: SkillSuggestion[] = [
  // Programmiersprachen
  { name: 'JavaScript', category: 'Programmiersprachen' },
  { name: 'TypeScript', category: 'Programmiersprachen' },
  { name: 'Python', category: 'Programmiersprachen' },
  { name: 'Java', category: 'Programmiersprachen' },
  { name: 'C#', category: 'Programmiersprachen' },
  { name: 'C++', category: 'Programmiersprachen' },
  { name: 'C', category: 'Programmiersprachen' },
  { name: 'Go', category: 'Programmiersprachen' },
  { name: 'Rust', category: 'Programmiersprachen' },
  { name: 'Kotlin', category: 'Programmiersprachen' },
  { name: 'Swift', category: 'Programmiersprachen' },
  { name: 'PHP', category: 'Programmiersprachen' },
  { name: 'Ruby', category: 'Programmiersprachen' },
  { name: 'Scala', category: 'Programmiersprachen' },
  { name: 'R', category: 'Programmiersprachen' },
  { name: 'MATLAB', category: 'Programmiersprachen' },
  { name: 'Dart', category: 'Programmiersprachen' },
  { name: 'Elixir', category: 'Programmiersprachen' },
  { name: 'HTML', category: 'Programmiersprachen' },
  { name: 'CSS', category: 'Programmiersprachen' },
  { name: 'SQL', category: 'Programmiersprachen' },
  { name: 'Bash', category: 'Programmiersprachen' },
  { name: 'PowerShell', category: 'Programmiersprachen' },

  // Frontend-Frameworks
  { name: 'React', category: 'Frontend' },
  { name: 'Vue.js', category: 'Frontend' },
  { name: 'Angular', category: 'Frontend' },
  { name: 'Svelte', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'Nuxt.js', category: 'Frontend' },
  { name: 'Astro', category: 'Frontend' },
  { name: 'Remix', category: 'Frontend' },
  { name: 'jQuery', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Sass', category: 'Frontend' },
  { name: 'Bootstrap', category: 'Frontend' },
  { name: 'Material UI', category: 'Frontend' },

  // Backend / Frameworks
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express', category: 'Backend' },
  { name: 'NestJS', category: 'Backend' },
  { name: 'Django', category: 'Backend' },
  { name: 'Flask', category: 'Backend' },
  { name: 'FastAPI', category: 'Backend' },
  { name: 'Spring Boot', category: 'Backend' },
  { name: 'ASP.NET', category: 'Backend' },
  { name: 'Laravel', category: 'Backend' },
  { name: 'Ruby on Rails', category: 'Backend' },
  { name: 'GraphQL', category: 'Backend' },
  { name: 'REST APIs', category: 'Backend' },
  { name: 'WebSockets', category: 'Backend' },

  // Mobile
  { name: 'React Native', category: 'Mobile' },
  { name: 'Flutter', category: 'Mobile' },
  { name: 'iOS / SwiftUI', category: 'Mobile' },
  { name: 'Android / Jetpack Compose', category: 'Mobile' },
  { name: 'Capacitor', category: 'Mobile' },
  { name: 'Ionic', category: 'Mobile' },

  // Datenbanken
  { name: 'PostgreSQL', category: 'Datenbanken' },
  { name: 'MySQL', category: 'Datenbanken' },
  { name: 'MongoDB', category: 'Datenbanken' },
  { name: 'Redis', category: 'Datenbanken' },
  { name: 'SQLite', category: 'Datenbanken' },
  { name: 'Microsoft SQL Server', category: 'Datenbanken' },
  { name: 'Oracle DB', category: 'Datenbanken' },
  { name: 'Elasticsearch', category: 'Datenbanken' },
  { name: 'DynamoDB', category: 'Datenbanken' },
  { name: 'Firebase', category: 'Datenbanken' },
  { name: 'Supabase', category: 'Datenbanken' },

  // Cloud & DevOps
  { name: 'AWS', category: 'Cloud / DevOps' },
  { name: 'Microsoft Azure', category: 'Cloud / DevOps' },
  { name: 'Google Cloud Platform', category: 'Cloud / DevOps' },
  { name: 'Docker', category: 'Cloud / DevOps' },
  { name: 'Kubernetes', category: 'Cloud / DevOps' },
  { name: 'Terraform', category: 'Cloud / DevOps' },
  { name: 'Ansible', category: 'Cloud / DevOps' },
  { name: 'Jenkins', category: 'Cloud / DevOps' },
  { name: 'GitHub Actions', category: 'Cloud / DevOps' },
  { name: 'GitLab CI', category: 'Cloud / DevOps' },
  { name: 'CircleCI', category: 'Cloud / DevOps' },
  { name: 'Linux', category: 'Cloud / DevOps' },
  { name: 'Nginx', category: 'Cloud / DevOps' },
  { name: 'Apache', category: 'Cloud / DevOps' },
  { name: 'CI/CD', category: 'Cloud / DevOps' },

  // Tools
  { name: 'Git', category: 'Tools' },
  { name: 'GitHub', category: 'Tools' },
  { name: 'GitLab', category: 'Tools' },
  { name: 'Bitbucket', category: 'Tools' },
  { name: 'Visual Studio Code', category: 'Tools' },
  { name: 'IntelliJ IDEA', category: 'Tools' },
  { name: 'Jira', category: 'Tools' },
  { name: 'Confluence', category: 'Tools' },
  { name: 'Slack', category: 'Tools' },
  { name: 'Microsoft Teams', category: 'Tools' },
  { name: 'Notion', category: 'Tools' },
  { name: 'Figma', category: 'Tools' },
  { name: 'Sketch', category: 'Tools' },
  { name: 'Adobe XD', category: 'Tools' },
  { name: 'Postman', category: 'Tools' },

  // Microsoft 365
  { name: 'Microsoft 365', category: 'Microsoft 365' },
  { name: 'SharePoint', category: 'Microsoft 365' },
  { name: 'Power Platform', category: 'Microsoft 365' },
  { name: 'Power Automate', category: 'Microsoft 365' },
  { name: 'Power Apps', category: 'Microsoft 365' },
  { name: 'Power BI', category: 'Microsoft 365' },
  { name: 'Microsoft Excel', category: 'Microsoft 365' },
  { name: 'Microsoft Word', category: 'Microsoft 365' },
  { name: 'Microsoft PowerPoint', category: 'Microsoft 365' },
  { name: 'Microsoft Outlook', category: 'Microsoft 365' },

  // Adobe Creative
  { name: 'Adobe Photoshop', category: 'Design / Creative' },
  { name: 'Adobe Illustrator', category: 'Design / Creative' },
  { name: 'Adobe InDesign', category: 'Design / Creative' },
  { name: 'Adobe Premiere Pro', category: 'Design / Creative' },
  { name: 'Adobe After Effects', category: 'Design / Creative' },
  { name: 'Adobe Lightroom', category: 'Design / Creative' },

  // Daten / KI
  { name: 'Machine Learning', category: 'Daten / KI' },
  { name: 'Deep Learning', category: 'Daten / KI' },
  { name: 'TensorFlow', category: 'Daten / KI' },
  { name: 'PyTorch', category: 'Daten / KI' },
  { name: 'Scikit-learn', category: 'Daten / KI' },
  { name: 'Pandas', category: 'Daten / KI' },
  { name: 'NumPy', category: 'Daten / KI' },
  { name: 'Jupyter', category: 'Daten / KI' },
  { name: 'Datenanalyse', category: 'Daten / KI' },
  { name: 'Statistik', category: 'Daten / KI' },
  { name: 'Tableau', category: 'Daten / KI' },
  { name: 'Apache Spark', category: 'Daten / KI' },
  { name: 'Natural Language Processing', category: 'Daten / KI' },
  { name: 'Computer Vision', category: 'Daten / KI' },
  { name: 'Prompt Engineering', category: 'Daten / KI' },

  // Methodiken
  { name: 'Agile', category: 'Methodik' },
  { name: 'Scrum', category: 'Methodik' },
  { name: 'Kanban', category: 'Methodik' },
  { name: 'Test-Driven Development', category: 'Methodik' },
  { name: 'Domain-Driven Design', category: 'Methodik' },
  { name: 'Microservices', category: 'Methodik' },
  { name: 'Clean Architecture', category: 'Methodik' },
  { name: 'Code Review', category: 'Methodik' },
  { name: 'Pair Programming', category: 'Methodik' },
  { name: 'Refactoring', category: 'Methodik' },

  // Business / Marketing
  { name: 'Projektmanagement', category: 'Business' },
  { name: 'Produktmanagement', category: 'Business' },
  { name: 'Stakeholder-Management', category: 'Business' },
  { name: 'Budgetplanung', category: 'Business' },
  { name: 'Controlling', category: 'Business' },
  { name: 'Risikomanagement', category: 'Business' },
  { name: 'Change Management', category: 'Business' },
  { name: 'Prozessoptimierung', category: 'Business' },
  { name: 'Online-Marketing', category: 'Marketing' },
  { name: 'SEO', category: 'Marketing' },
  { name: 'Google Analytics', category: 'Marketing' },
  { name: 'Social Media Marketing', category: 'Marketing' },
  { name: 'Content Marketing', category: 'Marketing' },
  { name: 'E-Mail Marketing', category: 'Marketing' },
  { name: 'Performance Marketing', category: 'Marketing' },
  { name: 'CRM', category: 'Marketing' },
  { name: 'HubSpot', category: 'Marketing' },
  { name: 'Salesforce', category: 'Marketing' },

  // Soft Skills
  { name: 'Kommunikation', category: 'Soft Skills' },
  { name: 'Teamfähigkeit', category: 'Soft Skills' },
  { name: 'Führung', category: 'Soft Skills' },
  { name: 'Empathie', category: 'Soft Skills' },
  { name: 'Analytisches Denken', category: 'Soft Skills' },
  { name: 'Problemlösung', category: 'Soft Skills' },
  { name: 'Kreativität', category: 'Soft Skills' },
  { name: 'Eigenverantwortung', category: 'Soft Skills' },
  { name: 'Belastbarkeit', category: 'Soft Skills' },
  { name: 'Organisationsstärke', category: 'Soft Skills' },
  { name: 'Verhandlungsgeschick', category: 'Soft Skills' },
  { name: 'Präsentation', category: 'Soft Skills' },
  { name: 'Coaching / Mentoring', category: 'Soft Skills' },
  { name: 'Konfliktmanagement', category: 'Soft Skills' },
  { name: 'Interkulturelle Kompetenz', category: 'Soft Skills' },
];

/** Liefert maximal `limit` Vorschlaege, die mit `query` beginnen oder `query` enthalten. */
export function searchSkills(query: string, limit = 8): SkillSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const startsWith: SkillSuggestion[] = [];
  const includes: SkillSuggestion[] = [];
  for (const s of SKILLS) {
    const lower = s.name.toLowerCase();
    if (lower === q) continue; // Exakt-Match nicht vorschlagen
    if (lower.startsWith(q)) startsWith.push(s);
    else if (lower.includes(q)) includes.push(s);
    if (startsWith.length >= limit) break;
  }
  return [...startsWith, ...includes].slice(0, limit);
}
