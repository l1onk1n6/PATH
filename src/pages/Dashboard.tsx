import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Edit3, Trash2, FileText, Eye, TrendingUp,
  FolderPlus, Pencil, Copy, Search, ExternalLink, Clock,
  Share2, CheckCircle, List, X, BarChart2,
  Lock, MoreHorizontal, ClipboardList,
} from 'lucide-react';

function safeUrl(url: string) {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
import { useResumeStore } from '../store/resumeStore';
import {
  APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS,
  type ApplicationStatus,
} from '../types/resume';
import { calcCompleteness, completenessColor } from '../lib/completeness';
import { shareLink } from '../lib/shareLink';
import { useIsMobile } from '../hooks/useBreakpoint';
import { v4 as uuidv4 } from 'uuid';
import { UpgradeModal } from '../components/ui/ProGate';
import { usePlan } from '../lib/plan';
import AtsDialog from '../components/ats/AtsDialog';
import ShareModal from '../components/ui/ShareModal';

const ALL_STATUSES: ApplicationStatus[] = ['entwurf', 'gesendet', 'interview', 'abgelehnt', 'angenommen'];

// ── ATS button ─────────────────────────────────────────────
function AtsButton() {
  const { isPro } = usePlan();
  const { getActiveResume } = useResumeStore();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAts, setShowAts] = useState(false);
  const noResume = !getActiveResume();

  function handleClick() {
    if (!isPro) { setShowUpgrade(true); return; }
    if (noResume) return;
    setShowAts(true);
  }

  return (
    <>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} highlightId="ats" />}
      {showAts && <AtsDialog onClose={() => setShowAts(false)} />}
      <button
        className="btn-glass btn-sm"
        onClick={handleClick}
        disabled={isPro && noResume}
        style={{ gap: 5, position: 'relative', opacity: (isPro && noResume) ? 0.5 : 1 }}
        title={noResume ? 'Erst eine Mappe auswählen' : 'ATS-Score prüfen'}
      >
        <BarChart2 size={13} /> ATS
        {!isPro && (
          <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 3, background: 'linear-gradient(135deg, #FF9F0A, #FF375F)', color: '#fff', marginLeft: 2 }}>PRO</span>
        )}
      </button>
    </>
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


export default function Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { limits } = usePlan();
  const {
    persons, resumes, addPerson, deletePerson, setActivePerson, activePersonId,
    addResume, deleteResume, setActiveResume, renameResume, duplicateResume, setResumeStatus,
    limitError, clearLimitError,
  } = useResumeStore();

  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingResumeForPersonId, setAddingResumeForPersonId] = useState<string | null>(null);
  const [newResumeName, setNewResumeName] = useState('');

  const [renamingResumeId, setRenamingResumeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [statusMenuResumeId, setStatusMenuResumeId] = useState<string | null>(null);
  const [shareModalResumeId, setShareModalResumeId] = useState<string | null>(null);
  const [menuOpenResumeId, setMenuOpenResumeId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Persons beyond the plan limit are frozen (read-only)
  const frozenPersonIds = new Set(
    limits.persons < Infinity
      ? persons.slice(limits.persons).map(p => p.id)
      : []
  );
  // Resumes beyond the plan limit are frozen (read-only)
  const frozenResumeIds = new Set(
    limits.resumes < Infinity
      ? resumes.slice(limits.resumes).map(r => r.id)
      : []
  );

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
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={() => setStatusMenuResumeId(null)}>
          <div onClick={(e) => e.stopPropagation()} className="glass-card animate-scale-in"
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 101, padding: 16, minWidth: 200, background: 'rgba(14,14,22,0.97)' }}>
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

      {/* Resume action menu — rendered via portal so position:fixed works outside transforms */}
      {menuOpenResumeId && (() => {
        const mr = resumes.find(r => r.id === menuOpenResumeId);
        const mp = mr ? persons.find(p => p.resumeIds.includes(mr.id)) : null;
        const mpResumes = mp ? mp.resumeIds.length : 0;
        if (!mr) return null;

        const itemStyle: React.CSSProperties = {
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '10px 13px', fontSize: 13, background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.85)', cursor: 'pointer', borderRadius: 8,
          fontFamily: 'var(--font-sf)', textDecoration: 'none', textAlign: 'left',
          transition: 'background 0.12s',
        };

        return createPortal(
          <div style={{ position: 'fixed', inset: 0, zIndex: 9000 }}
            onClick={() => setMenuOpenResumeId(null)}>
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'fixed', top: menuPos.top, left: menuPos.left,
                zIndex: 9001, minWidth: 210,
                background: 'rgba(14,22,48,0.97)',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                borderRadius: 14, padding: '6px',
                border: '1px solid rgba(99,140,255,0.18)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
                animation: 'scaleIn 0.15s cubic-bezier(0.34,1.56,0.64,1) both',
              }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', padding: '6px 12px 4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {mr.name || 'Bewerbungsmappe'}
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
              {([
                { icon: Share2, label: mr.shareToken ? 'Link teilen ·  aktiv' : 'Link teilen', color: mr.shareToken ? 'var(--ios-blue)' : undefined,
                  action: () => { setShareModalResumeId(mr.id); setMenuOpenResumeId(null); } },
                { icon: Pencil, label: 'Umbenennen',
                  action: () => { setRenamingResumeId(mr.id); setRenameValue(mr.name || 'Bewerbungsmappe'); setMenuOpenResumeId(null); } },
                { icon: Copy, label: 'Duplizieren',
                  action: () => { duplicateResume(mr.id); setMenuOpenResumeId(null); } },
              ] as { icon: React.ComponentType<{size:number}>, label: string, color?: string, action: () => void }[]).map(({ icon: Icon, label, color, action }) => (
                <button key={label} style={{ ...itemStyle, color: color ?? 'rgba(255,255,255,0.85)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  onClick={action}>
                  <Icon size={14} /> {label}
                </button>
              ))}
              {mr.jobUrl && (
                <a href={safeUrl(mr.jobUrl)} target="_blank" rel="noopener noreferrer"
                  style={itemStyle}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
                  onClick={() => setMenuOpenResumeId(null)}>
                  <ExternalLink size={14} /> Stelle öffnen
                </a>
              )}
              {mpResumes > 1 && (
                <>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
                  <button style={{ ...itemStyle, color: 'var(--ios-red)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,59,48,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    onClick={() => { if (confirm(`"${mr.name || 'Bewerbungsmappe'}" löschen?`)) deleteResume(mr.id); setMenuOpenResumeId(null); }}>
                    <Trash2 size={14} /> Löschen
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body
        );
      })()}

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


      {/* Section header + controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn-glass btn-sm" style={{ background: 'rgba(0,122,255,0.2)', border: '1px solid rgba(0,122,255,0.4)' }}>
            <List size={13} /> Liste
          </button>
          <button className="btn-glass btn-sm" onClick={() => navigate('/tracker')}>
            <ClipboardList size={13} /> Tracker
          </button>
          <AtsButton />
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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

      {/* List view */}
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

          {/* Empty state — guided onboarding */}
          {persons.length === 0 && !showAdd && (
            <div className="glass-card animate-fade-in" style={{ padding: isMobile ? '28px 20px' : '40px 32px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(0,122,255,0.08), rgba(88,86,214,0.06))', border: '1px solid rgba(0,122,255,0.18)' }}>
              {/* Hero icon */}
              <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, rgba(0,122,255,0.25), rgba(88,86,214,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 8px 24px rgba(0,122,255,0.25)' }}>
                <Users size={32} style={{ color: '#fff' }} />
              </div>

              <h3 style={{ margin: '0 0 8px', fontSize: isMobile ? 20 : 24, fontWeight: 700, letterSpacing: '-0.5px' }}>
                Willkommen bei PATH
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 24, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                In 3 Schritten zu deinem Lebenslauf — alles synchronisiert, mehrere Mappen pro Person, native PDF-Exporte.
              </p>

              {/* Steps */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10, marginBottom: 24, maxWidth: 640, margin: '0 auto 24px' }}>
                {[
                  { n: 1, icon: Users,    title: 'Person anlegen',    desc: 'Name + Kontaktdaten erfassen' },
                  { n: 2, icon: FileText, title: 'Mappe gestalten',  desc: 'Werdegang, Skills, Template' },
                  { n: 3, icon: Eye,      title: 'PDF & Teilen',     desc: 'Export oder öffentlicher Link' },
                ].map(({ n, icon: Icon, title, desc }) => (
                  <div key={n} style={{
                    padding: '14px 12px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
                  }}>
                    <div style={{ position: 'relative', marginBottom: 4 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,122,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} style={{ color: 'var(--ios-blue)' }} />
                      </div>
                      <div style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#007AFF', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {n}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{desc}</div>
                  </div>
                ))}
              </div>

              <button className="btn-glass btn-primary" onClick={() => setShowAdd(true)} style={{ padding: '11px 22px', fontSize: 14, fontWeight: 600 }}>
                <Plus size={16} /> Jetzt starten
              </button>
              <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                Kostenlos · 1 Person · 2 Mappen · keine Kreditkarte
              </div>
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
              const isPersonFrozen = frozenPersonIds.has(person.id);

              return (
                <div key={person.id} className="glass-card"
                  style={{
                    padding: isMobile ? 16 : 20,
                    cursor: isPersonFrozen ? 'default' : 'pointer',
                    opacity: isPersonFrozen ? 0.72 : 1,
                    border: isPersonFrozen
                      ? '1px solid rgba(255,159,10,0.35)'
                      : isActive ? '1px solid rgba(0,122,255,0.4)' : undefined,
                    background: isPersonFrozen ? 'rgba(255,159,10,0.04)' : undefined,
                  }}
                  onClick={() => { if (!isPersonFrozen) { setActivePerson(person.id); navigate('/editor'); } }}>

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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: isPersonFrozen ? '#FF9F0A' : undefined }}>{person.name}</span>
                        {isPersonFrozen && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,159,10,0.2)', border: '1px solid rgba(255,159,10,0.4)', color: '#FF9F0A', flexShrink: 0 }}>
                            EINGEFROREN
                          </span>
                        )}
                      </div>
                      {isPersonFrozen ? (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Upgrade auf Pro zum Bearbeiten</div>
                      ) : personResumes[0]?.personalInfo.title ? (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {personResumes[0].personalInfo.title}
                        </div>
                      ) : null}
                    </div>
                    {!isPersonFrozen && isActive && (
                      <div className="badge" style={{ background: 'rgba(0,122,255,0.2)', borderColor: 'rgba(0,122,255,0.4)', color: 'var(--ios-blue)', fontSize: 10, flexShrink: 0 }}>
                        Aktiv
                      </div>
                    )}
                    {isPersonFrozen && (
                      <Lock size={16} style={{ color: '#FF9F0A', flexShrink: 0 }} />
                    )}
                  </div>

                  {/* Bewerbungsmappen */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {personResumes.map((r) => {
                      const completeness = calcCompleteness(r);
                      const isActiveResume = r.id === person.activeResumeId;
                      const frozen = frozenResumeIds.has(r.id);
                      const statusColor = APPLICATION_STATUS_COLORS[r.status ?? 'entwurf'];
                      const deadlineDiff = r.deadline ? (new Date(r.deadline).getTime() - Date.now()) / 86400000 : null;
                      const deadlineColor = deadlineDiff === null ? undefined : deadlineDiff < 0 ? 'var(--ios-red)' : deadlineDiff <= 7 ? '#FF9F0A' : 'rgba(255,255,255,0.4)';

                      if (renamingResumeId === r.id && !frozen && !isPersonFrozen) {
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
                          border: frozen
                            ? '1px solid rgba(255,159,10,0.25)'
                            : `1px solid ${isActiveResume ? 'rgba(0,122,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          background: frozen
                            ? 'rgba(255,159,10,0.05)'
                            : isActiveResume ? 'rgba(0,122,255,0.12)' : 'rgba(255,255,255,0.05)',
                          cursor: frozen ? 'default' : 'pointer',
                          opacity: frozen ? 0.7 : 1,
                        }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!frozen && !isPersonFrozen) { setActivePerson(person.id); setActiveResume(r.id); }
                          }}>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* Frozen icon or status dot */}
                            {frozen
                              ? <Lock size={12} style={{ color: '#FF9F0A', flexShrink: 0 }} />
                              : <span title={`Status: ${APPLICATION_STATUS_LABELS[r.status ?? 'entwurf']} – klicken zum Ändern`}
                                  style={{ width: 11, height: 11, borderRadius: '50%', background: statusColor, flexShrink: 0, cursor: 'pointer' }}
                                  onClick={(e) => { e.stopPropagation(); setStatusMenuResumeId(r.id); }} />
                            }
                            <FileText size={15} style={{ opacity: 0.6, flexShrink: 0 }} />

                            {/* Name + meta */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                                <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: frozen ? '#FF9F0A' : isActiveResume ? 'var(--ios-blue)' : undefined }}>
                                  {r.name || 'Bewerbungsmappe'}
                                </span>
                                {frozen && (
                                  <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,159,10,0.2)', border: '1px solid rgba(255,159,10,0.4)', color: '#FF9F0A', flexShrink: 0 }}>
                                    EINGEFROREN
                                  </span>
                                )}
                              </div>
                              {!frozen && r.deadline && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: deadlineColor }}>
                                    <Clock size={11} />
                                    {deadlineDiff! < 0 ? 'Abgelaufen' : `${Math.ceil(deadlineDiff!)} Tage`}
                                  </span>
                                </div>
                              )}
                              {frozen && (
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                                  Upgrade auf Pro zum Bearbeiten
                                </div>
                              )}
                            </div>

                            {/* Actions — single ⋯ menu */}
                            <div style={{ flexShrink: 0 }}>
                              {!frozen && !isPersonFrozen && (
                                <button
                                  className="btn-glass btn-icon"
                                  title="Aktionen"
                                  style={{ padding: 6, color: r.shareToken ? 'var(--ios-blue)' : undefined }}
                                  ref={el => { menuBtnRefs.current[r.id] = el; }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const btn = menuBtnRefs.current[r.id];
                                    if (!btn) return;
                                    const rect = btn.getBoundingClientRect();
                                    const menuW = 210, menuH = 220;
                                    const left = rect.right - menuW < 0 ? rect.left : rect.right - menuW;
                                    const top  = rect.bottom + menuH > window.innerHeight ? rect.top - menuH : rect.bottom + 4;
                                    setMenuPos({ top, left });
                                    setMenuOpenResumeId(r.id);
                                  }}>
                                  <MoreHorizontal size={15} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Completeness bar — only for active resumes */}
                          {!frozen && (
                            <div style={{ marginTop: 8 }}>
                              <CompletenessBar score={completeness.score} />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Neue Mappe — only for non-frozen persons */}
                    {!isPersonFrozen && addingResumeForPersonId === person.id ? (
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
                    ) : !isPersonFrozen ? (
                      <div title="Neue Bewerbungsmappe"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, fontSize: 13, border: '1px dashed rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', opacity: 0.6, color: 'rgba(255,255,255,0.6)' }}
                        onClick={(e) => { e.stopPropagation(); setAddingResumeForPersonId(person.id); setNewResumeName(''); }}>
                        <FolderPlus size={15} /> Neue Bewerbungsmappe
                      </div>
                    ) : null}
                  </div>

                  <div className="divider" style={{ margin: '10px 0' }} />

                  {/* Person actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {isPersonFrozen ? (
                      <button className="btn-glass btn-sm" style={{ flex: 1, opacity: 0.5, cursor: 'not-allowed', color: '#FF9F0A' }} disabled>
                        <Lock size={13} /> Eingefroren
                      </button>
                    ) : (
                      <button className="btn-glass btn-primary btn-sm" style={{ flex: 1 }}
                        onClick={(e) => { e.stopPropagation(); setActivePerson(person.id); navigate('/editor'); }}>
                        <Edit3 size={13} /> Bearbeiten
                      </button>
                    )}
                    {!isPersonFrozen && (
                      <button className="btn-glass btn-sm"
                        onClick={(e) => { e.stopPropagation(); setActivePerson(person.id); navigate('/preview'); }}>
                        <Eye size={13} /> {!isMobile && 'Vorschau'}
                      </button>
                    )}
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
    </div>
  );
}
