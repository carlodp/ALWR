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

interface PendingRegistration {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
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

  const confirmAction = () => {
    if (!selectedUserId || !action) return;

    if (action === "approve") {
      approveMutation.mutate(selectedUserId);
    } else {
      rejectMutation.mutate(selectedUserId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Registrations</h1>
        <p className="text-muted-foreground">Review and approve new account registrations</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        </div>
      ) : !registrations || registrations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No pending registrations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {registrations.map((reg) => (
            <Card key={reg.userId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {reg.firstName} {reg.lastName}
                    </CardTitle>
                    <CardDescription>{reg.email}</CardDescription>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 mb-4">
                  {reg.title && (
                    <div>
                      <p className="text-sm font-medium">Title</p>
                      <p className="text-sm text-muted-foreground">{reg.title}</p>
                    </div>
                  )}
                  {reg.organization && (
                    <div>
                      <p className="text-sm font-medium">Organization</p>
                      <p className="text-sm text-muted-foreground">{reg.organization}</p>
                    </div>
                  )}
                  {(reg.city || reg.state) && (
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {reg.city}
                        {reg.city && reg.state ? ", " : ""}
                        {reg.state}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">Applied</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(reg.userId)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    data-testid={`button-approve-${reg.userId}`}
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(reg.userId)}
                    variant="outline"
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    data-testid={`button-reject-${reg.userId}`}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
