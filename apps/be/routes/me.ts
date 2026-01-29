import prisma from "@modheshwari/db";
import { verifyJWT } from "@modheshwari/utils/jwt";
import type { AuthPayload } from "@modheshwari/utils/jwt";
import { success, failure } from "@modheshwari/utils/response";
import { extractAndVerifyToken } from "../utils/auth";

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

    let decoded: AuthPayload | null = null;
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

        profile: {
          select: {
            phone: true,
            address: true,
            profession: true,
            gotra: true,
            location: true,
            status: true,
            bloodGroup: true,
            allergies: true,
            medicalNotes: true,
          },
        },

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
      profile: user.profile,
      families: user.families.map((fm) => ({
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

    console.log(`/me fetched for userId=${user.id}`);

    // --- Step 4: Send success response ---
    return success("Fetched profile", formatted);
  } catch (err) {
    console.error("GetMe Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * PUT /api/me
 * Updates the authenticated user's profile details.
 */
type UpdateProfileBody = {
  bloodGroup?: string;
  gotra?: string;
  profession?: string;
};

/**
 * Performs handle update me operation.
 * @param {Request} req - Description of req
 * @returns {Promise<Response>} Description of return value
 */
export async function handleUpdateMe(req: Request): Promise<Response> {
  try {
    // --- Step 1: Extract and validate JWT ---
    const userId = extractAndVerifyToken(req);
    if (!userId) return failure("Unauthorized", "Auth Error", 401);

    // --- Step 2: Parse and validate input ---
    const body = (await req.json()) as UpdateProfileBody;
    const { bloodGroup, gotra, profession } = body;

    if (!bloodGroup && !gotra && !profession) {
      return failure(
        "No valid fields provided for update",
        "Validation Error",
        400,
      );
    }

    // --- Step 3: Update profile ---
    const updatedProfile = await prisma.profile.upsert({
      where: { userId },
      update: { bloodGroup, gotra, profession },
      create: { userId, bloodGroup, gotra, profession },
    });

    // --- Step 4: Send success response ---
    return success("Profile updated successfully", updatedProfile);
  } catch (err) {
    console.error("UpdateMe Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
