"use client";

// BallotClosed — the status page of the ballot-official family: the box is not
// open yet (waiting), open but not taking ballots for now (closed = paused), or
// closed for good (ended). Same props as every family's closed component; the
// title and message are decided by app/closed/page.js, so every family says the
// same thing about the same state.
//
// This is the page that gets screenshotted with "ทำไมเข้าไม่ได้", so it states
// facts: which state, the real open/close times from settings, and a countdown
// only when there is something real to count to.

import { MotionConfig } from "framer-motion"; // Motion for React
import { getPath } from "../../../../utils/basePath";
import { useGlobalConfig } from "../../../../contexts/GlobalConfigContext";
import { useElectionStatus } from "../../../../hooks/useElectionStatus";
import { formatThaiDate, formatThaiTime } from "../../../../utils/electionConfig";
import { ballotOfficialTemplate } from "../../../admin/editor/templates/builtIn/ballot-official";
import { ballotMeta, BallotHeader, BallotFooter, BallotBaseStyles, BallotCountdown } from "./BallotChrome";
import BallotBox from "./BallotBox";

export default function BallotClosed({
  title = "", desc = "", variant = "closed",
  session = null, onLogout = () => {}, editorMode = false,
}) {
  const globalConfig = useGlobalConfig() || {};
  const meta = ballotMeta(globalConfig);
  const k = ballotOfficialTemplate.copy.closed;
  const status = useElectionStatus({
    globalConfig,
    systemMode: variant === "closed" ? "PAUSE" : variant === "ended" ? "ENDED" : "AUTO",
    electionStatus: variant === "waiting" ? "WAITING" : null,
    tick: !editorMode,
  });
  const href = (h) => (editorMode ? undefined : getPath(h));
  const when = (d) => (d instanceof Date && !isNaN(d.getTime()) ? `${formatThaiDate(d)} เวลา ${formatThaiTime(d)}` : null);
  const openAt = when(status.start);
  const closeAt = when(status.end);
  const boxLabel = variant === "waiting" ? k.boxWaiting : variant === "ended" ? k.boxEnded : k.boxPaused;
  const counting = variant === "waiting" && status.target?.kind === "opens";

  return (
    <MotionConfig reducedMotion="user">
      <div className="fms-app bo-root">
        <BallotBaseStyles />
        <BallotHeader active="vote" editorMode={editorMode} />

        <main>
          <section className={`bcl bcl--${variant}`}>
            <div className="bcl__in">
              <div className="bcl__box">
                <BallotBox glow={0} label={boxLabel} wordmark={meta.wordmark} idPrefix="bcb" />
              </div>

              <h1 className="bcl__title">{title}</h1>
              {desc && <p className="bcl__desc">{desc}</p>}

              {counting && (
                <div className="bcl__cd"><BallotCountdown status={status} /></div>
              )}

              {(openAt || closeAt) && (
                <dl className="bcl__facts">
                  {openAt && <div><dt>{k.open}</dt><dd>{openAt}</dd></div>}
                  {closeAt && <div><dt>{k.close}</dt><dd>{closeAt}</dd></div>}
                </dl>
              )}

              <div className="bcl__acts">
                {variant === "ended" ? (
                  <a href={href("/results")} className="bo-cta bcl__cta">{k.toResults}</a>
                ) : variant === "waiting" ? (
                  <a href={href("/candidates")} className="bo-cta bcl__cta">{k.candidates}</a>
                ) : null}
                <a href={href("/")} className="bcl__alt">{k.home}</a>
                {session?.user && !editorMode && (
                  <button type="button" className="bcl__alt bcl__out" onClick={onLogout}>{k.signOut}</button>
                )}
              </div>
            </div>
          </section>
        </main>

        <BallotFooter meta={meta} />

        <style jsx global>{`
          .bcl__in { max-width: 640px; margin: 0 auto; padding: 56px 20px 88px; display: flex; flex-direction: column; align-items: center; text-align: center; }
          .bcl__box { width: min(340px, 72vw); aspect-ratio: 300 / 190; filter: drop-shadow(0 24px 28px rgba(46,20,60,.24)); }
          .bcl--closed .bcl__box { filter: drop-shadow(0 24px 28px rgba(46,20,60,.24)) saturate(.55); }
          .bcl__title { margin: 40px 0 0; font-size: clamp(28px, 3.4vw, 40px); font-weight: 800; line-height: 1.25; letter-spacing: -.01em; }
          .bcl__desc { margin: 12px 0 0; max-width: 32em; font-size: 17px; line-height: 1.75; color: var(--bo-muted); }
          .bcl__desc strong { color: var(--bo-ink); }
          .bcl__cd { margin-top: 30px; width: 100%; max-width: 460px; padding: 18px 20px; background: var(--bo-paper); border-radius: 8px; box-shadow: 0 1px 0 var(--bo-rule); }
          .bcl__facts { margin: 28px 0 0; width: 100%; max-width: 460px; display: grid; gap: 0; text-align: left; border-top: 2px solid var(--bo-ink); }
          .bcl__facts > div { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: 12px; padding: 12px 2px; border-bottom: 1px solid var(--bo-rule); }
          .bcl__facts dt { font-weight: 700; color: var(--bo-muted); }
          .bcl__facts dd { margin: 0; font-weight: 600; }
          .bcl__acts { margin-top: 32px; width: 100%; max-width: 460px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
          .bcl__alt { font-weight: 600; color: var(--bo-plum); border: 0; border-bottom: 1.5px solid currentColor; background: none; padding: 0 0 1px; }
          .bcl__out { color: var(--bo-muted); }
          @media (max-width: 640px) {
            .bcl__in { padding: 36px 16px 64px; }
            .bcl__title { margin-top: 28px; font-size: 25px; }
            .bcl__desc { font-size: 15px; }
            .bcl__cd { padding: 14px 14px; }
            .bcl__facts > div { grid-template-columns: 70px minmax(0, 1fr); font-size: 14.5px; }
          }
        `}</style>
      </div>
    </MotionConfig>
  );
}
