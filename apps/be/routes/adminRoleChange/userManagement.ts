import type { Role } from "@prisma/client";
import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";

import { requireAuth } from "../authMiddleware";
import { ADMIN_ROLES } from "./constants";

/**
 * GET /api/admin/users
 * List all users with their roles (admin only)
 * 
 * Query params:
 * - role: Filter by specific role
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 */
export async function handleListUsers(req: Request): Promise<Response> {
  try {
    const auth = requireAuth(req as Request, ADMIN_ROLES);
    if (!auth.ok) return auth.response as Response;

    const url = new URL(req.url);
    const roleFilter = url.searchParams.get("role");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {
      status: true,
    };

    if (roleFilter) {
      where.role = roleFilter;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          profile: {
            select: {
              phone: true,
              gotra: true,
              profession: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return success(
      "Users fetched",
      {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      200,
    );
  } catch (err) {
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * GET /api/admin/users/:id
 * Get detailed information about a specific user
 */
export async function handleGetUserDetails(
  req: Request,
  userId: string,
): Promise<Response> {
  try {
    const auth = requireAuth(req as Request, ADMIN_ROLES);
    if (!auth.ok) return auth.response as Response;

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
          },
        },
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
            joinedAt: true,
          },
        },
      },
    });

    if (!user) {
      return failure("User not found", "Not Found", 404);
    }

    return success("User details fetched", { user }, 200);
  } catch (err) {
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
