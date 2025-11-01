// @ts-nocheck
import prisma from "@modheshwari/db";
import { verifyJWT } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";

/**
 * PATCH /api/family/members/:memberId/status
 * Allows a family head to update a member’s status (e.g. "ALIVE", "DECEASED")
 */
export async function handleUpdateMemberStatus(req: any) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "").trim();
    const decoded: any = verifyJWT(token);
    if (!decoded || !decoded.userId)
      return failure("Unauthorized", "Auth Error", 401);

    const userId = decoded.userId;

    // Read params and body
    const url = new URL(req.url);
    const memberId = url.pathname.split("/").pop();
    const { status } = await req.json();

    if (!memberId || !status)
      return failure("Missing parameters", "Bad Request", 400);

    // Ensure user is a FAMILY_HEAD of this member's family
    const headMembership = await prisma.familyMember.findFirst({
      where: {
        userId,
        role: "FAMILY_HEAD",
      },
      select: { familyId: true },
    });

    if (!headMembership) {
      return failure(
        "Forbidden",
        "Only family heads can update member status",
        403,
      );
    }

    // Verify target member belongs to same family
    const member = await prisma.familyMember.findFirst({
      where: {
        id: memberId,
        familyId: headMembership.familyId,
      },
    });

    if (!member) {
      return failure(
        "Member not found or not in your family",
        "Not Found",
        404,
      );
    }

    // Update status
    const updated = await prisma.familyMember.update({
      where: { id: memberId },
      data: { status },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    return success("Member status updated", { member: updated });
  } catch (err) {
    console.error("UpdateMemberStatus Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
