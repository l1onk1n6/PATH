import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Preview from './pages/Preview';
import AuthPage from './pages/AuthPage';
import { useAuthStore } from './store/authStore';
import { useResumeStore } from './store/resumeStore';
import { isSupabaseConfigured } from './lib/supabase';
import { useIsMobile } from './hooks/useBreakpoint';

const APP_VERSION = '1.3.0';

function AppShell() {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Close drawer on resize to desktop
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

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
      <div style={{
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
              width: sidebarCollapsed ? 60 : 240,
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
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/preview" element={<Preview />} />
            </Routes>
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer style={{
        padding: isMobile ? '4px 14px' : '6px 20px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        fontSize: 11,
        color: 'rgba(255,255,255,0.2)',
        flexShrink: 0,
        userSelect: 'none',
      }}>
        by pixmatic · v{APP_VERSION}
      </footer>
    </div>
  );
}

export default function App() {
  const { user, loading, initialize, passwordRecovery } = useAuthStore();
  const { syncFromCloud } = useResumeStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user) syncFromCloud();
  }, [user, syncFromCloud]);

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

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--ios-blue)' }} />
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Verbinde…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user || passwordRecovery) {
    return <HashRouter><AuthPage /></HashRouter>;
  }

  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
