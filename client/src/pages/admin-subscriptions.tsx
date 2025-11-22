import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Edit, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Subscription } from "@shared/schema";

interface SubscriptionWithCustomer extends Subscription {
  customer: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

const updateSubscriptionSchema = z.object({
  status: z.enum(['active', 'inactive', 'cancelled', 'pending', 'trial']),
  renewalDate: z.string().optional(),
  endDate: z.string().optional(),
});

type UpdateSubscriptionData = z.infer<typeof updateSubscriptionSchema>;

export default function AdminSubscriptions() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<UpdateSubscriptionData>({
    resolver: zodResolver(updateSubscriptionSchema),
    defaultValues: { status: 'active' },
  });

  const { data: subscriptions, isLoading } = useQuery<SubscriptionWithCustomer[]>({
    queryKey: ["/api/admin/subscriptions"],
    enabled: isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; payload: UpdateSubscriptionData }) => {
      const res = await apiRequest("PATCH", `/api/admin/subscriptions/${data.id}`, data.payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      setEditingId(null);
      form.reset();
      toast({ title: "Subscription updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update subscription", variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/subscriptions/${id}/cancel`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      toast({ title: "Subscription cancelled successfully" });
    },
    onError: () => {
      toast({ title: "Failed to cancel subscription", variant: "destructive" });
    },
  });

  const filteredSubscriptions = subscriptions?.filter((sub) => {
    const matchesSearch =
      sub.customer.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.customer.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.customer.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      active: "default",
      inactive: "destructive",
      trial: "secondary",
      cancelled: "secondary",
      pending: "secondary",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const onSubmitUpdate = async (data: UpdateSubscriptionData) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload: data });
    }
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground text-lg">
          View and manage all customer subscriptions
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>All Subscriptions</CardTitle>
              <CardDescription>
                {subscriptions?.length || 0} total subscription{subscriptions?.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subscriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <select
                value={statusFilter || ''}
                onChange={(e) => setStatusFilter(e.target.value || null)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                data-testid="filter-status"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
                <option value="trial">Trial</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Renewal Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredSubscriptions && filteredSubscriptions.length > 0 ? (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow
                      key={subscription.id}
                      className="hover-elevate"
                      data-testid={`subscription-row-${subscription.id}`}
                    >
                      <TableCell className="font-medium">
                        {subscription.customer.user.firstName} {subscription.customer.user.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {subscription.customer.user.email}
                      </TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        ${(subscription.amount / 100).toFixed(2)} {subscription.currency.toUpperCase()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(subscription.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(subscription.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {subscription.renewalDate
                          ? new Date(subscription.renewalDate).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog open={editingId === subscription.id} onOpenChange={(open) => {
                            if (!open) setEditingId(null);
                            else {
                              setEditingId(subscription.id);
                              form.reset({
                                status: subscription.status as any,
                                renewalDate: subscription.renewalDate
                                  ? new Date(subscription.renewalDate).toISOString().split('T')[0]
                                  : '',
                                endDate: new Date(subscription.endDate).toISOString().split('T')[0],
                              });
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-edit-${subscription.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Subscription</DialogTitle>
                                <DialogDescription>
                                  Update the subscription for {subscription.customer.user.firstName} {subscription.customer.user.lastName}
                                </DialogDescription>
                              </DialogHeader>
                              <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmitUpdate)} className="space-y-4">
                                  <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <FormControl>
                                          <select
                                            {...field}
                                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                                            data-testid="select-status"
                                          >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="pending">Pending</option>
                                            <option value="trial">Trial</option>
                                          </select>
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>End Date</FormLabel>
                                        <FormControl>
                                          <input
                                            type="date"
                                            {...field}
                                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                                            data-testid="input-end-date"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="renewalDate"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Renewal Date (Optional)</FormLabel>
                                        <FormControl>
                                          <input
                                            type="date"
                                            {...field}
                                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                                            data-testid="input-renewal-date"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setEditingId(null)}>
                                      Cancel
                                    </Button>
                                    <Button type="submit" disabled={updateMutation.isPending}>
                                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>

                          {subscription.status !== 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to cancel this subscription?')) {
                                  cancelMutation.mutate(subscription.id);
                                }
                              }}
                              disabled={cancelMutation.isPending}
                              data-testid={`button-cancel-${subscription.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="space-y-2">
                        <p className="font-medium">
                          {searchQuery || statusFilter ? 'No subscriptions found' : 'No subscriptions yet'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery || statusFilter
                            ? 'Try adjusting your search or filters'
                            : 'Subscriptions will appear here once customers sign up'
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
