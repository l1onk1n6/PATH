import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Edit3, Trash2, FileText, Eye, TrendingUp,
  FolderPlus, Pencil, Copy, ExternalLink, Clock,
  Download, Share2, CheckCircle, LayoutGrid, List, X, BarChart2,
  Lock, MoreHorizontal,
} from 'lucide-react';

function safeUrl(url: string) {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
import { useResumeStore } from '../store/resumeStore';
import { useTrackerStore } from '../store/trackerStore';
import {
  APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS,
  type ApplicationStatus,
} from '../types/resume';
import { calcCompleteness, completenessColor } from '../lib/completeness';
import { useIsMobile } from '../hooks/useBreakpoint';
import { UpgradeModal } from '../components/ui/ProGate';
import { usePlan } from '../lib/plan';
import { getPdfExportCount } from '../lib/pdfExports';
import { toast } from '../components/ui/Toast';

const ALL_STATUSES: ApplicationStatus[] = ['entwurf', 'gesendet', 'interview', 'abgelehnt', 'angenommen'];

// ── ATS button ─────────────────────────────────────────────
function AtsButton() {
  const { isPro } = usePlan();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showSoon, setShowSoon] = useState(false);

  return (
    <>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} highlightId="ats" />}
      {showSoon && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={() => setShowSoon(false)}>
          <div className="glass-card animate-scale-in" style={{ padding: '24px 28px', maxWidth: 320, textAlign: 'center', background: 'var(--modal-bg)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>ATS-Score — bald verfügbar</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Lebenslauf gegen Stellenbeschreibung matchen & Keywords optimieren. Dieses Feature ist in Entwicklung.
            </div>
            <button className="btn-glass btn-primary btn-sm" onClick={() => setShowSoon(false)}>Schliessen</button>
          </div>
        </div>
      )}
      <button
        className="btn-glass btn-sm"
        onClick={() => isPro ? setShowSoon(true) : setShowUpgrade(true)}
        style={{ gap: 5, position: 'relative' }}
        title="ATS-Score prüfen"
      >
        <BarChart2 size={13} /> ATS
        {!isPro && (
          <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 3, background: 'linear-gradient(135deg, #FF9F0A, #FF375F)', color: '#fff', marginLeft: 2 }}>PRO</span>
        )}
      </button>
    </>
  );
}

// ── Share modal ────────────────────────────────────────────
function ShareModal({ resumeId, onClose }: { resumeId: string; onClose: () => void }) {
  const navigate = useNavigate();
  const { setActiveResume, setActiveSection } = useResumeStore();

  function goToOverview() {
    setActiveResume(resumeId);
    setActiveSection('overview');
    navigate('/editor');
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="glass-card animate-scale-in"
        style={{ padding: 20, width: 340, maxWidth: '90vw', zIndex: 101, background: 'var(--modal-bg)' }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Lebenslauf teilen</div>
          <button className="btn-glass btn-icon" onClick={onClose} style={{ padding: 5 }}>
            <X size={14} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Erstelle benannte Links pro Stelle und verfolge Aufrufe, Herkunft und Gerät in der Übersicht.
        </p>
        <button className="btn-glass btn-primary" style={{ width: '100%' }} onClick={goToOverview}>
          <Share2 size={14} /> Zu Links & Analytics
        </button>
      </div>
    </div>
  );
}

// ── Completeness bar ───────────────────────────────────────
function CompletenessBar({ score }: { score: number }) {
  const color = completenessColor(score);
  return (
    <div title={`Vollständigkeit: ${score}%`} style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
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
  const { limits } = usePlan();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const frozenPersonIds = new Set(
    limits.persons < Infinity ? persons.slice(limits.persons).map(p => p.id) : []
  );
  const frozenResumeIds = new Set(
    limits.resumes < Infinity ? resumes.slice(limits.resumes).map(r => r.id) : []
  );

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: isMobile ? 10 : 16,
      alignItems: 'start',
    }}>
      {ALL_STATUSES.map((status) => {
        const statusResumes = resumes.filter(r => (r.status ?? 'entwurf') === status);
        const color = APPLICATION_STATUS_COLORS[status];
        return (
          <div key={status} className="glass-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>{APPLICATION_STATUS_LABELS[status]}</span>
              <span className="badge" style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px' }}>{statusResumes.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {statusResumes.length === 0 && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '16px 0' }}>Keine Einträge</div>
              )}
              {statusResumes.map((r) => {
                const person = persons.find(p => p.resumeIds.includes(r.id));
                const isFrozen = frozenResumeIds.has(r.id) || (person ? frozenPersonIds.has(person.id) : false);
                return (
                  <div
                    key={r.id}
                    className="glass-card"
                    style={{
                      padding: '12px 14px', borderRadius: 10,
                      cursor: isFrozen ? 'default' : 'pointer',
                      opacity: isFrozen ? 0.65 : 1,
                      border: isFrozen ? '1px solid rgba(255,159,10,0.3)' : undefined,
                      background: isFrozen ? 'rgba(255,159,10,0.05)' : undefined,
                    }}
                    onClick={() => {
                      if (isFrozen) return;
                      if (person) setActivePerson(person.id);
                      setActiveResume(r.id);
                      navigate('/editor');
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      {isFrozen && <Lock size={11} style={{ color: '#FF9F0A', flexShrink: 0 }} />}
                      <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isFrozen ? '#FF9F0A' : undefined }}>
                        {r.name || 'Bewerbungsmappe'}
                      </div>
                    </div>
                    {person && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                        {person.name}
                      </div>
                    )}
                    {r.deadline && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                        <Clock size={11} />
                        {new Date(r.deadline).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </div>
                    )}
                    {isFrozen ? (
                      <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,159,10,0.7)' }}>
                        Upgrade auf Pro zum Bearbeiten
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
                        {ALL_STATUSES.filter(s => s !== status).map(s => (
                          <button
                            key={s}
                            title={APPLICATION_STATUS_LABELS[s]}
                            className="btn-glass"
                            style={{ padding: isMobile ? '7px 12px' : '4px 9px', fontSize: 11, borderRadius: 6 }}
                            onClick={(e) => { e.stopPropagation(); setResumeStatus(r.id, s); }}
                          >
                            → {APPLICATION_STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    )}
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
  const [view, setView] = useState<'list' | 'tracker'>('list');

  const [addingResumeForPersonId, setAddingResumeForPersonId] = useState<string | null>(null);
  const [newResumeName, setNewResumeName] = useState('');

  // Bubble store limit errors into global toast
  useEffect(() => {
    if (limitError) { toast.error('errorLimit'); clearLimitError(); }
  }, [limitError, clearLimitError]);

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

  const { applications } = useTrackerStore();

  const totalResumes = resumes.length;
  const totalSections = resumes.reduce((acc, r) => acc + r.workExperience.length + r.education.length + r.skills.length, 0);
  const avgCompleteness = resumes.length > 0
    ? Math.round(resumes.reduce((acc, r) => acc + calcCompleteness(r).score, 0) / resumes.length)
    : 0;

  // Upcoming deadlines: resumes with deadline within next 21 days
  const now = Date.now();
  const upcomingDeadlines = resumes
    .filter(r => {
      if (!r.deadline) return false;
      const diff = (new Date(r.deadline).getTime() - now) / 86400000;
      return diff >= 0 && diff <= 21;
    })
    .map(r => {
      const diff = (new Date(r.deadline!).getTime() - now) / 86400000;
      const daysLeft = Math.ceil(diff);
      const person = persons.find(p => p.resumeIds.includes(r.id));
      return { resume: r, person, daysLeft };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Bewerbungsstatus counts from resumes
  const statusCounts = ALL_STATUSES.reduce<Record<ApplicationStatus, number>>((acc, s) => {
    acc[s] = resumes.filter(r => (r.status ?? 'entwurf') === s).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);


  return (
    <div className="animate-fade-in" style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 0 16px' : '0 2px 16px' }}>


      {/* Status menu overlay */}
      {statusMenuResumeId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={() => setStatusMenuResumeId(null)}>
          <div onClick={(e) => e.stopPropagation()} className="glass-card animate-scale-in"
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 101, padding: 16, minWidth: 200, background: 'var(--modal-bg)' }}>
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
          color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 8,
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
                background: 'var(--modal-bg)',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                borderRadius: 14, padding: '6px',
                border: '1px solid rgba(99,140,255,0.18)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
                animation: 'scaleIn 0.15s cubic-bezier(0.34,1.56,0.64,1) both',
              }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '6px 12px 4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
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
                <button key={label} style={{ ...itemStyle, color: color ?? 'var(--text-primary)' }}
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
      {shareModalResumeId && (
        <ShareModal
          resumeId={shareModalResumeId}
          onClose={() => setShareModalResumeId(null)}
        />
      )}

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: isMobile ? 10 : 16,
        marginBottom: isMobile ? 18 : 28,
      }}>
        {[
          { icon: Users,       label: 'Personen',  value: persons.length,        accent: '#007AFF' },
          { icon: FileText,    label: 'Mappen',    value: totalResumes,          accent: '#34C759' },
          { icon: TrendingUp,  label: 'Einträge',  value: totalSections,         accent: '#FF9500' },
          { icon: CheckCircle, label: 'Ø Vollst.', value: `${avgCompleteness}%`, accent: avgCompleteness >= 80 ? '#34C759' : avgCompleteness >= 50 ? '#FF9F0A' : '#FF3B30' },
          {
            icon: Download,
            label: 'PDF Exports',
            value: `${getPdfExportCount()} / ${limits.pdfExportsPerMonth === Infinity ? '∞' : limits.pdfExportsPerMonth}`,
            accent: '#5856D6',
          },
        ].map(({ icon: Icon, label, value, accent }) => (
          <div key={label} className="glass-card" style={{ padding: isMobile ? '14px 16px' : '20px 22px', borderTop: `3px solid ${accent}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: isMobile ? 11 : 12, color: 'var(--text-secondary)', marginTop: 5 }}>{label}</div>
              </div>
              <div style={{
                width: isMobile ? 34 : 42, height: isMobile ? 34 : 42, borderRadius: isMobile ? 10 : 12,
                background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={isMobile ? 16 : 20} style={{ color: accent }} />
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Upcoming Deadlines widget */}
      {upcomingDeadlines.length > 0 && (
        <div className="glass-card" style={{ padding: isMobile ? '14px 16px' : '18px 20px', marginBottom: isMobile ? 18 : 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Clock size={15} style={{ color: '#FF9F0A' }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Bevorstehende Fristen</span>
            <span className="badge" style={{ marginLeft: 4, fontSize: 11, padding: '2px 8px' }}>{upcomingDeadlines.length}</span>
          </div>
          {upcomingDeadlines.length <= 3 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingDeadlines.map(({ resume: r, person, daysLeft }) => {
                const urgencyColor = daysLeft <= 3 ? '#FF3B30' : daysLeft <= 7 ? '#FF9500' : daysLeft <= 14 ? '#FF9F0A' : 'var(--text-secondary)';
                return (
                  <div
                    key={r.id}
                    className="glass-card"
                    style={{ padding: '10px 14px', borderRadius: 10, cursor: 'pointer', borderLeft: `3px solid ${urgencyColor}` }}
                    onClick={() => {
                      if (person) setActivePerson(person.id);
                      setActiveResume(r.id);
                      navigate('/editor');
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.name || 'Bewerbungsmappe'}
                        </div>
                        {person && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{person.name}</div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 12, color: urgencyColor, fontWeight: 600 }}>
                          {daysLeft === 0 ? 'Heute' : `${daysLeft} Tag${daysLeft !== 1 ? 'e' : ''}`}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                          {new Date(r.deadline!).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {upcomingDeadlines.map(({ resume: r, person, daysLeft }) => {
                const urgencyColor = daysLeft <= 3 ? '#FF3B30' : daysLeft <= 7 ? '#FF9500' : daysLeft <= 14 ? '#FF9F0A' : 'var(--text-secondary)';
                return (
                  <div
                    key={r.id}
                    className="glass-card"
                    style={{
                      padding: '12px 14px', borderRadius: 12, cursor: 'pointer', flexShrink: 0,
                      minWidth: 160, maxWidth: 200, borderTop: `3px solid ${urgencyColor}`,
                    }}
                    onClick={() => {
                      if (person) setActivePerson(person.id);
                      setActiveResume(r.id);
                      navigate('/editor');
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                      {r.name || 'Bewerbungsmappe'}
                    </div>
                    {person && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                        {person.name}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(r.deadline!).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </div>
                      <div style={{ fontSize: 12, color: urgencyColor, fontWeight: 700 }}>
                        {daysLeft === 0 ? 'Heute' : `${daysLeft}T`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bewerbungsstatus summary */}
      {resumes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: isMobile ? 18 : 24, alignItems: 'center' }}>
          {ALL_STATUSES.filter(s => statusCounts[s] > 0).map(s => (
            <button
              key={s}
              className="btn-glass btn-sm"
              style={{ gap: 6, cursor: 'pointer' }}
              onClick={() => navigate('/tracker')}
              title={`${statusCounts[s]} × ${APPLICATION_STATUS_LABELS[s]}`}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: APPLICATION_STATUS_COLORS[s], flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 12 }}>{statusCounts[s]}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{APPLICATION_STATUS_LABELS[s]}</span>
            </button>
          ))}
          {applications.length > 0 && (
            <button
              className="btn-glass btn-sm"
              style={{ gap: 6, cursor: 'pointer', opacity: 0.75 }}
              onClick={() => navigate('/tracker')}
              title={`${applications.length} Einträge im Bewerbungstracker`}
            >
              <BarChart2 size={12} style={{ opacity: 0.7 }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{applications.length} im Tracker</span>
            </button>
          )}
        </div>
      )}

      {/* Section header + controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
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
          <AtsButton />
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
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
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
            gap: isMobile ? 12 : 20,
          }}>
            {persons.map((person) => {
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
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Upgrade auf Pro zum Bearbeiten</div>
                      ) : personResumes[0]?.personalInfo.title ? (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                      const deadlineColor = deadlineDiff === null ? undefined : deadlineDiff < 0 ? 'var(--ios-red)' : deadlineDiff <= 7 ? '#FF9F0A' : 'var(--text-muted)';

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
                              {!frozen && (r.deadline || r.jobUrl) && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                                  {r.deadline && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: deadlineColor }}>
                                      <Clock size={11} />
                                      {deadlineDiff! < 0 ? 'Abgelaufen' : `${Math.ceil(deadlineDiff!)} Tage`}
                                    </span>
                                  )}
                                  {r.jobUrl && (
                                    <a href={safeUrl(r.jobUrl)} target="_blank" rel="noopener noreferrer"
                                      style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}
                                      onClick={(e) => e.stopPropagation()}>
                                      <ExternalLink size={11} /> Stelle
                                    </a>
                                  )}
                                </div>
                              )}
                              {frozen && (
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
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
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, fontSize: 13, border: '1px dashed rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', opacity: 0.6, color: 'var(--text-secondary)' }}
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

        </>
      )}
    </div>
  );
}
