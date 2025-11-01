/**
 * @description Handles Family Member signup flow.
 * Steps:
 *   1. Validate request body.
 *   2. Ensure family exists.
 *   3. Ensure email is unique.
 *   4. Hash password securely.
 *   5. Create User with role = MEMBER.
 *   6. Link user to the specified Family as FamilyMember.
 *   7. Return JWT and joined Family info.
 */

import prisma from "@modheshwari/db";
import { hashPassword } from "@modheshwari/utils/hash";
import { signJWT } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";

/**
 * @typedef {Object} MemberSignupBody
 * @property {string} name - Full name of the member.
 * @property {string} email - Email address (must be unique).
 * @property {string} password - Raw password to hash.
 * @property {string} familyId - The Family uniqueId or ID they wish to join.
 */

/**
 * Handles signup for Family Member users.
 *
 * @async
 * @function handleMemberSignup
 * @route POST /api/signup/member
 * @param {Request} req - The HTTP request object.
 * @returns {Promise<Response>} HTTP JSON response.
 */
export async function handleMemberSignup(req: Request) {
  try {
    console.log("signup endpoint for family-member");

    const body = await req.json().catch(() => null);
    if (!body) return failure("Invalid JSON body", "Bad Request", 400);

    const { name, email, password, familyId } = body;

    // --- Step 1: Input validation ---
    if (!name || !email || !password || !familyId)
      return failure("Missing required fields", "Validation Error", 400);

    // --- Step 2: Ensure family exists ---
    const family =
      (await prisma.family.findUnique({ where: { id: familyId } })) ||
      (await prisma.family.findUnique({ where: { uniqueId: familyId } }));

    if (!family)
      return failure(
        "Invalid Family ID — family does not exist",
        "Not Found",
        404,
      );

    // --- Step 3: Ensure email is unique ---
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return failure("Email already registered", "Duplicate Entry", 409);
    }

    // --- Step 4: Hash password securely ---
    const hashedPassword = await hashPassword(password);

    // --- Step 5: Create the Member user ---
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "MEMBER",
        status: true,
      },
    });

    // --- Step 6: Create a pending MemberInvite instead of immediate membership ---
    const invite = await prisma.memberInvite.create({
      data: {
        familyId: family.id,
        invitedUserId: user.id,
        inviteEmail: user.email,
        status: "PENDING",
      },
    });

    // Notify family head about pending invite (if head exists)
    if (family.headId) {
      await prisma.notification.create({
        data: {
          userId: family.headId,
          type: "family_invite",
          message: `New join request from ${user.name} for family ${family.name}`,
        },
      });
    }

    // --- Step 7: Generate JWT token  (user can still login but is not yet a family member) ---
    const token = signJWT({ userId: user.id, role: user.role });

    // --- Step 8: Return structured success response (invite pending) ---
    console.log(
      `Member signup requested: ${user.name} requested to join family ${family.name}`,
    );

    return success(
      "Signup successful, pending family approval",
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        invite: {
          id: invite.id,
          status: invite.status,
          family: {
            id: family.id,
            name: family.name,
            uniqueId: family.uniqueId,
          },
        },
        token,
      },
      201,
    );
  } catch (err) {
    console.error("Member Signup Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
