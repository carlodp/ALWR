/**
 * Secure password generator utility
 * Generates strong random passwords suitable for admin-created accounts
 */

/**
 * Generate a secure random password
 * - Minimum 12 characters
 * - Mix of uppercase, lowercase, numbers, and special characters
 * - Excludes ambiguous characters (0/O, 1/l/I, etc.)
 */
export function generatePassword(length: number = 16): string {
  // Character sets (excluding ambiguous characters)
  const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // No I, O
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'; // No i, l, o
  const numbers = '23456789'; // No 0, 1
  const special = '!@#$%^&*-_=+';

  // Ensure at least one character from each set
  const charSets = [
    { set: uppercase, minCount: 2 },
    { set: lowercase, minCount: 2 },
    { set: numbers, minCount: 2 },
    { set: special, minCount: 1 },
  ];

  let password = '';

  // Add minimum required characters from each set
  for (const charSet of charSets) {
    for (let i = 0; i < charSet.minCount; i++) {
      password += charSet.set.charAt(
        Math.floor(Math.random() * charSet.set.length)
      );
    }
  }

  // Fill remaining length with random characters from all sets
  const allChars = uppercase + lowercase + numbers + special;
  const remainingLength = length - password.length;

  for (let i = 0; i < remainingLength; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password to avoid predictable patterns
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Copy text to clipboard with user feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
