import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Copy, CheckCircle, Globe, ExternalLink, ToggleLeft, ToggleRight, Loader2, Sparkles } from 'lucide-react';
import type { ShareLink } from '../../types/resume';
import { getShareLinks, createShareLink, deleteShareLink, updateShareLink } from '../../lib/db';
import { isSupabaseConfigured } from '../../lib/supabase';
import { usePlan } from '../../lib/plan';
import ProGate from '../ui/ProGate';
import { toast } from '../ui/Toast';


interface Props {
  resumeId: string;
  readOnly?: boolean;
}

export default function ShareLinksPanel({ resumeId, readOnly }: Props) {
  const { limits, isPro } = usePlan();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [firstLinkId, setFirstLinkId] = useState<string | null>(null);
  const [labelError, setLabelError] = useState('');
  const LABEL_MAX = 50;

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
    toast.success('linkCopied');
  }

  async function create() {
    if (atLimit || creating) return;
    const trimmed = newLabel.trim();
    if (trimmed.length > LABEL_MAX) {
      setLabelError(`Max. ${LABEL_MAX} Zeichen (${trimmed.length}/${LABEL_MAX})`);
      return;
    }
    setLabelError('');
    setCreating(true);
    const isFirst = links.length === 0;
    const link = await createShareLink(resumeId, trimmed);
    if (link) {
      setLinks(prev => [link, ...prev]);
      setNewLabel('');
      setShowCreate(false);
      toast.success('linkCreated');
      if (isFirst) {
        // Auto-copy and show first-link hint
        const url = `${window.location.origin}${window.location.pathname}#/shared?t=${link.token}`;
        navigator.clipboard.writeText(url).catch(() => {});
        setCopied(link.token);
        setFirstLinkId(link.id);
        setTimeout(() => setCopied(null), 3000);
      }
    }
    setCreating(false);
  }

  async function toggle(link: ShareLink) {
    await updateShareLink(link.id, { isActive: !link.isActive });
    setLinks(prev => prev.map(l => l.id === link.id ? { ...l, isActive: !l.isActive } : l));
    if (link.isActive) { toast.success('linkDisabled'); } else { toast.success('linkEnabled'); }
  }

  async function remove(linkId: string) {
    await deleteShareLink(linkId);
    setLinks(prev => prev.filter(l => l.id !== linkId));
    toast.success('linkDeleted');
  }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <ExternalLink size={10} style={{ display: 'inline', marginRight: 4 }} />
          {activeCount}/{limits.shareLinks} aktive Links
        </div>
        {!readOnly && (isPro ? (
          <button
            className="btn-glass btn-primary btn-sm"
            onClick={() => setShowCreate(v => !v)}
            disabled={atLimit}
            style={{ fontSize: 11, opacity: atLimit ? 0.5 : 1 }}
          >
            <Plus size={11} /> Neuer Link
          </button>
        ) : (
          <ProGate featureId="share" badge>
            <button className="btn-glass btn-primary btn-sm" style={{ fontSize: 11 }}>
              <Plus size={11} /> Neuer Link
            </button>
          </ProGate>
        ))}
      </div>

      {/* Create form */}
      {!readOnly && showCreate && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="input-glass"
              placeholder='Label, z.B. "Siemens AG" (optional)'
              value={newLabel}
              onChange={e => { setNewLabel(e.target.value); if (labelError) setLabelError(''); }}
              onKeyDown={e => e.key === 'Enter' && create()}
              maxLength={LABEL_MAX + 1}
              style={{ flex: 1, fontSize: 12, borderColor: labelError ? 'rgba(255,59,48,0.5)' : undefined }}
              autoFocus
            />
            <button className="btn-glass btn-primary btn-sm" onClick={create} disabled={creating}>
              {creating ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : 'Erstellen'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {labelError
              ? <span style={{ fontSize: 11, color: 'var(--ios-red)' }}>{labelError}</span>
              : <span />
            }
            <span style={{ fontSize: 11, color: newLabel.length > LABEL_MAX * 0.8 ? 'var(--ios-orange)' : 'var(--text-muted)' }}>
              {newLabel.length}/{LABEL_MAX}
            </span>
          </div>
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
              <div style={{ fontSize: 10, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 8px', marginBottom: firstLinkId === link.id ? 10 : 0, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {shareUrl(link.token)}
              </div>

              {/* First-link hint */}
              {firstLinkId === link.id && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.25)', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#30D158' }}>
                  <Sparkles size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>Link kopiert!</div>
                    <div style={{ opacity: 0.8 }}>Schicke den Link direkt per E-Mail an HR — der Lebenslauf öffnet sich ohne Login.</div>
                  </div>
                  <button
                    onClick={() => setFirstLinkId(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#30D158', opacity: 0.5, padding: 0, flexShrink: 0, fontSize: 14, lineHeight: 1 }}
                  >✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
