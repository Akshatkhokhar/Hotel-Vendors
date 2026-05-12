/**
 * Simple in-memory rate limiter using a Map.
 *
 * Each key (IP or user ID) maps to an array of timestamps.
 * Expired entries are pruned automatically every 5 minutes.
 *
 * NOTE: This is per-process. In a multi-instance deployment
 * replace with Redis-backed rate limiting.
 */

import type { NextRequest } from 'next/server';

const store = new Map<string, number[]>();

// Cleanup interval — remove expired entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store) {
      // Keep only timestamps that haven't expired based on the
      // longest window we'd ever use (24 hours is the max).
      const filtered = timestamps.filter((t) => now - t < 24 * 60 * 60 * 1000);
      if (filtered.length === 0) {
        store.delete(key);
      } else {
        store.set(key, filtered);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  // Allow the process to exit even if the timer is running
  if (cleanupTimer.unref) cleanupTimer.unref();
}

startCleanup();

/**
 * Check whether a request is within rate limits.
 *
 * @param {string} identifier - IP address, user ID, or any unique key.
 * @param {number} limit      - Max number of requests allowed in the window.
 * @param {number} windowMs   - Time window in milliseconds.
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number | null }}
 */
export function checkRateLimit(identifier: string, limit: number, windowMs: number): { allowed: boolean, remaining: number, retryAfterMs: number | null } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let timestamps = store.get(identifier) || [];

  // Drop timestamps outside the current window
  timestamps = timestamps.filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    // Find when the oldest request in the window expires
    const oldest = timestamps[0];
    const retryAfterMs = oldest + windowMs - now;

    store.set(identifier, timestamps);

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 0),
    };
  }

  // Record this request
  timestamps.push(now);
  store.set(identifier, timestamps);

  return {
    allowed: true,
    remaining: limit - timestamps.length,
    retryAfterMs: null,
  };
}

/**
 * Extract a usable IP from the request for rate-limiting.
 */
export function getRequestIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
