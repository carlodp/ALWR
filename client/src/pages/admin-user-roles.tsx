import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { Shield, Users, AlertCircle, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "customer" | "admin" | "agent";
  createdAt: string;
};

export default function AdminUserRoles() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  }, [isAdmin, authLoading, toast]);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User role updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update role", variant: "destructive" });
    },
  });

  if (authLoading || !isAdmin) {
    return null;
  }

  const admins = users?.filter(u => u.role === "admin") || [];
  const agents = users?.filter(u => u.role === "agent") || [];
  const customers = users?.filter(u => u.role === "customer") || [];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "agent":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-3 w-3" />;
      case "agent":
        return <Users className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">User Role Management</h1>
        <p className="text-muted-foreground text-lg">
          Manage user roles and permissions across the system
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Admins have full system access. Agents can manage customers and documents. Customers can only access their own data.
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card data-testid="card-admin-count">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-admin-count">
                  {admins.length}
                </div>
                <p className="text-xs text-muted-foreground">System administrators</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-agent-count">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-agent-count">
                  {agents.length}
                </div>
                <p className="text-xs text-muted-foreground">Support staff</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-customer-count">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-customer-count">
                  {customers.length}
                </div>
                <p className="text-xs text-muted-foreground">Regular users</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card data-testid="card-users-table">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View and manage user roles</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-users"
                />
              </div>
              <select
                value={roleFilter || ''}
                onChange={(e) => setRoleFilter(e.target.value || null)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                data-testid="filter-user-role"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="agent">Agent</option>
                <option value="customer">Customer</option>
              </select>
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
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Change Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="hover-elevate"
                      data-testid={`user-row-${user.id}`}
                    >
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleIcon(user.role) && (
                            <>
                              {getRoleIcon(user.role)}
                              <span className="ml-1" />
                            </>
                          )}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => {
                            if (confirm(`Change role from ${user.role} to ${newRole}?`)) {
                              updateRoleMutation.mutate({ userId: user.id, role: newRole });
                            }
                          }}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-32" data-testid={`select-role-${user.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <Users className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-2">
                <p className="font-medium">No users found</p>
                <p className="text-sm text-muted-foreground">
                  Users will appear here as they join the system
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
