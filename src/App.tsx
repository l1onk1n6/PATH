import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Preview from './pages/Preview';

export default function App() {
  return (
    <HashRouter>
      <div style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        padding: 12,
        gap: 12,
      }}>
        {/* Sidebar */}
        <div
          className="glass"
          style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', flexShrink: 0 }}
        >
          <Sidebar />
        </div>

        {/* Main content */}
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
    </HashRouter>
  );
}
