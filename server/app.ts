/**
 * EXPRESS APPLICATION SETUP & INITIALIZATION
 * 
 * This file initializes the Express.js server with:
 * - Stripe payment processing integration
 * - Email queue system
 * - Security middleware (CORS, rate limiting, headers)
 * - Request payload limits
 * - Swagger/OpenAPI documentation
 * - Route registration
 * 
 * INITIALIZATION ORDER (CRITICAL):
 * 1. Stripe initialization (payment processing)
 * 2. Email queue startup
 * 3. Stripe webhook route (MUST be before express.json())
 * 4. CORS middleware
 * 5. Security headers
 * 6. Rate limiting
 * 7. Payload size limits
 * 8. All other middleware and routes
 */

import { type Server } from "node:http";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import { registerRoutes } from "./routes";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from "./stripeClient";
import { WebhookHandlers } from "./webhookHandlers";
import { seedMockData } from "./seed-mock-data";
import { logger } from "./logger";
import { globalLimiter, setSecureHeaders, sanitizeError, userLimiter, sensitiveUserLimiter } from "./security";
import { swaggerSpec } from "./swagger";
import { emailQueue } from "./email-queue";
import { requireAdminIP } from "./ip-whitelist-middleware";
import { auditLog } from "./audit-logging-helper";

/**
 * Log utility function - wraps logger.info with context
 * @param message - Message to log
 * @param source - Source identifier (default: "express")
 */
export function log(message: string, source = "express") {
  logger.info(message, source);
}

export const app = express();

// ============================================================================
// STRIPE INITIALIZATION (Must run before routes)
// ============================================================================

/**
 * Initialize Stripe payment processing integration
 * 
 * This function:
 * 1. Creates Stripe schema in PostgreSQL database
 * 2. Sets up managed webhook for payment events
 * 3. Syncs existing Stripe data in background
 * 
 * If Stripe initialization fails, the app continues to run
 * to allow development/testing without Stripe configured.
 */
async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  try {
    console.log('Initializing Stripe schema...');
    // Run database migrations for Stripe tables
    await runMigrations({ 
      databaseUrl,
      schema: 'stripe'
    });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    // Set up managed webhook - receives all Stripe events
    console.log('Setting up managed webhook...');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
    const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
      {
        enabled_events: ['*'], // Listen for all Stripe events
        description: 'Managed webhook for Stripe sync',
      }
    );
    console.log(`Webhook configured: ${webhook.url} (UUID: ${uuid})`);

    // Sync all existing Stripe data in background (non-blocking)
    console.log('Starting Stripe data sync...');
    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch((err: any) => console.error('Error syncing Stripe data:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    // Don't throw - allow app to start even if Stripe fails to initialize
  }
}

// Initialize Stripe
await initStripe();

// ============================================================================
// EMAIL QUEUE INITIALIZATION
// ============================================================================

// Start the email queue processor
emailQueue.start();

// ============================================================================
// STRIPE WEBHOOK ROUTE (Must be BEFORE express.json())
// ============================================================================

/**
 * STRIPE WEBHOOK ENDPOINT
 * Handles payment and subscription events from Stripe
 * 
 * IMPORTANT: This route MUST be defined BEFORE express.json() middleware
 * because it needs the raw Buffer body for signature verification.
 */
app.post(
  '/api/stripe/webhook/:uuid',
  // Use raw body for Stripe signature verification
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      // Verify req.body is a Buffer (not parsed JSON)
      if (!Buffer.isBuffer(req.body)) {
        const errorMsg = 'STRIPE WEBHOOK ERROR: req.body is not a Buffer. ' +
          'This means express.json() ran before this webhook route.';
        console.error(errorMsg);
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      // Process webhook with signature verification
      const { uuid } = req.params;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

      // Acknowledge webhook receipt
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

// ============================================================================
// REGULAR MIDDLEWARE (Applied after webhook route)
// ============================================================================

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// ============================================================================
// SECURITY #1: CORS CONFIGURATION
// ============================================================================
/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 * 
 * Controls which origins (domains) can make requests to this API.
 * Prevents unauthorized cross-domain requests while allowing:
 * - WordPress frontend (WORDPRESS_DOMAIN)
 * - Replit dev URL (REPLIT_DOMAINS)
 * - Localhost origins (development)
 * 
 * Credentials: Allowed - enables cookie-based sessions
 * Methods: Standard REST operations (GET, POST, PATCH, DELETE, etc)
 */
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or Stripe webhooks)
    if (!origin) {
      return callback(null, true);
    }
    
    // Whitelist of allowed origins
    const allowedOrigins = [
      process.env.WORDPRESS_DOMAIN || 'http://localhost:3000', // Main frontend
      process.env.REPLIT_DOMAINS?.split(',')[0], // Replit development URL
      'http://localhost:5000', // Local backend
      'http://localhost:3000', // Local frontend
      'http://127.0.0.1:5000',
      'http://127.0.0.1:3000',
    ].filter(Boolean);
    
    // Development mode: Allow all localhost origins for easier testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment && (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('replit.dev'))) {
      return callback(null, true);
    }
    
    // Check if origin is in whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log CORS rejection but allow browser to handle error
      console.warn(`[CORS] Rejected request from origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true, // Allow cookies in requests
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // Cache CORS headers for 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

/**
 * Security Headers Middleware
 * Applies headers for:
 * - CSP (Content Security Policy) - prevents XSS attacks
 * - HSTS (HTTP Strict Transport Security) - forces HTTPS
 * - X-Frame-Options - prevents clickjacking
 * - X-Content-Type-Options - prevents MIME type sniffing
 */
app.use((req, res, next) => {
  setSecureHeaders(res);
  next();
});

/**
 * Global Rate Limiter
 * Limits all requests per IP address
 * Prevents brute force and DoS attacks
 */
app.use(globalLimiter);

// ============================================================================
// SECURITY #5: REQUEST PAYLOAD SIZE LIMITS
// ============================================================================
/**
 * Payload Size Configuration
 * Prevents memory exhaustion and DoS attacks from large uploads
 * Different limits for different endpoint types:
 * 
 * - Default: 5MB (most API endpoints)
 * - Document upload: 50MB (PDF, Word docs)
 * - Settings/config: 100KB (lightweight operations)
 */
app.use(express.json({
  limit: '5mb', // Default: 5MB for API requests
  verify: (req, _res, buf) => {
    req.rawBody = buf; // Store raw body for signature verification
  }
}));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

// Higher limit for document uploads (up to 50MB for large files)
app.post('/api/documents/upload', express.json({ limit: '50mb' }));
app.post('/api/documents/:id/upload', express.json({ limit: '50mb' }));

// Lower limit for settings and config endpoints (100KB for lightweight data)
app.patch('/api/admin/settings/*', express.json({ limit: '100kb' }));
app.post('/api/admin/settings/*', express.json({ limit: '100kb' }));

// ============================================================================
// SWAGGER/OPENAPI DOCUMENTATION
// ============================================================================

app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(swaggerSpec, { 
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ALWR API Documentation',
}));

app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  // Seed mock data on app startup (development only)
  if (process.env.NODE_ENV === 'development') {
    await seedMockData().catch(err => console.error('Failed to seed mock data:', err));
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
}
