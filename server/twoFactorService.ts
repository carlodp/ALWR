/**
 * Two-Factor Authentication Service (TOTP-based)
 * Uses time-based one-time passwords (TOTP) with authenticator apps
 * No external service needed - users use Google Authenticator, Authy, etc.
 */

import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export interface TwoFactorSetupResult {
  secret: string;
  qrCode: string; // Base64 encoded QR code
  backupCodes: string[];
}

export interface TwoFactorVerifyResult {
  valid: boolean;
  message?: string;
}

/**
 * Generate a new TOTP secret and backup codes for a user
 */
export async function generateTwoFactorSecret(email: string): Promise<TwoFactorSetupResult> {
  const secret = speakeasy.generateSecret({
    name: `ALWR (${email})`,
    issuer: 'America Living Will Registry',
    length: 32,
  });

  if (!secret.otpauth_url) {
    throw new Error('Failed to generate OTP auth URL');
  }

  // Generate QR code as data URL
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  // Generate 10 backup codes (each 8 characters)
  const backupCodes = Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

/**
 * Verify a TOTP code against a secret
 * Allows for 1 time window before/after for clock skew tolerance
 */
export function verifyTOTPCode(secret: string, token: string): TwoFactorVerifyResult {
  try {
    const tokenInt = parseInt(token, 10);
    
    if (isNaN(tokenInt) || token.length !== 6) {
      return {
        valid: false,
        message: 'Code must be 6 digits',
      };
    }

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 window before/after
    });

    return {
      valid: isValid,
      message: isValid ? 'Code verified' : 'Invalid code',
    };
  } catch (error) {
    return {
      valid: false,
      message: 'Failed to verify code',
    };
  }
}

/**
 * Verify a backup code against a list of codes
 * Removes the used code from the array
 */
export function verifyBackupCode(code: string, backupCodes: string[]): { valid: boolean; remainingCodes: string[] } {
  const index = backupCodes.findIndex(c => c === code.toUpperCase());
  
  if (index === -1) {
    return { valid: false, remainingCodes: backupCodes };
  }

  // Remove the used code
  const remainingCodes = backupCodes.filter((_, i) => i !== index);
  
  return { valid: true, remainingCodes };
}

/**
 * Generate new backup codes
 */
export function generateBackupCodes(count = 10): string[] {
  return Array.from({ length: count }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );
}
