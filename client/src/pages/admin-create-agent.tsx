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

const createAgentSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
  agencyName: z.string().min(1, "Agency name is required"),
  agencyPhone: z.string().optional(),
  agencyAddress: z.string().optional(),
  licenseNumber: z.string().optional(),
  commissionRate: z.string().optional(),
});

type CreateAgentForm = z.infer<typeof createAgentSchema>;

export default function AdminCreateAgent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Fetch available users (those without an agent role)
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Filter users who don't already have an agent profile
  const availableUsers = users?.filter(user => {
    // You could add additional filtering here if needed
    return user.role === "customer";
  }) || [];

  const form = useForm<CreateAgentForm>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      userId: "",
      agencyName: "",
      agencyPhone: "",
      agencyAddress: "",
      licenseNumber: "",
      commissionRate: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateAgentForm) => {
      const res = await apiRequest("POST", "/api/agents", data);
      if (!res.ok) throw new Error("Failed to create agent");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: "Agent created successfully" });
      setLocation("/admin/agents");
    },
    onError: () => {
      toast({
        title: "Failed to create agent",
        description: "Please check the form and try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateAgentForm) => {
    createMutation.mutate(data);
  };

  const selectedUser = availableUsers.find(u => u.id === selectedUserId);

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 space-y-8">
      <Button
        variant="ghost"
        onClick={() => setLocation("/admin/agents")}
        data-testid="button-back"
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Agents
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Assign Agent Role</h1>
        <p className="text-muted-foreground">Convert an existing user to an agent</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select User</CardTitle>
          <CardDescription>Choose an existing user to assign as an agent</CardDescription>
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
            <CardTitle>Agent Information</CardTitle>
            <CardDescription>Additional details for {selectedUser.firstName} {selectedUser.lastName}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Required</h3>
                  <FormField
                    control={form.control}
                    name="agencyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agency Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Premier Healthcare Agency" {...field} data-testid="input-agencyName" />
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
                    name="commissionRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Rate (%)</FormLabel>
                        <FormControl>
                          <Input placeholder="15.5" {...field} data-testid="input-commissionRate" />
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
                    onClick={() => setLocation("/admin/agents")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-create-agent"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Agent"}
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
