/**
 * Search endpoint with structured query modes.
 * Parses structured queries (blood:, gotra:, role:, family:, profession:, location:)
 * - Enforces per-IP rate limit (in-memory)
 * - Uses in-memory cache (in-memory TTL) with search-mode-aware keys
 *  - Supports exact and substring matches based on mode
 * - Falls back to full-text search for unstructured queries
 */

import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import {
  parseQuery,
  SearchMode,
  isValidBloodGroup,
  normalizeBloodGroup,
  normalizeRole,
  buildWhereClause,
  buildSelectClause,
} from "../utils/search-parser";
import { isRateLimited } from "@modheshwari/utils/rate-limit";

type CacheEntry = { ts: number; data: any };
const CACHE_TTL = 60 * 1000; // 60 seconds
const cache = new Map<string, CacheEntry>();

/**
 * GET /api/search?q=xxx
 *
 * Supported modes:
 * - ?q=blood:O+         (exact match)
 * - ?q=gotra:Shandilya  (substring, case-insensitive)
 * - ?q=role:FAMILY_HEAD (exact match, role enum)
 * - ?q=family:Patel     (substring, case-insensitive)
 * - ?q=profession:doctor (substring, case-insensitive)
 * - ?q=location:Mumbai  (exact and substring, case-insensitive)
 * - ?q=rahul            (fallback: searches name, email, profession, gotra, location)
 *
 * Cache behavior:
 * - Cached per search mode (blood:O+ != blood:A+)
 * - TTL: 60 seconds
 * - Cache key format: "{MODE}:{value_lowercase}"
 *
 * Rate limiting:
 * - 30 requests per 60 seconds per IP
 * - Sliding window algorithm (fair distribution)
 */
export async function handleSearch(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    if (q.length < 2) {
      return failure("Query too short", "Validation Error", 400);
    }

    if (
      isRateLimited(req, {
        windowMs: 60_000,
        max: 30,
        scope: "search",
      })
    ) {
      return failure("Too many requests", "Rate Limit", 429);
    }

    // Parse structured query
    const parsed = parseQuery(q);

    // Create cache key that includes search mode (highly specific)
    const cacheKey = `${parsed.mode}:${parsed.value.toLowerCase()}`;
    const now = Date.now();

    // Check cache first (avoid DB hit if possible)
    const cached = cache.get(cacheKey);
    if (cached && now - cached.ts < CACHE_TTL) {
      return success("Search results", cached.data);
    }

    // Validate mode-specific requirements before DB query
    if (parsed.mode === SearchMode.BLOOD) {
      if (!isValidBloodGroup(parsed.value)) {
        return failure(
          "Invalid blood group. Use format like O+, A-, AB+, etc.",
          "Validation Error",
          400,
        );
      }
    }

    if (parsed.mode === SearchMode.ROLE) {
      const validRoles = [
        "COMMUNITY_HEAD",
        "COMMUNITY_SUBHEAD",
        "GOTRA_HEAD",
        "FAMILY_HEAD",
        "MEMBER",
      ];
      const normalizedRole = normalizeRole(parsed.value);
      if (!validRoles.includes(normalizedRole)) {
        return failure(
          `Invalid role. Valid roles: ${validRoles.join(", ")}`,
          "Validation Error",
          400,
        );
      }
    }

    // Build dynamic where clause based on mode
    const where = buildWhereClause(parsed.mode, parsed.value);
    const select = buildSelectClause();

    // Execute search query
    const users = await prisma.user.findMany({
      where,
      select,
      take: 20,
    });

    // Cache results with mode-aware key
    // Important: TTL is short (60s) to avoid stale data for fast-changing fields
    cache.set(cacheKey, { ts: now, data: users });

    return success("Search results", users);
  } catch (err) {
    console.error("Search Error:", err);
    return failure("Internal Server Error", "Unexpected", 500);
  }
}
