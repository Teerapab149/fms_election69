"use client";

import { useState, useEffect, useCallback } from "react";
import { getPath } from "../utils/basePath";

/**
 * Single shared source for /api/check-status (P2 consolidation, 2026-06-12).
 *
 * Why: the NextAuth JWT caches isVoted until re-login, so every page mounted its
 * own fetch to get the live value — N identical requests per navigation (results
 * even fetched twice). This module caches the response for a short TTL and
 * dedupes concurrent requests, so all consumers on a page share ONE request.
 *
 * The cache is module-level (per browser tab). Hard navigations (e.g. the
 * vote → success redirect uses window.location) reset it naturally; for
 * client-side transitions the TTL keeps it fresh enough. After a successful
 * vote call invalidateVoteStatus() so the next read can't be stale.
 *
 * Two consumption styles:
 *   - useVoteStatus({ enabled })  — declarative, for simple "am I voted?" UI.
 *   - fetchVoteStatus({ force })  — imperative, for sequenced access-control
 *     flows (vote gate, results) that must keep their existing ordering.
 *     Pass force:true where staleness is not acceptable (the vote-page gate).
 */

const TTL_MS = 15_000;

let cache = { data: null, ts: 0, promise: null };

export function invalidateVoteStatus() {
  cache = { data: null, ts: 0, promise: null };
}

export async function fetchVoteStatus({ force = false } = {}) {
  if (!force && cache.data && Date.now() - cache.ts < TTL_MS) return cache.data;
  if (cache.promise) return cache.promise;

  cache.promise = (async () => {
    try {
      const res = await fetch(getPath("/api/check-status"), { cache: "no-store" });
      if (!res.ok) throw new Error(`check-status failed: ${res.status}`);
      const data = await res.json();
      cache = { data, ts: Date.now(), promise: null };
      return data;
    } catch (err) {
      cache.promise = null;
      throw err;
    }
  })();

  return cache.promise;
}

export function useVoteStatus({ enabled = true, force = false } = {}) {
  const [data, setData] = useState(cache.data);
  const [isLoading, setIsLoading] = useState(enabled && !cache.data);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const d = await fetchVoteStatus({ force: true });
    setData(d);
    return d;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    let alive = true;
    if (!cache.data) setIsLoading(true);
    fetchVoteStatus({ force })
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((err) => {
        if (alive) setError(err);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [enabled, force]);

  return {
    status: data,
    isVoted: data?.isVoted === true,
    isLoading,
    error,
    refresh,
  };
}
