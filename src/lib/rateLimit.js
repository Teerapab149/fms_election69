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

/**
 * Client IP as the reverse proxy saw it.
 *
 * nginx forwards with `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for`,
 * which keeps whatever the client sent and appends the address it actually
 * connected from. So the LEFT end of the header is the client's own claim and a
 * single curl -H can make up a new "address" per request; the entry the trusted
 * proxy wrote is counted from the RIGHT. TRUSTED_PROXY_HOPS is how many proxies
 * of ours sit in front of the app (default 1: nginx only). Set 2 when another
 * proxy or load balancer sits in front of nginx, otherwise every visitor is seen
 * as that proxy's one address and shares a single bucket.
 *
 * Only holds if clients cannot reach the app port directly: bind it to
 * 127.0.0.1 (or the docker network) so every request passes through nginx.
 */
export function clientIp(request) {
  const xff = request.headers?.get?.("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      const hops = Math.max(1, parseInt(process.env.TRUSTED_PROXY_HOPS || "1", 10) || 1);
      return parts[Math.max(0, parts.length - hops)];
    }
  }
  return request.headers?.get?.("x-real-ip") || "unknown";
}
