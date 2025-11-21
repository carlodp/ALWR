import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Download, AlertCircle, Phone, Globe, ArrowLeft } from "lucide-react";
import type { Customer } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function CustomerIdCard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ["/api/customer/profile"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-8">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasIdCard = !!customer?.idCardNumber;

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="sm:hidden -ml-2"
          data-testid="button-back-mobile"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="space-y-2 flex-1">
          <h1 className="text-3xl md:text-4xl font-bold">Registry ID Card</h1>
          <p className="text-muted-foreground text-lg">
            Your ALWR identification card for emergency access
          </p>
        </div>
      </div>

      {!hasIdCard && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your ID card will be issued once your subscription is active. 
            Physical cards are mailed within 5-7 business days.
          </AlertDescription>
        </Alert>
      )}

      {/* Digital ID Card */}
      <Card>
        <CardHeader>
          <CardTitle>Digital ID Card</CardTitle>
          <CardDescription>
            {hasIdCard 
              ? "Save this to your phone or take a screenshot for quick access" 
              : "Your digital ID card will appear here once issued"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasIdCard ? (
            <>
              {/* ID Card Display */}
              <div 
                className="relative w-full max-w-md mx-auto aspect-[1.586/1] rounded-xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-xl"
                data-testid="card-id-display"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-8">
                  <div className="space-y-1">
                    <CreditCard className="h-8 w-8" />
                    <div className="text-xs font-medium">ALWR</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-bold">24/7 ACCESS</div>
                    <div className="opacity-90">Emergency Registry</div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-xs opacity-75">Registry Number</div>
                    <div className="text-2xl font-bold font-mono tracking-wider" data-testid="text-id-number">
                      {customer.idCardNumber}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="opacity-75">Name</div>
                      <div className="font-medium" data-testid="text-cardholder-name">
                        {user?.firstName} {user?.lastName}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="opacity-75">Issued</div>
                      <div className="font-medium" data-testid="text-issue-date">
                        {customer.idCardIssuedDate 
                          ? new Date(customer.idCardIssuedDate).toLocaleDateString()
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs opacity-90">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    <span>alwr.org/emergency</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>24/7 Support</span>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <div className="flex justify-center">
                <Button variant="outline" data-testid="button-download-card">
                  <Download className="h-4 w-4 mr-2" />
                  Download Card
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 space-y-4">
              <CreditCard className="h-16 w-16 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-2">
                <p className="font-medium text-lg">ID Card Not Yet Issued</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Your registry ID card will be generated once you have an active subscription.
                  Both digital and physical cards will be available.
                </p>
              </div>
              <Button asChild data-testid="button-activate-subscription">
                <a href="/customer/subscription">Activate Subscription</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      {hasIdCard && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>How to Use Your ID Card</CardTitle>
              <CardDescription>
                Important information for emergency situations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Keep in Your Wallet</p>
                    <p className="text-muted-foreground">
                      Carry your physical ID card with you at all times, or save the digital version to your phone
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Emergency Access</p>
                    <p className="text-muted-foreground">
                      Medical personnel can visit alwr.org/emergency and enter your registry number to access your documents
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">You'll Be Notified</p>
                    <p className="text-muted-foreground">
                      Receive instant notification whenever your documents are accessed in an emergency
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Physical Card Delivery</CardTitle>
              <CardDescription>
                Your physical ID card information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                A durable plastic ID card has been mailed to your address on file:
              </p>
              {customer.address && (
                <div className="bg-muted p-4 rounded-lg" data-testid="text-mailing-address">
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                  <p>{customer.address}</p>
                  <p>{customer.city}, {customer.state} {customer.zipCode}</p>
                </div>
              )}
              <p className="text-muted-foreground">
                Delivery typically takes 5-7 business days within the United States.
                If you need to update your mailing address, please visit your profile settings.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
