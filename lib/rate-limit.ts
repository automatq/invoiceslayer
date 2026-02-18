/**
 * Simple in-memory sliding-window rate limiter.
 * For production at scale, replace with an edge-compatible store (e.g. Upstash Redis).
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
    /** Max requests allowed in the window */
    limit: number;
    /** Window duration in seconds */
    windowSec: number;
}

export function rateLimit(
    identifier: string,
    { limit, windowSec }: RateLimitOptions
): { success: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const windowMs = windowSec * 1000;

    const entry = store.get(identifier);

    if (!entry || now > entry.resetAt) {
        // New window
        const resetAt = now + windowMs;
        store.set(identifier, { count: 1, resetAt });
        return { success: true, remaining: limit - 1, resetAt };
    }

    if (entry.count >= limit) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count += 1;
    return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/** Extract a stable identifier from a request (IP or fallback) */
export function getIdentifier(req: Request): string {
    const forwarded = (req as any).headers?.get?.("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return "anonymous";
}
