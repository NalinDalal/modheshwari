import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { requireAuth } from "./auth-middleware";

/**
 * Broadcast a notification to all users or a role
 * POST /api/notifications
 * Body: { message: string, type?: string, channel?: string, targetRole?: string }
 */
export async function handleCreateNotification(req: any) {
  try {
    const auth = requireAuth(req as Request, [
      "COMMUNITY_HEAD",
      "COMMUNITY_SUBHEAD",
      "GOTRA_HEAD",
    ]);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || !body.message)
      return failure("Missing message", "Validation Error", 400);

    const { message, type = "GENERIC", channel = "IN_APP", targetRole } = body;

    // build user list
    const where: any = { status: true };
    if (targetRole && typeof targetRole === "string") where.role = targetRole;

    const users = await prisma.user.findMany({ where, select: { id: true } });
    if (!users.length)
      return failure("No users found for the target filter", "Not Found", 404);

    const data = users.map((u) => ({ userId: u.id, message, type, channel }));

    // createMany for performance
    await prisma.notification.createMany({ data });

    return success("Notifications broadcasted", { count: users.length }, 201);
  } catch (err) {
    console.error("Create Notification Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
