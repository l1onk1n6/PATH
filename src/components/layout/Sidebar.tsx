import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, FileText, Plus, ChevronRight, Trash2,
  LayoutDashboard, Eye, FilePlus, LogOut,
  PanelLeftClose, PanelLeftOpen, Mail,
} from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { useAuthStore } from '../../store/authStore';
import { LogoFull, LogoIcon } from './Logo';

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
  const { user, signOut } = useAuthStore();


  const {
    persons, resumes, activePersonId, activeResumeId,
    addPerson, setActivePerson,
    addResume, setActiveResume, deleteResume,
  } = useResumeStore();

  function go(path: string) {
    navigate(path);
    onClose?.();
  }

  function handleAddPerson() {
    if (!newName.trim()) return;
    addPerson(newName.trim());
    setNewName('');
    setAddingPerson(false);
    go('/editor');
  }

  function handleSelectPerson(id: string) {
    setActivePerson(id);
    go('/editor');
  }

  function handleAddResume(personId: string) {
    addResume(personId);
    go('/editor');
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
            const personResumes = resumes.filter((r) => person.resumeIds.includes(r.id));
            const photo = personResumes[0]?.personalInfo?.photo;

            return (
              <div key={person.id} style={{ marginBottom: 6 }}>
                <button
                  className="btn-glass"
                  onClick={() => handleSelectPerson(person.id)}
                  style={{
                    width: '100%', justifyContent: 'space-between', padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isActiveP ? 'rgba(0,122,255,0.15)' : 'transparent',
                    border: isActiveP ? '1px solid rgba(0,122,255,0.3)' : '1px solid transparent',
                    boxShadow: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                      background: photo ? 'transparent' : `linear-gradient(135deg, hsl(${person.name.charCodeAt(0) * 10 % 360}, 70%, 50%), hsl(${person.name.charCodeAt(0) * 15 % 360}, 60%, 40%))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600, color: '#fff',
                    }}>
                      {photo
                        ? <img src={photo} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : person.name.charAt(0).toUpperCase()
                      }
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, opacity: isActiveP ? 1 : 0.75, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {person.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <span className="badge" style={{ fontSize: 10 }}>{personResumes.length}</span>
                    <ChevronRight size={12} style={{ opacity: 0.5, transform: isActiveP ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                  </div>
                </button>

                {isActiveP && (
                  <div style={{ paddingLeft: 12, marginTop: 4 }}>
                    {personResumes.map((resume) => {
                      const isActiveR = resume.id === activeResumeId;
                      const name = resume.name || `Bewerbungsmappe ${personResumes.indexOf(resume) + 1}`;

                      return (
                        <div key={resume.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <button
                            className="btn-glass"
                            onClick={() => { setActiveResume(resume.id); go('/editor'); }}
                            style={{
                              flex: 1, justifyContent: 'flex-start', padding: '7px 10px',
                              borderRadius: 'var(--radius-xs)',
                              background: isActiveR ? 'rgba(0,122,255,0.2)' : 'rgba(255,255,255,0.04)',
                              border: isActiveR ? '1px solid rgba(0,122,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
                              boxShadow: 'none', gap: 6,
                            }}
                          >
                            <FileText size={11} style={{ opacity: 0.6, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, opacity: isActiveR ? 1 : 0.65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {name}
                            </span>
                          </button>
                          {personResumes.length > 1 && (
                            <button
                              className="btn-glass btn-icon"
                              onClick={() => deleteResume(resume.id)}
                              style={{ padding: 5, opacity: 0.5, boxShadow: 'none', background: 'transparent', border: 'none' }}
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    <button
                      className="btn-glass btn-sm"
                      onClick={() => handleAddResume(person.id)}
                      style={{
                        width: '100%', justifyContent: 'center', padding: '6px 10px',
                        borderRadius: 'var(--radius-xs)', fontSize: 11, marginTop: 2,
                        background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)',
                        boxShadow: 'none',
                      }}
                    >
                      <FilePlus size={11} /> Mappe hinzufügen
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="divider" />

      {user && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, paddingLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.email}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <button
          className="btn-glass btn-sm"
          onClick={() => signOut()}
          title="Abmelden"
          style={{ flex: 1, justifyContent: 'center', padding: '8px 10px', boxShadow: 'none', fontSize: 12 }}
        >
          <LogOut size={13} /> Logout
        </button>
        <a
          href="mailto:info@pixmatic.ch"
          title="Support kontaktieren"
          className="btn-glass btn-sm btn-icon"
          style={{ padding: '8px 10px', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}
        >
          <Mail size={13} />
        </a>
      </div>

      {/* Legal links */}
      <div style={{ display: 'flex', gap: 10, paddingLeft: 4, flexWrap: 'wrap' }}>
        {[
          { label: 'Datenschutz', href: 'https://pixmatic.ch/datenschutz' },
          { label: 'AGB', href: 'https://pixmatic.ch/agb' },
        ].map(({ label, href }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
            {label}
          </a>
        ))}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </aside>
  );
}
