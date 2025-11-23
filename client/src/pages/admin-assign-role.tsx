import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import type { User } from "@shared/schema";

const assignRoleSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
  role: z.enum(["customer", "agent", "reseller", "admin"]),
  // Customer fields
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  // Agent fields
  agencyName: z.string().optional(),
  agencyPhone: z.string().optional(),
  agencyAddress: z.string().optional(),
  licenseNumber: z.string().optional(),
  agencyCommissionRate: z.string().optional(),
  // Reseller fields
  companyName: z.string().optional(),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  taxId: z.string().optional(),
  partnerTier: z.enum(["standard", "premium", "enterprise"]).optional(),
  resellerCommissionRate: z.string().optional(),
  paymentTerms: z.string().optional(),
});

type AssignRoleForm = z.infer<typeof assignRoleSchema>;

export default function AdminAssignRole() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const form = useForm<AssignRoleForm>({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: {
      userId: "",
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

  const assignMutation = useMutation({
    mutationFn: async (data: AssignRoleForm) => {
      // Route based on selected role
      const endpoint = {
        agent: "/api/agents",
        reseller: "/api/resellers",
        customer: "/api/admin/customers",
        admin: "/api/admin/users/change-role",
      }[data.role];

      const payload = {
        agent: {
          userId: data.userId,
          agencyName: data.agencyName,
          agencyPhone: data.agencyPhone,
          agencyAddress: data.agencyAddress,
          licenseNumber: data.licenseNumber,
          commissionRate: data.agencyCommissionRate ? parseFloat(data.agencyCommissionRate) : undefined,
        },
        reseller: {
          userId: data.userId,
          companyName: data.companyName,
          companyPhone: data.companyPhone,
          companyAddress: data.companyAddress,
          taxId: data.taxId,
          partnerTier: data.partnerTier,
          commissionRate: data.resellerCommissionRate ? parseFloat(data.resellerCommissionRate) : undefined,
          paymentTerms: data.paymentTerms,
        },
        customer: {
          userId: data.userId,
          phone: data.customerPhone,
          address: data.customerAddress,
        },
        admin: {
          userId: data.userId,
          role: "admin",
        },
      }[data.role];

      const res = await apiRequest("POST", endpoint, payload);
      if (!res.ok) throw new Error(`Failed to assign ${data.role} role`);
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      toast({ title: `${variables.role} role assigned successfully` });
      setLocation("/admin/users");
    },
    onError: (error) => {
      toast({
        title: "Failed to assign role",
        description: error instanceof Error ? error.message : "Please check the form and try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AssignRoleForm) => {
    assignMutation.mutate(data);
  };

  const selectedUser = users?.find(u => u.id === selectedUserId);

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4 space-y-8">
      <Button
        variant="ghost"
        onClick={() => setLocation("/admin/users")}
        data-testid="button-back"
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Accounts
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Assign Role</h1>
        <p className="text-muted-foreground">Assign a role to a user account</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Select User */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select User</CardTitle>
              <CardDescription>Choose which user to assign a role to</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Account</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedUserId(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-user">
                            <SelectValue placeholder="Select a user..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users?.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {selectedUser && (
            <>
              {/* Step 2: Select Role */}
              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Select Role</CardTitle>
                  <CardDescription>Choose a role for {selectedUser.firstName} {selectedUser.lastName}</CardDescription>
                </CardHeader>
                <CardContent>
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
                            <SelectTrigger data-testid="select-role">
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
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Step 3: Role-Specific Fields */}
              {selectedRole && (
                <Card>
                  <CardHeader>
                    <CardTitle>Step 3: Role Details</CardTitle>
                    <CardDescription>Fill in details for the {selectedRole} role</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Customer Fields */}
                    {selectedRole === "customer" && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="customerPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="(555) 123-4567" {...field} data-testid="input-customerPhone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="customerAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main St, City, State 12345" {...field} data-testid="input-customerAddress" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Agent Fields */}
                    {selectedRole === "agent" && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="agencyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Agency Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Premier Healthcare Agency" {...field} data-testid="input-agencyName" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="agencyPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Agency Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="(555) 123-4567" {...field} data-testid="input-agencyPhone" />
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
                                  <Input placeholder="LIC-12345" {...field} data-testid="input-licenseNumber" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="agencyAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Agency Address</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main St, City, State 12345" {...field} data-testid="input-agencyAddress" />
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
                                <Input placeholder="15.5" {...field} data-testid="input-agencyCommissionRate" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Reseller Fields */}
                    {selectedRole === "reseller" && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., HealthDoc Solutions Inc" {...field} data-testid="input-companyName" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="companyPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="(555) 123-4567" {...field} data-testid="input-companyPhone" />
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
                                    <SelectTrigger data-testid="select-partnerTier">
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
                        </div>
                        <FormField
                          control={form.control}
                          name="companyAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Address</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Business Ave, City, State 12345" {...field} data-testid="input-companyAddress" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="taxId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tax ID (EIN)</FormLabel>
                                <FormControl>
                                  <Input placeholder="XX-XXXXXXX" {...field} data-testid="input-taxId" />
                                </FormControl>
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
                                  <Input placeholder="20.0" {...field} data-testid="input-resellerCommissionRate" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="paymentTerms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Terms</FormLabel>
                              <FormControl>
                                <Input placeholder="net30" {...field} data-testid="input-paymentTerms" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Admin Fields */}
                    {selectedRole === "admin" && (
                      <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                        Assigning admin role to {selectedUser.firstName} {selectedUser.lastName}. No additional fields required.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/admin/users")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={assignMutation.isPending || !selectedRole}
                  data-testid="button-assign-role"
                >
                  {assignMutation.isPending ? "Assigning..." : "Assign Role"}
                </Button>
              </div>
            </>
          )}
        </form>
      </Form>
    </div>
  );
}
