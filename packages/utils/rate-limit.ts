/**
 * Performs rate limit operation.
 * @param {Request} req - Description of req
 * @param {{ max: number; windowMs: number; }} options - Description of options
 * @returns {boolean} Description of return value
 */
/* -------------------------------------------
   Simple in-memory sliding window rate limiter
   ------------------------------------------- */

type RateLimitOptions = {
  max: number; // max requests
  windowMs: number; // time window
  scope?: string; // endpoint / feature name
};

type HitStore = Map<string, number[]>;

// Single store for all rate limits
const hits: HitStore = new Map();

/* -------------------------------------------
   IP Resolution
------------------------------------------- */

export function getClientIp(req: Request): string {
  const header =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip");

  if (header) return header.split(",")[0]?.trim() || "unknown";

  return (req as any)?.ip || "unknown";
}

/* -------------------------------------------
   Rate Limiter
------------------------------------------- */

export function isRateLimited(
  req: Request,
  { max, windowMs, scope = "global" }: RateLimitOptions,
): boolean {
  const ip = getClientIp(req);
  const now = Date.now();

  // key = ip + endpoint scope
  const key = `${scope}:${ip}`;
  const timestamps = hits.get(key) || [];

  // sliding window: keep only recent timestamps
  const recent = timestamps.filter((t) => now - t < windowMs);
  recent.push(now);

  hits.set(key, recent);

  // opportunistic cleanup (prevents memory leak)
  if (hits.size > 10_000) {
    for (const [k, v] of hits) {
      if (v.length === 0) hits.delete(k);
    }
  }

  return recent.length > max;
}
