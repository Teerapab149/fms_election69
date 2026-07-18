"use client";

// StudioDarkPartyIntro — cinematic "single-party presentation" opener for the
// Studio Dark v2 template. Same swappable-intro contract as GumroadPartyIntro:
//
//   <StudioDarkPartyIntro party={party} onDone={fn} durationMs? />
//   - OVERLAY on already-rendered content (never gates page visibility).
//   - Auto-dismisses after durationMs, or on click/Esc. Calls onDone exactly once.
//   - Always plays the full animation (same product decision as gumroad);
//     the static reduced-motion path stays wired via the `reduce` flag.
//
// Deliberately does NOT repeat the page header (owner feedback 2026-06-12:
// first cut showed the same giant sans numeral + name + slogan twice). This is
// a distinct moment: mono eyebrow → oversized SERIF-ITALIC "№ 01." (Instrument
// Serif numerals — a different voice from the header's sans) → party name in
// small caps → a lime progress hairline that fills over durationMs (a visible
// timer, doubles as the "this will pass" cue) → wipe-up exit.

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];      // ease-out-expo
const EASE_IO = [0.76, 0, 0.24, 1];  // ease-in-out for wipes

const pad2 = (n) => String(n ?? 0).padStart(2, "0");

export default function StudioDarkPartyIntro({ party = {}, onDone = () => {}, durationMs = 3400 }) {
  // Product decision (matches GumroadPartyIntro): always play the full intro.
  // Flip to `useReducedMotion()` to honour the OS setting — fallback stays wired.
  const reduce = false;
  const calledRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    if (calledRef.current) return;
    calledRef.current = true;
    setLeaving(true);
    setTimeout(onDone, reduce ? 0 : 640); // let the wipe-up play
  };

  useEffect(() => {
    const t = setTimeout(finish, reduce ? 1700 : durationMs);
    const onKey = (e) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = party?.name || "พรรคของคุณ";
  const no = pad2(party?.number);

  // reduced-motion: render at rest + zero-duration transitions
  const rm = (initial) => (reduce ? false : initial);
  const rt = (t) => (reduce ? { duration: 0 } : t);

  return (
    <motion.div
      className="sdi-intro"
      role="presentation"
      onClick={finish}
      initial={{ y: 0 }}
      animate={{ y: leaving ? "-101%" : 0 }}
      transition={{ duration: reduce ? 0 : 0.62, ease: EASE_IO }}
    >
      {/* corner mono marks */}
      <motion.span className="sdi-corner sdi-corner--tl"
        initial={rm({ opacity: 0 })} animate={{ opacity: 1 }} transition={rt({ duration: 0.4, delay: 0.45 })}>
        FMS ELECTION · SAMO
      </motion.span>
      <motion.span className="sdi-corner sdi-corner--tr"
        initial={rm({ opacity: 0 })} animate={{ opacity: 1 }} transition={rt({ duration: 0.4, delay: 0.45 })}>
        № {no}
      </motion.span>
      <motion.span className="sdi-corner sdi-corner--bl"
        initial={rm({ opacity: 0 })} animate={{ opacity: 1 }} transition={rt({ duration: 0.4, delay: 0.45 })}>
        SINGLE-PARTY VOTE
      </motion.span>
      <motion.span className="sdi-corner sdi-corner--br"
        initial={rm({ opacity: 0 })} animate={{ opacity: 1 }} transition={rt({ duration: 0.4, delay: 0.45 })}>
        ONE VOTE ONLY
      </motion.span>

      <div className="sdi-stage">
        <motion.div className="sdi-eyebrow"
          initial={rm({ opacity: 0, y: 14 })} animate={{ opacity: 1, y: 0 }} transition={rt({ duration: 0.45, ease: EASE, delay: 0.25 })}>
          <span className="sdi-dot" /> OFFICIAL VOTE · พรรคเดียวที่ลงสมัคร
        </motion.div>

        {/* oversized serif-italic numeral — a different voice from the page header */}
        <div className="sdi-no" aria-hidden="true">
          <motion.span className="sdi-no__clip"
            initial={rm({ clipPath: "inset(100% 0 0 0)", y: 56 })}
            animate={{ clipPath: "inset(-10% 0 0 0)", y: 0 }}
            transition={rt({ duration: 0.9, ease: EASE, delay: 0.5 })}>
            <span className="sdi-no__sign">№</span> {no}<span className="sdi-no__dot">.</span>
          </motion.span>
        </div>

        {/* party name — small caps, quiet, under a hairline */}
        <motion.div className="sdi-namewrap"
          initial={rm({ opacity: 0 })} animate={{ opacity: 1 }} transition={rt({ duration: 0.4, delay: 1.25 })}>
          <motion.span className="sdi-namerule"
            initial={rm({ scaleX: 0 })} animate={{ scaleX: 1 }} transition={rt({ duration: 0.55, ease: EASE_IO, delay: 1.25 })} />
          <motion.h1 className="sdi-name"
            initial={rm({ opacity: 0, y: 14 })} animate={{ opacity: 1, y: 0 }} transition={rt({ duration: 0.5, ease: EASE, delay: 1.45 })}>
            {name}
          </motion.h1>
        </motion.div>

        <motion.span className="sdi-hint"
          initial={rm({ opacity: 0 })} animate={{ opacity: 1 }} transition={rt({ duration: 0.5, delay: 1.95 })}>
          TAP TO ENTER · แตะเพื่อเข้าสู่หน้าลงคะแนน
        </motion.span>
      </div>

      {/* progress hairline — fills over durationMs (the visible timer) */}
      <div className="sdi-progress">
        <motion.span className="sdi-progress__fill"
          initial={rm({ scaleX: 0 })} animate={{ scaleX: 1 }}
          transition={rt({ duration: (durationMs - 600) / 1000, ease: "linear", delay: 0.3 })} />
      </div>

      <style jsx global>{`
        .sdi-intro {
          position:fixed; inset:0; z-index:9000; overflow:hidden; cursor:pointer;
          display:grid; place-items:center; text-align:center;
          background:
            radial-gradient(ellipse 70% 45% at 50% 0%, rgba(213,255,63,.05), transparent 60%),
            var(--sd-bg, #14140F);
          color:var(--sd-ink, #F2EDDF);
        }
        .sdi-corner {
          position:absolute; font-family:var(--sd-mono, ui-monospace, monospace); font-size:10px;
          letter-spacing:.22em; text-transform:uppercase; color:var(--sd-ink-3, #7F7A6E);
        }
        .sdi-corner--tl { top:28px; left:32px; }
        .sdi-corner--tr { top:28px; right:32px; color:var(--sd-accent, #D5FF3F); }
        .sdi-corner--bl { bottom:28px; left:32px; }
        .sdi-corner--br { bottom:28px; right:32px; }

        .sdi-stage { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; gap:0; padding:24px; max-width:1000px; }

        .sdi-eyebrow {
          display:inline-flex; align-items:center; gap:10px;
          font-family:var(--sd-mono, ui-monospace, monospace); font-size:11px; letter-spacing:.2em;
          text-transform:uppercase; color:var(--sd-ink-2, #B5B0A2); margin-bottom:4px;
        }
        .sdi-dot { width:7px; height:7px; border-radius:999px; background:var(--sd-accent, #D5FF3F); animation:sdiPulse 1.8s ease-out infinite; }
        @keyframes sdiPulse { 0%{box-shadow:0 0 0 0 rgba(213,255,63,.5)} 70%{box-shadow:0 0 0 12px rgba(213,255,63,0)} 100%{box-shadow:0 0 0 0 rgba(213,255,63,0)} }
        @media (prefers-reduced-motion: reduce) { .sdi-dot { animation:none; } }

        .sdi-no { line-height:1; }
        .sdi-no__clip {
          display:inline-block; font-family:var(--sd-serif, 'Instrument Serif', serif);
          font-style:italic; font-weight:400;
          font-size:clamp(130px, 24vw, 300px); line-height:1.05; letter-spacing:-.02em;
          padding-right: .08em; /* keep the italic overhang of the final digit inside the clip */
        }
        .sdi-no__sign { font-size:.32em; vertical-align:.9em; color:var(--sd-ink-3, #7F7A6E); letter-spacing:0; margin-right:.06em; }
        .sdi-no__dot { color:var(--sd-accent, #D5FF3F); font-style:normal; }

        .sdi-namewrap { display:flex; flex-direction:column; align-items:center; gap:18px; margin-top:8px; }
        .sdi-namerule { width:56px; height:1px; background:var(--sd-accent, #D5FF3F); transform-origin:center; display:block; }
        .sdi-name {
          font-family:var(--sd-sans, 'Inter', sans-serif); font-weight:400; margin:0;
          font-size:clamp(18px, 2.6vw, 30px); letter-spacing:.14em; text-transform:uppercase;
          line-height:1.25; text-wrap:balance; color:var(--sd-ink, #F2EDDF);
        }
        .sdi-hint {
          margin-top:34px; font-family:var(--sd-mono, ui-monospace, monospace); font-size:10px;
          letter-spacing:.24em; text-transform:uppercase; color:var(--sd-ink-3, #7F7A6E);
        }

        .sdi-progress {
          position:absolute; left:50%; bottom:72px; transform:translateX(-50%);
          width:min(320px, 60vw); height:1px; background:var(--sd-line-strong, #3E3E2D);
        }
        .sdi-progress__fill { position:absolute; inset:0; background:var(--sd-accent, #D5FF3F); transform-origin:left center; display:block; }

        @media (max-width:560px) {
          .sdi-corner--tl, .sdi-corner--bl { left:16px; }
          .sdi-corner--tr, .sdi-corner--br { right:16px; }
          .sdi-name { letter-spacing:.08em; }
        }
      `}</style>
    </motion.div>
  );
}
