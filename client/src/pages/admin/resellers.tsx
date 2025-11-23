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
import type { Reseller, User } from "@shared/schema";

type ResellerWithUser = Reseller & {
  user: User;
};

export default function AdminResellers() {
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: resellers, isLoading } = useQuery<ResellerWithUser[]>({
    queryKey: ["/api/resellers"],
    enabled: isAdmin,
  });

  const filteredResellers = resellers?.filter((reseller) => {
    const matchesSearch =
      reseller.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reseller.user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reseller.user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reseller.companyName?.toLowerCase().includes(searchQuery.toLowerCase());
    
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
        <h1 className="text-3xl md:text-4xl font-bold">Reseller Management</h1>
        <p className="text-muted-foreground text-lg">
          View and manage all registered resellers
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>All Resellers</CardTitle>
              <CardDescription>
                {resellers?.length || 0} total reseller{resellers?.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resellers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-resellers"
                />
              </div>
              <Button
                onClick={() => setLocation("/admin/resellers/new")}
                data-testid="button-create-reseller"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Reseller
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
          ) : filteredResellers && filteredResellers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Customers Referred</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResellers.map((reseller) => (
                    <TableRow key={reseller.id} data-testid={`row-reseller-${reseller.id}`}>
                      <TableCell className="font-medium">
                        {reseller.user.firstName} {reseller.user.lastName}
                      </TableCell>
                      <TableCell>{reseller.companyName}</TableCell>
                      <TableCell>{getStatusBadge(reseller.status)}</TableCell>
                      <TableCell className="capitalize">{reseller.partnerTier || "standard"}</TableCell>
                      <TableCell>{reseller.totalCustomersReferred || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/admin/resellers/${reseller.id}`)}
                          data-testid={`button-view-reseller-${reseller.id}`}
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
                <p className="font-medium">No resellers found</p>
                <p className="text-sm text-muted-foreground">
                  Create a new reseller to get started
                </p>
              </div>
              <Button onClick={() => setLocation("/admin/resellers/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Reseller
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
