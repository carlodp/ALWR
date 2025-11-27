import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";

interface PendingRegistration {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  title?: string;
  organization?: string;
  city?: string;
  state?: string;
  createdAt: string;
}

export default function AdminPendingRegistrations() {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);

  const { data: registrations, isLoading } = useQuery<PendingRegistration[]>({
    queryKey: ["/api/admin/pending-registrations"],
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("POST", `/api/admin/pending-registrations/${userId}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-registrations"] });
      toast({ title: "Registration approved" });
      setSelectedUserId(null);
      setAction(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("POST", `/api/admin/pending-registrations/${userId}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-registrations"] });
      toast({ title: "Registration rejected" });
      setSelectedUserId(null);
      setAction(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleApprove = (userId: string) => {
    setSelectedUserId(userId);
    setAction("approve");
  };

  const handleReject = (userId: string) => {
    setSelectedUserId(userId);
    setAction("reject");
  };

  const handleViewDetails = (registration: PendingRegistration) => {
    setSelectedRegistration(registration);
    setDetailModalOpen(true);
  };

  const confirmAction = () => {
    if (!selectedUserId || !action) return;

    if (action === "approve") {
      approveMutation.mutate(selectedUserId);
    } else {
      rejectMutation.mutate(selectedUserId);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Registrations</h1>
        <p className="text-muted-foreground">Review and approve new account registrations</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </CardContent>
        </Card>
      ) : !registrations || registrations.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">No pending registrations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {registrations.map((reg) => (
            <Card key={reg.userId} className="hover-elevate">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  {/* Name and Email */}
                  <div className="md:col-span-2">
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-base">
                        {reg.firstName} {reg.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{reg.email}</p>
                    </div>
                    {(reg.organization || reg.title) && (
                      <div className="mt-3 space-y-1 text-xs">
                        {reg.title && (
                          <p className="text-muted-foreground">{reg.title}</p>
                        )}
                        {reg.organization && (
                          <p className="text-muted-foreground">{reg.organization}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Applied Date */}
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Applied</p>
                    <p className="text-sm">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col gap-3 items-end">
                    <Badge variant="secondary">Pending</Badge>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewDetails(reg)}
                        variant="ghost"
                        size="sm"
                        data-testid={`button-view-details-${reg.userId}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleApprove(reg.userId)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        size="sm"
                        data-testid={`button-approve-${reg.userId}`}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(reg.userId)}
                        variant="outline"
                        size="sm"
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        data-testid={`button-reject-${reg.userId}`}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Registration Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>Complete information for review</DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Name</p>
                <p className="text-sm font-medium">
                  {selectedRegistration.firstName} {selectedRegistration.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Email</p>
                <p className="text-sm">{selectedRegistration.email}</p>
              </div>
              {selectedRegistration.phone && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Phone</p>
                  <p className="text-sm">{selectedRegistration.phone}</p>
                </div>
              )}
              {selectedRegistration.title && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Title</p>
                  <p className="text-sm">{selectedRegistration.title}</p>
                </div>
              )}
              {selectedRegistration.organization && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Organization</p>
                  <p className="text-sm">{selectedRegistration.organization}</p>
                </div>
              )}
              {selectedRegistration.city && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">City</p>
                  <p className="text-sm">{selectedRegistration.city}</p>
                </div>
              )}
              {selectedRegistration.state && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">State</p>
                  <p className="text-sm">{selectedRegistration.state}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Applied</p>
                <p className="text-sm">
                  {new Date(selectedRegistration.createdAt).toLocaleDateString()} at{" "}
                  {new Date(selectedRegistration.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!selectedUserId && !!action}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "approve" ? "Approve Registration?" : "Reject Registration?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === "approve"
                ? "This will approve the registration and activate the account."
                : "This will reject the registration. The user will not be able to access the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel onClick={() => { setSelectedUserId(null); setAction(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              {action === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
