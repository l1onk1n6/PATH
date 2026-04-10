import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Copy, CheckCircle, BarChart2, Eye, Globe, Monitor, Smartphone, ExternalLink, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import type { ShareLink, ShareLinkView } from '../../types/resume';
import { getShareLinks, createShareLink, deleteShareLink, updateShareLink, getShareLinkViews } from '../../lib/db';
import { isSupabaseConfigured } from '../../lib/supabase';
import { usePlan } from '../../lib/plan';

const FLAG: Record<string, string> = {
  AT: '🇦🇹', CH: '🇨🇭', DE: '🇩🇪', US: '🇺🇸', GB: '🇬🇧', FR: '🇫🇷', IT: '🇮🇹',
  NL: '🇳🇱', ES: '🇪🇸', PL: '🇵🇱', SE: '🇸🇪', NO: '🇳🇴', DK: '🇩🇰', BE: '🇧🇪',
  LU: '🇱🇺', LI: '🇱🇮',
};

function flag(code?: string) { return code ? (FLAG[code] ?? '🌍') : '🌍'; }

function deviceIcon(d?: string) {
  if (d === 'mobile') return <Smartphone size={11} />;
  if (d === 'tablet') return <Monitor size={11} />;
  return <Monitor size={11} />;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(s?: number) {
  if (!s) return null;
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// Mini bar chart for last 14 days
function ViewSparkline({ views }: { views: ShareLinkView[] }) {
  const days = 14;
  const now = new Date();
  const buckets: number[] = Array(days).fill(0);
  views.forEach(v => {
    const diff = Math.floor((now.getTime() - new Date(v.viewedAt).getTime()) / 86400000);
    if (diff >= 0 && diff < days) buckets[days - 1 - diff]++;
  });
  const max = Math.max(...buckets, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
      {buckets.map((n, i) => (
        <div key={i} title={`${n} Aufruf${n !== 1 ? 'e' : ''}`} style={{
          flex: 1, background: n > 0 ? 'var(--ios-blue)' : 'rgba(255,255,255,0.08)',
          borderRadius: 2, height: `${Math.max(10, (n / max) * 100)}%`,
          opacity: n > 0 ? 0.7 + (n / max) * 0.3 : 1,
          minHeight: 3,
        }} />
      ))}
    </div>
  );
}

function LinkAnalyticsPanel({ link }: { link: ShareLink }) {
  const [views, setViews] = useState<ShareLinkView[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || views !== null) return;
    getShareLinkViews(link.id, 100).then(setViews);
  }, [open, link.id, views]);

  if (!open) {
    return (
      <button
        className="btn-glass btn-sm"
        onClick={() => setOpen(true)}
        style={{ fontSize: 11, gap: 5, padding: '4px 10px' }}
      >
        <BarChart2 size={11} /> {link.viewCount ?? 0} Aufrufe
      </button>
    );
  }

  return (
    <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>
          <BarChart2 size={11} style={{ display: 'inline', marginRight: 5 }} />
          Analytics
        </div>
        <button className="btn-glass btn-icon btn-sm" onClick={() => setOpen(false)} style={{ padding: 3 }}>
          <ChevronUp size={12} />
        </button>
      </div>

      {views === null ? (
        <div style={{ textAlign: 'center', padding: 16 }}><Loader2 size={16} style={{ opacity: 0.4, animation: 'spin 1s linear infinite' }} /></div>
      ) : views.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
          <Eye size={14} style={{ opacity: 0.3, display: 'block', margin: '0 auto 6px' }} />
          Noch keine Aufrufe
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{views.length}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Aufrufe</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {new Set(views.map(v => v.countryCode).filter(Boolean)).size}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Länder</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {views.filter(v => v.durationS).length > 0
                  ? fmtDuration(Math.round(views.filter(v => v.durationS).reduce((a, v) => a + (v.durationS ?? 0), 0) / views.filter(v => v.durationS).length))
                  : '—'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Ø Dauer</div>
            </div>
          </div>

          {/* Sparkline */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 5 }}>Letzte 14 Tage</div>
            <ViewSparkline views={views} />
          </div>

          {/* Country + device breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Land</div>
              {Object.entries(
                views.reduce<Record<string, number>>((acc, v) => {
                  const k = v.countryCode ?? '?';
                  acc[k] = (acc[k] ?? 0) + 1;
                  return acc;
                }, {})
              ).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([code, n]) => (
                <div key={code} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span>{flag(code)} {code}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{n}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Gerät</div>
              {Object.entries(
                views.reduce<Record<string, number>>((acc, v) => {
                  const k = v.device ?? 'desktop';
                  acc[k] = (acc[k] ?? 0) + 1;
                  return acc;
                }, {})
              ).sort((a, b) => b[1] - a[1]).map(([d, n]) => (
                <div key={d} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{deviceIcon(d)} {d}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent views */}
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>Letzte Aufrufe</div>
          <div style={{ maxHeight: 140, overflowY: 'auto' }}>
            {views.slice(0, 15).map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-muted)' }}>
                  {flag(v.countryCode)}
                  {deviceIcon(v.device)}
                  <span>{v.browser ?? '—'}</span>
                  {v.durationS && <span style={{ opacity: 0.5 }}>· {fmtDuration(v.durationS)}</span>}
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{fmtDate(v.viewedAt)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface Props {
  resumeId: string;
}

export default function ShareLinksPanel({ resumeId }: Props) {
  const { limits, isPro } = usePlan();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(() => {
    getShareLinks(resumeId).then(l => { setLinks(l); setLoading(false); });
  }, [resumeId]);

  useEffect(() => { load(); }, [load]);

  if (!isSupabaseConfigured()) return null;

  const activeCount = links.filter(l => l.isActive).length;
  const atLimit = activeCount >= limits.shareLinks;

  function shareUrl(token: string) {
    return `${window.location.origin}${window.location.pathname}#/shared?t=${token}`;
  }

  function copy(token: string) {
    navigator.clipboard.writeText(shareUrl(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  async function create() {
    if (atLimit || creating) return;
    setCreating(true);
    const link = await createShareLink(resumeId, newLabel.trim());
    if (link) { setLinks(prev => [link, ...prev]); setNewLabel(''); setShowCreate(false); }
    setCreating(false);
  }

  async function toggle(link: ShareLink) {
    await updateShareLink(link.id, { isActive: !link.isActive });
    setLinks(prev => prev.map(l => l.id === link.id ? { ...l, isActive: !l.isActive } : l));
  }

  async function remove(linkId: string) {
    await deleteShareLink(linkId);
    setLinks(prev => prev.filter(l => l.id !== linkId));
  }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <ExternalLink size={10} style={{ display: 'inline', marginRight: 4 }} />
          {activeCount}/{limits.shareLinks} aktive Links
        </div>
        {!isPro ? (
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'linear-gradient(135deg,#FF9F0A,#FF375F)', color: '#fff', fontWeight: 700 }}>PRO</span>
        ) : (
          <button
            className="btn-glass btn-primary btn-sm"
            onClick={() => setShowCreate(v => !v)}
            disabled={atLimit}
            style={{ fontSize: 11, opacity: atLimit ? 0.5 : 1 }}
          >
            <Plus size={11} /> Neuer Link
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <input
            className="input-glass"
            placeholder='Label, z.B. "Siemens AG" (optional)'
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()}
            style={{ flex: 1, fontSize: 12 }}
            autoFocus
          />
          <button className="btn-glass btn-primary btn-sm" onClick={create} disabled={creating}>
            {creating ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : 'Erstellen'}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <Loader2 size={16} style={{ opacity: 0.4, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : links.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          <Globe size={24} style={{ opacity: 0.25, display: 'block', margin: '0 auto 8px' }} />
          Noch keine Share-Links. Erstelle deinen ersten Link.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {links.map(link => (
            <div key={link.id} className="glass-card" style={{ padding: 12, opacity: link.isActive ? 1 : 0.55 }}>
              {/* Top row: label + actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{link.label || 'Ohne Label'}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Erstellt {new Date(link.createdAt).toLocaleDateString('de-CH')}
                    {!link.isActive && <span style={{ marginLeft: 6, color: '#FF9F0A' }}>· deaktiviert</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-glass btn-icon btn-sm" onClick={() => toggle(link)} title={link.isActive ? 'Deaktivieren' : 'Aktivieren'} style={{ padding: 5 }}>
                    {link.isActive ? <ToggleRight size={13} style={{ color: 'var(--ios-blue)' }} /> : <ToggleLeft size={13} />}
                  </button>
                  <button className="btn-glass btn-icon btn-sm" onClick={() => copy(link.token)} title="Link kopieren" style={{ padding: 5 }}>
                    {copied === link.token ? <CheckCircle size={13} style={{ color: '#30D158' }} /> : <Copy size={13} />}
                  </button>
                  <button className="btn-glass btn-danger btn-icon btn-sm" onClick={() => remove(link.id)} title="Link löschen" style={{ padding: 5 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* URL preview */}
              <div style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 8px', marginBottom: 8, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shareUrl(link.token)}
              </div>

              {/* Analytics */}
              <LinkAnalyticsPanel link={link} />
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
