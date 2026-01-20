import prisma from "@modheshwari/db";
import { verifyAuth } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/index";
import type { Role } from "@prisma/client";

// ---------------- CREATE ----------------
/**
 * Performs handle create status update request operation.
 * @param {Request} req - Description of req
 * @returns {Promise<Response>} Description of return value
 */
export async function handleCreateStatusUpdateRequest(req: Request) {
  const user = await verifyAuth(req);
  if (!user) return failure("Unauthorized", null, 401);

  const userId = user.userId ?? user.id;
  if (!userId) return failure("Unauthorized: missing userId", null, 401);

  const body = (await req.json()) as {
    targetUserId?: string;
    reason?: string;
  };

  const { targetUserId, reason } = body;
  if (!targetUserId) return failure("targetUserId is required", null, 400);

  // Create request
  const request = await prisma.statusUpdateRequest.create({
    data: {
      targetUserId,
      requestedById: userId,
      reason,
      finalStatus: "deceased",
      approvals: {
        create: [
          {
            approverId: await findApprover("COMMUNITY_SUBHEAD"),
            approverName: "Community Subhead",
            role: "COMMUNITY_SUBHEAD" as Role,
          },
          {
            approverId: await findApprover("GOTRA_HEAD"),
            approverName: "Gotra Head",
            role: "GOTRA_HEAD" as Role,
          },
        ],
      },
    },
  });

  return success("Request created", { request });
}

// ---------------- Helper — find approver ----------------
/**
 * Performs find approver operation.
 * @param {import("/Users/nalindalal/modheshwari/node_modules/.prisma/client/index").$Enums.Role} role - Description of role
 * @returns {Promise<string>} Description of return value
 */
async function findApprover(role: Role) {
  const approver = await prisma.user.findFirst({
    where: { role, status: true },
    select: { id: true },
  });
  return approver?.id ?? "";
}

// ---------------- LIST ----------------
/**
 * Performs handle list status update requests operation.
 * @param {Request} req - Description of req
 * @returns {Promise<Response>} Description of return value
 */
export async function handleListStatusUpdateRequests(req: Request) {
  const user = await verifyAuth(req);
  if (!user) return failure("Unauthorized", null, 401);

  const requests = await prisma.statusUpdateRequest.findMany({
    where: {
      OR: [
        { requestedById: user.id },
        { approvals: { some: { approverId: user.id } } },
      ],
    },
    include: {
      targetUser: true,
      approvals: true,
    },
  });

  return success("Fetched status update requests", { requests });
}

// ---------------- REVIEW ----------------
/**
 * Performs handle review status update request operation.
 * @param {Request} req - Description of req
 * @param {string} id - Description of id
 * @returns {Promise<Response>} Description of return value
 */
export async function handleReviewStatusUpdateRequest(
  req: Request,
  id: string,
) {
  const user = await verifyAuth(req);
  if (!user) return failure("Unauthorized", null, 401);

  const body = (await req.json()) as {
    status?: "APPROVED" | "REJECTED";
    remarks?: string;
  };

  const { status, remarks } = body;
  if (!status) return failure("Status field is required", null, 400);

  const approval = await prisma.statusUpdateApproval.updateMany({
    where: {
      requestId: id,
      approverId: user.id,
    },
    data: { status, remarks, reviewedAt: new Date() },
  });

  // Check if all approvers have approved
  const allApproved = await prisma.statusUpdateApproval.count({
    where: { requestId: id, status: "APPROVED" },
  });
  const totalApprovers = await prisma.statusUpdateApproval.count({
    where: { requestId: id },
  });

  if (allApproved === totalApprovers) {
    await prisma.statusUpdateRequest.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });

    // Update the profile
    const reqObj = await prisma.statusUpdateRequest.findUnique({
      where: { id },
      select: { targetUserId: true },
    });
    if (reqObj?.targetUserId) {
      await prisma.profile.updateMany({
        where: { userId: reqObj.targetUserId },
        data: { status: "deceased" },
      });
    }
  }

  return success("Review submitted", { approval });
}
