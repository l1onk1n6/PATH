import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Preview from './pages/Preview';
import AuthPage from './pages/AuthPage';
import SetupPage from './pages/SetupPage';
import { useAuthStore } from './store/authStore';
import { useResumeStore } from './store/resumeStore';
import { isSupabaseConfigured } from './lib/supabase';

function AppShell() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', padding: 12, gap: 12 }}>
      <div className="glass" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', flexShrink: 0 }}>
        <Sidebar />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/preview" element={<Preview />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading, initialize } = useAuthStore();
  const { syncFromCloud } = useResumeStore();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Wenn eingeloggt → Daten aus Cloud laden
  useEffect(() => {
    if (user) syncFromCloud();
  }, [user, syncFromCloud]);

  // Supabase nicht konfiguriert → Setup-Seite
  if (!isSupabaseConfigured() || showSetup) {
    return <HashRouter><SetupPage /></HashRouter>;
  }

  // Lädt Auth-Status
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--ios-blue)' }} />
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Verbinde…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Nicht eingeloggt → Login/Register
  if (!user) {
    return <HashRouter><AuthPage onSetup={() => setShowSetup(true)} /></HashRouter>;
  }

  // Eingeloggt → App
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
