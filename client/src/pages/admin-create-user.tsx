import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { generatePassword, copyToClipboard } from "@/lib/passwordGenerator";
import { ArrowLeft, Copy, RotateCw } from "lucide-react";

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(12, "Password must be at least 12 characters"),
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

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function AdminCreateUser() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [passwordCopied, setPasswordCopied] = useState(false);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
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

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    form.setValue("password", newPassword, { shouldValidate: true });
    setPasswordCopied(false);
  };

  const handleCopyPassword = async () => {
    const password = form.getValues("password");
    if (password) {
      const success = await copyToClipboard(password);
      if (success) {
        setPasswordCopied(true);
        toast({ title: "Password copied to clipboard" });
        setTimeout(() => setPasswordCopied(false), 2000);
      } else {
        toast({ title: "Failed to copy password", variant: "destructive" });
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      const userRes = await apiRequest("POST", "/api/admin/users", {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      });
      if (!userRes.ok) throw new Error("Failed to create user");
      const user = await userRes.json();

      if (data.role !== "customer") {
        let endpoint = "";
        let payload: any = {};

        if (data.role === "agent") {
          endpoint = "/api/agents";
          payload = {
            userId: user.id,
            agencyName: data.agencyName,
            agencyPhone: data.agencyPhone,
            agencyAddress: data.agencyAddress,
            licenseNumber: data.licenseNumber,
            commissionRate: data.agencyCommissionRate ? parseFloat(data.agencyCommissionRate) : undefined,
          };
        } else if (data.role === "reseller") {
          endpoint = "/api/resellers";
          payload = {
            userId: user.id,
            companyName: data.companyName,
            companyPhone: data.companyPhone,
            companyAddress: data.companyAddress,
            taxId: data.taxId,
            partnerTier: data.partnerTier,
            commissionRate: data.resellerCommissionRate ? parseFloat(data.resellerCommissionRate) : undefined,
            paymentTerms: data.paymentTerms,
          };
        } else if (data.role === "admin") {
          endpoint = "/api/admin/users/change-role";
          payload = {
            userId: user.id,
            role: "admin",
          };
        }

        const roleRes = await apiRequest("POST", endpoint, payload);
        if (!roleRes.ok) throw new Error(`Failed to assign ${data.role} role`);
      }

      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      toast({ title: `User created successfully` });
      setLocation("/admin/users");
    },
    onError: (error) => {
      toast({
        title: "Failed to create user",
        description: error instanceof Error ? error.message : "Please check the form and try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUserForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4 space-y-8">
      <div>
        <Button
          variant="ghost"
          onClick={() => setLocation("/admin/users")}
          data-testid="button-back"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Accounts
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Create New Account</h1>
        <p className="text-muted-foreground">Create a user account and assign a role</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Basic Information</CardTitle>
              <CardDescription>Create the user account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} data-testid="input-firstName" />
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
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Smith" {...field} data-testid="input-lastName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            placeholder="Click 'Generate Password' to create a secure password" 
                            {...field} 
                            readOnly 
                            data-testid="input-password"
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleGeneratePassword}
                          data-testid="button-generate-password"
                          title="Generate a secure password"
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        {field.value && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleCopyPassword}
                            data-testid="button-copy-password"
                            title="Copy password to clipboard"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {field.value && (
                        <p className="text-xs text-muted-foreground">
                          Password: {field.value.length} characters
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Assign Role</CardTitle>
              <CardDescription>Choose a role for this user</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
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

          {selectedRole === "agent" && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Agent Details</CardTitle>
                <CardDescription>Fill in details for the agent role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          )}

          {selectedRole === "reseller" && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Reseller Details</CardTitle>
                <CardDescription>Fill in details for the reseller role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          )}

          {selectedRole === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Admin Role</CardTitle>
                <CardDescription>No additional fields required</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">The admin role grants full system access.</p>
              </CardContent>
            </Card>
          )}

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
              disabled={createMutation.isPending}
              data-testid="button-create-user"
            >
              {createMutation.isPending ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
