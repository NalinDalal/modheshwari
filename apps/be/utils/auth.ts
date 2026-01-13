import type { AuthPayload } from "@modheshwari/utils/jwt";
import { verifyJWT } from "@modheshwari/utils/jwt";
import { failure } from "@modheshwari/utils/response";

/**
 * Extracts and verifies the JWT from the request headers.
 * @param req The incoming request object.
 * @returns The userId if the token is valid, otherwise null.
 */
export function extractAndVerifyToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    throw failure("Missing token", "Auth Error", 401);
  }

  try {
    const decoded = verifyJWT(token) as AuthPayload;
    return decoded?.id ?? null;
  } catch {
    throw failure("Invalid or expired token", "Auth Error", 401);
  }
}
