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

  // Fetch initial data from REST API
  useEffect(() => {
    if (!enabled || !userId) {
      setIsLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/admin/analytics/dashboard");
        if (response.ok) {
          const dashboardData = await response.json();
          // Transform API response to RealtimeDashboardData format
          setData({
            totalCustomers: dashboardData.totalCustomers || 0,
            activeSubscriptions: dashboardData.activeSubscriptions || 0,
            totalDocuments: dashboardData.totalDocuments || 0,
            expiringSubscriptions: dashboardData.expiringSubscriptions || 0,
            monthlyRevenue: dashboardData.monthlyRevenue || 0,
            activeUsers: dashboardData.activeUsers || 0,
            newCustomersToday: dashboardData.newCustomersToday || 0,
            documentsUploadedToday: dashboardData.documentsUploadedToday || 0,
            subscriptionsExpiredToday: dashboardData.subscriptionsExpiredToday || 0,
            systemHealth: dashboardData.systemHealth || {
              status: "healthy",
              uptime: 100,
              databaseStatus: "operational",
            },
            metrics: dashboardData.metrics || {
              customerGrowth: 0,
              revenueGrowth: 0,
              documentGrowth: 0,
            },
            recentActivity: dashboardData.recentActivity || [],
          });
          setIsConnected(true);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [enabled, userId]);

  return {
    data,
    isLoading,
    isConnected,
  };
}
