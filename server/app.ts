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

export function log(message: string, source = "express") {
  logger.info(message, source);
}

export const app = express();

// ============================================================================
// STRIPE INITIALIZATION (Must run before routes)
// ============================================================================

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ 
      databaseUrl,
      schema: 'stripe'
    });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    // Set up managed webhook
    console.log('Setting up managed webhook...');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
    const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
      {
        enabled_events: ['*'],
        description: 'Managed webhook for Stripe sync',
      }
    );
    console.log(`Webhook configured: ${webhook.url} (UUID: ${uuid})`);

    // Sync all existing Stripe data in background
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

app.post(
  '/api/stripe/webhook/:uuid',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        const errorMsg = 'STRIPE WEBHOOK ERROR: req.body is not a Buffer. ' +
          'This means express.json() ran before this webhook route.';
        console.error(errorMsg);
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      const { uuid } = req.params;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

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
// CORS CONFIGURATION (SECURITY #1)
// ============================================================================
// Allow requests only from WordPress frontend and same origin
// Credentials (cookies) are allowed for session management
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or Stripe webhooks)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      process.env.WORDPRESS_DOMAIN || 'http://localhost:3000',
      process.env.REPLIT_DOMAINS?.split(',')[0], // Replit dev URL
      'http://localhost:5000',
      'http://localhost:3000',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:3000',
    ].filter(Boolean);
    
    // In development, allow all localhost origins for easier testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment && (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('replit.dev'))) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log CORS rejection but don't throw error (allow browser to handle)
      console.warn(`[CORS] Rejected request from origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Apply security headers to all responses
app.use((req, res, next) => {
  setSecureHeaders(res);
  next();
});

// Apply global rate limiter
app.use(globalLimiter);

// ============================================================================
// SECURITY #5: REQUEST PAYLOAD SIZE LIMITS
// Prevents memory exhaustion and DoS attacks from large uploads
// Different limits for different endpoint types
// ============================================================================
app.use(express.json({
  limit: '5mb', // Default: 5MB for API requests
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

// Higher limit for document uploads (up to 50MB)
app.post('/api/documents/upload', express.json({ limit: '50mb' }));
app.post('/api/documents/:id/upload', express.json({ limit: '50mb' }));

// Lower limit for settings and config endpoints (100KB)
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
