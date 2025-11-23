import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const SESSION_TTL = 30 * 60; // 30 minutes in seconds
const WARNING_TIME = 5 * 60; // 5 minutes before expiry

export function SessionTimer() {
  const { isAuthenticated } = useAuth();
  const [remainingSeconds, setRemainingSeconds] = useState(SESSION_TTL);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setRemainingSeconds(SESSION_TTL);
      setIsWarning(false);
      return;
    }

    // Initialize with max time
    setRemainingSeconds(SESSION_TTL);
    
    // Update every second
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        const newValue = prev - 1;
        if (newValue <= WARNING_TIME && newValue > 0) {
          setIsWarning(true);
        } else if (newValue > WARNING_TIME) {
          setIsWarning(false);
        }
        return newValue > 0 ? newValue : 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isAuthenticated || remainingSeconds > WARNING_TIME) {
    return null;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <Badge
      variant={isWarning && remainingSeconds <= WARNING_TIME ? "destructive" : "default"}
      className="flex items-center gap-1"
      data-testid="session-timer"
    >
      <Clock className="h-3 w-3" />
      <span className="text-xs font-mono">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </Badge>
  );
}
