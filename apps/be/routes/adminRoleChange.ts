import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { requireAuth } from "./authMiddleware";
import type { Role } from "@prisma/client";

const ADMIN_ROLES = ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"];

/**
 * PATCH /api/admin/users/:id/role
 * Changes the role of a user (admin power transfer)
 * 
 * Permission Logic:
 * - COMMUNITY_HEAD can edit: COMMUNITY_SUBHEAD, GOTRA_HEAD
 * - 3+ COMMUNITY_SUBHEAD can collectively edit: COMMUNITY_HEAD, COMMUNITY_SUBHEAD, GOTRA_HEAD
 * - GOTRA_HEAD cannot change any admin roles
 * 
 * Body: { newRole: Role, approvalIds?: string[] }
 */
export async function handleChangeUserRole(
  req: Request,
  targetUserId: string,
): Promise<Response> {
  try {
    const auth = requireAuth(req as Request, ADMIN_ROLES);
    if (!auth.ok) return auth.response as Response;

    const requesterId = auth.payload.userId || auth.payload.id;
    const requesterRole = auth.payload.role as Role;

    // Parse request body
    const body: any = await (req as Request).json().catch(() => null);
    if (!body || !body.newRole) {
      return failure("Missing newRole in request body", "Validation Error", 400);
    }

    const { newRole, approvalIds } = body;

    // Validate newRole
    const validRoles: Role[] = [
      "COMMUNITY_HEAD",
      "COMMUNITY_SUBHEAD",
      "GOTRA_HEAD",
      "FAMILY_HEAD",
      "MEMBER",
    ];
    if (!validRoles.includes(newRole)) {
      return failure("Invalid role specified", "Validation Error", 400);
    }

    // Fetch target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, role: true, email: true },
    });

    if (!targetUser) {
      return failure("User not found", "Not Found", 404);
    }

    // Cannot change your own role
    if (targetUserId === requesterId) {
      return failure(
        "Cannot change your own role",
        "Forbidden",
        403,
      );
    }

    // Check permissions based on requester role
    const canChange = await checkRoleChangePermission(
      requesterRole,
      targetUser.role,
      newRole,
      requesterId,
      approvalIds,
    );

    if (!canChange.allowed) {
      return failure(canChange.reason || "Forbidden", "Forbidden", 403);
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    // Create notification for the target user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: "GENERIC",
        message: `Your role has been changed from ${targetUser.role} to ${newRole}`,
      },
    });

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: requesterId,
        type: "GENERIC",
        message: `Successfully changed ${targetUser.name}'s role from ${targetUser.role} to ${newRole}`,
      },
    });

    return success("User role updated successfully", { user: updatedUser }, 200);
  } catch (err) {
    console.error("ChangeUserRole Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * Check if the requester has permission to change target's role to newRole
 */
async function checkRoleChangePermission(
  requesterRole: Role,
  targetCurrentRole: Role,
  targetNewRole: Role,
  requesterId: string,
  approvalIds?: string[],
): Promise<{ allowed: boolean; reason?: string }> {
  // COMMUNITY_HEAD can edit COMMUNITY_SUBHEAD and GOTRA_HEAD
  if (requesterRole === "COMMUNITY_HEAD") {
    const allowedTargetRoles: Role[] = [
      "COMMUNITY_SUBHEAD",
      "GOTRA_HEAD",
      "FAMILY_HEAD",
      "MEMBER",
    ];
    
    if (!allowedTargetRoles.includes(targetCurrentRole)) {
      return {
        allowed: false,
        reason: "COMMUNITY_HEAD can only edit COMMUNITY_SUBHEAD, GOTRA_HEAD, FAMILY_HEAD, or MEMBER roles",
      };
    }

    // Can't promote someone to COMMUNITY_HEAD
    if (targetNewRole === "COMMUNITY_HEAD") {
      return {
        allowed: false,
        reason: "Cannot promote users to COMMUNITY_HEAD role",
      };
    }

    return { allowed: true };
  }

  // COMMUNITY_SUBHEAD: Need 3+ approvals to edit admin roles
  if (requesterRole === "COMMUNITY_SUBHEAD") {
    if (!approvalIds || approvalIds.length < 2) {
      return {
        allowed: false,
        reason: "Need at least 3 COMMUNITY_SUBHEAD approvals (including yourself) to change admin roles",
      };
    }

    // Verify all approval IDs are valid COMMUNITY_SUBHEAD users
    const approvers = await prisma.user.findMany({
      where: {
        id: { in: approvalIds },
        role: "COMMUNITY_SUBHEAD",
        status: true,
      },
    });

    if (approvers.length < 2) {
      return {
        allowed: false,
        reason: "Invalid approval IDs or not all approvers are active COMMUNITY_SUBHEAD users",
      };
    }

    // Total = requester + approvers
    const totalApprovals = approvers.length + 1;
    if (totalApprovals < 3) {
      return {
        allowed: false,
        reason: `Only ${totalApprovals} approvals provided, need at least 3`,
      };
    }

    // Can edit COMMUNITY_HEAD, COMMUNITY_SUBHEAD, GOTRA_HEAD
    const allowedTargetRoles: Role[] = [
      "COMMUNITY_HEAD",
      "COMMUNITY_SUBHEAD",
      "GOTRA_HEAD",
      "FAMILY_HEAD",
      "MEMBER",
    ];

    if (!allowedTargetRoles.includes(targetCurrentRole)) {
      return {
        allowed: false,
        reason: "Can only edit admin or lower roles",
      };
    }

    return { allowed: true };
  }

  // GOTRA_HEAD cannot change any admin roles
  if (requesterRole === "GOTRA_HEAD") {
    return {
      allowed: false,
      reason: "GOTRA_HEAD cannot change admin roles",
    };
  }

  // FAMILY_HEAD and MEMBER cannot change roles
  return {
    allowed: false,
    reason: "Insufficient permissions to change user roles",
  };
}

/**
 * GET /api/admin/users
 * List all users with their roles (admin only)
 * 
 * Query params:
 * - role: Filter by specific role
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 */
export async function handleListUsers(req: Request): Promise<Response> {
  try {
    const auth = requireAuth(req as Request, ADMIN_ROLES);
    if (!auth.ok) return auth.response as Response;

    const url = new URL(req.url);
    const roleFilter = url.searchParams.get("role");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {
      status: true,
    };

    if (roleFilter) {
      where.role = roleFilter;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          profile: {
            select: {
              phone: true,
              gotra: true,
              profession: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return success(
      "Users fetched",
      {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      200,
    );
  } catch (err) {
    console.error("ListUsers Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * GET /api/admin/role-change-permissions
 * Get information about what role changes the current user can perform
 */
export async function handleGetRoleChangePermissions(
  req: Request,
): Promise<Response> {
  try {
    const auth = requireAuth(req as Request, ADMIN_ROLES);
    if (!auth.ok) return auth.response as Response;

    const requesterRole = auth.payload.role as Role;

    let permissions: any = {
      role: requesterRole,
      canEditRoles: [],
      requiresMultipleApprovals: false,
      minimumApprovals: 1,
    };

    switch (requesterRole) {
      case "COMMUNITY_HEAD":
        permissions.canEditRoles = [
          "COMMUNITY_SUBHEAD",
          "GOTRA_HEAD",
          "FAMILY_HEAD",
          "MEMBER",
        ];
        permissions.description =
          "Can edit sub-admin and lower roles directly";
        break;

      case "COMMUNITY_SUBHEAD":
        permissions.canEditRoles = [
          "COMMUNITY_HEAD",
          "COMMUNITY_SUBHEAD",
          "GOTRA_HEAD",
          "FAMILY_HEAD",
          "MEMBER",
        ];
        permissions.requiresMultipleApprovals = true;
        permissions.minimumApprovals = 3;
        permissions.description =
          "Can edit any admin role with 3+ COMMUNITY_SUBHEAD approvals";
        break;

      case "GOTRA_HEAD":
        permissions.canEditRoles = [];
        permissions.description = "Cannot change admin roles";
        break;

      default:
        permissions.canEditRoles = [];
        permissions.description = "No permission to change roles";
    }

    return success("Role change permissions fetched", permissions, 200);
  } catch (err) {
    console.error("GetRoleChangePermissions Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * GET /api/admin/users/:id
 * Get detailed information about a specific user
 */
export async function handleGetUserDetails(
  req: Request,
  userId: string,
): Promise<Response> {
  try {
    const auth = requireAuth(req as Request, ADMIN_ROLES);
    if (!auth.ok) return auth.response as Response;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            phone: true,
            address: true,
            profession: true,
            gotra: true,
            location: true,
            status: true,
            bloodGroup: true,
          },
        },
        families: {
          select: {
            family: {
              select: {
                id: true,
                name: true,
                uniqueId: true,
              },
            },
            role: true,
            joinedAt: true,
          },
        },
      },
    });

    if (!user) {
      return failure("User not found", "Not Found", 404);
    }

    return success("User details fetched", { user }, 200);
  } catch (err) {
    console.error("GetUserDetails Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}