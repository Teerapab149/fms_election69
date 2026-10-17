'use client';

// One place that asks the server "what state is the election in", shared by
// the top bar and every tab, so the console does not poll the same endpoint
// from three components. Two things live here on purpose:
//   - election: GET /api/admin/dashboard every 5 seconds (paused while the
//     browser tab is hidden), with the time of the last good read and a
//     failure flag, so a dead connection never looks like a frozen number
//   - readiness: GET /api/admin/readiness once when the console opens, and
//     again only when someone presses the check button
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getPath } from "../../../utils/basePath";

const Ctx = createContext(null);

const POLL_MS = 5000;

export function ElectionStateProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const [readiness, setReadiness] = useState(null);
  const [readinessError, setReadinessError] = useState(null);
  const [readinessRunning, setReadinessRunning] = useState(false);
  const [readinessAt, setReadinessAt] = useState(null);

  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch(getPath("/api/admin/dashboard"), { credentials: "include", cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        window.location.href = getPath("/admin/login");
        return;
      }
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      if (!data.stats) throw new Error("no stats");
      setStats(data.stats);
      setLastUpdated(new Date());
      setFailed(false);
    } catch (e) {
      console.error("election state fetch failed:", e);
      setFailed(true);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
    const poll = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      refresh();
    }, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const runReadiness = useCallback(async () => {
    setReadinessRunning(true);
    setReadinessError(null);
    try {
      const res = await fetch(getPath("/api/admin/readiness"), { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error(`สถานะ ${res.status}`);
      const data = await res.json();
      setReadiness(data);
      setReadinessAt(new Date());
    } catch (e) {
      setReadinessError("ตรวจไม่สำเร็จ " + e.message);
    } finally {
      setReadinessRunning(false);
    }
  }, []);

  // once per console open, not once per tab visit
  useEffect(() => { runReadiness(); }, [runReadiness]);

  const value = useMemo(() => ({
    stats, lastUpdated, failed, now, refresh,
    readiness, readinessError, readinessRunning, readinessAt, runReadiness,
  }), [stats, lastUpdated, failed, now, refresh, readiness, readinessError, readinessRunning, readinessAt, runReadiness]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useElectionState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useElectionState must be used inside ElectionStateProvider");
  return v;
}
