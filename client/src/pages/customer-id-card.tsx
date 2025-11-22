import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Download, AlertCircle, Phone, Globe, ArrowLeft, Printer, FileText } from "lucide-react";
import type { Customer } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

// Simple PDF generation library
function generateSimplePDF(cardContent: string, fileName: string) {
  // Create a simple PDF document
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>
endobj
4 0 obj
<< /Length 800 >>
stream
BT
/F1 24 Tf
50 700 Td
(America Living Will Registry) Tj
0 -40 Td
/F1 16 Tf
(Digital ID Card) Tj
0 -40 Td
/F1 12 Tf
${cardContent.split('\n').map((line: string, i: number) => `(${line}) Tj\\n0 -20 Td`).join('\n')}
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000263 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
1100
%%EOF`;

  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

export default function CustomerIdCard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ["/api/customer/profile"],
    enabled: !!user,
  });

  const handleDownloadCard = () => {
    if (!customer?.idCardNumber) return;
    
    const element = document.getElementById("id-card-printable");
    if (!element) return;

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 567;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 900, 567);
    gradient.addColorStop(0, "#2563eb");
    gradient.addColorStop(1, "#1e40af");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 900, 567);

    // Draw text
    ctx.fillStyle = "white";
    ctx.font = "bold 32px Arial";
    ctx.fillText(customer.idCardNumber, 50, 200);
    ctx.font = "14px Arial";
    ctx.fillText(`${user?.firstName} ${user?.lastName}`, 50, 250);
    ctx.fillText("Emergency Registry ID Card", 50, 300);

    // Download
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `alwr-id-card-${customer.idCardNumber}.png`;
    link.click();

    toast({ title: "ID Card downloaded" });
  };

  const handlePrintCard = () => {
    if (!customer?.idCardNumber) return;
    const printWindow = window.open("", "", "height=600,width=900");
    if (!printWindow) return;
    
    const element = document.getElementById("id-card-printable");
    if (!element) return;

    printWindow.document.write("<html><head><title>ALWR ID Card</title></head><body>");
    printWindow.document.write(element.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
    
    toast({ title: "Print dialog opened" });
  };

  const handleDownloadPDF = () => {
    if (!customer?.idCardNumber || !user) return;
    
    const cardInfo = [
      "America Living Will Registry",
      "Digital ID Card",
      "",
      `Registry Number: ${customer.idCardNumber}`,
      `Name: ${user.firstName} ${user.lastName}`,
      `Issued: ${customer.idCardIssuedDate ? new Date(customer.idCardIssuedDate).toLocaleDateString() : 'N/A'}`,
      "",
      "Emergency Access: alwr.org/emergency",
      "24/7 Support Available"
    ].join('\n');
    
    generateSimplePDF(cardInfo, `alwr-id-card-${customer.idCardNumber}.pdf`);
    toast({ title: "ID Card downloaded as PDF" });
  };

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
                id="id-card-printable"
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

              {/* Download & Print Buttons */}
              <div className="flex gap-4 mt-8 flex-col sm:flex-row justify-center flex-wrap">
                <Button 
                  variant="outline" 
                  onClick={handleDownloadCard}
                  data-testid="button-download-card-png"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download (PNG)
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadPDF}
                  data-testid="button-download-card-pdf"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download (PDF)
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handlePrintCard}
                  data-testid="button-print-card"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
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
