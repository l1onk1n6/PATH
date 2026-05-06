import { useEffect } from 'react';

export interface Shortcut {
  /** Tasten-Kombi: 'd', '?', 'mod+b' (mod = Cmd auf Mac, Ctrl sonst). */
  combo: string;
  description: string;
  handler: () => void;
}

/**
 * Globaler Shortcut-Handler. Tasten werden ignoriert, sobald der Fokus
 * auf einem Eingabefeld liegt (INPUT, TEXTAREA, contenteditable) — ausser
 * bei Modifier-Combos (Cmd/Ctrl).
 *
 * Combos:
 *   'd'        → Buchstabe d (ohne Modifier)
 *   '?'        → Shift+/ (Browser liefert direkt '?')
 *   'mod+b'    → Cmd+b (Mac) oder Ctrl+b (Win/Linux)
 *   'mod+shift+p' → Cmd+Shift+P
 */
export function useGlobalShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    function isTypingTarget(el: EventTarget | null) {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (el.isContentEditable) return true;
      return false;
    }

    function comboMatches(combo: string, e: KeyboardEvent): boolean {
      const parts = combo.toLowerCase().split('+').map(s => s.trim());
      const wantMod = parts.includes('mod');
      const wantShift = parts.includes('shift');
      const wantAlt = parts.includes('alt');
      const key = parts[parts.length - 1];

      const hasMod = e.metaKey || e.ctrlKey;
      if (wantMod !== hasMod) return false;
      if (wantShift !== e.shiftKey) return false;
      if (wantAlt !== e.altKey) return false;

      return e.key.toLowerCase() === key;
    }

    function onKeyDown(e: KeyboardEvent) {
      const isModCombo = e.metaKey || e.ctrlKey;
      if (!isModCombo && isTypingTarget(e.target)) return;

      for (const sc of shortcuts) {
        if (comboMatches(sc.combo, e)) {
          e.preventDefault();
          sc.handler();
          return;
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcuts]);
}
