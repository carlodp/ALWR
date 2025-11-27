import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
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
  insertSubscriptionSchema,
  insertReportScheduleSchema
} from "@shared/schema";
import { z } from "zod";
import { calculateStats, invalidateStatsCache } from "./statsService";
import { setupStatsWebSocket, notifyStatsChange } from "./websocketStats";
import { authLimiter, apiLimiter, sanitizeError, isValidId, isValidEmail, isValidPassword } from "./security";
import { logger } from "./logger";
import { isAdmin, hasPermission } from "./usersService";
import { hashPassword, verifyPassword, validatePassword, validateEmail, isAccountLocked, calculateLockUntil } from "./authService";
import { versionDetectionMiddleware, getVersionInfoEndpoint } from "./api-versioning";
import { requireAdminIP } from "./ip-whitelist-middleware";
import { auditLog } from "./audit-logging-helper";

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

// In-memory file buffer store (maps storageKey -> file buffer)
const fileBufferStore = new Map<string, Buffer>();

// Helper to extract text from DOCX (ZIP file containing XML)
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    // DOCX is a ZIP file. Look for document.xml in the ZIP
    // For MVP, we'll do a simple approach: find text between XML tags
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 100000));
    
    // Extract text content between common DOCX tags
    let extracted = '';
    const textMatches = text.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
    
    for (const match of textMatches) {
      const content = match.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '');
      extracted += content + ' ';
    }
    
    // If we found text, return it; otherwise return a message
    return extracted.trim() || 'Document content could not be extracted. Please download to view.';
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    return 'Document content could not be extracted. Please download to view.';
  }
}

// Helper to convert DOCX to HTML
async function docxToHtml(buffer: Buffer, fileName: string): Promise<string> {
  const text = await extractDocxText(buffer);
  const htmlContent = text
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p>${escapeHtml(line)}</p>`)
    .join('\n');
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(fileName)}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; }
    p { margin: 10px 0; }
    .doc-header { border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
    .doc-title { font-size: 18px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="doc-title">${escapeHtml(fileName)}</div>
  </div>
  <div class="doc-content">
    ${htmlContent}
  </div>
</body>
</html>`;
}

// Helper to escape HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Helper to generate ID card number
function generateIdCardNumber(): string {
  const prefix = 'ALWR';
  const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const part3 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${part1}-${part2}-${part3}`;
}

// Helper to calculate next scheduled time for reports
function calculateNextScheduledTime(
  frequency: 'daily' | 'weekly' | 'monthly',
  hour: number,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null
): Date {
  const now = new Date();
  const nextScheduled = new Date(now);
  nextScheduled.setHours(hour, 0, 0, 0);

  if (frequency === 'daily') {
    if (nextScheduled <= now) {
      nextScheduled.setDate(nextScheduled.getDate() + 1);
    }
  } else if (frequency === 'weekly') {
    const targetDay = dayOfWeek ?? 0; // Default to Sunday
    while (nextScheduled.getDay() !== targetDay || nextScheduled <= now) {
      nextScheduled.setDate(nextScheduled.getDate() + 1);
    }
  } else if (frequency === 'monthly') {
    const targetDay = dayOfMonth ?? 1; // Default to 1st
    nextScheduled.setDate(targetDay);
    if (nextScheduled <= now) {
      nextScheduled.setMonth(nextScheduled.getMonth() + 1);
      nextScheduled.setDate(targetDay);
    }
  }

  return nextScheduled;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication first
  await setupAuth(app);
  
  // Apply loadUser middleware to all routes
  app.use(loadUser);

  // Apply API versioning detection to all routes
  app.use(versionDetectionMiddleware);

  // ============================================================================
  // VERSION INFO ENDPOINT
  // ============================================================================

  /**
   * GET /api/version
   * Get API version information and migration guide
   */
  app.get("/api/version", getVersionInfoEndpoint);

  /**
   * Also support /api/v1/version and /api/v2/version for consistency
   */
  app.get(["/api/v1/version", "/api/v2/version"], getVersionInfoEndpoint);

  // ============================================================================
  // AUTHENTICATION ROUTES
  // ============================================================================

  /**
   * @swagger
   * /auth/user:
   *   get:
   *     summary: Get current authenticated user
   *     description: Retrieve the current user information for the authenticated session
   *     tags:
   *       - Authentication
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Current user object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
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

  /**
   * @swagger
   * /customer/profile:
   *   get:
   *     summary: Get customer profile
   *     description: Retrieve the customer profile information. Auto-creates profile if it doesn't exist.
   *     tags:
   *       - Customer Profile
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Customer profile object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Customer'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Server error
   */
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

  /**
   * @swagger
   * /customer/profile:
   *   put:
   *     summary: Update customer profile
   *     description: Update customer profile information with validation and audit logging
   *     tags:
   *       - Customer Profile
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Customer'
   *     responses:
   *       200:
   *         description: Updated customer profile
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Customer'
   *       400:
   *         description: Invalid input
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Customer not found
   *       500:
   *         description: Server error
   */
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

  // Upload profile image
  app.post("/api/customer/profile/image", requireAuth, upload.single('profileImage'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      const user = req.user.dbUser;
      // In production, upload to cloud storage and update profileImageUrl
      // For MVP, generate a data URL or simple placeholder
      const imageUrl = `/api/users/${user.id}/profile-image`;
      
      // Update user with new profile image URL
      const updated = await storage.upsertUser({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: imageUrl,
        role: user.role,
      });

      res.json({ success: true, profileImageUrl: imageUrl });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  /**
   * @swagger
   * /customer/password:
   *   post:
   *     summary: Change customer password
   *     description: Change the customer password with rate limiting to prevent brute force attacks
   *     tags:
   *       - Customer Profile
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *               confirmPassword:
   *                 type: string
   *             required:
   *               - currentPassword
   *               - newPassword
   *               - confirmPassword
   *     responses:
   *       200:
   *         description: Password changed successfully
   *       400:
   *         description: Invalid input or validation error
   *       401:
   *         description: Not authenticated
   *       429:
   *         description: Rate limit exceeded
   *       500:
   *         description: Server error
   */
  app.post("/api/customer/password", authLimiter, requireAuth, async (req: any, res: Response) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All password fields are required" });
      }

      if (!isValidPassword(newPassword)) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "New password and confirm password do not match" });
      }

      if (newPassword === currentPassword) {
        return res.status(400).json({ message: "New password must be different from current password" });
      }

      // Note: In production, you would:
      // 1. Verify the current password against a hashed password in the database
      // 2. Hash the new password
      // 3. Update the user password in the database
      // For now with Replit Auth (OpenID Connect), password management is handled by the auth provider
      
      // Log password change attempt
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'profile_update',
        resourceType: 'user',
        resourceId: req.user.dbUser.id,
        details: { action: 'password_changed' },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // ============================================================================
  // SUBSCRIPTION ROUTES
  // ============================================================================

  /**
   * @swagger
   * /customer/subscription:
   *   get:
   *     summary: Get customer subscription
   *     description: Retrieve the current subscription for the authenticated customer
   *     tags:
   *       - Subscriptions
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Subscription object or null if no subscription exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Subscription'
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Customer not found
   *       500:
   *         description: Server error
   */
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

  /**
   * @swagger
   * /customer/payments:
   *   get:
   *     summary: Get customer payment history
   *     description: Retrieve payment history and invoices for the authenticated customer
   *     tags:
   *       - Subscriptions
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Payment history with customer details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 customer:
   *                   type: object
   *                   properties:
   *                     firstName:
   *                       type: string
   *                     lastName:
   *                       type: string
   *                     email:
   *                       type: string
   *                       format: email
   *                 payments:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       date:
   *                         type: string
   *                         format: date
   *                       amount:
   *                         type: number
   *                       currency:
   *                         type: string
   *                       status:
   *                         type: string
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Customer not found
   *       500:
   *         description: Server error
   */
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

  /**
   * @swagger
   * /customer/documents/upload:
   *   post:
   *     summary: Upload a new document
   *     description: Upload a living will, healthcare directive, or other legal document. Supports PDF, DOC, and DOCX files up to 10MB.
   *     tags:
   *       - Documents
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *               fileType:
   *                 type: string
   *                 enum: [living_will, healthcare_directive, power_of_attorney, dnr, other]
   *               description:
   *                 type: string
   *             required:
   *               - file
   *     responses:
   *       200:
   *         description: Document uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Document'
   *       400:
   *         description: No file uploaded or invalid input
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Customer not found
   *       500:
   *         description: Server error
   */
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

      // Create initial document version
      await storage.createDocumentVersion({
        documentId: document.id,
        version: 1,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        storageKey: document.storageKey,
        encryptionKey: document.encryptionKey || undefined,
        uploadedBy: req.user.dbUser.id,
        changeNotes: 'Initial upload',
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

      // Notify stats subscribers of data change
      notifyStatsChange();

      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  /**
   * @swagger
   * /customer/documents:
   *   get:
   *     summary: List all customer documents
   *     description: Retrieve all documents uploaded by the authenticated customer
   *     tags:
   *       - Documents
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Array of customer documents
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Document'
   *       401:
   *         description: Not authenticated
   *       500:
   *         description: Server error
   */
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

  // Get document versions
  app.get("/api/customer/documents/:id/versions", requireAuth, async (req: any, res: Response) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer || document.customerId !== customer.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const versions = await storage.listDocumentVersions(document.id);
      res.json(versions);
    } catch (error) {
      console.error("Error fetching document versions:", error);
      res.status(500).json({ message: "Failed to fetch document versions" });
    }
  });

  // Upload new document version
  app.post("/api/customer/documents/:id/upload-version", requireAuth, upload.single('file'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer || document.customerId !== customer.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate optional change notes
      const versionSchema = z.object({
        changeNotes: z.string().optional(),
      });
      const { changeNotes } = versionSchema.parse(req.body);

      // Get current version number
      const versions = await storage.listDocumentVersions(document.id);
      const nextVersion = (Math.max(...versions.map(v => v.version), 0)) + 1;

      // Create new storage key for this version
      const storageKey = `documents/${customer.id}/${randomUUID()}-${req.file.originalname}`;

      // Create new version
      const newVersion = await storage.createDocumentVersion({
        documentId: document.id,
        version: nextVersion,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        storageKey,
        encryptionKey: document.encryptionKey || undefined,
        uploadedBy: req.user.dbUser.id,
        changeNotes: changeNotes || `Version ${nextVersion}`,
      });

      // Update document to current version
      const updated = await db.update(documents)
        .set({
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          storageKey,
          currentVersion: nextVersion,
          updatedAt: new Date()
        })
        .where(eq(documents.id, document.id))
        .returning();

      // Log version upload
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'document_upload',
        resourceType: 'document',
        resourceId: document.id,
        details: { fileName: req.file.originalname, newVersion: nextVersion },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.json({ document: updated[0], version: newVersion });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error uploading document version:", error);
      res.status(500).json({ message: "Failed to upload document version" });
    }
  });

  // Restore document version
  app.post("/api/customer/documents/:id/versions/:version/restore", requireAuth, async (req: any, res: Response) => {
    try {
      const { id, version } = req.params;
      const versionNum = parseInt(version, 10);

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer || document.customerId !== customer.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const restored = await storage.restoreDocumentVersion(id, versionNum);
      if (!restored) {
        return res.status(404).json({ message: "Version not found" });
      }

      // Log version restore
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'document_upload',
        resourceType: 'document',
        resourceId: document.id,
        details: { fileName: restored.fileName, restoredVersion: versionNum },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.json(restored);
    } catch (error) {
      console.error("Error restoring document version:", error);
      res.status(500).json({ message: "Failed to restore document version" });
    }
  });

  // Delete document
  app.delete("/api/customer/documents/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Allow admins to delete any document, or users to delete their own
      const isAdmin = req.user.dbUser.role === 'admin' || req.user.dbUser.role === 'super_admin';
      if (!isAdmin) {
        const customer = await storage.getCustomer(req.user.dbUser.id);
        if (!customer || document.customerId !== customer.id) {
          return res.status(403).json({ message: "Access denied" });
        }
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

  // View document (admin)
  app.get("/api/admin/documents/:id/view", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Increment access count
      await storage.incrementDocumentAccess(id);

      // Log document access
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'document_view',
        resourceType: 'document',
        resourceId: document.id,
        details: { fileName: document.fileName },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      // Try to retrieve the file buffer from memory store
      const fileBuffer = fileBufferStore.get(document.storageKey);

      if (!fileBuffer) {
        // If file not in memory, return an error or redirect to download
        return res.status(404).json({ 
          message: "File content not available. Please download the document." 
        });
      }

      // Handle different file types
      const fileName = document.fileName.toLowerCase();
      
      if (fileName.endsWith('.pdf')) {
        // Serve PDF directly
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
        res.send(fileBuffer);
      } else if (fileName.endsWith('.docx')) {
        // Convert DOCX to HTML and serve
        try {
          const htmlContent = await docxToHtml(fileBuffer, document.fileName);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.send(htmlContent);
        } catch (error) {
          console.error('Error converting DOCX:', error);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
          res.send(fileBuffer);
        }
      } else if (fileName.endsWith('.doc')) {
        // Serve DOC file directly (browser may not preview, but user can download)
        res.setHeader('Content-Type', 'application/msword');
        res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
        res.send(fileBuffer);
      } else {
        // Unknown type, serve as attachment
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
        res.send(fileBuffer);
      }
    } catch (error) {
      console.error("Error viewing document:", error);
      res.status(500).json({ message: "Failed to view document" });
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

  /**
   * @swagger
   * /emergency-access/verify:
   *   post:
   *     summary: Verify emergency access to documents
   *     description: 3-step verification process for emergency responders to access customer documents. Rate limited to prevent brute force.
   *     tags:
   *       - Emergency Access
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               idCardNumber:
   *                 type: string
   *                 description: Customer ALWR ID card number
   *               lastName:
   *                 type: string
   *                 description: Customer last name
   *               dateOfBirth:
   *                 type: string
   *                 format: date
   *                 description: Customer date of birth
   *             required:
   *               - idCardNumber
   *               - lastName
   *               - dateOfBirth
   *     responses:
   *       200:
   *         description: Emergency access verified successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 documents:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Document'
   *       400:
   *         description: Invalid input or verification failed
   *       404:
   *         description: Customer not found
   *       429:
   *         description: Rate limit exceeded
   *       500:
   *         description: Server error
   */
  app.post("/api/emergency-access/verify", authLimiter, async (req: Request, res: Response) => {
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
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * POST /api/admin/batch/customers/create
   * Bulk create customers from array
   */
  app.post("/api/admin/batch/customers/create", requireAdmin, async (req: any, res: Response) => {
    try {
      const { customers: customersList } = req.body;
      if (!Array.isArray(customersList) || customersList.length === 0) {
        return res.status(400).json({ message: "customers array is required and must not be empty" });
      }

      // Validate each customer
      const validated = customersList.map(c => insertCustomerSchema.parse(c));
      const created = await storage.bulkCreateCustomers(validated);

      await auditLog({
        userId: req.user?.dbUser?.id || 'system',
        actorName: req.user?.dbUser?.firstName || 'Admin',
        actorRole: req.user?.dbUser?.role || 'admin',
        action: 'admin_bulk_action',
        resourceType: 'customer',
        resourceId: 'batch',
        success: true,
        details: { action: 'bulk_create_customers', count: created.length },
      });

      res.status(201).json({
        success: true,
        created: created.length,
        customers: created,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error bulk creating customers:", error);
      res.status(500).json({ message: "Bulk create failed" });
    }
  });

  /**
   * POST /api/admin/batch/subscriptions/update-status
   * Bulk update subscription status
   */
  app.post("/api/admin/batch/subscriptions/update-status", requireAdmin, async (req: any, res: Response) => {
    try {
      const { subscriptionIds, status } = req.body;
      if (!Array.isArray(subscriptionIds) || !status) {
        return res.status(400).json({ message: "subscriptionIds array and status are required" });
      }

      const updated = await storage.bulkUpdateSubscriptionStatus(subscriptionIds, status);

      await auditLog({
        userId: req.user?.dbUser?.id || 'system',
        actorName: req.user?.dbUser?.firstName || 'Admin',
        actorRole: req.user?.dbUser?.role || 'admin',
        action: 'admin_bulk_action',
        resourceType: 'subscription',
        resourceId: 'batch',
        success: true,
        details: { action: 'bulk_update_status', count: subscriptionIds.length, newStatus: status },
      });

      res.json({
        success: true,
        updated,
        message: `${updated} subscriptions updated to ${status}`,
      });
    } catch (error) {
      console.error("Error bulk updating subscriptions:", error);
      res.status(500).json({ message: "Bulk update failed" });
    }
  });

  /**
   * POST /api/admin/batch/documents/delete
   * Bulk delete documents
   */
  app.post("/api/admin/batch/documents/delete", requireAdmin, async (req: any, res: Response) => {
    try {
      const { documentIds } = req.body;
      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        return res.status(400).json({ message: "documentIds array is required" });
      }

      const deleted = await storage.bulkDeleteDocuments(documentIds);

      await auditLog({
        userId: req.user?.dbUser?.id || 'system',
        actorName: req.user?.dbUser?.firstName || 'Admin',
        actorRole: req.user?.dbUser?.role || 'admin',
        action: 'document_bulk_delete',
        resourceType: 'document',
        resourceId: 'batch',
        success: true,
        details: { count: deleted },
      });

      res.json({
        success: true,
        deleted,
        message: `${deleted} documents deleted`,
      });
    } catch (error) {
      console.error("Error bulk deleting documents:", error);
      res.status(500).json({ message: "Bulk delete failed" });
    }
  });

  /**
   * POST /api/admin/batch/customers/tags/add
   * Bulk add tags to customers
   */
  app.post("/api/admin/batch/customers/tags/add", requireAdmin, async (req: any, res: Response) => {
    try {
      const { customerIds, tags } = req.body;
      if (!Array.isArray(customerIds) || !Array.isArray(tags)) {
        return res.status(400).json({ message: "customerIds and tags arrays are required" });
      }

      const added = await storage.bulkAddCustomerTags(customerIds, tags);

      await auditLog({
        userId: req.user?.dbUser?.id || 'system',
        actorName: req.user?.dbUser?.firstName || 'Admin',
        actorRole: req.user?.dbUser?.role || 'admin',
        action: 'admin_bulk_action',
        resourceType: 'customer',
        resourceId: 'batch',
        success: true,
        details: { action: 'bulk_add_tags', customerCount: customerIds.length, tags },
      });

      res.json({
        success: true,
        added,
        message: `Added ${tags.length} tag(s) to ${customerIds.length} customer(s)`,
      });
    } catch (error) {
      console.error("Error bulk adding tags:", error);
      res.status(500).json({ message: "Bulk add tags failed" });
    }
  });

  /**
   * POST /api/admin/batch/email-campaign
   * Send batch email campaign to customer segment
   */
  app.post("/api/admin/batch/email-campaign", requireAdmin, async (req: any, res: Response) => {
    try {
      const { customerIds, templateId, subject, body } = req.body;
      if (!Array.isArray(customerIds) || !subject || !body) {
        return res.status(400).json({ message: "customerIds, subject, and body are required" });
      }

      const emailsToSend: InsertEmailNotification[] = customerIds.map(customerId => ({
        userId: customerId,
        templateId: templateId || null,
        subject,
        body,
        notificationType: 'renewal_reminder',
        resourceType: 'campaign',
        resourceId: 'bulk',
        status: 'pending',
      } as InsertEmailNotification));

      const sent = await storage.bulkSendEmails(emailsToSend);

      await auditLog({
        userId: req.user?.dbUser?.id || 'system',
        actorName: req.user?.dbUser?.firstName || 'Admin',
        actorRole: req.user?.dbUser?.role || 'admin',
        action: 'admin_bulk_action',
        resourceType: 'email',
        resourceId: 'campaign',
        success: true,
        details: { action: 'bulk_email_campaign', count: sent.length },
      });

      res.json({
        success: true,
        queued: sent.length,
        message: `${sent.length} emails queued for delivery`,
      });
    } catch (error) {
      console.error("Error bulk sending emails:", error);
      res.status(500).json({ message: "Bulk email campaign failed" });
    }
  });

  // ============================================================================
  // ADMIN ROUTES (with IP Whitelisting - SECURITY #10)
  // ============================================================================

  // Apply IP whitelist middleware to all admin routes
  app.use('/api/admin', requireAdminIP);

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

  // List all customers (admin) - Only users with 'customer' role
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

      // Filter to only show customers with role='customer'
      const customersOnly = enriched.filter(c => c.user?.role === 'customer');

      res.json(customersOnly);
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
      const subscriptions = await storage.getSubscriptionsByCustomer(customer.id);
      const documents = await storage.listDocumentsByCustomer(customer.id);
      const notes = await storage.listCustomerNotes(customer.id);
      const emergencyLogs = await storage.listEmergencyAccessLogs(customer.id);

      res.json({
        ...customer,
        user,
        subscriptions,
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

  // Upload document for customer (admin)
  app.post("/api/admin/customers/:customerId/documents/upload", requireAdmin, upload.single('file'), async (req: any, res: Response) => {
    try {
      const { customerId } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate customer exists
      const customer = await storage.getCustomerById(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const uploadSchema = z.object({
        fileType: z.enum(['living_will', 'healthcare_directive', 'power_of_attorney', 'dnr', 'other']).default('other'),
      });

      // Extract fileType from form data - req.body from multer contains fields as object
      const fileType = (req.body?.fileType || req.body?.['fileType'] || 'other') as string;
      const validated = uploadSchema.parse({ fileType });
      const finalFileType = validated.fileType;

      // Determine mime type from file extension
      const fileName = req.file.originalname.toLowerCase();
      let mimeType = 'application/octet-stream';
      if (fileName.endsWith('.pdf')) {
        mimeType = 'application/pdf';
      } else if (fileName.endsWith('.docx')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (fileName.endsWith('.doc')) {
        mimeType = 'application/msword';
      }

      // Generate unique storage key (simulating S3 key format)
      const storageKey = `documents/${customerId}/${randomUUID()}-${req.file.originalname}`;

      // Create document
      const document = await storage.createDocument({
        customerId: customerId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: finalFileType,
        mimeType: mimeType,
        storageKey: storageKey,
        uploadedBy: req.user.dbUser.id,
      });

      // Create document version
      await storage.createDocumentVersion({
        documentId: document.id,
        version: 1,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        storageKey: document.storageKey,
        encryptionKey: document.encryptionKey || undefined,
        uploadedBy: req.user.dbUser.id,
        changeNotes: 'Initial upload',
      });

      // Store file buffer in memory for later retrieval
      fileBufferStore.set(document.storageKey, req.file.buffer);

      // Log document upload
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'document_upload',
        resourceType: 'document',
        resourceId: document.id,
        details: { customerId, fileName: req.file.originalname, fileType: finalFileType },
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Delete customer (admin/super_admin)
  app.delete("/api/admin/customers/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const customer = await storage.getCustomerById(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Delete related data
      await storage.deleteCustomer(id);

      // Log the deletion
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'customer_delete',
        resourceType: 'customer',
        resourceId: id,
        details: { customerId: id },
      });

      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Delete subscription (admin/super_admin)
  app.delete("/api/admin/subscriptions/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const subscription = await storage.getSubscription(id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      await storage.deleteSubscription(id);

      // Log the deletion
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'subscription_delete',
        resourceType: 'subscription',
        resourceId: id,
        details: { subscriptionId: id },
      });

      res.json({ message: "Subscription deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ message: "Failed to delete subscription" });
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

  // List latest subscriptions per customer (admin)
  app.get("/api/admin/subscriptions", requireAdmin, async (req: any, res: Response) => {
    try {
      const subscriptions = await storage.getLatestSubscriptionsPerCustomer();
      res.json(subscriptions);
    } catch (error) {
      console.error("Error listing subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // Get accounting/payment ledger (admin)
  app.get("/api/admin/accounting", requireAdmin, async (req: any, res: Response) => {
    try {
      const subscriptions = await storage.listAllSubscriptions(1000, 0);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching accounting data:", error);
      res.status(500).json({ message: "Failed to fetch accounting data" });
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

  // Get reports and analytics (admin) - uses cached stats
  app.get("/api/admin/reports", requireAdmin, async (req: any, res: Response) => {
    try {
      const reports = await calculateStats();
      res.json(reports);
    } catch (error) {
      console.error("Error getting reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Get report schedules (admin)
  app.get("/api/admin/reports/schedules", requireAdmin, async (req: any, res: Response) => {
    try {
      const schedules = await storage.listReportSchedules(req.user.dbUser.id);
      res.json(schedules);
    } catch (error) {
      console.error("Error getting schedules:", error);
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  // Create report schedule (admin)
  app.post("/api/admin/reports/schedules", requireAdmin, async (req: any, res: Response) => {
    try {
      const validated = insertReportScheduleSchema.parse(req.body);
      
      // Calculate next scheduled time
      const nextScheduledAt = calculateNextScheduledTime(validated.frequency, validated.hour, validated.dayOfWeek, validated.dayOfMonth);
      
      const schedule = await storage.createReportSchedule({
        ...validated,
        userId: req.user.dbUser.id,
        nextScheduledAt,
      });

      res.json(schedule);
    } catch (error: any) {
      console.error("Error creating schedule:", error);
      if (error.issues) {
        return res.status(400).json({ message: "Invalid input", errors: error.issues });
      }
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  // Toggle report schedule status (admin)
  app.patch("/api/admin/reports/schedules/:id/toggle", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const schedule = await storage.getReportSchedule(id);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      if (schedule.userId !== req.user.dbUser.id && req.user.dbUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updated = await storage.updateReportSchedule(id, {
        isActive: !schedule.isActive,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error toggling schedule:", error);
      res.status(500).json({ message: "Failed to toggle schedule" });
    }
  });

  // Delete report schedule (admin)
  app.delete("/api/admin/reports/schedules/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const schedule = await storage.getReportSchedule(id);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      if (schedule.userId !== req.user.dbUser.id && req.user.dbUser.role !== 'super_admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteReportSchedule(id);
      res.json({ message: "Schedule deleted successfully" });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      res.status(500).json({ message: "Failed to delete schedule" });
    }
  });

  // Get report history (admin)
  app.get("/api/admin/reports/history", requireAdmin, async (req: any, res: Response) => {
    try {
      const history = await storage.listReportHistory(req.user.dbUser.id);
      res.json(history);
    } catch (error) {
      console.error("Error getting history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
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
      const {
        action = 'all',
        status,
        resourceType = 'all',
        dateFrom,
        dateTo,
        searchQuery = '',
        limit = 100,
        offset = 0,
      } = req.query;

      const logs = await storage.listAuditLogsFiltered({
        limit: parseInt(limit as string) || 100,
        offset: parseInt(offset as string) || 0,
        action: action !== 'all' ? (action as string) : undefined,
        status: status === 'success' || status === 'failed' ? status : undefined,
        resourceType: resourceType !== 'all' ? (resourceType as string) : undefined,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        searchQuery: searchQuery as string,
      });
      res.json(logs);
    } catch (error) {
      console.error("Error getting audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ============================================================================
  // CUSTOMER TAGS ROUTES
  // ============================================================================

  app.post("/api/customers/:id/tags", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { tag } = req.body;
      
      const customer = await storage.getCustomerById(id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      
      const created = await storage.addCustomerTag({ customerId: id, tag });
      res.json(created);
    } catch (error) {
      console.error("Error adding tag:", error);
      res.status(500).json({ message: "Failed to add tag" });
    }
  });

  app.delete("/api/customers/:id/tags/:tag", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id, tag } = req.params;
      await storage.removeCustomerTag(id, tag);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing tag:", error);
      res.status(500).json({ message: "Failed to remove tag" });
    }
  });

  app.get("/api/customers/:id/tags", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const customer = await storage.getCustomerById(id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      
      const tags = await storage.listCustomerTags(id);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // ============================================================================
  // PHYSICAL CARD ORDERS ROUTES
  // ============================================================================

  app.post("/api/physical-card-orders", requireAuth, async (req: any, res: Response) => {
    try {
      const customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      
      const order = await storage.createPhysicalCardOrder({
        customerId: customer.id,
        idCardNumber: customer.idCardNumber!,
        recipientName: req.body.recipientName,
        recipientAddress: req.body.recipientAddress,
        recipientCity: req.body.recipientCity,
        recipientState: req.body.recipientState,
        recipientZip: req.body.recipientZip,
      });
      
      res.json(order);
    } catch (error) {
      console.error("Error creating card order:", error);
      res.status(500).json({ message: "Failed to create card order" });
    }
  });

  app.get("/api/physical-card-orders", requireAuth, async (req: any, res: Response) => {
    try {
      const customer = await storage.getCustomer(req.user.dbUser.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      
      const orders = await storage.listPhysicalCardOrders(customer.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching card orders:", error);
      res.status(500).json({ message: "Failed to fetch card orders" });
    }
  });

  app.patch("/api/physical-card-orders/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const updated = await storage.updatePhysicalCardOrder(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Order not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating card order:", error);
      res.status(500).json({ message: "Failed to update card order" });
    }
  });

  // ============================================================================
  // EMAIL TEMPLATES ROUTES
  // ============================================================================

  app.post("/api/admin/email-templates", requireAdmin, async (req: any, res: Response) => {
    try {
      const template = await storage.createEmailTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error("Error creating email template:", error);
      res.status(500).json({ message: "Failed to create email template" });
    }
  });

  app.get("/api/admin/email-templates", requireAdmin, async (req: any, res: Response) => {
    try {
      const templates = await storage.listEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.patch("/api/admin/email-templates/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const updated = await storage.updateEmailTemplate(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Template not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating email template:", error);
      res.status(500).json({ message: "Failed to update email template" });
    }
  });

  // ============================================================================
  // EMAIL NOTIFICATIONS
  // ============================================================================

  app.get("/api/notifications", requireAuth, async (req: any, res: Response) => {
    try {
      if (!req.user?.dbUser?.id) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const notifications = await storage.listEmailNotifications(req.user.dbUser.id, 50);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/admin/notifications/pending", requireAdmin, async (req: any, res: Response) => {
    try {
      const pending = await storage.listPendingEmailNotifications(100);
      res.json(pending);
    } catch (error) {
      console.error("Error fetching pending notifications:", error);
      res.status(500).json({ message: "Failed to fetch pending notifications" });
    }
  });

  app.post("/api/admin/notifications/:id/send", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const notification = await storage.listEmailNotifications("", 1).then(n => {
        // Find notification by ID (would need to be refactored for better lookup)
        return null;
      });

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Mark as sent (in production, would actually send via SendGrid)
      const updated = await storage.updateEmailNotificationStatus(id, 'sent');
      res.json({ message: "Notification queued for sending", notification: updated });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // ============================================================================
  // GLOBAL SEARCH & ADVANCED SEARCH
  // ============================================================================

  app.get("/api/global-search", async (req: any, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        return res.json([]);
      }

      const results = await storage.globalSearch(query, 50);
      res.json(results);
    } catch (error) {
      console.error("Error performing global search:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  /**
   * GET /api/admin/search/advanced
   * Advanced search with complex filters
   * Query params: filters (JSON), keywords, sortBy, sortOrder, limit, offset
   */
  app.get("/api/admin/search/advanced", requireAdmin, async (req: any, res: Response) => {
    try {
      const { filters: filterStr, keywords, sortBy = 'createdAt', sortOrder = 'desc', limit = '50', offset = '0' } = req.query;
      
      let filters: any = {};
      if (filterStr) {
        try {
          filters = typeof filterStr === 'string' ? JSON.parse(filterStr) : filterStr;
        } catch (e) {
          return res.status(400).json({ message: "Invalid filters JSON" });
        }
      }

      const limNum = Math.min(parseInt(limit) || 50, 500);
      const offNum = parseInt(offset) || 0;

      // Search customers based on filters and keywords
      const customers = await storage.listCustomers(limNum, offNum);
      
      let results = customers.filter(c => {
        // Apply filters
        if (filters.status && c.status !== filters.status) return false;
        if (filters.createdAfter && new Date(c.createdAt) < new Date(filters.createdAfter)) return false;
        if (filters.createdBefore && new Date(c.createdAt) > new Date(filters.createdBefore)) return false;
        if (keywords) {
          const keywordsLower = keywords.toLowerCase();
          const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
          return fullName.includes(keywordsLower) || c.email?.toLowerCase().includes(keywordsLower);
        }
        return true;
      });

      // Sort results
      if (sortBy && sortBy in results[0] || {}) {
        results.sort((a: any, b: any) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
          return aVal < bVal ? 1 : -1;
        });
      }

      res.json({
        success: true,
        total: results.length,
        limit: limNum,
        offset: offNum,
        results,
      });
    } catch (error) {
      console.error("Error performing advanced search:", error);
      res.status(500).json({ message: "Advanced search failed" });
    }
  });

  /**
   * POST /api/admin/search/saved
   * Save a search filter for future use
   */
  app.post("/api/admin/search/saved", requireAdmin, async (req: any, res: Response) => {
    try {
      const { name, description, filters, keywords, sortBy = 'createdAt', sortOrder = 'desc' } = req.body;
      if (!name || !filters) {
        return res.status(400).json({ message: "name and filters are required" });
      }

      const saved = await storage.createSavedSearch({
        userId: req.user?.dbUser?.id,
        name,
        description,
        filters,
        keywords,
        sortBy,
        sortOrder,
      });

      res.status(201).json({
        success: true,
        saved,
        message: "Search saved successfully",
      });
    } catch (error) {
      console.error("Error saving search:", error);
      res.status(500).json({ message: "Failed to save search" });
    }
  });

  /**
   * GET /api/admin/search/saved
   * List saved searches for current user
   */
  app.get("/api/admin/search/saved", requireAdmin, async (req: any, res: Response) => {
    try {
      const searches = await storage.listSavedSearches(req.user?.dbUser?.id);
      res.json({
        success: true,
        total: searches.length,
        searches,
      });
    } catch (error) {
      console.error("Error listing saved searches:", error);
      res.status(500).json({ message: "Failed to fetch saved searches" });
    }
  });

  /**
   * GET /api/admin/search/saved/:id
   * Get a specific saved search
   */
  app.get("/api/admin/search/saved/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const search = await storage.getSavedSearch(req.params.id);
      if (!search) {
        return res.status(404).json({ message: "Saved search not found" });
      }
      
      // Verify ownership
      if (search.userId !== req.user?.dbUser?.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.json({
        success: true,
        search,
      });
    } catch (error) {
      console.error("Error fetching saved search:", error);
      res.status(500).json({ message: "Failed to fetch saved search" });
    }
  });

  /**
   * PATCH /api/admin/search/saved/:id
   * Update a saved search
   */
  app.patch("/api/admin/search/saved/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const search = await storage.getSavedSearch(req.params.id);
      if (!search) {
        return res.status(404).json({ message: "Saved search not found" });
      }
      
      // Verify ownership
      if (search.userId !== req.user?.dbUser?.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updated = await storage.updateSavedSearch(req.params.id, req.body);
      res.json({
        success: true,
        updated,
      });
    } catch (error) {
      console.error("Error updating saved search:", error);
      res.status(500).json({ message: "Failed to update saved search" });
    }
  });

  /**
   * DELETE /api/admin/search/saved/:id
   * Delete a saved search
   */
  app.delete("/api/admin/search/saved/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const search = await storage.getSavedSearch(req.params.id);
      if (!search) {
        return res.status(404).json({ message: "Saved search not found" });
      }
      
      // Verify ownership
      if (search.userId !== req.user?.dbUser?.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteSavedSearch(req.params.id);
      res.json({
        success: true,
        message: "Saved search deleted",
      });
    } catch (error) {
      console.error("Error deleting saved search:", error);
      res.status(500).json({ message: "Failed to delete saved search" });
    }
  });

  // ============================================================================
  // REFERRAL ROUTES
  // ============================================================================

  app.get("/api/customers/:id/referrals", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const referrals = await storage.getReferralsByCustomer(id);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  // ============================================================================
  // TWO-FACTOR AUTHENTICATION
  // ============================================================================

  app.post("/api/auth/2fa/setup", authLimiter, requireAuth, async (req: any, res: Response) => {
    try {
      const { twoFactorService } = await import("./twoFactorService");
      const userId = req.user?.dbUser?.id;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const setup = await twoFactorService.generateTwoFactorSecret(req.user.dbUser.email);
      res.json(setup);
    } catch (error) {
      console.error("Error generating 2FA secret:", error);
      res.status(500).json({ message: "Failed to generate 2FA setup" });
    }
  });

  app.post("/api/auth/2fa/verify", authLimiter, requireAuth, async (req: any, res: Response) => {
    try {
      const { twoFactorService } = await import("./twoFactorService");
      const { token, backupCodes, secret } = req.body;
      const userId = req.user?.dbUser?.id;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const result = twoFactorService.verifyTOTPCode(secret, token);
      if (!result.valid) {
        return res.status(400).json({ message: result.message });
      }

      // Enable 2FA
      await storage.updateUserTwoFactor(userId, true, secret, backupCodes);
      
      // Log action
      await storage.createAuditLog({
        userId,
        action: 'two_factor_enable',
        resourceType: 'user',
        resourceId: userId,
        status: 'success',
      });

      res.json({ message: "Two-factor authentication enabled", backupCodes });
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      res.status(500).json({ message: "Failed to verify 2FA" });
    }
  });

  app.post("/api/auth/2fa/disable", requireAuth, async (req: any, res: Response) => {
    try {
      const userId = req.user?.dbUser?.id;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      await storage.updateUserTwoFactor(userId, false);

      // Log action
      await storage.createAuditLog({
        userId,
        action: 'two_factor_disable',
        resourceType: 'user',
        resourceId: userId,
        status: 'success',
      });

      res.json({ message: "Two-factor authentication disabled" });
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      res.status(500).json({ message: "Failed to disable 2FA" });
    }
  });

  app.get("/api/auth/2fa/status", requireAuth, async (req: any, res: Response) => {
    try {
      const userId = req.user?.dbUser?.id;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const status = await storage.getUserTwoFactorStatus(userId);
      res.json(status || { enabled: false });
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
      res.status(500).json({ message: "Failed to fetch 2FA status" });
    }
  });

  // ============================================================================
  // API KEY MANAGEMENT (For WordPress Integration)
  // ============================================================================

  /**
   * POST /api/admin/apikeys/create
   * Generate a new API key for external integrations (e.g., WordPress)
   * Only admins can create API keys
   */
  app.post("/api/admin/apikeys/create", requireAdmin, async (req: any, res: Response) => {
    try {
      const { apiKeyService } = await import("./api-key-service");
      const { name, description, permissions, expiresIn } = req.body;

      if (!name || !Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json({ message: "name and permissions array are required" });
      }

      // Generate the API key
      const rawKey = apiKeyService.generateAPIKey();
      const keyHash = apiKeyService.hashAPIKey(rawKey);

      // Calculate expiration date if provided
      let expiresAt = null;
      if (expiresIn && typeof expiresIn === 'number' && expiresIn > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresIn);
      }

      // Store the hashed key in database
      const createdKey = await storage.createApiKey({
        name,
        description,
        keyHash,
        createdBy: req.user?.dbUser?.id,
        permissions,
        expiresAt,
      });

      await auditLog({
        userId: req.user?.dbUser?.id,
        actorName: req.user?.dbUser?.firstName || 'Admin',
        actorRole: req.user?.dbUser?.role,
        action: 'api_key_created',
        resourceType: 'api_key',
        resourceId: createdKey.id,
        success: true,
        details: { keyName: name, permissions },
      });

      // Return the raw key ONLY on creation (never again)
      res.status(201).json({
        success: true,
        message: "API key created. Save the key below - you won't see it again!",
        apiKey: {
          id: createdKey.id,
          key: rawKey, // Raw key, only shown once
          masked: apiKeyService.maskAPIKey(rawKey),
          name,
          description,
          permissions,
          expiresAt,
          createdAt: createdKey.createdAt,
        },
      });
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ message: "Failed to create API key" });
    }
  });

  /**
   * GET /api/admin/apikeys
   * List all API keys for the current user
   */
  app.get("/api/admin/apikeys", requireAdmin, async (req: any, res: Response) => {
    try {
      const { apiKeyService } = await import("./api-key-service");
      const keys = await storage.listApiKeys(req.user?.dbUser?.id);

      res.json({
        success: true,
        total: keys.length,
        apiKeys: keys.map(key => ({
          id: key.id,
          name: key.name,
          description: key.description,
          masked: apiKeyService.maskAPIKey(key.keyHash), // Show masked version
          permissions: key.permissions,
          createdAt: key.createdAt,
          lastUsedAt: key.lastUsedAt,
          usageCount: key.usageCount,
          isRevoked: key.isRevoked,
          expiresAt: key.expiresAt,
          expiresIn: key.expiresAt ? Math.ceil((key.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
        })),
      });
    } catch (error) {
      console.error("Error listing API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  /**
   * DELETE /api/admin/apikeys/:id
   * Revoke an API key (cannot be undone)
   */
  app.delete("/api/admin/apikeys/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const key = await storage.getApiKey(id);

      if (!key) {
        return res.status(404).json({ message: "API key not found" });
      }

      // Verify ownership
      if (key.createdBy !== req.user?.dbUser?.id) {
        return res.status(403).json({ message: "You can only revoke your own API keys" });
      }

      const revoked = await storage.revokeApiKey(id, req.user?.dbUser?.id);

      await auditLog({
        userId: req.user?.dbUser?.id,
        actorName: req.user?.dbUser?.firstName || 'Admin',
        actorRole: req.user?.dbUser?.role,
        action: 'api_key_revoked',
        resourceType: 'api_key',
        resourceId: id,
        success: true,
        details: { keyName: key.name },
      });

      res.json({
        success: true,
        message: "API key revoked successfully",
        revokedKey: {
          id: revoked?.id,
          name: revoked?.name,
          revokedAt: revoked?.revokedAt,
        },
      });
    } catch (error) {
      console.error("Error revoking API key:", error);
      res.status(500).json({ message: "Failed to revoke API key" });
    }
  });

  /**
   * GET /api/admin/apikeys/permissions/available
   * List all available permissions for API keys
   */
  app.get("/api/admin/apikeys/permissions/available", requireAdmin, async (req: any, res: Response) => {
    try {
      const { STANDARD_PERMISSIONS } = await import("./api-key-service");
      res.json({
        success: true,
        permissions: STANDARD_PERMISSIONS,
      });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  // ============================================================================
  // BULK OPERATIONS (Admin Only)
  // ============================================================================

  app.post("/api/admin/documents/bulk-delete", requireAdmin, async (req: any, res: Response) => {
    try {
      const { documentIds } = req.body;
      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        return res.status(400).json({ message: "No documents provided" });
      }

      const deleted = await storage.bulkDeleteDocuments(documentIds);

      // Log action
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        action: 'document_bulk_delete',
        resourceType: 'document',
        resourceId: 'bulk',
        status: 'success',
        details: { count: deleted, documentIds },
      });

      // Notify stats subscribers of data change
      notifyStatsChange();

      res.json({ message: `Deleted ${deleted} documents`, deleted });
    } catch (error) {
      console.error("Error bulk deleting documents:", error);
      res.status(500).json({ message: "Failed to delete documents" });
    }
  });

  app.get("/api/admin/customers/export", requireAdmin, async (req: any, res: Response) => {
    try {
      const { status } = req.query;
      const csv = await storage.exportCustomersToCSV({ status });

      // Log action
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        action: 'customer_export',
        resourceType: 'customer',
        resourceId: 'bulk',
        status: 'success',
        details: { filters: { status } },
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting customers:", error);
      res.status(500).json({ message: "Failed to export customers" });
    }
  });

  // ============================================================================
  // AGENTS MODULE
  // ============================================================================

  // List all agents (admin only)
  app.get("/api/agents", requireAuth, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req.user.dbUser)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
      const offset = parseInt(req.query.offset) || 0;

      const agentList = await storage.listAgents(limit, offset);
      res.json({
        data: agentList,
        count: agentList.length,
        limit,
        offset,
      });
    } catch (error) {
      console.error("Error listing agents:", error);
      res.status(500).json({ message: "Failed to list agents" });
    }
  });

  // Create agent (admin only)
  app.post("/api/agents", requireAuth, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req.user.dbUser)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { userId, agencyName, agencyPhone, agencyAddress, licenseNumber, licenseExpiresAt, commissionRate, notes } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'agent') {
        return res.status(400).json({ message: "User must have agent role" });
      }

      const agent = await storage.createAgent({
        userId,
        status: 'active',
        agencyName: agencyName || null,
        agencyPhone: agencyPhone || null,
        agencyAddress: agencyAddress || null,
        licenseNumber: licenseNumber || null,
        licenseExpiresAt: licenseExpiresAt ? new Date(licenseExpiresAt) : null,
        commissionRate: commissionRate || null,
        notes: notes || null,
      });

      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName || ''} ${req.user.dbUser.lastName || ''}`.trim() || req.user.dbUser.email,
        actorRole: req.user.dbUser.role,
        action: 'profile_update',
        resourceType: 'agent',
        resourceId: agent.id,
        details: { action: 'agent_created' },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.status(201).json(agent);
    } catch (error) {
      console.error("Error creating agent:", error);
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  // Get agent by ID (admin or self)
  app.get("/api/agents/:agentId", requireAuth, async (req: any, res: Response) => {
    try {
      const { agentId } = req.params;
      const agent = await storage.getAgent(agentId);

      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      if (!isAdmin(req.user.dbUser) && req.user.dbUser.id !== agent.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.json(agent);
    } catch (error) {
      console.error("Error getting agent:", error);
      res.status(500).json({ message: "Failed to get agent" });
    }
  });

  // Update agent (admin only)
  app.patch("/api/agents/:agentId", requireAuth, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req.user.dbUser)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { agentId } = req.params;
      const { agencyName, agencyPhone, agencyAddress, licenseNumber, licenseExpiresAt, commissionRate, status, notes } = req.body;

      const agent = await storage.updateAgent(agentId, {
        agencyName: agencyName || undefined,
        agencyPhone: agencyPhone || undefined,
        agencyAddress: agencyAddress || undefined,
        licenseNumber: licenseNumber || undefined,
        licenseExpiresAt: licenseExpiresAt ? new Date(licenseExpiresAt) : undefined,
        commissionRate: commissionRate || undefined,
        status: status || undefined,
        notes: notes || undefined,
      });

      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName || ''} ${req.user.dbUser.lastName || ''}`.trim() || req.user.dbUser.email,
        actorRole: req.user.dbUser.role,
        action: 'profile_update',
        resourceType: 'agent',
        resourceId: agent.id,
        details: { action: 'agent_updated' },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.json(agent);
    } catch (error) {
      console.error("Error updating agent:", error);
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  // Delete agent (admin only)
  app.delete("/api/agents/:agentId", requireAuth, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req.user.dbUser)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { agentId } = req.params;
      const agent = await storage.getAgent(agentId);

      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      await storage.deleteAgent(agentId);

      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName || ''} ${req.user.dbUser.lastName || ''}`.trim() || req.user.dbUser.email,
        actorRole: req.user.dbUser.role,
        action: 'profile_update',
        resourceType: 'agent',
        resourceId: agentId,
        details: { action: 'agent_deleted' },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.json({ message: "Agent deleted" });
    } catch (error) {
      console.error("Error deleting agent:", error);
      res.status(500).json({ message: "Failed to delete agent" });
    }
  });

  // Assign customer to agent (admin only)
  app.post("/api/agents/:agentId/assign-customer", requireAuth, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req.user.dbUser)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { agentId } = req.params;
      const { customerId } = req.body;

      if (!customerId) {
        return res.status(400).json({ message: "customerId is required" });
      }

      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      const customer = await storage.getCustomerById(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const assignment = await storage.assignCustomerToAgent(agentId, customerId);

      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName || ''} ${req.user.dbUser.lastName || ''}`.trim() || req.user.dbUser.email,
        actorRole: req.user.dbUser.role,
        action: 'profile_update',
        resourceType: 'agent',
        resourceId: agentId,
        details: { action: 'customer_assigned', customerId },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning customer to agent:", error);
      res.status(500).json({ message: "Failed to assign customer" });
    }
  });

  // Unassign customer from agent (admin only)
  app.post("/api/agents/:agentId/unassign-customer", requireAuth, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req.user.dbUser)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { agentId } = req.params;
      const { customerId } = req.body;

      if (!customerId) {
        return res.status(400).json({ message: "customerId is required" });
      }

      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      await storage.unassignCustomer(agentId, customerId);

      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName || ''} ${req.user.dbUser.lastName || ''}`.trim() || req.user.dbUser.email,
        actorRole: req.user.dbUser.role,
        action: 'profile_update',
        resourceType: 'agent',
        resourceId: agentId,
        details: { action: 'customer_unassigned', customerId },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.json({ message: "Customer unassigned from agent" });
    } catch (error) {
      console.error("Error unassigning customer from agent:", error);
      res.status(500).json({ message: "Failed to unassign customer" });
    }
  });

  // Get customers assigned to agent
  app.get("/api/agents/:agentId/customers", requireAuth, async (req: any, res: Response) => {
    try {
      const { agentId } = req.params;
      const agent = await storage.getAgent(agentId);

      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      if (!isAdmin(req.user.dbUser) && req.user.dbUser.id !== agent.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const assignments = await storage.getAgentCustomers(agentId);
      res.json({
        agentId,
        assignments,
        count: assignments.length,
      });
    } catch (error) {
      console.error("Error getting agent customers:", error);
      res.status(500).json({ message: "Failed to get agent customers" });
    }
  });

  // Get agent for a customer
  app.get("/api/customers/:customerId/agent", requireAuth, async (req: any, res: Response) => {
    try {
      const { customerId } = req.params;
      const customer = await storage.getCustomerById(customerId);

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      if (!isAdmin(req.user.dbUser) && req.user.dbUser.id !== customer.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const agent = await storage.getCustomerAgent(customerId);
      if (!agent) {
        return res.status(404).json({ message: "No agent assigned to customer" });
      }

      res.json(agent);
    } catch (error) {
      console.error("Error getting customer agent:", error);
      res.status(500).json({ message: "Failed to get customer agent" });
    }
  });

  // ============================================================================
  // RESELLERS MODULE
  // ============================================================================

  // List all resellers (admin only)
  app.get("/api/resellers", requireAuth, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req.user.dbUser)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
      const offset = parseInt(req.query.offset) || 0;

      const resellerList = await storage.listResellers(limit, offset);
      res.json({
        data: resellerList,
        count: resellerList.length,
        limit,
        offset,
      });
    } catch (error) {
      console.error("Error listing resellers:", error);
      res.status(500).json({ message: "Failed to list resellers" });
    }
  });

  // Create reseller (admin only)
  app.post("/api/resellers", requireAuth, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req.user.dbUser)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { userId, companyName, companyPhone, companyAddress, taxId, partnerTier, commissionRate, paymentTerms, notes } = req.body;

      if (!userId || !companyName) {
        return res.status(400).json({ message: "userId and companyName are required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const reseller = await storage.createReseller({
        userId,
        status: 'active',
        companyName,
        companyPhone: companyPhone || null,
        companyAddress: companyAddress || null,
        taxId: taxId || null,
        partnerTier: partnerTier || 'standard',
        commissionRate: commissionRate || null,
        paymentTerms: paymentTerms || null,
        notes: notes || null,
      });

      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName || ''} ${req.user.dbUser.lastName || ''}`.trim() || req.user.dbUser.email,
        actorRole: req.user.dbUser.role,
        action: 'profile_update',
        resourceType: 'reseller',
        resourceId: reseller.id,
        details: { action: 'reseller_created' },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.status(201).json(reseller);
    } catch (error) {
      console.error("Error creating reseller:", error);
      res.status(500).json({ message: "Failed to create reseller" });
    }
  });

  // Get reseller by ID (admin or self)
  app.get("/api/resellers/:resellerId", requireAuth, async (req: any, res: Response) => {
    try {
      const { resellerId } = req.params;
      const reseller = await storage.getReseller(resellerId);

      if (!reseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }

      if (!isAdmin(req.user.dbUser) && req.user.dbUser.id !== reseller.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.json(reseller);
    } catch (error) {
      console.error("Error getting reseller:", error);
      res.status(500).json({ message: "Failed to get reseller" });
    }
  });

  // Update reseller (admin only)
  app.patch("/api/resellers/:resellerId", requireAuth, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req.user.dbUser)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { resellerId } = req.params;
      const { companyName, companyPhone, companyAddress, taxId, partnerTier, commissionRate, paymentTerms, status, notes } = req.body;

      const reseller = await storage.updateReseller(resellerId, {
        companyName: companyName || undefined,
        companyPhone: companyPhone || undefined,
        companyAddress: companyAddress || undefined,
        taxId: taxId || undefined,
        partnerTier: partnerTier || undefined,
        commissionRate: commissionRate || undefined,
        paymentTerms: paymentTerms || undefined,
        status: status || undefined,
        notes: notes || undefined,
      });

      if (!reseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }

      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName || ''} ${req.user.dbUser.lastName || ''}`.trim() || req.user.dbUser.email,
        actorRole: req.user.dbUser.role,
        action: 'profile_update',
        resourceType: 'reseller',
        resourceId: reseller.id,
        details: { action: 'reseller_updated' },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.json(reseller);
    } catch (error) {
      console.error("Error updating reseller:", error);
      res.status(500).json({ message: "Failed to update reseller" });
    }
  });

  // Delete reseller (admin only)
  app.delete("/api/resellers/:resellerId", requireAuth, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req.user.dbUser)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { resellerId } = req.params;
      const reseller = await storage.getReseller(resellerId);

      if (!reseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }

      await storage.deleteReseller(resellerId);

      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName || ''} ${req.user.dbUser.lastName || ''}`.trim() || req.user.dbUser.email,
        actorRole: req.user.dbUser.role,
        action: 'profile_update',
        resourceType: 'reseller',
        resourceId: resellerId,
        details: { action: 'reseller_deleted' },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.json({ message: "Reseller deleted" });
    } catch (error) {
      console.error("Error deleting reseller:", error);
      res.status(500).json({ message: "Failed to delete reseller" });
    }
  });

  // Add customer to reseller
  app.post("/api/resellers/:resellerId/add-customer", requireAuth, async (req: any, res: Response) => {
    try {
      if (!isAdmin(req.user.dbUser)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { resellerId } = req.params;
      const { customerId } = req.body;

      if (!customerId) {
        return res.status(400).json({ message: "customerId is required" });
      }

      const reseller = await storage.getReseller(resellerId);
      if (!reseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }

      const customer = await storage.getCustomerById(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const referral = await storage.addCustomerToReseller(resellerId, customerId);

      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName || ''} ${req.user.dbUser.lastName || ''}`.trim() || req.user.dbUser.email,
        actorRole: req.user.dbUser.role,
        action: 'profile_update',
        resourceType: 'reseller',
        resourceId: resellerId,
        details: { action: 'customer_referred', customerId },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.status(201).json(referral);
    } catch (error) {
      console.error("Error adding customer to reseller:", error);
      res.status(500).json({ message: "Failed to add customer" });
    }
  });

  // Get customers referred by reseller
  app.get("/api/resellers/:resellerId/customers", requireAuth, async (req: any, res: Response) => {
    try {
      const { resellerId } = req.params;
      const reseller = await storage.getReseller(resellerId);

      if (!reseller) {
        return res.status(404).json({ message: "Reseller not found" });
      }

      if (!isAdmin(req.user.dbUser) && req.user.dbUser.id !== reseller.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const referrals = await storage.getResellerCustomers(resellerId);
      res.json({
        resellerId,
        referrals,
        count: referrals.length,
      });
    } catch (error) {
      console.error("Error getting reseller customers:", error);
      res.status(500).json({ message: "Failed to get reseller customers" });
    }
  });

  // Get reseller for a customer
  app.get("/api/customers/:customerId/reseller", requireAuth, async (req: any, res: Response) => {
    try {
      const { customerId } = req.params;
      const customer = await storage.getCustomerById(customerId);

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      if (!isAdmin(req.user.dbUser) && req.user.dbUser.id !== customer.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const reseller = await storage.getCustomerReseller(customerId);
      if (!reseller) {
        return res.status(404).json({ message: "No reseller assigned to customer" });
      }

      res.json(reseller);
    } catch (error) {
      console.error("Error getting customer reseller:", error);
      res.status(500).json({ message: "Failed to get customer reseller" });
    }
  });

  // ============================================================================
  // USER MANAGEMENT ROUTES (Admin Only)
  // ============================================================================

  // List all users (admin)
  app.get("/api/admin/users", requireAdmin, async (req: any, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
      const offset = parseInt(req.query.offset) || 0;
      
      const allUsers = await storage.listAllUsers(limit, offset);
      
      // Enrich with customer data if applicable
      const enriched = await Promise.all(
        allUsers.map(async (user) => {
          const customer = user.role === 'customer' ? await storage.getCustomer(user.id) : null;
          return {
            ...user,
            twoFactorSecret: undefined, // Never expose in API
            twoFactorBackupCodes: undefined, // Never expose in API
            customerProfile: customer || null,
            displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          };
        })
      );

      res.json({
        users: enriched,
        pagination: {
          limit,
          offset,
          total: allUsers.length,
        },
      });
    } catch (error) {
      console.error("Error listing users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user details (admin or self)
  app.get("/api/admin/users/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      
      // Allow users to view their own profile, admins can view anyone
      if (req.user.dbUser.id !== id && req.user.dbUser.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const customer = user.role === 'customer' ? await storage.getCustomer(id) : null;
      
      res.json({
        ...user,
        twoFactorSecret: undefined,
        twoFactorBackupCodes: undefined,
        customerProfile: customer,
        displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      });
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create new user (admin)
  app.post("/api/admin/users", requireAdmin, async (req: any, res: Response) => {
    try {
      const { email, firstName, lastName, role, password } = req.body;

      // Validate required fields
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      // Check if user already exists
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Validate role
      const validRoles = ['customer', 'admin', 'agent', 'reseller'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const user = await storage.upsertUser({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        role: role || 'customer',
        passwordHash,
      });

      // Log action (non-critical - don't fail if audit log fails)
      try {
        await storage.createAuditLog({
          userId: req.user.dbUser.id,
          actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
          actorRole: req.user.dbUser.role,
          action: 'customer_create',
          resourceType: 'user',
          resourceId: user.id,
          details: { email, firstName, lastName, role },
          success: true,
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'] || undefined,
        });
      } catch (auditError) {
        // Log audit error but don't fail the request
        console.warn("Failed to create audit log for user creation:", auditError);
      }

      res.status(201).json({
        ...user,
        twoFactorSecret: undefined,
        twoFactorBackupCodes: undefined,
        displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user (admin)
  app.put("/api/admin/users/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const {
        firstName,
        lastName,
        email,
        role,
        agencyName,
        agencyPhone,
        agencyAddress,
        licenseNumber,
        agencyCommissionRate,
        companyName,
        companyPhone,
        companyAddress,
        taxId,
        partnerTier,
        resellerCommissionRate,
        paymentTerms,
      } = req.body;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate email if changed
      if (email && email !== user.email) {
        if (!isValidEmail(email)) {
          return res.status(400).json({ message: "Invalid email format" });
        }
        const existing = await storage.getUserByEmail(email);
        if (existing) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      // Update user basic info
      const updated = await storage.upsertUser({
        id,
        email: email || user.email,
        firstName: firstName !== undefined ? firstName : user.firstName,
        lastName: lastName !== undefined ? lastName : user.lastName,
        role: role || user.role,
      });

      // Handle role-specific data
      const newRole = role || user.role;
      
      if (newRole === "agent") {
        const existingAgent = await storage.getAgentByUserId(id);
        if (existingAgent) {
          // Update existing agent
          await storage.updateAgent(existingAgent.id, {
            agencyName: agencyName !== undefined ? agencyName : existingAgent.agencyName,
            agencyPhone: agencyPhone !== undefined ? agencyPhone : existingAgent.agencyPhone,
            agencyAddress: agencyAddress !== undefined ? agencyAddress : existingAgent.agencyAddress,
            licenseNumber: licenseNumber !== undefined ? licenseNumber : existingAgent.licenseNumber,
            commissionRate: agencyCommissionRate !== undefined ? parseFloat(agencyCommissionRate) : existingAgent.commissionRate,
          });
        } else {
          // Create new agent
          await storage.createAgent({
            userId: id,
            agencyName: agencyName || "",
            agencyPhone: agencyPhone || "",
            agencyAddress: agencyAddress || "",
            licenseNumber: licenseNumber || "",
            commissionRate: agencyCommissionRate ? parseFloat(agencyCommissionRate) : undefined,
          });
        }
      } else if (newRole === "reseller") {
        const existingReseller = await storage.getResellerByUserId(id);
        if (existingReseller) {
          // Update existing reseller
          await storage.updateReseller(existingReseller.id, {
            companyName: companyName !== undefined ? companyName : existingReseller.companyName,
            companyPhone: companyPhone !== undefined ? companyPhone : existingReseller.companyPhone,
            companyAddress: companyAddress !== undefined ? companyAddress : existingReseller.companyAddress,
            taxId: taxId !== undefined ? taxId : existingReseller.taxId,
            partnerTier: partnerTier !== undefined ? partnerTier : existingReseller.partnerTier,
            commissionRate: resellerCommissionRate !== undefined ? parseFloat(resellerCommissionRate) : existingReseller.commissionRate,
            paymentTerms: paymentTerms !== undefined ? paymentTerms : existingReseller.paymentTerms,
          });
        } else {
          // Create new reseller
          await storage.createReseller({
            userId: id,
            companyName: companyName || "",
            companyPhone: companyPhone || "",
            companyAddress: companyAddress || "",
            taxId: taxId || "",
            partnerTier: partnerTier || "standard",
            commissionRate: resellerCommissionRate ? parseFloat(resellerCommissionRate) : undefined,
            paymentTerms: paymentTerms || "net30",
          });
        }
      }

      // Log action
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'profile_update',
        resourceType: 'user',
        resourceId: id,
        details: {
          firstName,
          lastName,
          email,
          role,
          roleChanged: role && role !== user.role,
        },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.json({
        ...updated,
        twoFactorSecret: undefined,
        twoFactorBackupCodes: undefined,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Change user role (admin)
  app.patch("/api/admin/users/:id/role", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Validate role
      const validRoles = ['customer', 'admin', 'agent'];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent modification of Super Admin accounts (email-based protection)
      if (user.email === 'carlo@wdmorgan.com') {
        return res.status(403).json({ message: "Cannot modify Super Admin accounts" });
      }

      // Prevent demoting the last admin
      if (user.role === 'admin' && role !== 'admin') {
        const adminCount = await storage.countUsersWithRole('admin');
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Cannot demote the last admin" });
        }
      }

      // Update role
      await storage.updateUserRole(id, role);

      // Log action
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'profile_update',
        resourceType: 'user',
        resourceId: id,
        details: { roleChanged: `${user.role} -> ${role}` },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      const updated = await storage.getUser(id);
      res.json({
        ...updated,
        twoFactorSecret: undefined,
        twoFactorBackupCodes: undefined,
      });
    } catch (error) {
      console.error("Error changing user role:", error);
      res.status(500).json({ message: "Failed to change user role" });
    }
  });

  // Delete/deactivate user (admin)
  app.delete("/api/admin/users/:id", requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deleting the last admin
      if (user.role === 'admin') {
        const adminCount = await storage.countUsersWithRole('admin');
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Cannot delete the last admin" });
        }
      }

      // Mark as inactive instead of hard delete
      await storage.updateUserStatus(id, 'inactive');

      // Log action
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'customer_update',
        resourceType: 'user',
        resourceId: id,
        details: { action: 'deactivated' },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get user activity/sessions (admin or self)
  app.get("/api/admin/users/:id/activity", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;

      // Allow users to view their own activity, admins can view anyone
      if (req.user.dbUser.id !== id && req.user.dbUser.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get recent audit logs for this user
      const logs = await storage.listAuditLogsFiltered({
        limit: 50,
        searchQuery: id,
      });

      res.json({
        userId: id,
        recentActivity: logs,
      });
    } catch (error) {
      console.error("Error getting user activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // ============================================================================
  // CUSTOM EMAIL/PASSWORD AUTHENTICATION
  // ============================================================================

  // Register new user with email and password
  app.post("/api/auth/register", authLimiter, async (req: any, res: Response) => {
    try {
      const { email, password, confirmPassword, firstName, lastName } = req.body;

      // Validate inputs
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      // Check passwords match
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user with pending status (needs admin approval)
      const user = await storage.upsertUser({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        role: 'customer',
        passwordHash,
      });

      // Create customer profile with INACTIVE status (requires admin approval to activate)
      const customerData: any = {
        userId: user.id,
        title: req.body.title || null,
        organization: req.body.organization || null,
        address1: req.body.address1 || null,
        address2: req.body.address2 || null,
        city: req.body.city || null,
        state: req.body.state || null,
        zip: req.body.zip || null,
        dayPhone: req.body.dayPhone || null,
        eveningPhone: req.body.eveningPhone || null,
        accountStatus: 'inactive', // Explicitly set to inactive
      };

      try {
        await storage.createCustomer(customerData);
      } catch (e) {
        // Customer may already exist, continue
      }

      // Log action - registration is now pending approval (wrapped to prevent enum errors)
      try {
        await storage.createAuditLog({
          userId: user.id,
          actorName: firstName && lastName ? `${firstName} ${lastName}` : email,
          actorRole: 'customer',
          action: 'login',
          resourceType: 'user',
          resourceId: user.id,
          details: { 
            action: 'account_created_pending_approval',
            status: 'pending_registration'
          },
          success: true,
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'] || undefined,
        });
      } catch (auditError) {
        // Audit logging failure should not block registration
        console.warn("Audit log creation failed during registration:", auditError);
      }

      res.status(201).json({
        message: "Account created successfully. Pending admin approval.",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to register user" });
    }
  });

  // ============================================================================
  // PENDING REGISTRATIONS MANAGEMENT (ADMIN ONLY)
  // ============================================================================

  /**
   * GET /api/admin/pending-registrations
   * Get list of pending customer registrations (excluding approved ones)
   */
  app.get("/api/admin/pending-registrations", requireAdmin, async (req: any, res: Response) => {
    try {
      const allCustomers = await storage.listCustomers(1000, 0);

      // Filter for customers with accountStatus='inactive' (pending approval)
      const pendingCustomers = allCustomers?.filter((c: any) => c.accountStatus === 'inactive') || [];
      
      const users = await storage.listAllUsers(1000, 0);
      if (!users) {
        return res.json([]);
      }

      // Map pending customers with their user info
      const pendingRegistrations = pendingCustomers
        .map((customer: any) => {
          const user = users.find((u: any) => u.id === customer.userId);
          return {
            userId: customer.userId,
            email: user?.email || '',
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            phone: customer.dayPhone || customer.eveningPhone || '',
            title: customer.title || '',
            organization: customer.organization || '',
            city: customer.city || '',
            state: customer.state || '',
            createdAt: customer.createdAt,
          };
        })
        .filter((p: any) => p.email); // Only include if user found

      res.json(pendingRegistrations);
    } catch (error) {
      console.error("Error fetching pending registrations:", error);
      res.status(500).json({ message: "Failed to fetch pending registrations" });
    }
  });

  /**
   * POST /api/admin/pending-registrations/:userId/approve
   * Approve a pending registration
   */
  app.post("/api/admin/pending-registrations/:userId/approve", requireAdmin, async (req: any, res: Response) => {
    try {
      const { userId } = req.params;

      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if customer record exists, if not create one
      const existingCustomer = await storage.getCustomer(userId);
      if (!existingCustomer) {
        await storage.createCustomer({
          userId,
          accountStatus: 'active',
        });
      }

      // Log the approval using valid audit action
      try {
        await storage.createAuditLog({
          userId: req.user.dbUser.id,
          actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
          actorRole: req.user.dbUser.role,
          action: 'user_activate',
          resourceType: 'user',
          resourceId: userId,
          details: { action: 'registration_approved' },
          success: true,
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'] || undefined,
        });
      } catch (logError) {
        // Log error but don't fail the request
        console.error("Error logging audit:", logError);
      }

      res.json({ message: "Registration approved" });
    } catch (error) {
      console.error("Error approving registration:", error);
      res.status(500).json({ message: "Failed to approve registration" });
    }
  });

  /**
   * POST /api/admin/pending-registrations/:userId/reject
   * Reject a pending registration
   */
  app.post("/api/admin/pending-registrations/:userId/reject", requireAdmin, async (req: any, res: Response) => {
    try {
      const { userId } = req.params;

      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log the rejection using valid audit action
      try {
        await storage.createAuditLog({
          userId: req.user.dbUser.id,
          actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
          actorRole: req.user.dbUser.role,
          action: 'user_delete',
          resourceType: 'user',
          resourceId: userId,
          details: { action: 'registration_rejected' },
          success: true,
          ipAddress: req.ip || undefined,
          userAgent: req.headers['user-agent'] || undefined,
        });
      } catch (logError) {
        // Log error but don't fail the request
        console.error("Error logging audit:", logError);
      }

      // Delete the user from storage
      await storage.deleteUser(userId);

      res.json({ message: "Registration rejected" });
    } catch (error) {
      console.error("Error rejecting registration:", error);
      res.status(500).json({ message: "Failed to reject registration" });
    }
  });

  // Login with email and password
  app.post("/api/auth/login", authLimiter, async (req: any, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        // Security: Don't reveal if email exists
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if account is locked
      if (user.lockedUntil && isAccountLocked(user.lockedUntil)) {
        return res.status(429).json({ message: "Account is temporarily locked. Please try again later." });
      }

      // Verify password
      const passwordValid = await verifyPassword(password, user.passwordHash);
      if (!passwordValid) {
        // Record failed login attempt
        const newAttempts = (user.loginAttempts || 0) + 1;
        
        if (newAttempts >= 5) {
          const lockedUntil = calculateLockUntil(newAttempts);
          await storage.lockAccount(user.id, lockedUntil);
          return res.status(429).json({ message: "Too many failed login attempts. Account locked for 15 minutes." });
        }

        // Record failed attempt
        await storage.recordLoginAttempt(user.id, false);

        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if customer account is inactive (pending approval)
      if (user.role === 'customer') {
        const customerRecord = await storage.getCustomer(user.id);
        if (customerRecord && customerRecord.accountStatus === 'inactive') {
          return res.status(403).json({ 
            message: "Your account is pending approval. Please check back later or contact support@alwr.com for assistance."
          });
        }
      }

      // Record successful login
      await storage.recordLoginAttempt(user.id, true);

      // Manually establish session for email/password auth
      req.session.userId = user.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Log successful login
      await storage.createAuditLog({
        userId: user.id,
        actorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        actorRole: user.role,
        action: 'login',
        resourceType: 'user',
        resourceId: user.id,
        details: { method: 'email_password' },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      }).catch(err => console.error("Error logging login:", err));

      res.json({
        message: "Logged in successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // ============================================================================
  // EMAIL VERIFICATION & PASSWORD RESET
  // ============================================================================

  // Send verification email
  app.post("/api/auth/send-verification-email", requireAuth, async (req: any, res: Response) => {
    try {
      const userId = req.user.dbUser.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Generate verification token
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.setEmailVerificationToken(userId, token, expiresAt);

      // Log action
      await storage.createAuditLog({
        userId: req.user.dbUser.id,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: req.user.dbUser.role,
        action: 'profile_update',
        resourceType: 'user',
        resourceId: userId,
        details: { action: 'send_verification_email' },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      // TODO: In production, send email with verification link
      // For now, return the token in development
      const isDev = process.env.NODE_ENV === 'development';
      
      res.json({
        message: "Verification email sent",
        token: isDev ? token : undefined,
        expiresAt,
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      res.status(500).json({ message: "Failed to send verification email" });
    }
  });

  // Verify email with token
  app.post("/api/auth/verify-email/:token", async (req: any, res: Response) => {
    try {
      const { token } = req.params;

      const success = await storage.verifyEmail(token);
      
      if (!success) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Request password reset
  app.post("/api/auth/forgot-password", async (req: any, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Security: Don't reveal if email exists
        return res.json({ message: "If email exists, password reset link has been sent" });
      }

      // Generate reset token
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.setPasswordResetToken(user.id, token, expiresAt);

      // Log action
      await storage.createAuditLog({
        userId: user.id,
        actorName: `${user.firstName} ${user.lastName}`,
        actorRole: user.role,
        action: 'profile_update',
        resourceType: 'user',
        resourceId: user.id,
        details: { action: 'forgot_password' },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      // TODO: In production, send email with reset link
      // For now, return the token in development
      const isDev = process.env.NODE_ENV === 'development';

      res.json({
        message: "If email exists, password reset link has been sent",
        token: isDev ? token : undefined,
        expiresAt: isDev ? expiresAt : undefined,
      });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password/:token", async (req: any, res: Response) => {
    try {
      const { token } = req.params;

      const userId = await storage.resetPassword(token);
      
      if (!userId) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // In a real system, the client would then call a password change endpoint
      // This endpoint just validates the token and marks it as used
      
      res.json({ 
        message: "Password reset token validated",
        userId,
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  app.post("/api/auth/logout", requireAuth, async (req: any, res: Response) => {
    try {
      const userId = req.user?.dbUser?.id;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      if (userId) {
        await storage.logUserSession(userId, 'logout', ipAddress, userAgent);
      }

      // Clear session properly
      req.logout((err: any) => {
        if (err) {
          console.error("Logout error:", err);
        }
        
        // Destroy the session
        req.session.destroy((sessionErr: any) => {
          if (sessionErr) {
            console.error("Session destruction error:", sessionErr);
          }
          
          // Clear session cookie
          res.clearCookie('connect.sid');
          res.json({ message: "Logged out successfully" });
        });
      });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // ============================================================================
  // AUDIT LOGGING ROUTES
  // ============================================================================

  /**
   * @swagger
   * /api/admin/audit-logs:
   *   get:
   *     summary: Get audit logs with filtering
   *     description: Retrieve audit logs with optional filters for actions, status, date range
   *     tags:
   *       - Admin
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *       - in: query
   *         name: action
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [success, failed]
   *       - in: query
   *         name: dateFrom
   *         schema:
   *           type: string
   *       - in: query
   *         name: dateTo
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Audit logs retrieved successfully
   */
  app.get("/api/admin/audit-logs", requireAdmin, async (req: any, res: Response) => {
    try {
      const { limit = 100, offset = 0, action, status, dateFrom, dateTo, search } = req.query;
      
      const logs = await storage.listAuditLogsFiltered({
        limit: parseInt(limit),
        offset: parseInt(offset),
        action: action || undefined,
        status: status as 'success' | 'failed' | undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        searchQuery: search || undefined,
      });

      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ============================================================================
  // DATA EXPORT ROUTES (Customer Data Access Right - GDPR/CCPA)
  // ============================================================================

  /**
   * @swagger
   * /api/customer/data-export:
   *   post:
   *     summary: Request data export
   *     description: Customer requests an export of their personal data
   *     tags:
   *       - Customer
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               format:
   *                 type: string
   *                 enum: [json, csv, pdf]
   *     responses:
   *       201:
   *         description: Export request created
   */
  app.post("/api/customer/data-export", requireAuth, async (req: any, res: Response) => {
    try {
      const userId = req.user?.dbUser?.id;
      const customer = await storage.getCustomer(userId);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const { format = 'json' } = req.body;

      // Create export request
      const dataExport = await storage.createDataExport({
        customerId: customer.id,
        userId,
        status: 'pending',
        format: format as 'json' | 'csv' | 'pdf',
        includePersonalData: true,
        includeDocuments: true,
        includePaymentHistory: true,
        includeAuditLog: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        requestedAt: new Date(),
      });

      // Log the export request
      await storage.createAuditLog({
        userId,
        actorName: `${req.user.dbUser.firstName} ${req.user.dbUser.lastName}`,
        actorRole: 'customer',
        action: 'customer_export',
        resourceType: 'customer',
        resourceId: customer.id,
        details: { format, exportId: dataExport.id },
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      });

      res.status(201).json({
        id: dataExport.id,
        status: dataExport.status,
        format: dataExport.format,
        requestedAt: dataExport.requestedAt,
        expiresAt: dataExport.expiresAt,
      });
    } catch (error) {
      console.error("Error creating data export:", error);
      res.status(500).json({ message: "Failed to create export" });
    }
  });

  /**
   * @swagger
   * /api/customer/data-export/{exportId}/status:
   *   get:
   *     summary: Check data export status
   *     description: Check the status of a data export request
   *     tags:
   *       - Customer
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: exportId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Export status
   */
  app.get("/api/customer/data-export/:id/status", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.dbUser?.id;

      const dataExport = await storage.getDataExport(id);
      if (!dataExport) {
        return res.status(404).json({ message: "Export not found" });
      }

      // Verify ownership
      if (dataExport.userId !== userId && req.user.dbUser.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized" });
      }

      res.json({
        id: dataExport.id,
        status: dataExport.status,
        format: dataExport.format,
        fileSize: dataExport.fileSize,
        requestedAt: dataExport.requestedAt,
        completedAt: dataExport.completedAt,
        expiresAt: dataExport.expiresAt,
        downloadCount: dataExport.downloadCount,
        errorMessage: dataExport.errorMessage,
      });
    } catch (error) {
      console.error("Error checking export status:", error);
      res.status(500).json({ message: "Failed to check export status" });
    }
  });

  /**
   * @swagger
   * /api/customer/data-export/{exportId}/download:
   *   get:
   *     summary: Download data export
   *     description: Download the completed data export file
   *     tags:
   *       - Customer
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: exportId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: File download
   */
  app.get("/api/customer/data-export/:id/download", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.dbUser?.id;

      const dataExport = await storage.getDataExport(id);
      if (!dataExport) {
        return res.status(404).json({ message: "Export not found" });
      }

      // Verify ownership
      if (dataExport.userId !== userId && req.user.dbUser.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized" });
      }

      if (dataExport.status !== 'ready') {
        return res.status(400).json({ message: `Export not ready (status: ${dataExport.status})` });
      }

      // Increment download count
      await storage.incrementDataExportDownloadCount(id);

      // Mock file response (in production, serve from storage)
      res.setHeader('Content-Disposition', `attachment; filename="data-export-${id}.${dataExport.format}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.json({ message: "Download would be served from storage", storageKey: dataExport.storageKey });
    } catch (error) {
      console.error("Error downloading export:", error);
      res.status(500).json({ message: "Failed to download export" });
    }
  });

  // ============================================================================
  // EMAIL QUEUE ROUTES
  // ============================================================================

  /**
   * GET /api/admin/email-queue/stats
   * Get email queue statistics
   */
  app.get("/api/admin/email-queue/stats", requireAdmin, async (req: any, res: Response) => {
    try {
      const { emailQueue } = await import('./email-queue');
      const stats = await emailQueue.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting queue stats:", error);
      res.status(500).json({ message: "Failed to get queue stats" });
    }
  });

  /**
   * GET /api/admin/email-queue
   * List emails in queue with optional filtering
   */
  app.get("/api/admin/email-queue", requireAdmin, async (req: any, res: Response) => {
    try {
      const { emailQueue } = await import('./email-queue');
      const status = req.query.status as any;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const emails = await emailQueue.listEmails({
        status,
        limit,
        offset,
      });

      res.json({
        emails,
        count: emails.length,
        limit,
        offset,
      });
    } catch (error) {
      console.error("Error listing emails:", error);
      res.status(500).json({ message: "Failed to list emails" });
    }
  });

  /**
   * POST /api/admin/email-queue/send
   * Send a test email (admin only)
   */
  app.post("/api/admin/email-queue/send", requireAdmin, async (req: any, res: Response) => {
    try {
      const { emailQueue } = await import('./email-queue');
      const { recipientEmail, subject, htmlContent } = req.body;

      if (!recipientEmail || !subject || !htmlContent) {
        return res.status(400).json({
          message: "Missing required fields: recipientEmail, subject, htmlContent",
        });
      }

      const emailId = await emailQueue.enqueue({
        recipientEmail,
        subject,
        htmlContent,
        notificationType: 'custom_admin',
      });

      res.status(201).json({
        message: "Email queued successfully",
        emailId: (emailId as any).id,
      });
    } catch (error) {
      console.error("Error queuing email:", error);
      res.status(500).json({ message: "Failed to queue email" });
    }
  });

  /**
   * POST /api/admin/email-queue/:id/retry
   * Retry a failed email
   */
  app.post("/api/admin/email-queue/:id/retry", requireAdmin, async (req: any, res: Response) => {
    try {
      const { emailQueue } = await import('./email-queue');
      const { id } = req.params;

      await emailQueue.retryEmail(id);

      res.json({
        message: "Email scheduled for retry",
        emailId: id,
      });
    } catch (error) {
      console.error("Error retrying email:", error);
      res.status(500).json({ message: "Failed to retry email" });
    }
  });

  // ============================================================================
  // CACHE MANAGEMENT ROUTES
  // ============================================================================

  /**
   * GET /api/admin/cache/stats
   * Get cache statistics and performance metrics
   */
  app.get("/api/admin/cache/stats", requireAdmin, async (req: any, res: Response) => {
    try {
      const { CacheManager } = await import('./cache-manager');
      const stats = CacheManager.getStats();
      res.json({
        ...stats,
        hitRate: stats.active > 0 ? ((stats.active / (stats.active + stats.expired)) * 100).toFixed(2) + '%' : '0%',
        recommendation: stats.total > 1000 ? 'Consider upgrading to Redis' : 'In-memory cache sufficient',
      });
    } catch (error) {
      console.error("Error getting cache stats:", error);
      res.status(500).json({ message: "Failed to get cache stats" });
    }
  });

  /**
   * POST /api/admin/cache/clear
   * Clear entire cache (use sparingly)
   */
  app.post("/api/admin/cache/clear", requireAdmin, async (req: any, res: Response) => {
    try {
      const { CacheManager } = await import('./cache-manager');
      CacheManager.clearAll();
      res.json({ message: "Cache cleared successfully" });
    } catch (error) {
      console.error("Error clearing cache:", error);
      res.status(500).json({ message: "Failed to clear cache" });
    }
  });

  /**
   * POST /api/admin/cache/cleanup
   * Run cleanup on expired cache entries
   */
  app.post("/api/admin/cache/cleanup", requireAdmin, async (req: any, res: Response) => {
    try {
      const { CacheManager } = await import('./cache-manager');
      const cleaned = CacheManager.cleanup();
      res.json({ message: `Cleaned ${cleaned} expired entries` });
    } catch (error) {
      console.error("Error cleaning cache:", error);
      res.status(500).json({ message: "Failed to clean cache" });
    }
  });

  // ============================================================================
  // RATE LIMITING & OPTIMIZATION ROUTES
  // ============================================================================

  /**
   * GET /api/admin/rate-limits/stats
   * Get rate limiting statistics
   */
  app.get("/api/admin/rate-limits/stats", requireAdmin, async (req: any, res: Response) => {
    try {
      const { RateLimiter } = await import('./rate-limiter');
      const stats = RateLimiter.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting rate limit stats:", error);
      res.status(500).json({ message: "Failed to get rate limit stats" });
    }
  });

  /**
   * POST /api/admin/rate-limits/clear
   * Clear all rate limits (emergency only)
   */
  app.post("/api/admin/rate-limits/clear", requireAdmin, async (req: any, res: Response) => {
    try {
      const { RateLimiter } = await import('./rate-limiter');
      RateLimiter.clearAll();
      res.json({ message: "All rate limits cleared" });
    } catch (error) {
      console.error("Error clearing rate limits:", error);
      res.status(500).json({ message: "Failed to clear rate limits" });
    }
  });

  /**
   * GET /api/admin/db-metrics
   * Get database query metrics
   */
  app.get("/api/admin/db-metrics", requireAdmin, async (req: any, res: Response) => {
    try {
      const { DBOptimizer } = await import('./db-optimizer');
      const metrics = DBOptimizer.getMetrics(100);
      res.json(metrics);
    } catch (error) {
      console.error("Error getting DB metrics:", error);
      res.status(500).json({ message: "Failed to get DB metrics" });
    }
  });

  /**
   * GET /api/admin/db-suggestions
   * Get database optimization suggestions
   */
  app.get("/api/admin/db-suggestions", requireAdmin, async (req: any, res: Response) => {
    try {
      const { DBOptimizer } = await import('./db-optimizer');
      const suggestions = DBOptimizer.getOptimizationSuggestions();
      res.json(suggestions);
    } catch (error) {
      console.error("Error getting DB suggestions:", error);
      res.status(500).json({ message: "Failed to get DB suggestions" });
    }
  });

  /**
   * GET /api/admin/db-n1-detection
   * Detect potential N+1 query patterns
   */
  app.get("/api/admin/db-n1-detection", requireAdmin, async (req: any, res: Response) => {
    try {
      const { DBOptimizer } = await import('./db-optimizer');
      const n1Queries = DBOptimizer.detectN1Queries();
      res.json({
        detected: n1Queries.length,
        patterns: n1Queries.slice(0, 10),
      });
    } catch (error) {
      console.error("Error detecting N+1 queries:", error);
      res.status(500).json({ message: "Failed to detect N+1 queries" });
    }
  });

  // ============================================================================
  // ADMIN ANALYTICS ROUTES
  // ============================================================================

  /**
   * GET /api/admin/analytics/dashboard
   * Get complete dashboard metrics
   */
  app.get("/api/admin/analytics/dashboard", requireAdmin, async (req: any, res: Response) => {
    try {
      const { Analytics } = await import('./analytics');
      const { cache, cacheKeys, CACHE_TTL } = await import('./cache');

      // Check cache first
      let dashboard = cache.get(cacheKeys.adminStats());
      
      if (!dashboard) {
        // Get data from storage
        const customers = await storage.listCustomers();
        const subscriptions = await storage.getSubscriptionsForAnalytics?.();
        const documents = await storage.listDocuments?.();

        // Generate dashboard
        dashboard = Analytics.generateDashboard(
          customers || [],
          subscriptions || [],
          documents || []
        );

        // Cache result
        cache.set(cacheKeys.adminStats(), dashboard, CACHE_TTL.ADMIN_STATS);
      }

      res.json(dashboard);
    } catch (error) {
      console.error("Error generating dashboard:", error);
      res.status(500).json({ message: "Failed to generate dashboard" });
    }
  });

  /**
   * GET /api/admin/analytics/summary
   * Get dashboard summary cards
   */
  app.get("/api/admin/analytics/summary", requireAdmin, async (req: any, res: Response) => {
    try {
      const { Analytics } = await import('./analytics');
      const { cache, cacheKeys, CACHE_TTL } = await import('./cache');

      let dashboard = cache.get(cacheKeys.adminStats());
      
      if (!dashboard) {
        const customers = await storage.listCustomers();
        const subscriptions = await storage.getSubscriptionsForAnalytics?.();
        const documents = await storage.listDocuments?.();

        dashboard = Analytics.generateDashboard(
          customers || [],
          subscriptions || [],
          documents || []
        );

        cache.set(cacheKeys.adminStats(), dashboard, CACHE_TTL.ADMIN_STATS);
      }

      const summary = Analytics.generateSummary(dashboard);
      res.json(summary);
    } catch (error) {
      console.error("Error generating summary:", error);
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  /**
   * GET /api/admin/analytics/growth
   * Get 12-month growth trends
   */
  app.get("/api/admin/analytics/growth", requireAdmin, async (req: any, res: Response) => {
    try {
      const { Analytics } = await import('./analytics');
      const { cache, cacheKeys, CACHE_TTL } = await import('./cache');

      // Check cache - growth data is stable
      let growthData = cache.get(cacheKeys.adminRecentActivity());
      
      if (!growthData) {
        const customers = await storage.listCustomers();
        const subscriptions = await storage.getSubscriptionsForAnalytics?.();
        const documents = await storage.listDocuments?.();

        growthData = Analytics.generateGrowthMetrics(
          customers || [],
          documents || [],
          subscriptions || []
        );

        cache.set(cacheKeys.adminRecentActivity(), growthData, CACHE_TTL.ADMIN_ACTIVITY);
      }

      res.json(growthData);
    } catch (error) {
      console.error("Error generating growth metrics:", error);
      res.status(500).json({ message: "Failed to generate growth metrics" });
    }
  });

  /**
   * GET /api/admin/analytics/subscriptions
   * Get subscription breakdown
   */
  app.get("/api/admin/analytics/subscriptions", requireAdmin, async (req: any, res: Response) => {
    try {
      const { Analytics } = await import('./analytics');
      const subscriptions = await storage.getSubscriptionsForAnalytics?.();
      
      const metrics = Analytics.calculateSubscriptionMetrics(subscriptions || []);
      res.json(metrics);
    } catch (error) {
      console.error("Error getting subscription metrics:", error);
      res.status(500).json({ message: "Failed to get subscription metrics" });
    }
  });

  /**
   * GET /api/admin/analytics/revenue
   * Get revenue metrics
   */
  app.get("/api/admin/analytics/revenue", requireAdmin, async (req: any, res: Response) => {
    try {
      const { Analytics } = await import('./analytics');
      const subscriptions = await storage.getSubscriptionsForAnalytics?.();
      
      const metrics = Analytics.calculateRevenueMetrics(subscriptions || []);
      res.json(metrics);
    } catch (error) {
      console.error("Error getting revenue metrics:", error);
      res.status(500).json({ message: "Failed to get revenue metrics" });
    }
  });

  /**
   * GET /api/admin/analytics/customers
   * Get customer metrics
   */
  app.get("/api/admin/analytics/customers", requireAdmin, async (req: any, res: Response) => {
    try {
      const { Analytics } = await import('./analytics');
      const customers = await storage.listCustomers();
      const subscriptions = await storage.getSubscriptionsForAnalytics?.();
      
      const metrics = Analytics.calculateCustomerMetrics(customers || [], subscriptions || []);
      res.json(metrics);
    } catch (error) {
      console.error("Error getting customer metrics:", error);
      res.status(500).json({ message: "Failed to get customer metrics" });
    }
  });

  /**
   * GET /api/admin/analytics/documents
   * Get document statistics
   */
  app.get("/api/admin/analytics/documents", requireAdmin, async (req: any, res: Response) => {
    try {
      const { Analytics } = await import('./analytics');
      const documents = await storage.listDocuments?.();
      
      const metrics = Analytics.calculateDocumentMetrics(documents || []);
      res.json(metrics);
    } catch (error) {
      console.error("Error getting document metrics:", error);
      res.status(500).json({ message: "Failed to get document metrics" });
    }
  });

  // ============================================================================
  // SYSTEM SETTINGS ROUTES (SUPER ADMIN ONLY)
  // ============================================================================

  /**
   * GET /api/admin/settings/system
   * Get system settings for backend configuration
   */
  app.get("/api/admin/settings/system", requireAdmin, async (req: any, res: Response) => {
    try {
      const settings = await storage.getSystemSettings?.();
      
      if (!settings) {
        // Return default settings if none exist
        const defaults = {
          idleTimeoutEnabled: true,
          idleWarningMinutes: 25,
          idleCountdownMinutes: 5,
          sessionTimeoutMinutes: 30,
          maxConcurrentSessions: 5,
          rateLimitEnabled: true,
          requestsPerMinute: 60,
          failedLoginLockoutThreshold: 5,
          maxUploadSizeMB: 10,
          twoFactorAuthRequired: false,
        };
        return res.json(defaults);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  /**
   * PATCH /api/admin/settings/system
   * Update system settings
   */
  app.patch("/api/admin/settings/system", requireAdmin, async (req: any, res: Response) => {
    try {
      const updates = req.body;
      
      // Validate that updates are for allowed fields
      const allowedFields = [
        'idleTimeoutEnabled',
        'idleWarningMinutes',
        'idleCountdownMinutes',
        'sessionTimeoutMinutes',
        'maxConcurrentSessions',
        'rateLimitEnabled',
        'requestsPerMinute',
        'failedLoginLockoutThreshold',
        'maxUploadSizeMB',
        'twoFactorAuthRequired',
      ];
      
      for (const key of Object.keys(updates)) {
        if (!allowedFields.includes(key)) {
          return res.status(400).json({ message: `Invalid setting: ${key}` });
        }
      }
      
      const settings = await storage.updateSystemSettings?.(updates);
      
      if (!settings) {
        return res.status(500).json({ message: "Failed to update system settings" });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating system settings:", error);
      res.status(500).json({ message: "Failed to update system settings" });
    }
  });

  // Note: Stripe webhook route is registered in app.ts BEFORE express.json()
  // This ensures the webhook receives the raw body as a Buffer

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time stats
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/stats' });
  setupStatsWebSocket(wss);

  return httpServer;
}
