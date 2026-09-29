"use client";

// The online ballot box — one object, used where the home page tells the story
// (journey chapter 3) and where it actually happens (the cast after confirming).
// A perspective top face with a slot that lights when a ballot passes through, a
// lock (the ballot is encrypted on the way in) and this election's name.
//
// `glow` is a number or a Motion value (0–1). The box is 300×190 in its own
// coordinates; the slot opening sits at y 24–34 of that, which is where a
// ballot's window must end for it to read as entering the slot.

import { motion } from "framer-motion"; // Motion for React
import { Lock } from "lucide-react";

export const BOX_SLOT_Y = 29; // slot centre, in box coordinates

export default function BallotBox({ glow = 0, label, wordmark, idPrefix = "bb" }) {
  const g = (n) => `${idPrefix}${n}`;
  return (
    <div className="bb">
      <svg className="bb__art" viewBox="0 0 300 190" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={g("Top")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--bo-plum-soft)" }} /><stop offset="1" style={{ stopColor: "var(--bo-plum-mid)" }} />
          </linearGradient>
          <linearGradient id={g("Front")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--bo-plum)" }} /><stop offset="1" style={{ stopColor: "var(--bo-plum-deeper)" }} />
          </linearGradient>
          <linearGradient id={g("Sheen")} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity=".16" /><stop offset=".45" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id={g("Blur")} x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="5" /></filter>
        </defs>
        <path d="M24 4 H276 L300 56 H0 Z" fill={`url(#${g("Top")})`} />
        <rect x="74" y="24" width="152" height="10" rx="5" style={{ fill: "var(--bo-night)" }} />
        <motion.rect x="70" y="20" width="160" height="18" rx="9" filter={`url(#${g("Blur")})`} style={{ opacity: glow, fill: "var(--bo-glow)" }} />
        <path d="M0 56 H300 V170 Q300 186 284 186 H16 Q0 186 0 170 Z" fill={`url(#${g("Front")})`} />
        <path d="M0 56 H300 V170 Q300 186 284 186 H16 Q0 186 0 170 Z" fill={`url(#${g("Sheen")})`} />
        <path d="M0 56.5 H300" stroke="#fff" strokeOpacity=".35" />
      </svg>
      <div className="bb__label">
        <Lock size={16} aria-hidden />
        <span>{label}</span>
        <b>{wordmark}</b>
      </div>
      <style jsx global>{`
        .bb { position: relative; width: 100%; height: 100%; }
        .bb__art { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
        .bb__label {
          position: absolute; left: 0; right: 0; top: 29.5%; bottom: 2%;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
          color: #fff; text-align: center;
        }
        .bb__label svg { opacity: .8; margin-bottom: 2px; }
        .bb__label span { font-size: 14px; font-weight: 500; opacity: .85; }
        .bb__label b { font-size: 28px; font-weight: 800; letter-spacing: -.01em; line-height: 1.15; }
      `}</style>
    </div>
  );
}
