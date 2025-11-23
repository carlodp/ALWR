import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Search, FileText, Lock, CreditCard, Shield, Upload, Eye } from "lucide-react";
import { useLocation } from "wouter";

interface Guide {
  id: string;
  title: string;
  category: string;
  description: string;
  steps: string[];
  tips?: string[];
  icon: any;
}

const GUIDES: Guide[] = [
  {
    id: "upload-documents",
    title: "How to Upload Documents",
    category: "Documents",
    description: "Learn how to securely upload your medical documents to ALWR",
    icon: Upload,
    steps: [
      "Log in to your ALWR account",
      "Navigate to the Documents section from the sidebar or dashboard",
      "Click the 'Upload Document' button",
      "Select your document file (PDF, DOC, or DOCX format)",
      "Choose the document type (Living Will, Healthcare Directive, etc.)",
      "Add optional description or notes",
      "Click 'Upload' to securely store your document",
      "Your document is now encrypted and stored safely",
    ],
    tips: [
      "Supported formats: PDF, Microsoft Word (DOC, DOCX)",
      "Maximum file size: 10MB",
      "You can upload multiple versions of the same document",
      "All documents are encrypted end-to-end",
    ],
  },
  {
    id: "enable-2fa",
    title: "Enable Two-Factor Authentication",
    category: "Security",
    description: "Protect your account with two-factor authentication (2FA)",
    icon: Lock,
    steps: [
      "Go to your Profile page from the dashboard",
      "Look for the 'Security Settings' section",
      "Click 'Enable Two-Factor Authentication'",
      "Choose your preferred method (authenticator app or email)",
      "If using an authenticator app: scan the QR code with Google Authenticator or Authy",
      "Enter the 6-digit code from your authenticator app",
      "Save backup codes in a secure location",
      "Your account is now protected with 2FA",
    ],
    tips: [
      "We recommend using an authenticator app over email",
      "Keep your backup codes in a safe place",
      "You'll need a 2FA code when logging in from new devices",
      "If you lose access, use your backup codes",
    ],
  },
  {
    id: "manage-subscription",
    title: "Manage Your Subscription",
    category: "Billing",
    description: "Upgrade, downgrade, or manage your ALWR subscription",
    icon: CreditCard,
    steps: [
      "Go to the Subscription page from the dashboard",
      "Review your current subscription plan and end date",
      "To upgrade: click 'Upgrade Plan' and select a new plan",
      "To downgrade: click 'Change Plan' and select a lower plan",
      "Review the pricing and confirm the change",
      "Your new plan takes effect immediately",
      "You can also cancel your subscription on this page",
      "Check the Payments section to view your invoices",
    ],
    tips: [
      "Upgrade changes take effect immediately",
      "Downgrades take effect at the end of your billing period",
      "You'll receive confirmation emails for all changes",
      "View your payment history and invoices anytime",
    ],
  },
  {
    id: "view-documents",
    title: "View and Manage Documents",
    category: "Documents",
    description: "Access, organize, and version control your documents",
    icon: FileText,
    steps: [
      "Go to the Documents page from the dashboard",
      "All your uploaded documents are listed here",
      "Click on a document to view its details",
      "To download: click the Download button",
      "To upload a new version: click 'Upload New Version'",
      "View version history by clicking 'Version History'",
      "To restore an older version: select it and click Restore",
      "To delete a document: click the Trash icon and confirm",
    ],
    tips: [
      "Keep multiple versions of important documents",
      "Add change notes when uploading new versions",
      "Deleted documents are permanently removed",
      "All document access is logged for audit purposes",
    ],
  },
  {
    id: "2fa-codes",
    title: "Backup Codes and Account Recovery",
    category: "Security",
    description: "Recover your account if you lose access to 2FA",
    icon: Shield,
    steps: [
      "Go to Profile > Security Settings",
      "Click 'View Backup Codes'",
      "Save your 10 backup codes in a secure location",
      "If you lose your 2FA device, use one backup code to login",
      "Each backup code can only be used once",
      "After using a backup code, regenerate new codes",
      "Store new codes in the same secure location",
    ],
    tips: [
      "Write down your backup codes and store them securely",
      "Keep them separate from your password",
      "You have 10 backup codes that refresh when regenerated",
      "Contact support if you've lost access to both 2FA and backup codes",
    ],
  },
  {
    id: "emergency-access",
    title: "Set Up Emergency Access",
    category: "Emergency",
    description: "Allow trusted contacts to access your documents in emergencies",
    icon: Eye,
    steps: [
      "Go to the Emergency Access page",
      "Click 'Add Emergency Contact'",
      "Enter the contact's name, email, and relationship",
      "Choose which documents they can access",
      "Set any access restrictions or conditions",
      "Save the emergency contact",
      "They'll receive a notification about the access",
      "You can revoke access anytime from this page",
    ],
    tips: [
      "Only add trusted family members or healthcare providers",
      "Document specific access can be limited",
      "Emergency contacts must accept the invitation",
      "You can revoke emergency access at any time",
    ],
  },
  {
    id: "view-id-card",
    title: "View and Download Your ID Card",
    category: "ID Card",
    description: "Access your digital ALWR ID card",
    icon: CreditCard,
    steps: [
      "Go to the ID Card page from the dashboard",
      "Your digital ID card is displayed",
      "Your unique ALWR registry number is shown",
      "Click 'Download' to save a PDF copy",
      "Click 'Order Physical Card' to request a printed card",
      "Physical cards arrive within 7-10 business days",
      "You can download your ID card anytime",
    ],
    tips: [
      "Your ID card number is unique to your account",
      "Present your ID card to emergency responders",
      "Physical cards are optional but helpful",
      "You can order multiple physical cards",
    ],
  },
  {
    id: "payment-history",
    title: "View Payment History and Invoices",
    category: "Billing",
    description: "Track your payments and download receipts",
    icon: CreditCard,
    steps: [
      "Go to the Payments page from the dashboard",
      "View all your invoices and payment history",
      "Each invoice shows the date, amount, and status",
      "Click 'Download' to get a PDF of any invoice",
      "Invoices are kept for your records",
      "You can view invoices for up to 7 years",
      "Contact support if you need help with invoices",
    ],
    tips: [
      "Invoices are automatically generated on your billing date",
      "Failed payments will show in your history",
      "You can download invoices anytime",
      "Keep invoices for tax and record-keeping purposes",
    ],
  },
];

const FAQS = [
  {
    question: "Is my personal data secure?",
    answer:
      "Yes. All your documents and personal information are encrypted with industry-standard encryption. ALWR is HIPAA-compliant and follows strict data protection regulations.",
  },
  {
    question: "How often should I update my documents?",
    answer:
      "We recommend reviewing and updating your medical documents annually, or whenever your healthcare situation changes significantly. Life events like surgeries, medication changes, or family status changes are good times to update.",
  },
  {
    question: "What if I forget my password?",
    answer:
      "Click 'Forgot Password' on the login page. You'll receive a secure reset link via email. Follow the link to create a new password.",
  },
  {
    question: "Can I have multiple emergency contacts?",
    answer:
      "Yes! You can add multiple emergency contacts. Each can have different access levels and permissions to your documents.",
  },
  {
    question: "What happens if my subscription expires?",
    answer:
      "Your documents remain securely stored, but you won't be able to upload new documents or make changes. You can renew your subscription anytime.",
  },
  {
    question: "How do I contact support?",
    answer:
      "Email our support team at support@alwr.org. We typically respond within 24 business hours. You can also reach out through your account settings.",
  },
  {
    question: "Can I download all my data?",
    answer:
      "Yes! Go to Account Settings and request a data export. You can export all your information in JSON, CSV, or PDF format.",
  },
  {
    question: "What file formats are supported?",
    answer:
      "We support PDF, Microsoft Word (DOC and DOCX), and text files. Maximum file size is 10MB per document.",
  },
];

export default function CustomerHelpCenter() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredGuides = GUIDES.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(GUIDES.map((g) => g.category)));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl py-4 px-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="-ml-2"
              data-testid="button-back-help"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">Help Center</h1>
              <p className="text-sm text-muted-foreground">Find answers and guides</p>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8">
        {/* Search */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guides and FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-6 text-base"
            data-testid="input-help-search"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge
            variant={!selectedCategory ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
            onClick={() => setSelectedCategory(null)}
            data-testid="badge-category-all"
          >
            All
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
              onClick={() => setSelectedCategory(cat)}
              data-testid={`badge-category-${cat.toLowerCase()}`}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {/* Guides */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold px-4">Guides & Tutorials</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {filteredGuides.length > 0 ? (
              filteredGuides.map((guide) => {
                const GuideIcon = guide.icon;
                return (
                  <Card key={guide.id} className="hover-elevate" data-testid={`card-guide-${guide.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <GuideIcon className="h-5 w-5 text-primary" />
                            {guide.title}
                          </CardTitle>
                          <CardDescription className="mt-2">{guide.description}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="whitespace-nowrap">
                          {guide.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <details className="group">
                          <summary className="cursor-pointer font-medium text-sm hover:text-primary transition-colors flex items-center gap-2">
                            <span>View {guide.steps.length} Steps</span>
                            <span className="group-open:hidden">→</span>
                            <span className="hidden group-open:inline">↓</span>
                          </summary>
                          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                            {guide.steps.map((step, i) => (
                              <li key={i} className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                                  {i + 1}
                                </span>
                                <span className="pt-0.5">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </details>

                        {guide.tips && (
                          <details className="group">
                            <summary className="cursor-pointer font-medium text-sm text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity flex items-center gap-2">
                              <span>💡 Tips & Tricks</span>
                              <span className="group-open:hidden">→</span>
                              <span className="hidden group-open:inline">↓</span>
                            </summary>
                            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                              {guide.tips.map((tip, i) => (
                                <li key={i} className="flex gap-2">
                                  <span>•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No guides found. Try different search terms.</p>
              </div>
            )}
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold px-4">Frequently Asked Questions</h2>
          <Card data-testid="card-faqs">
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {FAQS.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} data-testid={`accordion-faq-${i}`}>
                    <AccordionTrigger className="text-left font-medium hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Still need help? */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Still need help?</h3>
              <p className="text-blue-800 dark:text-blue-200">
                Our support team is here to help. Reach out anytime at{" "}
                <a href="mailto:support@alwr.org" className="font-medium hover:underline">
                  support@alwr.org
                </a>
              </p>
              <Button asChild variant="default" data-testid="button-contact-support">
                <a href="mailto:support@alwr.org">Contact Support</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
