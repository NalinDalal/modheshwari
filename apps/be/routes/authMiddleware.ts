/**
 * @file apps/be/routes/auth-middleware.ts
 * @description Authentication middleware that validates JWT tokens for protected routes.
 */

import { extractAndVerifyToken } from "../utils/auth";
import { verifyJWT } from "@modheshwari/utils/jwt";

interface HttpError extends Error {
  status?: number;
}

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
    const userId = extractAndVerifyToken(request);

    // Attach user payload to store for downstream handlers
    if (store) store.user = { id: userId };
    else (request as any).user = { id: userId }; // fallback if store not used

    // Continue silently (no return = pass-through)
    return;
  } catch (err: unknown) {
    console.error("Auth Middleware Error:", err);

    let status = 500;
    let message = "Internal Server Error";

    if (err instanceof Error) {
      message = err.message;
    }

    if (
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof (err as any).status === "number"
    ) {
      status = (err as any).status;
    }

    set.status = status;

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Helper: extract and verify JWT from Request's Authorization header.
 * Returns decoded payload or null if invalid/missing.
 */
export function getAuthPayload(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return null;
    const decoded = verifyJWT(token);
    return decoded as any;
  } catch (err) {
    console.error("Get Auth Payload Error:", err);
    return null;
  }
}

/**
 * Helper: require authentication and optionally restrict to allowed roles.
 * Returns an object { ok: true, payload } or { ok: false, response } where
 * response is a prebuilt JSON Response to return from the handler.
 */
export function requireAuth(req: Request, allowedRoles?: string[]) {
  const payload: any = getAuthPayload(req);
  if (!payload) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          status: "error",
          message: "Unauthorized",
          data: null,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  if (allowedRoles && Array.isArray(allowedRoles)) {
    if (!allowedRoles.includes(payload.role)) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ status: "error", message: "Forbidden", data: null }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        ),
      };
    }
  }

  return { ok: true, payload };
}
