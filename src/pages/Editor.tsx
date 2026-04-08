import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Briefcase, GraduationCap, Zap, FolderOpen,
  Upload, Palette, AlertCircle, FileEdit, LayoutList, Lock, Languages, History,
} from 'lucide-react';
import { useResumeStore } from '../store/resumeStore';
import { usePlan } from '../lib/plan';
import type { EditorSection } from '../types/resume';
import type { LucideProps } from 'lucide-react';
import PersonalInfoEditor from '../components/editor/PersonalInfoEditor';
import CoverLetterEditor from '../components/editor/CoverLetterEditor';
import ExperienceEditor from '../components/editor/ExperienceEditor';
import EducationEditor from '../components/editor/EducationEditor';
import SkillsEditor from '../components/editor/SkillsEditor';
import ProjectsEditor from '../components/editor/ProjectsEditor';
import DocumentUpload from '../components/editor/DocumentUpload';
import CustomSectionEditor from '../components/editor/CustomSectionEditor';
import TemplateSelector from '../components/templates/TemplateSelector';
import TranslateDialog from '../components/editor/TranslateDialog';
import VersionHistoryPanel from '../components/editor/VersionHistoryPanel';
import { useIsMobile } from '../hooks/useBreakpoint';

const SECTIONS: { id: EditorSection; label: string; short: string; icon: React.ComponentType<LucideProps> }[] = [
  { id: 'personal',     label: 'Persönliche Daten',     short: 'Person',    icon: User },
  { id: 'cover-letter', label: 'Motivationsschreiben',  short: 'Anschreiben', icon: FileEdit },
  { id: 'experience',   label: 'Berufserfahrung',        short: 'Erfahrung', icon: Briefcase },
  { id: 'education',    label: 'Ausbildung',             short: 'Bildung',   icon: GraduationCap },
  { id: 'skills',       label: 'Fähigkeiten',            short: 'Skills',    icon: Zap },
  { id: 'projects',     label: 'Projekte & Zertifikate', short: 'Projekte',  icon: FolderOpen },
  { id: 'documents',    label: 'Dokumente',              short: 'Dokumente', icon: Upload },
  { id: 'custom',       label: 'Eigene Sektionen',       short: 'Eigene',    icon: LayoutList },
  { id: 'template',     label: 'Design & Template',      short: 'Design',    icon: Palette },
];

export default function Editor() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { getActiveResume, getActivePerson, activeSection, setActiveSection, resumes } = useResumeStore();
  const { limits } = usePlan();
  const [showTranslate, setShowTranslate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const resume = getActiveResume();
  const person = getActivePerson();

  // Check if the active resume is frozen (beyond plan limit)
  const resumeIndex = resume ? resumes.findIndex(r => r.id === resume.id) : -1;
  const isFrozen = limits.resumes < Infinity && resumeIndex >= limits.resumes;

  if (!resume || !person) {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: '48px 32px', textAlign: 'center', margin: 'auto' }}>
        <AlertCircle size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Kein Lebenslauf ausgewählt</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
          Wählen Sie eine Person in der Seitenleiste oder legen Sie eine neue an.
        </p>
        <button className="btn-glass btn-primary" onClick={() => navigate('/')}>
          Zum Dashboard
        </button>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'personal':     return <PersonalInfoEditor />;
      case 'cover-letter': return <CoverLetterEditor />;
      case 'experience':   return <ExperienceEditor />;
      case 'education':    return <EducationEditor />;
      case 'skills':       return <SkillsEditor />;
      case 'projects':     return <ProjectsEditor />;
      case 'documents':    return <DocumentUpload />;
      case 'custom':       return <CustomSectionEditor />;
      case 'template':     return <TemplateSelector />;
      default:           return null;
    }
  };

  const currentSection = SECTIONS.find(s => s.id === activeSection);

  // ── Frozen overlay ────────────────────────────────────────
  if (isFrozen) {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: '48px 32px', textAlign: 'center', margin: 'auto', maxWidth: 400 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,159,10,0.15)', border: '1px solid rgba(255,159,10,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Lock size={24} style={{ color: '#FF9F0A' }} />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Mappe eingefroren</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 }}>
          «{resume.name || 'Bewerbungsmappe'}» überschreitet dein Free-Limit von {limits.resumes} Mappen.
          Upgrade auf Pro oder lösche andere Mappen um diese wieder zu bearbeiten.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-glass" onClick={() => navigate('/')}>← Dashboard</button>
          <button
            className="btn-glass"
            onClick={() => navigate('/account')}
            style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.3), rgba(255,55,95,0.2))', border: '1px solid rgba(255,159,10,0.4)', color: '#FF9F0A', fontWeight: 700 }}
          >
            Upgrade auf Pro
          </button>
        </div>
      </div>
    );
  }

  // ── Mobile layout: horizontal tab bar ─────────────────────
  if (isMobile) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Horizontal scrollable tab bar */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: 6,
          paddingBottom: 8,
          flexShrink: 0,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {SECTIONS.map(({ id, short, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                className="btn-glass"
                onClick={() => setActiveSection(id)}
                style={{
                  flexShrink: 0,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'none',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(0,122,255,0.3), rgba(88,86,214,0.25))'
                    : 'rgba(255,255,255,0.07)',
                  border: isActive
                    ? '1px solid rgba(0,122,255,0.45)'
                    : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', gap: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={13} style={{ opacity: isActive ? 1 : 0.55 }} />
                <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, opacity: isActive ? 1 : 0.65 }}>
                  {short}
                </span>
              </button>
            );
          })}
        </div>

        {/* Editor content */}
        <div
          className="glass"
          style={{
            flex: 1,
            borderRadius: 'var(--radius-lg)',
            overflow: 'auto',
            padding: '16px 16px',
          }}
        >
          {renderSection()}
        </div>
      </div>
    );
  }

  // ── Desktop layout: vertical sidebar ──────────────────────
  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: 16, height: '100%', overflow: 'hidden' }}>
      {showTranslate && <TranslateDialog onClose={() => setShowTranslate(false)} />}

      {/* Section nav */}
      <aside style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {SECTIONS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              className="btn-glass"
              onClick={() => setActiveSection(id)}
              style={{
                justifyContent: 'flex-start',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'none',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(0,122,255,0.25), rgba(88,86,214,0.2))'
                  : 'rgba(255,255,255,0.05)',
                border: isActive
                  ? '1px solid rgba(0,122,255,0.4)'
                  : '1px solid rgba(255,255,255,0.08)',
                gap: 8,
              }}
            >
              <Icon size={14} style={{ opacity: isActive ? 1 : 0.55, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, opacity: isActive ? 1 : 0.65, textAlign: 'left', lineHeight: 1.2 }}>
                {label}
              </span>
            </button>
          );
        })}

        {/* Translate + History buttons */}
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            className="btn-glass"
            onClick={() => { setShowTranslate(true); setShowHistory(false); }}
            style={{
              justifyContent: 'flex-start', width: '100%',
              padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              boxShadow: 'none', gap: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Languages size={14} style={{ opacity: 0.55, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.65, textAlign: 'left', lineHeight: 1.2 }}>
              Übersetzen
            </span>
          </button>

          {limits.versionHistory ? (
            <button
              className="btn-glass"
              onClick={() => setShowHistory(v => !v)}
              style={{
                justifyContent: 'flex-start', width: '100%',
                padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                boxShadow: 'none', gap: 8,
                background: showHistory ? 'linear-gradient(135deg, rgba(0,122,255,0.25), rgba(88,86,214,0.2))' : 'rgba(255,255,255,0.05)',
                border: showHistory ? '1px solid rgba(0,122,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <History size={14} style={{ opacity: showHistory ? 1 : 0.55, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: showHistory ? 600 : 400, opacity: showHistory ? 1 : 0.65, textAlign: 'left', lineHeight: 1.2 }}>
                Versionen
              </span>
            </button>
          ) : (
            <button
              className="btn-glass"
              disabled
              title="Pro-Feature"
              style={{
                justifyContent: 'flex-start', width: '100%',
                padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                boxShadow: 'none', gap: 8, opacity: 0.4, cursor: 'not-allowed',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <History size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, textAlign: 'left', lineHeight: 1.2, flex: 1 }}>Versionen</span>
              <Lock size={11} style={{ opacity: 0.5 }} />
            </button>
          )}
        </div>
      </aside>

      {/* Editor content */}
      <div
        className="glass"
        style={{ flex: 1, borderRadius: 'var(--radius-lg)', overflow: 'auto', padding: '20px 22px' }}
      >
        {showHistory ? (
          <VersionHistoryPanel resumeId={resume.id} />
        ) : (
        <>
        {/* Section header */}
        <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {currentSection?.icon && (
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(0,122,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <currentSection.icon size={15} />
              </div>
            )}
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{currentSection?.label}</h2>
          </div>
        </div>

        {renderSection()}
        </>
        )}
      </div>
    </div>
  );
}
