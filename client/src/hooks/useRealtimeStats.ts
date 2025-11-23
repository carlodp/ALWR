import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export type ReportsData = {
  revenueByMonth: { month: string; revenue: number }[];
  subscriptionStats: { status: string; count: number }[];
  documentUploadTrend: { week: string; uploads: number }[];
  topCustomersByDocuments: { name: string; documents: number }[];
  avgRevenuePerCustomer: number;
  totalRevenue: number;
  timestamp: number;
};

type StatsMessage = {
  type: 'stats';
  data: ReportsData;
};

export function useRealtimeStats() {
  const { user } = useAuth();
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Determine protocol based on current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/stats?userId=${user.id}&stream=stats`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsLoading(false);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as StatsMessage;
          if (message.type === 'stats') {
            setData(message.data);
          }
        } catch (err) {
          console.error('Error parsing stats message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket stats error:', event);
        setError('Failed to connect to real-time stats');
        setIsLoading(false);
      };

      ws.onclose = () => {
        // Try to reconnect after 3 seconds
        setTimeout(() => {
          connect();
        }, 3000);
      };

      return ws;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setIsLoading(false);
      return null;
    }
  }, [user?.id]);

  useEffect(() => {
    const ws = connect();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  return { data, isLoading, error };
}
