import { useEffect, useRef, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

const INACTIVE_MS  = 30 * 60 * 1000; // 30 min → show warning
const COUNTDOWN_S  = 60;              // 60 s countdown before auto-logout

export function useSessionTimeout(onSignOut: () => void) {
  const [countdown, setCountdown] = useState<number | null>(null); // null = inactive warning hidden
  const inactiveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef   = useRef(COUNTDOWN_S);
  // Auf der nativen App kein automatischer Logout — der User kennt sein Geraet
  // und die Biometrie/PIN des Systems schuetzt den App-Zugriff. Timer hier
  // waeren eher stoerend als hilfreich.
  const disabled = Capacitor.isNativePlatform();

  const clearAll = useCallback(() => {
    if (inactiveTimer.current)  clearTimeout(inactiveTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  }, []);

  const startCountdown = useCallback(() => {
    countdownRef.current = COUNTDOWN_S;
    setCountdown(COUNTDOWN_S);
    countdownTimer.current = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        clearAll();
        onSignOut();
      }
    }, 1_000);
  }, [clearAll, onSignOut]);

  const resetTimer = useCallback(() => {
    // If countdown is already running, don't reset — user must click "Bleib angemeldet"
    if (countdown !== null) return;
    clearAll();
    inactiveTimer.current = setTimeout(startCountdown, INACTIVE_MS);
  }, [clearAll, startCountdown, countdown]);

  // User chose to stay — dismiss warning and restart idle timer
  const stayLoggedIn = useCallback(() => {
    clearAll();
    setCountdown(null);
    inactiveTimer.current = setTimeout(startCountdown, INACTIVE_MS);
  }, [clearAll, startCountdown]);

  useEffect(() => {
    if (disabled) return;
    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // start on mount
    return () => {
      clearAll();
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [resetTimer, clearAll, disabled]);

  return { countdown: disabled ? null : countdown, stayLoggedIn };
}
