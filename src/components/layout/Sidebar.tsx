import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useBreakpoint';
import {
  Plus, ChevronRight, ChevronDown, Trash2,
  LayoutDashboard, FileText, Eye, FilePlus, LogOut,
  PanelLeftClose, PanelLeftOpen, Sparkles, UserCircle, Lock,
  ClipboardList, FileEdit,
} from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { useAuthStore } from '../../store/authStore';
import { LogoFull, LogoIcon } from './Logo';
import { usePlan } from '../../lib/plan';
import { UpgradeModal } from '../ui/ProGate';
import { displayPersonName } from '../../lib/displayName';
import type { Person, Resume } from '../../types/resume';

interface SidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const { signOut } = useAuthStore();
  const { isPro, limits } = usePlan();
  const {
    persons, resumes, activePersonId, activeResumeId,
    addPerson, setActivePerson, addResume, setActiveResume, deleteResume,
  } = useResumeStore();

  const [showUpgrade, setShowUpgrade] = useState(false);

  function go(path: string) { navigate(path); onClose?.(); }
  const isActive = (path: string) => location.pathname === path;

  // ── Collapsed (icon-only) sidebar ──────────────────────────
  if (collapsed) {
    return (
      <aside style={{ width: 60, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 4 }}>
        <div style={{ marginBottom: 16, filter: 'drop-shadow(0 3px 8px rgba(52,199,89,0.4))' }}>
          <LogoIcon size={32} />
        </div>
        <button className="btn-glass btn-icon" onClick={onToggleCollapse} title="Seitenleiste einblenden"
          style={{ padding: 8, marginBottom: 8, boxShadow: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <PanelLeftOpen size={15} />
        </button>
        <div style={{ width: '70%', height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0 8px' }} />
        {[
          { path: '/',        icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/editor',  icon: FileText,        label: 'Editor' },
          { path: '/preview', icon: Eye,             label: 'Vorschau' },
          { path: '/tracker', icon: ClipboardList,   label: 'Tracker' },
          { path: '/account', icon: UserCircle,      label: 'Konto' },
        ].map(({ path, icon: Icon, label }) => (
          <button key={path} onClick={() => go(path)} className="btn-glass btn-icon" title={label}
            style={{ padding: 10, boxShadow: 'none', background: isActive(path) ? 'rgba(0,122,255,0.2)' : 'transparent', border: isActive(path) ? '1px solid rgba(0,122,255,0.35)' : '1px solid transparent' }}>
            <Icon size={17} style={{ opacity: isActive(path) ? 1 : 0.55 }} />
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn-glass btn-icon" onClick={() => signOut()} title="Abmelden" style={{ padding: 9, boxShadow: 'none' }}>
          <LogOut size={15} />
        </button>
      </aside>
    );
  }

  // ── Full sidebar: Logo | Aktive-Mappe-Switcher | Flat Nav | Bottom ──
  const frozenPersonIds = new Set(
    limits.persons < Infinity ? persons.slice(limits.persons).map(p => p.id) : []
  );
  const frozenResumeIds = new Set(
    limits.resumes < Infinity ? resumes.slice(limits.resumes).map(r => r.id) : []
  );

  const activePerson = persons.find(p => p.id === activePersonId) ?? null;
  const activeResume = resumes.find(r => r.id === activeResumeId) ?? null;

  const navPad   = isMobile ? '11px 14px' : '10px 12px';
  const navStyle = (active: boolean): React.CSSProperties => ({
    width: '100%', justifyContent: 'flex-start',
    borderRadius: 'var(--radius-sm)', padding: navPad, marginBottom: isMobile ? 3 : 1,
    fontSize: isMobile ? 15 : undefined,
    background: active ? 'linear-gradient(135deg, rgba(0,122,255,0.25), rgba(88,86,214,0.2))' : 'transparent',
    border: active ? '1px solid rgba(0,122,255,0.4)' : '1px solid transparent',
    boxShadow: 'none',
  });

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', height: '100%', width: isMobile ? 280 : 240, flexShrink: 0, padding: '16px 12px' }}>
      {/* Logo + collapse */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingLeft: 4 }}>
        <LogoFull size={32} />
        {onToggleCollapse && (
          <button className="btn-glass btn-icon btn-sm" onClick={onToggleCollapse} title="Seitenleiste einklappen"
            style={{ padding: 6, boxShadow: 'none', opacity: 0.6, background: 'transparent', border: 'none', flexShrink: 0 }}>
            <PanelLeftClose size={15} />
          </button>
        )}
      </div>

      {/* Aktive Mappe - Header + Switcher */}
      <MappeSwitcher
        persons={persons}
        resumes={resumes}
        activePerson={activePerson}
        activeResume={activeResume}
        frozenPersonIds={frozenPersonIds}
        frozenResumeIds={frozenResumeIds}
        onSelectPerson={(id) => { setActivePerson(id); go('/editor'); }}
        onSelectResume={(id) => { setActiveResume(id); go('/editor'); }}
        onAddPerson={async (name) => { const p = await addPerson(name); if (p) go('/editor'); }}
        onAddResume={async (personId) => { const r = await addResume(personId); if (r) go('/editor'); }}
        onDeleteResume={deleteResume}
        isMobile={isMobile}
      />

      {/* Flat navigation */}
      <nav style={{ marginTop: 12, marginBottom: 8 }}>
        {[
          { path: '/',        icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/editor',  icon: FileEdit,        label: 'Editor' },
          { path: '/preview', icon: Eye,             label: 'Vorschau' },
          { path: '/tracker', icon: ClipboardList,   label: 'Tracker' },
          { path: '/account', icon: UserCircle,      label: 'Konto' },
        ].map(({ path, icon: Icon, label }) => {
          const act = isActive(path);
          return (
            <button key={path} onClick={() => go(path)} className="btn-glass" style={navStyle(act)}>
              <Icon size={16} style={{ opacity: act ? 1 : 0.6 }} />
              <span style={{ opacity: act ? 1 : 0.7 }}>{label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Bottom: Pro-Badge + Logout */}
      <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
        {!isPro ? (
          <button onClick={() => setShowUpgrade(true)} className="btn-glass"
            style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', background: 'linear-gradient(135deg, rgba(255,159,10,0.12), rgba(255,55,95,0.1))', border: '1px solid rgba(255,159,10,0.25)', boxShadow: 'none', fontSize: 12, gap: 7 }}>
            <Sparkles size={13} style={{ color: '#FF9F0A' }} />
            <span style={{ fontWeight: 600, color: '#FF9F0A' }}>Auf Pro upgraden</span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#FF9F0A', padding: '4px 0' }}>
            <Sparkles size={12} /><span style={{ fontWeight: 700 }}>PATH Pro</span>
          </div>
        )}
        <button className="btn-glass btn-sm" onClick={() => signOut()}
          style={{ width: '100%', justifyContent: 'center', padding: '8px 10px', boxShadow: 'none', fontSize: 12 }}>
          <LogOut size={13} /> Abmelden
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
//  Aktive-Mappe-Header + Switcher
// ─────────────────────────────────────────────────────────────

interface MappeSwitcherProps {
  persons: Person[];
  resumes: Resume[];
  activePerson: Person | null;
  activeResume: Resume | null;
  frozenPersonIds: Set<string>;
  frozenResumeIds: Set<string>;
  onSelectPerson: (id: string) => void;
  onSelectResume: (id: string) => void;
  onAddPerson: (name: string) => void | Promise<void>;
  onAddResume: (personId: string) => void | Promise<void>;
  onDeleteResume: (id: string) => void;
  isMobile: boolean;
}

function MappeSwitcher(props: MappeSwitcherProps) {
  const {
    persons, resumes, activePerson, activeResume,
    frozenPersonIds, frozenResumeIds,
    onSelectPerson, onSelectResume, onAddPerson, onAddResume, onDeleteResume,
  } = props;

  const [open, setOpen] = useState(false);
  const [addingPerson, setAddingPerson] = useState(false);
  const [newName, setNewName] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(activePerson ? [activePerson.id] : []));

  // Klick ausserhalb → schliessen
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const activePersonResumes = activePerson ? resumes.filter(r => activePerson.resumeIds.includes(r.id)) : [];
  const photo = activePersonResumes.find(r => r.personalInfo.photo)?.personalInfo.photo;
  const headerName = displayPersonName(activePerson, activeResume ?? activePersonResumes[0]);
  const headerSub  = activeResume?.name ?? activeResume?.personalInfo.title ?? 'Keine Mappe ausgewählt';

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function submitNewPerson() {
    if (!newName.trim()) return;
    await onAddPerson(newName.trim());
    setNewName(''); setAddingPerson(false); setOpen(false);
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      {/* Header-Button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="btn-glass"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
          borderRadius: 'var(--radius-sm)', boxShadow: 'none',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          textAlign: 'left',
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          background: photo ? 'transparent' : `linear-gradient(135deg, hsl(${headerName.charCodeAt(0) * 10 % 360}, 65%, 48%), hsl(${headerName.charCodeAt(0) * 15 % 360}, 55%, 38%))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
          {photo ? <img src={photo} alt={headerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : headerName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {headerName}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {headerSub}
          </div>
        </div>
        <ChevronDown size={14} style={{ opacity: 0.55, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }} />
      </button>

      {/* Popover — inline ausklappend, nicht absolut, damit er in der Sidebar
          nicht ueber andere Nav-Items floatet. */}
      {open && (
        <div style={{
          marginTop: 6, padding: 8, maxHeight: 420, overflowY: 'auto',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(12,12,20,0.75)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}>
          {persons.length === 0 && !addingPerson && (
            <div style={{ padding: '20px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              Noch keine Person.
            </div>
          )}

          {persons.map(person => {
            const personResumes = resumes.filter(r => person.resumeIds.includes(r.id));
            const isFrozen = frozenPersonIds.has(person.id);
            const isExpanded = expanded.has(person.id) || person.id === activePerson?.id;
            const dname = displayPersonName(person, personResumes[0]);
            const ppic = personResumes.find(r => r.personalInfo.photo)?.personalInfo.photo;
            return (
              <div key={person.id} style={{ marginBottom: 4, opacity: isFrozen ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => toggleExpand(person.id)}
                    style={{ background: 'none', border: 'none', padding: '4px 2px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <ChevronRight size={12} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s' }} />
                  </button>
                  <button onClick={() => { if (isFrozen) return; onSelectPerson(person.id); setOpen(false); }}
                    className="btn-glass"
                    style={{ flex: 1, justifyContent: 'flex-start', padding: '6px 8px', gap: 8, borderRadius: 6, boxShadow: 'none',
                      background: person.id === activePerson?.id ? 'rgba(0,122,255,0.15)' : 'transparent',
                      border: person.id === activePerson?.id ? '1px solid rgba(0,122,255,0.3)' : '1px solid transparent',
                      minWidth: 0, cursor: isFrozen ? 'default' : 'pointer' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                      background: ppic ? 'transparent' : `linear-gradient(135deg, hsl(${dname.charCodeAt(0) * 10 % 360}, 65%, 48%), hsl(${dname.charCodeAt(0) * 15 % 360}, 55%, 38%))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                      {ppic ? <img src={ppic} alt={dname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : dname.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: person.id === activePerson?.id ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {dname}
                    </span>
                    {isFrozen && <Lock size={10} style={{ color: '#FF9F0A', flexShrink: 0 }} />}
                    <span className="badge" style={{ fontSize: 10, flexShrink: 0 }}>{personResumes.length}</span>
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ marginLeft: 14, marginTop: 2, paddingLeft: 8, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                    {personResumes.map(r => {
                      const isResumeFrozen = isFrozen || frozenResumeIds.has(r.id);
                      const isActiveR = r.id === activeResume?.id;
                      const name = r.name || `Bewerbungsmappe ${personResumes.indexOf(r) + 1}`;
                      return (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2, opacity: isResumeFrozen ? 0.5 : 1 }}>
                          <button onClick={() => { if (!isResumeFrozen) { onSelectResume(r.id); setOpen(false); } }}
                            className="btn-glass"
                            style={{ flex: 1, justifyContent: 'flex-start', padding: '6px 8px', borderRadius: 6, boxShadow: 'none', gap: 6, minWidth: 0,
                              background: isActiveR && !isResumeFrozen ? 'rgba(0,122,255,0.2)' : 'transparent',
                              border: isActiveR && !isResumeFrozen ? '1px solid rgba(0,122,255,0.35)' : '1px solid transparent',
                              cursor: isResumeFrozen ? 'default' : 'pointer' }}>
                            {isResumeFrozen ? <Lock size={10} style={{ opacity: 0.5, flexShrink: 0 }} /> : <FileText size={10} style={{ opacity: 0.5, flexShrink: 0 }} />}
                            <span style={{ fontSize: 11, opacity: isActiveR ? 1 : 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {name}
                            </span>
                          </button>
                          {personResumes.length > 1 && (
                            <button onClick={() => onDeleteResume(r.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.35, color: 'inherit', flexShrink: 0, display: 'flex' }}>
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {!isFrozen && (
                      <button onClick={() => { onAddResume(person.id); setOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', background: 'none', border: 'none', borderTop: '1px dashed rgba(255,255,255,0.1)', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 11, padding: '5px 6px', marginTop: 2 }}>
                        <FilePlus size={10} /> Mappe hinzufügen
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 4px' }} />

          {addingPerson ? (
            <div style={{ padding: 6 }}>
              <input className="input-glass" placeholder="Name eingeben..." value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitNewPerson(); if (e.key === 'Escape') { setAddingPerson(false); setNewName(''); } }}
                autoFocus style={{ fontSize: 13, padding: '7px 9px', marginBottom: 6 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-glass btn-primary btn-sm" onClick={submitNewPerson} style={{ flex: 1, fontSize: 12 }}>Anlegen</button>
                <button className="btn-glass btn-sm" onClick={() => { setAddingPerson(false); setNewName(''); }} style={{ fontSize: 12 }}>Abbruch</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingPerson(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 12, padding: '7px 8px' }}>
              <Plus size={12} /> Neue Person
            </button>
          )}
        </div>
      )}
    </div>
  );
}
