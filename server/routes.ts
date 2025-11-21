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
