import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit3, Trash2, FileText, Eye, TrendingUp } from 'lucide-react';
import { useResumeStore } from '../store/resumeStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { persons, resumes, addPerson, deletePerson, setActivePerson, activePersonId } = useResumeStore();
  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  function handleAdd() {
    if (!newName.trim()) return;
    addPerson(newName.trim());
    setNewName('');
    setShowAdd(false);
    navigate('/editor');
  }

  const totalResumes = resumes.length;
  const totalSections = resumes.reduce((acc, r) => acc + r.workExperience.length + r.education.length + r.skills.length, 0);

  return (
    <div className="animate-fade-in" style={{ height: '100%', overflow: 'auto' }}>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { icon: Users, label: 'Personen', value: persons.length, color: 'var(--ios-blue)' },
          { icon: FileText, label: 'Lebensläufe', value: totalResumes, color: 'var(--ios-purple)' },
          { icon: TrendingUp, label: 'Einträge gesamt', value: totalSections, color: 'var(--ios-green)' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-1px' }}>{value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{label}</div>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>Personen & Lebensläufe</h2>
        <button className="btn-glass btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Neue Person
        </button>
      </div>

      {/* Add person form */}
      {showAdd && (
        <div className="glass-card animate-scale-in" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Neue Person anlegen</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="input-glass"
              placeholder="Vollständiger Name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <button className="btn-glass btn-primary" onClick={handleAdd}>Erstellen</button>
            <button className="btn-glass" onClick={() => { setShowAdd(false); setNewName(''); }}>Abbruch</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {persons.length === 0 && !showAdd && (
        <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(0,122,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Users size={28} style={{ color: 'var(--ios-blue)' }} />
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {persons.map((person) => {
          const personResumes = resumes.filter((r) => person.resumeIds.includes(r.id));
          const activeResume = personResumes.find((r) => r.id === person.activeResumeId) ?? personResumes[0];
          const isActive = person.id === activePersonId;

          return (
            <div
              key={person.id}
              className="glass-card"
              style={{
                padding: 20,
                cursor: 'pointer',
                border: isActive ? '1px solid rgba(0,122,255,0.4)' : undefined,
              }}
              onClick={() => { setActivePerson(person.id); navigate('/editor'); }}
            >
              {/* Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, hsl(${person.name.charCodeAt(0) * 10 % 360}, 70%, 45%), hsl(${person.name.charCodeAt(0) * 15 % 360}, 60%, 35%))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: '#fff',
                }}>
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{person.name}</div>
                  {activeResume?.personalInfo.title && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeResume.personalInfo.title}
                    </div>
                  )}
                </div>
                {isActive && (
                  <div className="badge" style={{ background: 'rgba(0,122,255,0.2)', borderColor: 'rgba(0,122,255,0.4)', color: 'var(--ios-blue)', fontSize: 10 }}>
                    Aktiv
                  </div>
                )}
              </div>

              {/* Resume count */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {personResumes.map((r) => (
                  <span key={r.id} className="badge">
                    <FileText size={9} style={{ marginRight: 4 }} />
                    {r.personalInfo.firstName || 'Lebenslauf'}
                  </span>
                ))}
              </div>

              <div className="divider" style={{ margin: '12px 0' }} />

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
                  <Eye size={13} /> Vorschau
                </button>
                <button
                  className="btn-glass btn-danger btn-sm btn-icon"
                  onClick={(e) => { e.stopPropagation(); if (confirm(`"${person.name}" wirklich löschen?`)) deletePerson(person.id); }}
                  style={{ padding: 7 }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
