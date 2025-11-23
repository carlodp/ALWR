import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DashboardMetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  isLoading?: boolean;
  isRealtime?: boolean;
  testId?: string;
}

export function DashboardMetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  onClick,
  isLoading = false,
  isRealtime = false,
  testId,
}: DashboardMetricCardProps) {
  return (
    <Card
      className={`${onClick ? "cursor-pointer hover-elevate transition-all" : ""}`}
      onClick={onClick}
      data-testid={testId}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {isRealtime && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          )}
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{value}</div>
              {trend && (
                <Badge
                  variant={trend.isPositive ? "default" : "secondary"}
                  className="text-xs"
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(trend.value)}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
