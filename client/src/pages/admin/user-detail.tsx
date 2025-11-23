import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";

/**
 * AdminUserDetail Component
 * 
 * Edit individual user details and permissions.
 * 
 * Features:
 * - View and edit user profile information
 * - Change user role (admin, agent, reseller, customer)
 * - Update account status
 * - View account creation and last login dates
 * - Manage user permissions
 * - Delete user account (with confirmation)
 * 
 * URL Parameter: userId - The ID of the user to edit
 */
export default function AdminUserDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/users/:id");
  const { toast } = useToast();
  const userId = params?.id;
  
  const [formData, setFormData] = useState<Partial<User>>({});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch user data
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/admin/users", userId],
    enabled: !!userId,
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      });
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User ID required");
      return apiRequest("PATCH", `/api/admin/users/${userId}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User updated successfully!",
      });
      setShowSaveConfirm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User ID required");
      return apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully!",
      });
      setShowDeleteConfirm(false);
      setTimeout(() => setLocation("/admin/users"), 500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    setShowSaveConfirm(true);
  };

  const handleConfirmSave = () => {
    saveMutation.mutate();
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-32"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setLocation("/admin/users")}
          data-testid="button-back-to-users"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Edit User</CardTitle>
              <CardDescription>Update user profile and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Information</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName || ""}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName || ""}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    data-testid="input-email"
                  />
                </div>

              </div>

              {/* Role */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Role</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="role">User Role</Label>
                  <Select value={formData.role || ""} onValueChange={(value) => handleChange("role", value)}>
                    <SelectTrigger id="role" data-testid="select-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="reseller">Reseller</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-user"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-user"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteMutation.isPending ? "Deleting..." : "Delete User"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge variant="outline" className="mt-1 capitalize">
                  {formData.role || "unknown"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email Verified</p>
                <Badge variant={user?.emailVerified ? "default" : "secondary"} className="mt-1">
                  {user?.emailVerified ? "Verified" : "Not Verified"}
                </Badge>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium mt-1">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Login</p>
                <p className="text-sm font-medium mt-1">
                  {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Save Changes?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to save these changes? This will update the user's profile information.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} data-testid="button-confirm-save">
              Save Changes
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete User?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Are you sure you want to permanently delete this user account?
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete User
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
