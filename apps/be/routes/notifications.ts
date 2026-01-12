import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { requireAuth } from "./auth-middleware";

/**
 * Broadcast a notification to users based on sender's role and scope
 * POST /api/notifications
 * Body: { message: string, type?: string, channel?: string, targetRole?: string }
 */
export async function handleCreateNotification(req: any): Promise<Response> {
  try {
    const auth = requireAuth(req as Request, [
      "COMMUNITY_HEAD",
      "COMMUNITY_SUBHEAD",
      "GOTRA_HEAD",
      "FAMILY_HEAD",
      "FAMILY_MEMBER",
    ]);

    if (!auth.ok) return auth.response as Response;

    const body: any = await (req as Request).json().catch(() => null);
    if (!body || !body.message)
      return failure("Missing message", "Validation Error", 400);

    const { message, type = "GENERIC", channel = "IN_APP", targetRole } = body;
    const senderRole = auth.payload.role;
    const senderId = auth.payload.id;

    // Build user filter based on sender's role
    const where: any = { status: true };

    switch (senderRole) {
      case "FAMILY_HEAD":
      case "FAMILY_MEMBER":
        // Get sender's family
        const senderFamily = await prisma.familyMember.findFirst({
          where: { userId: senderId },
          select: { family: { select: { id: true } } },
        });

        if (!senderFamily?.family?.id) {
          return failure(
            "User not associated with a family",
            "Invalid State",
            400,
          );
        }

        where.familyId = senderFamily.family.id;
        break;

      case "GOTRA_HEAD":
        // Get sender's gotra
        const senderGotra = await prisma.profile.findUnique({
          where: { userId: senderId },
          select: { gotra: true },
        });

        if (!senderGotra?.gotra) {
          return failure(
            "User not associated with a gotra",
            "Invalid State",
            400,
          );
        }

        where.gotraId = senderGotra.gotra;
        break;

      case "COMMUNITY_HEAD":
      case "COMMUNITY_SUBHEAD":
        // No additional filter - broadcast to entire community
        break;

      default:
        return failure("Unauthorized role", "Authorization Error", 403);
    }

    // Apply optional targetRole filter
    if (targetRole && typeof targetRole === "string") {
      where.role = targetRole;
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (!users.length) {
      return failure("No users found for the target filter", "Not Found", 404);
    }

    const data = users.map((u: any) => ({
      userId: u.id,
      message,
      type,
      channel,
    }));

    // createMany for performance
    await prisma.notification.createMany({ data });

    return success("Notifications broadcasted", { count: users.length }, 201);
  } catch (err) {
    console.error("Create Notification Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
