import { useState } from 'react';
import { Plus, Trash2, ExternalLink, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import { useTrackerStore, type Application, type ApplicationStatus } from '../store/trackerStore';
import { useIsMobile } from '../hooks/useBreakpoint';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  offen:          { label: 'Offen',           color: 'rgba(255,255,255,0.55)', bg: 'rgba(255,255,255,0.08)' },
  beworben:       { label: 'Beworben',        color: '#007AFF',                bg: 'rgba(0,122,255,0.15)'    },
  interview:      { label: 'Interview',       color: '#FF9F0A',                bg: 'rgba(255,159,10,0.15)'   },
  angebot:        { label: 'Angebot',         color: '#34C759',                bg: 'rgba(52,199,89,0.15)'    },
  abgelehnt:      { label: 'Abgelehnt',       color: '#FF3B30',                bg: 'rgba(255,59,48,0.12)'    },
  zurueckgezogen: { label: 'Zurückgezogen',   color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.05)'  },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as ApplicationStatus[];

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

export default function Tracker() {
  const { applications, addApplication, updateApplication, removeApplication } = useTrackerStore();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [sort, setSort] = useState('date-desc');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = sortApps(
    filter === 'all' ? applications : applications.filter((a) => a.status === filter),
    sort
  );

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  return (
    <div className="animate-fade-in glass" style={{ height: '100%', overflow: 'auto', borderRadius: 'var(--radius-lg)', padding: isMobile ? '14px 14px' : '20px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,122,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList size={15} />
            </div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Bewerbungs-Tracker</h2>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            {applications.length} Bewerbung{applications.length !== 1 ? 'en' : ''} total
          </p>
        </div>
        <button className="btn-glass btn-primary" onClick={addApplication} style={{ flexShrink: 0 }}>
          <Plus size={14} /> Bewerbung hinzufügen
        </button>
      </div>

      {/* Stats row */}
      {applications.length > 0 && (
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

      {/* Filter + Sort bar */}
      {applications.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="input-glass"
            value={filter}
            onChange={(e) => setFilter(e.target.value as ApplicationStatus | 'all')}
            style={{ fontSize: 12, padding: '6px 10px', flex: 'none', minWidth: 130 }}
          >
            <option value="all">Alle Status</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <select
            className="input-glass"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ fontSize: 12, padding: '6px 10px', flex: 'none', minWidth: 160 }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Empty state */}
      {applications.length === 0 && (
        <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <ClipboardList size={36} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Noch keine Bewerbungen</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
            Füge deine erste Bewerbung hinzu und behalte den Überblick.
          </p>
          <button className="btn-glass btn-primary" onClick={addApplication}>
            <Plus size={14} /> Erste Bewerbung hinzufügen
          </button>
        </div>
      )}

      {/* Application list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((app) => {
          const isOpen = expanded === app.id;
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
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>· {app.position}</span>
                    )}
                  </div>
                  {!isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                      {app.appliedDate && (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
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
                <StatusBadge status={app.status} />
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
                      <select className="input-glass" value={app.status}
                        onChange={(e) => updateApplication(app.id, { status: e.target.value as ApplicationStatus })}>
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="section-label">Stelleninserat (URL)</label>
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
                  <div>
                    <label className="section-label">Notizen</label>
                    <textarea className="input-glass"
                      placeholder="Kontaktperson, Gesprächsthemen, Eindrücke..."
                      value={app.notes} maxLength={1000} rows={3}
                      onChange={(e) => updateApplication(app.id, { notes: e.target.value })}
                      style={{ resize: 'vertical' }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && applications.length > 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
          Keine Bewerbungen mit diesem Filter.
        </div>
      )}
    </div>
  );
}
