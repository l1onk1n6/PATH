import { useState } from 'react';
import { Share2, X, CheckCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useResumeStore } from '../../store/resumeStore';
import { usePlan } from '../../lib/plan';
import { shareLink } from '../../lib/shareLink';

interface Props {
  resumeId: string;
  token?: string;
  onClose: () => void;
}

export default function ShareModal({ resumeId, token, onClose }: Props) {
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

  async function copy() {
    if (!shareUrl) return;
    const nativeSheet = await shareLink(shareUrl, 'Lebenslauf teilen');
    if (nativeSheet) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="glass-card animate-scale-in"
        style={{ padding: 20, width: 340, maxWidth: '90vw', zIndex: 9001, background: 'rgba(14,14,22,0.97)' }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Lebenslauf teilen</div>
          <button className="btn-glass btn-icon" onClick={onClose} style={{ padding: 5 }}>
            <X size={14} />
          </button>
        </div>

        {!shareUrl ? (
          <>
            <p style={{ fontSize: 13, color: 'rgba(var(--rgb-fg),0.5)', marginBottom: 14 }}>
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
