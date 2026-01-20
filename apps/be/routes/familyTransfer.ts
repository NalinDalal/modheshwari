import prisma from "@modheshwari/db";
import { verifyAuth } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/index";

/**
 * Handles transferring a user to a new family (e.g., due to marriage).
 * Adds the user as a member of the new family without ending existing memberships.
 *
 * @param {Request} req - The incoming HTTP request. Expects JSON body with `newFamilyId`.
 * @returns {Promise<Response>} - JSON response with status and membership details.
 */
export async function handleFamilyTransfer(req: Request) {
  const user = await verifyAuth(req);
  if (!user) return failure("Unauthorized", null, 401);

  const userId = user.userId ?? user.id;
  if (!userId) return failure("Unauthorized: missing userId", null, 401);

  const body = (await req.json()) as { newFamilyId?: string };
  const { newFamilyId } = body;
  if (!newFamilyId) return failure("newFamilyId is required", null, 400);

  try {
    // Create membership in the new family
    const membership = await prisma.familyMember.create({
      data: {
        userId,
        familyId: newFamilyId,
        role: "MEMBER",
        joinedAt: new Date(),
      },
    });

    return success("Family transfer completed", { membership });
  } catch (err) {
    console.error("Family transfer failed:", err);
    return failure("Internal server error", null, 500);
  }
}
