/**
 * @description Handles user login for specific roles (e.g., FAMILY_HEAD, COMMUNITY_HEAD).
 * Validates credentials, checks role, and returns a signed JWT if successful.
 */

import prisma from "@modheshwari/db";
import { comparePassword } from "@modheshwari/utils/hash";
import { signJWT } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";

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
    const body: any = await (req as Request).json().catch(() => null);
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
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
