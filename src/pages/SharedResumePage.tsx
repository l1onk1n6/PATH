import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Resume } from '../types/resume';
import { fetchSharedResume } from '../lib/db';
import { buildMappePdfBytes } from '../lib/pdfRenderer';

export default function SharedResumePage() {
  const [params] = useSearchParams();
  const token = params.get('t');
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState(false);
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); setNotFound(true); return; }
    fetchSharedResume(token).then((r) => {
      if (r) setResume(r);
      else setNotFound(true);
      setLoading(false);
    });
  }, [token]);

  // Ganze Mappe (Anschreiben + CV + Anlagen) als PDF rendern
  useEffect(() => {
    if (!resume) return;
    let cancelled = false;
    setBuilding(true);
    setBuildError(false);
    (async () => {
      try {
        const bytes = await buildMappePdfBytes(resume);
        if (cancelled) return;
        const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = url;
        setPdfUrl(url);
      } catch (err) {
        console.error('Shared preview build failed:', err);
        if (!cancelled) setBuildError(true);
      } finally {
        if (!cancelled) setBuilding(false);
      }
    })();
    return () => { cancelled = true; };
  }, [resume]);

  useEffect(() => () => {
    if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current);
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--ios-blue)' }} />
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Bewerbungsmappe wird geladen…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !resume) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24, textAlign: 'center' }}>
        <AlertCircle size={40} style={{ opacity: 0.4 }} />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Bewerbungsmappe nicht gefunden</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, maxWidth: 320 }}>
          Dieser Link ist ungültig oder wurde deaktiviert.
        </p>
      </div>
    );
  }

  const { firstName, lastName } = resume.personalInfo;
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'Bewerbung';

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#333' }}>
      {/* Kein Header / Footer — HR soll die Mappe im Vollbild sehen, ohne Ablenkung */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {building && !pdfUrl && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(255,255,255,0.5)' }}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Mappe wird aufgebaut…</span>
          </div>
        )}
        {buildError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
            <div style={{ maxWidth: 360, color: 'rgba(255,255,255,0.85)' }}>
              <AlertCircle size={28} style={{ opacity: 0.7, marginBottom: 10 }} />
              <p style={{ fontSize: 13, lineHeight: 1.5 }}>
                Die Mappe konnte nicht gerendert werden. Bitte lade die Seite neu.
              </p>
            </div>
          </div>
        )}
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            title={`${name} — Bewerbungsmappe`}
            style={{ width: '100%', height: '100%', border: 'none', background: '#555' }}
          />
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
