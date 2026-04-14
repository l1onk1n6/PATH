// ContactModal — public contact form for landing page visitors (no auth required)
// Submits to the contact-form-public Edge Function.
// Uses Cloudflare Turnstile for bot protection + honeypot field.

import { useEffect, useRef, useState } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SUPABASE_URL       = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'ratelimit';

interface Props {
  onClose: () => void;
}

export function ContactModal({ onClose }: Props) {
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status,  setStatus]  = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Turnstile
  const widgetRef    = useRef<HTMLDivElement>(null);
  const turnstileId  = useRef<string | null>(null);
  const [turnstileToken,   setTurnstileToken]   = useState('');
  const [turnstileReady,   setTurnstileReady]   = useState(!TURNSTILE_SITE_KEY);
  const [turnstileError,   setTurnstileError]   = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Load Turnstile script once
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    const existing = document.getElementById('cf-turnstile-script');
    const tryRender = () => {
      const w = (window as unknown as Record<string, unknown>).turnstile as {
        render?: (el: HTMLElement, opts: object) => string
      } | undefined;
      if (!w?.render || !widgetRef.current) return;
      if (turnstileId.current) return;
      turnstileId.current = w.render(widgetRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'dark',
        callback:          (t: string) => { setTurnstileToken(t); setTurnstileReady(true);  setTurnstileError(false); },
        'expired-callback':             () => { setTurnstileToken(''); setTurnstileReady(false); setTurnstileError(false); },
        'error-callback':               () => { setTurnstileToken(''); setTurnstileReady(false); setTurnstileError(true); },
      });
    };
    if (existing) { setTimeout(tryRender, 100); return; }
    const script = document.createElement('script');
    script.id  = 'cf-turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => setTimeout(tryRender, 100);
    document.head.appendChild(script);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetTurnstile() {
    const w = (window as unknown as Record<string, unknown>).turnstile as { reset?: (id: string) => void } | undefined;
    if (w?.reset && turnstileId.current) w.reset(turnstileId.current);
    setTurnstileToken('');
    setTurnstileReady(false);
    setTurnstileError(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending' || status === 'sent') return;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setStatus('error');
      setErrorMsg('Konfigurationsfehler. Bitte direkt an info@pixmatic.ch schreiben.');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/contact-form-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name:    name.trim(),
          email:   email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          token:   turnstileToken,
          _hp:     '',
        }),
      });

      const d = await res.json() as { ok?: boolean; error?: string };

      if (!res.ok || !d.ok) {
        setStatus(res.status === 429 ? 'ratelimit' : 'error');
        setErrorMsg(d.error ?? `Serverfehler (${res.status}). Bitte direkt an info@pixmatic.ch schreiben.`);
        resetTurnstile();
        return;
      }

      setStatus('sent');
    } catch (err) {
      setStatus('error');
      const detail = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Netzwerkfehler: ${detail}`);
      resetTurnstile();
    }
  }

  const canSubmit = status !== 'sending' && status !== 'sent' && turnstileReady && name.trim() && email.trim() && message.trim();

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '36px 32px',
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 40px 120px rgba(0,0,0,0.8)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.06)',
            border: 'none', borderRadius: 8, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
            Kontakt
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
            Wir melden uns in der Regel innerhalb von 24 Stunden.
          </p>
        </div>

        {status === 'sent' ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle size={48} color="#34C759" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 17, fontWeight: 600, color: '#fff', margin: '0 0 8px' }}>
              Nachricht gesendet!
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 28px' }}>
              Du erhältst in Kürze eine Bestätigung per E-Mail.
            </p>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '10px 24px', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Schliessen
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* Honeypot — hidden from humans */}
            <input
              type="text"
              name="_hp"
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
              autoComplete="off"
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Max Muster"
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  E-Mail *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="max@beispiel.ch"
                  style={inputStyle}
                />
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Betreff
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Worum geht es?"
                  style={inputStyle}
                />
              </div>

              {/* Message */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Nachricht *
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Deine Nachricht an uns..."
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                />
              </div>

              {/* Turnstile */}
              {TURNSTILE_SITE_KEY ? (
                <div>
                  <div ref={widgetRef} style={{ display: turnstileError ? 'none' : undefined }} />
                  {turnstileError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,59,48,0.9)', flex: 1 }}>
                        Sicherheitsprüfung fehlgeschlagen.
                      </span>
                      <button
                        type="button"
                        onClick={resetTurnstile}
                        style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,59,48,0.35)', background: 'rgba(255,59,48,0.1)', color: 'rgb(255,59,48)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Neu versuchen
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'rgba(255,159,10,0.8)', padding: '8px 12px', background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.2)', borderRadius: 8 }}>
                  ⚠️ VITE_TURNSTILE_SITE_KEY nicht gesetzt — Turnstile inaktiv (dev-Modus)
                </div>
              )}

              {/* Error / ratelimit */}
              {(status === 'error' || status === 'ratelimit') && errorMsg && (
                <div style={{ padding: '12px 14px', background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 8, fontSize: 13, color: 'rgba(255,59,48,0.9)' }}>
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: canSubmit ? '#34C759' : 'rgba(52,199,89,0.25)',
                  color: canSubmit ? '#000' : 'rgba(0,0,0,0.4)',
                  border: 'none', borderRadius: 12,
                  padding: '14px 24px',
                  fontSize: 15, fontWeight: 700,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s, opacity 0.2s',
                  marginTop: 4,
                }}
              >
                {status === 'sending' ? (
                  <>Wird gesendet…</>
                ) : (
                  <><Send size={15} /> Nachricht senden</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '11px 14px',
  fontSize: 14,
  color: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};
