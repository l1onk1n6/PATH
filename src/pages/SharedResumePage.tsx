import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Resume } from '../types/resume';
import { fetchSharedResume } from '../lib/db';
import ResumePreview from '../components/templates/ResumePreview';
import { LogoFull } from '../components/layout/Logo';

export default function SharedResumePage() {
  const [params] = useSearchParams();
  const token = params.get('t');
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); setNotFound(true); return; }
    fetchSharedResume(token).then((r) => {
      if (r) setResume(r);
      else setNotFound(true);
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--ios-blue)' }} />
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Lebenslauf wird geladen…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !resume) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24, textAlign: 'center' }}>
        <AlertCircle size={40} style={{ opacity: 0.4 }} />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Lebenslauf nicht gefunden</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, maxWidth: 320 }}>
          Dieser Link ist ungültig oder wurde deaktiviert.
        </p>
      </div>
    );
  }

  const { firstName, lastName, title } = resume.personalInfo;
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'Lebenslauf';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Shared header bar */}
      <div style={{
        padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(15,25,35,0.95)', backdropFilter: 'blur(20px)', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <LogoFull size={26} />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          {name}{title ? ` · ${title}` : ''} — Geteilter Lebenslauf
        </div>
        <a
          href="/"
          style={{
            fontSize: 12, padding: '6px 14px', borderRadius: 8,
            background: 'rgba(0,122,255,0.2)', border: '1px solid rgba(0,122,255,0.4)',
            color: 'var(--ios-blue)', textDecoration: 'none',
          }}
        >
          Eigenen erstellen
        </a>
      </div>

      {/* CV Preview */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 900 }}>
          <ResumePreview resume={resume} />
        </div>
      </div>

      <footer style={{ padding: '8px 20px', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
        Erstellt mit PATH by pixmatic
      </footer>
    </div>
  );
}
