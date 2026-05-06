/** Theme-Verwaltung: 'dark' | 'light' | 'system'. Persistiert in localStorage. */

export type Theme = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'path-theme';

export function getStoredTheme(): Theme {
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === 'dark' || v === 'light' || v === 'system') return v;
  return 'system';
}

export function setStoredTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function resolveTheme(theme: Theme): 'dark' | 'light' {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  document.body.classList.toggle('theme-light', resolved === 'light');
}

/** Beim App-Start einmal aufrufen — liest Storage, applied das Theme,
 *  und horcht auf System-Aenderungen wenn 'system'. */
export function initTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);

  // Wenn 'system' gewaehlt: bei prefers-color-scheme-Aenderungen nachziehen
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const onChange = () => {
    if (getStoredTheme() === 'system') applyTheme('system');
  };
  mq.addEventListener?.('change', onChange);
}
