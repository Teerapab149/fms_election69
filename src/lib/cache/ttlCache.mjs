// Short in-process TTL cache with single-flight and an explicit bust — no imports,
// so node:test can load it (scripts/smoke/ttlCache.test.mjs). Same shape as
// lib/election/resultsCache.mjs, generalised so the data EVERY page render reads
// (SystemConfig row, DB template, home turnout) shares one implementation.
//
// Why: measured 2026-10-03 with a Prisma query trace of one SSR render —
// GET /        = 7 queries (4x SystemConfig, candidates, 2x User counts over 3,000 rows)
// GET /results = 3 queries (3x SystemConfig: generateMetadata + layout twice)
// and the reload storm (800 tabs in 20 s, scripts/load/read-load.mjs) renders
// pages at only ~23/s with p95 ~1.3 s. Every render re-read rows that change a few
// times a day.
//
// Rules this keeps:
//   • generation counter — bust() bumps it; a value computed under an older
//     generation is never stored, so a read that started before an admin write
//     cannot land after the bust and serve the old value for another TTL.
//   • single-flight — concurrent misses share one load (no stampede at expiry).
//   • failures are never cached; the next caller retries.
//   • state is on globalThis (route bundles may each get their own copy of this
//     module; the admin route's bust must reach the copy the page reads).
//   • per PROCESS only. With several instances, an admin write is visible on the
//     writing instance at once and on the others within one TTL.
// Never put anything per-user in here (sessions, voter status, form state).

function registry() {
  if (!globalThis.__fmsTtlCaches) globalThis.__fmsTtlCaches = new Map();
  return globalThis.__fmsTtlCaches;
}

// A named cache. `ttlMs` is fixed per name on first use.
export function ttlCache(name, ttlMs) {
  const reg = registry();
  if (!reg.has(name)) reg.set(name, { ttlMs, gen: 0, entries: new Map() });
  const c = reg.get(name);

  return {
    // key: any string ('' for singletons). loader: () => Promise<value>.
    async get(key, loader, now = () => Date.now()) {
      const hit = c.entries.get(key);
      if (hit && hit.done && now() - hit.at < c.ttlMs) return hit.value;
      if (hit && !hit.done && hit.gen === c.gen) return hit.promise;

      const gen = c.gen;
      const entry = { gen, done: false, at: 0, value: undefined, promise: null };
      entry.promise = Promise.resolve()
        .then(loader)
        .then(
          (value) => {
            // stored only if nothing busted meanwhile and this entry is still current
            if (gen === c.gen && c.entries.get(key) === entry) {
              entry.done = true; entry.value = value; entry.at = now();
            } else if (c.entries.get(key) === entry) {
              c.entries.delete(key);
            }
            return value;
          },
          (err) => {
            if (c.entries.get(key) === entry) c.entries.delete(key);
            throw err;
          },
        );
      c.entries.set(key, entry);
      return entry.promise;
    },
    bust() {
      c.gen += 1;
      c.entries.clear();
    },
  };
}

// Bust every named cache in this process (admin writes that can touch any of them).
export function bustAllTtlCaches() {
  for (const c of registry().values()) {
    c.gen += 1;
    c.entries.clear();
  }
}
