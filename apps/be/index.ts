import { serve } from "bun";
import { config } from "dotenv";
import { join } from "path";

// Load env first
config({ path: join(process.cwd(), "../../.env") });
// CORS
import { handleCors, withCorsHeaders } from "./utils/cors";

// Rate limiting
import { isRateLimited } from "@modheshwari/utils/rate-limit";
// Auth
import { handleAdminLogin, handleAdminSignup } from "./routes/auth-admin";
import { handleFHLogin, handleFHSignup } from "./routes/auth-fh";
import { handleMemberLogin, handleMemberSignup } from "./routes/auth-fm";

// Family
import {
  handleCreateFamily,
  handleAddMember,
  handleListInvites,
  handleReviewInvite,
} from "./routes/families";
import { handleGetMe } from "./routes/me";
import { handleGetFamilyMembers } from "./routes/familyMembers";

// Search
import { handleSearch } from "./routes/search";

// Resource Requests
import {
  handleCreateResourceRequest,
  handleListResourceRequests,
  handleGetResourceRequest,
  handleReviewResourceRequest,
  handleListNotifications,
} from "./routes/resourceReq";
import { handleCreateNotification } from "./routes/notifications";

// Admin endpoints
import { handleListAllRequests, handleUpdateEventStatus } from "./routes/admin";

// Status Update Requests
import {
  handleCreateStatusUpdateRequest,
  handleListStatusUpdateRequests,
  handleReviewStatusUpdateRequest,
} from "./routes/status-update-request";

// Medical & Family Transfer
import {
  handleUpdateMedical,
  handleSearchByBloodGroup,
} from "./routes/medical";
import { handleFamilyTransfer } from "./routes/familyTransfer";
import { match } from "@modheshwari/utils/match";

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

// -----------------------------------------------------
// ------------------ SERVER LOGIC ---------------------
// -----------------------------------------------------

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

      // ------------------ 404 ------------------

      return withCorsHeaders(
        new Response(JSON.stringify({ error: "Endpoint not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      );
    } catch (err) {
      console.error("Unhandled Error:", err);

      return withCorsHeaders(
        new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
  },
});

console.log(`Server running at http://localhost:${server.port}`);

await new Promise(() => {});
