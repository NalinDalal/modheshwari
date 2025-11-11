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

import prisma from "@modheshwari/db";
import { hashPassword } from "@modheshwari/utils/hash";
import { signJWT } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";
import type { Role as PrismaRole } from "@prisma/client";

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
    const rawRole = role && role.toUpperCase();
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

    // --- Step 4: Create Family Head user ---
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: prismaRole,
        status: true,
      },
    });

    // --- Step 5: Create Family entry ---
    const family = await prisma.family.create({
      data: {
        name: familyName,
        uniqueId: `FAM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        headId: user.id,
      },
    });

    // --- Step 6: Link Family Head as FamilyMember ---
    await prisma.familyMember.create({
      data: {
        familyId: family.id,
        userId: user.id,
        role: prismaRole,
      },
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
