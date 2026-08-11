import { NextResponse } from "next/server";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number;      // Max allowed requests within window
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Seconds until reset
  headers: Record<string, string>;
}

// Rate Limiting Presets
export const RATE_LIMIT_PRESETS = {
  AUTH: { windowMs: 60 * 1000, max: 5 },      // 5 req / 1 minute (Login, OTP, 2FA)
  PUBLIC: { windowMs: 60 * 1000, max: 15 },   // 15 req / 1 minute (Public Career Portal)
  API: { windowMs: 60 * 1000, max: 60 },      // 60 req / 1 minute (Standard API)
  HEAVY: { windowMs: 60 * 1000, max: 10 },    // 10 req / 1 minute (PDF Export, AI, Reports)
};

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-Memory LRU Store for Rate Limiting
const store = new Map<string, RateLimitRecord>();
const MAX_STORE_SIZE = 10000;

// Periodic cleanup of expired records (every 2 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 2 * 60 * 1000);
}

/**
 * Checks if a request exceeds the rate limit for a given key
 */
export function checkRateLimit(
  identifier: string,
  preset: keyof typeof RATE_LIMIT_PRESETS | RateLimitConfig = "API"
): RateLimitResult {
  const config = typeof preset === "string" ? RATE_LIMIT_PRESETS[preset] : preset;
  const now = Date.now();
  const key = `${identifier}:${config.windowMs}:${config.max}`;

  let record = store.get(key);

  if (!record || now > record.resetTime) {
    // Evict oldest item if store size limit is exceeded
    if (store.size >= MAX_STORE_SIZE) {
      const firstKey = store.keys().next().value;
      if (firstKey) store.delete(firstKey);
    }

    record = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    store.set(key, record);
  } else {
    record.count += 1;
  }

  const remaining = Math.max(0, config.max - record.count);
  const resetSeconds = Math.ceil((record.resetTime - now) / 1000);
  const success = record.count <= config.max;

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": config.max.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": resetSeconds.toString(),
  };

  if (!success) {
    headers["Retry-After"] = resetSeconds.toString();
  }

  return {
    success,
    limit: config.max,
    remaining,
    reset: resetSeconds,
    headers,
  };
}

/**
 * Helper to return an HTTP 429 Too Many Requests response
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Too Many Requests",
      message: `Terlalu banyak permintaan. Silakan coba lagi dalam ${result.reset} detik.`,
      retryAfter: result.reset,
    },
    {
      status: 429,
      headers: result.headers,
    }
  );
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
