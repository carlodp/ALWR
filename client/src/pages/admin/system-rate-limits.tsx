import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Activity, AlertCircle, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type RateLimitStats = {
  currentLimits: {
    customer: { limit: number; resetTime: string };
    agent: { limit: number; resetTime: string };
    admin: { limit: number; resetTime: string };
  };
  activeUsers: number;
  totalRequests: number;
  blockedRequests: number;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
    blocks: number;
  }>;
};

export default function AdminSystemRateLimits() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  }, [isAdmin, authLoading, toast]);

  const { data: stats, isLoading } = useQuery<RateLimitStats>({
    queryKey: ["/api/admin/rate-limits/stats"],
    enabled: !!user && isAdmin,
  });

  if (authLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Rate Limiting</h1>
        <p className="text-muted-foreground text-lg">
          Monitor request limits and throttling by user role
        </p>
      </div>

      {/* Rate Limit Tiers */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Tier</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-customer-limit">
                  {stats?.currentLimits.customer.limit || 100}/hr
                </div>
                <p className="text-xs text-muted-foreground">
                  Requests per hour
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Tier</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-agent-limit">
                  {stats?.currentLimits.agent.limit || 500}/hr
                </div>
                <p className="text-xs text-muted-foreground">
                  Requests per hour
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Tier</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-admin-limit">
                  {stats?.currentLimits.admin.limit || 2000}/hr
                </div>
                <p className="text-xs text-muted-foreground">
                  Requests per hour
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-active-users">
                  {stats?.activeUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current active users
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-requests">
                  {stats?.totalRequests || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last hour
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-destructive" data-testid="text-blocked-requests">
                  {stats?.blockedRequests || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Rate limited
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Top Endpoints</CardTitle>
          <CardDescription>Most frequently accessed API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : stats?.topEndpoints && stats.topEndpoints.length > 0 ? (
            <div className="space-y-3">
              {stats.topEndpoints.map((endpoint, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium" data-testid={`endpoint-${idx}`}>
                      {endpoint.endpoint}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {endpoint.requests} requests
                    </p>
                  </div>
                  {endpoint.blocks > 0 && (
                    <div className="text-right">
                      <p className="font-medium text-destructive" data-testid={`blocks-${idx}`}>
                        {endpoint.blocks}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        blocked
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No endpoint data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
