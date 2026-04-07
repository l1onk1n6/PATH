import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, FileText, Plus, ChevronRight, Trash2,
  LayoutDashboard, Eye, FilePlus, LogOut,
  PanelLeftClose, PanelLeftOpen, Sparkles, UserCircle, Lock,
} from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { useAuthStore } from '../../store/authStore';
import { LogoFull, LogoIcon } from './Logo';
import { usePlan } from '../../lib/plan';
import { UpgradeModal } from '../ui/ProGate';

interface SidebarProps {
  onClose?: () => void;          // mobile drawer close
  collapsed?: boolean;            // desktop collapse state
  onToggleCollapse?: () => void;  // desktop collapse toggle
}

export default function Sidebar({ onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [addingPerson, setAddingPerson] = useState(false);
  const [newName, setNewName] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [expandedPersonIds, setExpandedPersonIds] = useState<Set<string>>(new Set());
  const { signOut } = useAuthStore();
  const { isPro, limits } = usePlan();

  function toggleExpand(id: string) {
    setExpandedPersonIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }


  const {
    persons, resumes, activePersonId, activeResumeId,
    addPerson, setActivePerson,
    addResume, setActiveResume, deleteResume,
  } = useResumeStore();

  const frozenPersonIds = new Set(
    limits.persons < Infinity ? persons.slice(limits.persons).map(p => p.id) : []
  );
  const frozenResumeIds = new Set(
    limits.resumes < Infinity ? resumes.slice(limits.resumes).map(r => r.id) : []
  );

  function go(path: string) {
    navigate(path);
    onClose?.();
  }

  async function handleAddPerson() {
    if (!newName.trim()) return;
    const person = await addPerson(newName.trim());
    setNewName('');
    setAddingPerson(false);
    if (person) go('/editor');
  }

  function handleSelectPerson(id: string) {
    setActivePerson(id);
    go('/editor');
  }

  async function handleAddResume(personId: string) {
    const resume = await addResume(personId);
    if (resume) go('/editor');
  }

  const isActive = (path: string) => location.pathname === path;

  // ── Collapsed (icon-only) sidebar ──────────────────────────
  if (collapsed) {
    return (
      <aside style={{
        width: 60, height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '16px 0', gap: 4,
      }}>
        {/* Logo icon */}
        <div style={{ marginBottom: 16, filter: 'drop-shadow(0 3px 8px rgba(52,199,89,0.4))' }}>
          <LogoIcon size={32} />
        </div>

        {/* Expand button */}
        <button
          className="btn-glass btn-icon"
          onClick={onToggleCollapse}
          title="Seitenleiste einblenden"
          style={{ padding: 8, marginBottom: 8, boxShadow: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <PanelLeftOpen size={15} />
        </button>

        <div style={{ width: '70%', height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0 8px' }} />

        {/* Nav icons */}
        {[
          { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/editor', icon: FileText, label: 'Editor' },
          { path: '/preview', icon: Eye, label: 'Vorschau' },
          { path: '/account', icon: UserCircle, label: 'Konto' },
        ].map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => go(path)}
            className="btn-glass btn-icon"
            title={label}
            style={{
              padding: 10, boxShadow: 'none',
              background: isActive(path) ? 'rgba(0,122,255,0.2)' : 'transparent',
              border: isActive(path) ? '1px solid rgba(0,122,255,0.35)' : '1px solid transparent',
            }}
          >
            <Icon size={17} style={{ opacity: isActive(path) ? 1 : 0.55 }} />
          </button>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer icons */}
        <button
          className="btn-glass btn-icon"
          onClick={() => signOut()}
          title="Abmelden"
          style={{ padding: 9, boxShadow: 'none' }}
        >
          <LogOut size={15} />
        </button>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </aside>
    );
  }

  // ── Full sidebar ────────────────────────────────────────────
  return (
    <aside style={{ display: 'flex', flexDirection: 'column', height: '100%', width: 240, flexShrink: 0, padding: '16px 12px' }}>
      {/* Logo + collapse button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingLeft: 4 }}>
        <LogoFull size={32} />
        {onToggleCollapse && (
          <button
            className="btn-glass btn-icon btn-sm"
            onClick={onToggleCollapse}
            title="Seitenleiste einklappen"
            style={{ padding: 6, boxShadow: 'none', opacity: 0.6, background: 'transparent', border: 'none', flexShrink: 0 }}
          >
            <PanelLeftClose size={15} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ marginBottom: 20 }}>
        <div className="section-label" style={{ paddingLeft: 8 }}>Navigation</div>
        {[
          { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/editor', icon: FileText, label: 'Editor' },
          { path: '/preview', icon: Eye, label: 'Vorschau' },
          { path: '/account', icon: UserCircle, label: 'Konto' },
        ].map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => go(path)}
            className="btn-glass"
            style={{
              width: '100%', justifyContent: 'flex-start',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 4,
              background: isActive(path)
                ? 'linear-gradient(135deg, rgba(0,122,255,0.25), rgba(88,86,214,0.2))'
                : 'transparent',
              border: isActive(path)
                ? '1px solid rgba(0,122,255,0.4)'
                : '1px solid transparent',
              boxShadow: 'none',
            }}
          >
            <Icon size={16} style={{ opacity: isActive(path) ? 1 : 0.6 }} />
            <span style={{ opacity: isActive(path) ? 1 : 0.7 }}>{label}</span>
          </button>
        ))}
      </nav>

      <div className="divider" />

      {/* Persons */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 8 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>
            <Users size={10} style={{ display: 'inline', marginRight: 5 }} />
            Personen
          </div>
          <button
            className="btn-glass btn-icon btn-sm"
            onClick={() => setAddingPerson(true)}
            title="Person hinzufügen"
            style={{ padding: 5 }}
          >
            <Plus size={13} />
          </button>
        </div>

        {addingPerson && (
          <div className="glass-card animate-scale-in" style={{ padding: 12, marginBottom: 8, borderRadius: 'var(--radius-sm)' }}>
            <input
              className="input-glass"
              placeholder="Name eingeben..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
              autoFocus
              style={{ marginBottom: 8, fontSize: 13, padding: '8px 10px' }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-glass btn-primary btn-sm" onClick={handleAddPerson} style={{ flex: 1, fontSize: 12 }}>
                Erstellen
              </button>
              <button className="btn-glass btn-sm" onClick={() => { setAddingPerson(false); setNewName(''); }} style={{ fontSize: 12 }}>
                Abbruch
              </button>
            </div>
          </div>
        )}

        <div style={{ overflow: 'auto', flex: 1 }}>
          {persons.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 8px', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              Noch keine Personen.<br />
              <button className="btn-glass btn-sm" onClick={() => setAddingPerson(true)} style={{ marginTop: 10, fontSize: 12 }}>
                <Plus size={12} /> Person anlegen
              </button>
            </div>
          )}

          {persons.map((person) => {
            const isActiveP = person.id === activePersonId;
            const isExpanded = expandedPersonIds.has(person.id) || isActiveP;
            const personResumes = resumes.filter((r) => person.resumeIds.includes(r.id));
            const photo = personResumes[0]?.personalInfo?.photo;
            const isPersonFrozen = frozenPersonIds.has(person.id);

            return (
              <div key={person.id} style={{ marginBottom: 4, opacity: isPersonFrozen ? 0.55 : 1 }}>
                {/* Person row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {/* Expand/collapse toggle */}
                  <button
                    onClick={() => toggleExpand(person.id)}
                    style={{
                      background: 'none', border: 'none', padding: '4px 2px', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.4)', flexShrink: 0, display: 'flex', alignItems: 'center',
                    }}
                  >
                    <ChevronRight
                      size={13}
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s' }}
                    />
                  </button>

                  {/* Avatar + name — click to activate (blocked if frozen) */}
                  <button
                    className="btn-glass"
                    onClick={() => {
                      if (isPersonFrozen) return;
                      handleSelectPerson(person.id);
                      if (!isExpanded) toggleExpand(person.id);
                    }}
                    style={{
                      flex: 1, justifyContent: 'space-between', padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: isPersonFrozen
                        ? 'rgba(255,159,10,0.07)'
                        : isActiveP ? 'rgba(0,122,255,0.15)' : 'rgba(255,255,255,0.04)',
                      border: isPersonFrozen
                        ? '1px solid rgba(255,159,10,0.2)'
                        : isActiveP ? '1px solid rgba(0,122,255,0.3)' : '1px solid rgba(255,255,255,0.07)',
                      boxShadow: 'none', minWidth: 0, cursor: isPersonFrozen ? 'default' : 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                      {isPersonFrozen ? (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,159,10,0.15)' }}>
                          <Lock size={11} style={{ color: '#FF9F0A' }} />
                        </div>
                      ) : (
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                          background: photo ? 'transparent' : `linear-gradient(135deg, hsl(${person.name.charCodeAt(0) * 10 % 360}, 65%, 48%), hsl(${person.name.charCodeAt(0) * 15 % 360}, 55%, 38%))`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: '#fff',
                        }}>
                          {photo
                            ? <img src={photo} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : person.name.charAt(0).toUpperCase()
                          }
                        </div>
                      )}
                      <span style={{
                        fontSize: 12, fontWeight: isActiveP && !isPersonFrozen ? 600 : 400,
                        color: isPersonFrozen ? '#FF9F0A' : undefined,
                        opacity: isPersonFrozen ? 0.85 : isActiveP ? 1 : 0.8,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {person.name}
                      </span>
                    </div>
                    <span className="badge" style={{ fontSize: 10, flexShrink: 0 }}>{personResumes.length}</span>
                  </button>
                </div>

                {/* Resumes — shown when expanded */}
                {isExpanded && (
                  <div style={{ marginLeft: 18, marginTop: 3, paddingLeft: 8, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                    {personResumes.map((resume) => {
                      const isActiveR = resume.id === activeResumeId;
                      const isResumeFrozen = isPersonFrozen || frozenResumeIds.has(resume.id);
                      const name = resume.name || `Bewerbungsmappe ${personResumes.indexOf(resume) + 1}`;
                      return (
                        <div key={resume.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2, opacity: isResumeFrozen ? 0.5 : 1 }}>
                          <button
                            className="btn-glass"
                            onClick={() => { if (!isResumeFrozen) { setActiveResume(resume.id); go('/editor'); } }}
                            style={{
                              flex: 1, justifyContent: 'flex-start', padding: '6px 8px',
                              borderRadius: 6,
                              background: isActiveR && !isResumeFrozen ? 'rgba(0,122,255,0.2)' : 'transparent',
                              border: isActiveR && !isResumeFrozen ? '1px solid rgba(0,122,255,0.35)' : '1px solid transparent',
                              boxShadow: 'none', gap: 5, minWidth: 0,
                              cursor: isResumeFrozen ? 'default' : 'pointer',
                            }}
                          >
                            {isResumeFrozen
                              ? <Lock size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
                              : <FileText size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
                            }
                            <span style={{
                              fontSize: 11, opacity: isActiveR && !isResumeFrozen ? 1 : 0.65,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {name}
                            </span>
                          </button>
                          {personResumes.length > 1 && (
                            <button
                              onClick={() => deleteResume(resume.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.35, color: 'inherit', flexShrink: 0, display: 'flex' }}
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {!isPersonFrozen && (
                      <button
                        onClick={() => handleAddResume(person.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, width: '100%',
                          background: 'none', border: 'none', borderTop: '1px dashed rgba(255,255,255,0.1)',
                          cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 11,
                          padding: '5px 6px', marginTop: 2,
                        }}
                      >
                        <FilePlus size={10} /> Mappe hinzufügen
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="divider" />

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* Plan badge + Logout */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {!isPro ? (
          <button
            onClick={() => setShowUpgrade(true)}
            className="btn-glass"
            style={{
              width: '100%', justifyContent: 'center', padding: '8px 12px',
              background: 'linear-gradient(135deg, rgba(255,159,10,0.12), rgba(255,55,95,0.1))',
              border: '1px solid rgba(255,159,10,0.25)', boxShadow: 'none', fontSize: 12, gap: 7,
            }}
          >
            <Sparkles size={13} style={{ color: '#FF9F0A' }} />
            <span style={{ fontWeight: 600, color: '#FF9F0A' }}>Auf Pro upgraden</span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#FF9F0A', padding: '4px 0' }}>
            <Sparkles size={12} />
            <span style={{ fontWeight: 700 }}>PATH Pro</span>
          </div>
        )}

        <button
          className="btn-glass btn-sm"
          onClick={() => signOut()}
          style={{ width: '100%', justifyContent: 'center', padding: '8px 10px', boxShadow: 'none', fontSize: 12 }}
        >
          <LogOut size={13} /> Logout
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </aside>
  );
}
