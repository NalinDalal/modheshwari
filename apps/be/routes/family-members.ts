// @ts-nocheck
import prisma from "@modheshwari/db";
import { verifyJWT } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";

/**
 * GET /api/family/members
 * Returns all (or only alive) members of the family the head belongs to
 * Add `?all=true` to include dead members.
 */
export async function handleGetFamilyMembers(req: Request): Promise<Response> {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "").trim();
    const decoded: any = verifyJWT(token);
    if (!decoded || decoded.role !== "FAMILY_HEAD")
      return failure("Forbidden: Not a family head", "Forbidden", 403);

    // Parse query params
    const url = new URL(req.url);
    const includeAll = url.searchParams.get("all") === "true";

    // Find family headed by this user
    const family = await prisma.family.findFirst({
      where: { headId: decoded.id },
    });
    if (!family) return failure("Family not found", "Not Found", 404);

    // If not all, only fetch alive members
    const userFilter = includeAll ? {} : { status: true };

    const members = await prisma.familyMember.findMany({
      where: { familyId: family.id, user: userFilter },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            profile: true,
          },
        },
      },
    });

    // Filter out null users (dead ones when all=false)
    const filteredMembers = members.filter((m: any) => m.user !== null);

    return success(
      includeAll
        ? "All family members fetched"
        : "Alive family members fetched",
      { family, members: filteredMembers },
    );
  } catch (err) {
    console.error("❌ handleGetFamilyMembers error:", err);
    return failure("Internal Server Error", "Unexpected Error", 500);
  }
}
