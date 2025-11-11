/**
 * @description Handles Family Member login flow.
 * Steps:
 *   1. Validate request body.
 *   2. Ensure user exists and role is MEMBER.
 *   3. Verify password.
 *   4. Fetch joined family info.
 *   5. Return JWT and member + family details.
 */

import prisma from "@modheshwari/db";
import { comparePassword } from "@modheshwari/utils/hash";
import { signJWT } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";

/**
 * @typedef {Object} MemberLoginBody
 * @property {string} email - Registered member email.
 * @property {string} password - Raw password.
 */

/**
 * Handles login for Family Member users.
 *
 * @async
 * @function handleMemberLogin
 * @route POST /api/signin/member
 * @param {Request} req - The HTTP request object.
 * @returns {Promise<Response>} HTTP JSON response.
 */
export async function handleMemberLogin(req: Request) {
  try {
    console.log("login endpoint for family-member");

    const body: any = await (req as Request).json().catch(() => null);
    if (!body) return failure("Invalid JSON body", "Bad Request", 400);

    const { email, password } = body;

    // --- Step 1: Input validation ---
    if (!email || !password)
      return failure("Missing required fields", "Validation Error", 400);

    // --- Step 2: Ensure user exists ---
    // --- Fetch user by email ---
    const user = await prisma.user.findFirst({
      where: { email, role: "MEMBER" },
      include: { families: { include: { family: true } } },
    });
    if (!user) return failure("User not found", "Not Found", 404);

    if (user.role !== "MEMBER")
      return failure(
        "Unauthorized — only Family Members can login here",
        "Access Denied",
        403,
      );

    // --- Step 3: Verify password ---
    const isValid = await comparePassword(password, user.password);
    if (!isValid)
      return failure("Invalid credentials", "Authentication Error", 401);

    // --- Step 4: Fetch family info (if any) ---
    const familyLinks = user.families.map((f: any) => ({
      id: f.family.id,
      name: f.family.name,
      uniqueId: f.family.uniqueId,
    }));

    // --- Step 5: Sign JWT token ---
    const token = signJWT({ userId: user.id, role: user.role });

    // --- Step 6: Respond with structured payload ---
    console.log(`Member login successful: ${user.name}`);

    return success(
      "Login successful",
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        families: familyLinks,
        token,
      },
      200,
    );
  } catch (err) {
    console.error("Member Login Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
