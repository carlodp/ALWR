import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, FileText, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AnalyticsDashboard = {
  subscriptionMetrics: {
    total: number;
    active: number;
    expiring: number;
    churnRate: number;
  };
  revenueMetrics: {
    mtd: number;
    ytd: number;
    monthly: number;
  };
  customerMetrics: {
    total: number;
    newThisMonth: number;
    growth: number;
  };
  documentMetrics: {
    total: number;
    thisMonth: number;
    avgPerCustomer: number;
  };
  systemHealth: {
    status: string;
    uptime: number;
    databaseStatus: string;
  };
};

export default function AdminSystemAnalytics() {
  const { user, isLoading: authLoading, isAdmin, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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

  const { data: analytics, isLoading } = useQuery<AnalyticsDashboard>({
    queryKey: ["/api/admin/analytics/dashboard"],
    enabled: !!user && (isAdmin || isSuperAdmin),
  });

  if (authLoading || (!isAdmin && !isSuperAdmin)) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">System Analytics</h1>
        <p className="text-muted-foreground text-lg">
          Comprehensive overview of system metrics and performance
        </p>
      </div>

      {/* Subscription Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Subscriptions</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Active</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-active-subs">
                    {analytics?.subscriptionMetrics.active || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active subscriptions
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-total-subs">
                    {analytics?.subscriptionMetrics.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-expiring-subs">
                    {analytics?.subscriptionMetrics.expiring || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Next 30 days
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-churn-rate">
                    {(analytics?.subscriptionMetrics.churnRate || 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Monthly churn
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Revenue</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-mtd-revenue">
                    ${(analytics?.revenueMetrics.mtd || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Month to date
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Year</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-ytd-revenue">
                    ${(analytics?.revenueMetrics.ytd || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Year to date
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Avg</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-monthly-revenue">
                    ${(analytics?.revenueMetrics.monthly || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average per month
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customer Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Customers</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-total-customers">
                    {analytics?.customerMetrics.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-new-customers">
                    {analytics?.customerMetrics.newThisMonth || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-growth-rate">
                    {(analytics?.customerMetrics.growth || 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Month over month
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Documents</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-total-documents">
                    {analytics?.documentMetrics.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Stored securely
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-documents-this-month">
                    {analytics?.documentMetrics.thisMonth || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    New uploads
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Per Customer</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-docs-per-customer">
                    {(analytics?.documentMetrics.avgPerCustomer || 0).toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Current system status and availability</CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <p className="font-medium">Overall Status</p>
                <Badge
                  variant={analytics?.systemHealth.status === "operational" ? "default" : "destructive"}
                  data-testid="badge-system-status"
                >
                  {analytics?.systemHealth.status || "unknown"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <p className="font-medium">Uptime</p>
                <p className="font-semibold" data-testid="text-uptime">
                  {(analytics?.systemHealth.uptime || 0).toFixed(2)}%
                </p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <p className="font-medium">Database Status</p>
                <Badge
                  variant={analytics?.systemHealth.databaseStatus === "healthy" ? "default" : "secondary"}
                  data-testid="badge-db-status"
                >
                  {analytics?.systemHealth.databaseStatus || "unknown"}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
