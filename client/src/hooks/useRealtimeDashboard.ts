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
          // API returns nested objects: subscriptions, customers, documents, revenue, health
          setData({
            totalCustomers: dashboardData.customers?.total || 0,
            activeSubscriptions: dashboardData.subscriptions?.active || 0,
            totalDocuments: dashboardData.documents?.total || 0,
            expiringSubscriptions: dashboardData.subscriptions?.pending || 0,
            monthlyRevenue: dashboardData.revenue?.mtd || 0,
            activeUsers: dashboardData.health?.activeUsers || 0,
            newCustomersToday: dashboardData.customers?.newThisMonth || 0,
            documentsUploadedToday: dashboardData.documents?.uploadedThisMonth || 0,
            subscriptionsExpiredToday: dashboardData.subscriptions?.expired || 0,
            systemHealth: dashboardData.health ? {
              status: dashboardData.health.uptime > 99 ? "healthy" : "warning",
              uptime: dashboardData.health.uptime,
              databaseStatus: "operational",
            } : {
              status: "healthy",
              uptime: 100,
              databaseStatus: "operational",
            },
            metrics: {
              customerGrowth: 0,
              revenueGrowth: 0,
              documentGrowth: 0,
            },
            recentActivity: [],
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
