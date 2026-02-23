import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";

import { getUserIdFromRequest } from "./auth";

/**
 * GET /api/messages/conversations
 * Get all conversations for the current user
 */
export async function handleGetConversations(req: Request): Promise<Response> {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return failure("Unauthorized", null, 401);
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          has: userId,
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
      include: {
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    // Get participant details — batch all participant IDs into a single query
    const allOtherIds = new Set<string>();
    for (const conv of conversations) {
      for (const pid of conv.participants) {
        if (pid !== userId) allOtherIds.add(pid);
      }
    }

    const participantUsers = allOtherIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: [...allOtherIds] } },
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                profession: true,
                location: true,
              },
            },
          },
        })
      : [];

    const participantMap = new Map(participantUsers.map((u) => [u.id, u]));

    // Batch unread counts — single query with groupBy
    const unreadCounts = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        senderId: { not: userId },
        NOT: { readBy: { has: userId } },
      },
      _count: true,
    });

    const unreadMap = new Map(unreadCounts.map((u) => [u.conversationId, u._count]));

    const conversationsWithDetails = conversations.map((conv) => {
      const otherParticipantIds = conv.participants.filter(
        (id: string) => id !== userId,
      );
      return {
        id: conv.id,
        lastMessageAt: conv.lastMessageAt,
        lastMessage: (conv as any).lastMessage,
        participants: otherParticipantIds.map((pid: string) => participantMap.get(pid)).filter(Boolean),
        unreadCount: unreadMap.get(conv.id) ?? 0,
        latestMessage: conv.messages[0] ?? null,
      };
    });

    return success("Conversations retrieved", conversationsWithDetails);
  } catch (err) {
    return failure("Failed to fetch conversations", null, 500);
  }
}

/**
 * POST /api/messages/conversations
 * Create or get existing conversation
 */
export async function handleCreateConversation(req: Request): Promise<Response> {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return failure("Unauthorized", null, 401);
  }

  try {
    const body = (await req.json()) as any;
    const participantIds = body.participantIds;

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return failure("participantIds must be a non-empty array", null, 400);
    }

    // Add current user to participants
    const allParticipants = Array.from(new Set([userId, ...participantIds]));

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              hasEvery: allParticipants,
            },
          },
          {
            participants: {
              isEmpty: false,
            },
          },
        ],
      },
    });

    if (existingConversation) {
      return success("Conversation found", existingConversation);
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: allParticipants,
      },
    });

    return success("Conversation created", conversation, 201);
  } catch (err: any) {
    return failure("Failed to create conversation", err.message || null, 500);
  }
}
