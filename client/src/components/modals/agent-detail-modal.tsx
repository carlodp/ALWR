import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { Agent, User } from "@shared/schema";

interface AgentDetail extends Agent {
  user: User;
}

interface AgentDetailModalProps {
  agentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentDetailModal({ agentId, open, onOpenChange }: AgentDetailModalProps) {
  const [, setLocation] = useLocation();

  const { data: agent, isLoading } = useQuery<AgentDetail>({
    queryKey: [`/api/agents/${agentId}`],
    enabled: !!agentId && open,
  });

  if (!agentId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? "Loading..." : `${agent?.user.firstName} ${agent?.user.lastName}`}
          </DialogTitle>
          <DialogDescription>
            Agent ID: {agentId}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : agent ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{agent.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={agent.status === 'active' ? 'default' : 'destructive'}>
                    {agent.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agency Name</span>
                  <span>{agent.agencyName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent Type</span>
                  <Badge variant="secondary">{agent.agentType}</Badge>
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
                  <span className="font-medium">{agent.totalCustomersAssigned || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Documents</span>
                  <span className="font-medium">{agent.totalDocumentsProcessed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-medium">${agent.totalRevenueGenerated?.toFixed(2) || "0.00"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {agent.phone1 && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{agent.phone1}</span>
                  </div>
                )}
                {agent.address1 && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div>{agent.address1}</div>
                      {agent.city && (
                        <div>{agent.city}, {agent.state} {agent.zipCode}</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">License Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Number</span>
                  <span className="font-mono">{agent.licenseNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Expires</span>
                  <span>
                    {agent.licenseExpiresAt
                      ? new Date(agent.licenseExpiresAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commission Rate</span>
                  <span>{agent.commissionRate || 0}%</span>
                </div>
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
              setLocation(`/admin/agents/${agentId}`);
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
