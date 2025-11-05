/**
 * Admin / Community-level auth handlers
 * Supports roles: COMMUNITY_HEAD, COMMUNITY_SUBHEAD, GOTRA_HEAD
 */

import prisma from "@modheshwari/db";
import { hashPassword, comparePassword } from "@modheshwari/utils/hash";
import { signJWT } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";

const ALLOWED_ROLES = ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"];

/**
 * Signup handler for community/admin roles.
 * POST /api/signup/:role
 */
export async function handleAdminSignup(req: Request, role: string) {
  try {
    const r = role?.toUpperCase();
    if (!ALLOWED_ROLES.includes(r))
      return failure(
        "Invalid role for this signup endpoint",
        "Bad Request",
        400,
      );

    const body = await req.json().catch(() => null);
    if (!body) return failure("Invalid JSON body", "Bad Request", 400);

    const { name, email, password, gotra } = body;
    if (!name || !email || !password)
      return failure("Missing required fields", "Validation Error", 400);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return failure("Email already registered", "Conflict", 409);

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: ALLOWED_ROLES.includes(r) ? r : null,
        status: true,
      },
    });

    // If gotra provided, create/update profile
    if (gotra) {
      await prisma.profile
        .create({ data: { userId: user.id, gotra } })
        .catch(() => {});
    }

    const token = signJWT({
      userId: user.id,
      role: user.role,
      name: user.name,
    });

    return success(
      "Signup successful",
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
      201,
    );
  } catch (err) {
    console.error("Admin Signup Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * Login handler for community/admin roles.
 * POST /api/login/:role
 */
export async function handleAdminLogin(req: Request, expectedRole: string) {
  try {
    const r = expectedRole?.toUpperCase();
    if (!ALLOWED_ROLES.includes(r))
      return failure(
        "Invalid role for this login endpoint",
        "Bad Request",
        400,
      );

    const body = await req.json().catch(() => null);
    if (!body) return failure("Invalid JSON body", "Bad Request", 400);
    const { email, password } = body;
    if (!email || !password)
      return failure("Missing credentials", "Validation Error", 400);

    const user = await prisma.user.findFirst({ where: { email, role: r } });
    if (!user)
      return failure("User not found or role mismatch", "Unauthorized", 401);

    const ok = await comparePassword(password, user.password);
    if (!ok) return failure("Invalid credentials", "Authentication Error", 401);

    const token = signJWT({
      userId: user.id,
      role: user.role,
      name: user.name,
    });

    return success(
      "Logged in successfully",
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      200,
    );
  } catch (err) {
    console.error("Admin Login Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
