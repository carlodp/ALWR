import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";

const IDLE_TIMEOUT = 2 * 60 * 1000; // 2 minutes of no activity
const LOGOUT_COUNTDOWN = 30 * 1000; // 30 seconds countdown before logout

export function useIdleTimeout() {
  const [, setLocation] = useLocation();
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const idleTimerRef = useRef<NodeJS.Timeout>();
  const countdownTimerRef = useRef<NodeJS.Timeout>();
  const activityTimeoutRef = useRef<NodeJS.Timeout>();

  const resetIdleTimer = useCallback(() => {
    // Clear existing timers
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);

    // Hide warning if it was showing
    setShowIdleWarning(false);
    setCountdownSeconds(0);

    // Set new idle timer
    idleTimerRef.current = setTimeout(() => {
      setShowIdleWarning(true);
      setCountdownSeconds(Math.floor(LOGOUT_COUNTDOWN / 1000));

      // Start countdown
      countdownTimerRef.current = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            // Clear auth and redirect to login with full page reload
            localStorage.removeItem("auth_token");
            sessionStorage.clear();
            window.location.href = "/login";
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT);
  }, [setLocation]);

  const handleUserActivity = useCallback(() => {
    // Debounce activity events
    if (activityTimeoutRef.current) return;

    activityTimeoutRef.current = setTimeout(() => {
      resetIdleTimer();
      activityTimeoutRef.current = undefined;
    }, 500);
  }, [resetIdleTimer]);

  useEffect(() => {
    // Reset timer on mount
    resetIdleTimer();

    // Listen for user activity
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity);
    });

    return () => {
      // Cleanup
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
    };
  }, [handleUserActivity, resetIdleTimer]);

  const handleStayActive = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  return {
    showIdleWarning,
    countdownSeconds,
    onStayActive: handleStayActive,
  };
}
