import { useState, useEffect, useRef } from 'react';
import { LogoIcon } from '../components/layout/Logo';
import AuthPage from './AuthPage';
import { useIsMobile } from '../hooks/useBreakpoint';
import {
  FileText, Sparkles, Globe, Clock, Share2, Download,
  Check, ChevronRight, ArrowRight, Star,
} from 'lucide-react';

const FEATURES = [
  {
    icon: FileText,
    color: '#007AFF',
    title: '15+ professionelle Vorlagen',
    desc: 'Von klassisch bis modern – für jede Branche und jeden Stil. Pixelgenaue PDFs direkt aus dem Browser.',
  },
  {
    icon: Sparkles,
    color: '#AF52DE',
    title: 'KI-Assistent',
    desc: 'Anschreiben generieren, Texte verbessern und optimieren – powered by Claude AI.',
  },
  {
    icon: Download,
    color: '#34C759',
    title: 'PDF-Export',
    desc: 'Ein Klick, fertig. Druckfertige PDFs in Sekunden – perfekt für Online-Bewerbungen.',
  },
  {
    icon: Globe,
    color: '#FF9F0A',
    title: 'Mehrsprachig',
    desc: 'Automatische Übersetzung deines Lebenslaufs in jede Sprache für internationale Stellen.',
  },
  {
    icon: Clock,
    color: '#5AC8FA',
    title: 'Versionshistorie',
    desc: 'Speichere Versionen deines CVs und stelle frühere Stände jederzeit wieder her.',
  },
  {
    icon: Share2,
    color: '#FF2D55',
    title: 'Online teilen',
    desc: 'Erstelle einen öffentlichen Link zu deinem Lebenslauf – ideal für digitale Bewerbungen.',
  },
];

const STEPS = [
  { num: '1', title: 'Konto erstellen', desc: 'Kostenlos registrieren, keine Kreditkarte nötig.' },
  { num: '2', title: 'Vorlage wählen', desc: 'Passende Vorlage für deine Branche und deinen Stil aussuchen.' },
  { num: '3', title: 'Daten eintragen', desc: 'Lebenslauf ausfüllen, Anschreiben per KI generieren.' },
  { num: '4', title: 'PDF herunterladen', desc: 'Mit einem Klick als druckfertiges PDF exportieren.' },
];

const FREE_FEATURES = [
  '1 Person, 10 Mappen',
  '6 Templates',
  '5 PDF-Exporte / Monat',
  '1 Share-Link',
  'Basis-Editor',
];

const PRO_FEATURES = [
  '5 Personen, 60 Mappen',
  'Alle 15+ Templates',
  '20 PDF-Exporte / Monat',
  '10 Share-Links',
  'KI-Assistent (Claude AI)',
  'Versionshistorie',
  'Automatische Übersetzung',
  'Eigene Sektionen',
  'Deadline-Reminder',
  'Priority Support',
];

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  // Allow page to scroll (body has overflow:hidden normally)
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 40);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  if (showAuth) return <AuthPage />;

  return (
    <div
      ref={containerRef}
      style={{
        height: '100dvh',
        overflowY: 'auto',
        overflowX: 'hidden',
        fontFamily: 'var(--font-sf)',
        color: '#fff',
        scrollBehavior: 'smooth',
      }}
    >
      {/* ── Sticky Nav ──────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '14px 20px' : '16px 48px',
        background: scrolled ? 'rgba(8,15,30,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        transition: 'background 0.3s, border-color 0.3s, backdrop-filter 0.3s',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>
          <LogoIcon size={30} />
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px' }}>PATH</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: 'rgba(0,122,255,0.2)', border: '1px solid rgba(0,122,255,0.35)', color: 'var(--ios-blue)', marginLeft: 2 }}>by pixmatic</span>
        </div>

        {/* Nav links – desktop only */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 32, fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
            {[['features', 'Features'], ['how', 'So funktioniert\'s'], ['pricing', 'Preise']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit', padding: 0, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Auth buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => setShowAuth(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.65)', fontSize: 14, padding: '8px 14px',
            borderRadius: 10, transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}>
            Anmelden
          </button>
          <button onClick={() => setShowAuth(true)} style={{
            background: 'rgba(0,122,255,0.9)', border: 'none', cursor: 'pointer',
            color: '#fff', fontSize: 14, fontWeight: 600,
            padding: '9px 18px', borderRadius: 10,
            transition: 'background 0.2s, transform 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#007AFF'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,122,255,0.9)'; e.currentTarget.style.transform = 'none'; }}>
            Kostenlos starten
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section style={{
        minHeight: '92vh',
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '60px 24px 80px' : '80px 48px 100px',
        maxWidth: 1200, margin: '0 auto',
        gap: isMobile ? 48 : 64,
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        {/* Left: text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 99,
            background: 'rgba(175,82,222,0.15)', border: '1px solid rgba(175,82,222,0.3)',
            color: '#CF9FFF', marginBottom: 28, letterSpacing: '0.04em',
          }}>
            <Sparkles size={11} /> KI-gestützte Bewerbungsmappe
          </div>

          <h1 style={{
            margin: '0 0 24px',
            fontSize: isMobile ? 40 : 58,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-1.5px',
          }}>
            Dein Lebenslauf.{' '}
            <span style={{
              background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 50%, #34C759 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Professionell.
            </span>
            <br />In Minuten.
          </h1>

          <p style={{
            margin: '0 0 36px',
            fontSize: isMobile ? 16 : 18,
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.65,
            maxWidth: 480,
          }}>
            PATH hilft dir, überzeugende Bewerbungsunterlagen zu erstellen —
            mit modernen Vorlagen, KI-Unterstützung und PDF-Export mit einem Klick.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setShowAuth(true)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #007AFF, #5856D6)',
              border: 'none', borderRadius: 14, cursor: 'pointer',
              color: '#fff', fontSize: 16, fontWeight: 700,
              padding: '14px 28px',
              boxShadow: '0 8px 30px rgba(0,122,255,0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,122,255,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,122,255,0.35)'; }}>
              Kostenlos starten <ArrowRight size={16} />
            </button>
            <button onClick={() => scrollTo('pricing')} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 14, cursor: 'pointer',
              color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: 500,
              padding: '14px 28px',
              transition: 'background 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; }}>
              Preise ansehen
            </button>
          </div>

          <div style={{ display: 'flex', gap: 20, marginTop: 28, flexWrap: 'wrap' }}>
            {['Kostenlos starten', 'Keine Kreditkarte nötig', 'DSGVO-konform'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                <Check size={13} style={{ color: '#34C759', flexShrink: 0 }} /> {t}
              </div>
            ))}
          </div>
        </div>

        {/* Right: mock UI */}
        {!isMobile && <MockAppPreview />}
      </section>

      {/* ── Stats bar ───────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.03)',
        padding: '28px 48px',
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24,
        }}>
          {[
            ['15+', 'Professionelle Vorlagen'],
            ['1-Klick', 'PDF-Export'],
            ['100%', 'DSGVO-konform'],
            ['CHF 0', 'Kostenlos starten'],
          ].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>{val}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────── */}
      <section id="features" style={{ padding: isMobile ? '80px 24px' : '100px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: isMobile ? 30 : 42, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.8px' }}>
            Alles was du brauchst
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', margin: 0, maxWidth: 520, marginInline: 'auto', lineHeight: 1.6 }}>
            Von der ersten Idee bis zum fertigen PDF — PATH begleitet dich durch den gesamten Bewerbungsprozess.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 20,
        }}>
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: 28,
              transition: 'background 0.2s, border-color 0.2s, transform 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, marginBottom: 18,
                background: `${color}22`, border: `1px solid ${color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} style={{ color }} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 10px' }}>{title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how" style={{
        padding: isMobile ? '80px 24px' : '100px 48px',
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: isMobile ? 30 : 42, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.8px' }}>
              In 4 Schritten zur Bewerbung
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
              Einfach und schnell — ohne komplizierte Software.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: 24, position: 'relative',
          }}>
            {STEPS.map(({ num, title, desc }, i) => (
              <div key={num} style={{ textAlign: 'center', position: 'relative' }}>
                {/* Connector line */}
                {!isMobile && i < STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute', top: 22, left: '62%', width: '76%',
                    height: 1, background: 'linear-gradient(90deg, rgba(0,122,255,0.4), rgba(0,122,255,0.1))',
                    zIndex: 0,
                  }} />
                )}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', margin: '0 auto 20px',
                  background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 800, position: 'relative', zIndex: 1,
                  boxShadow: '0 4px 20px rgba(0,122,255,0.3)',
                }}>
                  {num}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: isMobile ? '80px 24px' : '100px 48px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: isMobile ? 30 : 42, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.8px' }}>
            Transparent & fair
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
            Kostenlos starten, bei Bedarf upgraden. Jederzeit kündbar.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 24, alignItems: 'start',
        }}>
          {/* Free */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24, padding: 36,
          }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: '0.06em' }}>KOSTENLOS</div>
              <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-1px' }}>CHF 0</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Für immer kostenlos</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {FREE_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                  <Check size={15} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setShowAuth(true)} style={{
              width: '100%', padding: '13px 20px', borderRadius: 12,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
              Kostenlos starten
            </button>
          </div>

          {/* Pro */}
          <div style={{
            background: 'linear-gradient(160deg, rgba(0,122,255,0.12) 0%, rgba(88,86,214,0.1) 100%)',
            border: '1px solid rgba(0,122,255,0.35)',
            borderRadius: 24, padding: 36, position: 'relative', overflow: 'hidden',
          }}>
            {/* Glow */}
            <div style={{
              position: 'absolute', top: -60, right: -60,
              width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,122,255,0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{
              position: 'absolute', top: 20, right: 20,
              fontSize: 11, fontWeight: 700, padding: '4px 10px',
              borderRadius: 99, background: 'linear-gradient(135deg, #FF9F0A, #FF6B35)',
              color: '#fff', letterSpacing: '0.04em',
            }}>
              EMPFOHLEN
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Sparkles size={14} style={{ color: '#FF9F0A' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>PATH PRO</div>
              </div>
              <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-1px' }}>
                CHF 5
                <span style={{ fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.5)', letterSpacing: 0 }}> / Monat</span>
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Jederzeit kündbar</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 32 }}>
              {PRO_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                  <Check size={15} style={{ color: '#34C759', flexShrink: 0 }} />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setShowAuth(true)} style={{
              width: '100%', padding: '14px 20px', borderRadius: 12,
              background: 'linear-gradient(135deg, #007AFF, #5856D6)',
              border: 'none',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(0,122,255,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,122,255,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,122,255,0.3)'; }}>
              <Sparkles size={15} /> Jetzt PATH Pro holen
            </button>

            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              Sichere Zahlung via Stripe · Keine versteckten Kosten
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials / Trust ────────────────────────────── */}
      <section style={{
        padding: isMobile ? '60px 24px' : '80px 48px',
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 20 }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={18} style={{ color: '#FF9F0A', fill: '#FF9F0A' }} />)}
          </div>
          <blockquote style={{ fontSize: isMobile ? 20 : 26, fontWeight: 600, margin: '0 0 20px', lineHeight: 1.4, letterSpacing: '-0.3px' }}>
            "Endlich eine Bewerbungs-App die nicht aussieht wie aus den 90ern — und trotzdem in der Schweiz funktioniert."
          </blockquote>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Zufriedener Nutzer aus Zürich</div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────── */}
      <section style={{
        padding: isMobile ? '80px 24px' : '100px 48px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: isMobile ? 30 : 44, fontWeight: 800, margin: '0 0 20px', letterSpacing: '-1px', lineHeight: 1.1 }}>
            Bereit für deine{' '}
            <span style={{
              background: 'linear-gradient(135deg, #007AFF, #34C759)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Traumstelle?
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', margin: '0 0 36px', lineHeight: 1.6 }}>
            Erstelle in wenigen Minuten einen Lebenslauf, der überzeugt. Kostenlos, ohne Kreditkarte.
          </p>
          <button onClick={() => setShowAuth(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg, #007AFF, #5856D6)',
            border: 'none', borderRadius: 16, cursor: 'pointer',
            color: '#fff', fontSize: 18, fontWeight: 700,
            padding: '16px 36px',
            boxShadow: '0 8px 40px rgba(0,122,255,0.35)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 50px rgba(0,122,255,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,122,255,0.35)'; }}>
            Jetzt kostenlos starten <ChevronRight size={20} />
          </button>
          <div style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            Kein Abo nötig · Jederzeit kündbar · DSGVO-konform
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{
        padding: isMobile ? '36px 24px' : '48px 48px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoIcon size={24} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>PATH</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>by pixmatic</span>
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              ['https://pixmatic.ch/datenschutz', 'Datenschutz'],
              ['https://pixmatic.ch/agb', 'AGB'],
              ['mailto:info@pixmatic.ch', 'Kontakt'],
            ].map(([href, label]) => (
              <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
                {label}
              </a>
            ))}
          </div>

          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            © {new Date().getFullYear()} pixmatic. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-12px) rotate(-2deg); }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}

function MockAppPreview() {
  return (
    <div style={{ flex: '0 0 auto', width: 340, position: 'relative' }}>
      {/* Glow behind card */}
      <div style={{
        position: 'absolute', inset: -40,
        background: 'radial-gradient(ellipse at center, rgba(0,122,255,0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Main card */}
      <div style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 24,
        padding: 24,
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        animation: 'float 5s ease-in-out infinite',
        position: 'relative', zIndex: 1,
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #34C759, #00C7BE)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Max Mustermann</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Softwareentwickler</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 10, padding: '3px 8px', borderRadius: 99, background: 'rgba(0,122,255,0.2)', border: '1px solid rgba(0,122,255,0.3)', color: 'var(--ios-blue)' }}>
            Modern
          </div>
        </div>

        {/* Progress/sections */}
        {[
          { label: 'Persönliche Daten', pct: 100, color: '#34C759' },
          { label: 'Berufserfahrung', pct: 80, color: '#007AFF' },
          { label: 'Ausbildung', pct: 100, color: '#34C759' },
          { label: 'Fähigkeiten', pct: 60, color: '#FF9F0A' },
          { label: 'Anschreiben', pct: 45, color: '#AF52DE' },
        ].map(({ label, pct, color }) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5, color: 'rgba(255,255,255,0.6)' }}>
              <span>{label}</span>
              <span style={{ color }}>{pct}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, opacity: 0.8 }} />
            </div>
          </div>
        ))}

        {/* CTA in card */}
        <div style={{
          marginTop: 20, padding: '10px 14px', borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(0,122,255,0.25), rgba(88,86,214,0.2))',
          border: '1px solid rgba(0,122,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={13} style={{ color: '#007AFF' }} />
            <span>PDF exportieren</span>
          </div>
          <ArrowRight size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />
        </div>
      </div>

      {/* Floating badge */}
      <div style={{
        position: 'absolute', bottom: -16, right: -16,
        background: 'linear-gradient(135deg, rgba(255,159,10,0.3), rgba(255,55,95,0.25))',
        border: '1px solid rgba(255,159,10,0.4)',
        borderRadius: 14, padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 13, fontWeight: 600,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 2,
      }}>
        <Sparkles size={13} style={{ color: '#FF9F0A' }} />
        KI-Assistent aktiv
      </div>
    </div>
  );
}
