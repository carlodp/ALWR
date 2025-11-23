/**
 * Advanced Rate Limiting Middleware
 *
 * Role-based rate limiting with per-user tracking, subscription tier support,
 * and detailed error responses with retry-after headers.
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // in milliseconds
  concurrentLimit?: number;
}

interface UserRateLimit {
  requests: number;
  resetTime: number;
  concurrent: number;
}

// Rate limit tiers by role
const RATE_LIMIT_TIERS: Record<string, RateLimitConfig> = {
  customer: {
    maxRequests: 100, // 100 requests per hour
    windowMs: 60 * 60 * 1000, // 1 hour
    concurrentLimit: 10,
  },
  agent: {
    maxRequests: 500,
    windowMs: 60 * 60 * 1000,
    concurrentLimit: 50,
  },
  reseller: {
    maxRequests: 300,
    windowMs: 60 * 60 * 1000,
    concurrentLimit: 30,
  },
  admin: {
    maxRequests: 2000,
    windowMs: 60 * 60 * 1000,
    concurrentLimit: 500,
  },
  super_admin: {
    maxRequests: 5000,
    windowMs: 60 * 60 * 1000,
    concurrentLimit: 1000,
  },
};

// In-memory rate limit tracker
const rateLimitMap = new Map<string, UserRateLimit>();

export class RateLimiter {
  /**
   * Get rate limit config for a role
   */
  static getConfig(role: string = 'customer'): RateLimitConfig {
    return RATE_LIMIT_TIERS[role] || RATE_LIMIT_TIERS['customer'];
  }

  /**
   * Get rate limit key (user ID or IP)
   */
  static getKey(req: any): string {
    // Prefer authenticated user ID
    if (req.session?.user?.id) {
      return `user:${req.session.user.id}`;
    }
    // Fall back to IP address
    return `ip:${req.ip}`;
  }

  /**
   * Get user's current rate limit status
   */
  static getStatus(key: string, role: string = 'customer') {
    const config = this.getConfig(role);
    const now = Date.now();
    let userLimit = rateLimitMap.get(key);

    // Check if window expired
    if (!userLimit || now > userLimit.resetTime) {
      userLimit = {
        requests: 0,
        resetTime: now + config.windowMs,
        concurrent: 0,
      };
      rateLimitMap.set(key, userLimit);
    }

    const remaining = Math.max(0, config.maxRequests - userLimit.requests);
    const resetTime = Math.ceil((userLimit.resetTime - now) / 1000); // in seconds

    return {
      limit: config.maxRequests,
      remaining,
      reset: userLimit.resetTime,
      resetIn: resetTime,
      retryAfter: remaining === 0 ? resetTime : null,
    };
  }

  /**
   * Increment request count
   */
  static recordRequest(key: string, role: string = 'customer'): boolean {
    const config = this.getConfig(role);
    const now = Date.now();
    let userLimit = rateLimitMap.get(key);

    // Initialize if needed
    if (!userLimit || now > userLimit.resetTime) {
      userLimit = {
        requests: 0,
        resetTime: now + config.windowMs,
        concurrent: 0,
      };
      rateLimitMap.set(key, userLimit);
    }

    userLimit.requests++;
    return userLimit.requests <= config.maxRequests;
  }

  /**
   * Track concurrent operation
   */
  static incrementConcurrent(key: string, role: string = 'customer'): boolean {
    const config = this.getConfig(role);
    let userLimit = rateLimitMap.get(key);

    if (!userLimit) {
      userLimit = {
        requests: 0,
        resetTime: Date.now() + config.windowMs,
        concurrent: 0,
      };
      rateLimitMap.set(key, userLimit);
    }

    if (config.concurrentLimit && userLimit.concurrent >= config.concurrentLimit) {
      return false;
    }

    userLimit.concurrent++;
    return true;
  }

  /**
   * Decrement concurrent operation
   */
  static decrementConcurrent(key: string): void {
    const userLimit = rateLimitMap.get(key);
    if (userLimit && userLimit.concurrent > 0) {
      userLimit.concurrent--;
    }
  }

  /**
   * Cleanup expired entries
   */
  static cleanup(): number {
    const now = Date.now();
    let count = 0;

    for (const [key, limit] of rateLimitMap.entries()) {
      if (now > limit.resetTime && limit.concurrent === 0) {
        rateLimitMap.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    const now = Date.now();
    let activeEntries = 0;

    for (const limit of rateLimitMap.values()) {
      if (now < limit.resetTime) {
        activeEntries++;
      }
    }

    return {
      totalTracked: rateLimitMap.size,
      activeEntries,
      tiers: Object.keys(RATE_LIMIT_TIERS),
    };
  }

  /**
   * Clear all limits (admin only)
   */
  static clearAll(): void {
    rateLimitMap.clear();
  }
}

/**
 * Express middleware for rate limiting
 */
export function createRateLimitMiddleware(excludePaths: string[] = []) {
  return (req: any, res: Response, next: NextFunction) => {
    // Skip rate limiting for excluded paths
    if (excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const key = RateLimiter.getKey(req);
    const role = req.session?.user?.role || 'customer';
    const status = RateLimiter.getStatus(key, role);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', status.limit);
    res.setHeader('X-RateLimit-Remaining', status.remaining);
    res.setHeader('X-RateLimit-Reset', status.reset);

    // Check if limit exceeded
    if (!RateLimiter.recordRequest(key, role)) {
      res.setHeader('Retry-After', status.resetIn);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Max ${status.limit} requests per hour.`,
        retryAfter: status.resetIn,
        resetTime: new Date(status.reset).toISOString(),
      });
    }

    next();
  };
}

/**
 * Middleware for tracking concurrent operations (uploads, exports, etc)
 */
export function createConcurrentLimitMiddleware(excludePaths: string[] = []) {
  return (req: any, res: Response, next: NextFunction) => {
    // Only check for mutation methods
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      return next();
    }

    const key = RateLimiter.getKey(req);
    const role = req.session?.user?.role || 'customer';
    const config = RateLimiter.getConfig(role);

    // Check concurrent limit
    if (!RateLimiter.incrementConcurrent(key, role)) {
      return res.status(429).json({
        error: 'Too Many Concurrent Operations',
        message: `Cannot exceed ${config.concurrentLimit} concurrent operations for your role.`,
        resetAfter: 60, // Suggest retrying in 60 seconds
      });
    }

    // Track when response is sent
    const originalSend = res.send;
    res.send = function (data) {
      RateLimiter.decrementConcurrent(key);
      return originalSend.call(this, data);
    };

    next();
  };
}

export default RateLimiter;
