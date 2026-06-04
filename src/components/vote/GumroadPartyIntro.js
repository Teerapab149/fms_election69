"use client";

// GumroadPartyIntro — cinematic "single-party presentation" opener (gumroad theme).
//
// Forward-compatible by design: a SELF-CONTAINED overlay with a clean interface
// ( party + onDone + variant? ) so a future "swappable intro / page-transition"
// element system (Canva-style, picked from the admin library) can register this
// as one variant and others alongside it without touching the page that uses it.
//
// Contract:
//   <GumroadPartyIntro party={party} onDone={fn} durationMs? variant? />
//   - Always an OVERLAY on already-rendered content (never gates page visibility):
//     if motion/JS is unavailable the page underneath still shows; this just fades.
//   - Auto-dismisses after durationMs (default 2800), or on click/Esc, or instantly
//     under prefers-reduced-motion. Calls onDone exactly once.

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1]; // ease-out-expo-ish

export default function GumroadPartyIntro({ party = {}, onDone = () => {}, durationMs = 2800, variant = "stamp" }) {
  const reduce = useReducedMotion();
  const calledRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    if (calledRef.current) return;
    calledRef.current = true;
    setLeaving(true);
    // let the exit transition play, then hand control back
    setTimeout(onDone, reduce ? 0 : 420);
  };

  useEffect(() => {
    if (reduce) { finish(); return; }
    const t = setTimeout(finish, durationMs);
    const onKey = (e) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = party?.name || "พรรคของคุณ";
  const number = party?.number;
  const slogan = party?.slogan;

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const rise = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
  };
  const stamp = {
    hidden: { opacity: 0, scale: 0.6, rotate: -12 },
    show: { opacity: 1, scale: 1, rotate: -4, transition: { duration: 0.5, ease: EASE } },
  };

  return (
    <motion.div
      className="gsi-intro"
      role="presentation"
      onClick={finish}
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1, transition: { duration: 0.4, ease: "easeInOut" } }}
    >
      <motion.div className="gsi-intro__stage" variants={container} initial="hidden" animate="show">
        <motion.span className="gsi-intro__eyebrow" variants={rise}>
          <span className="gsi-intro__dot" /> พรรคเดียวที่ลงสมัคร · SINGLE PARTY
        </motion.span>

        {number != null && number > 0 && (
          <motion.div className="gsi-intro__no" variants={stamp}>{number}</motion.div>
        )}

        <motion.h1 className="gsi-intro__name" variants={rise}>{name}</motion.h1>

        {slogan ? <motion.p className="gsi-intro__slogan" variants={rise}>&ldquo;{slogan}&rdquo;</motion.p> : null}

        <motion.span className="gsi-intro__hint" variants={rise}>แตะเพื่อข้าม · TAP TO ENTER</motion.span>
      </motion.div>

      <style jsx global>{`
        .gsi-intro{
          position:fixed; inset:0; z-index:9000; display:grid; place-items:center;
          padding:24px; cursor:pointer; color:#1A1A1A; text-align:center;
          background:#FFF1E5;
          background-image:
            radial-gradient(circle at 14% 16%, #FFD1F2 0, transparent 40%),
            radial-gradient(circle at 86% 84%, #DCF2FF 0, transparent 42%),
            radial-gradient(circle at 84% 12%, #DFFFC2 0, transparent 36%);
        }
        .gsi-intro__stage{ display:flex; flex-direction:column; align-items:center; gap:14px; max-width:920px; }
        .gsi-intro__eyebrow{ display:inline-flex; align-items:center; gap:8px; padding:7px 16px; background:#FFF;
          border:2.5px solid #1A1A1A; border-radius:999px; font-family:var(--fb,var(--font-anuphan)); font-weight:700;
          font-size:13px; box-shadow:3px 3px 0 #1A1A1A; }
        .gsi-intro__dot{ width:9px; height:9px; border-radius:999px; background:#FF6E6E;
          box-shadow:0 0 0 0 rgba(255,110,110,.7); animation:gsiPulse 1.6s ease-out infinite; }
        @keyframes gsiPulse{ 0%{box-shadow:0 0 0 0 rgba(255,110,110,.7)} 70%{box-shadow:0 0 0 12px rgba(255,110,110,0)} 100%{box-shadow:0 0 0 0 rgba(255,110,110,0)} }
        .gsi-intro__no{ font-family:var(--fd,var(--font-archivo)); font-size:clamp(56px,12vw,120px); line-height:1;
          background:#FF90E8; border:3px solid #1A1A1A; border-radius:24px; padding:8px 26px; box-shadow:6px 6px 0 #1A1A1A; }
        .gsi-intro__name{ font-family:var(--fd,var(--font-archivo),var(--font-anuphan)); font-size:clamp(40px,9vw,108px);
          line-height:.92; letter-spacing:-.03em; margin:6px 0 0; text-transform:uppercase; text-wrap:balance; }
        .gsi-intro__slogan{ font-family:var(--fb,var(--font-anuphan)); font-style:italic; font-size:clamp(15px,2.4vw,21px);
          color:#4A4A4A; margin:4px 0 0; max-width:620px; }
        .gsi-intro__hint{ margin-top:18px; font-family:var(--fm,var(--font-space-grotesk),monospace); font-size:12px;
          letter-spacing:.18em; text-transform:uppercase; color:#4A4A4A; }
        @media (prefers-reduced-motion: reduce){ .gsi-intro{ display:none; } }
      `}</style>
    </motion.div>
  );
}
