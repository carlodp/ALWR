/**
 * SECURITY #8: API Key Authentication Service
 * 
 * Manages API keys for external integrators and third-party applications.
 * Provides:
 * - API key generation and management
 * - API key validation and verification
 * - Usage tracking and rate limiting per key
 * - Revocation and expiration
 * 
 * Benefits:
 * - Control third-party API access
 * - Audit external API usage
 * - Revoke compromised keys instantly
 * - Rate limit per integrator
 */

import crypto from 'crypto';

export interface APIKey {
  id: string;
  key: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedBy?: string;
  usageCount: number;
  permissions: string[]; // e.g., ['read:customers', 'read:documents']
}

export interface CreateAPIKeyRequest {
  name: string;
  description?: string;
  expiresIn?: number; // days, optional (null = no expiration)
  permissions: string[];
}

/**
 * Generate a new API key in format: ALWR_<random_chars>
 * Keys are 40 characters total (prefix + 32 random chars)
 */
export function generateAPIKey(): string {
  const prefix = 'ALWR_';
  const randomChars = crypto.randomBytes(24).toString('hex');
  return `${prefix}${randomChars}`;
}

/**
 * Hash an API key for storage in database
 * Use this when storing the key - never store raw key
 */
export function hashAPIKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify an API key matches stored hash
 */
export function verifyAPIKey(rawKey: string, hashedKey: string): boolean {
  const keyHash = hashAPIKey(rawKey);
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(hashedKey));
}

/**
 * Validate API key format
 * Keys should be: ALWR_<32_hex_chars>
 */
export function isValidAPIKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const pattern = /^ALWR_[a-f0-9]{48}$/i;
  return pattern.test(key);
}

/**
 * Check if API key is expired
 */
export function isKeyExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}

/**
 * Mask API key for display (show only first and last 4 chars)
 * Example: ALWR_****...****
 */
export function maskAPIKey(key: string): string {
  if (!key || key.length < 8) return '****';
  const first4 = key.substring(0, 4);
  const last4 = key.substring(key.length - 4);
  return `${first4}..${last4}`;
}

/**
 * Parse API key header from request
 * Authorization: Bearer ALWR_xxxxx
 */
export function parseAPIKeyHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

/**
 * Standard permissions for API keys
 * Implement fine-grained access control
 */
export const STANDARD_PERMISSIONS = {
  // Read-only access
  'read:customers': 'List and view customer data',
  'read:documents': 'View customer documents',
  'read:subscriptions': 'View subscription information',
  'read:reports': 'Access reporting data',
  
  // Write access
  'write:customers': 'Create and update customer records',
  'write:documents': 'Upload and manage documents',
  'write:subscriptions': 'Create subscriptions',
  
  // Admin access
  'admin:access': 'Full admin access',
  
  // Webhook access
  'webhooks:receive': 'Receive webhook events',
  'webhooks:manage': 'Manage webhook subscriptions',
};

export default {
  generateAPIKey,
  hashAPIKey,
  verifyAPIKey,
  isValidAPIKeyFormat,
  isKeyExpired,
  maskAPIKey,
  parseAPIKeyHeader,
};
