/**
 * @description Handles Family Member signup (join request flow).
 * Steps:
 *   1. Validate request body.
 *   2. Ensure email is unique.
 *   3. Hash password securely.
 *   4. Create a User with role = MEMBER.
 *   5. Create a FamilyJoinRequest entry.
 *   6. Notify the Family Head.
 *   7. Return success (no JWT yet — pending approval).
 */

import prisma from "@modheshwari/db";
import { hashPassword } from "@modheshwari/utils/hash";
import { success, failure } from "@modheshwari/utils/response";

/**
 * Performs handle family member signup operation.
 * @param {Request} req - Description of req
 * @returns {Promise<Response>} Description of return value
 */
export async function handleMemberSignup(req: Request) {
  try {
    console.log("signup endpoint for family-member");

    const body: any = await (req as Request).json().catch(() => null);
    if (!body) return failure("Invalid JSON body", "Bad Request", 400);

    const { name, email, password, familyId, relationWithFamilyHead } = body;

    // --- Step 1: Input validation ---
    if (!name || !email || !password || !familyId)
      return failure("Missing required fields", "Validation Error", 400);

    // --- Step 2: Check if email already exists ---
    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser)
      return failure("Email already registered", "Duplicate Entry", 409);

    // --- Step 3: Hash password securely ---
    const hashedPassword = await hashPassword(password);

    // --- Step 4: Create the User (role = MEMBER) ---
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "MEMBER",
        status: true,
      },
    });

    // --- Step 5: Create Family Join Request (Pending approval) ---
    const joinRequest = await (prisma as any).familyJoinRequest.create({
      data: {
        userId: user.id,
        familyId,
        relation: relationWithFamilyHead || "UNKNOWN",
        status: "PENDING",
      },
    });

    // --- Step 6: Notify the Family Head ---
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      select: { id: true, name: true, headId: true },
    });

    if (family?.headId) {
      await prisma.notification.create({
        data: {
          userId: family.headId,
          type: "family_join_request" as any,
          message: `${user.name} has requested to join your family (${family.name}).`,
        },
      });
    }

    // --- Step 7: Return success response (no login yet) ---
    console.log(
      `Signup request submitted: ${user.name} (${user.email}) — Family: ${family?.name}`,
    );

    return success(
      "Signup successful — pending approval from family head.",
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        joinRequest: {
          id: joinRequest.id,
          familyId: joinRequest.familyId,
          status: joinRequest.status,
          relation: joinRequest.relation,
        },
      },
      201,
    );
  } catch (err) {
    console.error("Family Member Signup Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
