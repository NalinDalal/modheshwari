import type { Role } from "@prisma/client";
import { success, failure } from "@modheshwari/utils/response";

import { requireAuth } from "../authMiddleware";
import { ADMIN_ROLES } from "./constants";

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

    const permissions: any = {
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
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
