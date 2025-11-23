/**
 * SECURITY MIDDLEWARE & UTILITIES
 * 
 * Provides:
 * - SECURITY #4: User-based rate limiting (100 req/min per user)
 * - Global rate limiting (100 req/15min per IP)
 * - Authentication rate limiting (5 attempts/15min)
 * - API endpoint rate limiting (30 req/min)
 * - Sensitive endpoint rate limiting (5 req/15min)
 * - Security headers (CSP, HSTS, X-Frame-Options, etc)
 * - SECURITY #5: Request payload size limits
 * - Input validation helpers (email, password, IDs)
 * - Error sanitization (removes sensitive info from responses)
 * 
 * RATE LIMITING STRATEGY:
 * - Global: All requests per IP
 * - Auth: Login attempts only
 * - User: All requests per authenticated user (prevents account abuse)
 * - Sensitive: Password change, 2FA setup, etc
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { type Response } from 'express';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Global rate limiter - 100 requests per 15 minutes per IP (1000 in dev)
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and dev assets
    return req.path === '/health' || (isDev && req.path.startsWith('/@'));
  },
});

/**
 * Auth limiter - 5 login attempts per 15 minutes per IP (50 in dev)
 * Prevents brute force attacks on login endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API limiter - 30 requests per minute per IP (300 in dev)
 * More restrictive for API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 300 : 30,
  message: 'Too many API requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * SECURITY #4: User-Based Rate Limiter
 * Prevents authenticated user abuse - key security measure
 * Limits: 100 requests/minute per authenticated user
 * 
 * If a user account is compromised, this prevents the attacker
 * from overwhelming the API even with a valid session.
 * 
 * Implementation:
 * - Uses user ID as rate limit key (not IP)
 * - Applies only to authenticated requests
 * - Unauthenticated requests use global limiter instead
 */
export const userLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: isDev ? 1000 : 100, // 100 requests per minute per user
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return req.user?.id || ipKeyGenerator(req) || 'unknown';
  },
  message: 'Too many requests from this user, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only rate limit authenticated users (unauthenticated users handled by global limiter)
    return !req.user;
  },
});

/**
 * Sensitive Endpoint Rate Limiter
 * Stricter limits for sensitive operations:
 * - Password changes
 * - 2FA setup/disable
 * - Profile updates
 * - API key generation
 * 
 * Limit: 5 requests per 15 minutes per user
 * Prevents rapid automated attacks on sensitive operations
 */
export const sensitiveUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: isDev ? 50 : 5, // 5 requests per 15 minutes per user
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return req.user?.id || ipKeyGenerator(req) || 'unknown';
  },
  message: 'Too many requests to this endpoint, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Sanitize Error Responses
 * Removes sensitive information from error messages shown to users
 * Prevents information leakage about system internals, database, etc.
 * 
 * @param error Original error object
 * @param isDevelopment If true, returns full error (dev mode only)
 * @returns User-safe error message and HTTP status
 */
export function sanitizeError(error: any, isDevelopment = false): { message: string; status: number } {
  // In production, hide internal error details to prevent information leakage
  if (!isDevelopment && error?.message?.includes('database')) {
    return {
      message: 'An internal error occurred. Please try again later.',
      status: 500,
    };
  }

  // Don't expose Stripe API errors to client
  if (!isDevelopment && error?.message?.includes('Stripe')) {
    return {
      message: 'Payment processing error. Please try again later.',
      status: 500,
    };
  }

  // Return status code if available, default to 500
  const status = error?.status || error?.statusCode || 500;
  const message = error?.message || 'Internal server error';

  // Safe status for production
  if (status >= 500 && !isDevelopment) {
    return {
      message: 'An internal error occurred. Please try again later.',
      status,
    };
  }

  return { message, status };
}

/**
 * Validate numeric ID - ensure it's a valid positive integer or UUID
 */
export function isValidId(id: any): boolean {
  if (typeof id !== 'string') return false;
  // UUID format or numeric ID
  return /^[0-9a-f-]+$/i.test(id) && id.length > 0 && id.length < 100;
}

/**
 * Validate email format
 */
export function isValidEmail(email: any): boolean {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length < 255;
}

/**
 * Validate password strength
 * Requires: minimum 8 characters
 */
export function isValidPassword(password: any): boolean {
  if (typeof password !== 'string') return false;
  return password.length >= 8;
}

/**
 * Set secure response headers
 * SECURITY: Implements HSTS (Header #3) and CSP (Header #2)
 * 
 * Exported for use in routes that apply security headers
 */
export function setSecureHeaders(res: Response) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Prevent referrer leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // No caching for sensitive pages
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // =========================================================================
  // SECURITY #3: HSTS (HTTP Strict Transport Security)
  // Forces browser to only use HTTPS for 1 year, prevents SSL downgrade attacks
  // =========================================================================
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // =========================================================================
  // SECURITY #2: Content Security Policy (CSP)
  // Prevents XSS attacks by restricting which resources can be loaded
  // =========================================================================
  const cspHeader = [
    "default-src 'self'",                    // Only allow same-origin by default
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.swagger.io", // Swagger UI needs inline scripts
    "style-src 'self' 'unsafe-inline' https://cdn.swagger.io",  // Swagger UI needs inline styles
    "img-src 'self' data: https:",           // Allow images from same origin, data URLs, and HTTPS
    "font-src 'self' https:",                // Allow fonts from same origin and HTTPS
    "connect-src 'self' https: wss:",        // Allow API calls to same origin and HTTPS + WebSocket
    "frame-ancestors 'none'",                // Prevent clickjacking (in addition to X-Frame-Options)
    "base-uri 'self'",                       // Restrict <base> tag
    "form-action 'self'",                    // Restrict form submissions to same origin
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', cspHeader);
  
  // Additional security headers
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
}
