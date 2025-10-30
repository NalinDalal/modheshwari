/**
 * @description Handles user login for specific roles (e.g., FAMILY_HEAD, COMMUNITY_HEAD).
 * Validates credentials, checks role, and returns a signed JWT if successful.
 */

import prisma from "@modheshwari/db";
import { comparePassword } from "@modheshwari/utils/hash";
import { signJWT } from "@modheshwari/utils/jwt";

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
export async function handleLogin(
  req: Request,
  expectedRole: string,
): Promise<Response> {
  try {
    const { email, password } = await req.json();

    // --- Basic input validation ---
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing credentials" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- Fetch user by email ---
    const user = await prisma.user.findUnique({ where: { email } });

    // --- Verify existence and role match ---
    if (!user || user.role !== expectedRole) {
      return new Response(
        JSON.stringify({ error: `You are not authorized as ${expectedRole}` }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // --- Compare password with stored hash ---
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- Generate JWT token ---
    const token = signJWT({ id: user.id, role: user.role });

    // --- Success response ---
    return new Response(
      JSON.stringify({
        message: "Logged in successfully",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Login Error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
