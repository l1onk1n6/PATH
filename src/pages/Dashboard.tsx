import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Edit3, Trash2, FileText, Eye, TrendingUp,
  FolderPlus, Pencil, Copy, Search, ExternalLink, Clock,
  Download, Share2, CheckCircle, LayoutGrid, List, X,
} from 'lucide-react';
import { useResumeStore } from '../store/resumeStore';
import {
  APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS,
  type ApplicationStatus,
} from '../types/resume';
import { calcCompleteness, completenessColor } from '../lib/completeness';
import { useIsMobile } from '../hooks/useBreakpoint';
import { v4 as uuidv4 } from 'uuid';
import ProGate from '../components/ui/ProGate';
import { usePlan } from '../lib/plan';

const ALL_STATUSES: ApplicationStatus[] = ['entwurf', 'gesendet', 'interview', 'abgelehnt', 'angenommen'];

// ── Share modal ────────────────────────────────────────────
function ShareModal({ resumeId, token, onClose }: { resumeId: string; token?: string; onClose: () => void }) {
  const { setShareToken, resumes } = useResumeStore();
  const { limits } = usePlan();
  const [copied, setCopied] = useState(false);

  const shareUrl = token ? `${window.location.origin}${window.location.pathname}#/shared?t=${token}` : null;
  const activeShareCount = resumes.filter(r => r.shareToken && r.id !== resumeId).length;
  const atShareLimit = !token && activeShareCount >= limits.shareLinks;

  function generate() {
    if (atShareLimit) return;
    setShareToken(resumeId, uuidv4());
  }

  function disable() {
    setShareToken(resumeId, null);
  }

  function copy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div className="glass-card animate-scale-in"
        style={{ padding: 20, width: 340, maxWidth: '90vw', zIndex: 101 }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Lebenslauf teilen</div>
          <button className="btn-glass btn-icon" onClick={onClose} style={{ padding: 5 }}>
            <X size={14} />
          </button>
        </div>

        {!shareUrl ? (
          <>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
              Erstelle einen öffentlichen Link — der Lebenslauf ist ohne Login einsehbar.
            </p>
            {atShareLimit ? (
              <div style={{ fontSize: 12, color: '#FF9F0A', background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.25)', borderRadius: 8, padding: '10px 12px' }}>
                Share-Link-Limit erreicht ({limits.shareLinks}/{limits.shareLinks}). Deaktiviere einen anderen Link oder upgrade auf Pro.
              </div>
            ) : (
              <button className="btn-glass btn-primary" style={{ width: '100%' }} onClick={generate}>
                <Share2 size={14} /> Link generieren
              </button>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <input
                className="input-glass"
                readOnly
                value={shareUrl}
                style={{ flex: 1, fontSize: 11 }}
              />
              <button className="btn-glass btn-primary" onClick={copy} style={{ flexShrink: 0, padding: '0 12px' }}>
                {copied ? <CheckCircle size={14} /> : 'Kopieren'}
              </button>
            </div>
            <button className="btn-glass btn-danger" style={{ width: '100%', fontSize: 12 }} onClick={disable}>
              Link deaktivieren
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Completeness bar ───────────────────────────────────────
function CompletenessBar({ score }: { score: number }) {
  const color = completenessColor(score);
  return (
    <div title={`Vollständigkeit: ${score}%`} style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
        <span>Vollständigkeit</span>
        <span style={{ color, fontWeight: 600 }}>{score}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${score}%`, borderRadius: 2,
          background: color,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

// ── Tracker (Kanban) view ──────────────────────────────────
function TrackerView() {
  const { resumes, persons, setResumeStatus, setActiveResume, setActivePerson } = useResumeStore();
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
      gap: 12,
      alignItems: 'start',
    }}>
      {ALL_STATUSES.map((status) => {
        const statusResumes = resumes.filter(r => (r.status ?? 'entwurf') === status);
        const color = APPLICATION_STATUS_COLORS[status];
        return (
          <div key={status} className="glass-card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{APPLICATION_STATUS_LABELS[status]}</span>
              <span className="badge" style={{ marginLeft: 'auto', fontSize: 10 }}>{statusResumes.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {statusResumes.length === 0 && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '8px 0' }}>—</div>
              )}
              {statusResumes.map((r) => {
                const person = persons.find(p => p.resumeIds.includes(r.id));
                return (
                  <div
                    key={r.id}
                    className="glass-card"
                    style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: 8 }}
                    onClick={() => {
                      if (person) setActivePerson(person.id);
                      setActiveResume(r.id);
                      navigate('/editor');
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.name || 'Bewerbungsmappe'}
                    </div>
                    {person && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {person.name}
                      </div>
                    )}
                    {r.deadline && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        <Clock size={9} />
                        {new Date(r.deadline).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                      {ALL_STATUSES.filter(s => s !== status).map(s => (
                        <button
                          key={s}
                          title={APPLICATION_STATUS_LABELS[s]}
                          className="btn-glass"
                          style={{ padding: '2px 6px', fontSize: 10, borderRadius: 4 }}
                          onClick={(e) => { e.stopPropagation(); setResumeStatus(r.id, s); }}
                        >
                          → {APPLICATION_STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { limits } = usePlan();
  const {
    persons, resumes, addPerson, deletePerson, setActivePerson, activePersonId,
    addResume, deleteResume, setActiveResume, renameResume, duplicateResume, setResumeStatus,
    exportGdprData, limitError, clearLimitError,
  } = useResumeStore();

  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'tracker'>('list');

  const [addingResumeForPersonId, setAddingResumeForPersonId] = useState<string | null>(null);
  const [newResumeName, setNewResumeName] = useState('');

  const [renamingResumeId, setRenamingResumeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [statusMenuResumeId, setStatusMenuResumeId] = useState<string | null>(null);
  const [shareModalResumeId, setShareModalResumeId] = useState<string | null>(null);

  async function handleAdd() {
    if (!newName.trim()) return;
    const person = await addPerson(newName.trim());
    setNewName('');
    setShowAdd(false);
    if (person) navigate('/editor');
  }

  async function handleAddResume(personId: string) {
    if (!newResumeName.trim()) return;
    const resume = await addResume(personId, newResumeName.trim());
    setAddingResumeForPersonId(null);
    setNewResumeName('');
    if (resume) navigate('/editor');
  }

  function handleRenameCommit(resumeId: string) {
    if (renameValue.trim()) renameResume(resumeId, renameValue.trim());
    setRenamingResumeId(null);
    setRenameValue('');
  }

  const totalResumes = resumes.length;
  const totalSections = resumes.reduce((acc, r) => acc + r.workExperience.length + r.education.length + r.skills.length, 0);
  const avgCompleteness = resumes.length > 0
    ? Math.round(resumes.reduce((acc, r) => acc + calcCompleteness(r).score, 0) / resumes.length)
    : 0;

  const filteredPersons = searchQuery.trim()
    ? persons.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resumes.filter(r => p.resumeIds.includes(r.id)).some(r =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : persons;

  const shareResume = shareModalResumeId ? resumes.find(r => r.id === shareModalResumeId) : null;

  return (
    <div className="animate-fade-in" style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 0 16px' : undefined }}>

      {/* Limit error toast */}
      {limitError && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 300, padding: '12px 20px', borderRadius: 12,
          background: 'rgba(255,59,48,0.95)', backdropFilter: 'blur(12px)',
          color: '#fff', fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          maxWidth: '90vw',
        }}>
          <span>{limitError}</span>
          <button onClick={clearLimitError} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7, padding: 2 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Status menu overlay */}
      {statusMenuResumeId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setStatusMenuResumeId(null)}>
          <div onClick={(e) => e.stopPropagation()} className="glass-card animate-scale-in"
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 101, padding: 16, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, opacity: 0.7 }}>Status setzen</div>
            {ALL_STATUSES.map(s => (
              <button key={s} className="btn-glass"
                style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 6, gap: 10, fontSize: 13 }}
                onClick={() => { setResumeStatus(statusMenuResumeId, s); setStatusMenuResumeId(null); }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: APPLICATION_STATUS_COLORS[s] }} />
                {APPLICATION_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Share modal */}
      {shareModalResumeId && shareResume && (
        <ShareModal
          resumeId={shareModalResumeId}
          token={shareResume.shareToken}
          onClose={() => setShareModalResumeId(null)}
        />
      )}

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? 8 : 12,
        marginBottom: isMobile ? 12 : 20,
      }}>
        {[
          { icon: Users,      label: 'Personen', value: persons.length,   color: 'var(--ios-blue)' },
          { icon: FileText,   label: 'Mappen',   value: totalResumes,     color: 'var(--ios-purple)' },
          { icon: TrendingUp, label: 'Einträge', value: totalSections,    color: 'var(--ios-green)' },
          { icon: CheckCircle,label: 'Ø Vollst.',value: `${avgCompleteness}%`, color: completenessColor(avgCompleteness) },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card" style={{ padding: isMobile ? '12px 14px' : '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, letterSpacing: '-1px' }}>{value}</div>
                <div style={{ fontSize: isMobile ? 10 : 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{label}</div>
              </div>
              <div style={{
                width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, borderRadius: isMobile ? 8 : 12,
                background: `${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={isMobile ? 15 : 18} style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ATS Score — Pro feature teaser */}
      <ProGate featureId="ats">
        <div className="glass-card" style={{ padding: isMobile ? '12px 14px' : '14px 18px', marginBottom: isMobile ? 12 : 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 28 }}>📊</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>ATS-Score prüfen</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Lebenslauf gegen Stellenbeschreibung matchen & Keywords optimieren</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,122,255,0.15)', border: '1px solid rgba(0,122,255,0.3)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
            Score prüfen →
          </div>
        </div>
      </ProGate>

      {/* Section header + controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className="btn-glass btn-sm"
            onClick={() => setView('list')}
            style={{ background: view === 'list' ? 'rgba(0,122,255,0.2)' : undefined, border: view === 'list' ? '1px solid rgba(0,122,255,0.4)' : undefined }}
          >
            <List size={13} /> Liste
          </button>
          <button
            className="btn-glass btn-sm"
            onClick={() => setView('tracker')}
            style={{ background: view === 'tracker' ? 'rgba(0,122,255,0.2)' : undefined, border: view === 'tracker' ? '1px solid rgba(0,122,255,0.4)' : undefined }}
          >
            <LayoutGrid size={13} /> Tracker
          </button>
          {/* Limit counters */}
          {[
            { used: persons.length, max: limits.persons, label: 'P' },
            { used: resumes.length, max: limits.resumes, label: 'M' },
          ].map(({ used, max, label }) => {
            const pct = used / max;
            const color = pct >= 1 ? 'var(--ios-red)' : pct >= 0.8 ? '#FF9F0A' : 'rgba(255,255,255,0.3)';
            return (
              <span key={label} style={{ fontSize: 11, color, fontWeight: 500, whiteSpace: 'nowrap' }}>
                {used}/{max} {label}
              </span>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="btn-glass btn-sm" onClick={exportGdprData} title="Alle Daten exportieren (DSGVO Art. 20)">
            <Download size={13} /> {!isMobile && 'Export'}
          </button>
          <button
            className="btn-glass btn-primary btn-sm"
            style={{ flexShrink: 0, opacity: persons.length >= limits.persons ? 0.5 : 1 }}
            onClick={() => { if (persons.length >= limits.persons) { clearLimitError(); } else { setShowAdd(true); } }}
            title={persons.length >= limits.persons ? `Limit erreicht (${limits.persons} Personen)` : undefined}
          >
            <Plus size={14} /> {!isMobile && 'Neue '}Person
          </button>
        </div>
      </div>

      {/* Tracker view */}
      {view === 'tracker' && <TrackerView />}

      {/* List view */}
      {view === 'list' && (
        <>
          {/* Search bar */}
          {persons.length > 1 && (
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }} />
              <input
                className="input-glass"
                placeholder="Personen oder Mappen suchen…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: 30, fontSize: 13 }}
              />
            </div>
          )}

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
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(0,122,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
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
            {filteredPersons.map((person) => {
              const personResumes = resumes.filter((r) => person.resumeIds.includes(r.id));
              const isActive = person.id === activePersonId;

              return (
                <div key={person.id} className="glass-card"
                  style={{ padding: isMobile ? 16 : 20, cursor: 'pointer', border: isActive ? '1px solid rgba(0,122,255,0.4)' : undefined }}
                  onClick={() => { setActivePerson(person.id); navigate('/editor'); }}>

                  {/* Avatar + Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                      background: personResumes[0]?.personalInfo.photo ? 'transparent' : `linear-gradient(135deg, hsl(${person.name.charCodeAt(0) * 10 % 360}, 70%, 45%), hsl(${person.name.charCodeAt(0) * 15 % 360}, 60%, 35%))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 17, fontWeight: 700, color: '#fff',
                    }}>
                      {personResumes[0]?.personalInfo.photo
                        ? <img src={personResumes[0].personalInfo.photo} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : person.name.charAt(0).toUpperCase()
                      }
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

                  {/* Bewerbungsmappen */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {personResumes.map((r) => {
                      const completeness = calcCompleteness(r);
                      const isActiveResume = r.id === person.activeResumeId;
                      const statusColor = APPLICATION_STATUS_COLORS[r.status ?? 'entwurf'];
                      const deadlineDiff = r.deadline ? (new Date(r.deadline).getTime() - Date.now()) / 86400000 : null;
                      const deadlineColor = deadlineDiff === null ? undefined : deadlineDiff < 0 ? 'var(--ios-red)' : deadlineDiff <= 7 ? '#FF9F0A' : 'rgba(255,255,255,0.4)';

                      if (renamingResumeId === r.id) {
                        return (
                          <input key={r.id} className="input-glass" value={renameValue} autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameCommit(r.id);
                              if (e.key === 'Escape') { setRenamingResumeId(null); setRenameValue(''); }
                            }}
                            onBlur={() => handleRenameCommit(r.id)}
                            style={{ fontSize: 14, padding: '8px 12px', width: '100%' }}
                          />
                        );
                      }

                      return (
                        <div key={r.id} style={{
                          padding: '9px 12px', borderRadius: 10, fontSize: 14,
                          border: `1px solid ${isActiveResume ? 'rgba(0,122,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          background: isActiveResume ? 'rgba(0,122,255,0.12)' : 'rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                        }}
                          onClick={(e) => { e.stopPropagation(); setActivePerson(person.id); setActiveResume(r.id); }}>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* Status dot */}
                            <span title={`Status: ${APPLICATION_STATUS_LABELS[r.status ?? 'entwurf']} – klicken zum Ändern`}
                              style={{ width: 11, height: 11, borderRadius: '50%', background: statusColor, flexShrink: 0, cursor: 'pointer' }}
                              onClick={(e) => { e.stopPropagation(); setStatusMenuResumeId(r.id); }} />
                            <FileText size={15} style={{ opacity: 0.6, flexShrink: 0 }} />

                            {/* Name + meta */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActiveResume ? 'var(--ios-blue)' : undefined }}>
                                {r.name || 'Bewerbungsmappe'}
                              </div>
                              {(r.deadline || r.jobUrl) && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                                  {r.deadline && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: deadlineColor }}>
                                      <Clock size={11} />
                                      {deadlineDiff! < 0 ? 'Abgelaufen' : `${Math.ceil(deadlineDiff!)} Tage`}
                                    </span>
                                  )}
                                  {r.jobUrl && (
                                    <a href={r.jobUrl} target="_blank" rel="noopener noreferrer"
                                      style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
                                      onClick={(e) => e.stopPropagation()}>
                                      <ExternalLink size={11} /> Stelle
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
                              <span title="Teilen" style={{ cursor: 'pointer', opacity: 0.45, display: 'flex' }}
                                onClick={(e) => { e.stopPropagation(); setShareModalResumeId(r.id); }}>
                                <Share2 size={14} />
                              </span>
                              <span title="Umbenennen" style={{ cursor: 'pointer', opacity: 0.45, display: 'flex' }}
                                onClick={(e) => { e.stopPropagation(); setRenamingResumeId(r.id); setRenameValue(r.name || 'Bewerbungsmappe'); }}>
                                <Pencil size={14} />
                              </span>
                              <span title="Duplizieren" style={{ cursor: 'pointer', opacity: 0.45, display: 'flex' }}
                                onClick={(e) => { e.stopPropagation(); duplicateResume(r.id); }}>
                                <Copy size={14} />
                              </span>
                              {personResumes.length > 1 && (
                                <span title="Löschen" style={{ cursor: 'pointer', opacity: 0.4, display: 'flex' }}
                                  onClick={(e) => { e.stopPropagation(); if (confirm(`"${r.name || 'Bewerbungsmappe'}" löschen?`)) deleteResume(r.id); }}>
                                  <Trash2 size={14} />
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Completeness bar */}
                          <div style={{ marginTop: 8 }}>
                            <CompletenessBar score={completeness.score} />
                          </div>
                        </div>
                      );
                    })}

                    {/* Neue Mappe */}
                    {addingResumeForPersonId === person.id ? (
                      <input className="input-glass" placeholder="Name der Mappe…" value={newResumeName} autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setNewResumeName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddResume(person.id);
                          if (e.key === 'Escape') { setAddingResumeForPersonId(null); setNewResumeName(''); }
                        }}
                        onBlur={() => { if (newResumeName.trim()) handleAddResume(person.id); else { setAddingResumeForPersonId(null); setNewResumeName(''); } }}
                        style={{ fontSize: 14, padding: '8px 12px', width: '100%' }}
                      />
                    ) : (
                      <div title="Neue Bewerbungsmappe"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, fontSize: 13, border: '1px dashed rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', opacity: 0.6, color: 'rgba(255,255,255,0.6)' }}
                        onClick={(e) => { e.stopPropagation(); setAddingResumeForPersonId(person.id); setNewResumeName(''); }}>
                        <FolderPlus size={15} /> Neue Bewerbungsmappe
                      </div>
                    )}
                  </div>

                  <div className="divider" style={{ margin: '10px 0' }} />

                  {/* Person actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-glass btn-primary btn-sm" style={{ flex: 1 }}
                      onClick={(e) => { e.stopPropagation(); setActivePerson(person.id); navigate('/editor'); }}>
                      <Edit3 size={13} /> Bearbeiten
                    </button>
                    <button className="btn-glass btn-sm"
                      onClick={(e) => { e.stopPropagation(); setActivePerson(person.id); navigate('/preview'); }}>
                      <Eye size={13} /> {!isMobile && 'Vorschau'}
                    </button>
                    <button className="btn-glass btn-danger btn-icon"
                      onClick={(e) => { e.stopPropagation(); if (confirm(`"${person.name}" wirklich löschen?`)) deletePerson(person.id); }}
                      style={{ width: 34, height: 34, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {searchQuery && filteredPersons.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              Keine Ergebnisse für „{searchQuery}"
            </div>
          )}
        </>
      )}
    </div>
  );
}
