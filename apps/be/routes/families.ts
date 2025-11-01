import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { hashPassword } from "@modheshwari/utils/hash";
import { requireAuth } from "./auth-middleware";

/**
 * Create a Family for the authenticated user and make them the head.
 * POST /api/families
 * Body: { name: string, uniqueId?: string }
 */
export async function handleCreateFamily(req: any) {
  try {
    // Require authentication (any role)
    const authCheck = requireAuth(req as Request);
    if (!authCheck.ok) return authCheck.response;
    const userId = authCheck.payload.userId ?? authCheck.payload.id;

    const body = await req.json().catch(() => null);
    if (!body) return failure("Invalid JSON body", "Bad Request", 400);
    const { name, uniqueId } = body;
    if (!name) return failure("Missing family name", "Validation Error", 400);

    const family = await prisma.family.create({
      data: {
        name,
        uniqueId: uniqueId
          ? uniqueId
          : `FAM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        headId: userId,
      },
    });

    // Link the creating user as FAMILY_HEAD member
    await prisma.familyMember.create({
      data: {
        familyId: family.id,
        userId,
        role: "FAMILY_HEAD",
      },
    });

    return success("Family created", { family }, 201);
  } catch (err) {
    console.error("Create Family Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * Add an existing user to a family (must be family head).
 * POST /api/families/:id/members
 * Body: { userId?: string, email?: string, role?: string }
 */
export async function handleAddMember(req: any, familyId: string) {
  try {
    const authCheck = requireAuth(req as Request);
    if (!authCheck.ok) return authCheck.response;
    const requesterId = authCheck.payload.userId ?? authCheck.payload.id;

    // Verify requester is head of the family
    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) return failure("Family not found", "Not Found", 404);
    if (family.headId !== requesterId)
      return failure("Only family head can add members", "Forbidden", 403);

    const body = await req.json().catch(() => null);
    if (!body) return failure("Invalid JSON body", "Bad Request", 400);

    const { userId, email, role } = body;

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else if (email) {
      // email is not unique at the schema level; use findFirst to avoid
      // Prisma validation errors. Consider adding @unique to User.email.
      user = await prisma.user.findFirst({ where: { email } });
    } else {
      return failure("Provide userId or email to add", "Validation Error", 400);
    }

    if (!user) return failure("User not found", "Not Found", 404);

    // Prevent duplicate membership with same role
    const existing = await prisma.familyMember.findFirst({
      where: { familyId: family.id, userId: user.id, role: role ?? "MEMBER" },
    });
    if (existing)
      return failure("User already member with that role", "Conflict", 409);

    const fm = await prisma.familyMember.create({
      data: {
        familyId: family.id,
        userId: user.id,
        role: role ?? "MEMBER",
      },
    });

    return success("Member added", { member: fm }, 201);
  } catch (err) {
    console.error("Add Member Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

// List pending invites for a family (family-head only)
export async function handleListInvites(req: any, familyId: string) {
  try {
    const authCheck = requireAuth(req as Request);
    if (!authCheck.ok) return authCheck.response;
    const requesterId = authCheck.payload.userId ?? authCheck.payload.id;
    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) return failure("Family not found", "Not Found", 404);
    if (family.headId !== requesterId)
      return failure("Only family head can view invites", "Forbidden", 403);

    const invites = await prisma.memberInvite.findMany({
      where: { familyId, status: "PENDING" },
      include: { invitedUser: true },
    });

    return success("Invites fetched", { invites }, 200);
  } catch (err) {
    console.error("List Invites Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

// Review (approve/reject) an invite
export async function handleReviewInvite(
  req: any,
  familyId: string,
  inviteId: string,
  action: string,
) {
  try {
    const authCheck = requireAuth(req as Request, ["FAMILY_HEAD"]);
    if (!authCheck.ok) return authCheck.response;
    const reviewerId = authCheck.payload.userId ?? authCheck.payload.id;
    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) return failure("Family not found", "Not Found", 404);
    if (family.headId !== reviewerId)
      return failure("Only family head can review invites", "Forbidden", 403);

    const invite = await prisma.memberInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite) return failure("Invite not found", "Not Found", 404);
    if (invite.status !== "PENDING")
      return failure("Invite already reviewed", "Conflict", 409);

    const body = await req.json().catch(() => null);
    const remarks = body?.remarks ?? null;

    if (action === "approve") {
      // Ensure there's at least an email or invited user
      if (!invite.invitedUserId && !invite.inviteEmail) {
        return failure(
          "Cannot approve invite without an associated user or email",
          "Invalid Invite",
          400,
        );
      }

      // Use a transaction to ensure atomicity: create user (if needed) + familyMember + update invite + notify
      await prisma.$transaction(async (tx) => {
        let invitedUserId = invite.invitedUserId;

        // If invite was created for an email (no user exists yet), create a placeholder user
        if (!invitedUserId && invite.inviteEmail) {
          const pw = Math.random().toString(36).slice(2, 10);
          const hashed = await hashPassword(pw);
          const newUser = await tx.user.create({
            data: {
              name: invite.inviteEmail.split("@")[0],
              email: invite.inviteEmail,
              password: hashed,
              role: "MEMBER",
              status: true,
            },
          });
          invitedUserId = newUser.id;

          // persist invitedUserId onto invite
          await tx.memberInvite.update({
            where: { id: inviteId },
            data: { invitedUserId },
          });
        }

        // create FamilyMember
        await tx.familyMember.create({
          data: {
            familyId: family.id,
            userId: invitedUserId!,
            role: "MEMBER",
          },
        });

        // update invite
        await tx.memberInvite.update({
          where: { id: inviteId },
          data: {
            status: "APPROVED",
            reviewedById: reviewerId,
            reviewedAt: new Date(),
            remarks,
          },
        });

        // create notification for invited user
        await tx.notification.create({
          data: {
            userId: invitedUserId!,
            type: "invite_approved",
            message: `Your request to join ${family.name} has been approved.`,
          },
        });
      });

      return success("Invite approved and member added", null, 200);
    }

    if (action === "reject") {
      await prisma.memberInvite.update({
        where: { id: inviteId },
        data: {
          status: "REJECTED",
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          remarks,
        },
      });

      if (invite.invitedUserId) {
        await prisma.notification.create({
          data: {
            userId: invite.invitedUserId,
            type: "invite_rejected",
            message: `Your request to join ${family.name} has been rejected.`,
          },
        });
      }

      return success("Invite rejected", null, 200);
    }

    return failure("Invalid action", "Bad Request", 400);
  } catch (err) {
    console.error("Review Invite Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
