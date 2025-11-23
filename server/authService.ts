/**
 * AUTHENTICATION SERVICE
 * 
 * Provides password hashing, validation, and account locking utilities
 * for custom email/password authentication.
 * 
 * Features:
 * - Secure bcrypt password hashing (10 salt rounds)
 * - Account locking after failed login attempts
 * - Exponential backoff (15 min → 4 hours max)
 * - Password strength validation
 * - Email format validation
 */

import bcrypt from 'bcryptjs';

// Password hashing cost (higher = more secure but slower)
const SALT_ROUNDS = 10;

// Initial lockout duration (doubled for each failed attempt)
const LOCK_DURATION_MINUTES = 15;

// Trigger lockout after this many failed attempts
const MAX_LOGIN_ATTEMPTS = 5;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate lock until timestamp based on failed attempts
 */
export function calculateLockUntil(failedAttempts: number): Date {
  const now = new Date();
  const lockMinutes = Math.min(LOCK_DURATION_MINUTES * Math.pow(2, failedAttempts - MAX_LOGIN_ATTEMPTS), 240); // Max 4 hours
  return new Date(now.getTime() + lockMinutes * 60000);
}

/**
 * Check if account is currently locked
 */
export function isAccountLocked(lockedUntil: Date | null | undefined): boolean {
  if (!lockedUntil) return false;
  return new Date() < lockedUntil;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Optional: Add complexity requirements
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  // For now, just require minimum length. Can enhance later.
  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
