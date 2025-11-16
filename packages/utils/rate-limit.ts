// Very small sliding-window in-memory limiter (per IP)
const store = new Map<string, number[]>();

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
