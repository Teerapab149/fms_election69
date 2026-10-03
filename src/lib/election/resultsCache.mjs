// Shared snapshot of the PUBLIC /api/results body — no imports, so node:test can
// load it directly (scripts/smoke/resultsPolling.test.mjs).
//
// Why: every open /results tab polls that route, and one call is a candidate
// findMany, two counts and six groupBys against the same Postgres that takes the
// votes. Hundreds of tabs on announcement night = hundreds of those per second.
// /api/home-info solved the same problem with an in-process snapshot; this is
// that, plus two things a reveal needs:
//   • a generation counter — bustResultsSnap() bumps it, and a body computed
//     under an older generation is never stored. Otherwise a request that read
//     "revealed" just before the admin pressed hide could land after the bust
//     and serve the revealed tally for another TTL.
//   • single-flight — concurrent misses share one computation instead of each
//     running the nine queries (the stampede right after every expiry).
//
// State lives on globalThis, not in module scope: route bundles may each get
// their own copy of this module, and the dashboard's bust must reach the copy
// /api/results reads (same trick as the Prisma singleton in lib/db.js).
// Per process only — on a multi-instance deploy other instances catch up
// within one TTL.

import { bustAllTtlCaches } from "../cache/ttlCache.mjs";

export const RESULTS_SNAP_TTL_MS = 4000; // a reveal shows within one poll + 4 s

function state() {
  if (!globalThis.__fmsResultsSnap) {
    globalThis.__fmsResultsSnap = { gen: 0, at: 0, body: null, inflight: null };
  }
  return globalThis.__fmsResultsSnap;
}

export function resultsSnapGen() {
  return state().gen;
}

export function getSnap(now = Date.now()) {
  const s = state();
  if (s.body && now - s.at < RESULTS_SNAP_TTL_MS) return s.body;
  return null;
}

// Stores only if nothing busted the cache since `gen` was read. Returns whether
// it was stored.
export function setSnap(body, gen, now = Date.now()) {
  const s = state();
  if (gen !== s.gen) return false;
  s.body = body;
  s.at = now;
  return true;
}

// Call after anything that changes what /api/results returns (mode, reveal,
// certification, dates) so the change is not held back by the snapshot.
export function bustResultsSnap() {
  // The dashboard and global-config routes call this after EVERY successful write
  // (mode, reveal, certify, dates, settings), and those are also what the home /
  // layout caches (lib/cache/siteData) hold. Busting them here means those two
  // routes need no extra line and a later admin route cannot forget it.
  bustAllTtlCaches();
  const s = state();
  s.gen += 1;
  s.body = null;
  s.at = 0;
  s.inflight = null;
}

// Fresh snapshot, or the computation already running for this generation, or a
// new one. Only a body that resolved is stored; a rejection clears the slot so
// the next request tries again instead of inheriting the failure.
export function loadResultsSnap(compute, now = () => Date.now()) {
  const s = state();
  const hit = getSnap(now());
  if (hit) return Promise.resolve(hit);
  if (s.inflight && s.inflight.gen === s.gen) return s.inflight.promise;

  const gen = s.gen;
  const promise = Promise.resolve()
    .then(compute)
    .then(
      (body) => {
        setSnap(body, gen, now());
        if (s.inflight?.promise === promise) s.inflight = null;
        return body;
      },
      (err) => {
        if (s.inflight?.promise === promise) s.inflight = null;
        throw err;
      },
    );
  s.inflight = { gen, promise };
  return promise;
}
