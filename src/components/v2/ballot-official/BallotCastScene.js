"use client";

// BallotCastScene — what the voter sees between confirming and the success page
// in the ballot-official family: their ballot is folded and sent into the online
// box, the slot lights as it passes, and the box confirms receipt.
//
// Presentation only (same contract as VoteCastScene): useVoteCast owns the
// submit, the minimum hold and the navigation; this never turns an animation
// into a vote result. The illustrated ballot is blank on purpose — the choice is
// never drawn outside the voter's own ballot and confirm step.
//
// Phases: "pending" (sending) → "confirmed" (the server accepted the ballot).

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion"; // Motion for React
import { Check } from "lucide-react";
import { useGlobalConfig } from "../../../contexts/GlobalConfigContext";
import { ballotOfficialTemplate, BALLOT_OFFICIAL as P } from "../../admin/editor/templates/builtIn/ballot-official";
import { ballotMeta } from "./BallotChrome";
import BallotBox from "./BallotBox";

const EASE = [0.16, 1, 0.3, 1];

export default function BallotCastScene({ phase = "pending", reduced = false }) {
  const prefer = useReducedMotion();
  const quiet = reduced || prefer;
  const meta = ballotMeta(useGlobalConfig() || {});
  const k = ballotOfficialTemplate.copy.cast;
  const j = ballotOfficialTemplate.copy.journey;
  const overlay = useRef(null);

  // focus moves into the scene and returns afterwards (same as VoteCastScene)
  useEffect(() => {
    const previous = document.activeElement;
    overlay.current?.focus({ preventScroll: true });
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);

  // timeline (s): fold 0.15–0.55 · send 0.6–1.0 · slot glow at 0.85
  return (
    <motion.div ref={overlay} role="dialog" aria-modal="true" aria-label={k.pending} tabIndex={-1}
      onKeyDown={(e) => { if (e.key === "Tab") e.preventDefault(); }}
      className="fms-app bcs" data-vote-cast="ballot-official" data-phase={phase}
      initial={{ opacity: quiet ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: quiet ? 0 : 0.2 }}>
      <div className="bcs__stage" aria-hidden>
        <div className="bcs__window">
          <motion.div className="bcs__ballot"
            initial={false} animate={quiet ? { y: 140 } : { y: [0, 0, 140] }}
            transition={{ duration: quiet ? 0 : 1, times: [0, 0.6, 1], ease: EASE }}>
            <motion.div className="bcs__top" style={{ transformPerspective: 900 }}
              initial={false} animate={quiet ? { rotateX: -180 } : { rotateX: [0, 0, -180] }}
              transition={{ duration: quiet ? 0 : 0.55, times: [0, 0.27, 1], ease: EASE }}>
              <div className="bcs__face bcs__face--front"><i className="is-head" /><i /></div>
              <div className="bcs__face bcs__face--back" />
            </motion.div>
            <div className="bcs__bottom"><i /><i /></div>
          </motion.div>
        </div>
        <div className="bcs__box">
          <BallotBox idPrefix="bcs" label={j.ch3Box} wordmark={meta.wordmark}
            glow={quiet ? 0 : phase === "confirmed" ? 0.35 : 0} />
          {/* the receipt: a check rises out of the slot once the server accepts */}
          {phase === "confirmed" && (
            <motion.span className="bcs__ok" initial={quiet ? false : { opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: EASE }}>
              <Check size={22} strokeWidth={3} />
            </motion.span>
          )}
        </div>
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className="bcs__msg">
        <p className="bcs__title">{phase === "confirmed" ? k.confirmed : k.pending}</p>
        <p className="bcs__note">{k.note}</p>
      </div>

      <style jsx global>{`
        .bcs {
          position: fixed; inset: 0; z-index: 200000; display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 36px; padding: 24px; outline: none; background: ${P.board}; color: ${P.ink};
          font-family: var(--font-noto-thai), 'Noto Sans Thai', system-ui, sans-serif;
        }
        .bcs__stage { position: relative; width: 300px; height: 440px; max-width: 100%; }
        .bcs__window { position: absolute; left: 0; right: 0; top: 0; height: 279px; overflow: hidden; perspective: 900px; z-index: 2; }
        .bcs__ballot { position: absolute; left: 75px; width: 150px; top: 84px; transform-style: preserve-3d; }
        .bcs__top { position: relative; height: 95px; transform-origin: 50% 100%; transform-style: preserve-3d; z-index: 2; }
        .bcs__face {
          position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden;
          background: #fff; border-radius: 5px 5px 0 0; padding: 14px; display: flex; flex-direction: column; gap: 12px;
          box-shadow: 0 0 0 1px rgba(46,20,60,.07);
        }
        .bcs__face--back { transform: rotateX(180deg); border-radius: 0 0 5px 5px; background: linear-gradient(#F3EEF6, #E9E1EF); }
        .bcs__bottom {
          height: 95px; background: #fff; border-radius: 0 0 5px 5px; padding: 8px 14px; display: flex; flex-direction: column; gap: 12px;
          box-shadow: 0 0 0 1px rgba(46,20,60,.07), 0 18px 30px -18px rgba(46,20,60,.45);
        }
        .bcs i { display: block; height: 8px; border-radius: 4px; background: ${P.rule}; }
        .bcs i.is-head { width: 62%; background: ${P.plum}; }
        .bcs__box { position: absolute; left: 0; right: 0; top: 250px; height: 190px; z-index: 1; }
        .bcs__ok {
          position: absolute; left: 50%; top: -34px; margin-left: -22px; width: 44px; height: 44px; border-radius: 50%;
          display: grid; place-items: center; background: ${P.pen}; color: #fff; box-shadow: 0 10px 24px -10px rgba(36,71,196,.8);
        }
        .bcs__msg { text-align: center; max-width: 22rem; }
        .bcs__title { margin: 0; font-size: 20px; font-weight: 800; }
        .bcs__note { margin: 8px 0 0; font-size: 14px; color: ${P.muted}; }
        @media (max-height: 640px) { .bcs__stage { transform: scale(.8); margin: -40px 0; } }
      `}</style>
    </motion.div>
  );
}
