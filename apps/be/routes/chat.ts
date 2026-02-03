import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { getUserIdFromRequest } from "./messages/auth";

// GET /api/chat
/**
 * Performs handle get chat operation.
 * @param {Request} req - Description of req
 * @returns {Promise<Response>} Description of return value
 */
export async function handleGetChat(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return failure("Unauthorized", null, 401);

  try {
    // 1. Personal conversations (most recent)
    const personal = await prisma.conversation.findMany({
      where: { participants: { has: userId } },
      orderBy: { lastMessageAt: "desc" },
      include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
    });

    // 2. Determine user's active family (take most recent FamilyMember)
    const fm = await prisma.familyMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: "desc" },
    });

    let familyChat = null;

    if (fm) {
      const familyMembers = await prisma.familyMember.findMany({
        where: { familyId: fm.familyId },
      });

      const memberIds = familyMembers.map((m) => m.userId);

      if (memberIds.length > 0) {
        // Try to find an existing conversation that contains every family member
        const existing = await prisma.conversation.findFirst({
          where: {
            participants: { hasEvery: memberIds },
          },
          include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
        });

        if (existing) {
          familyChat = existing;
        } else {
          // Create a family conversation
          const created = await prisma.conversation.create({
            data: { participants: memberIds },
          });
          familyChat = created;
        }
      }
    }

    return success("Chats retrieved", { personal, familyChat });
  } catch (err) {
    console.error("Failed to fetch chat list:", err);
    return failure("Failed to fetch chat list", null, 500);
  }
}
