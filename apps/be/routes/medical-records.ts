import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { parsePagination, buildPaginationResponse } from "@modheshwari/utils/pagination";
import { requireAuth } from "./authMiddleware";

/**
 * POST /api/medical-records
 * Create a medical record for the authenticated user (or admin for others)
 */
export async function handleCreateMedicalRecord(req: Request): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response as Response;

    const body: any = await req.json().catch(() => null);
    if (!body) return failure("Missing body", "Validation Error", 400);

    const targetUserId = body.userId ?? (auth.payload.userId || auth.payload.id);

    // Only admins may create for other users
    if (body.userId && auth.payload.role !== "COMMUNITY_HEAD" && auth.payload.role !== "COMMUNITY_SUBHEAD") {
      return failure("Forbidden", "Forbidden", 403);
    }

    const rec = await prisma.medicalRecord.create({
      data: {
        userId: targetUserId,
        bloodType: body.bloodType ?? null,
        allergies: body.allergies ?? null,
        conditions: body.conditions ?? null,
        medications: body.medications ?? null,
        notes: body.notes ?? null,
      },
    });

    return success("Medical record created", { record: rec }, 201);
  } catch (err) {
    console.error("CreateMedicalRecord Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * GET /api/medical-records
 * List medical records (admins see all; users see their own)
 * Supports pagination: ?page=1&limit=20
 */
export async function handleListMedicalRecords(req: Request): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response as Response;

    const url = new URL(req.url);
    const { skip, take, page, limit } = parsePagination(
      { page: url.searchParams.get("page"), limit: url.searchParams.get("limit") },
      20,
      100,
    );

    const where: any = {};
    // optional filter by userId (admins) or default to current user
    const qUserId = url.searchParams.get("userId");
    if (qUserId) {
      if (auth.payload.role !== "COMMUNITY_HEAD" && auth.payload.role !== "COMMUNITY_SUBHEAD") {
        return failure("Forbidden", "Forbidden", 403);
      }
      where.userId = qUserId;
    } else {
      where.userId = auth.payload.userId ?? auth.payload.id;
    }

    const total = await prisma.medicalRecord.count({ where });
    const list = await prisma.medicalRecord.findMany({ where, orderBy: { createdAt: "desc" }, skip, take });

    return success("Medical records fetched", buildPaginationResponse(list, total, page, limit));
  } catch (err) {
    console.error("ListMedicalRecords Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * GET /api/medical-records/:id
 */
export async function handleGetMedicalRecord(req: Request, id: string): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response as Response;

    const rec = await prisma.medicalRecord.findUnique({ where: { id } });
    if (!rec) return failure("Not found", "Not Found", 404);

    // Only owner or admins
    const uid = auth.payload.userId ?? auth.payload.id;
    if (rec.userId !== uid && auth.payload.role !== "COMMUNITY_HEAD" && auth.payload.role !== "COMMUNITY_SUBHEAD") {
      return failure("Forbidden", "Forbidden", 403);
    }

    return success("Medical record fetched", { record: rec });
  } catch (err) {
    console.error("GetMedicalRecord Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * PATCH /api/medical-records/:id
 */
export async function handleUpdateMedicalRecord(req: Request, id: string): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response as Response;

    const rec = await prisma.medicalRecord.findUnique({ where: { id } });
    if (!rec) return failure("Not found", "Not Found", 404);

    const uid = auth.payload.userId ?? auth.payload.id;
    if (rec.userId !== uid && auth.payload.role !== "COMMUNITY_HEAD" && auth.payload.role !== "COMMUNITY_SUBHEAD") {
      return failure("Forbidden", "Forbidden", 403);
    }

    const body: any = await req.json().catch(() => null);
    if (!body) return failure("Missing body", "Validation Error", 400);

    const updated = await prisma.medicalRecord.update({
      where: { id },
      data: {
        bloodType: body.bloodType ?? rec.bloodType,
        allergies: body.allergies ?? rec.allergies,
        conditions: body.conditions ?? rec.conditions,
        medications: body.medications ?? rec.medications,
        notes: body.notes ?? rec.notes,
      },
    });

    return success("Medical record updated", { record: updated });
  } catch (err) {
    console.error("UpdateMedicalRecord Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * DELETE /api/medical-records/:id
 */
export async function handleDeleteMedicalRecord(req: Request, id: string): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response as Response;

    const rec = await prisma.medicalRecord.findUnique({ where: { id } });
    if (!rec) return failure("Not found", "Not Found", 404);

    const uid = auth.payload.userId ?? auth.payload.id;
    if (rec.userId !== uid && auth.payload.role !== "COMMUNITY_HEAD" && auth.payload.role !== "COMMUNITY_SUBHEAD") {
      return failure("Forbidden", "Forbidden", 403);
    }

    await prisma.medicalRecord.delete({ where: { id } });
    return success("Medical record deleted", null);
  } catch (err) {
    console.error("DeleteMedicalRecord Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

export default {};
