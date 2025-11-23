import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeStats } from "@/hooks/useRealtimeStats";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TrendingUp, Plus, Clock, CheckCircle, AlertCircle, Zap, Trash2, Copy, Search } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// Form schema for creating/editing report schedules
const reportScheduleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  reportType: z.enum(["revenue", "subscriptions", "customers", "documents", "comprehensive"]),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  recipientEmails: z.string().min(1, "At least one email is required"),
  includeCharts: z.boolean().default(true),
  hour: z.number().min(0).max(23),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
});

type ReportScheduleFormData = z.infer<typeof reportScheduleSchema>;

export default function AdminReports() {
  const { isAdmin, isSuperAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { data: reports, isLoading: statsLoading } = useRealtimeStats();
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null);

  const form = useForm<ReportScheduleFormData>({
    resolver: zodResolver(reportScheduleSchema),
    defaultValues: {
      name: "",
      description: "",
      reportType: "comprehensive",
      frequency: "weekly",
      recipientEmails: "",
      includeCharts: true,
      hour: 9,
    },
  });

  // Fetch report schedules
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ["/api/admin/reports/schedules"],
    enabled: (isAdmin || isSuperAdmin) && !authLoading,
    staleTime: 30000,
  });

  // Fetch report history
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/admin/reports/history"],
    enabled: (isAdmin || isSuperAdmin) && !authLoading,
    staleTime: 30000,
  });

  // Create schedule mutation
  const createSchedule = useMutation({
    mutationFn: (data: ReportScheduleFormData) =>
      apiRequest("POST", "/api/admin/reports/schedules", {
        ...data,
        recipientEmails: data.recipientEmails.split(",").map(e => e.trim()),
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Report schedule created" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports/schedules"] });
      form.reset();
      setOpenDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create schedule",
        variant: "destructive",
      });
    },
  });

  // Toggle schedule mutation
  const toggleSchedule = useMutation({
    mutationFn: (scheduleId: string) =>
      apiRequest("PATCH", `/api/admin/reports/schedules/${scheduleId}/toggle`, {}),
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: `Schedule ${data.isActive ? "enabled" : "disabled"}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports/schedules"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle schedule",
        variant: "destructive",
      });
    },
  });

  // Delete schedule mutation
  const deleteSchedule = useMutation({
    mutationFn: (scheduleId: string) =>
      apiRequest("DELETE", `/api/admin/reports/schedules/${scheduleId}`, {}),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports/schedules"] });
      setDeleteScheduleId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete schedule",
        variant: "destructive",
      });
    },
  });

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
          Detailed business metrics, trends, and automated report scheduling
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-total-revenue">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
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
            {statsLoading ? (
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
          {statsLoading ? (
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
          {statsLoading ? (
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
          {statsLoading ? (
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
          {statsLoading ? (
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

      {/* Automated Report Schedules Section */}
      <div className="space-y-4">
        {/* Summary Card */}
        {!schedulesLoading && schedules && schedules.length > 0 && (
          <Card data-testid="card-schedule-summary">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Schedules</p>
                  <p className="text-2xl font-bold" data-testid="text-total-schedules">{schedules.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-active-schedules">
                    {schedules.filter((s: any) => s.isActive).length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-inactive-schedules">
                    {schedules.filter((s: any) => !s.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Automated Report Schedules</h2>
            <p className="text-muted-foreground">Create and manage automatic report delivery</p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-schedule">
                <Plus className="h-4 w-4 mr-2" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Report Schedule</DialogTitle>
                <DialogDescription>
                  Set up automatic report generation and email delivery
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createSchedule.mutate(data))} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Weekly Revenue Report" {...field} data-testid="input-schedule-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Add notes about this report..." {...field} data-testid="input-schedule-desc" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-report-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="revenue">Revenue Report</SelectItem>
                            <SelectItem value="subscriptions">Subscriptions Report</SelectItem>
                            <SelectItem value="customers">Customers Report</SelectItem>
                            <SelectItem value="documents">Documents Report</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-frequency">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hour"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Time (Hour)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="23" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-hour"
                          />
                        </FormControl>
                        <FormDescription>24-hour format (0-23)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recipientEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Emails</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="email1@example.com, email2@example.com" 
                            {...field}
                            data-testid="input-emails"
                          />
                        </FormControl>
                        <FormDescription>Comma-separated email addresses</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="includeCharts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Include Charts</FormLabel>
                          <FormDescription>
                            Include visual charts in email reports
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-charts"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={createSchedule.isPending} data-testid="button-submit-schedule">
                    {createSchedule.isPending ? "Creating..." : "Create Schedule"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        {!schedulesLoading && schedules && schedules.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schedules by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-schedule-search"
            />
          </div>
        )}

        {/* Schedules List */}
        <div className="grid gap-4">
          {schedulesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : schedules && schedules.length > 0 ? (
            schedules
              .filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((schedule: any) => (
              <Card key={schedule.id} data-testid={`card-schedule-${schedule.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{schedule.name}</CardTitle>
                      {schedule.description && (
                        <CardDescription>{schedule.description}</CardDescription>
                      )}
                    </div>
                    <Badge variant={schedule.isActive ? "default" : "secondary"}>
                      {schedule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Report Type</p>
                      <p className="font-medium capitalize">{schedule.reportType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Frequency</p>
                      <p className="font-medium capitalize">{schedule.frequency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Delivery Time</p>
                      <p className="font-medium">{schedule.hour}:00</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Recipients</p>
                      <p className="font-medium">{schedule.recipientEmails?.length || 0} email(s)</p>
                    </div>
                  </div>
                  {/* Recipient Emails Preview */}
                  <div className="pt-3 border-t">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-xs text-muted-foreground">Recipients</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const emails = schedule.recipientEmails?.join(", ") || "";
                          navigator.clipboard.writeText(emails);
                          toast({
                            title: "Copied",
                            description: "Recipient emails copied to clipboard",
                          });
                        }}
                        data-testid={`button-copy-emails-${schedule.id}`}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm font-medium truncate" title={schedule.recipientEmails?.join(", ")}>
                      {schedule.recipientEmails?.join(", ") || "No recipients"}
                    </p>
                  </div>

                  {/* Next Scheduled Time */}
                  {schedule.nextScheduledAt && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">Next Scheduled</p>
                      <p className="text-sm font-medium">
                        {new Date(schedule.nextScheduledAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleSchedule.mutate(schedule.id)}
                      disabled={toggleSchedule.isPending}
                      data-testid={`button-toggle-schedule-${schedule.id}`}
                    >
                      {schedule.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteScheduleId(schedule.id)}
                      disabled={deleteSchedule.isPending}
                      data-testid={`button-delete-schedule-${schedule.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">No scheduled reports yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create your first automated report to get started. Reports will be generated and emailed automatically on the schedule you define.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteScheduleId} onOpenChange={(open) => !open && setDeleteScheduleId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The schedule will be permanently deleted, but existing report history will be retained.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteScheduleId) {
                    deleteSchedule.mutate(deleteScheduleId);
                  }
                }}
                className="bg-destructive hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Report History */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Recent Report History</h2>
          <p className="text-muted-foreground">Generated and sent reports</p>
        </div>

        <div className="grid gap-4">
          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : history && history.length > 0 ? (
            history.slice(0, 10).map((item: any) => (
              <Card key={item.id} data-testid={`card-history-${item.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{item.scheduleId}</p>
                      <p className="text-sm text-muted-foreground">
                        Generated {new Date(item.generatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.deliveryStatus === "sent" && (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">Sent</span>
                        </>
                      )}
                      {item.deliveryStatus === "pending" && (
                        <>
                          <Clock className="h-5 w-5 text-yellow-500" />
                          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Pending</span>
                        </>
                      )}
                      {item.deliveryStatus === "failed" && (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <span className="text-sm font-medium text-red-700 dark:text-red-400">Failed</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No report history yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
