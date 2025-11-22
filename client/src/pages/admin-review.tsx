import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle } from "lucide-react";
import type { Customer } from "@shared/schema";

export default function AdminReview() {
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  // Mock review statuses - in real app would be in database
  const pendingReview = customers?.slice(0, 3) || [];
  const approved = customers?.slice(3, 8) || [];
  const rejected = customers?.slice(8, 10) || [];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Review Customers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Approve or reject new customer registrations</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">
              Pending ({pendingReview.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approved.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejected.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingReview.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600 dark:text-gray-400">No pending reviews</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingReview.map((customer) => (
                  <Card key={customer.id} data-testid={`card-review-${customer.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                      <div className="flex-1">
                        <CardTitle>
                          {customer.userId}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {customer.address}, {customer.city}, {customer.state} {customer.zipCode}
                        </CardDescription>
                        <Badge variant="secondary" className="mt-2">Pending Review</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button className="gap-2" data-testid={`button-approve-${customer.id}`}>
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button variant="destructive" className="gap-2" data-testid={`button-reject-${customer.id}`}>
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approved.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600 dark:text-gray-400">No approved customers</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {approved.map((customer) => (
                  <Card key={customer.id} data-testid={`card-approved-${customer.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                      <div className="flex-1">
                        <CardTitle>{customer.userId}</CardTitle>
                        <Badge variant="default" className="mt-2">Approved</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {rejected.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600 dark:text-gray-400">No rejected customers</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rejected.map((customer) => (
                  <Card key={customer.id} data-testid={`card-rejected-${customer.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                      <div className="flex-1">
                        <CardTitle>{customer.userId}</CardTitle>
                        <Badge variant="destructive" className="mt-2">Rejected</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
