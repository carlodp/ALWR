import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export function useAutoExtendSession() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      // Refetch user data to extend session TTL
      queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
    };

    // Listen for user activity events
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, queryClient]);
}
