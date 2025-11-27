import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, FileText, CreditCard, User as UserIcon, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CustomerDetailModal } from "@/components/modals/customer-detail-modal";
import type { Customer, User } from "@shared/schema";

type CustomerWithUser = Customer & {
  user: User;
  subscriptionStatus: string;
  documentCount: number;
  accountStatus: 'active' | 'expired';
};

/**
 * AdminCustomers Component
 * 
 * Admin dashboard for managing all customer accounts and information.
 * 
 * Features:
 * - View all customers in a sortable table
 * - Search by: email, first name, last name, or ID card number
 * - Filter by subscription status (active, inactive, trial, cancelled, pending)
 * - View customer details with one-click navigation
 * - Create new customer accounts
 * - See document counts and subscription status at a glance
 * 
 * Table Columns:
 * - Name: Customer full name
 * - Email: Contact email address
 * - Status: Subscription status (color-coded badge)
 * - Documents: Count of uploaded documents
 * - ID Card: Customer's unique ID card number
 * - Actions: View detail, Edit, Delete buttons
 * 
 * API Endpoint:
 * - GET /api/admin/customers - Fetch all customers with details
 * 
 * Navigation:
 * - Click "View" to see customer-detail.tsx page
 * - Click "Create Customer" button to add new customer
 * 
 * Status Color Coding:
 * - active: green (default)
 * - trial: secondary gray
 * - cancelled: secondary gray
 * - inactive: red (destructive)
 */
export default function AdminCustomers() {
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: customers, isLoading } = useQuery<CustomerWithUser[]>({
    queryKey: ["/api/admin/customers"],
    enabled: isAdmin,
  });

  const filteredCustomers = customers?.filter((customer) => {
    const matchesSearch =
      customer.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.idCardNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubscription = !subscriptionFilter || customer.subscriptionStatus === subscriptionFilter;
    
    return matchesSearch && matchesSubscription;
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

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Customer Management</h1>
        <p className="text-muted-foreground text-lg">
          View and manage all registered customers
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>All Customers</CardTitle>
              <CardDescription>
                {customers?.length || 0} total customer{customers?.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <select
                value={subscriptionFilter || ''}
                onChange={(e) => setSubscriptionFilter(e.target.value || null)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                data-testid="filter-subscription-status"
              >
                <option value="">All Subscriptions</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="trial">Trial</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
                <option value="none">None</option>
              </select>
              <Button
                onClick={() => setLocation("/admin/customers/new")}
                data-testid="button-create-customer"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Customer
              </Button>
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
                  <TableHead>ID Card</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredCustomers && filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="hover-elevate"
                      data-testid={`customer-row-${customer.id}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                            <UserIcon className="h-4 w-4 text-primary" />
                          </div>
                          <span>
                            {customer.user.firstName} {customer.user.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.user.email}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {customer.idCardNumber || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.accountStatus === 'active' ? 'default' : 'secondary'} className="capitalize">
                          {customer.accountStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(customer.subscriptionStatus || 'none')}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span>{customer.documentCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(customer.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomerId(customer.id);
                            setModalOpen(true);
                          }}
                          data-testid={`button-view-${customer.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="space-y-2">
                        <p className="font-medium">
                          {searchQuery || subscriptionFilter ? 'No customers found' : 'No customers yet'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery || subscriptionFilter
                            ? 'Try adjusting your search or filters'
                            : 'Customers will appear here once they register'
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

      <CustomerDetailModal 
        customerId={selectedCustomerId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
