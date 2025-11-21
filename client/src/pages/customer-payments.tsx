import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Payment {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  invoiceNumber: string;
}

interface PaymentHistory {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  payments: Payment[];
}

export default function CustomerPayments() {
  const { toast } = useToast();

  const { data: paymentData, isLoading } = useQuery<PaymentHistory>({
    queryKey: ["/api/customer/payments"],
  });

  const downloadMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`/api/customer/invoices/${invoiceId}/download`);
      if (!response.ok) throw new Error("Failed to download invoice");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({ title: "Invoice downloaded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to download invoice", variant: "destructive" });
    },
  });

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Payment History</h1>
        <p className="text-muted-foreground text-lg">
          View your invoices and download receipts
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                {paymentData?.payments.length || 0} invoice{paymentData?.payments.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentData?.payments && paymentData.payments.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentData.payments.map((payment) => (
                        <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                          <TableCell className="font-mono text-sm">
                            {payment.invoiceNumber}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(payment.date)}
                          </TableCell>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(payment.amount)} {payment.currency.toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="capitalize">
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadMutation.mutate(payment.id)}
                              disabled={downloadMutation.isPending}
                              data-testid={`button-download-${payment.id}`}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                  <div>
                    <p className="font-medium">No invoices yet</p>
                    <p className="text-sm text-muted-foreground">
                      Your invoices will appear here once you have an active subscription
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
