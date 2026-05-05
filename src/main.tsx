import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import ThemePreviewToggle from './components/ui/ThemePreviewToggle'
import { logError } from './lib/errorLog'

// Uncaught Promise-Rejections + globale window-Errors mitloggen, damit wir auch
// Faelle sehen, die nicht in einem ErrorBoundary landen (z. B. async Handler).
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e) => {
    void logError('Unhandled promise rejection', e.reason);
  });
  window.addEventListener('error', (e) => {
    void logError('Unhandled window error', e.error ?? e.message);
  });

  // Theme-Preview (temporaer, fuer Design-Vergleich):
  // ?theme=calm in der URL oder localStorage 'path-theme' = 'calm'
  // setzt body.theme-calm. Default ist Glass.
  const params = new URLSearchParams(window.location.search);
  const urlTheme = params.get('theme');
  const stored = localStorage.getItem('path-theme');
  const theme = urlTheme ?? stored ?? 'glass';
  if (theme === 'calm') document.body.classList.add('theme-calm');
  if (urlTheme) localStorage.setItem('path-theme', urlTheme);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <ThemePreviewToggle />
    </ErrorBoundary>
  </StrictMode>,
)
