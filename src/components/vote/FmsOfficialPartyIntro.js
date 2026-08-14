"use client";

// FmsOfficialPartyIntro — the single-party opener for the FMS Official template.
//
// Same swappable-intro contract the other families use:
//
//   <FmsOfficialPartyIntro party={party} onDone={fn} durationMs? />
//   - OVERLAY on already-rendered content. It never gates page visibility, and
//     that is not a style preference: this project has shipped an invisible
//     ballot before by hanging content off a reveal that did not fire.
//   - Auto-dismisses after durationMs, or on click / Esc. onDone fires once.
//
// The composition is the family's own notice being posted, not a cinematic
// title card: the faculty mark, the 6px head rule drawing across, the party's
// number rising into the ghost slot it occupies everywhere else in this
// template, the name, then the whole sheet lifting away. Nothing here is a
// device the template did not already own — which is the point, because the
// screen it opens is the faculty's ballot and it has to read as theirs.
//
// Unlike the other families, this one honours prefers-reduced-motion for real
// rather than keeping the path wired and forcing the animation. It is the
// template meant to run the actual election for the whole faculty; a voter who
// has asked their OS for less motion gets the same composition, held still.

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { getPath } from "../../utils/basePath";

const EASE = [0.16, 1, 0.3, 1];       // ease-out-expo
const EASE_IO = [0.76, 0, 0.24, 1];   // ease-in-out, for the wipes

export default function FmsOfficialPartyIntro({
  party = {}, onDone = () => {}, durationMs = 3200,
}) {
  const reduce = useReducedMotion();
  const doneRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    setTimeout(onDone, reduce ? 0 : 620);   // let the sheet clear the screen
  };

  useEffect(() => {
    const t = setTimeout(finish, reduce ? 1400 : durationMs);
    const onKey = (e) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = party?.name || "";
  const no = party?.number ?? "";

  // at rest + zero-duration when the OS asks for less motion
  const rm = (initial) => (reduce ? false : initial);
  const rt = (t) => (reduce ? { duration: 0 } : t);

  return (
    <motion.div
      className="foi"
      role="presentation"
      onClick={finish}
      initial={{ y: 0 }}
      animate={{ y: leaving ? "-101%" : 0 }}
      transition={{ duration: reduce ? 0 : 0.6, ease: EASE_IO }}
    >
      {/* the number in the ghost slot it holds on every other screen of this
          template — clipped by the frame, weak enough that the name on top of
          it stays the thing being read */}
      {no !== "" && (
        <motion.span
          className="foi__ghost"
          aria-hidden
          initial={rm({ clipPath: "inset(100% 0 0 0)", y: 40 })}
          animate={{ clipPath: "inset(-12% 0 0 0)", y: 0 }}
          transition={rt({ duration: 0.95, ease: EASE, delay: 0.45 })}
        >
          {no}
        </motion.span>
      )}

      <div className="foi__stage">
        <motion.img
          className="foi__mark"
          src={getPath("/images/logo/09_FMS_Short_EN_V_PNG.png")}
          alt=""
          aria-hidden
          initial={rm({ opacity: 0, y: 10 })}
          animate={{ opacity: 0.92, y: 0 }}
          transition={rt({ duration: 0.5, ease: EASE, delay: 0.15 })}
        />

        {/* the masthead. It draws rather than appears — a rule being ruled. */}
        <motion.span
          className="foi__rule"
          aria-hidden
          initial={rm({ scaleX: 0 })}
          animate={{ scaleX: 1 }}
          transition={rt({ duration: 0.7, ease: EASE_IO, delay: 0.3 })}
        />

        <motion.span
          className="foi__kicker"
          initial={rm({ opacity: 0 })}
          animate={{ opacity: 1 }}
          transition={rt({ duration: 0.45, delay: 0.95 })}
        >
          หมายเลข {no === "" ? "—" : no}
        </motion.span>

        {/* a div, not an h1. The ballot underneath is already rendered and
            already has its own h1 — the question — so a heading here made two
            of them on one page, and this one is a curtain that wipes away in
            three seconds. The wrapper is role="presentation" for the same
            reason: nothing in here is page structure. */}
        <motion.div
          className="foi__name"
          initial={rm({ opacity: 0, y: 16 })}
          animate={{ opacity: 1, y: 0 }}
          transition={rt({ duration: 0.55, ease: EASE, delay: 1.1 })}
        >
          {name}
        </motion.div>

        <motion.p
          className="foi__sub"
          initial={rm({ opacity: 0 })}
          animate={{ opacity: 1 }}
          transition={rt({ duration: 0.45, delay: 1.45 })}
        >
          ผู้สมัครเพียงพรรคเดียว · โปรดพิจารณาก่อนลงคะแนน
        </motion.p>

        <motion.span
          className="foi__hint"
          initial={rm({ opacity: 0 })}
          animate={{ opacity: 1 }}
          transition={rt({ duration: 0.45, delay: 1.9 })}
        >
          แตะเพื่อข้าม
        </motion.span>
      </div>

      {/* fills over the duration — a visible timer, and the "this will pass"
          signal that stops the overlay reading as a stuck page */}
      <div className="foi__prog" aria-hidden>
        <motion.span
          className="foi__prog-fill"
          initial={rm({ scaleX: 0 })}
          animate={{ scaleX: 1 }}
          transition={rt({ duration: (durationMs - 550) / 1000, ease: "linear", delay: 0.25 })}
        />
      </div>

      <style jsx global>{`
        .foi {
          position: fixed; inset: 0; z-index: 9000; overflow: hidden; cursor: pointer;
          display: grid; place-items: center; text-align: center;
          background: var(--fo-plum, #5C2A52); color: #fff;
        }
        /* Same slot, same restraint as .fo-notice__ghost — bottom-right, clipped
           by the frame, and deliberately weak. */
        .foi__ghost {
          position: absolute; right: -.04em; bottom: -.28em; z-index: 0;
          font-size: clamp(240px, 40vw, 520px); font-weight: 700; line-height: .78;
          letter-spacing: -.06em; color: #fff; opacity: .09;
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
          pointer-events: none; user-select: none;
        }
        .foi__stage {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
          padding: 24px; max-width: 860px;
        }
        /* the repo's FMS marks are all dark-on-light colour PNGs; the footer
           already knocks them to a flat white this way, and it needs no new
           asset for the one place a plum field needs the mark */
        .foi__mark { height: 52px; width: auto; filter: brightness(0) invert(1); }
        .foi__rule {
          display: block; width: min(420px, 68vw); height: 6px; margin: 26px 0 0;
          background: #fff; opacity: .9; transform-origin: left center;
        }
        .foi__kicker {
          margin-top: 26px; font-size: 13px; font-weight: 500;
          letter-spacing: .16em; color: rgba(255,255,255,.72);
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
        }
        .foi__name {
          margin: 10px 0 0; font-size: clamp(28px, 4.6vw, 54px); font-weight: 600;
          line-height: 1.22; color: #fff; text-wrap: balance;
        }
        .foi__sub {
          margin: 14px 0 0; font-size: clamp(14px, 1.5vw, 16px); font-weight: 300;
          color: rgba(255,255,255,.8);
        }
        .foi__hint {
          margin-top: 40px; font-size: 12px; font-weight: 300;
          letter-spacing: .1em; color: rgba(255,255,255,.55);
        }
        .foi__prog {
          position: absolute; left: 50%; bottom: 64px; transform: translateX(-50%);
          width: min(300px, 56vw); height: 2px; background: rgba(255,255,255,.22);
        }
        .foi__prog-fill {
          position: absolute; inset: 0; display: block;
          background: #fff; transform-origin: left center;
        }

        @media (max-width: 620px) {
          .foi__mark { height: 40px; }
          .foi__rule { margin-top: 20px; height: 5px; }
          .foi__kicker { margin-top: 20px; font-size: 12px; }
          .foi__hint { margin-top: 30px; }
          .foi__prog { bottom: 44px; }
        }
      `}</style>
    </motion.div>
  );
}
