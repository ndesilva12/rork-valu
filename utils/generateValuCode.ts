/**
 * Generates a unique ValuCode for users
 * Format: VALU + 6 random alphanumeric characters (uppercase)
 * Example: VALUQ3K7M9
 */
export function generateValuCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars like O, 0, I, 1
  let code = 'VALU';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  return code;
}

/**
 * Validates a ValuCode format
 */
export function isValidValuCode(code: string): boolean {
  const pattern = /^VALU[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
  return pattern.test(code);
}
