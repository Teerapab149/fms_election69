/**
 * Tiny in-memory sliding-window rate limiter.
 *
 * The app is a single-container deploy, so per-process memory is enough (not
 * distributed; counters reset on restart — acceptable here). Node-runtime only
 * (module state persists across requests). For real horizontal scaling, swap the
 * Map for Redis behind the same interface.
 */

const buckets = new Map(); // key -> number[] (request timestamps within window)

/**
 * @param {string} key      identity to limit on (e.g. `login:<ip>`)
 * @param {{limit:number, windowMs:number}} opts
 * @returns {{ok:true} | {ok:false, retryAfter:number}}  retryAfter in seconds
 */
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - hits[0])) / 1000));
    buckets.set(key, hits);
    return { ok: false, retryAfter };
  }

  hits.push(now);
  buckets.set(key, hits);

  // opportunistic GC so the Map can't grow unbounded
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
    }
  }
  return { ok: true };
}

/** Best-effort client IP from proxy headers (nginx sets x-forwarded-for). */
export function clientIp(request) {
  const xff = request.headers?.get?.("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers?.get?.("x-real-ip") || "unknown";
}
