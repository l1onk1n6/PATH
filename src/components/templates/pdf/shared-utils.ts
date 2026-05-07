import type { Skill } from '../../../types/resume';
import { tr } from '../../../lib/i18n';

// ─────────────────────────────────────────────────────────────
//  Formatierung
// ─────────────────────────────────────────────────────────────

/** Stellt einer URL ein https://-Praefix voran, falls keines existiert. */
export function ensureProtocol(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, '')}`;
}

/**
 * Verkuerzt eine URL fuer kompakte Anzeige (z. B. in einer Sidebar):
 * - strippt http(s)://www.
 * - strippt trailing slashes
 * Fuer linkedin.com/in/<user> bleibt der Username erhalten, das Schema-
 * Prefix entfaellt — so passt der Link auf eine Zeile.
 */
export function displayUrl(url: string): string {
  return url
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/\/+$/, '');
}

export function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export function dateRange(start: string, end: string, current?: boolean) {
  const s = formatDate(start);
  const e = current ? tr('heute') : formatDate(end);
  if (!s && !e) return '';
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

/** Alpha-Hex Helper: #RRGGBB + Alpha 0..1 → #RRGGBBAA */
export function alphaHex(hex: string, alpha: number) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

/** Relative Luminanz nach WCAG (0 = dunkel, 1 = hell). */
function luminance(hex: string): number {
  const h = hex.replace('#', '').slice(0, 6);
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const toLin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

/** Waehlt schwarz oder weiss fuer besten Kontrast auf dem gegebenen Hintergrund. */
export function readableOn(bgHex: string): string {
  return luminance(bgHex) > 0.5 ? '#1c1c1e' : '#ffffff';
}

/**
 * Standard-Muted-Farbe fuer Datums- und Meta-Text. #6e6e73 ergibt auf Weiss
 * ~5.4:1 Kontrast — WCAG AA (4.5:1) fuer normale Textgroessen erfuellt.
 */
export const MUTED_COLOR = '#6e6e73';
export const MUTED_DARK = '#4a4a4f';

export type HeadingStyle =
  | 'line'       // Text + duenne Akzentlinie rechts daneben (Minimal-Stil)
  | 'underline'  // Text ueber einer Akzentlinie
  | 'bar'        // Text links neben einer kurzen, dicken Akzent-Box
  | 'block';     // Text auf einer Akzent-Hintergrundleiste (fuer Sidebars)

export function parseBulletLines(text: string | undefined | null): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*[•\-*–·>]+\s*/, '').trim())
    .filter(line => line.length > 0);
}

/** Gruppiert Skills nach Kategorie; wenn alle in einer Standardkategorie
 *  liegen oder keine Kategorie gepflegt ist, liefert es [{category:'', skills:[...]}].
 */
export function groupSkillsByCategory(skills: Skill[]): Array<{ category: string; skills: Skill[] }> {
  const map = new Map<string, Skill[]>();
  for (const s of skills) {
    const key = (s.category ?? '').trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  if (map.size <= 1) return [{ category: '', skills }];
  return [...map.entries()].map(([category, skills]) => ({ category, skills }));
}
