import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Subscription } from "@shared/schema";

interface RenewalReminder extends Subscription {
  customer: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export default function AdminRenewalReminders() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const { data: reminders, isLoading } = useQuery<RenewalReminder[]>({
    queryKey: ["/api/admin/renewal-reminders"],
    enabled: isAdmin,
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/renewal-reminders/${id}/send`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/renewal-reminders"] });
      toast({ title: data.message });
    },
    onError: () => {
      toast({ title: "Failed to send reminder", variant: "destructive" });
    },
  });

  const unsent = reminders?.filter(r => !r.renewalReminderSent) || [];
  const sent = reminders?.filter(r => r.renewalReminderSent) || [];

  const daysUntilExpiry = (endDate: string | Date) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Renewal Reminders</h1>
        <p className="text-muted-foreground text-lg">
          Send renewal notifications to customers with expiring subscriptions
        </p>
      </div>

      {unsent.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{unsent.length} subscription{unsent.length !== 1 ? 's' : ''}</strong> expiring within 30 days - send renewal reminders to customers
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reminders?.length || 0}</div>
            <p className="text-xs text-muted-foreground">within 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reminders Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unsent.length}</div>
            <p className="text-xs text-muted-foreground">not yet sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reminders Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sent.length}</div>
            <p className="text-xs text-muted-foreground">completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Reminders</CardTitle>
          <CardDescription>
            Subscriptions expiring within 30 days that haven't received a reminder yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : unsent.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unsent.map((reminder) => (
                    <TableRow
                      key={reminder.id}
                      className="hover-elevate"
                      data-testid={`reminder-row-${reminder.id}`}
                    >
                      <TableCell className="font-medium">
                        {reminder.customer.user.firstName} {reminder.customer.user.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {reminder.customer.user.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(reminder.endDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {daysUntilExpiry(reminder.endDate)} days
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (confirm(`Send renewal reminder to ${reminder.customer.user.firstName} ${reminder.customer.user.lastName}?`)) {
                              sendReminderMutation.mutate(reminder.id);
                            }
                          }}
                          disabled={sendReminderMutation.isPending}
                          data-testid={`button-send-${reminder.id}`}
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto opacity-50 mb-4" />
              <p className="font-medium">All set!</p>
              <p className="text-sm text-muted-foreground">No pending reminders to send</p>
            </div>
          )}
        </CardContent>
      </Card>

      {sent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reminders Sent</CardTitle>
            <CardDescription>
              Subscriptions that already received renewal reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sent.map((reminder) => (
                    <TableRow
                      key={reminder.id}
                      className="hover-elevate opacity-75"
                      data-testid={`sent-reminder-row-${reminder.id}`}
                    >
                      <TableCell className="font-medium">
                        {reminder.customer.user.firstName} {reminder.customer.user.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {reminder.customer.user.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(reminder.endDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Reminder Sent</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
