import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Phone, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { Reseller, User } from "@shared/schema";

interface ResellerDetail extends Reseller {
  user: User;
}

interface ResellerDetailModalProps {
  resellerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResellerDetailModal({ resellerId, open, onOpenChange }: ResellerDetailModalProps) {
  const [, setLocation] = useLocation();

  const { data: reseller, isLoading } = useQuery<ResellerDetail>({
    queryKey: [`/api/resellers/${resellerId}`],
    enabled: !!resellerId && open,
  });

  if (!resellerId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? "Loading..." : `${reseller?.user.firstName} ${reseller?.user.lastName}`}
          </DialogTitle>
          <DialogDescription>
            Reseller ID: {resellerId}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : reseller ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{reseller.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company</span>
                  <span>{reseller.companyName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={reseller.status === 'active' ? 'default' : 'destructive'}>
                    {reseller.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tier</span>
                  <Badge variant="secondary">{reseller.tier || "Standard"}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact Group</span>
                  <span className="text-sm">{reseller.contactGroup || "—"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Customers</span>
                  <span className="font-medium">{reseller.totalCustomersReferred || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Documents</span>
                  <span className="font-medium">{reseller.totalDocumentsProcessed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-medium">${reseller.totalRevenueGenerated?.toFixed(2) || "0.00"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {reseller.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{reseller.phone}</span>
                  </div>
                )}
                {reseller.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div>{reseller.address}</div>
                      {reseller.city && (
                        <div>{reseller.city}, {reseller.state} {reseller.zipCode}</div>
                      )}
                    </div>
                  </div>
                )}
                {reseller.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={reseller.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {reseller.website}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-modal">
            Close
          </Button>
          <Button 
            onClick={() => {
              onOpenChange(false);
              setLocation(`/admin/resellers/${resellerId}`);
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
