import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertCircle, CheckCircle2, FileText, Download, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type VerificationData = {
  idCardNumber: string;
  lastName: string;
  birthYear: string;
};

type AccessorInfo = {
  accessorName: string;
  accessorRole: string;
  accessorOrganization: string;
  accessorPhone: string;
};

type EmergencyDocument = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  downloadUrl: string;
};

export default function EmergencyAccess() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [verificationData, setVerificationData] = useState<VerificationData>({
    idCardNumber: "",
    lastName: "",
    birthYear: "",
  });
  const [accessorInfo, setAccessorInfo] = useState<AccessorInfo>({
    accessorName: "",
    accessorRole: "",
    accessorOrganization: "",
    accessorPhone: "",
  });
  const [documents, setDocuments] = useState<EmergencyDocument[]>([]);

  const verifyMutation = useMutation({
    mutationFn: async (data: VerificationData & AccessorInfo) => {
      const response = await apiRequest("POST", "/api/emergency-access/verify", data);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.documents) {
        setDocuments(data.documents);
        setStep(3);
        toast({
          title: "Access Granted",
          description: "Verification successful. Documents are now accessible.",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Unable to verify credentials. Please check your information.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify credentials. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationData.idCardNumber || !verificationData.lastName || !verificationData.birthYear) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessorInfo.accessorName || !accessorInfo.accessorRole) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and role.",
        variant: "destructive",
      });
      return;
    }
    verifyMutation.mutate({ ...verificationData, ...accessorInfo });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-destructive" />
            <span className="text-xl font-bold">ALWR Emergency Access</span>
          </div>
          <Button variant="outline" asChild data-testid="button-back-login">
            <a href="/login">Back to Login</a>
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl py-12 px-4 space-y-8">
        {/* Warning Banner */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            <strong>EMERGENCY ACCESS ONLY:</strong> This portal is for authorized medical personnel to access patient documents in emergency situations.
            All access is logged and the patient will be notified.
          </AlertDescription>
        </Alert>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} font-bold text-sm`}>
              1
            </div>
            <span className={`text-sm font-medium ${step >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
              Verify Patient
            </span>
          </div>
          <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} font-bold text-sm`}>
              2
            </div>
            <span className={`text-sm font-medium ${step >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
              Accessor Info
            </span>
          </div>
          <div className={`h-0.5 w-12 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} font-bold text-sm`}>
              3
            </div>
            <span className={`text-sm font-medium ${step >= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
              Documents
            </span>
          </div>
        </div>

        {/* Step 1: Patient Verification */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Verify Patient Identity</CardTitle>
              <CardDescription>
                Enter the patient's registry information from their ID card
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep1Submit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="idCardNumber">Registry Number *</Label>
                  <Input
                    id="idCardNumber"
                    placeholder="ALWR-XXXX-XXXX-XXXX"
                    value={verificationData.idCardNumber}
                    onChange={(e) => setVerificationData({ ...verificationData, idCardNumber: e.target.value.toUpperCase() })}
                    required
                    data-testid="input-id-card-number"
                  />
                  <p className="text-xs text-muted-foreground">
                    Located on the patient's ALWR ID card
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Patient Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={verificationData.lastName}
                    onChange={(e) => setVerificationData({ ...verificationData, lastName: e.target.value })}
                    required
                    data-testid="input-last-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthYear">Year of Birth *</Label>
                  <Input
                    id="birthYear"
                    type="number"
                    placeholder="1980"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={verificationData.birthYear}
                    onChange={(e) => setVerificationData({ ...verificationData, birthYear: e.target.value })}
                    required
                    data-testid="input-birth-year"
                  />
                </div>

                <Button type="submit" className="w-full" data-testid="button-verify-patient">
                  Continue to Next Step
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Accessor Information */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Provide Your Information</CardTitle>
              <CardDescription>
                This information will be logged and sent to the patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep2Submit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="accessorName">Your Full Name *</Label>
                  <Input
                    id="accessorName"
                    placeholder="Dr. Jane Smith"
                    value={accessorInfo.accessorName}
                    onChange={(e) => setAccessorInfo({ ...accessorInfo, accessorName: e.target.value })}
                    required
                    data-testid="input-accessor-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessorRole">Your Role *</Label>
                  <Input
                    id="accessorRole"
                    placeholder="Emergency Room Physician, EMT, Nurse, etc."
                    value={accessorInfo.accessorRole}
                    onChange={(e) => setAccessorInfo({ ...accessorInfo, accessorRole: e.target.value })}
                    required
                    data-testid="input-accessor-role"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessorOrganization">Organization</Label>
                  <Input
                    id="accessorOrganization"
                    placeholder="Hospital Name, EMS Unit, etc."
                    value={accessorInfo.accessorOrganization}
                    onChange={(e) => setAccessorInfo({ ...accessorInfo, accessorOrganization: e.target.value })}
                    data-testid="input-accessor-organization"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessorPhone">Contact Phone</Label>
                  <Input
                    id="accessorPhone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={accessorInfo.accessorPhone}
                    onChange={(e) => setAccessorInfo({ ...accessorInfo, accessorPhone: e.target.value })}
                    data-testid="input-accessor-phone"
                  />
                </div>

                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    By proceeding, you acknowledge that this access is for legitimate medical purposes only.
                    Unauthorized access is prohibited and may be subject to legal action.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    data-testid="button-back"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={verifyMutation.isPending}
                    className="flex-1"
                    data-testid="button-access-documents"
                  >
                    {verifyMutation.isPending ? "Verifying..." : "Access Documents"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Access Granted:</strong> Patient notification has been sent. Documents are available for download below.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Available Documents</CardTitle>
                <CardDescription>
                  Medical directives and healthcare documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover-elevate"
                        data-testid={`document-${doc.id}`}
                      >
                        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 flex-shrink-0">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{doc.fileName}</h3>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span className="capitalize">{doc.fileType.replace(/_/g, ' ')}</span>
                            <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                          </div>
                        </div>
                        <Button asChild data-testid={`button-download-${doc.id}`}>
                          <a href={doc.downloadUrl} download>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      No documents found for this patient
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>HIPAA Notice:</strong> This access has been logged. The patient and emergency contact have been notified.
                Please handle these documents in accordance with patient privacy regulations.
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Security Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Encrypted Access</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Audit Logged</span>
          </div>
        </div>
      </div>
    </div>
  );
}
