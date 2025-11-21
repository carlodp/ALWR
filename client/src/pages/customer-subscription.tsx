import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Clock, CreditCard, AlertCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Subscription } from "@shared/schema";

export default function CustomerSubscription() {
  const { toast } = useToast();

  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ["/api/customer/subscription"],
  });

  const createPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/customer/subscription/portal", {});
      const data = await response.json();
      return data.url;
    },
    onSuccess: (url: string) => {
      window.location.href = url;
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createCheckoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/checkout", { priceId });
      const data = await response.json();
      return data.url;
    },
    onSuccess: (url: string) => {
      window.location.href = url;
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = () => {
    if (!subscription) return null;

    const statusConfig = {
      active: { variant: "default" as const, icon: CheckCircle2, label: "Active" },
      expired: { variant: "destructive" as const, icon: XCircle, label: "Expired" },
      cancelled: { variant: "secondary" as const, icon: XCircle, label: "Cancelled" },
      trial: { variant: "secondary" as const, icon: Clock, label: "Trial" },
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending" },
    };

    const config = statusConfig[subscription.status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1" data-testid="badge-subscription-status">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getDaysUntilExpiry = () => {
    if (!subscription?.endDate) return null;
    const days = Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-8">
        <Skeleton className="h-10 w-64" />
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
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Subscription</h1>
        <p className="text-muted-foreground text-lg">
          Manage your ALWR membership and billing
        </p>
      </div>

      {/* Current Subscription */}
      {subscription ? (
        <Card data-testid="card-current-subscription">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Expiry Warning */}
            {subscription.status === 'active' && daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
              <Alert variant={daysUntilExpiry <= 7 ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription {daysUntilExpiry <= 0 ? 'has expired' : `expires in ${daysUntilExpiry} days`}.
                  Please renew to maintain access to your documents.
                </AlertDescription>
              </Alert>
            )}

            {subscription.status === 'expired' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription has expired. Please renew to regain access to your documents.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-bold" data-testid="text-price">
                  {formatPrice(subscription.amount)}
                  <span className="text-base font-normal text-muted-foreground">/{subscription.currency}</span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="text-lg font-medium" data-testid="text-start-date">
                  {new Date(subscription.startDate).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="text-lg font-medium" data-testid="text-end-date">
                  {new Date(subscription.endDate).toLocaleDateString()}
                </p>
              </div>

              {subscription.renewalDate && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Next Renewal</p>
                  <p className="text-lg font-medium" data-testid="text-renewal-date">
                    {new Date(subscription.renewalDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => createPortalMutation.mutate()}
                disabled={createPortalMutation.isPending}
                data-testid="button-manage-billing"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {createPortalMutation.isPending ? "Loading..." : "Manage Billing"}
              </Button>
              
              {(subscription.status === 'expired' || subscription.status === 'cancelled') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Contact Support",
                      description: "Please contact support to reactivate your subscription.",
                    });
                  }}
                  data-testid="button-reactivate"
                >
                  Reactivate Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* No Subscription - Show Plans */
        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have an active subscription. Choose a plan below to get started.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Annual Plan */}
            <Card className="relative overflow-hidden border-2 border-primary" data-testid="card-plan-annual">
              <div className="absolute top-4 right-4">
                <Badge>Best Value</Badge>
              </div>
              <CardHeader>
                <CardTitle>Annual Plan</CardTitle>
                <CardDescription>Full year of secure document storage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-4xl font-bold">$29.99</div>
                  <p className="text-sm text-muted-foreground">per year</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Unlimited document storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>24/7 emergency access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Physical ID card included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Access notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>HIPAA compliant storage</span>
                  </li>
                </ul>
                <Button
                  className="w-full"
                  onClick={() => createCheckoutMutation.mutate("price_annual_2999")}
                  disabled={createCheckoutMutation.isPending}
                  data-testid="button-subscribe-annual"
                >
                  Subscribe Now
                </Button>
              </CardContent>
            </Card>

            {/* Monthly Plan */}
            <Card data-testid="card-plan-monthly">
              <CardHeader>
                <CardTitle>Monthly Plan</CardTitle>
                <CardDescription>Pay as you go flexibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-4xl font-bold">$4.99</div>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Unlimited document storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>24/7 emergency access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Physical ID card included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Access notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>HIPAA compliant storage</span>
                  </li>
                </ul>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => createCheckoutMutation.mutate("price_monthly_499")}
                  disabled={createCheckoutMutation.isPending}
                  data-testid="button-subscribe-monthly"
                >
                  Subscribe Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Billing Portal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Portal</CardTitle>
          <CardDescription>
            Manage your payment methods, view invoices, and update billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the "Manage Billing" button above to access the Stripe customer portal where you can:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Update payment methods</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>View and download invoices</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Cancel or reactivate subscription</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Update billing address</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
