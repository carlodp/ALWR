import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download, Trash2, Search, AlertCircle, ArrowLeft, History, ChevronDown, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Document } from "@shared/schema";

interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileUrl: string;
  createdAt: string;
  uploadedBy: string;
  changeNotes?: string;
}

/**
 * CustomerDocuments Component
 * 
 * Complete document management system for customers.
 * 
 * Key Features:
 * - Upload new documents (Living Will, Healthcare Directive, DNR, etc.)
 * - Version control: Track all document changes with timestamps
 * - Age tracking: Shows how old each document is (e.g., "3 months old")
 * - "Needs Review" alerts: Red badge for documents >1 year old
 * - Type-based filtering: Click document type badges to filter
 * - Real-time search: Search by filename across all documents
 * - Bulk selection: Select multiple documents for future operations
 * - Document details: View file size, upload date, and change notes
 * 
 * API Endpoints Used:
 * - GET /api/customer/documents - Fetch all documents
 * - POST /api/customer/documents - Upload new document
 * - GET /api/customer/documents/:id/versions - Fetch version history
 * - POST /api/customer/documents/:id/upload-version - Create new version
 * - DELETE /api/customer/documents/:id - Delete document
 * 
 * State Management:
 * - searchQuery: Filter documents by filename
 * - filterType: Filter by document type (null = all)
 * - selectedDocuments: Bulk selection with Set<string>
 * - expandedVersions: Track which document's versions are showing
 */
export default function CustomerDocuments() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("living_will");
  const [description, setDescription] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string | null>(null);

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/customer/documents"],
  });

  const [expandedVersions, setExpandedVersions] = useState<string | null>(null);
  const [versioningDocId, setVersioningDocId] = useState<string | null>(null);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionChangeNotes, setVersionChangeNotes] = useState("");

  const versionsQuery = useQuery<DocumentVersion[]>({
    queryKey: ["/api/customer/documents", expandedVersions, "versions"],
    enabled: !!expandedVersions,
    queryFn: async () => {
      const response = await fetch(`/api/customer/documents/${expandedVersions}/versions`);
      if (!response.ok) throw new Error("Failed to fetch versions");
      return response.json();
    },
  });

  const uploadVersionMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (!versionFile) throw new Error("No file selected");
      const formData = new FormData();
      formData.append("file", versionFile);
      formData.append("changeNotes", versionChangeNotes);
      const response = await apiRequest("POST", `/api/customer/documents/${documentId}/upload-version`, formData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Version uploaded",
        description: "New document version uploaded successfully.",
      });
      setVersioningDocId(null);
      setVersionFile(null);
      setVersionChangeNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/customer/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/documents", expandedVersions, "versions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document version.",
        variant: "destructive",
      });
    },
  });

  const restoreVersionMutation = useMutation({
    mutationFn: async ({ documentId, version }: { documentId: string; version: number }) => {
      const response = await apiRequest("POST", `/api/customer/documents/${documentId}/versions/${version}/restore`, {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Document restored",
        description: "Document version has been restored.",
      });
      setExpandedVersions(null);
      queryClient.invalidateQueries({ queryKey: ["/api/customer/documents"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Restore failed",
        description: error.message || "Failed to restore document version.",
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/customer/documents/upload", formData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Document uploaded",
        description: "Your document has been securely uploaded.",
      });
      setSelectedFile(null);
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/customer/documents"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiRequest("DELETE", `/api/customer/documents/${documentId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Document deleted",
        description: "Your document has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/documents"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getDocumentAge = (createdAt?: string) => {
    if (!createdAt) return { days: 0, label: "Recently added" };
    const now = new Date();
    const docDate = new Date(createdAt);
    const days = Math.floor((now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 1) return { days: 0, label: "Today" };
    if (days < 7) return { days, label: `${days} days old` };
    if (days < 30) return { days, label: `${Math.floor(days / 7)} weeks old` };
    if (days < 365) return { days, label: `${Math.floor(days / 30)} months old` };
    return { days, label: `${Math.floor(days / 365)} years old` };
  };

  const getNeedsReview = (createdAt?: string) => {
    if (!createdAt) return false;
    const days = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return days > 365; // Needs review if older than 1 year
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("fileType", documentType);
    formData.append("description", description);

    uploadMutation.mutate(formData);
  };

  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || doc.fileType === filterType;
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">My Documents</h1>
        <p className="text-muted-foreground text-lg">
          Manage your medical documents and healthcare directives
        </p>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Document</CardTitle>
          <CardDescription>
            Add a new medical document to your secure registry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Document File *</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    required
                    data-testid="input-file-upload"
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground" data-testid="text-selected-file">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, DOC, DOCX (Max 10MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-type">Document Type *</Label>
                <Select value={documentType} onValueChange={setDocumentType} required>
                  <SelectTrigger id="document-type" data-testid="select-document-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="living_will">Living Will</SelectItem>
                    <SelectItem value="healthcare_directive">Healthcare Directive</SelectItem>
                    <SelectItem value="power_of_attorney">Power of Attorney</SelectItem>
                    <SelectItem value="dnr">Do Not Resuscitate (DNR)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Add notes about this document..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-description"
              />
            </div>

            <Button
              type="submit"
              disabled={!selectedFile || uploadMutation.isPending}
              data-testid="button-submit-upload"
            >
              {uploadMutation.isPending ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Your Documents</CardTitle>
                <CardDescription>
                  {filteredDocuments?.length || 0} of {documents?.length || 0} document{documents?.length !== 1 ? 's' : ''} stored securely
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>

            {/* Filter by Type */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={!filterType ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterType(null)}
                data-testid="badge-filter-all"
              >
                All Types
              </Badge>
              {Array.from(new Set(documents?.map((d) => d.fileType) || [])).map((type) => (
                <Badge
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setFilterType(type)}
                  data-testid={`badge-filter-${type}`}
                >
                  {type?.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}
            </div>
          ) : filteredDocuments && filteredDocuments.length > 0 ? (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => {
                const age = getDocumentAge(doc.createdAt);
                const needsReview = getNeedsReview(doc.createdAt);
                return (
                <Collapsible key={doc.id} open={expandedVersions === doc.id} onOpenChange={(open) => setExpandedVersions(open ? doc.id : null)}>
                  <div
                    className="border rounded-lg hover-elevate"
                    data-testid={`document-card-${doc.id}`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 flex-shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium truncate" data-testid={`text-filename-${doc.id}`}>
                            {doc.fileName}
                          </h3>
                          {needsReview && (
                            <Badge variant="destructive" className="flex-shrink-0 gap-1" data-testid={`badge-needs-review-${doc.id}`}>
                              <AlertTriangle className="h-3 w-3" />
                              Needs Review
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="capitalize">{doc.fileType.replace(/_/g, ' ')}</span>
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {age.label}
                          </span>
                          {doc.currentVersion && doc.currentVersion > 1 && (
                            <span>v{doc.currentVersion}</span>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          data-testid={`button-download-${doc.id}`}
                        >
                          <a href={`/api/customer/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-versions-${doc.id}`}
                          >
                            <History className="h-4 w-4" />
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </CollapsibleTrigger>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this document?')) {
                              deleteMutation.mutate(doc.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${doc.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent className="border-t bg-muted/50 p-4">
                      {needsReview && (
                        <Alert className="mb-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <AlertDescription className="text-orange-800 dark:text-orange-100 ml-2">
                            This document hasn't been updated in over a year. Consider reviewing or updating it to ensure accuracy.
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="space-y-6">
                        {/* Upload New Version Section */}
                        {versioningDocId === doc.id ? (
                          <div className="border rounded-lg bg-background p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">Upload New Version</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setVersioningDocId(null);
                                  setVersionFile(null);
                                  setVersionChangeNotes("");
                                }}
                                data-testid={`button-cancel-version-${doc.id}`}
                              >
                                Cancel
                              </Button>
                            </div>
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor={`version-file-${doc.id}`} className="text-xs">
                                  New File *
                                </Label>
                                <Input
                                  id={`version-file-${doc.id}`}
                                  type="file"
                                  accept=".pdf,.doc,.docx"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 10 * 1024 * 1024) {
                                        toast({
                                          title: "File too large",
                                          description: "Maximum file size is 10MB",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      setVersionFile(file);
                                    }
                                  }}
                                  data-testid={`input-version-file-${doc.id}`}
                                />
                                {versionFile && (
                                  <p className="text-xs text-muted-foreground">
                                    Selected: {versionFile.name}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`change-notes-${doc.id}`} className="text-xs">
                                  Change Notes (Optional)
                                </Label>
                                <Input
                                  id={`change-notes-${doc.id}`}
                                  placeholder="Describe what changed in this version..."
                                  value={versionChangeNotes}
                                  onChange={(e) => setVersionChangeNotes(e.target.value)}
                                  data-testid={`input-change-notes-${doc.id}`}
                                />
                              </div>
                              <Button
                                size="sm"
                                onClick={() => uploadVersionMutation.mutate(doc.id)}
                                disabled={!versionFile || uploadVersionMutation.isPending}
                                className="w-full"
                                data-testid={`button-submit-version-${doc.id}`}
                              >
                                {uploadVersionMutation.isPending ? (
                                  <>Uploading...</>
                                ) : (
                                  <>
                                    <Upload className="h-3 w-3 mr-1" />
                                    Upload Version
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVersioningDocId(doc.id)}
                            className="w-full"
                            data-testid={`button-upload-new-version-${doc.id}`}
                          >
                            <Upload className="h-3 w-3 mr-2" />
                            Upload New Version
                          </Button>
                        )}

                        {/* Version History Section */}
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Version History</p>
                          {versionsQuery.isLoading ? (
                            <Skeleton className="h-10 w-full" />
                          ) : versionsQuery.data && versionsQuery.data.length > 0 ? (
                            <div className="space-y-2 text-sm">
                              {versionsQuery.data.map((version, idx) => (
                                <div key={version.id} className="flex items-center justify-between p-2 bg-background rounded border">
                                  <div>
                                    <p className="font-medium">Version {version.version}</p>
                                    <p className="text-muted-foreground text-xs">
                                      {new Date(version.createdAt).toLocaleString()}
                                    </p>
                                    {version.changeNotes && (
                                      <p className="text-muted-foreground text-xs mt-1">{version.changeNotes}</p>
                                    )}
                                  </div>
                                  {idx > 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => restoreVersionMutation.mutate({ documentId: doc.id, version: version.version })}
                                      disabled={restoreVersionMutation.isPending}
                                      data-testid={`button-restore-version-${doc.id}-${version.version}`}
                                    >
                                      Restore
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No previous versions</p>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
              })}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-2">
                <p className="font-medium text-lg">
                  {searchQuery ? 'No documents found' : 'No documents yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : 'Upload your first medical document to get started'
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HIPAA Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>HIPAA Compliance:</strong> All documents are encrypted and stored securely.
          Access to your documents is logged and you'll be notified of any emergency access.
        </AlertDescription>
      </Alert>
    </div>
  );
}
