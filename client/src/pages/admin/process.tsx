import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Zap, Clock, CheckCircle } from "lucide-react";
import type { PhysicalCardOrder } from "@shared/schema";

export default function AdminProcess() {
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<PhysicalCardOrder[]>({
    queryKey: ["/api/admin/physical-card-orders"],
  });

  const processMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("PATCH", `/api/physical-card-orders/${orderId}`, {
        status: "printed",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/physical-card-orders"] });
      toast({ title: "Order processed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to process order", variant: "destructive" });
    },
  });

  const requested = orders?.filter(o => o.status === "requested") || [];
  const processed = orders?.filter(o => o.status === "printed") || [];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Order Processing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Process customer orders for fulfillment</p>
        </div>
        <Button className="gap-2" data-testid="button-batch-process">
          <Zap className="w-4 h-4" />
          Batch Process
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="requested" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="requested">
              <Clock className="w-4 h-4 mr-2" />
              To Process ({requested.length})
            </TabsTrigger>
            <TabsTrigger value="processed">
              <CheckCircle className="w-4 h-4 mr-2" />
              Processed ({processed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requested">
            {requested.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600 dark:text-gray-400">No orders to process</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {requested.map((order) => (
                  <Card key={order.id} data-testid={`card-order-to-process-${order.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                      <div className="flex-1">
                        <CardTitle>{order.recipientName}</CardTitle>
                        <CardDescription className="mt-1">
                          Card #{order.idCardNumber} | {order.recipientCity}, {order.recipientState}
                        </CardDescription>
                        <Badge variant="secondary" className="mt-2">Requested</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        size="sm"
                        onClick={() => processMutation.mutate(order.id)}
                        disabled={processMutation.isPending}
                        data-testid={`button-process-order-${order.id}`}
                      >
                        {processMutation.isPending ? "Processing..." : "Mark as Printed"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="processed">
            {processed.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600 dark:text-gray-400">No processed orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {processed.map((order) => (
                  <Card key={order.id} data-testid={`card-order-processed-${order.id}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                      <div className="flex-1">
                        <CardTitle>{order.recipientName}</CardTitle>
                        <Badge variant="default" className="mt-2">Printed</Badge>
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
