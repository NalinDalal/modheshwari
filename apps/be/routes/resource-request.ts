import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";

import { requireAuth } from "./auth-middleware";

/**
 * Create a ResourceRequest
 * POST /api/resource-requests
 * Body: { resource: string, details?: string }
 */
export async function handleCreateResourceRequest(
  req: Request,
): Promise<Response> {
  try {
    const auth = requireAuth(req as Request);
    if (!auth.ok) return auth.response as Response;
    const userId = auth.payload.userId ?? auth.payload.id;

    const body: any = await (req as Request).json().catch(() => null);
    if (!body || !body.resource)
      return failure("Missing resource field", "Validation Error", 400);

    // create base request
    const rr = await prisma.resourceRequest.create({
      data: {
        userId,
        resource: body.resource,
        status: "PENDING",
      },
    });

    // identify approvers: Community head, community subhead, gotra head (if available)
    const approvers: Array<{ id: string; role: string; name: string }> = [];

    const communityHead = await prisma.user.findFirst({
      where: { role: "COMMUNITY_HEAD", status: true },
    });
    if (communityHead)
      approvers.push({
        id: communityHead.id,
        role: "COMMUNITY_HEAD",
        name: communityHead.name,
      });

    const communitySub = await prisma.user.findFirst({
      where: { role: "COMMUNITY_SUBHEAD", status: true },
    });
    if (communitySub)
      approvers.push({
        id: communitySub.id,
        role: "COMMUNITY_SUBHEAD",
        name: communitySub.name,
      });

    // try to find gotra of requester and find a GOTRA_HEAD for that gotra
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile?.gotra) {
      const gotraHead = await prisma.user.findFirst({
        where: { role: "GOTRA_HEAD", status: true },
        include: { profile: true },
      });
      if (gotraHead && gotraHead.profile?.gotra === profile.gotra)
        approvers.push({
          id: gotraHead.id,
          role: "GOTRA_HEAD",
          name: gotraHead.name,
        });
    }

    // create approval rows and notify approvers
    await Promise.all(
      approvers.map(async (a) => {
        await prisma.resourceRequestApproval.create({
          data: {
            requestId: rr.id,
            approverId: a.id,
            approverName: a.name,
            role: a.role as any,
            status: "PENDING",
          },
        });

        await prisma.notification.create({
          data: {
            userId: a.id,
            type: "RESOURCE_REQUEST",
            message: `New resource request from ${auth.payload.name ?? "a user"}: ${body.resource}`,
          },
        });
      }),
    );

    // return created request with approvals
    const created = await prisma.resourceRequest.findUnique({
      where: { id: rr.id },
      include: { approvals: true },
    });

    return success("Resource request created", { request: created }, 201);
  } catch (err) {
    console.error("Create ResourceRequest Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * List resource requests
 * GET /api/resource-requests
 * Query: status (optional)
 */
export async function handleListResourceRequests(req: any): Promise<Response> {
  try {
    const auth = requireAuth(req as Request);
    if (!auth.ok) return auth.response as Response;
    const payload = auth.payload;

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;

    // admin roles see all requests, others see their own
    const adminRoles = ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"];
    const where: any = {};
    if (status) where.status = status;

    if (!adminRoles.includes(payload.role)) {
      where.userId = payload.userId ?? payload.id;
    }

    const list = await prisma.resourceRequest.findMany({
      where,
      include: { approvals: true, user: true },
      orderBy: { createdAt: "desc" },
    });

    return success("Requests fetched", { requests: list }, 200);
  } catch (err) {
    console.error("List ResourceRequests Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * Get a single resource request with approvals
 * GET /api/resource-requests/:id
 */
export async function handleGetResourceRequest(
  req: any,
  id: string,
): Promise<Response> {
  try {
    const auth = requireAuth(req as Request);
    if (!auth.ok) return auth.response as Response;

    const r = await prisma.resourceRequest.findUnique({
      where: { id },
      include: { approvals: true, user: true },
    });
    if (!r) return failure("Request not found", "Not Found", 404);

    // ensure non-admins can only view their own
    const adminRoles = ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"];
    const payload = auth.payload;
    if (!adminRoles.includes(payload.role)) {
      const uid = payload.userId ?? payload.id;
      if (r.userId !== uid) return failure("Forbidden", "Forbidden", 403);
    }

    return success("Request fetched", { request: r }, 200);
  } catch (err) {
    console.error("Get ResourceRequest Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * Review a resource request (approve/reject/changes)
 * POST /api/resource-requests/:id/review
 * Body: { action: "approve" | "reject" | "changes", remarks?: string }
 */
export async function handleReviewResourceRequest(
  req: any,
  id: string,
): Promise<Response> {
  try {
    const auth = requireAuth(req as Request, [
      "COMMUNITY_HEAD",
      "COMMUNITY_SUBHEAD",
      "GOTRA_HEAD",
    ]);
    if (!auth.ok) return auth.response as Response;
    const reviewerId = auth.payload.userId ?? auth.payload.id;

    const body: any = await (req as Request).json().catch(() => null);
    if (!body || !body.action)
      return failure("Missing action", "Validation Error", 400);

    const action = body.action;
    const remarks = body.remarks ?? null;

    const approval = await prisma.resourceRequestApproval.findFirst({
      where: { requestId: id, approverId: reviewerId },
    });
    if (!approval)
      return failure("Approval row not found for you", "Forbidden", 403);

    const statusMap: any = {
      approve: "APPROVED",
      reject: "REJECTED",
      changes: "CHANGES_REQUESTED",
    };

    const newStatus = statusMap[action];
    if (!newStatus) return failure("Invalid action", "Bad Request", 400);

    await prisma.resourceRequestApproval.update({
      where: { id: approval.id },
      data: { status: newStatus, remarks, reviewedAt: new Date() },
    });

    // Recompute overall request status
    const approvals: Array<{ status: string }> =
      (await prisma.resourceRequestApproval.findMany({
        where: { requestId: id },
      })) as any;

    let overall: any = "PENDING";
    if (approvals.some((a) => a.status === "REJECTED")) overall = "REJECTED";
    else if (approvals.every((a) => a.status === "APPROVED"))
      overall = "APPROVED";
    else if (approvals.some((a) => a.status === "CHANGES_REQUESTED"))
      overall = "CHANGES_REQUESTED";

    await prisma.resourceRequest.update({
      where: { id },
      data: { status: overall, approverId: reviewerId },
    });

    // notify requester
    const reqRow = await prisma.resourceRequest.findUnique({ where: { id } });
    if (reqRow) {
      await prisma.notification.create({
        data: {
          userId: reqRow.userId,
          type: "RESOURCE_REQUEST",
          message: `Your resource request has an update: ${newStatus}`,
        },
      });
    }

    return success("Review recorded", null, 200);
  } catch (err) {
    console.error("Review ResourceRequest Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * List current user's notifications
 * GET /api/notifications
 */
export async function handleListNotifications(req: any): Promise<Response> {
  try {
    const auth = requireAuth(req as Request);
    if (!auth.ok) return auth.response as Response;
    const userId = auth.payload.userId ?? auth.payload.id;

    const list = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return success("Notifications fetched", { notifications: list }, 200);
  } catch (err) {
    console.error("List Notifications Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
