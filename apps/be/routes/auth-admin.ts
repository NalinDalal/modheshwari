/**
 * Admin / Community-level auth handlers
 * Supports roles: COMMUNITY_HEAD, COMMUNITY_SUBHEAD, GOTRA_HEAD
 */

import prisma from "@modheshwari/db";
import { hashPassword, comparePassword } from "@modheshwari/utils/hash";
import { signJWT } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";
import type { Role as PrismaRole } from "@prisma/client";

const ALLOWED_ROLES = [
  "COMMUNITY_HEAD",
  "COMMUNITY_SUBHEAD",
  "GOTRA_HEAD",
] as const;
type AdminRole = (typeof ALLOWED_ROLES)[number];

function normalizeRole(raw?: string): AdminRole | undefined {
  if (!raw) return undefined;
  const up = raw.toUpperCase();
  return ALLOWED_ROLES.includes(up as AdminRole)
    ? (up as AdminRole)
    : undefined;
}
/**
 * Signup handler for community/admin roles.
 * POST /api/signup/:role
 */
export async function handleAdminSignup(
  req: Request,
  role: string,
): Promise<Response> {
  try {
    const r = normalizeRole(role);
    if (!r)
      return failure(
        "Invalid role for this signup endpoint",
        "Bad Request",
        400,
      );

    // keep a stable, typed prismaRole before any awaits so narrowing isn't lost
    const prismaRole: PrismaRole = r as unknown as PrismaRole;

    const body: any = await (req as Request).json().catch(() => null);
    if (!body) return failure("Invalid JSON body", "Bad Request", 400);

    const { name, email, password, gotra } = body;
    if (!name || !email || !password)
      return failure("Missing required fields", "Validation Error", 400);

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) return failure("Email already registered", "Conflict", 409);

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: prismaRole,
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
export async function handleAdminLogin(
  req: Request,
  expectedRole: string,
): Promise<Response> {
  try {
    const r = normalizeRole(expectedRole);
    if (!r)
      return failure("Invalid role for this login endpoint", "Forbidden", 403);

    // keep typed value before any await so TypeScript knows it's present
    const prismaRole: PrismaRole = r as unknown as PrismaRole;

    const body: any = await (req as Request).json().catch(() => null);
    if (!body) return failure("Invalid JSON body", "Bad Request", 400);
    const { email, password } = body;
    if (!email || !password)
      return failure("Missing credentials", "Validation Error", 400);

    const user = await prisma.user.findFirst({
      where: { email, role: prismaRole },
    });
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
