import { useEffect, useRef, useState, useCallback } from 'react';

const INACTIVE_MS  = 30 * 60 * 1000; // 30 min → show warning
const COUNTDOWN_S  = 60;              // 60 s countdown before auto-logout

export function useSessionTimeout(onSignOut: () => void) {
  const [countdown, setCountdown] = useState<number | null>(null); // null = warning hidden
  const inactiveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef     = useRef(COUNTDOWN_S);
  const countdownActive  = useRef(false); // ref-based flag so resetTimer stays stable

  const clearAll = useCallback(() => {
    if (inactiveTimer.current)  clearTimeout(inactiveTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  }, []);

  const startCountdown = useCallback(() => {
    countdownActive.current = true;
    countdownRef.current = COUNTDOWN_S;
    setCountdown(COUNTDOWN_S);
    countdownTimer.current = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        countdownActive.current = false;
        clearAll();
        onSignOut();
      }
    }, 1_000);
  }, [clearAll, onSignOut]);

  const resetTimer = useCallback(() => {
    // Use ref (not state) so this callback stays stable across countdown ticks
    if (countdownActive.current) return;
    clearAll();
    inactiveTimer.current = setTimeout(startCountdown, INACTIVE_MS);
  }, [clearAll, startCountdown]);

  // User chose to stay — dismiss warning and restart idle timer
  const stayLoggedIn = useCallback(() => {
    countdownActive.current = false;
    clearAll();
    setCountdown(null);
    inactiveTimer.current = setTimeout(startCountdown, INACTIVE_MS);
  }, [clearAll, startCountdown]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // start on mount
    return () => {
      clearAll();
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [resetTimer, clearAll]);

  return { countdown, stayLoggedIn };
}
