import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Phone, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { Customer, User, Document, Subscription } from "@shared/schema";

interface CustomerNote {
  id: string;
  createdAt: Date;
  userId: string;
  customerId: string;
  noteText: string;
}

interface CustomerDetail extends Omit<Customer, 'notes'> {
  user: User;
  documents: Document[];
  subscription?: Subscription;
  notes: CustomerNote[];
}

interface CustomerDetailModalProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailModal({ customerId, open, onOpenChange }: CustomerDetailModalProps) {
  const [, setLocation] = useLocation();

  const { data: customer, isLoading } = useQuery<CustomerDetail>({
    queryKey: [`/api/admin/customers/${customerId}`],
    enabled: !!customerId && open,
  });

  if (!customerId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? "Loading..." : `${customer?.user.firstName} ${customer?.user.lastName}`}
          </DialogTitle>
          <DialogDescription>
            Customer ID: {customerId}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : customer ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{customer.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID Card Number</span>
                    <span className="font-mono">{customer.idCardNumber || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subscription Status</span>
                    <Badge variant={customer.subscription?.status === 'active' ? 'default' : 'secondary'}>
                      {customer.subscription?.status || 'None'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Documents</span>
                    <span className="font-medium">{customer.documents?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined</span>
                    <span>{new Date(customer.createdAt!).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <div>{customer.address}</div>
                        {customer.city && (
                          <div>{customer.city}, {customer.state} {customer.zipCode}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {customer.emergencyContactName && (
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-2">Emergency Contact</p>
                      <div className="text-sm space-y-1">
                        <div><span className="text-muted-foreground">Name:</span> {customer.emergencyContactName}</div>
                        {customer.emergencyContactPhone && (
                          <div><span className="text-muted-foreground">Phone:</span> {customer.emergencyContactPhone}</div>
                        )}
                        {customer.emergencyContactRelationship && (
                          <div><span className="text-muted-foreground">Relationship:</span> {customer.emergencyContactRelationship}</div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documents ({customer.documents?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.documents && customer.documents.length > 0 ? (
                    <div className="space-y-2">
                      {customer.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{doc.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(doc.uploadedAt!).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No documents uploaded</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-modal">
            Close
          </Button>
          <Button 
            onClick={() => {
              onOpenChange(false);
              setLocation(`/admin/customers/${customerId}`);
            }}
            data-testid="button-edit-full-page"
          >
            Edit Full Page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
