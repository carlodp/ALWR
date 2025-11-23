import { useEffect, useState, useCallback } from "react";

export type RealtimeDashboardData = {
  totalCustomers: number;
  activeSubscriptions: number;
  totalDocuments: number;
  expiringSubscriptions: number;
  monthlyRevenue: number;
  activeUsers: number;
  newCustomersToday: number;
  documentsUploadedToday: number;
  subscriptionsExpiredToday: number;
  systemHealth: {
    status: string;
    uptime: number;
    databaseStatus: string;
  };
  metrics: {
    customerGrowth: number;
    revenueGrowth: number;
    documentGrowth: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
};

export function useRealtimeDashboard(userId: string | undefined, enabled: boolean) {
  const [data, setData] = useState<RealtimeDashboardData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const connectWebSocket = useCallback(() => {
    if (!userId || !enabled) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}?userId=${userId}&stream=stats`;
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log("Connected to real-time dashboard");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "stats" && message.data) {
            setData(message.data);
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log("Disconnected from real-time dashboard");
        // Attempt to reconnect after 3 seconds
        setTimeout(() => connectWebSocket(), 3000);
      };

      return ws;
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      setIsLoading(false);
    }
  }, [userId, enabled]);

  useEffect(() => {
    if (!enabled || !userId) {
      setIsLoading(false);
      return;
    }

    const ws = connectWebSocket();

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [connectWebSocket, enabled, userId]);

  return {
    data,
    isLoading,
    isConnected,
  };
}
