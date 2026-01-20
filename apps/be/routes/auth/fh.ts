/**
 * @description Handles user login for specific roles (e.g., FAMILY_HEAD, COMMUNITY_HEAD).
 * Validates credentials, checks role, and returns a signed JWT if successful.
 */

import prisma from "@modheshwari/db";
import { comparePassword, hashPassword } from "@modheshwari/utils/hash";
import { signJWT } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";
import type { Role as PrismaRole } from "@prisma/client";

/**
 * Handles user login for a specific role.
 *
 * @async
 * @function handleLogin
 * @param {Request} req - The incoming HTTP request containing login credentials.
 * @param {string} expectedRole - The role to validate against (e.g., "FAMILY_HEAD").
 * @returns {Promise<Response>} JSON response with token and user details or error message.
 *
 * @example
 * // Endpoint usage
 * POST /api/login/familyhead
 * Body: { "email": "john@example.com", "password": "secret123" }
 *
 * // Response (success)
 * {
 *   "message": "Logged in successfully",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
 *   "user": { "id": 1, "name": "John Doe", "role": "FAMILY_HEAD" }
 * }
 */
export async function handleFHLogin(
  req: Request,
  expectedRole: string,
): Promise<Response> {
  try {
    const body: any = await req.json().catch(() => null);
    const { email, password } = body;

    // --- Basic input validation ---
    if (!email || !password) {
      return failure("Missing credentials", "Validation Error", 400);
    }

    // --- Fetch user by email ---
    const user = await prisma.user.findFirst({
      where: { email, role: "FAMILY_HEAD" },
      include: { families: { include: { family: true } } },
    });

    // --- Verify existence and role match ---
    if (!user || user.role !== expectedRole)
      return failure(
        `You are not authorized as ${expectedRole}`,
        "Unauthorized",
        401,
      );

    // --- Compare password with stored hash ---
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return failure("Invalid credentials", "Authentication Error", 401);
    }

    // --- Generate JWT token ---
    // Standardize token payload to { userId, role }
    const token = signJWT({ userId: user.id, role: user.role });

    // --- Success response ---
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
    console.error("Login Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * @description Handles FamilyHead signup flow.
 * Steps:
 *   1. Validate request body.
 *   2. Ensure email is unique.
 *   3. Hash password securely.
 *   4. Create a User with role = FAMILY_HEAD.
 *   5. Create an associated Family entry.
 *   6. Link the FamilyHead as a FamilyMember.
 *   7. Return JWT and created records.
 */

/**
 * @typedef {Object} SignupBody
 * @property {string} name - Full name of the Family Head.
 * @property {string} email - Email address (must be unique).
 * @property {string} password - Raw password to hash.
 * @property {string} familyName - Name of the new family to be created.
 */

/**
 * Handles signup for FamilyHead users.
 *
 * @async
 * @function handleSignup
 * @route POST /api/signup/familyhead
 * @param {Request} req - The HTTP request object.
 * @param {string} role - The user role ("FAMILY_HEAD").
 * @returns {Promise<Response>} HTTP JSON response.
 */
export async function handleFHSignup(
  req: Request,
  role: string,
): Promise<Response> {
  try {
    console.log("signup endpoint for family-head");
    // Validate role early and create a typed prismaRole before any await
    const rawRole = role?.toUpperCase();
    if (rawRole !== "FAMILY_HEAD") {
      return failure(
        "Invalid role for this signup endpoint",
        "Bad Request",
        400,
      );
    }
    const prismaRole: PrismaRole = "FAMILY_HEAD" as unknown as PrismaRole;

    const body: any = await req.json().catch(() => null);
    if (!body) return failure("Invalid JSON body", "Bad Request", 400);

    const { name, email, password, familyName } = body;

    // --- Step 1: Input validation ---
    if (!name || !email || !password || !familyName)
      return failure("Missing required fields", "Validation Error", 400);

    // --- Step 2: Check if email already exists ---
    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      return failure("Email already registered", "Duplicate Entry", 409);
    }

    // --- Step 3: Hash password securely ---
    const hashedPassword = await hashPassword(password);

    // --- Step 4-6: Create user + family + link as FamilyMember atomically{transaction} ---
    const { user, family } = await prisma.$transaction(async (tx) => {
      // --- Step 4: Create Family Head user ---
      const u = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: prismaRole,
          status: true,
        },
      });

      // --- Step 5: Create Family entry ---
      const f = await tx.family.create({
        data: {
          name: familyName,
          uniqueId: `FAM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          headId: u.id,
        },
      });

      // --- Step 6: Link Family Head as FamilyMember ---
      await tx.familyMember.create({
        data: {
          familyId: f.id,
          userId: u.id,
          role: prismaRole,
        },
      });

      return { user: u, family: f };
    });

    // --- Step 7: Generate JWT token ---
    const token = signJWT({ userId: user.id, role: user.role });

    // --- Step 8: Return structured success response ---
    console.log(
      `Signup successful: ${user.name} (${user.email}) — Family: ${family.name} (${family.id})`,
    );
    return success(
      "Signup successful",
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        family: {
          id: family.id,
          name: family.name,
          uniqueId: family.uniqueId,
        },
        token,
      },
      201,
    );
  } catch (err) {
    console.error("Signup Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
