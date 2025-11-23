import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle } from "lucide-react";

const profileSetupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileSetupForm = z.infer<typeof profileSetupSchema>;

export default function ProfileSetup() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const form = useForm<ProfileSetupForm>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: "",
      address: "",
    },
  });

  // Auto-redirect if not authenticated or if profile is complete
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    } else if (user?.firstName && user?.lastName) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || !user) return null;

  const progress = (step / 2) * 100;

  const onSubmit = async (data: ProfileSetupForm) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("/api/customer/profile", {
        method: "PUT",
        body: JSON.stringify({
          phone: data.phone,
          address: data.address,
        }),
      });

      if (response.ok) {
        setIsComplete(true);
        await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
        toast({ title: "Profile completed successfully" });
        setTimeout(() => setLocation("/"), 2000);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Profile setup error:", error);
      toast({
        title: "Error",
        description: "An error occurred during profile setup",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Complete Your Profile</h1>
            <span className="text-sm text-muted-foreground">Step {step} of 2</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? "Basic Information" : "Additional Details"}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? "Help us know who you are"
                : "Optional: Add contact and address information"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isComplete ? (
              <div className="space-y-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <p className="font-semibold">Profile Complete!</p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to dashboard...
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {step === 1 && (
                    <>
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="John"
                                {...field}
                                data-testid="input-firstname"
                                disabled={isSubmitting}
                              />
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
                              <Input
                                placeholder="Doe"
                                {...field}
                                data-testid="input-lastname"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setLocation("/")}
                          data-testid="button-skip"
                        >
                          Skip for Now
                        </Button>
                        <Button
                          type="button"
                          className="flex-1"
                          onClick={() => setStep(2)}
                          data-testid="button-next"
                        >
                          Next
                        </Button>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+1 (555) 123-4567"
                                type="tel"
                                {...field}
                                data-testid="input-phone"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="123 Main St, City, State 12345"
                                {...field}
                                data-testid="input-address"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setStep(1)}
                          disabled={isSubmitting}
                          data-testid="button-back"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={isSubmitting}
                          data-testid="button-complete"
                        >
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isSubmitting ? "Saving..." : "Complete"}
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
