/* -------------------------------------------
   In-memory sliding window rate limiter
   ------------------------------------------- */

type RateLimitOptions = {
    max: number;
    windowMs: number;
    scope?: string;
};

type Entry = { timestamps: number[]; lastCleanup: number };

const hits = new Map<string, Entry>();

const CLEANUP_INTERVAL_MS = 60_000;
const MAX_ENTRIES = 10_000;

/* -------------------------------------------
   IP Resolution
   Prefer X-Real-IP (set by nginx, not spoofable)
   over X-Forwarded-For (client-controlled)
   ------------------------------------------- */

export function getClientIp(req: Request): string {
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();

    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

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
    const key = `${scope}:${ip}`;

    let entry = hits.get(key);
    if (!entry) {
        entry = { timestamps: [], lastCleanup: now };
        hits.set(key, entry);
    }

    // sliding window: keep only recent timestamps
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    entry.timestamps.push(now);

    // periodic cleanup to prevent memory leak
    if (hits.size > MAX_ENTRIES || now - entry.lastCleanup > CLEANUP_INTERVAL_MS) {
        for (const [k, v] of hits) {
            v.timestamps = v.timestamps.filter((t) => now - t < windowMs);
            if (v.timestamps.length === 0) hits.delete(k);
        }
        entry.lastCleanup = now;
    }

    return entry.timestamps.length > max;
}
