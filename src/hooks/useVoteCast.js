"use client";

import { createElement, useEffect, useRef, useState } from "react";
import VoteCastScene from "../components/vote/VoteCastScene";

// Presentation only: the caller owns submission, errors and navigation. Never
// retry a vote here, and never turn an animation completion into a vote result.
export default function useVoteCast({ templateId = "original" } = {}) {
  const [phase, setPhase] = useState("idle");
  const [reduced, setReduced] = useState(false);
  const active = useRef(false);
  const mounted = useRef(true);
  const hold = useRef(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (hold.current) {
        clearTimeout(hold.current.timer);
        hold.current.resolve();
        hold.current = null;
      }
    };
  }, []);

  async function playCast(submit) {
    if (active.current || !mounted.current || typeof submit !== "function") return false;
    active.current = true;
    const quiet = typeof window === "undefined" || Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    setReduced(quiet);
    setPhase("pending");
    const minHold = quiet ? Promise.resolve() : new Promise((resolve) => {
      const timer = setTimeout(() => { hold.current = null; resolve(); }, 1000);
      hold.current = { timer, resolve };
    });

    let result = false;
    try { result = await submit(); } catch { result = false; }
    if (!result) {
      if (hold.current) {
        clearTimeout(hold.current.timer);
        hold.current.resolve();
        hold.current = null;
      }
      active.current = false;
      if (mounted.current) setPhase("idle");
      return false;
    }
    await minHold;
    if (!mounted.current) return false;
    setPhase("confirmed");
    // Keep the final frame and guard until the caller navigates/unmounts.
    return result;
  }

  return {
    playCast,
    castActive: phase !== "idle",
    sceneNode: phase === "idle" ? null : createElement(VoteCastScene, { family: templateId, phase, reduced }),
  };
}

export { useVoteCast };
