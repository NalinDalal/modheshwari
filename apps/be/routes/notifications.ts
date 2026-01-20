import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { requireAuth } from "./authMiddleware";
import { Role, NotificationType, NotificationChannel } from "@prisma/client";

/**
 * Shape of create notification request body
 */
interface CreateNotificationBody {
  message: string;
  type?: NotificationType;
  channels?: NotificationChannel[];
  targetRole?: Role;
  subject?: string;
  priority?: "low" | "normal" | "high" | "urgent";
}

/**
 * Broadcast a notification to users based on sender's role and scope
 * POST /api/notifications
 * Body: { message: string, type?: string, channels?: string[], targetRole?: Role, subject?: string, priority?: string }
 */
export async function handleCreateNotification(req: Request) {
  try {
    const auth = requireAuth(req, [
      "COMMUNITY_HEAD",
      "COMMUNITY_SUBHEAD",
      "GOTRA_HEAD",
      "FAMILY_HEAD",
    ]);

    if (!auth.ok) return auth.response as Response;

    /**
     * Parse body safely
     * `req.json()` returns `unknown` in strict TS
     */
    const rawBody: unknown = await req.json().catch(() => null);

    if (
      !rawBody ||
      typeof rawBody !== "object" ||
      !("message" in rawBody) ||
      typeof (rawBody as any).message !== "string" ||
      !(rawBody as any).message.trim()
    ) {
      return failure("Missing message", "Validation Error", 400);
    }

    const {
      message,
      type = NotificationType.GENERIC,
      channels = [NotificationChannel.IN_APP],
      targetRole,
      subject,
      priority = "normal",
    } = rawBody as CreateNotificationBody;

    const senderId = auth.payload.id;
    const senderRole = auth.payload.role as Role;

    /**
     * Permission matrix:
     * - COMMUNITY_HEAD        → everyone
     * - COMMUNITY_SUBHEAD     → admins only
     * - GOTRA_HEAD            → own gotra
     * - FAMILY_HEAD           → own family
     */
    const ROLE_TARGETS: Record<Role, Role[]> = {
      COMMUNITY_HEAD: [
        "COMMUNITY_HEAD",
        "COMMUNITY_SUBHEAD",
        "GOTRA_HEAD",
        "FAMILY_HEAD",
        "MEMBER",
      ],
      COMMUNITY_SUBHEAD: ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"],
      GOTRA_HEAD: ["FAMILY_HEAD", "MEMBER"],
      FAMILY_HEAD: ["MEMBER"],
      MEMBER: [],
    };

    // Validate targetRole if provided
    if (targetRole) {
      const allowed = ROLE_TARGETS[senderRole] || [];
      if (!allowed.includes(targetRole)) {
        return failure("Invalid target role", "Forbidden", 403);
      }
    }

    /**
     * Base user filter
     */
    const where: any = {
      status: true,
    };

    /**
     * Apply role-based scoping
     */
    switch (senderRole) {
      case "FAMILY_HEAD": {
        // Restrict to sender's family
        const family = await prisma.familyMember.findFirst({
          where: { userId: senderId, role: "FAMILY_HEAD" },
          select: { familyId: true },
        });

        if (!family) {
          return failure("Family not found", "Invalid State", 400);
        }

        where.families = {
          some: { familyId: family.familyId },
        };
        break;
      }

      case "GOTRA_HEAD": {
        // Restrict to sender's gotra
        const profile = await prisma.profile.findUnique({
          where: { userId: senderId },
          select: { gotra: true },
        });

        if (!profile?.gotra) {
          return failure("Gotra not found", "Invalid State", 400);
        }

        where.profile = {
          gotra: profile.gotra,
        };
        break;
      }

      case "COMMUNITY_SUBHEAD": {
        // Admins only
        where.role = {
          in: ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"],
        };
        break;
      }

      case "COMMUNITY_HEAD":
        // No restriction (full broadcast)
        break;
    }

    /**
     * Optional role filter (after scope)
     */
    if (targetRole) {
      where.role = targetRole;
    }

    /**
     * Fetch recipients
     */
    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (!users.length) {
      return failure("No users found for broadcast", "Not Found", 404);
    }

    /**
     * Use Kafka pub/sub to broadcast notifications
     * This decouples notification creation from delivery
     */

    /*const result = await broadcastNotification({
      message,
      type,
      channels,
      subject,
      recipientIds: users.map((u) => u.id),
      senderId,
      priority,
    });

    return success(
      "Notifications queued for delivery",
      {
        eventId: result.eventId,
        recipientCount: result.recipientCount,
        channels,
      },
      202, // Accepted (async processing)
    );
            */
  } catch (err) {
    console.error("Create Notification Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
