import { NextRequest, NextResponse } from "next/server";

// --- In-memory rate limiter ---

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Map<compositeKey, entry> where compositeKey = `${ip}:${category}`
const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 minute window
const CLEANUP_INTERVAL_MS = 120_000; // Purge expired entries every 2 minutes

let lastCleanup = Date.now();

/** Remove expired entries to prevent memory leaks */
function cleanupStaleEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  rateLimitStore.forEach((entry, key) => {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  });
}

// Rate limit categories mapped to max requests per minute
type RateLimitCategory =
  | "generate"
  | "studio_generate"
  | "payments"
  | "agent-chat"
  | "game-auth"
  | "default";

const RATE_LIMITS: Record<RateLimitCategory, number> = {
  generate: 10,
  studio_generate: 10,
  payments: 20,
  "agent-chat": 15,
  "game-auth": 10,
  default: 60,
};

/** Determine the rate limit category for a given pathname */
function resolveCategory(pathname: string): RateLimitCategory {
  // Status polling excluded from generate limit — uses default (60/min)
  if (pathname.startsWith("/api/generate/status/")) return "default";
  if (pathname.startsWith("/api/generate/history")) return "default";
  if (pathname.startsWith("/api/generate/")) return "generate";
  if (pathname === "/api/generate") return "generate";
  // Studio generation endpoint
  if (pathname === "/api/studio/generate") return "studio_generate";
  if (pathname.startsWith("/api/studio/status/")) return "default";
  if (pathname.startsWith("/api/studio/feed")) return "default";
  if (pathname.startsWith("/api/studio/")) return "default";
  if (pathname.startsWith("/api/payments/")) return "payments";
  if (pathname === "/api/payments") return "payments";
  if (pathname === "/api/agent/chat") return "agent-chat";
  if (pathname === "/api/game/auth") return "game-auth";
  return "default";
}

/** Extract client IP from the request */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for may contain multiple IPs; take the first (original client)
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Check rate limit for a given IP + category.
 * Returns { allowed, limit, remaining, resetAt }.
 */
function checkRateLimit(
  ip: string,
  category: RateLimitCategory
): { allowed: boolean; limit: number; remaining: number; resetAt: number } {
  const now = Date.now();
  const limit = RATE_LIMITS[category];
  const key = `${ip}:${category}`;

  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetAt) {
    // First request in a new window
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, limit, remaining: limit - 1, resetAt: now + WINDOW_MS };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    limit,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// --- Middleware ---

export function middleware(request: NextRequest): NextResponse {
  // Periodic cleanup of expired entries
  cleanupStaleEntries();

  const { pathname } = request.nextUrl;

  // Only rate-limit API routes (matcher already filters, but double-check)
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  const category = resolveCategory(pathname);
  const { allowed, limit, remaining, resetAt } = checkRateLimit(ip, category);

  if (!allowed) {
    const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000);

    // Match project error response format: { error: { code, message } }
    const body = {
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Слишком много запросов. Попробуйте позже.",
      },
    };

    return NextResponse.json(body, {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    });
  }

  // Attach rate limit headers to successful responses
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
