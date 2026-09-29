"use client";

// BallotSuccess — the success page of the ballot-official family: the story's
// ending. The ballot went into the online box on the previous screen; what the
// voter keeps is its STUB, torn off along the perforation they have seen on every
// ballot in this template — their name, student number and the HOUR it was sent (never finer),
// stamped as used. Never the choice.
//
// Behaviour is the shared contract (same props as every family's success
// component): the evaluation form unlocks the results page; before it is done the
// primary action opens the form, after it the primary action goes to results.

import { motion, MotionConfig, useReducedMotion } from "framer-motion"; // Motion for React
import { Check, Lock } from "lucide-react";
import { getPath } from "../../../../utils/basePath";
import { useGlobalConfig } from "../../../../contexts/GlobalConfigContext";
import { evaluationPromptText } from "../../../../utils/activityHours";
import { ballotOfficialTemplate } from "../../../admin/editor/templates/builtIn/ballot-official";
import { ballotMeta, BallotHeader, BallotFooter, BallotBaseStyles } from "./BallotChrome";
import { hourWindow } from "../../shared/election/voteTime.mjs";

const EASE = [0.16, 1, 0.3, 1];

export default function BallotSuccess({ user = null, isUnlocked = false, onOpenForm = () => {}, editorMode = false }) {
  const gc = useGlobalConfig() || {};
  const meta = ballotMeta(gc);
  const s = ballotOfficialTemplate.copy.success;
  const reduce = useReducedMotion();
  const still = reduce || editorMode;

  // the stub says WHEN only as finely as the ballot row records it (rule 11)
  const recorded = hourWindow(user?.votedAt);

  return (
    <MotionConfig reducedMotion="user">
      <div className="fms-app bo-root">
        <BallotBaseStyles />
        <BallotHeader active="vote" editorMode={editorMode} />

        <main className="bs">
          <div className="bs__in">
            <section className="bs__story">
              <p className="bs__ok"><Check size={18} strokeWidth={3} aria-hidden /> {s.stubStamp}</p>
              <h1 className="bs__title">{s.title}</h1>
              <p className="bs__deck">{s.deck}</p>

              {/* the one thing left to do */}
              <div className="bs__next">
                <h2>{isUnlocked ? s.doneTitle : s.nextTitle}</h2>
                <p>{isUnlocked ? s.doneNote : evaluationPromptText(gc)}</p>
                <div className="bs__acts">
                  {isUnlocked ? (
                    <a className="bo-cta bs__primary" href={editorMode ? undefined : getPath("/results")}>{s.toResults}</a>
                  ) : (
                    <button type="button" className="bo-cta bs__primary" onClick={() => !editorMode && onOpenForm()}>{s.openForm}</button>
                  )}
                  <a className="bs__home" href={editorMode ? undefined : getPath("/")}>{s.home}</a>
                </div>
                <p className="bs__lock">
                  {isUnlocked ? <><Check size={14} aria-hidden /> {s.formDone}</> : <><Lock size={13} aria-hidden /> {s.lockNote}</>}
                </p>
              </div>
            </section>

            {/* the stub, torn off along the perforation */}
            <motion.aside className="bs__stub" aria-label={s.stubTitle}
              initial={still ? false : { y: -26, rotate: 0, opacity: 0 }}
              animate={{ y: 0, rotate: -2.5, opacity: 1 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}>
              <div className="bs__perf" aria-hidden />
              <div className="bs__stub-head">
                <b>{s.stubTitle}</b>
                <span>{meta.wordmark}</span>
              </div>
              <dl className="bs__fields">
                <div><dt>{s.stubVoter}</dt><dd>{user?.name || "—"}</dd></div>
                {user?.studentId && <div><dt>{s.stubId}</dt><dd className="bs__mono">{user.studentId}</dd></div>}
                {recorded && <div><dt>{s.stubTime}</dt><dd>{recorded}</dd></div>}
              </dl>
              {/* the stamp lands once the stub has settled */}
              <motion.span className="bs__stamp" aria-hidden
                initial={still ? false : { scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: EASE, delay: still ? 0 : 0.85 }}>
                <Check size={18} strokeWidth={3} /> {s.stubStamp}
              </motion.span>
              <p className="bs__privacy">{s.privacy}</p>
            </motion.aside>
          </div>
        </main>

        <BallotFooter meta={meta} />

        <style jsx global>{`
          .bs { background: linear-gradient(var(--bo-board), #E6DEEC); }
          .bs__in {
            max-width: var(--bo-max); margin: 0 auto; padding: 72px 20px 104px;
            display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); gap: 72px; align-items: center;
          }
          .bs__ok { display: inline-flex; align-items: center; gap: 8px; margin: 0; padding: 6px 14px; border-radius: 999px; background: rgba(36,71,196,.1); color: var(--bo-pen); font-weight: 700; font-size: 15px; }
          .bs__title { margin: 18px 0 0; font-size: clamp(34px, 4vw, 52px); font-weight: 800; line-height: 1.18; letter-spacing: -.015em; text-wrap: balance; }
          .bs__deck { margin: 14px 0 0; max-width: 32em; font-family: var(--bo-font-read); font-size: 17px; line-height: 1.75; color: var(--bo-muted); }
          .bs__next { margin-top: 36px; padding-top: 28px; border-top: 1px solid var(--bo-rule); max-width: 34em; }
          .bs__next h2 { margin: 0; font-size: 22px; font-weight: 800; }
          .bs__next > p { margin: 6px 0 0; font-size: 15.5px; line-height: 1.7; color: var(--bo-muted); }
          .bs__acts { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 24px; margin-top: 22px; }
          .bs__primary { width: auto; padding: 0 30px; }
          .bs__home { font-weight: 600; color: var(--bo-plum); border-bottom: 1.5px solid currentColor; padding-bottom: 1px; }
          .bs__lock { display: flex; align-items: center; gap: 6px; margin: 14px 0 0; font-size: 13px; color: var(--bo-muted); }

          /* the stub: the ballot's own paper, perforated along its top edge */
          .bs__stub {
            position: relative; justify-self: center; width: 100%; max-width: 400px; padding: 30px 28px 26px;
            background: var(--bo-paper); border-radius: 0 0 10px 10px;
            box-shadow: 0 0 0 1px rgba(46,20,60,.06), 0 30px 60px -32px rgba(46,20,60,.5);
          }
          .bs__perf {
            position: absolute; left: 0; right: 0; top: -1px; height: 10px;
            background: radial-gradient(circle at 6px 0, transparent 5px, var(--bo-paper) 5.5px) 0 0 / 12px 10px repeat-x;
            transform: translateY(-9px);
          }
          .bs__stub-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding-bottom: 14px; border-bottom: 2px dashed var(--bo-rule); }
          .bs__stub-head b { font-size: 18px; font-weight: 800; }
          .bs__stub-head span { font-weight: 700; color: var(--bo-plum); }
          .bs__fields { margin: 18px 0 0; display: grid; gap: 14px; }
          .bs__fields dt { font-size: 13px; color: var(--bo-muted); }
          .bs__fields dd { margin: 2px 0 0; font-size: 18px; font-weight: 700; overflow-wrap: anywhere; }
          .bs__mono { font-variant-numeric: tabular-nums; letter-spacing: .02em; }
          .bs__stamp {
            position: absolute; right: 22px; top: 76px; rotate: -10deg; display: inline-flex; align-items: center; gap: 6px;
            padding: 6px 14px 7px; border: 2.5px solid var(--bo-pen); border-radius: 8px; color: var(--bo-pen);
            font-size: 18px; font-weight: 800; background: rgba(255,255,255,.85);
          }
          .bs__privacy { margin: 22px 0 0; padding-top: 14px; border-top: 1px solid var(--bo-rule); font-size: 13px; line-height: 1.65; color: var(--bo-muted); }

          @media (max-width: 900px) {
            .bs__in { grid-template-columns: 1fr; gap: 44px; padding: 36px 16px 72px; }
          }
          @media (max-width: 640px) {
            .bs__title { font-size: 28px; margin-top: 14px; }
            .bs__deck { font-size: 15px; }
            .bs__next { margin-top: 24px; padding-top: 20px; }
            .bs__next h2 { font-size: 19px; }
            .bs__next > p { font-size: 14px; }
            .bs__acts { flex-direction: column; align-items: stretch; }
            .bs__primary { width: 100%; }
            .bs__home { align-self: center; }
            .bs__stub { padding: 26px 20px 22px; }
            .bs__stamp { top: 70px; right: 14px; font-size: 15px; }
            .bs__fields dd { font-size: 16px; }
          }
        `}</style>
      </div>
    </MotionConfig>
  );
}
