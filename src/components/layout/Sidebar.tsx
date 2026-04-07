import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, FileText, Plus, ChevronRight, Trash2,
  LayoutDashboard, Eye, FilePlus, LogOut, Cloud,
} from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { useAuthStore } from '../../store/authStore';
import { LogoFull } from './Logo';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [addingPerson, setAddingPerson] = useState(false);
  const [newName, setNewName] = useState('');
  const { user, signOut } = useAuthStore();
  const { syncing, syncFromCloud } = useResumeStore();

  const {
    persons, resumes, activePersonId, activeResumeId,
    addPerson, setActivePerson,
    addResume, setActiveResume, deleteResume,
  } = useResumeStore();

  function handleAddPerson() {
    if (!newName.trim()) return;
    addPerson(newName.trim());
    setNewName('');
    setAddingPerson(false);
    navigate('/editor');
  }

  function handleSelectPerson(id: string) {
    setActivePerson(id);
    navigate('/editor');
  }

  function handleAddResume(personId: string) {
    addResume(personId);
    navigate('/editor');
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="flex flex-col h-full w-64 shrink-0 animate-slide-left" style={{ padding: '16px 12px' }}>
      {/* Logo */}
      <div style={{ marginBottom: 24, paddingLeft: 4 }}>
        <LogoFull size={36} />
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
            onClick={() => navigate(path)}
            className="btn-glass"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              marginBottom: 4,
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

            return (
              <div key={person.id} style={{ marginBottom: 6 }}>
                {/* Person row */}
                <button
                  className="btn-glass"
                  onClick={() => handleSelectPerson(person.id)}
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isActiveP ? 'rgba(0,122,255,0.15)' : 'transparent',
                    border: isActiveP ? '1px solid rgba(0,122,255,0.3)' : '1px solid transparent',
                    boxShadow: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, hsl(${person.name.charCodeAt(0) * 10 % 360}, 70%, 50%), hsl(${person.name.charCodeAt(0) * 15 % 360}, 60%, 40%))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0,
                    }}>
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, opacity: isActiveP ? 1 : 0.75, textAlign: 'left' }}>
                      {person.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="badge" style={{ fontSize: 10 }}>{personResumes.length}</span>
                    <ChevronRight size={12} style={{ opacity: 0.5, transform: isActiveP ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                  </div>
                </button>

                {/* Resumes under active person */}
                {isActiveP && (
                  <div style={{ paddingLeft: 12, marginTop: 4 }}>
                    {personResumes.map((resume) => {
                      const isActiveR = resume.id === activeResumeId;
                      const name = resume.personalInfo.firstName
                        ? `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`.trim()
                        : `Lebenslauf ${personResumes.indexOf(resume) + 1}`;

                      return (
                        <div key={resume.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <button
                            className="btn-glass"
                            onClick={() => { setActiveResume(resume.id); navigate('/editor'); }}
                            style={{
                              flex: 1,
                              justifyContent: 'flex-start',
                              padding: '7px 10px',
                              borderRadius: 'var(--radius-xs)',
                              background: isActiveR ? 'rgba(0,122,255,0.2)' : 'rgba(255,255,255,0.04)',
                              border: isActiveR ? '1px solid rgba(0,122,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
                              boxShadow: 'none',
                              gap: 6,
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
                      <FilePlus size={11} /> Lebenslauf hinzufügen
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="divider" />

      {/* Footer */}
      {user && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, paddingLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.email}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="btn-glass btn-sm"
          onClick={() => syncFromCloud()}
          disabled={syncing}
          title="Mit Cloud synchronisieren"
          style={{ flex: 1, justifyContent: 'center', padding: '8px 10px', boxShadow: 'none', fontSize: 12 }}
        >
          <Cloud size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          {syncing ? 'Sync…' : 'Sync'}
        </button>
        <button
          className="btn-glass btn-sm"
          onClick={() => signOut()}
          title="Abmelden"
          style={{ flex: 1, justifyContent: 'center', padding: '8px 10px', boxShadow: 'none', fontSize: 12 }}
        >
          <LogOut size={13} /> Logout
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </aside>
  );
}
