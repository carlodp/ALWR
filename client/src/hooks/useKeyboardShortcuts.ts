import { useEffect } from "react";
import { useLocation } from "wouter";

export function useKeyboardShortcuts() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for global search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setLocation("/search");
      }

      // Cmd+/ or Ctrl+/ for help (just navigate to dashboard for now)
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setLocation("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setLocation]);
}
