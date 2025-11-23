import { useEffect, useState } from "react";
import { useLocation } from "wouter";

/**
 * PageTransitionLoader Component
 * Shows a loading overlay when navigating between pages to prevent white screen flash
 */
export function PageTransitionLoader() {
  const [location] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [prevLocation, setPrevLocation] = useState(location);

  useEffect(() => {
    // If location changed, show loader
    if (location !== prevLocation) {
      setIsVisible(true);
      setPrevLocation(location);
      
      // Hide loader after a delay (gives page content time to render)
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [location, prevLocation]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 pointer-events-auto">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading page...</p>
      </div>
    </div>
  );
}
