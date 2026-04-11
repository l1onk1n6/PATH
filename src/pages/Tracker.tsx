import { useState } from 'react';
import { Plus, Trash2, ExternalLink, ChevronDown, ChevronUp, ClipboardList, Link, LayoutGrid, List } from 'lucide-react';
import { useTrackerStore, type Application, type ApplicationStatus, type ApplicationType } from '../store/trackerStore';
import { useResumeStore } from '../store/resumeStore';
import type { Resume } from '../types/resume';
import { useIsMobile } from '../hooks/useBreakpoint';
import { CustomSelect } from '../components/ui/CustomSelect';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  offen:          { label: 'Offen',           color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.08)' },
  beworben:       { label: 'Beworben',        color: '#007AFF',                bg: 'rgba(0,122,255,0.15)'    },
  interview:      { label: 'Interview',       color: '#FF9F0A',                bg: 'rgba(255,159,10,0.15)'   },
  angebot:        { label: 'Angebot',         color: '#34C759',                bg: 'rgba(52,199,89,0.15)'    },
  abgelehnt:      { label: 'Abgelehnt',       color: '#FF3B30',                bg: 'rgba(255,59,48,0.12)'    },
  zurueckgezogen: { label: 'Zurückgezogen',   color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)'  },
};

const TYPE_CONFIG: Record<ApplicationType, { label: string; icon: string }> = {
  online:      { label: 'Online-Portal', icon: '🌐' },
  email:       { label: 'E-Mail',        icon: '✉️' },
  postalisch:  { label: 'Postalisch',    icon: '📮' },
  persoenlich: { label: 'Persönlich',    icon: '🤝' },
  telefonisch: { label: 'Telefonisch',   icon: '📞' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as ApplicationStatus[];
const ALL_TYPES = Object.keys(TYPE_CONFIG) as ApplicationType[];

const SORT_OPTIONS = [
  { value: 'date-desc',   label: 'Datum (neu zuerst)' },
  { value: 'date-asc',    label: 'Datum (alt zuerst)' },
  { value: 'company-asc', label: 'Firma (A–Z)' },
  { value: 'status',      label: 'Status' },
];

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: 'inline-block', padding: '3px 9px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}33`,
    }}>
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }: { type: ApplicationType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
      color: 'var(--text-secondary)',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function formatDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}`;
}

function sortApps(apps: Application[], sort: string) {
  const sorted = [...apps];
  if (sort === 'date-desc') sorted.sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));
  else if (sort === 'date-asc') sorted.sort((a, b) => a.appliedDate.localeCompare(b.appliedDate));
  else if (sort === 'company-asc') sorted.sort((a, b) => a.company.localeCompare(b.company));
  else if (sort === 'status') sorted.sort((a, b) => ALL_STATUSES.indexOf(a.status) - ALL_STATUSES.indexOf(b.status));
  return sorted;
}

// ─── Kanban card ──────────────────────────────────────────────────────────────

interface KanbanCardProps {
  app: Application;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (status: ApplicationStatus) => void;
  onDelete: () => void;
  resumes: Resume[];
  updateApplication: (id: string, patch: Partial<Omit<Application, 'id'>>) => void;
  removeApplication: (id: string) => void;
}

function KanbanCard({
  app,
  isExpanded,
  onToggleExpand,
  onStatusChange,
  resumes,
  updateApplication,
  removeApplication,
}: KanbanCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const appType: ApplicationType = app.type ?? 'online';
  const linkedResume = app.resumeId ? resumes.find((r) => r.id === app.resumeId) : null;

  return (
    <div
      className="glass-card"
      style={{ padding: 0, overflow: 'visible', fontSize: 13 }}
    >
      {/* Compact summary */}
      <div style={{ padding: '10px 12px' }}>
        {/* Top row: company + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 2 }}>
          <div
            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
            onClick={onToggleExpand}
          >
            <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, wordBreak: 'break-word' }}>
              {app.company || <span style={{ opacity: 0.4 }}>Firma</span>}
            </div>
            {app.position && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.3 }}>
                {app.position}
              </div>
            )}
            {app.appliedDate && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {formatDate(app.appliedDate)}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 3, flexShrink: 0, alignItems: 'center' }}>
            {/* Status picker */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn-glass btn-icon"
                title="Status ändern"
                onClick={(e) => { e.stopPropagation(); setShowStatusMenu((v) => !v); }}
                style={{ padding: 5, fontSize: 10 }}
              >
                <ChevronDown size={11} />
              </button>
              {showStatusMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                    onClick={() => setShowStatusMenu(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      zIndex: 100,
                      marginTop: 4,
                      background: 'var(--glass-bg, rgba(30,30,40,0.97))',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      minWidth: 150,
                      overflow: 'hidden',
                    }}
                  >
                    {ALL_STATUSES.map((s) => {
                      const cfg = STATUS_CONFIG[s];
                      const isActive = app.status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(s);
                            setShowStatusMenu(false);
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '8px 12px',
                            textAlign: 'left',
                            background: isActive ? cfg.bg : 'transparent',
                            border: 'none',
                            color: isActive ? cfg.color : 'var(--text-primary)',
                            fontSize: 12,
                            fontWeight: isActive ? 600 : 400,
                            cursor: 'pointer',
                          }}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <button
              className="btn-glass btn-icon"
              title="Details"
              onClick={onToggleExpand}
              style={{ padding: 5 }}
            >
              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} style={{ opacity: 0 }} />}
            </button>

            <button
              className="btn-glass btn-danger btn-icon"
              title="Löschen"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Bewerbung löschen?')) removeApplication(app.id);
              }}
              style={{ padding: 5 }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded detail panel (inline, reuses existing editor structure) */}
      {isExpanded && (
        <div style={{ padding: '4px 12px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label className="section-label">Firma</label>
              <input className="input-glass" placeholder="z.B. Google AG" value={app.company} maxLength={150}
                onChange={(e) => updateApplication(app.id, { company: e.target.value })} />
            </div>
            <div>
              <label className="section-label">Stelle</label>
              <input className="input-glass" placeholder="z.B. Product Manager" value={app.position} maxLength={150}
                onChange={(e) => updateApplication(app.id, { position: e.target.value })} />
            </div>
            <div>
              <label className="section-label">Status</label>
              <CustomSelect
                value={app.status}
                onChange={(v) => updateApplication(app.id, { status: v as ApplicationStatus })}
                options={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s].label }))}
              />
            </div>
            <div>
              <label className="section-label">Stelleninserat URL</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="input-glass" placeholder="https://..." value={app.url} maxLength={500}
                  onChange={(e) => updateApplication(app.id, { url: e.target.value })}
                  style={{ flex: 1 }} />
                {app.url && (
                  <a href={app.url} target="_blank" rel="noopener noreferrer"
                    className="btn-glass btn-icon" style={{ padding: 8, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
            <div>
              <label className="section-label">Bewerbungsdatum</label>
              <input className="input-glass" type="date" value={app.appliedDate}
                onChange={(e) => updateApplication(app.id, { appliedDate: e.target.value })} />
            </div>
            <div>
              <label className="section-label">Deadline (optional)</label>
              <input className="input-glass" type="date" value={app.deadline}
                onChange={(e) => updateApplication(app.id, { deadline: e.target.value })} />
            </div>
          </div>

          {/* Bewerbungsart pill-toggle */}
          <div style={{ marginBottom: 8 }}>
            <label className="section-label">Bewerbungsart</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
              {ALL_TYPES.map((t) => {
                const isActive = appType === t;
                const cfg = TYPE_CONFIG[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateApplication(app.id, { type: t })}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                      cursor: 'pointer',
                      border: isActive ? '1px solid rgba(0,122,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                      background: isActive ? 'rgba(0,122,255,0.2)' : 'rgba(255,255,255,0.06)',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 8 }}>
            <label className="section-label">Notizen</label>
            <textarea className="input-glass"
              placeholder="Kontaktperson, Gesprächsthemen, Eindrücke..."
              value={app.notes} maxLength={1000} rows={2}
              onChange={(e) => updateApplication(app.id, { notes: e.target.value })}
              style={{ resize: 'vertical', fontSize: 12 }} />
          </div>

          {/* Mappe verknüpfen */}
          <div>
            <label className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Mappe verknüpfen
              {linkedResume && (
                <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(0,122,255,0.8)', marginLeft: 4 }}>
                  · {linkedResume.name || 'Unbenannte Mappe'}
                </span>
              )}
            </label>
            <CustomSelect
              value={app.resumeId ?? ''}
              onChange={(v) => {
                const patch: Partial<Omit<Application, 'id'>> = { resumeId: v };
                if (v) {
                  const resume = resumes.find((r) => r.id === v);
                  if (resume) {
                    if (!app.company) patch.company = resume.name || '';
                    if (!app.position) patch.position = resume.personalInfo?.title || '';
                    if (!app.deadline) patch.deadline = resume.deadline || '';
                    if (!app.url) patch.url = resume.jobUrl || '';
                  }
                }
                updateApplication(app.id, patch);
              }}
              options={[
                { value: '', label: 'Keine Mappe verknüpft' },
                ...resumes.map((r) => ({ value: r.id, label: r.name || 'Unbenannte Mappe' })),
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Kanban board ─────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  applications: Application[];
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  addApplication: () => void;
  updateApplication: (id: string, patch: Partial<Omit<Application, 'id'>>) => void;
  removeApplication: (id: string) => void;
  resumes: Resume[];
}

function KanbanBoard({
  applications,
  expanded,
  setExpanded,
  addApplication,
  updateApplication,
  removeApplication,
  resumes,
}: KanbanBoardProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        overflowY: 'visible',
        paddingBottom: 12,
        // Negative horizontal margin to allow flush scroll near edges
        alignItems: 'flex-start',
      }}
    >
      {ALL_STATUSES.map((status) => {
        const cfg = STATUS_CONFIG[status];
        const colApps = applications.filter((a) => a.status === status);

        return (
          <div
            key={status}
            style={{
              flex: '1 1 160px',
              minWidth: 160,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            {/* Column header */}
            <div
              style={{
                borderRadius: '10px 10px 0 0',
                borderTop: `3px solid ${cfg.color}`,
                background: cfg.bg,
                border: `1px solid ${cfg.color}33`,
                borderTopColor: cfg.color,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
                borderBottomLeftRadius: 10,
                borderBottomRightRadius: 10,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>
                {cfg.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: cfg.color,
                  background: `${cfg.color}22`,
                  borderRadius: 20,
                  padding: '1px 7px',
                  minWidth: 20,
                  textAlign: 'center',
                }}
              >
                {colApps.length}
              </span>
            </div>

            {/* "Neue Bewerbung" button only in Offen column */}
            {status === 'offen' && (
              <button
                className="btn-glass"
                onClick={addApplication}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  fontSize: 12, padding: '7px 10px', marginBottom: 6, width: '100%',
                  borderRadius: 8,
                }}
              >
                <Plus size={13} /> Neue Bewerbung
              </button>
            )}

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {colApps.map((app) => (
                <KanbanCard
                  key={app.id}
                  app={app}
                  isExpanded={expanded === app.id}
                  onToggleExpand={() => setExpanded(expanded === app.id ? null : app.id)}
                  onStatusChange={(s) => updateApplication(app.id, { status: s })}
                  onDelete={() => removeApplication(app.id)}
                  resumes={resumes}
                  updateApplication={updateApplication}
                  removeApplication={removeApplication}
                />
              ))}
              {colApps.length === 0 && (
                <div
                  style={{
                    padding: '16px 10px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 11,
                    border: '1px dashed rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                >
                  Leer
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Tracker page ────────────────────────────────────────────────────────

export default function Tracker() {
  const { applications, addApplication, updateApplication, removeApplication } = useTrackerStore();
  const { resumes, persons } = useResumeStore();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [sort, setSort] = useState('date-desc');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const filtered = sortApps(
    filter === 'all' ? applications : applications.filter((a) => a.status === filter),
    sort
  );

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  function handleImportFromResume(resumeId: string) {
    const resume = resumes.find((r) => r.id === resumeId);
    if (!resume) return;
    const patch: Partial<Omit<Application, 'id'>> = {
      company: resume.name || '',
      position: resume.personalInfo?.title || '',
      deadline: resume.deadline || '',
      url: resume.jobUrl || '',
      resumeId: resume.id,
      status: 'offen',
      type: 'online',
    };
    // addApplication creates a blank one first, then we patch it
    useTrackerStore.getState().addApplication();
    const newId = useTrackerStore.getState().applications[0].id;
    useTrackerStore.getState().updateApplication(newId, patch);
    setShowImportModal(false);
    setExpanded(newId);
  }

  function handleResumeLink(appId: string, app: Application, resumeId: string) {
    const patch: Partial<Omit<Application, 'id'>> = { resumeId };
    if (resumeId) {
      const resume = resumes.find((r) => r.id === resumeId);
      if (resume) {
        if (!app.company) patch.company = resume.name || '';
        if (!app.position) patch.position = resume.personalInfo?.title || '';
        if (!app.deadline) patch.deadline = resume.deadline || '';
        if (!app.url) patch.url = resume.jobUrl || '';
      }
    }
    updateApplication(appId, patch);
  }

  return (
    <div className="animate-fade-in" style={{ height: '100%', overflow: 'auto', padding: isMobile ? '14px 14px' : '20px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,122,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList size={15} />
            </div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Bewerbungs-Tracker</h2>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            {applications.length} Bewerbung{applications.length !== 1 ? 'en' : ''} total
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* View mode toggle */}
          <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
            <button
              onClick={() => setViewMode('kanban')}
              title="Kanban-Ansicht"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: viewMode === 'kanban' ? 'rgba(0,122,255,0.25)' : 'rgba(255,255,255,0.06)',
                color: viewMode === 'kanban' ? '#007AFF' : 'var(--text-secondary)',
                transition: 'all 0.15s',
                borderRight: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <LayoutGrid size={13} />
              {!isMobile && 'Kanban'}
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Listen-Ansicht"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: viewMode === 'list' ? 'rgba(0,122,255,0.25)' : 'rgba(255,255,255,0.06)',
                color: viewMode === 'list' ? '#007AFF' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              <List size={13} />
              {!isMobile && 'Liste'}
            </button>
          </div>

          <button className="btn-glass" onClick={() => setShowImportModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link size={14} /> Aus Mappe
          </button>
          <button className="btn-glass btn-primary" onClick={addApplication} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> {isMobile ? '' : 'Bewerbung hinzufügen'}
          </button>
        </div>
      </div>

      {/* Stats row — shown in list mode only */}
      {viewMode === 'list' && applications.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {(['beworben', 'interview', 'angebot', 'abgelehnt'] as ApplicationStatus[]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} style={{
                padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                background: cfg.bg, border: `1px solid ${cfg.color}33`, color: cfg.color,
                cursor: 'pointer', opacity: filter !== 'all' && filter !== s ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }} onClick={() => setFilter(filter === s ? 'all' : s)}>
                {counts[s]} {cfg.label}
              </div>
            );
          })}
        </div>
      )}

      {/* Filter + Sort bar — shown in list mode only */}
      {viewMode === 'list' && applications.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ minWidth: 130, flex: 'none' }}>
            <CustomSelect
              value={filter}
              onChange={(v) => setFilter(v as ApplicationStatus | 'all')}
              options={[{ value: 'all', label: 'Alle Status' }, ...ALL_STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s].label }))]}
              style={{ fontSize: 12, padding: '6px 10px' }}
            />
          </div>
          <div style={{ minWidth: 160, flex: 'none' }}>
            <CustomSelect
              value={sort}
              onChange={(v) => setSort(v)}
              options={SORT_OPTIONS}
              style={{ fontSize: 12, padding: '6px 10px' }}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {applications.length === 0 && (
        <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <ClipboardList size={36} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Noch keine Bewerbungen</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Füge deine erste Bewerbung hinzu und behalte den Überblick.
          </p>
          <button className="btn-glass btn-primary" onClick={addApplication}>
            <Plus size={14} /> Erste Bewerbung hinzufügen
          </button>
        </div>
      )}

      {/* ── Kanban view ── */}
      {viewMode === 'kanban' && applications.length > 0 && (
        <KanbanBoard
          applications={applications}
          expanded={expanded}
          setExpanded={setExpanded}
          addApplication={addApplication}
          updateApplication={updateApplication}
          removeApplication={removeApplication}
          resumes={resumes}
        />
      )}

      {/* ── List view ── */}
      {viewMode === 'list' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((app) => {
              const isOpen = expanded === app.id;
              const appType: ApplicationType = app.type ?? 'online';
              const linkedResume = app.resumeId ? resumes.find((r) => r.id === app.resumeId) : null;

              return (
                <div key={app.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Summary row */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer' }}
                    onClick={() => setExpanded(isOpen ? null : app.id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>
                          {app.company || <span style={{ opacity: 0.4 }}>Firma</span>}
                        </span>
                        {app.position && (
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>· {app.position}</span>
                        )}
                      </div>
                      {!isMobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                          {app.appliedDate && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              Beworben: {formatDate(app.appliedDate)}
                            </span>
                          )}
                          {app.deadline && (
                            <span style={{ fontSize: 11, color: 'rgba(255,159,10,0.7)' }}>
                              Deadline: {formatDate(app.deadline)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <StatusBadge status={app.status} />
                      <TypeBadge type={appType} />
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button
                        className="btn-glass btn-danger btn-icon"
                        onClick={(e) => { e.stopPropagation(); if (confirm('Bewerbung löschen?')) removeApplication(app.id); }}
                        style={{ padding: 6 }}
                      >
                        <Trash2 size={12} />
                      </button>
                      {isOpen ? <ChevronUp size={14} style={{ opacity: 0.4 }} /> : <ChevronDown size={14} style={{ opacity: 0.4 }} />}
                    </div>
                  </div>

                  {/* Expanded editor */}
                  {isOpen && (
                    <div style={{ padding: '4px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <label className="section-label">Firma</label>
                          <input className="input-glass" placeholder="z.B. Google AG" value={app.company} maxLength={150}
                            onChange={(e) => updateApplication(app.id, { company: e.target.value })} />
                        </div>
                        <div>
                          <label className="section-label">Stelle</label>
                          <input className="input-glass" placeholder="z.B. Product Manager" value={app.position} maxLength={150}
                            onChange={(e) => updateApplication(app.id, { position: e.target.value })} />
                        </div>
                        <div>
                          <label className="section-label">Status</label>
                          <CustomSelect
                            value={app.status}
                            onChange={(v) => updateApplication(app.id, { status: v as ApplicationStatus })}
                            options={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s].label }))}
                          />
                        </div>
                        <div>
                          <label className="section-label">Stelleninserat URL</label>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <input className="input-glass" placeholder="https://..." value={app.url} maxLength={500}
                              onChange={(e) => updateApplication(app.id, { url: e.target.value })}
                              style={{ flex: 1 }} />
                            {app.url && (
                              <a href={app.url} target="_blank" rel="noopener noreferrer"
                                className="btn-glass btn-icon" style={{ padding: 8, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="section-label">Bewerbungsdatum</label>
                          <input className="input-glass" type="date" value={app.appliedDate}
                            onChange={(e) => updateApplication(app.id, { appliedDate: e.target.value })} />
                        </div>
                        <div>
                          <label className="section-label">Deadline (optional)</label>
                          <input className="input-glass" type="date" value={app.deadline}
                            onChange={(e) => updateApplication(app.id, { deadline: e.target.value })} />
                        </div>
                      </div>

                      {/* Bewerbungsart pill-toggle */}
                      <div style={{ marginBottom: 10 }}>
                        <label className="section-label">Bewerbungsart</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                          {ALL_TYPES.map((t) => {
                            const isActive = appType === t;
                            const cfg = TYPE_CONFIG[t];
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => updateApplication(app.id, { type: t })}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '5px 12px',
                                  borderRadius: 20,
                                  fontSize: 12,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  border: isActive ? '1px solid rgba(0,122,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                                  background: isActive ? 'rgba(0,122,255,0.2)' : 'rgba(255,255,255,0.06)',
                                  color: isActive ? '#fff' : 'var(--text-secondary)',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {cfg.icon} {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes */}
                      <div style={{ marginBottom: 10 }}>
                        <label className="section-label">Notizen</label>
                        <textarea className="input-glass"
                          placeholder="Kontaktperson, Gesprächsthemen, Eindrücke..."
                          value={app.notes} maxLength={1000} rows={3}
                          onChange={(e) => updateApplication(app.id, { notes: e.target.value })}
                          style={{ resize: 'vertical' }} />
                      </div>

                      {/* Mappe verknüpfen */}
                      <div>
                        <label className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          Mappe verknüpfen
                          {linkedResume && (
                            <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(0,122,255,0.8)', marginLeft: 4 }}>
                              · {linkedResume.name || 'Unbenannte Mappe'}
                            </span>
                          )}
                        </label>
                        <CustomSelect
                          value={app.resumeId ?? ''}
                          onChange={(v) => handleResumeLink(app.id, app, v)}
                          options={[
                            { value: '', label: 'Keine Mappe verknüpft' },
                            ...resumes.map((r) => ({ value: r.id, label: r.name || 'Unbenannte Mappe' })),
                          ]}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && applications.length > 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
              Keine Bewerbungen mit diesem Filter.
            </div>
          )}
        </>
      )}

      {/* "Aus Mappe importieren" modal */}
      {showImportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowImportModal(false); }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: 400,
              padding: '20px 20px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Aus Mappe importieren</h3>
              <button className="btn-glass btn-icon" onClick={() => setShowImportModal(false)} style={{ padding: 6 }}>
                ✕
              </button>
            </div>

            {resumes.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                Keine Mappen vorhanden.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {resumes.map((resume) => {
                  const person = persons.find((p) => p.resumeIds.includes(resume.id));
                  const personName = person?.name || '';
                  return (
                    <button
                      key={resume.id}
                      type="button"
                      className="btn-glass"
                      onClick={() => handleImportFromResume(resume.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 2,
                        padding: '10px 12px',
                        textAlign: 'left',
                        width: '100%',
                        borderRadius: 8,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {resume.name || 'Unbenannte Mappe'}
                      </span>
                      {personName && (
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{personName}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
