import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Agent, User } from "@shared/schema";

type AgentWithUser = Agent & {
  user: User;
};

export default function AdminAgents() {
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: agents, isLoading } = useQuery<AgentWithUser[]>({
    queryKey: ["/api/agents"],
    enabled: isAdmin,
  });

  const filteredAgents = agents?.filter((agent) => {
    const matchesSearch =
      agent.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.agencyName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      active: "default",
      inactive: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Agent Management</h1>
        <p className="text-muted-foreground text-lg">
          View and manage all registered agents
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>All Agents</CardTitle>
              <CardDescription>
                {agents?.length || 0} total agent{agents?.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-agents"
                />
              </div>
              <Button
                onClick={() => setLocation("/admin/agents/new")}
                data-testid="button-create-agent"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Agent
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAgents && filteredAgents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>License Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent) => (
                    <TableRow key={agent.id} data-testid={`row-agent-${agent.id}`}>
                      <TableCell className="font-medium">
                        {agent.user.firstName} {agent.user.lastName}
                      </TableCell>
                      <TableCell>{agent.agencyName || "-"}</TableCell>
                      <TableCell>{getStatusBadge(agent.status)}</TableCell>
                      <TableCell>{agent.totalCustomersAssigned || 0}</TableCell>
                      <TableCell>
                        {agent.licenseExpiresAt
                          ? new Date(agent.licenseExpiresAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/admin/agents/${agent.id}`)}
                          data-testid={`button-view-agent-${agent.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="space-y-2">
                <p className="font-medium">No agents found</p>
                <p className="text-sm text-muted-foreground">
                  Create a new agent to get started
                </p>
              </div>
              <Button onClick={() => setLocation("/admin/agents/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Agent
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
