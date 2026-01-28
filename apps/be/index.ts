import { serve } from "bun";
import { config } from "dotenv";
import { join } from "path";

import type { ServerWebSocket } from "bun";
import prisma from "@modheshwari/db";

// Load env first
config({ path: join(process.cwd(), "../../.env") });

// CORS
import { handleCors, withCorsHeaders } from "./utils/cors";

// utility functions
import { match } from "@modheshwari/utils/match";

import { isRateLimited } from "@modheshwari/utils/rate-limit";

// Auth
import { handleAdminLogin, handleAdminSignup } from "./routes/auth/admin";
import { handleFHLogin, handleFHSignup } from "./routes/auth/fh";
import { handleMemberLogin, handleMemberSignup } from "./routes/auth/fm";

import { handleGetMe } from "./routes/me";

// Family
import {
  handleCreateFamily,
  handleAddMember,
  handleListInvites,
  handleReviewInvite,
} from "./routes/families";
import { handleGetFamilyMembers } from "./routes/familyMembers";
import { handleFamilyTransfer } from "./routes/familyTransfer";

// Family Tree
import {
  handleGetFamilyTree,
  handleCreateRelationship,
  handleDeleteRelationship,
} from "./routes/familyTree";

// Search
import { handleSearch } from "./routes/search";

// Resource Requests
import {
  handleCreateResourceRequest,
  handleListResourceRequests,
  handleGetResourceRequest,
  handleReviewResourceRequest,
} from "./routes/resourceReq";

//Notifications
import {
  handleCreateNotification,
  handleListNotifications,
  handleMarkNotificationRead,
} from "./routes/notifications";

// Messages
import {
  handleGetConversations,
  handleCreateConversation,
  handleGetMessages,
  handleSearchUsersForChat,
  handleSendMessage,
  handleMarkMessagesRead,
} from "./routes/messages";
import { handleGetChat } from "./routes/chat";

// Admin endpoints
import { handleListAllRequests, handleUpdateEventStatus } from "./routes/admin";

// Status Update Requests
import {
  handleCreateStatusUpdateRequest,
  handleListStatusUpdateRequests,
  handleReviewStatusUpdateRequest,
} from "./routes/statusUpdate";

// Medical & Family Transfer
import {
  handleUpdateMedical,
  handleSearchByBloodGroup,
} from "./routes/medical";

// Events
import {
  handleCreateEvent,
  handleListEvents,
  handleGetEvent,
  handleRegisterForEvent,
  handleUnregisterFromEvent,
  handleGetEventRegistrations,
  handleApproveEvent,
} from "./routes/events";

// ------------------ Auth Route Table ------------------

const authRouteTable = [
  // Signup
  {
    path: "/api/signup/communityhead",
    method: "POST",
    handler: (r: Request) => handleAdminSignup(r, "COMMUNITY_HEAD"),
  },
  {
    path: "/api/signup/communitysubhead",
    method: "POST",
    handler: (r: Request) => handleAdminSignup(r, "COMMUNITY_SUBHEAD"),
  },
  {
    path: "/api/signup/gotrahead",
    method: "POST",
    handler: (r: Request) => handleAdminSignup(r, "GOTRA_HEAD"),
  },
  {
    path: "/api/signup/familyhead",
    method: "POST",
    handler: (r: Request) => handleFHSignup(r, "FAMILY_HEAD"),
  },
  {
    path: "/api/signup/member",
    method: "POST",
    handler: (r: Request) => handleMemberSignup(r),
  },

  // Login
  {
    path: "/api/login/communityhead",
    method: "POST",
    handler: (r: Request) => handleAdminLogin(r, "COMMUNITY_HEAD"),
  },
  {
    path: "/api/login/communitysubhead",
    method: "POST",
    handler: (r: Request) => handleAdminLogin(r, "COMMUNITY_SUBHEAD"),
  },
  {
    path: "/api/login/gotrahead",
    method: "POST",
    handler: (r: Request) => handleAdminLogin(r, "GOTRA_HEAD"),
  },
  {
    path: "/api/login/familyhead",
    method: "POST",
    handler: (r: Request) => handleFHLogin(r, "FAMILY_HEAD"),
  },
  {
    path: "/api/login/member",
    method: "POST",
    handler: (r: Request) => handleMemberLogin(r),
  },
];

//-------- WS Server --------
//TODO: move this logic to separate websocket server
type WSNotificationMessage = {
  type: "notification";
  notification: {
    id: string;
    title: string;
    body: string;
    createdAt: string;
    read: boolean;
  };
};

type WSData = {
  userId: string;
};

const userSockets = new Map<string, Set<ServerWebSocket<WSData>>>();

// Simple per-user rate limiter for websocket messages
const wsRateLimits = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 10_000; // 10s
const RATE_LIMIT_MAX = 25; // max messages per window per user

// Typing debounce timers: conversationId -> (userId -> timeoutId)
const TYPING_DEBOUNCE_MS = 3000;
const typingTimers = new Map<string, Map<string, number>>();

function checkAndIncrementWsRate(userId: string) {
  const now = Date.now();
  const state = wsRateLimits.get(userId);
  if (!state || now - state.windowStart > RATE_LIMIT_WINDOW_MS) {
    wsRateLimits.set(userId, { count: 1, windowStart: now });
    return true;
  }

  state.count += 1;
  if (state.count > RATE_LIMIT_MAX) return false;
  return true;
}

function addSocket(userId: string, ws: ServerWebSocket<WSData>) {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(ws);
}

function removeSocket(userId: string, ws: ServerWebSocket<WSData>) {
  const set = userSockets.get(userId);
  if (!set) return;

  set.delete(ws);
  if (set.size === 0) {
    userSockets.delete(userId);
  }
}

export function pushNotification(userId: string, notification: any) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  const payload = JSON.stringify({
    type: "notification",
    notification,
  });

  for (const ws of sockets) {
    ws.send(payload);
  }
}

// --- SERVER ---
const PORT = process.env.PORT ?? 3001;

const server = serve<WSData>({
  port: PORT,

  async fetch(req: Request) {
    try {
      if (req.headers.get("upgrade") === "websocket") {
        // Allow token via Authorization header OR ?token=... query param (browsers can't set ws headers)
        const urlForUpgrade = new URL(req.url);
        const tokenFromQuery = urlForUpgrade.searchParams.get("token");

        let authReq = req;
        if (tokenFromQuery && !req.headers.get("authorization")) {
          const headers = new Headers(req.headers);
          headers.set("authorization", `Bearer ${tokenFromQuery}`);
          authReq = new Request(req.url, { headers, method: req.method });
        }

        const meRes = await handleGetMe(authReq);
        if (meRes.status !== 200) {
          return new Response("Unauthorized", { status: 401 });
        }

        const me = (await meRes.json()) as { id: string };

        server.upgrade(req, {
          data: { userId: me.id } satisfies WSData,
        });

        return;
      }

      const url = new URL(req.url);
      const method = req.method.toUpperCase();

      console.log(`[${method}] ${url.pathname}`);

      // ------------------ CORS ------------------
      const corsPreflight = handleCors(req);
      if (corsPreflight) return corsPreflight;

      // ------------------ Global Rate-Limits ------------------

      // NOTE: treat isRateLimited(...) as returning boolean "limited"
      // All login routes (prevents brute-force)
      if (url.pathname.startsWith("/api/login") && method === "POST") {
        const limited = isRateLimited(req, {
          windowMs: 60000,
          max: 5,
        });
        if (limited) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "Too many requests" }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
      }

      // All signup routes (prevents mass account creation)
      if (url.pathname.startsWith("/api/signup") && method === "POST") {
        const limited = isRateLimited(req, {
          windowMs: 60000,
          max: 5,
        });
        if (limited) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "Too many requests" }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
      }

      // Search rate-limit (UI-friendly)
      if (url.pathname.startsWith("/api/search") && method === "GET") {
        const limited = isRateLimited(req, {
          windowMs: 10000,
          max: 20,
        });
        if (limited) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "Too many requests" }), {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
      }

      // ------------------ Health ------------------
      if (url.pathname === "/api/health" && method === "GET") {
        return withCorsHeaders(
          Response.json({ status: "ok" }, { status: 200 }),
        );
      }

      // ------------------ Auth ------------------
      const matchedAuth = authRouteTable.find(
        (row) => row.path === url.pathname && row.method === method,
      );

      if (matchedAuth) {
        return withCorsHeaders(await matchedAuth.handler(req));
      }

      // ------------------ Families ------------------

      if (url.pathname === "/api/families" && method === "POST") {
        return withCorsHeaders(await handleCreateFamily(req));
      }

      const mAddMember = match(url.pathname, "/api/families/:familyId/members");
      if (mAddMember && method === "POST") {
        const familyId = mAddMember.familyId;
        if (!familyId) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "familyId is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleAddMember(req, familyId));
      }

      const mListInvites = match(
        url.pathname,
        "/api/families/:familyId/invites",
      );
      if (mListInvites && method === "PATCH") {
        const familyId = mListInvites.familyId;
        if (!familyId) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "familyId is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleListInvites(req, familyId));
      }

      const mReviewInvite =
        match(
          url.pathname,
          "/api/families/:familyId/invites/:inviteId/:action",
        ) || match(url.pathname, "/api/families/:familyId/invites/:inviteId");

      if (mReviewInvite && method === "PATCH") {
        const familyId = mReviewInvite.familyId;
        const inviteId = mReviewInvite.inviteId;
        const action = mReviewInvite.action || "";

        if (!familyId || !inviteId) {
          return withCorsHeaders(
            new Response(
              JSON.stringify({ error: "familyId/inviteId required" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        return withCorsHeaders(
          await handleReviewInvite(req, familyId, inviteId, action),
        );
      }

      if (url.pathname === "/api/family/tree" && method === "GET") {
        return withCorsHeaders(await handleGetFamilyTree(req));
      }

      if (url.pathname === "/api/family/tree/relations" && method === "POST") {
        return withCorsHeaders(await handleCreateRelationship(req));
      }

      const mDeleteRelation = match(
        url.pathname,
        "/api/family/tree/relations/:id",
      );
      if (mDeleteRelation && method === "DELETE") {
        const id = mDeleteRelation.id;
        if (!id) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "id required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleDeleteRelationship(req, id));
      }

      // ------------------ Profile / Members ------------------

      if (url.pathname === "/api/me" && method === "GET") {
        return withCorsHeaders(await handleGetMe(req));
      }

      if (url.pathname.startsWith("/api/family/members") && method === "GET") {
        return withCorsHeaders(await handleGetFamilyMembers(req));
      }

      // ------------------ Search ------------------

      if (url.pathname.startsWith("/api/search") && method === "GET") {
        return withCorsHeaders(await handleSearch(req));
      }

      // ------------------ Resource Requests ------------------

      if (url.pathname === "/api/resource-requests" && method === "POST") {
        return withCorsHeaders(await handleCreateResourceRequest(req));
      }

      if (url.pathname === "/api/resource-requests" && method === "GET") {
        return withCorsHeaders(await handleListResourceRequests(req));
      }

      const mGetResource = match(url.pathname, "/api/resource-requests/:id");
      if (mGetResource && method === "GET") {
        const id = mGetResource.id;
        if (!id) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "id required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleGetResourceRequest(req, id));
      }

      const mReviewResource = match(
        url.pathname,
        "/api/resource-requests/:id/review",
      );
      if (mReviewResource && method === "POST") {
        const id = mReviewResource.id;
        if (!id) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "id required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleReviewResourceRequest(req, id));
      }

      // ------------------ Admin ------------------

      if (url.pathname === "/api/admin/requests" && method === "GET") {
        return withCorsHeaders(await handleListAllRequests(req));
      }

      const mAdminEvent = match(url.pathname, "/api/admin/event/:id/status");
      if (mAdminEvent && method === "POST") {
        const id = mAdminEvent.id;
        if (!id) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "id required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleUpdateEventStatus(req, id));
      }

      // ------------------ Notifications ------------------

      if (url.pathname === "/api/notifications" && method === "GET") {
        return withCorsHeaders(await handleListNotifications(req));
      }

      if (url.pathname === "/api/notifications" && method === "POST") {
        return withCorsHeaders(await handleCreateNotification(req));
      }

      // ------------------ Messages/Chat ------------------

      if (url.pathname === "/api/chat" && method === "GET") {
        return withCorsHeaders(await handleGetChat(req));
      }

      if (url.pathname === "/api/messages/conversations" && method === "GET") {
        return withCorsHeaders(await handleGetConversations(req));
      }

      if (url.pathname === "/api/messages/conversations" && method === "POST") {
        return withCorsHeaders(await handleCreateConversation(req));
      }

      const mGetMessages = match(
        url.pathname,
        "/api/messages/conversations/:conversationId/messages",
      );
      if (mGetMessages && method === "GET") {
        const conversationId = mGetMessages.conversationId;
        if (!conversationId) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "conversationId required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleGetMessages(req, conversationId));
      }

      if (url.pathname === "/api/messages" && method === "POST") {
        return withCorsHeaders(await handleSendMessage(req));
      }

      if (url.pathname === "/api/messages/read" && method === "POST") {
        return withCorsHeaders(await handleMarkMessagesRead(req));
      }

      if (url.pathname === "/api/messages/users/search" && method === "GET") {
        return withCorsHeaders(await handleSearchUsersForChat(req));
      }

      // ------------------ Status Update Requests ------------------

      if (url.pathname === "/api/status-update-requests" && method === "POST") {
        return withCorsHeaders(await handleCreateStatusUpdateRequest(req));
      }

      if (url.pathname === "/api/status-update-requests" && method === "GET") {
        return withCorsHeaders(await handleListStatusUpdateRequests(req));
      }

      const mReviewStatus = match(
        url.pathname,
        "/api/status-update-requests/:id/review",
      );
      if (mReviewStatus && method === "POST") {
        const id = mReviewStatus.id;
        if (!id) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "id required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleReviewStatusUpdateRequest(req, id));
      }

      // ------------------ Medical & Transfer ------------------

      if (url.pathname === "/api/profile/medical" && method === "PATCH") {
        return withCorsHeaders(await handleUpdateMedical(req));
      }

      if (url.pathname === "/api/family/transfer" && method === "POST") {
        return withCorsHeaders(await handleFamilyTransfer(req));
      }

      // ------------------ Search ------------------

      if (url.pathname.startsWith("/api/search") && method === "GET") {
        return withCorsHeaders(await handleSearch(req));
      }

      // ------------------ Medical Search ------------------

      if (url.pathname === "/api/medical/search" && method === "GET") {
        return withCorsHeaders(await handleSearchByBloodGroup(req));
      }

      // ------------------ Resource Requests ------------------

      if (url.pathname === "/api/resource-requests" && method === "POST") {
        return withCorsHeaders(await handleCreateResourceRequest(req));
      }

      // ------------------ Events ------------------

      if (url.pathname === "/api/events" && method === "POST") {
        return withCorsHeaders(await handleCreateEvent(req));
      }

      if (url.pathname === "/api/events" && method === "GET") {
        return withCorsHeaders(await handleListEvents(req));
      }

      const mEvent = match(url.pathname, "/api/events/:id");
      if (mEvent && method === "GET") {
        const id = mEvent.id;
        if (!id) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "id required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleGetEvent(req, id));
      }

      const mEventRegister = match(url.pathname, "/api/events/:id/register");
      if (mEventRegister && method === "POST") {
        const id = mEventRegister.id;
        if (!id) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "id required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleRegisterForEvent(req, id));
      }

      if (mEventRegister && method === "DELETE") {
        const id = mEventRegister.id;
        if (!id) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "id required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleUnregisterFromEvent(req, id));
      }

      const mEventRegistrations = match(
        url.pathname,
        "/api/events/:id/registrations",
      );
      if (mEventRegistrations && method === "GET") {
        const id = mEventRegistrations.id;
        if (!id) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "id required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleGetEventRegistrations(req, id));
      }

      const mEventApprove = match(url.pathname, "/api/events/:id/approve");
      if (mEventApprove && method === "POST") {
        const id = mEventApprove.id;
        if (!id) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "id required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleApproveEvent(req, id));
      }

      // ------------------ 404 ------------------

      return withCorsHeaders(
        new Response(JSON.stringify({ error: "Endpoint not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      );
    } catch (err) {
      console.error(err);
      return withCorsHeaders(
        new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
        }),
      );
    }
  },

  websocket: {
    open(ws) {
      addSocket(ws.data.userId, ws);
      console.log("WS connected:", ws.data.userId);
    },

    async message(ws, message) {
      try {
        const raw =
          typeof message === "string"
            ? message
            : new TextDecoder().decode(message as Uint8Array);
        const data = JSON.parse(raw || "{}");

        // Rate-limit per-sender to avoid spam/flood
        const senderIdForRate = ws?.data?.userId;
        if (!senderIdForRate || !checkAndIncrementWsRate(senderIdForRate)) {
          try {
            ws.send(JSON.stringify({ type: "error", message: "rate_limited" }));
          } catch {}
          return;
        }

        if (data?.type === "chat_message") {
          const { conversationId, content } = data;
          const senderId = ws.data.userId;
          if (!conversationId || !content) {
            ws.send(JSON.stringify({ type: "ack", status: "error", message: "invalid_payload", clientId: data?.clientId }));
            return;
          }

          // Validate content length
          if (typeof content !== "string" || content.length === 0 || content.length > 5000) {
            ws.send(JSON.stringify({ type: "ack", status: "error", message: "invalid_content", clientId: data?.clientId }));
            return;
          }

          // Verify conversation exists and sender is a participant
          const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
          });
          if (!conversation || !conversation.participants.includes(senderId)) {
            ws.send(JSON.stringify({ type: "error", message: "Not a participant" }));
            return;
          }

          const user = await prisma.user.findUnique({
            where: { id: senderId },
            select: { name: true },
          });

          // Persist message
          const created = await prisma.message.create({
            data: {
              conversationId,
              senderId,
              senderName: user?.name ?? "Unknown",
              content,
            },
          });

          // Update conversation metadata
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessage: content.slice(0, 512), lastMessageAt: new Date() },
          });

          const payload = {
            type: "chat_message",
            message: {
              id: created.id,
              conversationId,
              senderId,
              senderName: created.senderName,
              content: created.content,
              createdAt: created.createdAt,
            },
          };

          // Send acknowledgement to sender
          try {
            ws.send(
              JSON.stringify({
                type: "ack",
                status: "ok",
                conversationId,
                messageId: created.id,
                createdAt: created.createdAt,
                clientId: data?.clientId,
              }),
            );
          } catch (err) {
            console.error("Failed to send ack", err);
          }

          // Broadcast to all other participants who are connected (exclude sender)
          for (const participantId of conversation.participants) {
            if (participantId === senderId) continue;
            const sockets = userSockets.get(participantId);
            if (!sockets) continue;
            for (const s of sockets) {
              try {
                s.send(JSON.stringify(payload));
              } catch (err) {
                console.error("Failed to send WS payload", err);
              }
            }
          }
        } else if (data?.type === "typing") {
          // typing indicator with debounce: broadcast to other participants in a conversation
          const { conversationId, typing } = data;
          const senderId = ws.data.userId;
          if (!conversationId) return;
          const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
          if (!conversation) return;

          const notifyTyping = (isTyping: boolean) => {
            const payload = { type: "typing", conversationId, userId: senderId, typing: !!isTyping };
            for (const participantId of conversation.participants) {
              if (participantId === senderId) continue;
              const sockets = userSockets.get(participantId);
              if (!sockets) continue;
              for (const s of sockets) {
                try {
                  s.send(JSON.stringify(payload));
                } catch (err) {
                  console.error("Failed to send typing payload", err);
                }
              }
            }
          };

          // Always notify on typing=true immediately
          if (typing) {
            notifyTyping(true);

            // clear existing timer and set a debounce to send typing=false
            let convMap = typingTimers.get(conversationId);
            if (!convMap) {
              convMap = new Map<string, number>();
              typingTimers.set(conversationId, convMap);
            }
            const prev = convMap.get(senderId);
            if (prev) clearTimeout(prev);
            const tid = setTimeout(() => {
              notifyTyping(false);
              const cm = typingTimers.get(conversationId);
              cm?.delete(senderId);
            }, TYPING_DEBOUNCE_MS) as unknown as number;
            convMap.set(senderId, tid);
          } else {
            // explicit stop typing: cancel timer and notify
            const convMap = typingTimers.get(conversationId);
            const prev = convMap?.get(senderId);
            if (prev) {
              clearTimeout(prev);
              convMap?.delete(senderId);
            }
            notifyTyping(false);
          }
        } else if (data?.type === "read") {
          // read receipt: update message.readBy and broadcast receipt
          const { conversationId, messageId } = data;
          const senderId = ws.data.userId;
          if (!conversationId || !messageId) {
            ws.send(JSON.stringify({ type: "ack", status: "error", message: "invalid_payload" }));
            return;
          }

          try {
            const msg = await prisma.message.findUnique({ where: { id: messageId } });
            if (!msg) return;
            if (!msg.readBy.includes(senderId)) {
              await prisma.message.update({ where: { id: messageId }, data: { readBy: { push: senderId } } });
            }

            const receipt = { type: "read_receipt", conversationId, messageId, userId: senderId };
            const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
            if (!conversation) return;
            for (const participantId of conversation.participants) {
              if (participantId === senderId) continue;
              const sockets = userSockets.get(participantId);
              if (!sockets) continue;
              for (const s of sockets) {
                try {
                  s.send(JSON.stringify(receipt));
                } catch (err) {
                  console.error("Failed to send read receipt", err);
                }
              }
            }

            // ack to sender
            try {
              ws.send(JSON.stringify({ type: "ack", status: "ok", conversationId, messageId }));
            } catch {}
          } catch (err) {
            console.error("Failed to process read receipt", err);
          }
        }
      } catch (err) {
        console.error("WS message handler error:", err);
      }
    },

    close(ws) {
      removeSocket(ws.data.userId, ws);
      console.log("WS disconnected:", ws.data.userId);
    },
  },
});

console.log(`Server running on http://localhost:${PORT}`);

process.on("SIGINT", () => {
  console.log("Shutting down...");
  process.exit(0);
});

await new Promise(() => {});
