//auth continuation — managing session identity after login.
import { config } from "dotenv";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { join } from "path";

// Load .env from monorepo root if not already loaded
config({ path: join(process.cwd(), "../../.env") });

// Check for secret *after* loading .env
if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables");
}

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthPayload {
  id: string;
  email?: string;
  role?: string;
}

/**
 * Signs a JWT token for the given payload.
 * @param payload - The data to embed in the token.
 * @returns A signed JWT valid for 7 days.
 */
export function signJWT(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verifies a JWT and returns its decoded payload, or null if invalid.
 * @param token - The JWT string to verify.
 * @returns Decoded payload or null on failure.
 */
export function verifyJWT(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded as AuthPayload;
  } catch {
    return null;
  }
}

/**
 * Verifies Authorization header and returns decoded user payload, or null.
 */
export async function verifyAuth(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];

  if (!token) return null;

  const decoded = verifyJWT(token);
  return decoded || null;
}
