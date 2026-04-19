import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Loader2, Cloud, Loader, ShieldAlert } from 'lucide-react';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import { useAuthStore } from './store/authStore';
import { useResumeStore } from './store/resumeStore';
import { useTrackerStore } from './store/trackerStore';
import { isSupabaseConfigured, getSupabase } from './lib/supabase';
import { useIsMobile } from './hooks/useBreakpoint';
import OnboardingModal, { isOnboardingDone } from './components/ui/OnboardingModal';
import { ToastContainer } from './components/ui/Toast';
import { OfflineBanner } from './components/ui/OfflineBanner';

// Lazy-loaded pages — each page is split into its own JS chunk
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const Editor           = lazy(() => import('./pages/Editor'));
const Preview          = lazy(() => import('./pages/Preview'));
const AuthPage         = lazy(() => import('./pages/AuthPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const SharedResumePage = lazy(() => import('./pages/SharedResumePage'));
const ScreenshotPage   = lazy(() => import('./pages/ScreenshotPage'));
const AccountPage      = lazy(() => import('./pages/AccountPage'));
const Tracker          = lazy(() => import('./pages/Tracker'));
const NotFoundPage     = lazy(() => import('./pages/NotFoundPage'));

function PageSpinner() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--ios-blue)' }} />
    </div>
  );
}


function AppShell() {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingDone());
  const { savePending, syncing, flushSaves } = useResumeStore();
  const { signOut } = useAuthStore();
  const { countdown, stayLoggedIn } = useSessionTimeout(signOut);

  // Cmd+S / Ctrl+S → flush any pending auto-saves immediately
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        flushSaves();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flushSaves]);

  // Close drawer on resize to desktop
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  // Allow triggering onboarding from anywhere via custom event
  useEffect(() => {
    const handler = () => setShowOnboarding(true);
    window.addEventListener('start-onboarding', handler);
    return () => window.removeEventListener('start-onboarding', handler);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>

      {/* ── Mobile: backdrop ───────────────────────────────── */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* ── Mobile: slide-in drawer ────────────────────────── */}
      {isMobile && (
        <div style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.32s cubic-bezier(0.34, 1.2, 0.64, 1)',
          willChange: 'transform',
        }}>
          <div
            className="glass"
            style={{ height: '100%', borderRadius: '0 var(--radius-xl) var(--radius-xl) 0', overflow: 'hidden' }}
          >
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main area ──────────────────────────────────────── */}
      <div role="main" style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        padding: isMobile ? '8px 8px 0' : '12px 12px 0',
        gap: 12,
      }}>
        {/* Desktop sidebar (always visible, collapsible) */}
        {!isMobile && (
          <div
            className="glass"
            style={{
              borderRadius: 'var(--radius-xl)', overflow: 'hidden', flexShrink: 0,
              width: sidebarCollapsed ? 60 : 'clamp(240px, 16vw, 320px)',
              transition: 'width 0.28s cubic-bezier(0.34, 1.2, 0.64, 1)',
            }}
          >
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(v => !v)}
            />
          </div>
        )}

        {/* Content column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <Header
            isMobile={isMobile}
            onMenuToggle={() => setDrawerOpen(v => !v)}
          />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ErrorBoundary>
              <Suspense fallback={<PageSpinner />}>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/editor" element={<Editor />} />
                  <Route path="/preview" element={<Preview />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/tracker" element={<Tracker />} />
                  <Route path="/shared" element={<SharedResumePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* ── Offline banner ────────────────────────────────── */}
      <OfflineBanner />

      {/* ── Global toasts ─────────────────────────────────── */}
      <ToastContainer />

      {/* ── Onboarding ────────────────────────────────────── */}
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}

      {/* ── Session timeout warning ───────────────────────── */}
      {countdown !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 360, padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,149,0,0.15)', border: '1px solid rgba(255,149,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ShieldAlert size={22} style={{ color: '#FF9500' }} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>Sitzung läuft ab</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Du wirst in <strong style={{ color: '#FF9500' }}>{countdown} Sekunden</strong> automatisch abgemeldet.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-glass btn-primary"
                onClick={stayLoggedIn}
                style={{ flex: 1, justifyContent: 'center', padding: '11px 16px', fontWeight: 600 }}
              >
                Angemeldet bleiben
              </button>
              <button
                className="btn-glass btn-danger"
                onClick={signOut}
                style={{ padding: '11px 16px' }}
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────── */}
      <footer style={{
        padding: isMobile ? '4px 14px' : '6px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
        color: 'rgba(255,255,255,0.2)',
        flexShrink: 0,
        userSelect: 'none',
      }}>
        <span>by pixmatic · v{__APP_VERSION__}</span>
        {(savePending || syncing) ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.35)' }}>
            <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} />
            Speichert…
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Cloud size={11} />
            Gespeichert
          </span>
        )}
      </footer>
    </div>
  );
}

// Detect auth type from URL params (set by Supabase email links)
function getAuthTypeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
  const type = params.get('type') || hash.get('type');
  const hasToken = params.get('token_hash') || params.get('code') || hash.get('access_token');
  if (!hasToken && !type) return null;
  if (type === 'signup') return 'signup' as const;
  if (type === 'magiclink') return 'magiclink' as const;
  if (type === 'recovery') return 'recovery' as const;
  if (type === 'invite') return 'invite' as const;
  if (hasToken) return 'unknown' as const;
  return null;
}

export default function App() {
  const { user, loading, initialize, passwordRecovery } = useAuthStore();
  const { syncFromCloud } = useResumeStore();
  const { syncFromCloud: syncTrackerFromCloud } = useTrackerStore();
  const [authType] = useState(() => getAuthTypeFromUrl());
  // Track if the initial auth check has completed at least once.
  // We must NOT show the global spinner for subsequent loading states
  // (e.g. signIn/signUp), otherwise the LandingPage unmounts and loses
  // the open-modal state, dropping the user back to the landing page
  // after a failed login attempt.
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!loading) setInitialized(true);
  }, [loading]);

  // Public shared CV route — accessible without login
  const isSharedRoute = window.location.hash.startsWith('#/shared');

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user && !passwordRecovery) {
      syncFromCloud();
      syncTrackerFromCloud();
    }
  }, [user, passwordRecovery, syncFromCloud, syncTrackerFromCloud]);

  // Always redirect to dashboard on fresh login (not on page-refresh with active session)
  const wasLoggedOut = useRef(false);
  useEffect(() => {
    if (!loading && !user && !passwordRecovery) {
      wasLoggedOut.current = true;
    }
    if (!loading && user && !passwordRecovery && wasLoggedOut.current) {
      wasLoggedOut.current = false;
      if (window.location.hash !== '#/') {
        window.location.hash = '/';
      }
    }
  }, [user, loading, passwordRecovery]);

  // Capture referral code from URL before auth resolves
  useEffect(() => {
    const hash = window.location.hash;
    const q = hash.includes('?') ? hash.slice(hash.indexOf('?')) : '';
    const ref = new URLSearchParams(q).get('ref');
    if (ref && ref.length >= 32 && !localStorage.getItem('path_ref')) {
      localStorage.setItem('path_ref', ref);
    }
  }, []);

  // Process pending referral after login/signup
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return;
    const ref = localStorage.getItem('path_ref');
    if (!ref) return;
    localStorage.removeItem('path_ref');
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      if (session) {
        getSupabase().functions.invoke('record-referral', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { referrer_id: ref },
        }).catch(() => {});
      }
    });
  }, [user]);

  const isScreenshotRoute = window.location.hash.startsWith('#/screenshot');
  if (isSharedRoute || isScreenshotRoute) {
    return (
      <ErrorBoundary>
        <HashRouter>
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              <Route path="/shared"     element={<SharedResumePage />} />
              <Route path="/screenshot" element={<ScreenshotPage />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </ErrorBoundary>
    );
  }

  // App-preview: bypass auth, render full shell with pre-seeded localStorage data
  // Detected via ?preview=1 so HashRouter sees no hash → routes to / (Dashboard)
  const isAppPreview = new URLSearchParams(window.location.search).get('preview') === '1';
  if (isAppPreview) {
    return (
      <ErrorBoundary>
        <HashRouter>
          <AppShell />
        </HashRouter>
      </ErrorBoundary>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24, textAlign: 'center' }}>
        <span style={{ fontSize: 32 }}>⚙️</span>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, maxWidth: 320 }}>
          App nicht konfiguriert.<br />Bitte VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY als GitHub Secrets setzen.
        </p>
      </div>
    );
  }

  if (!initialized && loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--ios-blue)' }} />
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Verbinde…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Show callback landing page while processing email link tokens
  if (authType && (loading || !user || passwordRecovery)) {
    return (
      <ErrorBoundary>
        <HashRouter>
          <Suspense fallback={<PageSpinner />}>
            <AuthCallbackPage authType={authType} />
          </Suspense>
        </HashRouter>
      </ErrorBoundary>
    );
  }

  // Show reset form after PASSWORD_RECOVERY event
  if (passwordRecovery) {
    return (
      <ErrorBoundary>
        <HashRouter>
          <Suspense fallback={<PageSpinner />}>
            <AuthPage />
          </Suspense>
        </HashRouter>
      </ErrorBoundary>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <HashRouter>
          <Suspense fallback={<PageSpinner />}>
            <AuthPage />
          </Suspense>
        </HashRouter>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <AppShell />
      </HashRouter>
    </ErrorBoundary>
  );
}
