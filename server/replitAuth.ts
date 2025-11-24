import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import type { User, SystemSettings } from "@shared/schema";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User | undefined;
    }
  }
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

// Cache system settings for performance (5 minute TTL)
const getSystemSettingsCached = memoize(
  async (): Promise<SystemSettings> => {
    const settings = await storage.getSystemSettings?.();
    
    if (!settings) {
      // Return defaults if no settings found
      return {
        id: "default",
        idleTimeoutEnabled: false,
        idleWarningMinutes: 25,
        idleCountdownMinutes: 5,
        sessionTimeoutMinutes: 1440, // Default to 24 hours
        maxConcurrentSessions: 5,
        rateLimitEnabled: true,
        requestsPerMinute: 60,
        failedLoginLockoutThreshold: 5,
        maxUploadSizeMB: 10,
        twoFactorAuthRequired: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    return settings;
  },
  { 
    maxAge: 5 * 60 * 1000, // Cache for 5 minutes
    primitive: true,
  }
);

export async function getSessionConfig() {
  const settings = await getSystemSettingsCached();
  const sessionTimeoutMinutes = settings.sessionTimeoutMinutes || 1440; // Default to 24 hours
  return {
    sessionTtl: sessionTimeoutMinutes * 60 * 1000, // Convert to milliseconds
  };
}

export function getSession() {
  // Default to 24 hours if we can't fetch settings yet
  // This will be updated when settings are fetched from database
  const defaultSessionTtl = 24 * 60 * 60 * 1000; // 24 hours
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: defaultSessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: true, // Touch session on each request to extend TTL
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: defaultSessionTtl, // Cookie expires after configured timeout
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}/login`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Middleware to load user from session for backward compatibility
export async function loadUser(req: any, res: any, next: any) {
  try {
    // Support both OpenID (req.user.claims.sub) and email/password (req.session.userId) auth
    let userId: string | undefined;
    
    if (req.user?.claims?.sub) {
      // OpenID authentication
      userId = req.user.claims.sub;
    } else if (req.session?.userId) {
      // Email/password authentication
      userId = req.session.userId;
    }

    if (userId) {
      const dbUser = await storage.getUser(userId);
      if (dbUser) {
        // Initialize req.user if it doesn't exist
        if (!req.user) {
          req.user = {};
        }
        req.user.dbUser = dbUser;
      }
    }
    next();
  } catch (error) {
    console.error("Error loading user:", error);
    next();
  }
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
  if (!req.user?.dbUser) {
    return res.status(401).json({ message: "Unauthorized - Authentication required" });
  }
  next();
}

// Middleware to require admin role
export function requireAdmin(req: any, res: any, next: any) {
  if (!req.user?.dbUser) {
    return res.status(401).json({ message: "Unauthorized - Authentication required" });
  }
  
  if (req.user.dbUser.role !== 'admin' && req.user.dbUser.role !== 'super_admin') {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  
  next();
}
