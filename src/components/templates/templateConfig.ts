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
  {
    id: 'modern',
    name: 'Modern',
    description: 'Sauberes modernes Layout mit farbigen Icon-Badges',
    preview: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
    tags: ['Modern', 'Alle Branchen'],
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Dynamischer diagonaler Farbverlauf im Header',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    tags: ['Kreativ', 'Design'],
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Klassisch-nostalgisch mit Serifen und Ornamenten',
    preview: 'linear-gradient(135deg, #faf7f2 0%, #efe8d8 100%)',
    tags: ['Klassisch', 'Kultur'],
  },
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Dunkle linke Spalte im Magazinstil',
    preview: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 60%, #f5f5f5 60%)',
    tags: ['Design', 'Kreativ'],
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Vertikale Zeitleiste mit farbigen Punkten',
    preview: 'linear-gradient(135deg, #fff 0%, #f0f8ff 100%)',
    tags: ['Modern', 'Strukturiert'],
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Platzsparend und ATS-freundlich',
    preview: 'linear-gradient(135deg, #fdfdfd 0%, #f0f0f0 100%)',
    tags: ['ATS', 'Kompakt'],
  },
  {
    id: 'pastel',
    name: 'Pastel',
    description: 'Sanfte Pastellfarben mit abgerundeten Karten',
    preview: 'linear-gradient(135deg, #fdfcff 0%, #ede8ff 100%)',
    tags: ['Freundlich', 'HR'],
  },
  {
    id: 'geometric',
    name: 'Geometric',
    description: 'Geometrische Akzente und moderne Typografie',
    preview: 'linear-gradient(135deg, #fff 0%, #f0f0ff 50%, #fff 100%)',
    tags: ['Modern', 'Design'],
  },
  {
    id: 'freelancer',
    name: 'Freelancer',
    description: 'Dunkles Portfolio-Design für Freelancer',
    preview: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
    tags: ['Freelancer', 'IT'],
  },
  {
    id: 'international',
    name: 'International',
    description: 'Europass-inspiriertes tabellarisches Layout',
    preview: 'linear-gradient(135deg, #fff 0%, #f8f4ee 100%)',
    tags: ['International', 'EU'],
  },
];
