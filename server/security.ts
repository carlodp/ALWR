/**
 * Security middleware and utilities for the application
 * Includes rate limiting, input validation, and security headers
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
 * SECURITY #4: User-based rate limiter - prevents authenticated user abuse
 * Limits authenticated users to 100 requests per minute regardless of IP
 * This prevents compromised accounts from abusing the API
 */
export const userLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDev ? 1000 : 100, // 100 requests per minute per user
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP (with IPv6 support)
    return req.user?.id || ipKeyGenerator(req) || 'unknown';
  },
  message: 'Too many requests from this user, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for unauthenticated users (handled by global limiter)
    return !req.user;
  },
});

/**
 * Strict user limiter for sensitive endpoints (password changes, 2FA, etc)
 * Limits to 5 requests per 15 minutes per user
 */
export const sensitiveUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 50 : 5,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP (with IPv6 support)
    return req.user?.id || ipKeyGenerator(req) || 'unknown';
  },
  message: 'Too many requests to this endpoint, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Sanitize error response - remove sensitive information
 * Only shows user-friendly messages, logs full error internally
 */
export function sanitizeError(error: any, isDevelopment = false): { message: string; status: number } {
  // Don't expose internal error details in production
  if (!isDevelopment && error?.message?.includes('database')) {
    return {
      message: 'An internal error occurred. Please try again later.',
      status: 500,
    };
  }

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
