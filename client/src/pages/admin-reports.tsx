import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeStats } from "@/hooks/useRealtimeStats";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Zap } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminReports() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { data: reports, isLoading } = useRealtimeStats();

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

  if (authLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground text-lg">
          Detailed business metrics and trends
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-total-revenue">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-3xl font-bold" data-testid="text-total-revenue">
                  ${reports?.totalRevenue || 0}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-avg-revenue">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Revenue per Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-3xl font-bold" data-testid="text-avg-revenue">
                  ${reports?.avgRevenuePerCustomer || 0}
                </div>
                <p className="text-xs text-muted-foreground">Customer average</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card data-testid="card-revenue-chart">
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Monthly revenue overview</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reports?.revenueByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Subscription Status Pie Chart */}
      <Card data-testid="card-subscription-pie">
        <CardHeader>
          <CardTitle>Subscription Status Distribution</CardTitle>
          <CardDescription>Current subscription breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reports?.subscriptionStats || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, count }) => `${name}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(reports?.subscriptionStats || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Document Upload Trend */}
      <Card data-testid="card-documents-chart">
        <CardHeader>
          <CardTitle>Document Upload Trend</CardTitle>
          <CardDescription>Weekly document uploads</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reports?.documentUploadTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="uploads"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Documents"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Customers by Documents */}
      <Card data-testid="card-top-customers">
        <CardHeader>
          <CardTitle>Top Customers by Documents</CardTitle>
          <CardDescription>Customers with most documents on file</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : reports?.topCustomersByDocuments && reports.topCustomersByDocuments.length > 0 ? (
            <div className="space-y-3">
              {reports.topCustomersByDocuments.map((customer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                  data-testid={`customer-docs-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-medium">{customer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{customer.documents}</p>
                    <p className="text-xs text-muted-foreground">documents</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
