import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { logError } from './lib/errorLog'
import { initTheme } from './lib/theme'
import { initI18n } from './lib/i18n'

// Uncaught Promise-Rejections + globale window-Errors mitloggen, damit wir auch
// Faelle sehen, die nicht in einem ErrorBoundary landen (z. B. async Handler).
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e) => {
    void logError('Unhandled promise rejection', e.reason);
  });
  window.addEventListener('error', (e) => {
    void logError('Unhandled window error', e.error ?? e.message);
  });

  // Theme (Dark/Light/System) anwenden bevor React rendert,
  // damit kein Flash von falschem Theme entsteht.
  initTheme();

  // i18n: <html lang="..."> setzen (passend zur gespeicherten Locale).
  initI18n();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
