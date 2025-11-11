/**
 * Simple search endpoint for demo purposes.
 * - Validates & normalizes the query
 * - Enforces a per-IP rate limit (in-memory)
 * - Uses a short in-memory cache (in-memory TTL)
 * - Falls back to a basic Prisma user search (name/email contains)
 */

import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";

type CacheEntry = { ts: number; data: any };
const CACHE_TTL = 60 * 1000; // 60s
const cache = new Map<string, CacheEntry>();

// Very small in-memory rate limiter for demo. Production: use Redis or external store.
const RATE_WINDOW = 60 * 1000; // 1 minute
const RATE_MAX = 30; // max requests per window per IP
const hits: Map<string, number[]> = new Map();

/**
 * Performs get client ip operation.
 * @param {Request} req - Description of req
 * @returns {any} Description of return value
 */
function getClientIp(req: Request) {
  const header =
    req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
  if (header) return header.split(",")[0]!.trim();
  try {
    // Bun exposes a `conn` on the Request in some environments, but it's not standard.
    // Fallback to unknown so limiter groups them together.
    return (req as any).ip || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Performs is rate limited operation.
 * @param {string} ip - Description of ip
 * @returns {boolean} Description of return value
 */
function isRateLimited(ip: string) {
  const now = Date.now();
  const arr = hits.get(ip) || [];
  // keep only timestamps inside window
  const recent = arr.filter((t) => now - t < RATE_WINDOW);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_MAX;
}

/**
 * Performs handle search operation.
 * @param {Request} req - Description of req
 * @returns {Promise<Response>} Description of return value
 */
export async function handleSearch(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    if (!q || q.length < 2) {
      return failure("Query too short", "Validation Error", 400);
    }

    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return failure("Too many requests", "Rate limit", 429);
    }

    const key = q.toLowerCase();
    const cached = cache.get(key);
    const now = Date.now();
    if (cached && now - cached.ts < CACHE_TTL) {
      return success("Search results (cache)", { data: cached.data });
    }

    // Basic user search: name or email contains (case-insensitive)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
      select: { id: true, name: true, email: true, role: true },
    });

    cache.set(key, { ts: now, data: users });

    return success("Search results", { data: users });
  } catch (err) {
    console.error("Search Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
