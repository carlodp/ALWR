import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Download, Copy } from "lucide-react";
import type { Customer } from "@shared/schema";

export default function AdminPrint() {
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const printReady = customers?.slice(0, 5) || [];
  const printed = customers?.slice(5, 10) || [];

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
            <TabsList className="mb-6">
              <TabsTrigger value="print-ready">
                Ready to Print ({printReady.length})
              </TabsTrigger>
              <TabsTrigger value="printed">
                Printed ({printed.length})
              </TabsTrigger>
            </TabsList>

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
                        <div className="flex gap-2">
                          <Button size="sm" className="gap-2" data-testid={`button-print-${customer.id}`}>
                            <Printer className="w-4 h-4" />
                            Print
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2" data-testid={`button-preview-${customer.id}`}>
                            <Copy className="w-4 h-4" />
                            Preview
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
    </div>
  );
}
