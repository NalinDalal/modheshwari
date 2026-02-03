import type { Role } from "@prisma/client";
import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";

import { requireAuth } from "../authMiddleware";
import { ADMIN_ROLES, VALID_ROLES } from "./constants";
import { checkRoleChangePermission } from "./permissions";

/**
 * PATCH /api/admin/users/:id/role
 * Changes the role of a user (admin power transfer)
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
    if (!VALID_ROLES.includes(newRole)) {
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
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
