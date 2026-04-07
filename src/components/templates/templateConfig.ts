import type { TemplateId } from '../../types/resume';

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  preview: string; // CSS gradient for thumbnail
  tags: string[];
}

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Klares, reduziertes Design mit viel Weißraum',
    preview: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    tags: ['Klassisch', 'Alle Branchen'],
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Professionell und repräsentativ für Führungspositionen',
    preview: 'linear-gradient(135deg, #1a1a2e 0%, #2d3561 100%)',
    tags: ['Führung', 'Senior'],
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Auffälliges Design für kreative Berufe',
    preview: 'linear-gradient(135deg, #FF2D55 0%, #AF52DE 50%, #007AFF 100%)',
    tags: ['Design', 'Marketing'],
  },
  {
    id: 'nordic',
    name: 'Nordic',
    description: 'Skandinavisch minimalistisch mit Akzentfarbe',
    preview: 'linear-gradient(135deg, #ecf4f9 0%, #d0e8f2 100%)',
    tags: ['Modern', 'Clean'],
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Traditionell und konservativ für Konzerne',
    preview: 'linear-gradient(135deg, #1e3a5f 0%, #2e5f8a 100%)',
    tags: ['Finanzen', 'Recht'],
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Dunkel und modern für die IT-Branche',
    preview: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0f2027 100%)',
    tags: ['IT', 'Entwicklung'],
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Elegantes zweispaltiges Layout mit Serif-Schrift',
    preview: 'linear-gradient(135deg, #fdfcfb 0%, #f5f0e8 100%)',
    tags: ['Beratung', 'HR'],
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Mutig und modern mit starken Kontrasten',
    preview: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
    tags: ['Startup', 'Sales'],
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Strukturiert für akademische Bewerbungen und CVs',
    preview: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
    tags: ['Forschung', 'Lehre'],
  },
  {
    id: 'startup',
    name: 'Startup',
    description: 'Frisch und dynamisch für innovative Unternehmen',
    preview: 'linear-gradient(135deg, #00C7BE 0%, #34C759 50%, #007AFF 100%)',
    tags: ['Startup', 'Tech'],
  },
];
