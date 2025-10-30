// apps/be/index.ts
// i guess we should first write up the signup logic for family head
// then write up logic for login like: userid+pwd, then if the endpoint is specifically like: /api/login/FamilyHead
// then check if userid+pwd with role=familyhead check with db
// if true then log logged in else log you are not a family head
//index.ts lightweight (only routing, not logic).

import { serve } from "bun";
import { handleSignup } from "./routes/auth-family-head/signup";
import { handleLogin } from "./routes/auth-family-head/login";
console.log("Server started on localhost:3001!");

serve({
  port: 3001,
  async fetch(req) {
    try {
      const url = new URL(req.url);
      const method = req.method.toUpperCase();

      // --- Signup for family head ---
      if (url.pathname === "/api/signup/familyhead" && req.method === "POST") {
        return handleSignup(req, "FAMILY_HEAD");
      }

      // --- Login for FamilyHead ---
      if (url.pathname === "/api/login/familyhead" && req.method === "POST") {
        return handleLogin(req, "FAMILY_HEAD");
      }

      // --- Default 404 ---
      return new Response(JSON.stringify({ error: "Endpoint not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Unhandled Error:", err);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});

