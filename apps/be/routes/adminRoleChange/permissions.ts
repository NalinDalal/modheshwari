import type { Role } from "@prisma/client";
import prisma from "@modheshwari/db";

/**
 * Check if the requester has permission to change target's role to newRole
 * 
 * Permission Rules:
 * - COMMUNITY_HEAD: Can edit COMMUNITY_SUBHEAD, GOTRA_HEAD, FAMILY_HEAD, MEMBER
 * - COMMUNITY_SUBHEAD: Can edit any role with 3+ collective approvals
 * - GOTRA_HEAD: Cannot change admin roles
 * - Others: No permission
 */
export async function checkRoleChangePermission(
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
