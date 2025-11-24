import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileText, Mail, Phone, MapPin, AlertCircle, Save, Edit2, X, ArrowLeft, Trash2 } from "lucide-react";
import type { Customer, User, Document, Subscription } from "@shared/schema";

interface CustomerNote {
  id: string;
  createdAt: Date;
  userId: string;
  customerId: string;
  noteText: string;
}

interface CustomerDetail extends Omit<Customer, 'notes'> {
  user: User;
  documents: Document[];
  subscription?: Subscription;
  notes: CustomerNote[];
}

const noteSchema = z.object({
  noteText: z.string().min(1, "Note cannot be empty").max(1000, "Note is too long"),
});

const editCustomerSchema = z.object({
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  emergencyContactName: z.string().optional().or(z.literal("")),
  emergencyContactPhone: z.string().optional().or(z.literal("")),
  emergencyContactRelationship: z.string().optional().or(z.literal("")),
});

type NoteFormData = z.infer<typeof noteSchema>;
type EditCustomerData = z.infer<typeof editCustomerSchema>;

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);

  const noteForm = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { noteText: "" },
  });

  const editForm = useForm<EditCustomerData>({
    resolver: zodResolver(editCustomerSchema),
  });

  const { data: customer, isLoading } = useQuery<CustomerDetail>({
    queryKey: [`/api/admin/customers/${id}`],
    enabled: !!id && isAdmin,
  });

  // Update edit form when customer data loads
  useEffect(() => {
    if (customer && !isEditMode) {
      editForm.reset({
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        zipCode: customer.zipCode || "",
        emergencyContactName: customer.emergencyContactName || "",
        emergencyContactPhone: customer.emergencyContactPhone || "",
        emergencyContactRelationship: customer.emergencyContactRelationship || "",
      });
    }
  }, [customer, isEditMode, editForm]);

  const notesMutation = useMutation({
    mutationFn: async (noteText: string) => {
      const res = await apiRequest("POST", `/api/admin/customers/${id}/notes`, { noteText });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/customers/${id}`] });
      noteForm.reset();
      toast({ title: "Note added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add note", variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async (data: EditCustomerData) => {
      const res = await apiRequest("PUT", `/api/admin/customers/${id}`, data);
      if (!res.ok) throw new Error("Failed to update customer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/customers/${id}`] });
      toast({ title: "Customer updated successfully" });
      setIsEditMode(false);
    },
    onError: () => {
      toast({ title: "Failed to update customer", variant: "destructive" });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      const res = await apiRequest("DELETE", `/api/customer/documents/${docId}`);
      if (!res.ok) throw new Error("Failed to delete document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/customers/${id}`] });
      toast({ title: "Document deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete document", variant: "destructive" });
    },
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!customer?.subscription?.id) throw new Error("No subscription to delete");
      const res = await apiRequest("DELETE", `/api/admin/subscriptions/${customer.subscription.id}`);
      if (!res.ok) throw new Error("Failed to delete subscription");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/customers/${id}`] });
      toast({ title: "Subscription deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete subscription", variant: "destructive" });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/admin/customers/${id}`);
      if (!res.ok) throw new Error("Failed to delete customer");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Customer deleted successfully" });
      setLocation("/admin/customers");
    },
    onError: () => {
      toast({ title: "Failed to delete customer", variant: "destructive" });
    },
  });

  const onSubmitNote = async (data: NoteFormData) => {
    notesMutation.mutate(data.noteText);
  };

  const onSubmitEdit = async (data: EditCustomerData) => {
    editMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-8">
        <Skeleton className="h-12 w-48" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium">Customer not found</p>
                <p className="text-sm text-muted-foreground">The customer you're looking for doesn't exist</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/admin/customers")}
          className="sm:hidden -ml-2"
          data-testid="button-back-mobile"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="space-y-2 w-full sm:w-auto">
          <h1 className="text-3xl font-bold">
            {customer.user.firstName} {customer.user.lastName}
          </h1>
          <p className="text-muted-foreground">Customer ID: {customer.id.substring(0, 8)}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/admin/customers")}
            className="hidden sm:inline-flex"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {!isEditMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(true)}
              data-testid="button-edit-customer"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="documents">Documents ({customer.documents?.length || 0})</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="notes">Notes ({customer.notes?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          {isEditMode ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Customer Information</CardTitle>
                <CardDescription>Update customer contact and emergency information</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-6">
                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Contact Information</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={editForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="(555) 123-4567" {...field} data-testid="input-edit-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main St" {...field} data-testid="input-edit-address" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <FormField
                          control={editForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="New York" {...field} data-testid="input-edit-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="NY" {...field} data-testid="input-edit-state" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editForm.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input placeholder="10001" {...field} data-testid="input-edit-zipCode" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-medium">Emergency Contact</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={editForm.control}
                          name="emergencyContactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane Smith" {...field} data-testid="input-edit-ecName" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editForm.control}
                          name="emergencyContactRelationship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship</FormLabel>
                              <FormControl>
                                <Input placeholder="Spouse" {...field} data-testid="input-edit-ecRelationship" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={editForm.control}
                        name="emergencyContactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4568" {...field} data-testid="input-edit-ecPhone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditMode(false);
                          editForm.reset();
                        }}
                        data-testid="button-cancel-edit"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button type="submit" disabled={editMutation.isPending} data-testid="button-save-customer">
                        <Save className="h-4 w-4 mr-2" />
                        {editMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Customer details and emergency contact</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex gap-2 items-start">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="font-medium">{customer.user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        <p className="font-medium">{customer.phone || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 items-start">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {customer.address && `${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="font-medium">{customer.emergencyContactName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Relationship</p>
                      <p className="font-medium">{customer.emergencyContactRelationship || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="font-medium">{customer.emergencyContactPhone || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>ID Card Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID Card Number</p>
                <p className="font-mono font-medium">{customer.idCardNumber || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Issued Date</p>
                <p className="font-medium">
                  {customer.idCardIssuedDate ? new Date(customer.idCardIssuedDate).toLocaleDateString() : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>{customer.documents?.length || 0} documents uploaded</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.documents && customer.documents.length > 0 ? (
                <div className="space-y-3">
                  {customer.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover-elevate justify-between"
                      data-testid={`document-${doc.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {(doc.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(doc.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {doc.fileType.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteDocumentMutation.mutate(doc.id)}
                        disabled={deleteDocumentMutation.isPending}
                        data-testid={`button-delete-doc-${doc.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Subscription Status</CardTitle>
              </div>
              {customer.subscription && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteSubscriptionMutation.mutate()}
                  disabled={deleteSubscriptionMutation.isPending}
                  data-testid="button-delete-subscription"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.subscription ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className="capitalize mt-1">{customer.subscription.status}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">Amount</p>
                      <p className="text-lg font-bold">
                        ${((customer.subscription.amount || 0) / 100).toFixed(2)}/{customer.subscription.currency}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                      <p className="font-medium">
                        {new Date(customer.subscription.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">End Date</p>
                      <p className="font-medium">
                        {new Date(customer.subscription.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-sm text-muted-foreground mt-2">No active subscription</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Note</CardTitle>
              <CardDescription>Internal note for admin reference</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...noteForm}>
                <form onSubmit={noteForm.handleSubmit(onSubmitNote)} className="space-y-4">
                  <FormField
                    control={noteForm.control}
                    name="noteText"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Write a note about this customer..."
                            {...field}
                            data-testid="textarea-note"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={notesMutation.isPending} data-testid="button-add-note">
                    {notesMutation.isPending ? "Adding..." : "Add Note"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Notes</CardTitle>
              <CardDescription>{customer.notes?.length || 0} notes</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.notes && customer.notes.length > 0 ? (
                <div className="space-y-3">
                  {customer.notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-lg border space-y-1">
                      <p className="text-sm font-medium">{note.noteText}</p>
                      <p className="text-xs text-muted-foreground">
                        {note.createdAt ? new Date(note.createdAt).toLocaleString() : "Unknown date"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">No notes yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
