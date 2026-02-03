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

    // Get participant details
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantIds = conv.participants.filter(
          (id: string) => id !== userId,
        );
        const participants = await prisma.user.findMany({
          where: {
            id: {
              in: otherParticipantIds,
            },
          },
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
        });

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: {
              not: userId,
            },
            readBy: {
              hasEvery: [userId],
            },
          },
        });

        return {
          ...conv,
          participants,
          unreadCount,
        };
      }),
    );

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
