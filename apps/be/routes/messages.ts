import prisma from "@modheshwari/db";
import { verifyJWT } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";
import { z } from "zod";

// Helper to extract userId from JWT
/**
 * Performs get user id from request operation.
 * @param {Request} req - Description of req
 * @returns {string} Description of return value
 */
function getUserIdFromRequest(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return null;

  const decoded = verifyJWT(token);
  const userId = decoded?.id || decoded?.userId;

  return typeof userId === "string" ? userId : null;
}

// Get all conversations for the current user
/**
 * Performs handle get conversations operation.
 * @param {Request} req - Description of req
 * @returns {Promise<Response>} Description of return value
 */
export async function handleGetConversations(req: Request) {
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
    console.error("Failed to fetch conversations:", err);
    return failure("Failed to fetch conversations", null, 500);
  }
}

// Get or create a conversation
/**
 * Performs handle create conversation operation.
 * @param {Request} req - Description of req
 * @returns {Promise<Response>} Description of return value
 */
export async function handleCreateConversation(req: Request) {
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
    console.error("Failed to create conversation:", err);
    return failure("Failed to create conversation", err.message || null, 500);
  }
}

// Get messages for a conversation
/**
 * Performs handle get messages operation.
 * @param {Request} req - Description of req
 * @param {string} conversationId - Description of conversationId
 * @returns {Promise<Response>} Description of return value
 */
export async function handleGetMessages(req: Request, conversationId: string) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return failure("Unauthorized", null, 401);
  }

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const before = url.searchParams.get("before"); // Message ID for pagination

  try {
    // Verify user is part of conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          has: userId,
        },
      },
    });

    if (!conversation) {
      return failure("Conversation not found", null, 404);
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(before && {
          createdAt: {
            lt: (
              await prisma.message.findUnique({
                where: { id: before },
                select: { createdAt: true },
              })
            )?.createdAt,
          },
        }),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return success("Messages retrieved", messages.reverse());
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    return failure("Failed to fetch messages", null, 500);
  }
}

// Search users to start a conversation with
/**
 * Performs handle search users for chat operation.
 * @param {Request} req - Description of req
 * @returns {Promise<Response>} Description of return value
 */
export async function handleSearchUsersForChat(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q") || "";

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
        status: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile: {
          select: {
            profession: true,
            location: true,
          },
        },
      },
      take: 20,
    });

    return success("Users found", users);
  } catch (err) {
    console.error("Failed to search users:", err);
    return failure("Failed to search users", null, 500);
  }
}

// Send a message
/**
 * Performs handle send message operation.
 * @param {Request} req - Description of req
 * @returns {Promise<Response>} Description of return value
 */
export async function handleSendMessage(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return failure("Unauthorized", null, 401);
  }

  try {
    const body = await req.json();
    const { conversationId, content } = body as {
      conversationId?: string;
      content?: string;
    };

    if (!conversationId || !content) {
      return failure("Missing required fields", null, 400);
    }

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          has: userId,
        },
      },
    });

    if (!conversation) {
      return failure("Conversation not found", null, 404);
    }

    // Get sender's name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!user) {
      return failure("User not found", null, 404);
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        senderName: user.name,
        content,
      },
    });

    // Update conversation's last message timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return success("Message sent", message, 201);
  } catch (err) {
    console.error("Failed to send message:", err);
    return failure("Failed to send message", null, 500);
  }
}

// Mark messages as read
/**
 * Performs handle mark messages read operation.
 * @param {Request} req - Description of req
 * @returns {Promise<Response>} Description of return value
 */
export async function handleMarkMessagesRead(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return failure("Unauthorized", null, 401);
  }

  try {
    const body = await req.json();
    const { conversationId } = body as { conversationId?: string };

    if (!conversationId) {
      return failure("Missing conversationId", null, 400);
    }

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          has: userId,
        },
      },
    });

    if (!conversation) {
      return failure("Conversation not found", null, 404);
    }

    // Update all unread messages in the conversation for this user
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
    });

    for (const message of messages) {
      if (!message.readBy.includes(userId)) {
        await prisma.message.update({
          where: { id: message.id },
          data: {
            readBy: {
              push: userId,
            },
          },
        });
      }
    }

    return success("Messages marked as read");
  } catch (err) {
    console.error("Failed to mark messages as read:", err);
    return failure("Failed to mark messages as read", null, 500);
  }
}
