import { serve } from "bun";
import { config } from "dotenv";
import { join } from "path";

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

import { handleGetMe, handleUpdateMe } from "./routes/me";
import { handleGetNearbyUsers } from "./routes/nearby";

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

// Notification Read Tracking
import {
  handleMarkAsRead,
  handleMarkMultipleAsRead,
  handleMarkAllAsRead,
  handleGetDeliveryStatus,
} from "./routes/notificationRead";

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
import {
  handleChangeUserRole,
  handleListUsers,
  handleGetRoleChangePermissions,
  handleGetUserDetails,
} from "./routes/adminRoleChange";

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

// --- SERVER ---
const PORT = process.env.PORT ?? 3001;

const server = serve({
  port: PORT,

  async fetch(req: Request) {
    try {
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

      if (url.pathname === "/api/me" && method === "PUT") {
        return withCorsHeaders(await handleUpdateMe(req));
      }

      if (url.pathname === "/api/users/nearby" && method === "GET") {
        return withCorsHeaders(await handleGetNearbyUsers(req));
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

      // Admin - User Management
      if (url.pathname === "/api/admin/users" && method === "GET") {
        return withCorsHeaders(await handleListUsers(req));
      }

      const mAdminUserDetails = match(url.pathname, "/api/admin/users/:id");
      if (mAdminUserDetails && method === "GET") {
        const id = mAdminUserDetails.id;
        if (!id) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "id required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleGetUserDetails(req, id));
      }

      const mAdminChangeRole = match(url.pathname, "/api/admin/users/:id/role");
      if (mAdminChangeRole && method === "PATCH") {
        const id = mAdminChangeRole.id;
        if (!id) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "id required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleChangeUserRole(req, id));
      }

      if (
        url.pathname === "/api/admin/role-change-permissions" &&
        method === "GET"
      ) {
        return withCorsHeaders(await handleGetRoleChangePermissions(req));
      }

      // ------------------ Notifications ------------------

      if (url.pathname === "/api/notifications" && method === "GET") {
        return withCorsHeaders(await handleListNotifications(req));
      }

      if (url.pathname === "/api/notifications" && method === "POST") {
        return withCorsHeaders(await handleCreateNotification(req));
      }

      // Mark notification as read
      const mMarkAsRead = match(url.pathname, "/api/notifications/:id/read");
      if (mMarkAsRead && method === "POST") {
        const id = mMarkAsRead.id as string;
        return withCorsHeaders(await handleMarkAsRead(req, id));
      }

      // Mark multiple notifications as read
      if (url.pathname === "/api/notifications/read-multiple" && method === "POST") {
        return withCorsHeaders(await handleMarkMultipleAsRead(req));
      }

      // Mark all notifications as read
      if (url.pathname === "/api/notifications/read-all" && method === "POST") {
        return withCorsHeaders(await handleMarkAllAsRead(req));
      }

      // Get delivery status
      const mDeliveryStatus = match(url.pathname, "/api/notifications/:id/delivery-status");
      if (mDeliveryStatus && method === "GET") {
        const id = mDeliveryStatus.id as string;
        return withCorsHeaders(await handleGetDeliveryStatus(req, id));
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

});

console.log(`Server running on http://localhost:${PORT}`);

process.on("SIGINT", () => {
  console.log("Shutting down...");
  process.exit(0);
});

await new Promise(() => {});
