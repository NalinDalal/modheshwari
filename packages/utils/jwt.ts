//auth continuation — managing session identity after login.
import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("❌ Missing JWT_SECRET in environment variables");
}

const JWT_SECRET = process.env.JWT_SECRET;

export function signJWT(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyJWT(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
