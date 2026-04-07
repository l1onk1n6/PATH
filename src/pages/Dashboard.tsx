import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit3, Trash2, FileText, Eye, TrendingUp, FolderPlus, Pencil } from 'lucide-react';
import { useResumeStore } from '../store/resumeStore';
import { useIsMobile } from '../hooks/useBreakpoint';

export default function Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    persons, resumes, addPerson, deletePerson, setActivePerson, activePersonId,
    addResume, deleteResume, setActiveResume, renameResume,
  } = useResumeStore();
  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // Adding a new Bewerbungsmappe per person
  const [addingResumeForPersonId, setAddingResumeForPersonId] = useState<string | null>(null);
  const [newResumeName, setNewResumeName] = useState('');

  // Renaming a resume inline
  const [renamingResumeId, setRenamingResumeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  function handleAdd() {
    if (!newName.trim()) return;
    addPerson(newName.trim());
    setNewName('');
    setShowAdd(false);
    navigate('/editor');
  }

  function handleAddResume(personId: string) {
    if (!newResumeName.trim()) return;
    addResume(personId, newResumeName.trim());
    setAddingResumeForPersonId(null);
    setNewResumeName('');
    navigate('/editor');
  }

  function handleRenameCommit(resumeId: string) {
    if (renameValue.trim()) renameResume(resumeId, renameValue.trim());
    setRenamingResumeId(null);
    setRenameValue('');
  }

  const totalResumes = resumes.length;
  const totalSections = resumes.reduce((acc, r) => acc + r.workExperience.length + r.education.length + r.skills.length, 0);

  return (
    <div className="animate-fade-in" style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 0 16px' : undefined }}>
      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: isMobile ? 8 : 12,
        marginBottom: isMobile ? 16 : 24,
      }}>
        {[
          { icon: Users, label: 'Personen', value: persons.length, color: 'var(--ios-blue)' },
          { icon: FileText, label: 'Mappen', value: totalResumes, color: 'var(--ios-purple)' },
          { icon: TrendingUp, label: isMobile ? 'Einträge' : 'Einträge gesamt', value: totalSections, color: 'var(--ios-green)' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card" style={{ padding: isMobile ? '12px 14px' : '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, letterSpacing: '-1px' }}>{value}</div>
                <div style={{ fontSize: isMobile ? 10 : 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{label}</div>
              </div>
              <div style={{
                width: isMobile ? 32 : 44, height: isMobile ? 32 : 44, borderRadius: isMobile ? 8 : 12,
                background: `${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={isMobile ? 16 : 20} style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
          Personen & Bewerbungsmappen
        </h2>
        <button className="btn-glass btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> {!isMobile && 'Neue '}Person
        </button>
      </div>

      {/* Add person form */}
      {showAdd && (
        <div className="glass-card animate-scale-in" style={{ padding: isMobile ? 14 : 20, marginBottom: 14 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Neue Person anlegen</h3>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8 }}>
            <input
              className="input-glass"
              placeholder="Vollständiger Name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
              style={{ flex: 1 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-glass btn-primary" onClick={handleAdd} style={{ flex: 1 }}>Erstellen</button>
              <button className="btn-glass" onClick={() => { setShowAdd(false); setNewName(''); }}>Abbruch</button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {persons.length === 0 && !showAdd && (
        <div className="glass-card" style={{ padding: isMobile ? '32px 20px' : '48px 24px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(0,122,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Users size={24} style={{ color: 'var(--ios-blue)' }} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Noch keine Profile</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 20 }}>
            Legen Sie Ihre erste Person an und beginnen Sie mit dem Lebenslauf.
          </p>
          <button className="btn-glass btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Erste Person anlegen
          </button>
        </div>
      )}

      {/* Persons Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: isMobile ? 10 : 14,
      }}>
        {persons.map((person) => {
          const personResumes = resumes.filter((r) => person.resumeIds.includes(r.id));
          const isActive = person.id === activePersonId;

          return (
            <div
              key={person.id}
              className="glass-card"
              style={{
                padding: isMobile ? 16 : 20,
                cursor: 'pointer',
                border: isActive ? '1px solid rgba(0,122,255,0.4)' : undefined,
              }}
              onClick={() => { setActivePerson(person.id); navigate('/editor'); }}
            >
              {/* Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, hsl(${person.name.charCodeAt(0) * 10 % 360}, 70%, 45%), hsl(${person.name.charCodeAt(0) * 15 % 360}, 60%, 35%))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17, fontWeight: 700, color: '#fff',
                }}>
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{person.name}</div>
                  {personResumes[0]?.personalInfo.title && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {personResumes[0].personalInfo.title}
                    </div>
                  )}
                </div>
                {isActive && (
                  <div className="badge" style={{ background: 'rgba(0,122,255,0.2)', borderColor: 'rgba(0,122,255,0.4)', color: 'var(--ios-blue)', fontSize: 10, flexShrink: 0 }}>
                    Aktiv
                  </div>
                )}
              </div>

              {/* Bewerbungsmappe badges */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {personResumes.map((r) => {
                  const isActiveResume = r.id === person.activeResumeId;
                  if (renamingResumeId === r.id) {
                    return (
                      <input
                        key={r.id}
                        className="input-glass"
                        value={renameValue}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameCommit(r.id);
                          if (e.key === 'Escape') { setRenamingResumeId(null); setRenameValue(''); }
                        }}
                        onBlur={() => handleRenameCommit(r.id)}
                        style={{ fontSize: 11, padding: '2px 8px', height: 24, width: 160 }}
                      />
                    );
                  }
                  return (
                    <span
                      key={r.id}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '3px 7px',
                        borderRadius: 6,
                        fontSize: 11,
                        border: `1px solid ${isActiveResume ? 'rgba(0,122,255,0.5)' : 'rgba(255,255,255,0.15)'}`,
                        background: isActiveResume ? 'rgba(0,122,255,0.2)' : 'rgba(255,255,255,0.07)',
                        color: isActiveResume ? 'var(--ios-blue)' : undefined,
                      }}
                    >
                      <FileText
                        size={9}
                        style={{ cursor: 'pointer', flexShrink: 0 }}
                        onClick={(e) => { e.stopPropagation(); setActivePerson(person.id); setActiveResume(r.id); }}
                      />
                      <span
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); setActivePerson(person.id); setActiveResume(r.id); }}
                      >
                        {r.name || 'Bewerbungsmappe'}
                      </span>
                      <span
                        title="Umbenennen"
                        style={{ cursor: 'pointer', opacity: 0.5, display: 'flex', alignItems: 'center' }}
                        onClick={(e) => { e.stopPropagation(); setRenamingResumeId(r.id); setRenameValue(r.name || 'Bewerbungsmappe'); }}
                      >
                        <Pencil size={9} />
                      </span>
                      {personResumes.length > 1 && (
                        <span
                          title="Mappe löschen"
                          style={{ cursor: 'pointer', opacity: 0.4, lineHeight: 1, fontSize: 13 }}
                          onClick={(e) => { e.stopPropagation(); if (confirm(`"${r.name || 'Bewerbungsmappe'}" wirklich löschen?`)) deleteResume(r.id); }}
                        >×</span>
                      )}
                    </span>
                  );
                })}

                {/* Add new Bewerbungsmappe */}
                {addingResumeForPersonId === person.id ? (
                  <input
                    className="input-glass"
                    placeholder="Name der Mappe..."
                    value={newResumeName}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setNewResumeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddResume(person.id);
                      if (e.key === 'Escape') { setAddingResumeForPersonId(null); setNewResumeName(''); }
                    }}
                    onBlur={() => {
                      if (newResumeName.trim()) handleAddResume(person.id);
                      else { setAddingResumeForPersonId(null); setNewResumeName(''); }
                    }}
                    style={{ fontSize: 11, padding: '2px 8px', height: 24, width: 160 }}
                  />
                ) : (
                  <span
                    className="badge"
                    title="Neue Bewerbungsmappe"
                    style={{ cursor: 'pointer', opacity: 0.6 }}
                    onClick={(e) => { e.stopPropagation(); setAddingResumeForPersonId(person.id); setNewResumeName(''); }}
                  >
                    <FolderPlus size={9} />
                  </span>
                )}
              </div>

              <div className="divider" style={{ margin: '10px 0' }} />

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-glass btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={(e) => { e.stopPropagation(); setActivePerson(person.id); navigate('/editor'); }}
                >
                  <Edit3 size={13} /> Bearbeiten
                </button>
                <button
                  className="btn-glass btn-sm"
                  onClick={(e) => { e.stopPropagation(); setActivePerson(person.id); navigate('/preview'); }}
                >
                  <Eye size={13} /> {!isMobile && 'Vorschau'}
                </button>
                <button
                  className="btn-glass btn-danger btn-icon"
                  onClick={(e) => { e.stopPropagation(); if (confirm(`"${person.name}" wirklich löschen?`)) deletePerson(person.id); }}
                  style={{ width: 34, height: 34, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
