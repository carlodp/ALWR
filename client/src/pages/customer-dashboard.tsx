import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CreditCard, User, Upload, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import type { Customer, Subscription, Document } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast]);

  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: ["/api/customer/profile"],
    enabled: !!user,
  });

  const { data: subscription, isLoading: subscriptionLoading } = useQuery<Subscription>({
    queryKey: ["/api/customer/subscription"],
    enabled: !!user,
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/customer/documents"],
    enabled: !!user,
  });

  const isLoading = authLoading || customerLoading || subscriptionLoading || documentsLoading;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getSubscriptionStatus = () => {
    if (!subscription) return { label: "No Active Plan", variant: "secondary" as const, icon: AlertCircle };
    
    const daysUntilExpiry = subscription.endDate 
      ? Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    switch (subscription.status) {
      case 'active':
        if (daysUntilExpiry <= 30) {
          return { label: `Expires in ${daysUntilExpiry} days`, variant: "destructive" as const, icon: AlertCircle };
        }
        return { label: "Active", variant: "default" as const, icon: CheckCircle2 };
      case 'inactive':
        return { label: "Inactive", variant: "destructive" as const, icon: AlertCircle };
      case 'cancelled':
        return { label: "Cancelled", variant: "secondary" as const, icon: AlertCircle };
      case 'trial':
        return { label: `Trial (${daysUntilExpiry} days left)`, variant: "secondary" as const, icon: Clock };
      default:
        return { label: "Pending", variant: "secondary" as const, icon: Clock };
    }
  };

  const statusInfo = getSubscriptionStatus();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">
          Welcome back, {user.firstName || 'there'}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Your medical document registry dashboard
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Documents Card */}
        <Card data-testid="card-documents-count">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-document-count">
                  {documents?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Securely stored
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Subscription Status Card */}
        <Card data-testid="card-subscription-status">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-subscription-status">
                  {statusInfo.label}
                </div>
                <p className="text-xs text-muted-foreground">
                  {subscription?.endDate 
                    ? `Until ${new Date(subscription.endDate).toLocaleDateString()}`
                    : 'No active subscription'
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* ID Card Status */}
        <Card data-testid="card-id-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ID Card</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-id-card-number">
                  {customer?.idCardNumber || 'Not Issued'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Registry number
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Profile Completeness */}
        <Card data-testid="card-profile">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {customer?.phone && customer?.address ? 'Complete' : 'Incomplete'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {customer?.phone && customer?.address ? 'All details added' : 'Add contact info'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button 
            variant="outline" 
            className="h-auto flex-col gap-2 py-4 hover-elevate"
            asChild
            data-testid="button-upload-document"
          >
            <a href="/customer/documents">
              <Upload className="h-6 w-6" />
              <span>Upload Document</span>
            </a>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto flex-col gap-2 py-4 hover-elevate"
            asChild
            data-testid="button-view-id-card"
          >
            <a href="/customer/id-card">
              <CreditCard className="h-6 w-6" />
              <span>View ID Card</span>
            </a>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto flex-col gap-2 py-4 hover-elevate"
            asChild
            data-testid="button-manage-subscription"
          >
            <a href="/customer/subscription">
              <CheckCircle2 className="h-6 w-6" />
              <span>Manage Subscription</span>
            </a>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto flex-col gap-2 py-4 hover-elevate"
            asChild
            data-testid="button-update-profile"
          >
            <a href="/customer/profile">
              <User className="h-6 w-6" />
              <span>Update Profile</span>
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>Your latest uploaded medical documents</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.slice(0, 5).map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center gap-4 p-3 rounded-lg border hover-elevate"
                  data-testid={`document-item-${doc.id}`}
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      Uploaded {new Date(doc.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild data-testid={`button-view-${doc.id}`}>
                    <a href={`/customer/documents?view=${doc.id}`}>View</a>
                  </Button>
                </div>
              ))}
              {documents.length > 5 && (
                <Button variant="ghost" asChild className="w-full" data-testid="button-view-all-documents">
                  <a href="/customer/documents">View all documents →</a>
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-2">
                <p className="font-medium">No documents yet</p>
                <p className="text-sm text-muted-foreground">
                  Upload your first medical document to get started
                </p>
              </div>
              <Button asChild data-testid="button-upload-first-document">
                <a href="/customer/documents">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
