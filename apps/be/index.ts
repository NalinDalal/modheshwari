// apps/be/index.ts
// i guess we should first write up the signup logic for family head
// then write up logic for login like: userid+pwd, then if the endpoint is specifically like: /api/login/FamilyHead
// then check if userid+pwd with role=familyhead check with db
// if true then log logged in else log you are not a family head
// index.ts lightweight (only routing, not logic).

import { serve } from "bun";
import { config } from "dotenv";
import { join } from "path";

//  Load .env from project root before anything else
// (so utils like jwt.ts can access process.env.JWT_SECRET)
config({ path: join(process.cwd(), "../../.env") });
import { handleAdminLogin, handleAdminSignup } from "./routes/auth-admin";
import { handleFHLogin } from "./routes/auth-family-head/login";
import { handleFHSignup } from "./routes/auth-family-head/signup";
import { handleMemberLogin } from "./routes/auth-family-mem/login";
import { handleMemberSignup } from "./routes/auth-family-mem/signup";
import {
  handleCreateFamily,
  handleAddMember,
  handleListInvites,
  handleReviewInvite,
} from "./routes/families";
import { handleGetMe } from "./routes/me";
import { handleUpdateMemberStatus } from "./routes/family-member-status";
import { handleGetFamilyMembers } from "./routes/family-members";
import { handleCors, withCorsHeaders } from "./utils/cors";
import { handleSearch } from "./routes/search";
import {
  handleCreateResourceRequest,
  handleListResourceRequests,
  handleGetResourceRequest,
  handleReviewResourceRequest,
  handleListNotifications,
} from "./routes/resource-request";
import { handleCreateNotification } from "./routes/notifications";
import { handleListAllRequests, handleUpdateEventStatus } from "./routes/admin";

// --- Lightweight routing layer using Bun's native server ---
const server = serve({
  port: 3001,
  async fetch(req) {
    try {
      const url = new URL(req.url);
      const method = req.method.toUpperCase();

      // Slightly improved request logging
      console.log(`[${method}] ${url.pathname}`);

      // --- Handle CORS preflight ---
      const corsRes = handleCors(req);
      if (corsRes) return corsRes;

      // Lightweight healthcheck
      if (url.pathname === "/api/health" && method === "GET") {
        return withCorsHeaders(
          Response.json({ status: "ok" }, { status: 200 }),
        );
      }

      // --- Centralized auth/signup/login route table ---
      const authRouteTable = [
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

      const matchedAuth = authRouteTable.find(
        (entry) => entry.path === url.pathname && entry.method === method,
      );

      if (matchedAuth) {
        return withCorsHeaders(await matchedAuth.handler(req));
      }

      // Small path pattern matcher to extract params like :familyId
      function match(path: string, pattern: string) {
        const keys: string[] = [];
        const regexStr =
          "^" +
          pattern.replace(/:[^/]+/g, (m) => {
            keys.push(m.slice(1));
            return "([^/]+)";
          }) +
          "$";
        const m = path.match(new RegExp(regexStr));
        if (!m) return null;
        const params: Record<string, string> = {};
        keys.forEach((k, i) => (params[k] = m[i + 1] ?? ""));
        return params;
      }

      // --- Create family (authenticated user becomes head) ---
      if (url.pathname === "/api/families" && method === "POST") {
        return withCorsHeaders(await handleCreateFamily(req));
      }

      // --- Add member to family ---
      const mAddMember = match(url.pathname, "/api/families/:familyId/members");
      if (mAddMember && method === "POST") {
        return withCorsHeaders(await handleAddMember(req, mAddMember.familyId));
      }

      // --- List invites for family (family head) ---
      const mListInvites = match(
        url.pathname,
        "/api/families/:familyId/invites",
      );
      if (mListInvites && method === "PATCH") {
        return withCorsHeaders(
          await handleListInvites(req, mListInvites.familyId),
        );
      }

      // --- Review invite (approve/reject) ---
      const mReviewInvite =
        match(
          url.pathname,
          "/api/families/:familyId/invites/:inviteId/:action",
        ) || match(url.pathname, "/api/families/:familyId/invites/:inviteId");
      if (mReviewInvite && method === "PATCH") {
        const familyId = (mReviewInvite as any).familyId;
        const inviteId = (mReviewInvite as any).inviteId;
        const action = (mReviewInvite as any).action || "";
        return withCorsHeaders(
          await handleReviewInvite(req, familyId, inviteId, action),
        );
      }

      // --- Profile ---
      if (url.pathname === "/api/me" && method === "GET")
        return withCorsHeaders(await handleGetMe(req));

      // --- Update member status (family head only) ---
      if (
        url.pathname.startsWith("/api/family/members") &&
        url.pathname.endsWith("/status") &&
        method === "PATCH"
      ) {
        return withCorsHeaders(await handleUpdateMemberStatus(req));
      }

      // --- Get family members ---
      if (url.pathname.startsWith("/api/family/members") && method === "GET") {
        return withCorsHeaders(await handleGetFamilyMembers(req));
      }

      // --- Search Users ---
      if (url.pathname.startsWith("/api/search") && method === "GET") {
        return await handleSearch(req);
      }

      // --- Resource Requests ---
      if (url.pathname === "/api/resource-requests" && method === "POST") {
        return withCorsHeaders(await handleCreateResourceRequest(req));
      }

      if (url.pathname === "/api/resource-requests" && method === "GET") {
        return withCorsHeaders(await handleListResourceRequests(req));
      }

      const mGetResource = match(url.pathname, "/api/resource-requests/:id");
      if (mGetResource && method === "GET") {
        return withCorsHeaders(
          await handleGetResourceRequest(req, (mGetResource as any).id),
        );
      }

      const mReviewResource = match(
        url.pathname,
        "/api/resource-requests/:id/review",
      );
      if (mReviewResource && method === "POST") {
        return withCorsHeaders(
          await handleReviewResourceRequest(req, (mReviewResource as any).id),
        );
      }

      // --- Admin endpoints ---
      // basically list all of request, admin can approve/reject/request-changes
      if (url.pathname === "/api/admin/requests" && method === "GET") {
        return withCorsHeaders(await handleListAllRequests(req));
      }

      const mAdminEvent = match(url.pathname, "/api/admin/event/:id/status");
      if (mAdminEvent && method === "POST") {
        return withCorsHeaders(
          await handleUpdateEventStatus(req, (mAdminEvent as any).id),
        );
      }

      // --- Notifications ---
      if (url.pathname === "/api/notifications" && method === "GET") {
        return withCorsHeaders(await handleListNotifications(req));
      }

      // --- Notifications from Admins ---
      // ping all of users
      if (url.pathname === "/api/notifications" && method === "POST") {
        return withCorsHeaders(await handleCreateNotification(req));
      }

      // --- Default 404 handler ---
      return withCorsHeaders(
        new Response(JSON.stringify({ error: "Endpoint not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      );
    } catch (err) {
      console.error(" Unhandled Error:", err);
      return withCorsHeaders(
        new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
  },
});

console.log(` Server started on http://localhost:${server.port}!`);

// Keep process alive
await new Promise(() => {});
