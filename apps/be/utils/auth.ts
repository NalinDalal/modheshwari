import type { AuthPayload } from "@modheshwari/utils/jwt";
import { verifyJWT } from "@modheshwari/utils/jwt";

/**
 * Extracts and verifies the JWT from the request headers.
 * @param req The incoming request object.
 * @returns The userId if the token is valid, otherwise null.
 */
export function extractAndVerifyToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return null;
  }

  try {
    const decoded = verifyJWT(token) as AuthPayload;
    return (decoded?.userId as string) ?? (decoded?.id as string) ?? null;
  } catch {
    return null;
  }
}
