import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, loadUser, requireAuth, requireAdmin } from "./replitAuth";
import { getUncachableStripeClient, getProductByPriceId } from "./stripeClient";
import multer from "multer";
import { randomUUID } from "crypto";
import type { User } from "@shared/schema";
import { 
  insertCustomerSchema, 
  insertDocumentSchema,
  insertEmergencyAccessLogSchema,
  insertSubscriptionSchema 
} from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'));
    }
  },
});

// Helper to generate ID card number
function generateIdCardNumber(): string {
  const prefix = 'ALWR';
  const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const part3 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${part1}-${part2}-${part3}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication first
  await setupAuth(app);
  
  // Apply loadUser middleware to all routes
  app.use(loadUser);

  // ============================================================================
  // AUTHENTICATION ROUTES
  // ============================================================================

  // Get current user
  app.get("/api/auth/user", async (req: any, res: Response) => {
    try {
      if (!req.user?.dbUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      res.json(req.user.dbUser);
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============================================================================
  // CUSTOMER PROFILE ROUTES
  // ============================================================================

  // Get customer profile
  app.get("/api/customer/profile", requireAuth, async (req: any, res: Response) => {
    try {
      let customer = await storage.getCustomer(req.user.dbUser.id);
      
      // Auto-create customer profile if it doesn't exist
      if (!customer) {
        customer = await storage.createCustomer({
          userId: req.user.dbUser.id,
          idCardNumber: generateIdCardNumber(),
          idCardIssuedDate: new Date(),
        });
      }
      
      res.json(customer);
    } catch (error) {
      console.error("Error getting customer profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update customer profile
  app.put("/api/customer/profile", requireAuth, async (req: any, res: Response) => {
    try {
      const customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Validate request body
      const updateSchema = insertCustomerSchema.partial().omit({ userId: true, id: true });
      const validatedData = updateSchema.parse(req.body);

      const updated = await storage.updateCustomer(customer.id, validatedData);
      
      // Log profile update
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'profile_update',
        resourceType: 'customer',
        resourceId: customer.id,
        details: validatedData,
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ============================================================================
  // SUBSCRIPTION ROUTES
  // ============================================================================

  // Get customer subscription
  app.get("/api/customer/subscription", requireAuth, async (req: any, res: Response) => {
    try {
      const customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const subscription = await storage.getSubscription(customer.id);
      res.json(subscription || null);
    } catch (error) {
      console.error("Error getting subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Get customer payment history
  app.get("/api/customer/payments", requireAuth, async (req: any, res: Response) => {
    try {
      const customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const subscription = await storage.getSubscription(customer.id);
      
      // Build payment history from subscription(s)
      const paymentHistory = subscription ? [
        {
          id: subscription.id,
          date: subscription.startDate,
          amount: subscription.amount,
          currency: subscription.currency,
          status: 'completed',
          description: `${subscription.status === 'active' ? 'Active' : 'Inactive'} Subscription`,
          invoiceNumber: `INV-${subscription.id.substring(0, 8).toUpperCase()}`,
        }
      ] : [];

      res.json({
        customer: {
          firstName: req.user.dbUser.firstName,
          lastName: req.user.dbUser.lastName,
          email: req.user.dbUser.email,
        },
        payments: paymentHistory,
      });
    } catch (error) {
      console.error("Error getting payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // Generate invoice PDF
  app.get("/api/customer/invoices/:id/download", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const subscription = await storage.getSubscription(customer.id);
      if (!subscription || subscription.id !== id) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Generate simple PDF invoice
      const invoiceNumber = `INV-${subscription.id.substring(0, 8).toUpperCase()}`;
      const invoiceDate = new Date(subscription.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const amount = (subscription.amount / 100).toFixed(2);
      
      const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>
endobj
4 0 obj
<< /Length 1200 >>
stream
BT
/F1 24 Tf
50 750 Td
(ALWR Invoice) Tj
0 -40 Td
/F2 12 Tf
(Invoice Number: ${invoiceNumber}) Tj
0 -20 Td
(Date: ${invoiceDate}) Tj
0 -60 Td
/F1 14 Tf
(Bill To) Tj
/F2 12 Tf
0 -20 Td
(${req.user.dbUser.firstName} ${req.user.dbUser.lastName}) Tj
0 -20 Td
(${req.user.dbUser.email}) Tj
0 -20 Td
(${customer.address || ''}) Tj
0 -20 Td
(${customer.city || ''}, ${customer.state || ''} ${customer.zipCode || ''}) Tj
0 -60 Td
/F1 14 Tf
(Description) Tj
/F2 12 Tf
0 -20 Td
(America Living Will Registry - Annual Subscription) Tj
0 -60 Td
/F1 12 Tf
(Amount: \\$$${amount}) Tj
/F2 11 Tf
0 -20 Td
(Currency: ${subscription.currency.toUpperCase()}) Tj
0 -40 Td
/F1 12 Tf
(Status: PAID) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000263 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
1517
%%EOF`;

      const pdfBuffer = Buffer.from(pdfContent, 'utf8');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating invoice:", error);
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  // Create Stripe Checkout Session
  app.post("/api/checkout", requireAuth, async (req: any, res: Response) => {
    try {
      // Validate request body
      const checkoutSchema = z.object({
        priceId: z.string().min(1, "Price ID is required"),
      });
      const { priceId } = checkoutSchema.parse(req.body);
      
      const product = getProductByPriceId(priceId);
      if (!product) {
        return res.status(400).json({ message: "Invalid price ID" });
      }

      let customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer) {
        customer = await storage.createCustomer({
          userId: req.user.dbUser.id,
          idCardNumber: generateIdCardNumber(),
          idCardIssuedDate: new Date(),
        });
      }

      // Get fresh Stripe client
      const stripe = await getUncachableStripeClient();

      // Create or get Stripe customer
      let stripeCustomerId = customer.stripeCustomerId;
      if (!stripeCustomerId) {
        const stripeCustomer = await stripe.customers.create({
          email: req.user.dbUser.email || undefined,
          name: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
          metadata: {
            userId: req.user.dbUser.id,
            customerId: customer.id,
          },
        });
        stripeCustomerId = stripeCustomer.id;
        await storage.updateCustomer(customer.id, { stripeCustomerId });
      }

      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.REPL_HOME || 'http://localhost:5000'}/customer/subscription?success=true`,
        cancel_url: `${process.env.REPL_HOME || 'http://localhost:5000'}/customer/subscription?canceled=true`,
        metadata: {
          userId: req.user.dbUser.id,
          customerId: customer.id,
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Create Customer Portal Session
  app.post("/api/customer/subscription/portal", requireAuth, async (req: any, res: Response) => {
    try {
      const customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer?.stripeCustomerId) {
        return res.status(400).json({ message: "No Stripe customer found" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.billingPortal.sessions.create({
        customer: customer.stripeCustomerId,
        return_url: `${process.env.REPL_HOME || 'http://localhost:5000'}/customer/subscription`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  // ============================================================================
  // DOCUMENT ROUTES
  // ============================================================================

  // Upload document
  app.post("/api/customer/documents/upload", requireAuth, upload.single('file'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Validate document metadata
      const uploadSchema = z.object({
        fileType: z.enum(['living_will', 'healthcare_directive', 'power_of_attorney', 'dnr', 'other']).default('other'),
        description: z.string().optional(),
      });
      const { fileType, description } = uploadSchema.parse(req.body);

      // In production, upload to S3/cloud storage
      // For MVP, store in memory with a unique storage key
      const storageKey = `documents/${customer.id}/${randomUUID()}-${req.file.originalname}`;

      const document = await storage.createDocument({
        customerId: customer.id,
        fileName: req.file.originalname,
        fileType: fileType || 'other',
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        storageKey,
        description: description || null,
        uploadedBy: req.user.dbUser.id,
      });

      // Log document upload
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'document_upload',
        resourceType: 'document',
        resourceId: document.id,
        details: { fileName: document.fileName, fileType: document.fileType },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // List customer documents
  app.get("/api/customer/documents", requireAuth, async (req: any, res: Response) => {
    try {
      const customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer) {
        return res.json([]);
      }

      const documents = await storage.listDocumentsByCustomer(customer.id);
      res.json(documents);
    } catch (error) {
      console.error("Error listing documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Download document
  app.get("/api/customer/documents/:id/download", requireAuth, async (req: any, res: Response) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer || document.customerId !== customer.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Log document access
      await storage.incrementDocumentAccess(document.id);
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'document_download',
        resourceType: 'document',
        resourceId: document.id,
        details: { fileName: document.fileName },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      // In production, redirect to S3 signed URL
      // For MVP, return mock download URL
      res.json({ 
        downloadUrl: `/api/documents/${document.id}/content`,
        fileName: document.fileName
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // Delete document
  app.delete("/api/customer/documents/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer || document.customerId !== customer.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteDocument(document.id);

      // Log document deletion
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'document_delete',
        resourceType: 'document',
        resourceId: document.id,
        details: { fileName: document.fileName },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // ============================================================================
  // DOCUMENT DOWNLOAD ROUTE
  // ============================================================================

  // Download document content
  app.get("/api/documents/:id/content", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Increment access count
      await storage.incrementDocumentAccess(id);

      // For MVP: return a placeholder PDF
      // In production, you'd fetch from S3 or cloud storage
      const placeholderPDF = Buffer.from(
        `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>
endobj
4 0 obj
<< /Length 100 >>
stream
BT
/F1 12 Tf
50 750 Td
(${document.fileName}) Tj
0 -20 Td
(Type: ${document.fileType}) Tj
0 -20 Td
(Size: ${(document.fileSize / 1024).toFixed(1)} KB) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000263 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
415
%%EOF`,
        'utf8'
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Length', placeholderPDF.length);
      res.send(placeholderPDF);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // ============================================================================
  // EMERGENCY ACCESS ROUTES
  // ============================================================================

  // Verify emergency access
  app.post("/api/emergency-access/verify", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const emergencyAccessSchema = z.object({
        idCardNumber: z.string().min(1, "ID card number is required"),
        lastName: z.string().min(1, "Last name is required"),
        birthYear: z.number().int().min(1900).max(new Date().getFullYear()),
        accessorName: z.string().min(1, "Accessor name is required"),
        accessorRole: z.string().min(1, "Accessor role is required"),
        accessorOrganization: z.string().optional(),
        accessorPhone: z.string().optional(),
      });
      const {
        idCardNumber,
        lastName,
        birthYear,
        accessorName,
        accessorRole,
        accessorOrganization,
        accessorPhone,
      } = emergencyAccessSchema.parse(req.body);

      // Verify credentials
      const customer = await storage.verifyEmergencyAccess(idCardNumber, lastName, birthYear);
      
      if (!customer) {
        // Log failed attempt
        await storage.createAuditLog({
          userId: null,
          actorName: accessorName || 'Unknown',
          actorRole: accessorRole || 'Unknown',
          action: 'emergency_access',
          resourceType: 'customer',
          resourceId: idCardNumber,
          details: { reason: 'Verification failed' },
          success: false,
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'] || undefined,
        });

        return res.json({ 
          success: false,
          message: "Verification failed. Please check your credentials." 
        });
      }

      // Get customer documents
      const documents = await storage.listDocumentsByCustomer(customer.id);

      // Log emergency access
      await storage.logEmergencyAccess({
        customerId: customer.id,
        accessorName,
        accessorRole,
        accessorOrganization: accessorOrganization || null,
        accessorPhone: accessorPhone || null,
        idCardNumber,
        verificationMethod: 'ID Card + Last Name + Birth Year',
        verificationData: null,
        accessGranted: true,
        accessReason: null,
        documentsAccessed: documents.map(d => d.id),
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      // Log in audit trail
      await storage.createAuditLog({
        userId: null,
        actorName: accessorName,
        actorRole: accessorRole,
        action: 'emergency_access',
        resourceType: 'customer',
        resourceId: customer.id,
        details: {
          documentsAccessed: documents.length,
          organization: accessorOrganization,
        },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.json({
        success: true,
        documents: documents.map(doc => ({
          id: doc.id,
          fileName: doc.fileName,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          downloadUrl: `/api/documents/${doc.id}/content`,
        })),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error verifying emergency access:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  // Admin dashboard stats
  app.get("/api/admin/dashboard", requireAdmin, async (req: any, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      
      // Get recent activity (last 10 audit logs)
      const recentActivity = await storage.listAuditLogs(10, 0);

      res.json({
        ...stats,
        recentActivity: recentActivity.map(log => ({
          id: log.id,
          type: log.action,
          description: `${log.actorName} performed ${log.action} on ${log.resourceType}`,
          timestamp: log.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // List all customers (admin)
  app.get("/api/admin/customers", requireAdmin, async (req: any, res: Response) => {
    try {
      const customers = await storage.listCustomers(100, 0);
      
      // Enrich with user data and counts
      const enriched = await Promise.all(
        customers.map(async (customer) => {
          const user = await storage.getUser(customer.userId);
          const subscription = await storage.getSubscription(customer.id);
          const documents = await storage.listDocumentsByCustomer(customer.id);
          
          return {
            ...customer,
            user,
            subscriptionStatus: subscription?.status || 'none',
            documentCount: documents.length,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error listing customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Get individual customer (admin)
  app.get("/api/admin/customers/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const customer = await storage.getCustomerById(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const user = await storage.getUser(customer.userId);
      const subscription = await storage.getSubscription(customer.id);
      const documents = await storage.listDocumentsByCustomer(customer.id);
      const notes = await storage.listCustomerNotes(customer.id);
      const emergencyLogs = await storage.listEmergencyAccessLogs(customer.id);

      res.json({
        ...customer,
        user,
        subscription,
        documents,
        notes,
        emergencyAccessLogs: emergencyLogs,
      });
    } catch (error) {
      console.error("Error getting customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // Create new customer (admin)
  app.post("/api/admin/customers", requireAdmin, async (req: any, res: Response) => {
    try {
      const { email, firstName, lastName, phone, address, city, state, zipCode, emergencyContactName, emergencyContactPhone, emergencyContactRelationship } = req.body;

      // Validate required fields
      if (!email || !firstName || !lastName) {
        return res.status(400).json({ message: "Email, first name, and last name are required" });
      }

      // Check if user with email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Create user account
      const user = await storage.upsertUser({
        email,
        firstName,
        lastName,
        role: 'customer',
      });

      // Create customer profile
      const customer = await storage.createCustomer({
        userId: user.id,
        phone,
        address,
        city,
        state,
        zipCode,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship,
      });

      // Log the creation
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'customer_create',
        resourceType: 'customer',
        resourceId: customer.id,
        details: { email, firstName, lastName },
      });

      res.status(201).json({ ...customer, user });
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Update customer (admin)
  app.put("/api/admin/customers/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const customer = await storage.getCustomerById(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Update customer profile
      const updatedCustomer = await storage.updateCustomer(id, updates);

      // Log the update
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'customer_update',
        resourceType: 'customer',
        resourceId: id,
        details: updates,
      });

      res.json(updatedCustomer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Add customer note (admin)
  app.post("/api/admin/customers/:id/notes", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { noteText } = req.body;

      if (!noteText || noteText.trim() === '') {
        return res.status(400).json({ message: "Note text is required" });
      }

      const customer = await storage.getCustomerById(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const note = await storage.createCustomerNote({
        customerId: id,
        userId: req.user.dbUser.id,
        noteText: noteText.trim(),
      });

      // Return note with user info
      const user = await storage.getUser(req.user.dbUser.id);
      res.status(201).json({ ...note, user });
    } catch (error) {
      console.error("Error creating customer note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  // Get customer notes (admin)
  app.get("/api/admin/customers/:id/notes", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const notes = await storage.listCustomerNotes(id);
      res.json(notes);
    } catch (error) {
      console.error("Error getting customer notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  // ============================================================================
  // ADMIN SUBSCRIPTION ROUTES
  // ============================================================================

  // List all subscriptions (admin)
  app.get("/api/admin/subscriptions", requireAdmin, async (req: any, res: Response) => {
    try {
      const subscriptions = await storage.listAllSubscriptions(100, 0);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error listing subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // Get single subscription (admin)
  app.get("/api/admin/subscriptions/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const subscription = await storage.getSubscriptionById(id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      res.json(subscription);
    } catch (error) {
      console.error("Error getting subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Update subscription (admin)
  app.patch("/api/admin/subscriptions/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { status, renewalDate, endDate } = req.body;

      const subscription = await storage.getSubscriptionById(id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      const updates: any = {};
      if (status) updates.status = status;
      if (renewalDate) updates.renewalDate = new Date(renewalDate);
      if (endDate) updates.endDate = new Date(endDate);

      const updated = await storage.updateSubscription(id, updates);

      // Log the update
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'subscription_update',
        resourceType: 'subscription',
        resourceId: id,
        details: updates,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // Cancel subscription (admin)
  app.post("/api/admin/subscriptions/:id/cancel", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;

      const subscription = await storage.getSubscriptionById(id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      const updated = await storage.updateSubscription(id, { status: 'cancelled' });

      // Log the cancellation
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'subscription_update',
        resourceType: 'subscription',
        resourceId: id,
        details: { status: 'cancelled', reason: 'Admin cancellation' },
      });

      res.json(updated);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // ============================================================================
  // ADMIN RENEWAL REMINDER ROUTES
  // ============================================================================

  // Get subscriptions expiring soon (for renewal reminders)
  app.get("/api/admin/renewal-reminders", requireAdmin, async (req: any, res: Response) => {
    try {
      // Get subscriptions expiring within 30 days
      const expiringSubscriptions = await storage.listExpiringSubscriptions(30);
      
      // Enrich with customer data
      const enriched = await Promise.all(
        expiringSubscriptions.map(async (sub) => {
          const customer = await storage.getCustomerById(sub.customerId);
          const user = await storage.getUser(customer?.userId || '');
          
          return {
            ...sub,
            customer: { ...customer, user },
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error getting renewal reminders:", error);
      res.status(500).json({ message: "Failed to fetch renewal reminders" });
    }
  });

  // Send renewal reminder for a subscription
  app.post("/api/admin/renewal-reminders/:id/send", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const subscription = await storage.getSubscriptionById(id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // For MVP: just mark the reminder as sent
      // In production, you'd send an actual email via SendGrid, AWS SES, etc.
      const updated = await storage.updateSubscription(id, { renewalReminderSent: true });

      // Log the reminder send
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'subscription_update',
        resourceType: 'subscription',
        resourceId: id,
        details: { 
          action: 'renewal_reminder_sent',
          customerName: `${subscription.customer.user.firstName} ${subscription.customer.user.lastName}`,
          expiryDate: subscription.endDate,
        },
      });

      res.json({
        success: true,
        message: "Renewal reminder sent successfully",
        subscription: updated,
      });
    } catch (error) {
      console.error("Error sending renewal reminder:", error);
      res.status(500).json({ message: "Failed to send renewal reminder" });
    }
  });

  // Get reports and analytics (admin)
  app.get("/api/admin/reports", requireAdmin, async (req: any, res: Response) => {
    try {
      // Get all customers and subscriptions
      const customers = await storage.listCustomers(1000, 0);
      
      // Get all subscriptions for revenue analysis
      const allSubs = await Promise.all(
        customers.map(c => storage.getSubscription(c.id))
      );
      const subscriptions = allSubs.filter((s): s is Subscription => s !== undefined);
      
      // Get all documents
      const allDocuments = await Promise.all(
        customers.map(c => storage.listDocumentsByCustomer(c.id))
      );
      const flatDocuments = allDocuments.flat();
      
      // 1. Calculate revenue by month
      const revenueByMonth: Record<string, number> = {};
      subscriptions.forEach((sub) => {
        if (sub.startDate) {
          const date = new Date(sub.startDate);
          const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          const amount = sub.amount || 99; // Default to 99 if not set
          revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + amount;
        }
      });
      
      const revenueByMonthArray = Object.entries(revenueByMonth).map(([month, revenue]) => ({
        month,
        revenue,
      }));
      
      // 2. Subscription status distribution
      const statusCounts: Record<string, number> = {};
      subscriptions.forEach((sub) => {
        const status = sub.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      const subscriptionStats = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
      }));
      
      // 3. Document upload trend by week
      const documentUploadTrend: Record<string, number> = {};
      flatDocuments.forEach((doc) => {
        if (doc.uploadedAt) {
          const date = new Date(doc.uploadedAt);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekKey = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          documentUploadTrend[weekKey] = (documentUploadTrend[weekKey] || 0) + 1;
        }
      });
      
      const documentUploadTrendArray = Object.entries(documentUploadTrend).map(([week, uploads]) => ({
        week,
        uploads,
      })).slice(-8); // Last 8 weeks
      
      // 4. Top customers by document count
      const customerDocCounts = await Promise.all(
        customers.map(async (customer) => {
          const user = await storage.getUser(customer.userId);
          const docs = await storage.listDocumentsByCustomer(customer.id);
          return {
            name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
            documents: docs.length,
          };
        })
      );
      
      const topCustomersByDocuments = customerDocCounts
        .filter(c => c.documents > 0)
        .sort((a, b) => b.documents - a.documents)
        .slice(0, 5);
      
      // 5. Calculate financial metrics
      const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.amount || 99), 0);
      const avgRevenuePerCustomer = customers.length > 0 ? totalRevenue / customers.length : 0;
      
      res.json({
        revenueByMonth: revenueByMonthArray,
        subscriptionStats,
        documentUploadTrend: documentUploadTrendArray,
        topCustomersByDocuments,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgRevenuePerCustomer: Math.round(avgRevenuePerCustomer * 100) / 100,
      });
    } catch (error) {
      console.error("Error getting reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Get all users (admin)
  app.get("/api/admin/users", requireAdmin, async (req: any, res: Response) => {
    try {
      const users = await storage.listAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user role (admin)
  app.patch("/api/admin/users/:id/role", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Validate role
      if (!["customer", "admin", "agent"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user role
      await storage.updateUserRole(id, role);

      // Log the role change
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: "profile_update",
        resourceType: "user",
        resourceId: id,
        details: {
          action: "role_change",
          userName: `${user.firstName} ${user.lastName}`,
          oldRole: user.role,
          newRole: role,
        },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers["user-agent"] || undefined,
      });

      res.json({
        success: true,
        message: "User role updated successfully",
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Get audit logs (admin)
  app.get("/api/admin/audit-logs", requireAdmin, async (req: any, res: Response) => {
    try {
      const logs = await storage.listAuditLogs(100, 0);
      res.json(logs);
    } catch (error) {
      console.error("Error getting audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Note: Stripe webhook route is registered in app.ts BEFORE express.json()
  // This ensures the webhook receives the raw body as a Buffer

  const httpServer = createServer(app);
  return httpServer;
}
