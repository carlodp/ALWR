// User management service for role-based access control and user administration
import type { User } from "@shared/schema";

export type UserRole = 'customer' | 'admin' | 'agent' | 'support';
export type UserAccountStatus = 'active' | 'suspended' | 'locked' | 'inactive';

// Role-based permissions
export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    'manage_users',
    'manage_customers',
    'manage_subscriptions',
    'manage_documents',
    'view_reports',
    'view_audit_logs',
    'manage_agents',
    'manage_resellers',
    'view_emergency_access_logs',
    'manage_email_templates',
  ],
  agent: [
    'view_customers',
    'create_customers',
    'manage_customer_subscriptions',
    'view_reports',
  ],
  customer: [
    'view_own_profile',
    'edit_own_profile',
    'view_own_documents',
    'upload_documents',
    'view_own_subscription',
  ],
  support: [
    'view_customers',
    'view_audit_logs',
    'view_emergency_access_logs',
    'view_reports',
  ],
};

// Check if user has permission
export function hasPermission(user: User, permission: string): boolean {
  const userRole = (user.role || 'customer') as UserRole;
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
}

// Check if user has any of the specified roles
export function hasRole(user: User, roles: UserRole[]): boolean {
  return roles.includes((user.role || 'customer') as UserRole);
}

// Check if user is admin
export function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

// Generate a user display name
export function getUserDisplayName(user: User): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.email || 'Unknown User';
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Rate limit login attempts
export function shouldLockAccount(failedAttempts: number): boolean {
  return failedAttempts >= 5;
}

// Calculate lock duration (exponential backoff)
export function calculateLockDuration(failedAttempts: number): number {
  const baseMinutes = 15;
  const multiplier = Math.min(Math.pow(2, failedAttempts - 5), 8); // Max 120 minutes (2 hours)
  return baseMinutes * multiplier;
}
