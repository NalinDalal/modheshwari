// apps/be/routes/me.ts
// @ts-nocheck

import prisma from "@modheshwari/db";
import { verifyJWT } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";

/**
 * GET /api/me
 * Returns the authenticated user's details and the families they belong to.
 */
export async function handleGetMe(req: Request): Promise<Response> {
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
        status: true,
        createdAt: true,
        updatedAt: true,
        families: {
          select: {
            id: true,
            familyId: true,
            joinedAt: true,
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
      status: user.status,
      families: user.families.map((fm: any) => ({
        id: fm.id,
        familyId: fm.familyId,
        role: fm.role,
        joinedAt: fm.joinedAt,
        family: {
          id: fm.family.id,
          name: fm.family.name,
          uniqueId: fm.family.uniqueId,
        },
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    console.log(` /me fetched for userId=${user.id}`);

    if (
      user.role === "COMMUNITY_HEAD" ||
      user.role === "COMMUNITY_SUBHEAD" ||
      user.role === "GOTRA_HEAD"
    ) {
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: {
          userId: true,
          gotra: true,
          user: {
            select: { name: true },
          },
          role: true,
        },
      });
      if (profile) {
        formatted.profile = profile;
      }
      formatted.usersCount = await prisma.user.count();
    }
    // --- Step 4: Send success response ---
    return success("Fetched profile", formatted);
  } catch (err) {
    console.error(" GetMe Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
