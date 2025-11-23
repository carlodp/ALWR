import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";

export function useIdleTimeout() {
  const [, setLocation] = useLocation();
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [idleTimeoutEnabled, setIdleTimeoutEnabled] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout>();
  const countdownTimerRef = useRef<NodeJS.Timeout>();
  const activityTimeoutRef = useRef<NodeJS.Timeout>();
  const configRef = useRef<{ idleTimeoutMs: number; countdownMs: number }>({
    idleTimeoutMs: 2 * 60 * 1000, // Default: 2 minutes
    countdownMs: 30 * 1000, // Default: 30 seconds
  });

  // Fetch system settings to check if idle timeout is enabled
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/settings/system");
        if (response.ok) {
          const settings = await response.json();
          setIdleTimeoutEnabled(settings.idleTimeoutEnabled === true);
          
          // Use backend settings if available
          if (settings.idleWarningMinutes && settings.idleCountdownMinutes) {
            configRef.current = {
              idleTimeoutMs: settings.idleWarningMinutes * 60 * 1000,
              countdownMs: settings.idleCountdownMinutes * 60 * 1000,
            };
          }
        }
      } catch (error) {
        console.error("Error fetching system settings:", error);
        // Default to enabled if fetch fails
        setIdleTimeoutEnabled(true);
      }
    };

    fetchSettings();
  }, []);

  const resetIdleTimer = useCallback(() => {
    // Don't set up timers if idle timeout is disabled
    if (!idleTimeoutEnabled) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      setShowIdleWarning(false);
      setCountdownSeconds(0);
      return;
    }

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
      setCountdownSeconds(Math.floor(configRef.current.countdownMs / 1000));

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
    }, configRef.current.idleTimeoutMs);
  }, [idleTimeoutEnabled]);

  const handleUserActivity = useCallback(() => {
    if (!idleTimeoutEnabled) return;

    // Debounce activity events
    if (activityTimeoutRef.current) return;

    activityTimeoutRef.current = setTimeout(() => {
      resetIdleTimer();
      activityTimeoutRef.current = undefined;
    }, 500);
  }, [resetIdleTimer, idleTimeoutEnabled]);

  useEffect(() => {
    // Reset timer on mount or when settings change
    resetIdleTimer();

    if (!idleTimeoutEnabled) {
      return;
    }

    // Listen for user activity only if enabled
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
  }, [handleUserActivity, resetIdleTimer, idleTimeoutEnabled]);

  const handleStayActive = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  return {
    showIdleWarning,
    countdownSeconds,
    onStayActive: handleStayActive,
  };
}
