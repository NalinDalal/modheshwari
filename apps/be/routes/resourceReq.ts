import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { requireAuth } from "./authMiddleware";
import { isRateLimited } from "@modheshwari/utils/rate-limit";
import type { ApprovalStatus } from "@prisma/client";

/* =========================================================
   CREATE RESOURCE REQUEST (RATE LIMITED)
   POST /api/resource-requests
   ========================================================= */

export async function handleCreateResourceRequest(
  req: Request,
): Promise<Response> {
  try {
    if (
      isRateLimited(req, {
        max: 5,
        windowMs: 5 * 60_000,
        scope: "resource-create",
      })
    ) {
      return failure("Too many requests", "Rate Limit", 429);
    }

    const auth = requireAuth(req);
    if (!auth.ok) return auth.response as Response;

    const userId = auth.payload.userId ?? auth.payload.id;
    const body = (await req.json().catch(() => null)) as any;

    if (!body?.resource) {
      return failure("Missing resource field", "Validation Error", 400);
    }

    /* -------- Identify approvers -------- */

    const approvers: Array<{ id: string; role: string; name: string }> = [];

    const communityHead = await prisma.user.findFirst({
      where: { role: "COMMUNITY_HEAD", status: true },
    });

    if (communityHead) {
      approvers.push({
        id: communityHead.id,
        role: "COMMUNITY_HEAD",
        name: communityHead.name,
      });
    }

    const communitySub = await prisma.user.findFirst({
      where: { role: "COMMUNITY_SUBHEAD", status: true },
    });

    if (communitySub) {
      approvers.push({
        id: communitySub.id,
        role: "COMMUNITY_SUBHEAD",
        name: communitySub.name,
      });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (profile?.gotra) {
      const gotraHead = await prisma.user.findFirst({
        where: {
          role: "GOTRA_HEAD",
          status: true,
          profile: { gotra: profile.gotra },
        },
      });

      if (gotraHead) {
        approvers.push({
          id: gotraHead.id,
          role: "GOTRA_HEAD",
          name: gotraHead.name,
        });
      }
    }

    /* -------- Transaction -------- */

    const created = await prisma.$transaction(async (tx) => {
      const rr = await tx.resourceRequest.create({
        data: {
          userId,
          resource: body.resource,
          status: "PENDING",
        },
      });

      for (const a of approvers) {
        await tx.resourceRequestApproval.create({
          data: {
            requestId: rr.id,
            approverId: a.id,
            approverName: a.name,
            role: a.role as any,
            status: "PENDING",
          },
        });

        await tx.notification.create({
          data: {
            userId: a.id,
            type: "RESOURCE_REQUEST",
            message: `New resource request from ${
              auth.payload.name ?? "a user"
            }: ${body.resource}`,
          },
        });
      }

      return tx.resourceRequest.findUnique({
        where: { id: rr.id },
        include: { approvals: true },
      });
    });

    return success("Resource request created", { request: created }, 201);
  } catch (err) {
    console.error("Create ResourceRequest Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/* =========================================================
   LIST RESOURCE REQUESTS
   GET /api/resource-requests
   ========================================================= */

export async function handleListResourceRequests(
  req: Request,
): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response as Response;

    const payload = auth.payload;
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;

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

/* =========================================================
   GET SINGLE RESOURCE REQUEST
   ========================================================= */

export async function handleGetResourceRequest(
  req: Request,
  id: string,
): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response as Response;

    const r = await prisma.resourceRequest.findUnique({
      where: { id },
      include: { approvals: true, user: true },
    });

    if (!r) return failure("Request not found", "Not Found", 404);

    const adminRoles = ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"];
    const payload = auth.payload;

    if (!adminRoles.includes(payload.role)) {
      const uid = payload.userId ?? payload.id;
      if (r.userId !== uid) {
        return failure("Forbidden", "Forbidden", 403);
      }
    }

    return success("Request fetched", { request: r }, 200);
  } catch (err) {
    console.error("Get ResourceRequest Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/* =========================================================
   REVIEW RESOURCE REQUEST (RATE LIMITED)
   POST /api/resource-requests/:id/review
   ========================================================= */

export async function handleReviewResourceRequest(
  req: Request,
  id: string,
): Promise<Response> {
  try {
    if (
      isRateLimited(req, {
        max: 10,
        windowMs: 60_000,
        scope: "resource-review",
      })
    ) {
      return failure("Too many requests", "Rate Limit", 429);
    }

    const auth = requireAuth(req, [
      "COMMUNITY_HEAD",
      "COMMUNITY_SUBHEAD",
      "GOTRA_HEAD",
    ]);
    if (!auth.ok) return auth.response as Response;

    const reviewerId = auth.payload.userId ?? auth.payload.id;
    const reviewerName = auth.payload.name ?? null;
    const body = (await req.json().catch(() => null)) as any;

    if (!body?.action) {
      return failure("Missing action", "Validation Error", 400);
    }

    const statusMap: Record<string, ApprovalStatus> = {
      approve: "APPROVED",
      reject: "REJECTED",
      changes: "CHANGES_REQUESTED",
    };

    const newStatus = statusMap[body.action];
    if (!newStatus) {
      return failure("Invalid action", "Bad Request", 400);
    }

    await prisma.$transaction(async (tx) => {
      const approval = await tx.resourceRequestApproval.findFirst({
        where: { requestId: id, approverId: reviewerId },
      });

      if (!approval) throw new Error("NOT_AUTHORIZED");

      await tx.resourceRequestApproval.update({
        where: { id: approval.id },
        data: {
          status: newStatus,
          remarks: body.remarks ?? null,
          reviewedAt: new Date(),
        },
      });

      const approvals = await tx.resourceRequestApproval.findMany({
        where: { requestId: id },
      });

      let overall: ApprovalStatus = "PENDING";
      if (approvals.some((a) => a.status === "REJECTED")) overall = "REJECTED";
      else if (approvals.every((a) => a.status === "APPROVED"))
        overall = "APPROVED";
      else if (approvals.some((a) => a.status === "CHANGES_REQUESTED"))
        overall = "CHANGES_REQUESTED";

      const reqRow = await tx.resourceRequest.update({
        where: { id },
        data: {
          status: overall,
          approverId: reviewerId,
          approverName: reviewerName,
        },
      });

      await tx.notification.create({
        data: {
          userId: reqRow.userId,
          type: "RESOURCE_REQUEST",
          message: `Your resource request status changed to ${overall}`,
        },
      });
    });

    return success("Review recorded", null, 200);
  } catch (err: any) {
    if (err.message === "NOT_AUTHORIZED") {
      return failure("Not your approval", "Forbidden", 403);
    }

    console.error("Review ResourceRequest Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/* =========================================================
   LIST NOTIFICATIONS
   GET /api/notifications
   ========================================================= */

export async function handleListNotifications(req: Request): Promise<Response> {
  try {
    const auth = requireAuth(req);
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
