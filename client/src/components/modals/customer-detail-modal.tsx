import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Phone, MapPin, FileText, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  subscriptions: Subscription[];
  notes: CustomerNote[];
}

interface CustomerDetailModalProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailModal({ customerId, open, onOpenChange }: CustomerDetailModalProps) {
  const [, setLocation] = useLocation();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: customer, isLoading } = useQuery<CustomerDetail>({
    queryKey: [`/api/admin/customers/${customerId}`],
    enabled: !!customerId && open && isAdmin,
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
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
                    {customer.subscriptions && customer.subscriptions.length > 0 ? (
                      <Badge variant={customer.subscriptions[0].status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        {customer.subscriptions[0].status}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
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
                <CardContent className="space-y-4">
                  {(customer.phone || customer.address || customer.city) && (
                    <div className="grid gap-3 text-sm">
                      {customer.phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone</span>
                          <span className="font-medium">{customer.phone}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Address</span>
                          <div className="text-right">
                            <div>{customer.address}</div>
                            {customer.city && (
                              <div className="text-xs">{customer.city}, {customer.state} {customer.zipCode}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {customer.emergencyContactName && (
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-3">Emergency Contact</p>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-medium">{customer.emergencyContactName}</span>
                        </div>
                        {customer.emergencyContactPhone && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Phone</span>
                            <span className="font-medium">{customer.emergencyContactPhone}</span>
                          </div>
                        )}
                        {customer.emergencyContactRelationship && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Relationship</span>
                            <span className="font-medium">{customer.emergencyContactRelationship}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-0">
              {customer.subscriptions && customer.subscriptions.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                  {customer.subscriptions.map((sub, idx) => (
                    <div key={sub.id} className="p-3 rounded-lg border bg-muted/30 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{sub.status === 'active' ? 'Current' : 'Past'} Subscription</span>
                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'} className="text-xs capitalize">
                          {sub.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium">${((sub.amount || 0) / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Period:</span>
                          <span className="font-medium">{new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">No subscriptions found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documents ({customer.documents?.length || 0})</CardTitle>
                  <CardDescription className="text-xs">Click "View Full Details" to manage documents</CardDescription>
                </CardHeader>
                <CardContent>
                  {customer.documents && customer.documents.length > 0 ? (
                    <div className="space-y-2">
                      {customer.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(doc.uploadedAt!).toLocaleDateString()}
                              </p>
                            </div>
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
            View Full Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
