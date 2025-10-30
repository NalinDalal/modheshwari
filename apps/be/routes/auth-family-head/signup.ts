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

import { Elysia } from "elysia";
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
 * @function signupRoute
 * @route POST /api/signup/familyhead
 * @param {Object} ctx - The Elysia request context.
 * @param {SignupBody} ctx.body - The signup request payload.
 * @param {Object} ctx.set - Used to modify HTTP response status.
 * @returns {Promise<Object>} JSON object with created user, family, and token.
 *
 * @example
 * // POST /api/signup/familyhead
 * {
 *   "name": "Ramesh Modh",
 *   "email": "ramesh@example.com",
 *   "password": "strongPass123",
 *   "familyName": "Modheshwari Parivar"
 * }
 *
 * // Response (success)
 * {
 *   "message": "Signup successful",
 *   "user": { "id": 1, "name": "Ramesh Modh", "email": "ramesh@example.com", "role": "FAMILY_HEAD" },
 *   "family": { "id": 1, "name": "Modheshwari Parivar" },
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp..."
 * }
 */
export const signupRoute = new Elysia().post(
  "/api/signup/familyhead",
  async ({ body, set }) => {
    try {
      const { name, email, password, familyName } = body;

      // --- Input validation ---
      if (!name || !email || !password || !familyName) {
        set.status = 400;
        return { error: "Missing required fields" };
      }

      // --- Check for existing user ---
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        set.status = 400;
        return { error: "Email already registered" };
      }

      // --- Securely hash password ---
      const hashed = await hashPassword(password);

      // --- Create Family Head user ---
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashed,
          role: "FAMILY_HEAD",
          status: true,
        },
      });

      // --- Create Family entry ---
      const family = await prisma.family.create({
        data: {
          name: familyName,
          uniqueId: `FAM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          headId: user.id,
        },
      });

      // --- Link user as FamilyMember ---
      await prisma.familyMember.create({
        data: {
          familyId: family.id,
          userId: user.id,
          role: "FAMILY_HEAD",
        },
      });

      // --- Sign JWT token ---
      const token = signJWT({ userId: user.id, role: user.role });

      // --- Return structured response ---
      return {
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
      };
    } catch (err) {
      console.error("Signup Error:", err);
      set.status = 500;
      return { error: "Internal server error" };
    }
  },
);
