import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import type { PhysicalCardOrder } from "@shared/schema";

export default function AdminPhysicalCardOrders() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<PhysicalCardOrder | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");

  const { data: orders, isLoading } = useQuery<PhysicalCardOrder[]>({
    queryKey: ["/api/admin/physical-card-orders"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; status: string; trackingNumber?: string }) => {
      const res = await apiRequest("PATCH", `/api/physical-card-orders/${data.id}`, {
        status: data.status,
        trackingNumber: data.trackingNumber,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/physical-card-orders"] });
      setSelectedOrder(null);
      setTrackingNumber("");
      toast({ title: "Order updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update order", variant: "destructive" });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "requested":
        return <Clock className="w-4 h-4" />;
      case "printed":
        return <Package className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "requested":
        return "secondary";
      case "printed":
        return "secondary";
      case "shipped":
        return "default";
      case "delivered":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const groupedOrders = {
    requested: orders?.filter((o) => o.status === "requested") || [],
    printed: orders?.filter((o) => o.status === "printed") || [],
    shipped: orders?.filter((o) => o.status === "shipped") || [],
    delivered: orders?.filter((o) => o.status === "delivered") || [],
  };

  const ordersByStatus = [
    { key: "requested", label: "Requested", orders: groupedOrders.requested },
    { key: "printed", label: "Printed", orders: groupedOrders.printed },
    { key: "shipped", label: "Shipped", orders: groupedOrders.shipped },
    { key: "delivered", label: "Delivered", orders: groupedOrders.delivered },
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Physical Card Orders</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage physical ID card orders and shipments</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600 dark:text-gray-400">No physical card orders yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="requested">
          <TabsList className="mb-6">
            {ordersByStatus.map((status) => (
              <TabsTrigger key={status.key} value={status.key}>
                {status.label} ({status.orders.length})
              </TabsTrigger>
            ))}
          </TabsList>

          {ordersByStatus.map((statusGroup) => (
            <TabsContent key={statusGroup.key} value={statusGroup.key}>
              {statusGroup.orders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-gray-600 dark:text-gray-400">No orders in this status.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {statusGroup.orders.map((order) => (
                    <Card key={order.id} data-testid={`card-order-${order.id}`}>
                      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {order.recipientName}
                            <Badge variant={getStatusBadgeVariant(order.status)} className="gap-1">
                              {getStatusIcon(order.status)}
                              {order.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">Card #{order.idCardNumber}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</p>
                            <p className="text-sm mt-1">
                              {order.recipientAddress}, {order.recipientCity}, {order.recipientState} {order.recipientZip}
                            </p>
                          </div>
                          {order.trackingNumber && (
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tracking</p>
                              <p className="text-sm mt-1">{order.trackingNumber}</p>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="gap-2"
                          data-testid={`button-update-order-${order.id}`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          Update Status
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
              <DialogDescription>Update the status for {selectedOrder.recipientName}'s card order</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">New Status</label>
                <div className="mt-2 space-y-2">
                  {["requested", "printed", "shipped", "delivered", "cancelled"].map((status) => (
                    <Button
                      key={status}
                      variant={selectedOrder.status === status ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => {
                        updateMutation.mutate({
                          id: selectedOrder.id,
                          status,
                          trackingNumber: status === "shipped" ? trackingNumber : undefined,
                        });
                      }}
                      data-testid={`button-status-${status}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              {selectedOrder.status !== "shipped" && (
                <div>
                  <label className="text-sm font-medium">Tracking Number (for shipped)</label>
                  <Input
                    placeholder="e.g., 1Z999AA10123456784"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    data-testid="input-tracking-number"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
