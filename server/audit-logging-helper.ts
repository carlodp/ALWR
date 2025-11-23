/**
 * SECURITY #9: Enhanced Audit Logging Helper
 * 
 * Simplifies audit logging across the application.
 * Logs all admin actions, sensitive operations, and security events.
 * 
 * Usage:
 * await auditLog.logAction(req, 'user_create', 'User created', { userId: '123' })
 */

import { type Request, type Response } from 'express';
import { storage } from './storage';
import { type User } from '@shared/schema';

/**
 * Extended audit actions beyond the schema enum
 * Add these to auditActionEnum in shared/schema.ts when ready:
 */
export const AUDIT_ACTIONS = {
  // User management
  'user_create': 'User created',
  'user_update': 'User updated',
  'user_delete': 'User deleted',
  'user_role_change': 'User role changed',
  'user_suspend': 'User suspended',
  'user_activate': 'User activated',
  
  // Admin actions
  'admin_login': 'Admin login',
  'admin_failed_login': 'Admin failed login',
  'admin_logout': 'Admin logout',
  'admin_export_data': 'Admin exported customer data',
  'admin_bulk_action': 'Admin performed bulk action',
  'admin_settings_change': 'Admin changed system settings',
  
  // Security events
  'password_changed': 'Password changed',
  'password_reset': 'Password reset',
  'password_reset_failed': 'Password reset failed',
  'two_factor_enabled': 'Two-factor authentication enabled',
  'two_factor_disabled': 'Two-factor authentication disabled',
  'two_factor_failed': 'Two-factor authentication failed',
  'failed_login_attempt': 'Failed login attempt',
  'account_locked': 'Account locked due to failed attempts',
  'account_unlocked': 'Account unlocked',
  
  // Sensitive operations
  'api_key_created': 'API key created',
  'api_key_revoked': 'API key revoked',
  'ip_whitelist_changed': 'IP whitelist changed',
  
  // Document operations
  'document_accessed': 'Document accessed',
  'document_exported': 'Document exported',
  
  // Subscription operations
  'subscription_created': 'Subscription created',
  'subscription_cancelled': 'Subscription cancelled',
  'subscription_renewed': 'Subscription renewed',
};

export interface AuditLogEntry {
  action: string;
  description: string;
  status: 'success' | 'failed';
  userId?: string;
  adminId?: string;
  targetId?: string; // User/Customer/Document ID being acted upon
  ipAddress?: string;
  changes?: Record<string, any>;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an admin or security-sensitive action
 */
export async function logAuditAction(
  req: Request,
  action: string,
  description: string,
  options?: {
    status?: 'success' | 'failed';
    targetId?: string;
    changes?: Record<string, any>;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    const user = (req as any).user as User | undefined;
    const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
    
    // Only log if user is authenticated
    if (!user) {
      console.warn(`[AUDIT] Attempted to log action without authenticated user: ${action}`);
      return;
    }
    
    const auditLog = {
      adminId: user.id,
      action: action as any,
      description,
      status: options?.status || 'success' as const,
      ipAddress: ipAddress?.split(',')[0] || 'unknown',
      targetId: options?.targetId,
      changes: options?.changes ? JSON.stringify(options.changes) : undefined,
      errorMessage: options?.errorMessage,
      metadata: options?.metadata ? JSON.stringify(options.metadata) : undefined,
    };
    
    await storage.createAuditLog(auditLog as any);
    
    console.log(`[AUDIT] ${user.email} (${user.role}): ${description}`);
  } catch (error) {
    console.error('[AUDIT] Failed to log action:', error);
    // Don't throw - let the request continue even if logging fails
  }
}

/**
 * Specific audit log helpers for common actions
 */

export async function logAdminUserCreated(
  req: Request,
  userId: string,
  userData: Record<string, any>
) {
  await logAuditAction(req, 'user_create', `Created user: ${userData.email}`, {
    targetId: userId,
    changes: { email: userData.email, role: userData.role },
  });
}

export async function logAdminUserRoleChanged(
  req: Request,
  userId: string,
  fromRole: string,
  toRole: string
) {
  await logAuditAction(req, 'user_role_change', `Changed user role from ${fromRole} to ${toRole}`, {
    targetId: userId,
    changes: { from: fromRole, to: toRole },
  });
}

export async function logAdminDataExport(
  req: Request,
  customerId: string,
  format: string
) {
  await logAuditAction(req, 'admin_export_data', `Exported customer data in ${format} format`, {
    targetId: customerId,
    metadata: { format, timestamp: new Date().toISOString() },
  });
}

export async function logFailedLoginAttempt(
  req: Request,
  email: string,
  reason: string
) {
  await logAuditAction(req, 'failed_login_attempt', `Failed login for ${email}: ${reason}`, {
    status: 'failed',
    errorMessage: reason,
    metadata: { email },
  });
}

export async function logTwoFactorEvent(
  req: Request,
  userId: string,
  action: 'enabled' | 'disabled' | 'failed',
  reason?: string
) {
  const actionMap = {
    enabled: 'two_factor_enabled',
    disabled: 'two_factor_disabled',
    failed: 'two_factor_failed',
  };
  
  await logAuditAction(
    req,
    actionMap[action],
    `Two-factor authentication ${action}`,
    {
      targetId: userId,
      status: action === 'failed' ? 'failed' : 'success',
      errorMessage: reason,
    }
  );
}

export async function logPasswordChange(
  req: Request,
  userId: string,
  initiatedBy: 'user' | 'admin'
) {
  await logAuditAction(req, 'password_changed', `Password changed by ${initiatedBy}`, {
    targetId: userId,
  });
}

export async function logAPIKeyEvent(
  req: Request,
  keyName: string,
  action: 'created' | 'revoked',
  keyId?: string
) {
  const actionMap = {
    created: 'api_key_created',
    revoked: 'api_key_revoked',
  };
  
  await logAuditAction(req, actionMap[action], `API key ${action}: ${keyName}`, {
    targetId: keyId,
  });
}

export async function logIPWhitelistChange(
  req: Request,
  oldIPs: string[],
  newIPs: string[]
) {
  await logAuditAction(req, 'ip_whitelist_changed', 'IP whitelist updated', {
    changes: {
      removed: oldIPs.filter(ip => !newIPs.includes(ip)),
      added: newIPs.filter(ip => !oldIPs.includes(ip)),
    },
  });
}

export async function logAccountLocked(
  email: string,
  attempts: number
) {
  try {
    await storage.createAuditLog({
      adminId: 'system',
      action: 'account_locked' as any,
      description: `Account locked after ${attempts} failed login attempts`,
      status: 'success',
      ipAddress: 'system',
      metadata: JSON.stringify({ email, attempts }),
    } as any);
    
    console.log(`[SECURITY] Account locked: ${email} (${attempts} failed attempts)`);
  } catch (error) {
    console.error('[AUDIT] Failed to log account lock:', error);
  }
}

export const auditLog = {
  logAuditAction,
  logAdminUserCreated,
  logAdminUserRoleChanged,
  logAdminDataExport,
  logFailedLoginAttempt,
  logTwoFactorEvent,
  logPasswordChange,
  logAPIKeyEvent,
  logIPWhitelistChange,
  logAccountLocked,
};

export default auditLog;
