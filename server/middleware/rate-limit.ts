/**
 * Simple in-memory rate limiting middleware
 *
 * Implements a sliding window rate limiter to protect API endpoints
 * from abuse. Uses token bucket algorithm per IP address.
 *
 * Note: For production at scale, replace with Redis-based rate limiting.
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

// Configuration
const RATE_LIMIT_CONFIG = {
  maxTokens: 60, // Max requests per window
  refillRate: 1, // Tokens added per second
  windowMs: 60_000, // 1 minute window
};

// In-memory store (replace with Redis for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  const staleThreshold = now - RATE_LIMIT_CONFIG.windowMs * 2;

  for (const [key, entry] of rateLimitStore) {
    if (entry.lastRefill < staleThreshold) {
      rateLimitStore.delete(key);
    }
  }
}

function getClientIP(event: any): string {
  // Check common headers for proxied requests
  const forwarded = getHeader(event, "x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = getHeader(event, "x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to connection address
  return event.node?.req?.socket?.remoteAddress || "unknown";
}

function refillTokens(entry: RateLimitEntry, now: number): void {
  const elapsed = (now - entry.lastRefill) / 1000; // Convert to seconds
  const tokensToAdd = elapsed * RATE_LIMIT_CONFIG.refillRate;
  entry.tokens = Math.min(RATE_LIMIT_CONFIG.maxTokens, entry.tokens + tokensToAdd);
  entry.lastRefill = now;
}

export default defineEventHandler((event) => {
  // Only rate limit API endpoints
  const path = event.path || "";
  if (!path.startsWith("/api/")) {
    return;
  }

  // Skip rate limiting for health checks
  if (path === "/api/health" || path === "/api/_health") {
    return;
  }

  cleanupStaleEntries();

  const clientIP = getClientIP(event);
  const now = Date.now();

  let entry = rateLimitStore.get(clientIP);

  if (!entry) {
    entry = {
      tokens: RATE_LIMIT_CONFIG.maxTokens,
      lastRefill: now,
    };
    rateLimitStore.set(clientIP, entry);
  }

  // Refill tokens based on elapsed time
  refillTokens(entry, now);

  // Check if request can proceed
  if (entry.tokens < 1) {
    const retryAfter = Math.ceil((1 - entry.tokens) / RATE_LIMIT_CONFIG.refillRate);

    setResponseHeader(event, "Retry-After", String(retryAfter));
    setResponseHeader(event, "X-RateLimit-Limit", String(RATE_LIMIT_CONFIG.maxTokens));
    setResponseHeader(event, "X-RateLimit-Remaining", "0");
    setResponseHeader(event, "X-RateLimit-Reset", String(Math.ceil(now / 1000) + retryAfter));

    throw createError({
      statusCode: 429,
      statusMessage: "Too Many Requests",
      message: `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
    });
  }

  // Consume a token
  entry.tokens -= 1;

  // Add rate limit headers
  setResponseHeader(event, "X-RateLimit-Limit", String(RATE_LIMIT_CONFIG.maxTokens));
  setResponseHeader(event, "X-RateLimit-Remaining", String(Math.floor(entry.tokens)));
  setResponseHeader(
    event,
    "X-RateLimit-Reset",
    String(Math.ceil(now / 1000) + Math.ceil(RATE_LIMIT_CONFIG.maxTokens / RATE_LIMIT_CONFIG.refillRate))
  );
});
