import { useEffect, useRef, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

const INACTIVE_MS  = 30 * 60 * 1000; // 30 min → show warning
const COUNTDOWN_S  = 60;              // 60 s countdown before auto-logout

export function useSessionTimeout(onSignOut: () => void) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const inactiveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef   = useRef(COUNTDOWN_S);
  // Wichtig: "Warnung aktiv?" als Ref, nicht aus State ableiten. Sonst wuerde
  // jede Sekunde (Countdown-Tick) den useCallback neu bauen, der useEffect
  // deswegen neu mounten, und der Cleanup den Countdown-Interval toeten
  // bevor er 0 erreicht → auto-logout feuerte nie.
  const warningActiveRef = useRef(false);
  // Auf der nativen App kein automatischer Logout — der User kennt sein Geraet
  // und die Biometrie/PIN des Systems schuetzt den App-Zugriff.
  const disabled = Capacitor.isNativePlatform();

  const clearAll = useCallback(() => {
    if (inactiveTimer.current)  clearTimeout(inactiveTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  }, []);

  const startCountdown = useCallback(() => {
    warningActiveRef.current = true;
    countdownRef.current = COUNTDOWN_S;
    setCountdown(COUNTDOWN_S);
    countdownTimer.current = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        clearAll();
        warningActiveRef.current = false;
        onSignOut();
      }
    }, 1_000);
  }, [clearAll, onSignOut]);

  const resetTimer = useCallback(() => {
    // Solange die Warnung sichtbar ist, muss der User sie bewusst mit
    // "Angemeldet bleiben" wegklicken — Mausbewegung reicht nicht.
    if (warningActiveRef.current) return;
    clearAll();
    inactiveTimer.current = setTimeout(startCountdown, INACTIVE_MS);
  }, [clearAll, startCountdown]);

  const stayLoggedIn = useCallback(() => {
    clearAll();
    warningActiveRef.current = false;
    setCountdown(null);
    inactiveTimer.current = setTimeout(startCountdown, INACTIVE_MS);
  }, [clearAll, startCountdown]);

  useEffect(() => {
    if (disabled) return;
    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      clearAll();
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [resetTimer, clearAll, disabled]);

  return { countdown: disabled ? null : countdown, stayLoggedIn };
}
