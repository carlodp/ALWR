import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import type { Subscription } from "@shared/schema";

export default function AdminReconcile() {
  const { data: subscriptions, isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/admin/subscriptions"],
  });

  // Mock reconciliation statuses
  const discrepancies = subscriptions?.filter(s => Math.random() > 0.7) || [];
  const reconciled = subscriptions?.filter(s => Math.random() > 0.5).slice(0, 3) || [];
  const pending = subscriptions?.slice(0, 3) || [];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Reconciliation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Reconcile customer records and subscriptions</p>
        </div>
        <Button data-testid="button-reconcile-all">Reconcile All</Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="discrepancies" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="discrepancies">
              <AlertCircle className="w-4 h-4 mr-2" />
              Discrepancies ({discrepancies.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Clock className="w-4 h-4 mr-2" />
              Pending ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="reconciled">
              <CheckCircle className="w-4 h-4 mr-2" />
              Reconciled ({reconciled.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discrepancies">
            {discrepancies.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600 dark:text-gray-400">No discrepancies found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {discrepancies.map((sub) => (
                  <Card key={sub.id} className="border-red-200 dark:border-red-900" data-testid={`card-discrepancy-${sub.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          Subscription {sub.id?.slice(0, 8)}
                          <Badge variant="destructive">Discrepancy</Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Status: {sub.status} | Amount: ${(sub.amount / 100).toFixed(2)}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button size="sm" data-testid={`button-resolve-${sub.id}`}>Resolve</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {pending.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600 dark:text-gray-400">No pending reconciliation</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pending.map((sub) => (
                  <Card key={sub.id} data-testid={`card-pending-${sub.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                      <div className="flex-1">
                        <CardTitle>Subscription {sub.id?.slice(0, 8)}</CardTitle>
                        <Badge variant="secondary" className="mt-2">Pending</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button size="sm" data-testid={`button-process-${sub.id}`}>Process</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reconciled">
            {reconciled.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600 dark:text-gray-400">No reconciled records</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reconciled.map((sub) => (
                  <Card key={sub.id} data-testid={`card-reconciled-${sub.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          Subscription {sub.id?.slice(0, 8)}
                          <Badge variant="default">Reconciled</Badge>
                        </CardTitle>
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
