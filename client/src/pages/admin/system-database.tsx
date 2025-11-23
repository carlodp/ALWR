import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Database, TrendingDown, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type QueryMetrics = {
  avgQueryTime: number;
  slowQueries: number;
  totalQueries: number;
  n1Patterns: Array<{
    pattern: string;
    occurrences: number;
    impact: string;
  }>;
  indices: Array<{
    name: string;
    table: string;
    columns: string[];
  }>;
};

export default function AdminSystemDatabase() {
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

  const { data: metrics, isLoading } = useQuery<QueryMetrics>({
    queryKey: ["/api/admin/db-metrics"],
    enabled: !!user && (isAdmin || isSuperAdmin),
  });

  if (authLoading || (!isAdmin && !isSuperAdmin)) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Database Performance</h1>
        <p className="text-muted-foreground text-lg">
          Query metrics, slow query detection, and optimization recommendations
        </p>
      </div>

      {/* Query Performance Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Query Time</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-avg-query-time">
                  {(metrics?.avgQueryTime || 0).toFixed(2)}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Average execution time
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-queries">
                  {metrics?.totalQueries || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Executed queries
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow Queries</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-destructive" data-testid="text-slow-queries">
                  {metrics?.slowQueries || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Exceeding threshold
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* N+1 Pattern Detection */}
      <Card>
        <CardHeader>
          <CardTitle>N+1 Query Patterns Detected</CardTitle>
          <CardDescription>Potential query performance issues that can be optimized</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : metrics?.n1Patterns && metrics.n1Patterns.length > 0 ? (
            <div className="space-y-3">
              {metrics.n1Patterns.map((pattern, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium" data-testid={`pattern-${idx}`}>
                      {pattern.pattern}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {pattern.occurrences} occurrences
                    </p>
                  </div>
                  <Badge
                    variant={
                      pattern.impact === "high"
                        ? "destructive"
                        : pattern.impact === "medium"
                        ? "default"
                        : "secondary"
                    }
                    data-testid={`impact-${idx}`}
                  >
                    {pattern.impact}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No N+1 patterns detected</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Indices */}
      <Card>
        <CardHeader>
          <CardTitle>Active Database Indices</CardTitle>
          <CardDescription>Indices optimizing query performance</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : metrics?.indices && metrics.indices.length > 0 ? (
            <div className="space-y-3">
              {metrics.indices.map((index, idx) => (
                <div key={idx} className="p-3 rounded-lg border">
                  <p className="font-medium" data-testid={`index-${idx}`}>
                    {index.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Table: {index.table}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Columns: {index.columns.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No indices found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
