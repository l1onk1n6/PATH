import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, Download, Printer, Mail, Phone, Send, FileText, Globe } from 'lucide-react';
import type { Resume } from '../types/resume';
import { fetchSharedResumeByToken } from '../lib/db';
import ResumePreview from '../components/templates/ResumePreview';
import { LogoFull } from '../components/layout/Logo';
import { isSupabaseConfigured } from '../lib/supabase';
import { renderElementToPdfDoc } from '../lib/pdfExport';
import { useIsMobile } from '../hooks/useBreakpoint';

const TRACK_URL = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/track-view`;

async function trackView(token: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const res = await fetch(TRACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const json = await res.json();
    return json.view_id ?? null;
  } catch { return null; }
}

function sendDuration(viewId: string, durationS: number) {
  if (!isSupabaseConfigured()) return;
  const body = JSON.stringify({ view_id: viewId, duration_s: durationS });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(TRACK_URL + '?method=PATCH', new Blob([body], { type: 'application/json' }));
  } else {
    fetch(TRACK_URL, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  }
}

// ── Cover letter rendered as a professional letter ────────────────
function CoverLetterView({ resume }: { resume: Resume }) {
  const cl = resume.coverLetter;
  const pi = resume.personalInfo;
  const name = [pi.firstName, pi.lastName].filter(Boolean).join(' ');
  const today = new Date().toLocaleDateString('de-CH', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{
      background: '#fff', color: '#1a1a1a',
      padding: '64px 72px', maxWidth: 794, margin: '0 auto',
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: 14, lineHeight: 1.75,
      boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
    }}>
      {/* Sender */}
      <div style={{ marginBottom: 40, fontSize: 13, color: '#444', borderBottom: '1px solid #e5e5e5', paddingBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 4 }}>{name}</div>
        {pi.title && <div style={{ color: '#555', marginBottom: 2 }}>{pi.title}</div>}
        {pi.street && <div>{pi.street}</div>}
        {pi.location && <div>{pi.location}</div>}
        {pi.phone && <div>{pi.phone}</div>}
        {pi.email && <div>{pi.email}</div>}
      </div>

      {/* Date */}
      <div style={{ textAlign: 'right', marginBottom: 32, color: '#555', fontSize: 13 }}>{today}</div>

      {/* Recipient */}
      {cl.recipient && (
        <div style={{ marginBottom: 24, whiteSpace: 'pre-line', color: '#333' }}>{cl.recipient}</div>
      )}

      {/* Subject */}
      {cl.subject && (
        <div style={{ fontWeight: 700, marginBottom: 28, fontSize: 15, color: '#111' }}>{cl.subject}</div>
      )}

      {/* Body */}
      <div style={{ whiteSpace: 'pre-wrap', marginBottom: 40, color: '#222' }}>{cl.body}</div>

      {/* Closing + name */}
      <div style={{ marginBottom: 48, color: '#333' }}>{cl.closing || 'Mit freundlichen Grüssen'}</div>
      <div style={{ fontWeight: 600 }}>{name}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function SharedResumePage() {
  const [params] = useSearchParams();
  const token = params.get('t');
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<'cv' | 'cl'>('cv');
  const [downloading, setDownloading] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);
  const viewIdRef = useRef<string | null>(null);
  const loadTimeRef = useRef<number>(Date.now());
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!token) { setLoading(false); setNotFound(true); return; }
    fetchSharedResumeByToken(token).then((r) => {
      if (r) {
        setResume(r);
        trackView(token).then(id => { viewIdRef.current = id; });
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
    const handleUnload = () => {
      if (viewIdRef.current) sendDuration(viewIdRef.current, Math.round((Date.now() - loadTimeRef.current) / 1000));
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [token]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--ios-blue)' }} />
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Bewerbungsunterlagen werden geladen…</span>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (notFound || !resume) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24, textAlign: 'center' }}>
        <AlertCircle size={40} style={{ opacity: 0.4 }} />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Unterlagen nicht gefunden</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, maxWidth: 320 }}>
          Dieser Link ist ungültig oder wurde deaktiviert.
        </p>
      </div>
    );
  }

  const pi = resume.personalInfo;
  const name = [pi.firstName, pi.lastName].filter(Boolean).join(' ') || 'Kandidat';
  const hasCoverLetter = !!(resume.coverLetter?.body?.trim());
  const shareUrl = window.location.href;

  const forwardSubject = encodeURIComponent(`Bewerbung: ${name}${pi.title ? ` – ${pi.title}` : ''}`);
  const forwardBody = encodeURIComponent(`Guten Tag,\n\nanbei finden Sie die Bewerbungsunterlagen von ${name}:\n\n${shareUrl}\n\nFreundliche Grüsse`);
  const forwardHref = `mailto:?subject=${forwardSubject}&body=${forwardBody}`;

  async function handleDownload() {
    if (!resumeRef.current || downloading) return;
    setDownloading(true);
    try {
      const { pdfBytes } = await renderElementToPdfDoc(resumeRef.current);
      const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '_')}_Lebenslauf.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: isMobile ? '8px 12px' : '9px 16px',
    borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)',
    cursor: 'pointer', fontSize: isMobile ? 12 : 13, fontWeight: 500,
    whiteSpace: 'nowrap', transition: 'background 0.15s',
    fontFamily: 'inherit',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500,
    color: active ? '#fff' : 'rgba(255,255,255,0.45)',
    background: 'none', border: 'none',
    borderBottom: active ? '2px solid var(--ios-blue)' : '2px solid transparent',
    transition: 'color 0.15s',
    fontFamily: 'inherit',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* ── Top nav ──────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,15,30,0.95)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: isMobile ? '10px 16px' : '10px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <LogoFull size={22} />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}{pi.title ? ` · ${pi.title}` : ''}
        </div>
        <a href="/" style={{
          fontSize: 12, padding: '6px 12px', borderRadius: 8,
          background: 'rgba(0,122,255,0.15)', border: '1px solid rgba(0,122,255,0.3)',
          color: 'var(--ios-blue)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {isMobile ? 'Erstellen' : 'Eigenen CV erstellen'}
        </a>
      </div>

      {/* ── Candidate header ──────────────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: isMobile ? '20px 16px' : '24px 32px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Name + title + contact */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 0, justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: '-0.4px' }}>{name}</h1>
              {pi.title && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>{pi.title}</div>}
            </div>

            {/* Quick contact links */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {pi.email && (
                <a href={`mailto:${pi.email}`} style={{ ...btnStyle, textDecoration: 'none' }}>
                  <Mail size={13} /> {isMobile ? '' : pi.email}
                  {isMobile && <span style={{ fontSize: 11 }}>E-Mail</span>}
                </a>
              )}
              {pi.phone && (
                <a href={`tel:${pi.phone}`} style={{ ...btnStyle, textDecoration: 'none' }}>
                  <Phone size={13} /> {isMobile ? '' : pi.phone}
                  {isMobile && <span style={{ fontSize: 11 }}>Anrufen</span>}
                </a>
              )}
              {pi.linkedin && (
                <a href={pi.linkedin.startsWith('http') ? pi.linkedin : `https://${pi.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, textDecoration: 'none' }}>
                  <Globe size={13} /> LinkedIn
                </a>
              )}
              {pi.website && (
                <a href={pi.website.startsWith('http') ? pi.website : `https://${pi.website}`} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, textDecoration: 'none' }}>
                  <Globe size={13} /> {isMobile ? '' : 'Website'}
                  {isMobile && <span style={{ fontSize: 11 }}>Website</span>}
                </a>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                ...btnStyle,
                background: 'rgba(0,122,255,0.2)', border: '1px solid rgba(0,122,255,0.4)',
                color: downloading ? 'rgba(255,255,255,0.4)' : 'var(--ios-blue)', fontWeight: 600,
              }}
            >
              {downloading
                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> PDF wird erstellt…</>
                : <><Download size={13} /> Lebenslauf als PDF</>
              }
            </button>
            <a href={forwardHref} style={{ ...btnStyle, textDecoration: 'none' }}>
              <Send size={13} /> Weiterleiten
            </a>
            <button onClick={() => window.print()} style={btnStyle}>
              <Printer size={13} /> Drucken
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs (only if cover letter exists) ───────────────── */}
      {hasCoverLetter && (
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '0 32px',
          display: 'flex',
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', width: '100%' }}>
            <button style={tabStyle(tab === 'cv')} onClick={() => setTab('cv')}>
              <FileText size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Lebenslauf
            </button>
            <button style={tabStyle(tab === 'cl')} onClick={() => setTab('cl')}>
              <Mail size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Anschreiben
            </button>
          </div>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '24px 12px' : '32px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {tab === 'cv' ? (
            <div
              ref={resumeRef}
              style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,0.4)' }}
            >
              <ResumePreview resume={resume} />
            </div>
          ) : (
            <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,0.4)' }}>
              <CoverLetterView resume={resume} />
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer style={{
        padding: '12px 32px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        fontSize: 12, color: 'rgba(255,255,255,0.25)',
      }}>
        <span>Erstellt mit PATH by pixmatic</span>
        <span>·</span>
        <a href="/" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
          Eigene Bewerbungsmappe erstellen →
        </a>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media print {
          body > * { display: none !important; }
          body > #root > * > div[style*="overflow: auto"] { display: block !important; }
        }
      `}</style>
    </div>
  );
}
