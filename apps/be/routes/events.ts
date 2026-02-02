/**
 * Event Management Routes
 * Handles event CRUD operations, approval workflow, and registrations
 */

import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import {
  parsePagination,
  buildPaginationResponse,
} from "@modheshwari/utils/pagination";

import { requireAuth } from "./authMiddleware";

/**
 * POST /api/events
 * Create a new event (requires authentication)
 * Body: { name, description, date, venue }
 */
export async function handleCreateEvent(req: Request): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response as Response;

    const userId = auth.payload.userId || auth.payload.id;
    const body: any = await req.json().catch(() => null);

    if (!body || !body.name || !body.date) {
      return failure(
        "Missing required fields: name, date",
        "Validation Error",
        400,
      );
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        name: body.name,
        description: body.description,
        date: new Date(body.date),
        venue: body.venue,
        createdById: userId,
        status: "PENDING",
      },
    });

    // Create approval records for all admins (COMMUNITY_HEAD, COMMUNITY_SUBHEAD, GOTRA_HEAD)
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"],
        },
      },
      select: { id: true, name: true, role: true },
    });

    if (admins.length > 0) {
      await prisma.eventApproval.createMany({
        data: admins.map((admin) => ({
          eventId: event.id,
          approverId: admin.id,
          approverName: admin.name,
          role: admin.role,
          status: "PENDING",
        })),
      });

      // Notify admins
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "EVENT_APPROVAL",
          message: `New event "${event.name}" requires your approval`,
        })),
      });
    }

    return success("Event created successfully", { event }, 201);
  } catch (err) {
    console.error("CreateEvent Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * GET /api/events
 * List all approved events (public)
 * Query params: status (optional filter), page, limit (pagination)
 */
export async function handleListEvents(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");

    // Parse pagination
    const { skip, take, page, limit } = parsePagination(
      {
        page: url.searchParams.get("page"),
        limit: url.searchParams.get("limit"),
      },
      10,
      100,
    );

    const where: any = {};
    if (
      statusFilter &&
      ["PENDING", "APPROVED", "REJECTED", "CANCELLED"].includes(
        statusFilter.toUpperCase(),
      )
    ) {
      where.status = statusFilter.toUpperCase();
    } else {
      // Default: only show approved events to public
      where.status = "APPROVED";
    }

    // Get total count
    const total = await prisma.event.count({ where });

    const events = await prisma.event.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { date: "asc" },
      skip,
      take,
    });

    return success(
      "Events fetched",
      buildPaginationResponse(events, total, page, limit),
    );
  } catch (err) {
    console.error("ListEvents Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * GET /api/events/:id
 * Get event details by ID
 */
export async function handleGetEvent(
  req: Request,
  id: string,
): Promise<Response> {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        registrations: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      return failure("Event not found", "Not Found", 404);
    }

    return success("Event fetched", { event });
  } catch (err) {
    console.error("GetEvent Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * POST /api/events/:id/register
 * Register for an event (requires authentication)
 */
export async function handleRegisterForEvent(
  req: Request,
  id: string,
): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response as Response;

    const userId = auth.payload.userId || auth.payload.id;

    // Check if event exists and is approved
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return failure("Event not found", "Not Found", 404);
    }

    if (event.status !== "APPROVED") {
      return failure(
        "Event is not approved for registration",
        "Forbidden",
        403,
      );
    }

    // Check if already registered
    const existing = await prisma.eventRegistration.findFirst({
      where: {
        eventId: id,
        userId,
      },
    });

    if (existing) {
      return failure("Already registered for this event", "Conflict", 409);
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: id,
        userId,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        type: "EVENT_REGISTRATION",
        message: `You have successfully registered for "${event.name}"`,
      },
    });

    return success("Registered successfully", { registration }, 201);
  } catch (err) {
    console.error("RegisterForEvent Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * DELETE /api/events/:id/register
 * Unregister from an event (requires authentication)
 */
export async function handleUnregisterFromEvent(
  req: Request,
  id: string,
): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response as Response;

    const userId = auth.payload.userId || auth.payload.id;

    // Find registration
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        eventId: id,
        userId,
      },
    });

    if (!registration) {
      return failure("Not registered for this event", "Not Found", 404);
    }

    // Delete registration
    await prisma.eventRegistration.delete({
      where: { id: registration.id },
    });

    return success("Unregistered successfully", {});
  } catch (err) {
    console.error("UnregisterFromEvent Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * GET /api/events/:id/registrations
 * Get all registrations for an event (admin only)
 */
export async function handleGetEventRegistrations(
  req: Request,
  id: string,
): Promise<Response> {
  try {
    const auth = requireAuth(req, [
      "COMMUNITY_HEAD",
      "COMMUNITY_SUBHEAD",
      "GOTRA_HEAD",
    ]);
    if (!auth.ok) return auth.response as Response;

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                phone: true,
                gotra: true,
              },
            },
          },
        },
      },
      orderBy: { registeredAt: "desc" },
    });

    return success("Registrations fetched", { registrations });
  } catch (err) {
    console.error("GetEventRegistrations Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * POST /api/events/:id/approve
 * Approve/reject an event (admin only)
 * Body: { status: "APPROVED" | "REJECTED", remarks?: string }
 */
export async function handleApproveEvent(
  req: Request,
  id: string,
): Promise<Response> {
  try {
    const auth = requireAuth(req, [
      "COMMUNITY_HEAD",
      "COMMUNITY_SUBHEAD",
      "GOTRA_HEAD",
    ]);
    if (!auth.ok) return auth.response as Response;

    const approverId = auth.payload.userId || auth.payload.id;
    const body: any = await req.json().catch(() => null);

    if (!body || !body.status) {
      return failure("Missing status field", "Validation Error", 400);
    }

    const validStatuses = ["APPROVED", "REJECTED"];
    if (!validStatuses.includes(body.status.toUpperCase())) {
      return failure("Invalid status", "Validation Error", 400);
    }

    // Find the approval record
    const approval = await prisma.eventApproval.findFirst({
      where: {
        eventId: id,
        approverId,
      },
      include: { event: true },
    });

    if (!approval) {
      return failure("Approval record not found", "Not Found", 404);
    }

    // Update approval record
    await prisma.eventApproval.update({
      where: { id: approval.id },
      data: {
        status: body.status.toUpperCase(),
        remarks: body.remarks,
        reviewedAt: new Date(),
      },
    });

    // Check if all approvals are complete
    const allApprovals = await prisma.eventApproval.findMany({
      where: { eventId: id },
    });

    const pendingApprovals = allApprovals.filter((a) => a.status === "PENDING");
    const rejectedApprovals = allApprovals.filter(
      (a) => a.status === "REJECTED",
    );

    let eventStatus = approval.event.status;

    // If any rejection, mark event as rejected
    if (rejectedApprovals.length > 0) {
      eventStatus = "REJECTED";
    }
    // If all approved, mark event as approved
    else if (pendingApprovals.length === 0) {
      eventStatus = "APPROVED";
    }

    // Update event status if changed
    if (eventStatus !== approval.event.status) {
      await prisma.event.update({
        where: { id },
        data: { status: eventStatus },
      });

      // Notify event creator
      await prisma.notification.create({
        data: {
          userId: approval.event.createdById,
          type: "EVENT_APPROVAL",
          message: `Your event "${approval.event.name}" has been ${eventStatus.toLowerCase()}`,
        },
      });
    }

    return success("Approval recorded", { eventStatus });
  } catch (err) {
    console.error("ApproveEvent Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
