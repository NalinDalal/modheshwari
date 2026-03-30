import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { extractAndVerifyToken } from "../../utils/auth";

/**
 * GET /api/messages/search-users
 * Search users to start a conversation with
 */
export async function handleSearchUsersForChat(
    req: Request,
): Promise<Response> {
    //extract user details from token
    const userId = extractAndVerifyToken(req);
    if (!userId) {
        return failure("Unauthorized", "Auth Error", 401);
    }

    //parse the url query params
    const url = new URL(req.url);
    const query = url.searchParams.get("q") || "";

    try {
        //fetch users from db
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: query,
                            mode: "insensitive",
                        },
                    },
                    {
                        email: {
                            contains: query,
                            mode: "insensitive",
                        },
                    },
                ],
                status: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profile: {
                    select: {
                        profession: true,
                        location: true,
                    },
                },
            },
            take: 20,
        });

        return success("Users found", users);
    } catch (err) {
        return failure("Failed to search users", null, 500);
    }
}
