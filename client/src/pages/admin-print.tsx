import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Download, Copy, CreditCard, Phone, Globe, FileText, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

// Simple PDF generation library
function generateSimplePDF(cardContent: string, fileName: string) {
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
${cardContent.split('\n').map((line: string) => `(${line}) Tj\\n0 -20 Td`).join('\n')}
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

export default function AdminPrint() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  // Filter customers based on search query
  const filteredCustomers = customers?.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    const idCardMatch = customer.idCardNumber?.toLowerCase().includes(searchLower);
    return idCardMatch;
  }) || [];

  const printReady = filteredCustomers;
  const printed = customers?.slice(5, 10) || [];

  const handleDownloadCardPNG = (customer: Customer) => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 567;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 900, 567);
    gradient.addColorStop(0, "#2563eb");
    gradient.addColorStop(1, "#1e40af");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 900, 567);

    ctx.fillStyle = "white";
    ctx.font = "bold 32px Arial";
    ctx.fillText(customer.idCardNumber || "N/A", 50, 200);
    ctx.font = "14px Arial";
    ctx.fillText("ID Card", 50, 250);
    ctx.fillText("America Living Will Registry", 50, 300);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `alwr-id-card-${customer.idCardNumber}.png`;
    link.click();

    toast({ title: "ID Card downloaded as PNG" });
  };

  const handleDownloadCardPDF = (customer: Customer) => {
    if (!customer.idCardNumber) return;
    
    const cardInfo = [
      "America Living Will Registry",
      "Digital ID Card",
      "",
      `Registry Number: ${customer.idCardNumber}`,
      `Issued: ${customer.idCardIssuedDate ? new Date(customer.idCardIssuedDate).toLocaleDateString() : 'N/A'}`,
      "",
      "Emergency Access: alwr.org/emergency",
      "24/7 Support Available"
    ].join('\n');
    
    generateSimplePDF(cardInfo, `alwr-id-card-${customer.idCardNumber}.pdf`);
    toast({ title: "ID Card downloaded as PDF" });
  };

  const handlePrintCard = (customer: Customer) => {
    if (!customer.idCardNumber) return;
    const printWindow = window.open("", "", "height=600,width=900");
    if (!printWindow) return;
    
    const cardHTML = `
      <div style="width: 900px; height: 567px; background: linear-gradient(to right, #2563eb, #1e40af); color: white; padding: 24px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">${customer.idCardNumber}</div>
          <div style="font-size: 14px;">ALWR</div>
        </div>
        <div style="font-size: 12px; text-align: right; opacity: 0.9;">
          <div>Emergency: 24/7 Support</div>
          <div>alwr.org/emergency</div>
        </div>
      </div>
    `;

    printWindow.document.write("<html><head><title>ALWR ID Card - " + customer.idCardNumber + "</title></head><body>");
    printWindow.document.write(cardHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
    
    toast({ title: "Print dialog opened" });
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Membership Card Printing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage membership card design and printing</p>
        </div>
        <Button className="gap-2" data-testid="button-print-all">
          <Printer className="w-4 h-4" />
          Print All
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Card Template</CardTitle>
              <CardDescription>Current membership card design</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg max-w-md" data-testid="card-template-preview">
                <div className="text-sm opacity-75">AMERICA LIVING WILL REGISTRY</div>
                <div className="text-2xl font-bold mt-2">ID Card</div>
                <div className="mt-6 space-y-1">
                  <div className="text-sm">Name: [Customer Name]</div>
                  <div className="text-sm">ID: [Card Number]</div>
                  <div className="text-sm">Valid Thru: [Expiry Date]</div>
                </div>
                <div className="mt-6 text-xs opacity-75">Emergency: Call 1-800-ALWR-HELP</div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-edit-template">
                  Edit Template
                </Button>
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-download-template">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="print-ready" className="w-full">
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by card ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:outline-none"
                  data-testid="input-search-card"
                />
              </div>
              <TabsList className="w-full">
                <TabsTrigger value="print-ready" className="flex-1">
                  Ready to Print ({printReady.length})
                </TabsTrigger>
                <TabsTrigger value="printed" className="flex-1">
                  Printed ({printed.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="print-ready">
              {printReady.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-gray-600 dark:text-gray-400">No customers ready for printing</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {printReady.map((customer) => (
                    <Card key={customer.id} data-testid={`card-print-ready-${customer.id}`}>
                      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                        <div className="flex-1">
                          <CardTitle>Card #{customer.idCardNumber}</CardTitle>
                          <CardDescription className="mt-1">Status: Ready to Print</CardDescription>
                          <Badge variant="secondary" className="mt-2">Active</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            size="sm" 
                            className="gap-2" 
                            onClick={() => handlePrintCard(customer)}
                            data-testid={`button-print-${customer.id}`}
                          >
                            <Printer className="w-4 h-4" />
                            Print
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-2" 
                            onClick={() => setSelectedCard(customer)}
                            data-testid={`button-preview-${customer.id}`}
                          >
                            <Copy className="w-4 h-4" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="gap-2" 
                            onClick={() => handleDownloadCardPNG(customer)}
                            data-testid={`button-download-png-${customer.id}`}
                          >
                            <Download className="w-4 h-4" />
                            PNG
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="gap-2" 
                            onClick={() => handleDownloadCardPDF(customer)}
                            data-testid={`button-download-pdf-${customer.id}`}
                          >
                            <FileText className="w-4 h-4" />
                            PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="printed">
              {printed.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-gray-600 dark:text-gray-400">No printed cards</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {printed.map((customer) => (
                    <Card key={customer.id} data-testid={`card-printed-${customer.id}`}>
                      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                        <div className="flex-1">
                          <CardTitle>Card #{customer.idCardNumber}</CardTitle>
                          <Badge variant="default" className="mt-2">Printed</Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Card Preview Modal */}
      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle>ID Card Preview - {selectedCard?.idCardNumber}</DialogTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedCard(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {selectedCard && (
            <div className="space-y-6">
              {/* Card Display */}
              <div 
                className="relative w-full aspect-[1.586/1] rounded-xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-xl"
                data-testid="admin-card-preview"
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
                    <div className="text-2xl font-bold font-mono tracking-wider">
                      {selectedCard.idCardNumber}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="opacity-75">Issued</div>
                      <div className="font-medium">
                        {selectedCard.idCardIssuedDate 
                          ? new Date(selectedCard.idCardIssuedDate).toLocaleDateString()
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

              {/* Action Buttons */}
              <div className="flex gap-3 flex-col">
                <Button 
                  onClick={() => handleDownloadCardPNG(selectedCard)}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download as PNG
                </Button>
                <Button 
                  onClick={() => handleDownloadCardPDF(selectedCard)}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download as PDF
                </Button>
                <Button 
                  onClick={() => handlePrintCard(selectedCard)}
                  variant="outline"
                  className="w-full"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
