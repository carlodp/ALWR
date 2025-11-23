import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, Plus } from "lucide-react";
import { useState } from "react";
import type { User } from "@shared/schema";

/**
 * AdminUsers Component
 * 
 * System user management for admins, agents, and resellers.
 * 
 * Features:
 * - View all system users in a table
 * - Search users by name or email
 * - View user roles (admin, agent, reseller, customer)
 * - See user creation date and last login
 * - Create new users
 * - Edit user roles and permissions
 * - View associated agents/resellers
 * 
 * API Endpoints:
 * - GET /api/admin/users - Fetch all system users
 * - GET /api/agents - Fetch agent accounts
 * - GET /api/resellers - Fetch reseller accounts
 */
export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: agents } = useQuery({
    queryKey: ["/api/agents"],
  });

  const { data: resellers } = useQuery({
    queryKey: ["/api/resellers"],
  });

  const filteredUsers = users?.filter((user) =>
    `${user.firstName} ${user.lastName} ${user.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) || [];

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
  };

  const getAgentData = (userId: string) => {
    const agentsList = Array.isArray(agents) ? agents : agents?.data;
    return agentsList?.find((a: any) => a.userId === userId);
  };

  const getResellerData = (userId: string) => {
    const resellersList = Array.isArray(resellers) ? resellers : resellers?.data;
    return resellersList?.find((r: any) => r.userId === userId);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Users</h1>
          <p className="text-muted-foreground">Manage admins, agents, and resellers</p>
        </div>
        <Button onClick={() => setLocation("/admin/users/new")} data-testid="button-create-user">
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Total: {filteredUsers.length} users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-users"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Role</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" data-testid={`badge-role-${user.id}`}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={user.accountStatus === "active" ? "default" : "secondary"}
                          data-testid={`badge-status-${user.id}`}
                        >
                          {user.accountStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/admin/users/${user.id}`)}
                          data-testid={`button-edit-user-${user.id}`}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
