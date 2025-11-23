import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Info } from "lucide-react";

const editUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["customer", "agent", "reseller", "admin"]),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  agencyName: z.string().optional(),
  agencyPhone: z.string().optional(),
  agencyAddress: z.string().optional(),
  licenseNumber: z.string().optional(),
  agencyCommissionRate: z.string().optional(),
  companyName: z.string().optional(),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  taxId: z.string().optional(),
  partnerTier: z.enum(["standard", "premium", "enterprise"]).optional(),
  resellerCommissionRate: z.string().optional(),
  paymentTerms: z.string().optional(),
});

type EditUserForm = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  user: User | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  agentData?: any;
  resellerData?: any;
}

export function EditUserDialog({ 
  user, 
  isOpen, 
  onOpenChange,
  agentData,
  resellerData 
}: EditUserDialogProps) {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || "");

  const form = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      role: "customer",
      customerPhone: "",
      customerAddress: "",
      agencyName: "",
      agencyPhone: "",
      agencyAddress: "",
      licenseNumber: "",
      agencyCommissionRate: "",
      companyName: "",
      companyPhone: "",
      companyAddress: "",
      taxId: "",
      partnerTier: "standard",
      resellerCommissionRate: "",
      paymentTerms: "net30",
    },
  });

  // Update form values when user or related data changes
  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: user.role as any,
        customerPhone: "",
        customerAddress: "",
        agencyName: agentData?.agencyName || "",
        agencyPhone: agentData?.agencyPhone || "",
        agencyAddress: agentData?.agencyAddress || "",
        licenseNumber: agentData?.licenseNumber || "",
        agencyCommissionRate: agentData?.commissionRate?.toString() || "",
        companyName: resellerData?.companyName || "",
        companyPhone: resellerData?.companyPhone || "",
        companyAddress: resellerData?.companyAddress || "",
        taxId: resellerData?.taxId || "",
        partnerTier: resellerData?.partnerTier || "standard",
        resellerCommissionRate: resellerData?.commissionRate?.toString() || "",
        paymentTerms: resellerData?.paymentTerms || "net30",
      });
    }
  }, [user, agentData, resellerData, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: EditUserForm) => {
      if (!user?.id) throw new Error("User ID is required");

      const res = await apiRequest("PUT", `/api/admin/users/${user.id}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        agencyName: data.role === "agent" ? data.agencyName : undefined,
        agencyPhone: data.role === "agent" ? data.agencyPhone : undefined,
        agencyAddress: data.role === "agent" ? data.agencyAddress : undefined,
        licenseNumber: data.role === "agent" ? data.licenseNumber : undefined,
        agencyCommissionRate: data.role === "agent" ? (data.agencyCommissionRate ? parseFloat(data.agencyCommissionRate) : undefined) : undefined,
        companyName: data.role === "reseller" ? data.companyName : undefined,
        companyPhone: data.role === "reseller" ? data.companyPhone : undefined,
        companyAddress: data.role === "reseller" ? data.companyAddress : undefined,
        taxId: data.role === "reseller" ? data.taxId : undefined,
        partnerTier: data.role === "reseller" ? data.partnerTier : undefined,
        resellerCommissionRate: data.role === "reseller" ? (data.resellerCommissionRate ? parseFloat(data.resellerCommissionRate) : undefined) : undefined,
        paymentTerms: data.role === "reseller" ? data.paymentTerms : undefined,
      });

      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      toast({ title: "User updated successfully" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update user",
        description: error instanceof Error ? error.message : "Please check the form and try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditUserForm) => {
    updateMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>Update user information and role settings</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-firstName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-lastName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-muted-foreground">
                Email: {user.email}
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-sm">Role Settings</h3>
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedRole(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-role">
                          <SelectValue placeholder="Select a role..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="reseller">Reseller</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {selectedRole && (
                      <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <p className="text-muted-foreground">
                            {selectedRole === "customer" && "Individual or family account for storing healthcare directives"}
                            {selectedRole === "agent" && "Healthcare agency representative managing customer accounts"}
                            {selectedRole === "reseller" && "Business partner reselling ALWR services with commission rates"}
                            {selectedRole === "admin" && "Staff account with full system access and administrative privileges"}
                          </p>
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </div>

            {/* Agent Fields */}
            {selectedRole === "agent" && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm">Agent Details</h3>
                
                <FormField
                  control={form.control}
                  name="agencyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agency Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Premier Healthcare Agency" {...field} data-testid="input-edit-agencyName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agencyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agency Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} data-testid="input-edit-agencyPhone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agencyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agency Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, State 12345" {...field} data-testid="input-edit-agencyAddress" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="LIC-12345" {...field} data-testid="input-edit-licenseNumber" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agencyCommissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Rate (%)</FormLabel>
                      <FormControl>
                        <Input placeholder="15.5" {...field} data-testid="input-edit-agencyCommissionRate" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Reseller Fields */}
            {selectedRole === "reseller" && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm">Reseller Details</h3>
                
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., HealthDoc Solutions Inc" {...field} data-testid="input-edit-companyName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} data-testid="input-edit-companyPhone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Business Ave, City, State 12345" {...field} data-testid="input-edit-companyAddress" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID (EIN)</FormLabel>
                      <FormControl>
                        <Input placeholder="XX-XXXXXXX" {...field} data-testid="input-edit-taxId" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partnerTier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partner Tier</FormLabel>
                      <Select value={field.value || "standard"} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-partnerTier">
                            <SelectValue placeholder="Select tier..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resellerCommissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Rate (%)</FormLabel>
                      <FormControl>
                        <Input placeholder="20.0" {...field} data-testid="input-edit-resellerCommissionRate" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <FormControl>
                        <Input placeholder="net30" {...field} data-testid="input-edit-paymentTerms" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {selectedRole === "admin" && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm">Admin Role</h3>
                <p className="text-sm text-muted-foreground">The admin role grants full system access.</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-save-user"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
