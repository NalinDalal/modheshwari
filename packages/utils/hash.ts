//auth creation — storing credentials securely.
import bcrypt from "bcryptjs";

/**
 * Auto-generated documentation for hashPassword
 * @function hashPassword
 * @param TODO: describe parameters
 * @returns TODO: describe return value
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Auto-generated documentation for comparePassword
 * @function comparePassword
 * @param TODO: describe parameters
 * @returns TODO: describe return value
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
