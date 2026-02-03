import { verifyJWT } from "@modheshwari/utils/jwt";

/**
 * Extract userId from JWT token in Authorization header
 * @param req - HTTP request object
 * @returns User ID if authenticated, null otherwise
 */
export function getUserIdFromRequest(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return null;

  const decoded = verifyJWT(token);
  const userId = decoded?.id || decoded?.userId;

  return typeof userId === "string" ? userId : null;
}
