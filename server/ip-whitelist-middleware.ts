/**
 * SECURITY #10: IP Whitelisting Middleware
 * 
 * Restricts admin endpoints to requests from whitelisted IP addresses.
 * Prevents unauthorized access even if credentials are compromised.
 * 
 * Configuration:
 * Set ADMIN_IPS environment variable with comma-separated list of allowed IPs:
 * ADMIN_IPS=192.168.1.100,203.0.113.45,2001:db8::1
 */

import type { Request, Response, NextFunction } from 'express';
import { auditLog } from './audit-logging-helper';

/**
 * Get list of allowed admin IPs from environment
 * Format: ADMIN_IPS=192.168.1.100,203.0.113.45,2001:db8::1
 */
function getAllowedAdminIPs(): string[] {
  const ipsEnv = process.env.ADMIN_IPS;
  
  if (!ipsEnv) {
    // Default: allow all in development, none in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('[IP_WHITELIST] ADMIN_IPS not set - allowing all IPs in development mode');
      return [];
    }
    console.warn('[IP_WHITELIST] ADMIN_IPS not configured - no admin IPs allowed!');
    return [];
  }
  
  return ipsEnv
    .split(',')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0);
}

/**
 * Extract client IP from request
 * Handles:
 * - X-Forwarded-For header (behind proxy)
 * - X-Real-IP header (nginx)
 * - socket.remoteAddress (direct connection)
 */
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ips = Array.isArray(forwarded) ? forwarded : forwarded.split(',');
    return (ips[0] || '').trim();
  }
  
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }
  
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Check if IP is in whitelist
 * Supports IPv4 and IPv6
 */
function isIPWhitelisted(clientIP: string, allowedIPs: string[]): boolean {
  // Empty list means all IPs allowed (development mode)
  if (allowedIPs.length === 0) {
    return true;
  }
  
  // Normalize IP for comparison (remove IPv6 prefix if present)
  const normalizedClientIP = clientIP.replace(/^::ffff:/, '');
  
  return allowedIPs.some(ip => {
    const normalizedAllowedIP = ip.replace(/^::ffff:/, '');
    return normalizedClientIP === normalizedAllowedIP;
  });
}

/**
 * Middleware to require whitelisted IP for admin endpoints
 * Usage: app.use('/api/admin', requireAdminIP)
 */
export function requireAdminIP(req: Request, res: Response, next: NextFunction) {
  const allowedIPs = getAllowedAdminIPs();
  const clientIP = getClientIP(req);
  
  if (!isIPWhitelisted(clientIP, allowedIPs)) {
    console.warn(`[IP_WHITELIST] Unauthorized IP access attempt: ${clientIP} on ${req.path}`);
    
    // Log the failed attempt
    try {
      const user = (req as any).user;
      if (user) {
        auditLog.logAuditAction(req, 'admin_failed_login', 
          `Admin access denied: IP not whitelisted (${clientIP})`, {
          status: 'failed',
          errorMessage: `IP not in whitelist: ${clientIP}`,
        }).catch(err => console.error('[AUDIT] Failed to log IP rejection:', err));
      }
    } catch (error) {
      // Don't block request if audit logging fails
    }
    
    return res.status(403).json({
      message: 'Access denied: Your IP address is not authorized',
      clientIP: clientIP, // For debugging (remove in production)
    });
  }
  
  next();
}

/**
 * Get current IP whitelist configuration
 * Use to display/manage allowed IPs
 */
export function getIPWhitelistConfig() {
  const allowedIPs = getAllowedAdminIPs();
  const isEnabled = allowedIPs.length > 0 || process.env.NODE_ENV === 'production';
  
  return {
    enabled: isEnabled,
    allowedIPs: allowedIPs.length > 0 ? allowedIPs : ['*'], // * means all in dev
    mode: process.env.NODE_ENV,
    isDevelopment: process.env.NODE_ENV === 'development',
  };
}

/**
 * Validate an IP address format
 */
export function isValidIPAddress(ip: string): boolean {
  // IPv4
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(ip)) {
    return ip.split('.').every(octet => parseInt(octet) <= 255);
  }
  
  // IPv6 (simplified check)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Pattern.test(ip);
}

export default {
  requireAdminIP,
  getClientIP,
  getIPWhitelistConfig,
  isValidIPAddress,
  isIPWhitelisted,
};
