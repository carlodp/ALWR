/**
 * API KEY AUTHENTICATION MIDDLEWARE
 * 
 * Validates API keys from Authorization headers for third-party/external access
 * Usage: Add to routes that need API key authentication
 * 
 * Expected header format: Authorization: Bearer ALWR_xxxxxxxxxxxxx
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { parseAPIKeyHeader, verifyAPIKey, isKeyExpired } from './api-key-service';
import { auditLog } from './audit-logging-helper';
import type { isKeyExpired as isKeyExpiredType } from './api-key-service';

/**
 * Middleware to validate API key from Authorization header
 * Attaches API key info to req.user.apiKey if valid
 */
export async function requireAPIKey(req: Request & any, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const rawKey = parseAPIKeyHeader(authHeader);

    if (!rawKey) {
      return res.status(401).json({ message: "Missing or invalid Authorization header. Expected: Bearer ALWR_xxxxx" });
    }

    // Find API key by hash
    const storedKey = await storage.getApiKeyByHash(rawKey);
    
    if (!storedKey) {
      await auditLog({
        userId: 'unknown',
        actorName: 'Unknown',
        actorRole: 'unknown',
        action: 'api_key_auth_failure',
        resourceType: 'api_key',
        resourceId: 'invalid',
        success: false,
        details: { reason: 'Key not found' },
      });
      return res.status(401).json({ message: "Invalid API key" });
    }

    // Check if key is revoked
    if (storedKey.isRevoked) {
      await auditLog({
        userId: storedKey.createdBy,
        actorName: 'API Key Auth',
        actorRole: 'external',
        action: 'api_key_auth_failure',
        resourceType: 'api_key',
        resourceId: storedKey.id,
        success: false,
        details: { reason: 'Key is revoked' },
      });
      return res.status(401).json({ message: "API key is revoked" });
    }

    // Check if key is expired
    if (isKeyExpired(storedKey.expiresAt)) {
      await auditLog({
        userId: storedKey.createdBy,
        actorName: 'API Key Auth',
        actorRole: 'external',
        action: 'api_key_auth_failure',
        resourceType: 'api_key',
        resourceId: storedKey.id,
        success: false,
        details: { reason: 'Key is expired' },
      });
      return res.status(401).json({ message: "API key is expired" });
    }

    // Verify the key matches the stored hash
    // Import crypto.timingSafeEqual check - already done in verifyAPIKey
    let keyValid = false;
    try {
      keyValid = verifyAPIKey(rawKey, storedKey.keyHash);
    } catch (e) {
      keyValid = false;
    }

    if (!keyValid) {
      await auditLog({
        userId: storedKey.createdBy,
        actorName: 'API Key Auth',
        actorRole: 'external',
        action: 'api_key_auth_failure',
        resourceType: 'api_key',
        resourceId: storedKey.id,
        success: false,
        details: { reason: 'Key verification failed' },
      });
      return res.status(401).json({ message: "Invalid API key" });
    }

    // Update usage statistics
    await storage.updateApiKeyUsage(storedKey.id);

    // Attach API key to request object
    req.user = req.user || {};
    req.user.apiKey = {
      id: storedKey.id,
      name: storedKey.name,
      userId: storedKey.createdBy,
      permissions: storedKey.permissions,
    };

    // Log successful authentication
    await auditLog({
      userId: storedKey.createdBy,
      actorName: storedKey.name,
      actorRole: 'external_integration',
      action: 'api_key_auth_success',
      resourceType: 'api_key',
      resourceId: storedKey.id,
      success: true,
      details: { permissions: storedKey.permissions },
    });

    next();
  } catch (error) {
    console.error("Error validating API key:", error);
    res.status(500).json({ message: "API key validation failed" });
  }
}

/**
 * Middleware to check if API key has specific permission
 * Use with requireAPIKey middleware
 * 
 * Example: app.get('/api/endpoint', requireAPIKey, requireAPIKeyPermission('read:customers'), handler)
 */
export function requireAPIKeyPermission(permission: string) {
  return async (req: Request & any, res: Response, next: NextFunction) => {
    if (!req.user?.apiKey) {
      return res.status(401).json({ message: "API key authentication required" });
    }

    if (!req.user.apiKey.permissions.includes(permission)) {
      await auditLog({
        userId: req.user.apiKey.userId,
        actorName: req.user.apiKey.name,
        actorRole: 'external_integration',
        action: 'api_key_permission_denied',
        resourceType: 'api_key',
        resourceId: req.user.apiKey.id,
        success: false,
        details: { requiredPermission: permission },
      });
      return res.status(403).json({ message: `API key lacks required permission: ${permission}` });
    }

    next();
  };
}

