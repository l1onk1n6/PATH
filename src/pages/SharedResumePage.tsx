import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, Download, Printer, Mail, Phone, Send, FileText, Globe, Paperclip, Sun, Moon } from 'lucide-react';
import type { Resume, UploadedDocument } from '../types/resume';
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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return (await res.json()).view_id ?? null;
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

// ── i18n ──────────────────────────────────────────────────────────────────────
type Lang = 'de' | 'en';

const STRINGS = {
  de: {
    loading: 'Bewerbungsunterlagen werden geladen…',
    notFound: 'Unterlagen nicht gefunden',
    notFoundSub: 'Dieser Link ist ungültig oder wurde deaktiviert.',
    emailLabel: 'E-Mail',
    callLabel: 'Anrufen',
    downloadingPdf: 'PDF wird erstellt…',
    downloadPdf: 'Lebenslauf als PDF',
    forward: 'Weiterleiten',
    print: 'Drucken',
    coverLetterTab: 'Anschreiben',
    cvTab: 'Lebenslauf',
    attachmentsTab: 'Anlagen',
    download: 'Herunterladen',
    previewLoading: 'Vorschau wird geladen…',
    footerCreated: 'Erstellt mit PATH by pixmatic',
    footerCta: 'Eigene Bewerbungsmappe erstellen →',
    lightMode: 'Heller Modus',
    darkMode: 'Dunkler Modus',
    forwardSubject: (name: string, title: string) =>
      `Bewerbung: ${name}${title ? ` – ${title}` : ''}`,
    forwardBody: (name: string, url: string) =>
      `Guten Tag,\n\nanbei finden Sie die Bewerbungsunterlagen von ${name}:\n\n${url}\n\nFreundliche Grüsse`,
    categories: { certificate: 'Zertifikat', reference: 'Referenz', portfolio: 'Portfolio', other: 'Anlage' },
    dateLocale: 'de-CH' as const,
  },
  en: {
    loading: 'Loading application documents…',
    notFound: 'Documents not found',
    notFoundSub: 'This link is invalid or has been deactivated.',
    emailLabel: 'Email',
    callLabel: 'Call',
    downloadingPdf: 'Creating PDF…',
    downloadPdf: 'Download CV as PDF',
    forward: 'Forward',
    print: 'Print',
    coverLetterTab: 'Cover Letter',
    cvTab: 'CV',
    attachmentsTab: 'Attachments',
    download: 'Download',
    previewLoading: 'Loading preview…',
    footerCreated: 'Created with PATH by pixmatic',
    footerCta: 'Create your own application →',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    forwardSubject: (name: string, title: string) =>
      `Application: ${name}${title ? ` – ${title}` : ''}`,
    forwardBody: (name: string, url: string) =>
      `Dear Sir or Madam,\n\nplease find the application documents of ${name}:\n\n${url}\n\nBest regards`,
    categories: { certificate: 'Certificate', reference: 'Reference', portfolio: 'Portfolio', other: 'Attachment' },
    dateLocale: 'en-GB' as const,
  },
} as const;

// ── DocCard ───────────────────────────────────────────────────────────────────
function DocCard({ doc, light, lang }: { doc: UploadedDocument; light: boolean; lang: Lang }) {
  const s = STRINGS[lang];
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (doc.type !== 'application/pdf' || !doc.dataUrl) return;
    if (!doc.dataUrl.startsWith('data:')) { setPdfUrl(doc.dataUrl); return; }
    try {
      const bytes = Uint8Array.from(atob(doc.dataUrl.split(',')[1]), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }, [doc.dataUrl, doc.type]);

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: light ? '0 4px 24px rgba(0,0,0,0.12)' : '0 8px 48px rgba(0,0,0,0.4)', marginBottom: 32 }}>
      <div style={{
        background: light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
        borderBottom: `1px solid ${light ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.08)'}`,
        padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Paperclip size={13} style={{ opacity: 0.5 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: light ? '#111' : '#fff' }}>{doc.name}</span>
          <span style={{ fontSize: 11, color: light ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)', background: light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 99 }}>
            {s.categories[doc.category] ?? doc.category}
          </span>
        </div>
        {doc.dataUrl && (
          <a href={doc.dataUrl} download={doc.name} style={{
            fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none',
            color: 'var(--ios-blue)', padding: '5px 10px', borderRadius: 7,
            background: 'rgba(0,122,255,0.12)', border: '1px solid rgba(0,122,255,0.3)',
          }}>
            <Download size={11} /> {s.download}
          </a>
        )}
      </div>
      {doc.type.startsWith('image/') && doc.dataUrl && (
        <img src={doc.dataUrl} alt={doc.name} style={{ width: '100%', display: 'block', background: '#fff' }} />
      )}
      {doc.type === 'application/pdf' && pdfUrl && (
        <iframe src={pdfUrl} style={{ width: '100%', height: 1123, border: 'none', display: 'block' }} title={doc.name} />
      )}
      {doc.type === 'application/pdf' && !pdfUrl && doc.dataUrl && (
        <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: light ? '#f9f9f9' : 'rgba(255,255,255,0.03)', fontSize: 12, color: light ? '#aaa' : 'rgba(255,255,255,0.3)' }}>
          {s.previewLoading}
        </div>
      )}
    </div>
  );
}

// ── CoverLetterView ───────────────────────────────────────────────────────────
function CoverLetterView({ resume, lang }: { resume: Resume; lang: Lang }) {
  const cl = resume.coverLetter;
  const pi = resume.personalInfo;
  const name = [pi.firstName, pi.lastName].filter(Boolean).join(' ');
  const today = new Date().toLocaleDateString(STRINGS[lang].dateLocale, { day: '2-digit', month: 'long', year: 'numeric' });
  return (
    <div style={{ background: '#fff', color: '#1a1a1a', padding: '64px 72px', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 14, lineHeight: 1.75 }}>
      <div style={{ marginBottom: 40, fontSize: 13, color: '#444', borderBottom: '1px solid #e5e5e5', paddingBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 4 }}>{name}</div>
        {pi.title && <div style={{ color: '#555', marginBottom: 2 }}>{pi.title}</div>}
        {pi.street && <div>{pi.street}</div>}
        {pi.location && <div>{pi.location}</div>}
        {pi.phone && <div>{pi.phone}</div>}
        {pi.email && <div>{pi.email}</div>}
      </div>
      <div style={{ textAlign: 'right', marginBottom: 32, color: '#555', fontSize: 13 }}>{today}</div>
      {cl.recipient && <div style={{ marginBottom: 24, whiteSpace: 'pre-line', color: '#333' }}>{cl.recipient}</div>}
      {cl.subject && <div style={{ fontWeight: 700, marginBottom: 28, fontSize: 15, color: '#111' }}>{cl.subject}</div>}
      <div style={{ whiteSpace: 'pre-wrap', marginBottom: 40, color: '#222' }}>{cl.body}</div>
      <div style={{ marginBottom: 48, color: '#333' }}>{cl.closing || 'Mit freundlichen Grüssen'}</div>
      <div style={{ fontWeight: 600 }}>{name}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SharedResumePage() {
  const [params] = useSearchParams();
  const token = params.get('t');
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<'cl' | 'cv' | 'docs'>('cl');
  const [downloading, setDownloading] = useState(false);
  const [light, setLight] = useState(false);
  const [lang, setLang] = useState<Lang>('de');
  const resumeRef = useRef<HTMLDivElement>(null);
  const viewIdRef = useRef<string | null>(null);
  const loadTimeRef = useRef<number>(Date.now());
  const isMobile = useIsMobile();

  // Global CSS sets body { overflow: hidden } for the app shell — override it here
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); setNotFound(true); return; }
    fetchSharedResumeByToken(token).then((r) => {
      if (r) {
        setResume(r);
        if (!r.coverLetter?.body?.trim()) setTab('cv');
        trackView(token).then(id => { viewIdRef.current = id; });
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
    const onUnload = () => {
      if (viewIdRef.current) sendDuration(viewIdRef.current, Math.round((Date.now() - loadTimeRef.current) / 1000));
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [token]);

  const s = STRINGS[lang];

  // ── Theme ──────────────────────────────────────────────────────
  const t = light ? {
    bg: '#f0f2f5',
    navBg: 'rgba(255,255,255,0.97)', navBorder: 'rgba(0,0,0,0.1)',
    headerBg: '#fff', headerBorder: 'rgba(0,0,0,0.07)',
    tabsBg: 'rgba(0,0,0,0.03)', tabsBorder: 'rgba(0,0,0,0.08)',
    text: '#1a1a1a', textSub: 'rgba(0,0,0,0.5)', textMuted: 'rgba(0,0,0,0.35)',
    btnBg: 'rgba(0,0,0,0.05)', btnBorder: 'rgba(0,0,0,0.12)', btnColor: '#333',
    tabActive: '#1a1a1a', tabInactive: 'rgba(0,0,0,0.35)',
    footerBorder: 'rgba(0,0,0,0.08)', footerText: 'rgba(0,0,0,0.35)',
    shadow: '0 4px 24px rgba(0,0,0,0.12)',
  } : {
    bg: 'var(--bg)',
    navBg: 'rgba(8,15,30,0.97)', navBorder: 'rgba(255,255,255,0.08)',
    headerBg: 'rgba(255,255,255,0.03)', headerBorder: 'rgba(255,255,255,0.07)',
    tabsBg: 'rgba(0,0,0,0.2)', tabsBorder: 'rgba(255,255,255,0.07)',
    text: '#fff', textSub: 'rgba(255,255,255,0.5)', textMuted: 'rgba(255,255,255,0.4)',
    btnBg: 'rgba(255,255,255,0.08)', btnBorder: 'rgba(255,255,255,0.15)', btnColor: 'rgba(255,255,255,0.85)',
    tabActive: '#fff', tabInactive: 'rgba(255,255,255,0.4)',
    footerBorder: 'rgba(255,255,255,0.06)', footerText: 'rgba(255,255,255,0.25)',
    shadow: '0 8px 48px rgba(0,0,0,0.4)',
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--ios-blue)' }} />
      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{STRINGS.de.loading}</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (notFound || !resume) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24, textAlign: 'center' }}>
      <AlertCircle size={40} style={{ opacity: 0.4 }} />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{STRINGS.de.notFound}</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, maxWidth: 320 }}>{STRINGS.de.notFoundSub}</p>
    </div>
  );

  const pi = resume.personalInfo;
  const name = [pi.firstName, pi.lastName].filter(Boolean).join(' ') || 'Kandidat';
  const hasCoverLetter = !!(resume.coverLetter?.body?.trim());
  const docs = resume.documents ?? [];
  const shareUrl = window.location.href;

  const forwardHref = `mailto:?subject=${encodeURIComponent(s.forwardSubject(name, pi.title))}&body=${encodeURIComponent(s.forwardBody(name, shareUrl))}`;

  async function handleDownload() {
    if (!resumeRef.current || downloading) return;
    setDownloading(true);
    try {
      const { pdfBytes } = await renderElementToPdfDoc(resumeRef.current);
      const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${name.replace(/\s+/g, '_')}_CV.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } finally { setDownloading(false); }
  }

  const btn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: isMobile ? '8px 12px' : '9px 16px', borderRadius: 10,
    border: `1px solid ${t.btnBorder}`, background: t.btnBg, color: t.btnColor,
    cursor: 'pointer', fontSize: isMobile ? 12 : 13, fontWeight: 500,
    whiteSpace: 'nowrap', fontFamily: 'inherit', textDecoration: 'none',
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500,
    color: active ? t.tabActive : t.tabInactive,
    background: 'none', border: 'none',
    borderBottom: active ? '2px solid var(--ios-blue)' : '2px solid transparent',
    fontFamily: 'inherit', transition: 'color 0.15s',
  });

  const iconBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: 34, borderRadius: 9, border: `1px solid ${t.btnBorder}`,
    background: t.btnBg, color: t.btnColor, cursor: 'pointer', flexShrink: 0,
    transition: 'background 0.2s', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: t.bg, transition: 'background 0.2s' }}>

      {/* ── Nav ── */}
      <div id="shared-nav" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: t.navBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${t.navBorder}`,
        padding: isMobile ? '10px 16px' : '10px 32px',
        display: 'flex', alignItems: 'center', gap: 10,
        transition: 'background 0.2s, border-color 0.2s',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <LogoFull size={22} light={light} />
        </a>

        <div style={{ fontSize: 13, color: t.textMuted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}{pi.title ? ` · ${pi.title}` : ''}
        </div>

        {/* Language toggle */}
        <button
          onClick={() => setLang(l => l === 'de' ? 'en' : 'de')}
          title={lang === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
          style={{ ...iconBtn, width: 'auto', padding: '0 10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.03em' }}
        >
          {lang === 'de' ? 'EN' : 'DE'}
        </button>

        {/* Dark/Light toggle */}
        <button
          onClick={() => setLight(v => !v)}
          title={light ? s.darkMode : s.lightMode}
          style={{ ...iconBtn, width: 34 }}
        >
          {light ? <Moon size={15} /> : <Sun size={15} />}
        </button>
      </div>

      {/* ── Candidate header ── */}
      <div id="shared-header" style={{ background: t.headerBg, borderBottom: `1px solid ${t.headerBorder}`, padding: isMobile ? '20px 16px' : '24px 32px', transition: 'background 0.2s' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 0, justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 800, letterSpacing: '-0.4px', color: t.text }}>{name}</h1>
              {pi.title && <div style={{ fontSize: 14, color: t.textSub, marginTop: 3 }}>{pi.title}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {pi.email?.trim() && <a href={`mailto:${pi.email}`} style={{ ...btn }}><Mail size={13} />{isMobile ? s.emailLabel : pi.email}</a>}
              {pi.phone?.trim() && <a href={`tel:${pi.phone}`} style={{ ...btn }}><Phone size={13} />{isMobile ? s.callLabel : pi.phone}</a>}
              {pi.linkedin?.trim() && <a href={pi.linkedin.startsWith('http') ? pi.linkedin : `https://${pi.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ ...btn }}><Globe size={13} />LinkedIn</a>}
              {pi.website?.trim() && <a href={pi.website.startsWith('http') ? pi.website : `https://${pi.website}`} target="_blank" rel="noopener noreferrer" style={{ ...btn }}><Globe size={13} />Website</a>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleDownload} disabled={downloading} style={{ ...btn, background: 'rgba(0,122,255,0.15)', border: '1px solid rgba(0,122,255,0.35)', color: downloading ? t.textMuted : 'var(--ios-blue)', fontWeight: 600 }}>
              {downloading
                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />{s.downloadingPdf}</>
                : <><Download size={13} />{s.downloadPdf}</>}
            </button>
            <a href={forwardHref} style={{ ...btn }}><Send size={13} />{s.forward}</a>
            <button onClick={() => window.print()} style={{ ...btn }}><Printer size={13} />{s.print}</button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      {(hasCoverLetter || docs.length > 0) && (
        <div id="shared-tabs" style={{ background: t.tabsBg, borderBottom: `1px solid ${t.tabsBorder}`, padding: `0 ${isMobile ? 16 : 32}px`, transition: 'background 0.2s' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex' }}>
            {hasCoverLetter && (
              <button style={tabBtn(tab === 'cl')} onClick={() => setTab('cl')}>
                <Mail size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />{s.coverLetterTab}
              </button>
            )}
            <button style={tabBtn(tab === 'cv')} onClick={() => setTab('cv')}>
              <FileText size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />{s.cvTab}
            </button>
            {docs.length > 0 && (
              <button style={tabBtn(tab === 'docs')} onClick={() => setTab('docs')}>
                <Paperclip size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />{s.attachmentsTab} ({docs.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div id="shared-content" style={{ padding: isMobile ? '24px 12px' : '32px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {tab === 'cl' && hasCoverLetter && (
            <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: t.shadow }}>
              <CoverLetterView resume={resume} lang={lang} />
            </div>
          )}
          {tab === 'cv' && (
            <div ref={resumeRef} style={{ borderRadius: 12, overflow: 'hidden', boxShadow: t.shadow }}>
              <ResumePreview resume={resume} />
            </div>
          )}
          {tab === 'docs' && docs.length > 0 && (
            <div>{docs.map(doc => <DocCard key={doc.id} doc={doc} light={light} lang={lang} />)}</div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer id="shared-footer" style={{ padding: '12px 32px', borderTop: `1px solid ${t.footerBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 12, color: t.footerText }}>
        <span>{s.footerCreated}</span>
        <span>·</span>
        <a href="/" style={{ color: light ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
          {s.footerCta}
        </a>
      </footer>

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media print {
          #shared-nav,
          #shared-header,
          #shared-tabs,
          #shared-footer { display: none !important; }

          body, html { background: #fff !important; }

          #shared-content {
            padding: 0 !important;
            margin: 0 !important;
          }
          #shared-content > div {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #shared-content > div > div {
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
