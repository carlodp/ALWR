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

const createResellerSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
  companyName: z.string().min(1, "Company name is required"),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  taxId: z.string().optional(),
  partnerTier: z.enum(["standard", "premium", "enterprise"]).optional(),
  commissionRate: z.string().optional(),
  paymentTerms: z.string().optional(),
});

type CreateResellerForm = z.infer<typeof createResellerSchema>;

export default function AdminCreateReseller() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Fetch available users (those without a reseller role)
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Filter users who don't already have a reseller profile
  const availableUsers = users?.filter(user => {
    // You could add additional filtering here if needed
    return user.role === "customer";
  }) || [];

  const form = useForm<CreateResellerForm>({
    resolver: zodResolver(createResellerSchema),
    defaultValues: {
      userId: "",
      companyName: "",
      companyPhone: "",
      companyAddress: "",
      taxId: "",
      partnerTier: "standard",
      commissionRate: "",
      paymentTerms: "net30",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateResellerForm) => {
      const res = await apiRequest("POST", "/api/resellers", data);
      if (!res.ok) throw new Error("Failed to create reseller");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      toast({ title: "Reseller created successfully" });
      setLocation("/admin/resellers");
    },
    onError: () => {
      toast({
        title: "Failed to create reseller",
        description: "Please check the form and try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateResellerForm) => {
    createMutation.mutate(data);
  };

  const selectedUser = availableUsers.find(u => u.id === selectedUserId);

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 space-y-8">
      <Button
        variant="ghost"
        onClick={() => setLocation("/admin/resellers")}
        data-testid="button-back"
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Resellers
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Assign Reseller Role</h1>
        <p className="text-muted-foreground">Convert an existing user to a reseller partner</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select User</CardTitle>
          <CardDescription>Choose an existing user to assign as a reseller</CardDescription>
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
                  <FormLabel>User</FormLabel>
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
                      {availableUsers.map((user) => (
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
        <Card>
          <CardHeader>
            <CardTitle>Reseller Information</CardTitle>
            <CardDescription>Additional details for {selectedUser.firstName} {selectedUser.lastName}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Required</h3>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., HealthDoc Solutions Inc" {...field} data-testid="input-companyName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">Optional</h3>
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
                      name="commissionRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commission Rate (%)</FormLabel>
                          <FormControl>
                            <Input placeholder="20.0" {...field} data-testid="input-commissionRate" />
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

                <div className="flex gap-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/admin/resellers")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-create-reseller"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Reseller"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
