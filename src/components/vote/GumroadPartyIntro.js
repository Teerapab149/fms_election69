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
//     if motion/JS is unavailable the page underneath still shows; this just wipes away.
//   - Auto-dismisses after durationMs, or on click/Esc. Calls onDone exactly once.
//   - Always plays the full animation (product decision). A static reduced-motion
//     fallback path is still wired (rm/rt helpers + the `reduce` flag) — flip
//     `reduce` back to `useReducedMotion()` to honour the OS "reduce motion" setting.
//
// Choreography (full-motion): ink ticker bars slam in top + bottom → stickers stamp →
// big party number slams down (spring) → party name reveals under a lime marker swipe →
// slogan + hint rise → hold → the whole panel wipes UP to reveal the party page.

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];       // ease-out-expo
const EASE_IO = [0.76, 0, 0.24, 1];   // ease-in-out for wipes

export default function GumroadPartyIntro({ party = {}, onDone = () => {}, durationMs = 3400, variant = "stamp" }) {
  // Product decision: always play the full intro animation for everyone (the user
  // wants the cinematic show). Flip this back to `useReducedMotion()` if the OS
  // "reduce motion" setting should be honoured (static fallback path stays wired).
  const reduce = false;
  const calledRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    if (calledRef.current) return;
    calledRef.current = true;
    setLeaving(true);
    setTimeout(onDone, reduce ? 0 : 620); // let the wipe-up play (instant for reduced-motion)
  };

  useEffect(() => {
    const t = setTimeout(finish, reduce ? 1700 : durationMs); // reduce: hold the static frame, then go
    const onKey = (e) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = party?.name || "พรรคของคุณ";
  const number = party?.number;
  const slogan = party?.slogan;
  const hasNo = number != null && number > 0;

  const TICK = ["★ FMS ELECTION", "SAMO", "OFFICIAL PARTY", "CAST YOUR VOTE", "พรรคเดียวที่ลงสมัคร"];
  const ticks = TICK.concat(TICK, TICK);

  // reduced-motion: skip entrance animation (render at rest) + zero-duration transitions
  const rm = (initial) => (reduce ? false : initial);
  const rt = (t) => (reduce ? { duration: 0 } : t);

  return (
    <motion.div
      className="gsi-intro"
      role="presentation"
      onClick={finish}
      initial={{ y: 0 }}
      animate={{ y: leaving ? "-101%" : 0 }}
      transition={{ duration: reduce ? 0 : 0.6, ease: EASE_IO }}
    >
      {/* ink ticker bars slam in from the edges */}
      <motion.div className="gsi-bar gsi-bar--top" initial={rm({ y: "-100%" })} animate={{ y: 0 }} transition={rt({ duration: 0.45, ease: EASE })}>
        <div className="gsi-tick"><span>{ticks.map((t, i) => <em key={i}>{t}<i /></em>)}</span></div>
      </motion.div>
      <motion.div className="gsi-bar gsi-bar--bottom" initial={rm({ y: "100%" })} animate={{ y: 0 }} transition={rt({ duration: 0.45, ease: EASE })}>
        <div className="gsi-tick gsi-tick--rev"><span>{ticks.map((t, i) => <em key={i}>{t}<i /></em>)}</span></div>
      </motion.div>

      {/* floating chunky shapes (decor) — motion only */}
      {!reduce && (
        <>
          <motion.span className="gsi-shape gsi-shape--lime" animate={{ y: [0, -16, 0], rotate: [0, 8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} />
          <motion.span className="gsi-shape gsi-shape--pink" animate={{ y: [0, 14, 0], rotate: [-6, 6, -6] }} transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }} />
          <motion.span className="gsi-shape gsi-shape--sky" animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
        </>
      )}

      <div className="gsi-stage">
        <div className="gsi-stickers">
          <motion.span className="gsi-sticker gsi-sticker--lime"
            initial={rm({ opacity: 0, scale: 0.5, rotate: -10 })} animate={{ opacity: 1, scale: 1, rotate: -3 }} transition={rt({ duration: 0.4, ease: EASE, delay: 0.35 })}>
            ★ OFFICIAL PARTY
          </motion.span>
          <motion.span className="gsi-sticker"
            initial={rm({ opacity: 0, scale: 0.5, rotate: 8 })} animate={{ opacity: 1, scale: 1, rotate: 2 }} transition={rt({ duration: 0.4, ease: EASE, delay: 0.48 })}>
            <span className="gsi-dot" /> พรรคเดียวที่ลงสมัคร
          </motion.span>
        </div>

        {hasNo && (
          <motion.div className="gsi-no"
            initial={rm({ opacity: 0, scale: 1.9, rotate: 10 })}
            animate={{ opacity: 1, scale: 1, rotate: -4 }}
            transition={rt({ type: "spring", stiffness: 240, damping: 15, delay: 0.55 })}>
            {number}
          </motion.div>
        )}

        {/* party name revealed under a lime marker swipe */}
        <div className="gsi-name">
          <motion.div className="gsi-name__clip"
            initial={rm({ clipPath: "inset(0 100% 0 0)" })} animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={rt({ duration: 0.62, ease: EASE_IO, delay: 1.0 })}>
            {name}
          </motion.div>
          {!reduce && (
            <motion.span className="gsi-name__swipe"
              initial={{ x: "-115%" }} animate={{ x: "115%" }} transition={{ duration: 0.72, ease: EASE_IO, delay: 0.98 }} />
          )}
        </div>

        {slogan ? (
          <motion.p className="gsi-slogan" initial={rm({ opacity: 0, y: 18 })} animate={{ opacity: 1, y: 0 }} transition={rt({ duration: 0.5, ease: EASE, delay: 1.55 })}>
            &ldquo;{slogan}&rdquo;
          </motion.p>
        ) : null}

        <motion.span className="gsi-hint" initial={rm({ opacity: 0 })} animate={{ opacity: 1 }} transition={rt({ duration: 0.5, delay: 1.95 })}>
          แตะเพื่อเข้าสู่หน้าพรรค · TAP TO ENTER
        </motion.span>
      </div>

      <style jsx global>{`
        .gsi-intro{
          position:fixed; inset:0; z-index:9000; overflow:hidden; cursor:pointer; color:var(--ink, #26271c); text-align:center;
          display:grid; place-items:center; background:var(--cream, #FFF6EC);
          background-image:
            radial-gradient(circle at 14% 16%, #FFD1F2 0, transparent 42%),
            radial-gradient(circle at 86% 84%, #DCF2FF 0, transparent 44%),
            radial-gradient(circle at 84% 14%, #DFFFC2 0, transparent 38%);
        }
        .gsi-bar{ position:absolute; left:0; right:0; height:46px; background:var(--ink, #26271c); color:var(--cream, #FFF6EC); overflow:hidden; display:flex; align-items:center;
          font-family:var(--fd,var(--font-archivo)); font-size:20px; letter-spacing:.02em; }
        .gsi-bar--top{ top:0; border-bottom:2.5px solid var(--ink, #26271c); }
        .gsi-bar--bottom{ bottom:0; border-top:2.5px solid var(--ink, #26271c); }
        .gsi-tick > span{ display:inline-flex; white-space:nowrap; animation:gsiTick 18s linear infinite; }
        .gsi-tick--rev > span{ animation-direction:reverse; }
        .gsi-tick em{ display:inline-flex; align-items:center; font-style:normal; }
        .gsi-tick i{ width:8px; height:8px; border-radius:999px; background:var(--pink, #FF9CE9); margin:0 22px; }
        @keyframes gsiTick{ 0%{transform:translateX(0)} 100%{transform:translateX(-33.33%)} }

        .gsi-shape{ position:absolute; border:3px solid var(--ink, #26271c); box-shadow:6px 6px 0 var(--ink, #26271c); }
        .gsi-shape--lime{ top:18%; left:10%; width:64px; height:64px; background:var(--lime, #C2F47E); border-radius:18px; }
        .gsi-shape--pink{ bottom:20%; right:12%; width:54px; height:54px; background:var(--pink, #FF9CE9); border-radius:999px; }
        .gsi-shape--sky{ top:24%; right:16%; width:46px; height:46px; background:var(--sky, #B6E6FF); border-radius:14px; }

        .gsi-stage{ position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; gap:18px; padding:24px; max-width:960px; }
        .gsi-stickers{ display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
        .gsi-sticker{ display:inline-flex; align-items:center; gap:8px; padding:8px 18px; background:#FFF; border:2.5px solid var(--ink, #26271c);
          border-radius:999px; font-family:var(--fb,var(--font-anuphan)); font-weight:700; font-size:14px; box-shadow:3px 3px 0 var(--ink, #26271c); }
        .gsi-sticker--lime{ background:var(--lime, #C2F47E); }
        .gsi-dot{ width:9px; height:9px; border-radius:999px; background:var(--coral, #FF8A8A); box-shadow:0 0 0 0 rgba(255,110,110,.7); animation:gsiPulse 1.6s ease-out infinite; }
        @keyframes gsiPulse{ 0%{box-shadow:0 0 0 0 rgba(255,110,110,.7)} 70%{box-shadow:0 0 0 12px rgba(255,110,110,0)} 100%{box-shadow:0 0 0 0 rgba(255,110,110,0)} }

        .gsi-no{ font-family:var(--fd,var(--font-archivo)); font-size:clamp(64px,15vw,150px); line-height:.9;
          background:var(--pink, #FF9CE9); border:3px solid var(--ink, #26271c); border-radius:26px; padding:6px 30px; box-shadow:8px 8px 0 var(--ink, #26271c); }

        .gsi-name{ position:relative; display:inline-block; max-width:90vw; }
        .gsi-name__clip{ font-family:var(--fd,var(--font-archivo),var(--font-anuphan)); font-size:clamp(34px,8vw,96px);
          line-height:.94; letter-spacing:-.03em; text-transform:uppercase; text-wrap:balance; }
        .gsi-name__swipe{ position:absolute; top:-4%; bottom:-4%; left:0; width:60%; background:var(--lime, #C2F47E); mix-blend-mode:multiply; pointer-events:none; }

        .gsi-slogan{ font-family:var(--fb,var(--font-anuphan)); font-style:italic; font-size:clamp(15px,2.6vw,22px); color:var(--ink2, #5c5a4b); margin:2px 0 0; max-width:640px; }
        .gsi-hint{ margin-top:14px; font-family:var(--fm,var(--font-space-grotesk),monospace); font-size:12px; letter-spacing:.18em; text-transform:uppercase; color:var(--ink2, #5c5a4b); }

        @media (max-width:560px){ .gsi-shape{ display:none; } .gsi-bar{ height:38px; font-size:16px; } }
      `}</style>
    </motion.div>
  );
}
