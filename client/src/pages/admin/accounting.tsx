import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Subscription } from "@shared/schema";

interface AccountingPayment extends Subscription {
  customer: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export default function AdminAccounting() {
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: payments, isLoading } = useQuery<AccountingPayment[]>({
    queryKey: ["/api/admin/accounting"],
    enabled: isAdmin,
  });

  const filteredPayments = payments?.filter((payment) => {
    const customerName = `${payment.customer.user.firstName} ${payment.customer.user.lastName}`.toLowerCase();
    const email = payment.customer.user.email.toLowerCase();
    const search = searchQuery.toLowerCase();
    
    return customerName.includes(search) || email.includes(search);
  }) || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      inactive: "secondary",
      cancelled: "destructive",
      pending: "outline",
      trial: "secondary",
    };
    return colors[status] || "default";
  };

  const totalAmount = payments?.reduce((sum, p) => sum + (p.amountPaid || 0), 0) || 0;
  const activeCount = payments?.filter(p => p.status === 'active').length || 0;

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Accounting & Payments</h1>
        <p className="text-muted-foreground text-lg">
          Financial ledger of customer subscription payments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-revenue">
                  ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">All time total</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-active-subscriptions">
                  {activeCount}
                </div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Records</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-payment-records">
                  {payments?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total records</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Ledger */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Ledger</CardTitle>
          <CardDescription>Customer subscription payment history and transaction records</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-payments"
              className="flex-1"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Stamp</TableHead>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Renewal Date</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No payment records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                        <TableCell className="text-sm" data-testid={`text-date-${payment.id}`}>
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-name-${payment.id}`}>
                          {payment.customer.user.firstName} {payment.customer.user.lastName}
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`text-email-${payment.id}`}>
                          {payment.customer.user.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(payment.status)} data-testid={`badge-status-${payment.id}`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`text-start-date-${payment.id}`}>
                          {new Date(payment.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`text-renewal-date-${payment.id}`}>
                          {new Date(payment.renewalDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold" data-testid={`text-amount-${payment.id}`}>
                          ${(payment.amountPaid || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
