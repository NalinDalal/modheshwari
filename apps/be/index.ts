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

// --- Lightweight routing layer using Bun's native server ---
const server = serve({
  port: 3001,
  async fetch(req) {
    try {
      const url = new URL(req.url);
      const method = req.method.toUpperCase();

      // --- Signup for Family Head ---
      if (url.pathname === "/api/signup/familyhead" && method === "POST") {
        return handleFHSignup(req, "FAMILY_HEAD");
      }

      // --- Login for Family Head ---
      if (url.pathname === "/api/login/familyhead" && method === "POST") {
        return handleFHLogin(req, "FAMILY_HEAD");
      }

      // --- Signup for Family Member ---
      if (url.pathname === "/api/signup/member" && method === "POST") {
        return handleMemberSignup(req);
      }

      // --- Login for Family Member ---
      if (url.pathname === "/api/login/member" && method === "POST") {
        return handleMemberLogin(req);
      }

      // --- Create family (authenticated user becomes head) ---
      if (url.pathname === "/api/families" && method === "POST") {
        return handleCreateFamily(req);
      }

      // --- Add member to family ---
      if (
        url.pathname.startsWith("/api/families/") &&
        url.pathname.endsWith("/members") &&
        method === "POST"
      ) {
        // extract familyId from path: /api/families/:id/members
        const parts = url.pathname.split("/").filter(Boolean);
        // parts -> ["api","families",":id","members"]
        const familyId = parts[2];
        return handleAddMember(req, familyId);
      }

      // --- List invites for family (family head) ---
      if (
        url.pathname.startsWith("/api/families/") &&
        url.pathname.endsWith("/invites") &&
        method === "GET"
      ) {
        const parts = url.pathname.split("/").filter(Boolean);
        // parts -> ["api","families",":id","invites"]
        const familyId = parts[2];
        return handleListInvites(req, familyId);
      }

      // --- Review invite (approve/reject) ---
      if (
        url.pathname.startsWith("/api/families/") &&
        url.pathname.includes("/invites/") &&
        method === "PATCH"
      ) {
        // path example: /api/families/:id/invites/:inviteId/approve
        const parts = url.pathname.split("/").filter(Boolean);
        // parts -> ["api","families",":id","invites",":inviteId",":action"]
        const familyId = parts[2];
        const inviteId = parts[4];
        const action = parts[5] || "";
        return handleReviewInvite(req, familyId, inviteId, action);
      }

      // --- Default 404 handler ---
      return new Response(JSON.stringify({ error: "Endpoint not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error(" Unhandled Error:", err);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});

console.log(` Server started on http://localhost:${server.port}!`);

// Keep process alive
await new Promise(() => {});
