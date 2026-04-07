import type { Resume } from '../../types/resume';
import MinimalTemplate from './renders/MinimalTemplate';
import ExecutiveTemplate from './renders/ExecutiveTemplate';
import CreativeTemplate from './renders/CreativeTemplate';
import NordicTemplate from './renders/NordicTemplate';
import CorporateTemplate from './renders/CorporateTemplate';
import TechTemplate from './renders/TechTemplate';
import ElegantTemplate from './renders/ElegantTemplate';
import BoldTemplate from './renders/BoldTemplate';
import AcademicTemplate from './renders/AcademicTemplate';
import StartupTemplate from './renders/StartupTemplate';
import ModernTemplate from './renders/ModernTemplate';
import VibrantTemplate from './renders/VibrantTemplate';
import VintageTemplate from './renders/VintageTemplate';
import MagazineTemplate from './renders/MagazineTemplate';
import TimelineTemplate from './renders/TimelineTemplate';
import CompactTemplate from './renders/CompactTemplate';
import PastelTemplate from './renders/PastelTemplate';
import GeometricTemplate from './renders/GeometricTemplate';
import FreelancerTemplate from './renders/FreelancerTemplate';
import InternationalTemplate from './renders/InternationalTemplate';

interface Props {
  resume: Resume;
  scale?: number;
}

export default function ResumePreview({ resume, scale = 1 }: Props) {
  const templates: Record<string, React.ComponentType<{ resume: Resume }>> = {
    minimal: MinimalTemplate,
    executive: ExecutiveTemplate,
    creative: CreativeTemplate,
    nordic: NordicTemplate,
    corporate: CorporateTemplate,
    tech: TechTemplate,
    elegant: ElegantTemplate,
    bold: BoldTemplate,
    academic: AcademicTemplate,
    startup: StartupTemplate,
    modern: ModernTemplate,
    vibrant: VibrantTemplate,
    vintage: VintageTemplate,
    magazine: MagazineTemplate,
    timeline: TimelineTemplate,
    compact: CompactTemplate,
    pastel: PastelTemplate,
    geometric: GeometricTemplate,
    freelancer: FreelancerTemplate,
    international: InternationalTemplate,
  };

  const Template = templates[resume.templateId] ?? MinimalTemplate;

  return (
    <div style={{
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      width: `${100 / scale}%`,
    }}>
      <Template resume={resume} />
    </div>
  );
}
