import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { requireAuth } from "./auth-middleware";

const ADMIN_ROLES = ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"];

/**
 * GET /api/admin/requests
 * Lists all user-generated requests (resource requests and events).
 */
export async function handleListAllRequests(req: any): Promise<Response> {
  try {
    const auth = requireAuth(req as Request, ADMIN_ROLES);
    if (!auth.ok) return auth.response as Response;

    // Resource requests (include approvals and requester)
    const resourceRequests = await prisma.resourceRequest.findMany({
      include: { approvals: true, user: true },
      orderBy: { createdAt: "desc" },
    });

    // Events (include approvals and creator)
    const events = await prisma.event.findMany({
      include: { approvals: true, createdBy: true },
      orderBy: { createdAt: "desc" },
    });

    return success("Admin requests fetched", { resourceRequests, events }, 200);
  } catch (err) {
    console.error("ListAllRequests Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * POST /api/admin/events/:id/status
 * Body: { status: "APPROVED" | "REJECTED" | "CANCELLED" }
 */
export async function handleUpdateEventStatus(
  req: any,
  id: string,
): Promise<Response> {
  try {
    const auth = requireAuth(req as Request, ADMIN_ROLES);
    if (!auth.ok) return auth.response as Response;

    const body: any = await (req as Request).json().catch(() => null);
    if (!body || !body.status)
      return failure("Missing status", "Validation Error", 400);

    const allowed = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];
    const status = body.status.toUpperCase();
    if (!allowed.includes(status))
      return failure("Invalid status", "Validation Error", 400);

    const ev = await prisma.event.findUnique({ where: { id } });
    if (!ev) return failure("Event not found", "Not Found", 404);

    const updated = await prisma.event.update({
      where: { id },
      data: { status: status as any },
    });

    // Notify event creator
    await prisma.notification.create({
      data: {
        userId: ev.createdById,
        type: "EVENT_APPROVAL" as any,
        message: `Your event '${ev.name}' status changed to ${status}`,
      },
    });

    return success("Event status updated", { event: updated }, 200);
  } catch (err) {
    console.error("UpdateEventStatus Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
