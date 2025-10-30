/**
 * @file apps/be/routes/auth-middleware.ts
 * @description Authentication middleware that validates JWT tokens for protected routes.
 */

import { verifyJWT } from "@modheshwari/utils/jwt";

/**
 * Validates JWT from the `Authorization` header and attaches user payload to context.
 *
 * @async
 * @function authMiddleware
 * @param {Object} ctx - Elysia context.
 * @param {Request} ctx.request - The incoming HTTP request.
 * @param {Object} ctx.set - Response modifier (used to set HTTP status).
 * @param {Record<string, any>} [ctx.store] - Optional shared context for storing user info.
 * @returns {Promise<void | { error: string }>} Returns 401 JSON error if unauthorized.
 *
 * @example
 * // Usage inside a route
 * app.use(authMiddleware);
 * app.get("/api/secure", ({ store }) => {
 *   return { message: `Welcome, ${store.user.name}` };
 * });
 */
export async function authMiddleware({ request, set, store }: any) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      set.status = 401;
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = verifyJWT(token);

    if (!decoded) {
      set.status = 401;
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // Attach user payload to store for downstream handlers
    if (store) store.user = decoded;
    else (request as any).user = decoded; // fallback if store not used

    // Continue silently (no return = pass-through)
    return;
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    set.status = 500;
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
