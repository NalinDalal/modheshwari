// apps/be/routes/me.ts
// @ts-nocheck

import prisma from "@modheshwari/db";
import { verifyJWT } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";

/**
 * GET /api/me
 * Returns the authenticated user's details and the families they belong to.
 */
export async function handleGetMe(req: Request) {
  try {
    // --- Step 1: Extract and validate JWT ---
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) return failure("Missing token", "Auth Error", 401);

    let decoded;
    try {
      decoded = verifyJWT(token);
    } catch {
      return failure("Invalid or expired token", "Auth Error", 401);
    }

    const userId = decoded?.userId ?? decoded?.id;
    if (!userId) return failure("Unauthorized", "Auth Error", 401);

    // --- Step 2: Fetch user + family memberships ---
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        families: {
          select: {
            family: {
              select: {
                id: true,
                name: true,
                uniqueId: true,
              },
            },
            role: true,
          },
        },
      },
    });

    if (!user) return failure("User not found", "Not Found", 404);

    // --- Step 3: Transform output ---
    const formatted = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      families: user.families.map((f) => ({
        id: f.family.id,
        name: f.family.name,
        uniqueId: f.family.uniqueId,
        role: f.role,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    console.log(`✅ /me fetched for userId=${user.id}`);

    // --- Step 4: Send success response ---
    return success("Fetched profile", formatted);
  } catch (err) {
    console.error("❌ GetMe Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
