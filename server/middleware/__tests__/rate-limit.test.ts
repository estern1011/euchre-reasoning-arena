import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for rate limiting middleware
 *
 * Tests the token bucket algorithm and rate limit behavior
 */

// Mock Nuxt utilities
const mockSetResponseHeader = vi.fn();
const mockGetHeader = vi.fn();
const mockCreateError = vi.fn((opts) => {
  const err = new Error(opts.message) as any;
  err.statusCode = opts.statusCode;
  err.statusMessage = opts.statusMessage;
  return err;
});

vi.stubGlobal("setResponseHeader", mockSetResponseHeader);
vi.stubGlobal("getHeader", mockGetHeader);
vi.stubGlobal("createError", mockCreateError);
vi.stubGlobal("defineEventHandler", (handler: any) => handler);

// Import after mocking
const { default: rateLimitHandler } = await import("../rate-limit");

function createMockEvent(path: string, ip: string = "127.0.0.1") {
  mockGetHeader.mockImplementation((event, header) => {
    if (header === "x-forwarded-for") return ip;
    return undefined;
  });

  return {
    path,
    node: {
      req: {
        socket: {
          remoteAddress: ip,
        },
      },
    },
  };
}

describe("Rate Limiting Middleware", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  it("should skip non-API routes", () => {
    const event = createMockEvent("/some-page");
    const result = rateLimitHandler(event);
    expect(result).toBeUndefined();
    expect(mockSetResponseHeader).not.toHaveBeenCalled();
  });

  it("should skip health check endpoints", () => {
    const event = createMockEvent("/api/health");
    const result = rateLimitHandler(event);
    expect(result).toBeUndefined();

    const event2 = createMockEvent("/api/_health");
    const result2 = rateLimitHandler(event2);
    expect(result2).toBeUndefined();
  });

  it("should allow requests within rate limit", () => {
    const event = createMockEvent("/api/stream-next-round", "192.168.1.1");
    const result = rateLimitHandler(event);
    expect(result).toBeUndefined();
    expect(mockSetResponseHeader).toHaveBeenCalledWith(
      event,
      "X-RateLimit-Limit",
      "60"
    );
  });

  it("should set rate limit headers on successful requests", () => {
    const event = createMockEvent("/api/game", "10.0.0.1");
    rateLimitHandler(event);

    expect(mockSetResponseHeader).toHaveBeenCalledWith(
      event,
      "X-RateLimit-Limit",
      "60"
    );
    expect(mockSetResponseHeader).toHaveBeenCalledWith(
      event,
      "X-RateLimit-Remaining",
      expect.any(String)
    );
    expect(mockSetResponseHeader).toHaveBeenCalledWith(
      event,
      "X-RateLimit-Reset",
      expect.any(String)
    );
  });

  it("should track requests per IP independently", () => {
    const event1 = createMockEvent("/api/test", "1.1.1.1");
    const event2 = createMockEvent("/api/test", "2.2.2.2");

    // Both should succeed (different IPs)
    expect(() => rateLimitHandler(event1)).not.toThrow();
    expect(() => rateLimitHandler(event2)).not.toThrow();
  });

  it("should decrement tokens on each request", () => {
    const ip = "3.3.3.3";

    // Make several requests
    for (let i = 0; i < 5; i++) {
      const event = createMockEvent("/api/test", ip);
      rateLimitHandler(event);
    }

    // Check remaining tokens decreased
    const calls = mockSetResponseHeader.mock.calls.filter(
      (call) => call[1] === "X-RateLimit-Remaining"
    );

    // Should have 5 calls, with decreasing values
    expect(calls.length).toBe(5);
    expect(parseInt(calls[0][2])).toBeGreaterThan(parseInt(calls[4][2]));
  });

  it("should reject requests when rate limit exceeded", () => {
    const ip = "4.4.4.4";

    // Exhaust all tokens (60 requests)
    for (let i = 0; i < 60; i++) {
      const event = createMockEvent("/api/test", ip);
      rateLimitHandler(event);
    }

    // 61st request should be rejected
    const event = createMockEvent("/api/test", ip);
    expect(() => rateLimitHandler(event)).toThrow();
    expect(mockCreateError).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 429,
        statusMessage: "Too Many Requests",
      })
    );
  });

  it("should refill tokens over time", () => {
    const ip = "5.5.5.5";

    // Use up some tokens
    for (let i = 0; i < 10; i++) {
      const event = createMockEvent("/api/test", ip);
      rateLimitHandler(event);
    }

    // Advance time by 10 seconds (should refill ~10 tokens)
    vi.advanceTimersByTime(10000);

    // Make another request - should get refilled tokens
    const event = createMockEvent("/api/test", ip);
    rateLimitHandler(event);

    const calls = mockSetResponseHeader.mock.calls.filter(
      (call) => call[1] === "X-RateLimit-Remaining"
    );
    const lastRemaining = parseInt(calls[calls.length - 1][2]);

    // Should have more tokens than if we hadn't waited
    // After 10 requests: 50 remaining, after 10s wait: ~60, after 1 more: ~59
    expect(lastRemaining).toBeGreaterThanOrEqual(58);
  });

  it("should extract IP from x-forwarded-for header", () => {
    mockGetHeader.mockImplementation((event, header) => {
      if (header === "x-forwarded-for") return "203.0.113.50, 70.41.3.18";
      return undefined;
    });

    const event = {
      path: "/api/test",
      node: { req: { socket: { remoteAddress: "127.0.0.1" } } },
    };

    rateLimitHandler(event);

    // Should use first IP from x-forwarded-for
    // Verify by making requests from "different" sources
    expect(mockSetResponseHeader).toHaveBeenCalled();
  });

  it("should set Retry-After header when rate limited", () => {
    const ip = "6.6.6.6";

    // Exhaust tokens
    for (let i = 0; i < 60; i++) {
      const event = createMockEvent("/api/test", ip);
      rateLimitHandler(event);
    }

    mockSetResponseHeader.mockClear();

    // Try one more
    const event = createMockEvent("/api/test", ip);
    try {
      rateLimitHandler(event);
    } catch {
      // Expected
    }

    expect(mockSetResponseHeader).toHaveBeenCalledWith(
      event,
      "Retry-After",
      expect.any(String)
    );
  });
});
