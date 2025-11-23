import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle } from "lucide-react";
import type { Customer } from "@shared/schema";

export default function AdminReviewExpired() {
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  // Filter customers with expired accounts
  const expiredAccounts = customers?.filter(c => (c as any).accountStatus === 'expired') || [];
  const activeAccounts = customers?.filter(c => (c as any).accountStatus === 'active') || [];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Review Expired Accounts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage customer accounts with expired status</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Expired Accounts */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-semibold">Expired Accounts ({expiredAccounts.length})</h2>
            </div>
            
            {expiredAccounts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600 dark:text-gray-400">No expired accounts</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {expiredAccounts.map((customer) => (
                  <Card key={customer.id} className="border-red-200 dark:border-red-800" data-testid={`card-expired-${customer.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                      <div className="flex-1">
                        <CardTitle>{customer.userId}</CardTitle>
                        <CardDescription className="mt-1">
                          {customer.address}, {customer.city}, {customer.state} {customer.zipCode}
                        </CardDescription>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="destructive">Expired</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" data-testid={`button-reactivate-${customer.id}`}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Reactivate
                        </Button>
                        <Button variant="ghost" data-testid={`button-view-${customer.id}`}>
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Active Accounts Summary */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-semibold">Active Accounts ({activeAccounts.length})</h2>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600 dark:text-gray-400">
                  {activeAccounts.length} customer account{activeAccounts.length !== 1 ? 's' : ''} in good standing
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
