import { extractAndVerifyToken } from "../../utils/auth";

/**
 * Extract userId from JWT token in Authorization header
 * @param req - HTTP request object
 * @returns User ID if authenticated, null otherwise
 */
export function getUserIdFromRequest(req: Request): string | null {
  try {
    return extractAndVerifyToken(req);
  } catch {
    return null;
  }
}
