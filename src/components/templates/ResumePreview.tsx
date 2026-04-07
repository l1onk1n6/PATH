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
