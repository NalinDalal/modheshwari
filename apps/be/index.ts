import { serve } from "bun";
import { config } from "dotenv";
import { join } from "path";

// Load env first
config({ path: join(process.cwd(), "../../.env") });

// CORS

// utility functions
import { match } from "@modheshwari/utils/match";
import { isRateLimited } from "@modheshwari/utils/rate-limit";

import { handleCors, withCorsHeaders } from "./utils/cors";

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

const staticRouteTable = [
  // Health
  {
    path: "/api/health",
    method: "GET",
    handler: () => Response.json({ status: "ok" }, { status: 200 }),
  },

  // Families
  {
    path: "/api/families",
    method: "POST",
    handler: (r: Request) => handleCreateFamily(r),
  },
  {
    path: "/api/family/tree",
    method: "GET",
    handler: (r: Request) => handleGetFamilyTree(r),
  },
  {
    path: "/api/family/tree/relations",
    method: "POST",
    handler: (r: Request) => handleCreateRelationship(r),
  },

  // Profile / Members
  {
    path: "/api/me",
    method: "GET",
    handler: (r: Request) => handleGetMe(r),
  },
  {
    path: "/api/me",
    method: "PUT",
    handler: (r: Request) => handleUpdateMe(r),
  },
  {
    path: "/api/users/nearby",
    method: "GET",
    handler: (r: Request) => handleGetNearbyUsers(r),
  },
  {
    path: "/api/family/members",
    method: "GET",
    handler: (r: Request) => handleGetFamilyMembers(r),
  },

  // Search
  {
    path: "/api/search",
    method: "GET",
    handler: (r: Request) => handleSearch(r),
  },

  // Resource Requests
  {
    path: "/api/resource-requests",
    method: "POST",
    handler: (r: Request) => handleCreateResourceRequest(r),
  },
  {
    path: "/api/resource-requests",
    method: "GET",
    handler: (r: Request) => handleListResourceRequests(r),
  },

  // Admin
  {
    path: "/api/admin/requests",
    method: "GET",
    handler: (r: Request) => handleListAllRequests(r),
  },
  {
    path: "/api/admin/users",
    method: "GET",
    handler: (r: Request) => handleListUsers(r),
  },
  {
    path: "/api/admin/role-change-permissions",
    method: "GET",
    handler: (r: Request) => handleGetRoleChangePermissions(r),
  },

  // Notifications
  {
    path: "/api/notifications",
    method: "GET",
    handler: (r: Request) => handleListNotifications(r),
  },
  {
    path: "/api/notifications",
    method: "POST",
    handler: (r: Request) => handleCreateNotification(r),
  },
  {
    path: "/api/notifications/read-multiple",
    method: "POST",
    handler: (r: Request) => handleMarkMultipleAsRead(r),
  },
  {
    path: "/api/notifications/read-all",
    method: "POST",
    handler: (r: Request) => handleMarkAllAsRead(r),
  },

  // Messages
  {
    path: "/api/chat",
    method: "GET",
    handler: (r: Request) => handleGetChat(r),
  },
  {
    path: "/api/messages/conversations",
    method: "GET",
    handler: (r: Request) => handleGetConversations(r),
  },
  {
    path: "/api/messages/conversations",
    method: "POST",
    handler: (r: Request) => handleCreateConversation(r),
  },
  {
    path: "/api/messages",
    method: "POST",
    handler: (r: Request) => handleSendMessage(r),
  },
  {
    path: "/api/messages/read",
    method: "POST",
    handler: (r: Request) => handleMarkMessagesRead(r),
  },
  {
    path: "/api/messages/users/search",
    method: "GET",
    handler: (r: Request) => handleSearchUsersForChat(r),
  },

  // Status Update Requests
  {
    path: "/api/status-update-requests",
    method: "POST",
    handler: (r: Request) => handleCreateStatusUpdateRequest(r),
  },
  {
    path: "/api/status-update-requests",
    method: "GET",
    handler: (r: Request) => handleListStatusUpdateRequests(r),
  },

  // Medical & Transfer
  {
    path: "/api/profile/medical",
    method: "PATCH",
    handler: (r: Request) => handleUpdateMedical(r),
  },
  {
    path: "/api/family/transfer",
    method: "POST",
    handler: (r: Request) => handleFamilyTransfer(r),
  },
  {
    path: "/api/medical/search",
    method: "GET",
    handler: (r: Request) => handleSearchByBloodGroup(r),
  },

  // Events
  {
    path: "/api/events",
    method: "POST",
    handler: (r: Request) => handleCreateEvent(r),
  },
  {
    path: "/api/events",
    method: "GET",
    handler: (r: Request) => handleListEvents(r),
  },
] as const;

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

      // ------------------ Auth ------------------
      const matchedAuth = authRouteTable.find(
        (row) => row.path === url.pathname && row.method === method,
      );

      if (matchedAuth) {
        return withCorsHeaders(await matchedAuth.handler(req));
      }

      // ------------------ Static routes ------------------
      const matchedStatic = staticRouteTable.find(
        (row) => row.path === url.pathname && row.method === method,
      );

      if (matchedStatic) {
        return withCorsHeaders(await matchedStatic.handler(req));
      }

      // ------------------ Families ------------------

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

      // Mark notification as read
      const mMarkAsRead = match(url.pathname, "/api/notifications/:id/read");
      if (mMarkAsRead && method === "POST") {
        const id = mMarkAsRead.id;
        if (!id) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "id required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleMarkAsRead(req, id));
      }

      // Get delivery status
      const mDeliveryStatus = match(url.pathname, "/api/notifications/:id/delivery-status");
      if (mDeliveryStatus && method === "GET") {
        const id = mDeliveryStatus.id;
        if (!id) {
          return withCorsHeaders(
            new Response(JSON.stringify({ error: "id required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return withCorsHeaders(await handleGetDeliveryStatus(req, id));
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
