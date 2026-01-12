// Very small sliding-window in-memory limiter (per IP)
const store = new Map<string, number[]>();

/**
 * Performs rate limit operation.
 * @param {Request} req - Description of req
 * @param {{ max: number; windowMs: number; }} options - Description of options
 * @returns {boolean} Description of return value
 */
export function rateLimit(
  req: Request,
  options: { max: number; windowMs: number },
): boolean {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    (req as any).ip ||
    "unknown";

  const now = Date.now();
  const window = options.windowMs;

  const timestamps = store.get(ip) || [];
  const recent = timestamps.filter((ts) => now - ts < window);

  recent.push(now);
  store.set(ip, recent);

  return recent.length > options.max;
}
