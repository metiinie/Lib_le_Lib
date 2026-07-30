import { useEffect, useRef } from 'react';

export function useInactivityLogout(
  onLogout: () => void,
  isAuthenticated: boolean,
  timeoutMs: number = 15 * 60 * 1000 // Default 15 minutes
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        console.warn('Session expired due to inactivity. Auto logging out staff member.');
        onLogout();
      }, timeoutMs);
    };

    // Initial timer setup
    resetTimer();

    // Event listeners to detect user presence
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleActivity = () => {
      resetTimer();
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
    };
  }, [isAuthenticated, onLogout, timeoutMs]);
}
