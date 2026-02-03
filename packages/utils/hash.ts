//auth creation — storing credentials securely.
import bcrypt from "bcryptjs";

/**
 * Hashes a password using bcrypt with a salt rounds of 10.
 * @function hashPassword
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} The hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compares a plain text password with a hashed password.
 * @function comparePassword
 * @param {string} password - The plain text password to compare
 * @param {string} hash - The hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
