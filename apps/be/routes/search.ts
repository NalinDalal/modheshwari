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
const CACHE_TTL = 60 * 1000; // 60 seconds
const cache = new Map<string, CacheEntry>();

// Very small in-memory rate limiter (demo only)
const RATE_WINDOW = 60 * 1000;
const RATE_MAX = 30;
const hits: Map<string, number[]> = new Map();

/**
 * Safely get client IP from headers or Bun internals.
 */
function getClientIp(req: Request) {
  const header =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip");

  if (header) {
    const parts = header.split(",");
    return parts[0]?.trim() || "unknown";
  }

  // Bun-specific fallback — not always present
  try {
    return (req as any).ip || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Simple sliding-window rate limit tracker.
 */
function isRateLimited(ip: string) {
  const now = Date.now();
  const arr = hits.get(ip) || [];

  const recent = arr.filter((t) => now - t < RATE_WINDOW);
  recent.push(now);

  hits.set(ip, recent);

  return recent.length > RATE_MAX;
}

/**
 * GET /api/search?q=xxx
 */
export async function handleSearch(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    if (q.length < 2) {
      return failure("Query too short", "Validation Error", 400);
    }

    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return failure("Too many requests", "Rate Limit", 429);
    }

    const key = q.toLowerCase();
    const now = Date.now();

    // Memory cache
    const cached = cache.get(key);
    if (cached && now - cached.ts < CACHE_TTL) {
      return success("Search results", cached.data);
    }

    // Actual DB search
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    cache.set(key, { ts: now, data: users });

    return success("Search results", users);
  } catch (err) {
    console.error("Search Error:", err);
    return failure("Internal Server Error", "Unexpected", 500);
  }
}
