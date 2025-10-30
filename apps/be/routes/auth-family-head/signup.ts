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
export async function signupRoute(req: Request, role: string) {
  try {
    const body = await req.json();
    const { name, email, password, familyName } = body;

    // --- Step 1: Input validation ---
    if (!name || !email || !password || !familyName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // --- Step 2: Check if email already exists ---
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Email already registered" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // --- Step 3: Hash password securely ---
    const hashedPassword = await hashPassword(password);

    // --- Step 4: Create Family Head user ---
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
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
        role,
      },
    });

    // --- Step 7: Generate JWT token ---
    const token = signJWT({ userId: user.id, role: user.role });

    // --- Step 8: Return structured success response ---
    return new Response(
      JSON.stringify({
        message: "Signup successful",
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
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Signup Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
