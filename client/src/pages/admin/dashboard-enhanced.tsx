import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Lock,
  UserCheck,
  Briefcase,
  Activity,
  Database,
  Clock,
  Eye,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { DashboardMetricCard } from "@/components/cards/metric";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";

/**
 * AdminDashboardEnhanced Component
 * 
 * Real-time admin control center showing comprehensive system metrics and analytics.
 * Features:
 * - Live WebSocket-based data updates (5-second refresh)
 * - Primary metrics: Total Customers, Active Subscriptions, Documents, Revenue
 * - Secondary metrics: Expiring subscriptions, new customers, active users
 * - Real-time activity feed with status indicators
 * - System health monitoring and connection status
 * 
 * Access Control: Admin-only (redirects non-admin users)
 * Data Source: WebSocket connection via useRealtimeDashboard hook
 */
export default function AdminDashboardEnhanced() {
  const { user, isLoading: authLoading, isAdmin, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { data: realtimeData, isLoading, isConnected } = useRealtimeDashboard(
    user?.id,
    !!user && (isAdmin || isSuperAdmin)
  );

  useEffect(() => {
    if (!authLoading && !isAdmin && !isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  }, [isAdmin, isSuperAdmin, authLoading, toast]);

  if (authLoading || (!isAdmin && !isSuperAdmin)) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Real-time system overview and key metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"} animate-pulse`}></div>
          <span className="text-sm text-muted-foreground">
            {isConnected ? "Live Updates" : "Offline"}
          </span>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title="Total Customers"
          value={realtimeData?.totalCustomers || 0}
          subtitle="Registered users"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend={realtimeData?.metrics.customerGrowth ? {
            value: realtimeData.metrics.customerGrowth,
            isPositive: realtimeData.metrics.customerGrowth > 0,
          } : undefined}
          onClick={() => setLocation("/admin/customers")}
          isLoading={isLoading}
          isRealtime={isConnected}
          testId="card-total-customers"
        />

        <DashboardMetricCard
          title="Active Subscriptions"
          value={realtimeData?.activeSubscriptions || 0}
          subtitle="Current active"
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          onClick={() => setLocation("/admin/subscriptions")}
          isLoading={isLoading}
          isRealtime={isConnected}
          testId="card-active-subscriptions"
        />

        <DashboardMetricCard
          title="Documents Stored"
          value={realtimeData?.totalDocuments || 0}
          subtitle="Secure storage"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          trend={realtimeData?.metrics.documentGrowth ? {
            value: realtimeData.metrics.documentGrowth,
            isPositive: realtimeData.metrics.documentGrowth > 0,
          } : undefined}
          onClick={() => setLocation("/admin/customers")}
          isLoading={isLoading}
          isRealtime={isConnected}
          testId="card-total-documents"
        />

        <DashboardMetricCard
          title="Monthly Revenue"
          value={`$${(realtimeData?.monthlyRevenue || 0).toLocaleString()}`}
          subtitle="This month"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          trend={realtimeData?.metrics.revenueGrowth ? {
            value: realtimeData.metrics.revenueGrowth,
            isPositive: realtimeData.metrics.revenueGrowth > 0,
          } : undefined}
          onClick={() => setLocation("/admin/reports")}
          isLoading={isLoading}
          isRealtime={isConnected}
          testId="card-monthly-revenue"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title="Expiring Soon"
          value={realtimeData?.expiringSubscriptions || 0}
          subtitle="Next 30 days"
          icon={<AlertCircle className="h-4 w-4 text-destructive" />}
          onClick={() => setLocation("/admin/renewal-reminders")}
          isLoading={isLoading}
          isRealtime={isConnected}
          testId="card-expiring-subscriptions"
        />

        <DashboardMetricCard
          title="New Customers Today"
          value={realtimeData?.newCustomersToday || 0}
          subtitle="Signed up"
          icon={<UserCheck className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
          isRealtime={isConnected}
          testId="card-new-customers-today"
        />

        <DashboardMetricCard
          title="Documents Today"
          value={realtimeData?.documentsUploadedToday || 0}
          subtitle="Uploaded"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
          isRealtime={isConnected}
          testId="card-documents-today"
        />

        <DashboardMetricCard
          title="Active Users"
          value={realtimeData?.activeUsers || 0}
          subtitle="Currently online"
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
          isRealtime={isConnected}
          testId="card-active-users"
        />
      </div>

      {/* System Health */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Current system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Overall Status</span>
                  </div>
                  <Badge variant="default">
                    {realtimeData?.systemHealth.status || "Unknown"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Uptime</span>
                  </div>
                  <span className="font-semibold" data-testid="text-uptime">
                    {(realtimeData?.systemHealth.uptime || 0).toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Database</span>
                  </div>
                  <Badge variant="secondary">
                    {realtimeData?.systemHealth.databaseStatus || "Unknown"}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 grid-cols-2">
          <Card
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setLocation("/admin/users")}
            data-testid="card-accounts"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accounts</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Manage</div>
              <p className="text-xs text-muted-foreground">Users & Roles</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setLocation("/admin/audit-logs")}
            data-testid="card-audit-logs"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">View</div>
              <p className="text-xs text-muted-foreground">Activity History</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setLocation("/admin/system/rate-limits")}
            data-testid="card-rate-limits"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rate Limits</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Monitor</div>
              <p className="text-xs text-muted-foreground">API Limits</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setLocation("/admin/system/database")}
            data-testid="card-database"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Performance</div>
              <p className="text-xs text-muted-foreground">Query Metrics</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setLocation("/admin/reports")}
            data-testid="card-reports"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Analytics</div>
              <p className="text-xs text-muted-foreground">Automated Reports</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setLocation("/admin/accounting")}
            data-testid="card-accounting"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accounting</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Payments</div>
              <p className="text-xs text-muted-foreground">Financial Ledger</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events and user actions</CardDescription>
            </div>
            <div className="text-xs text-muted-foreground">
              {isConnected && "Updating live"}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : realtimeData?.recentActivity && realtimeData.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {realtimeData.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg border hover-elevate transition-all"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 flex-shrink-0">
                    {activity.type === "subscription" ? (
                      <CreditCard className="h-5 w-5 text-primary" />
                    ) : activity.type === "document" ? (
                      <FileText className="h-5 w-5 text-primary" />
                    ) : activity.type === "customer" ? (
                      <Users className="h-5 w-5 text-primary" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-2">
                <p className="font-medium">No recent activity</p>
                <p className="text-sm text-muted-foreground">
                  System activity will appear here
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
