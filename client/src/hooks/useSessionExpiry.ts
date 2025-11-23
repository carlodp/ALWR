import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const SESSION_TTL = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before logout

export function useSessionExpiry() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const warningShownRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      warningShownRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Reset warning flag when user is authenticated
    warningShownRef.current = false;

    // Show warning 5 minutes before session expires
    timeoutRef.current = setTimeout(() => {
      warningShownRef.current = true;
      toast({
        title: "Session Expiring Soon",
        description: "Your session will expire in 5 minutes due to inactivity. Click to refresh.",
        variant: "destructive",
      });

      // Show countdown every minute for the last 5 minutes
      let minutesLeft = 5;
      intervalRef.current = setInterval(() => {
        minutesLeft--;
        if (minutesLeft > 0) {
          toast({
            title: `Session Expiring in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}`,
            description: "Your session will expire due to inactivity.",
            variant: "destructive",
          });
        }
      }, 60 * 1000);
    }, SESSION_TTL - WARNING_TIME);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, toast]);
}
