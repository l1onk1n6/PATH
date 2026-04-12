/**
 * Minimal entry point for the screenshot build.
 * No auth, no routing, no Supabase — just a resume preview.
 */
import { createRoot } from 'react-dom/client';
import ResumePreview from './components/templates/ResumePreview';
import type { Resume, TemplateId } from './types/resume';

const params = new URLSearchParams(window.location.search);
const templateId = (params.get('t') ?? 'minimal') as TemplateId;
const accent     = params.get('accent') ?? '#007AFF';

const SAMPLE: Resume = {
  id: 'ss', personId: 'ss', name: 'Demo', status: 'entwurf', jobUrl: '', deadline: '',
  templateId, accentColor: accent,
  coverLetter: { recipient: '', subject: '', body: '', closing: 'Mit freundlichen Grüssen' },
  projects: [], certificates: [], documents: [], customSections: [],
  updatedAt: '', createdAt: '',
  personalInfo: {
    firstName: 'Sophie', lastName: 'Wagner',
    title: 'Senior UX Designerin',
    email: 'sophie.wagner@beispiel.ch',
    phone: '+41 79 456 78 90',
    street: 'Seestrasse 42',
    location: '8002 Zürich',
    website: 'sophiewagner.ch',
    linkedin: 'linkedin.com/in/sophiewagner',
    github: '',
    summary: 'Leidenschaftliche UX-Designerin mit 6 Jahren Erfahrung in nutzerzentriertem Design. Expertise in User Research, Prototyping und der Umsetzung komplexer digitaler Produkte für internationale Märkte.',
  },
  workExperience: [
    {
      id: 'j1', company: 'Zühlke Engineering AG', position: 'Senior UX Designer',
      location: 'Zürich', startDate: '2021-03', endDate: '', current: true,
      description: 'Gestaltung und Leitung von UX-Projekten für Fintech- und Healthcare-Kunden. Durchführung von Nutzertests, Erstellung von Prototypen in Figma und enge Zusammenarbeit mit Entwicklungsteams.',
      highlights: [],
    },
    {
      id: 'j2', company: 'SBB AG', position: 'UX/UI Designer',
      location: 'Bern', startDate: '2018-09', endDate: '2021-02', current: false,
      description: 'Redesign der SBB Mobile App mit über 2 Millionen aktiven Nutzern. Steigerung des App-Ratings von 3.2 auf 4.6 durch nutzerzentrierte Überarbeitung der Kernfunktionen.',
      highlights: [],
    },
    {
      id: 'j3', company: 'Accenture Digital', position: 'UX Designer',
      location: 'Zürich', startDate: '2017-06', endDate: '2018-08', current: false,
      description: 'Konzeption und Umsetzung digitaler Kundenerlebnisse für Retail- und Bankingkunden.',
      highlights: [],
    },
  ],
  education: [
    {
      id: 'e1', degree: 'Master of Arts', field: 'Interaction Design',
      institution: 'ZHdK – Zürcher Hochschule der Künste', location: 'Zürich',
      startDate: '2015-09', endDate: '2017-05', grade: '5.6',
      description: 'Thesis: "Barrierefreies Design in mobilen Anwendungen"',
    },
    {
      id: 'e2', degree: 'Bachelor of Arts', field: 'Kommunikationsdesign',
      institution: 'FHNW', location: 'Basel',
      startDate: '2012-09', endDate: '2015-06', grade: '5.4',
      description: '',
    },
  ],
  skills: [
    { id: 's1', name: 'Figma',         level: 5, category: 'Design'      },
    { id: 's2', name: 'User Research',  level: 5, category: 'Design'      },
    { id: 's3', name: 'Prototyping',    level: 5, category: 'Design'      },
    { id: 's4', name: 'HTML / CSS',     level: 4, category: 'Entwicklung' },
    { id: 's5', name: 'Design Systems', level: 4, category: 'Design'      },
    { id: 's6', name: 'Sketch',         level: 3, category: 'Design'      },
  ],
  languages: [
    { id: 'l1', name: 'Deutsch',      level: 'Muttersprache'   },
    { id: 'l2', name: 'Englisch',     level: 'Fließend'        },
    { id: 'l3', name: 'Französisch',  level: 'Fortgeschritten' },
  ],
};

const container = document.getElementById('resume-root')!;
createRoot(container).render(<ResumePreview resume={SAMPLE} />);
