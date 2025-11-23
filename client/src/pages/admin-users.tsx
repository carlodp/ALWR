import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, Plus } from "lucide-react";
import { useState } from "react";
import { SectionHeader } from "@/components/section-header";
import { EmptyState } from "@/components/empty-state";
import { InputWithIcon } from "@/components/input-with-icon";
import type { User } from "@shared/schema";

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const filteredUsers = users?.filter((user) =>
    `${user.firstName} ${user.lastName} ${user.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <SectionHeader
        title="User Accounts"
        description="Manage all user accounts in the system"
        action={
          <Button 
            onClick={() => setLocation("/admin/users/new")}
            data-testid="button-create-user"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Search Accounts</CardTitle>
          <CardDescription>Search by name or email to filter users</CardDescription>
        </CardHeader>
        <CardContent>
          <InputWithIcon
            icon={Search}
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search"
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-20 animate-pulse" />
            ))}
          </>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={Search}
                title={searchTerm ? "No accounts match your search" : "No user accounts yet"}
                description={
                  searchTerm
                    ? "Try adjusting your search terms"
                    : "Get started by creating your first user account"
                }
                action={{
                  label: "Create User",
                  onClick: () => setLocation("/admin/users/new"),
                }}
              />
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card 
              key={user.id}
              className="hover-elevate"
              data-testid={`card-user-${user.id}`}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium" data-testid={`text-name-${user.id}`}>
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid={`text-email-${user.id}`}>
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <Badge variant="outline" data-testid={`badge-role-${user.id}`}>
                      {user.role}
                    </Badge>
                    {user.lastLoginAt && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        <span>Active</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
