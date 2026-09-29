"use client";

// BallotResults — the results page of the ballot-official family. Same props as
// every family's results component (app/results/page.js). The home page's story
// ends at the box; this page is the box being opened.
//
//   isNotStarted → the box is not open yet: the box, and when it opens
//   !isRevealed  → the box is sealed: the box, and how many ballots are in it.
//                  The per-party count is secret; the turnout never was.
//   revealed     → the count sheet: every option in one table, count AND share,
//                  the result stamped on its row. No pie charts — this is the
//                  page people check the arithmetic on.
//
// Who won is decided by resolveVerdict() (shared by every family) so an abstain
// can never be crowned and a tie is never called.

import { useMemo } from "react";
import { MotionConfig, motion } from "framer-motion"; // Motion for React
import { useGlobalConfig } from "../../../../contexts/GlobalConfigContext";
import { resolveVerdict } from "../../../../utils/electionVerdict";
import { ballotOfficialTemplate } from "../../../admin/editor/templates/builtIn/ballot-official";
import { ballotMeta, BallotHeader, BallotFooter, BallotBaseStyles, Phrases } from "./BallotChrome";
import BallotBox from "./BallotBox";
import { resultsView } from "../../shared/results/resultsView.mjs";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n ?? 0);
const EASE = [0.16, 1, 0.3, 1];

export default function BallotResults({
  candidates = [], totalVotes = 0, demographics = {},
  finalStatus = "WAITING", isRevealed = false, isNotStarted = false,
  countdownText = "", editorMode = false,
}) {
  const meta = ballotMeta(useGlobalConfig() || {});
  const r = ballotOfficialTemplate.copy.results;

  // order, shares, turnout and group tables are shared by every v2 template;
  // before the reveal the rows carry no score at all (rule 7)
  const { rows, eligible, turnout, demo } = useMemo(() => resultsView({
    candidates, totalVotes, demographics, revealed: isRevealed,
    groups: [{ key: "byYear", label: r.demoYear }, { key: "byGender", label: r.demoGender }, { key: "byMajor", label: r.demoMajor }],
  }), [candidates, totalVotes, demographics, isRevealed, r]);

  const verdict = resolveVerdict(candidates, { revealed: isRevealed });
  const featuredId = verdict.featured?.id ?? null;
  const verdictLine = {
    winner: verdict.featured && `${verdict.featured.name} ${r.verdictWinner}`,
    approved: verdict.featured && `${verdict.featured.name} ${r.verdictApproved}`,
    disapproved: r.verdictDisapproved,
    tie: r.verdictTie,
    "no-votes": r.verdictNone,
  }[verdict.outcome] || null;
  // a stamp only where the count really elects someone
  const stampText = verdict.outcome === "winner" ? r.winner : verdict.outcome === "approved" ? r.approved : null;

  const label = (c) => (c.number > 0 ? c.name : c.number === 0 ? r.abstain : r.disapprove);

  const state = isNotStarted ? "before" : !isRevealed ? "sealed" : "revealed";
  const lede = { before: r.ledeBefore, sealed: r.ledeSealed, revealed: r.ledeRevealed }[state];

  return (
    <MotionConfig reducedMotion="user">
      <div className="fms-app bo-root">
        <BallotBaseStyles />
        <BallotHeader active="results" editorMode={editorMode} />

        <main>
          <section className="br">
            <div className="br__in">
              <p className="br__ctx"><Phrases text={`${meta.wordmark} ${meta.campaign}`} /></p>
              <h1 className="br__title">{r.title}</h1>
              <p className="br__lede">{lede}</p>

              {state !== "revealed" ? (
                /* the box, closed — the object the voter last saw take their ballot */
                <div className={`br-box br-box--${state}`}>
                  <div className="br-box__art">
                    <BallotBox glow={0} label={state === "before" ? r.boxBefore : r.boxSealed} wordmark={meta.wordmark} idPrefix="brb" />
                  </div>
                  <div className="br-box__facts">
                    {state === "before" ? (
                      countdownText ? (
                        <p className="br-box__when"><span>{r.opensIn}</span><b>{countdownText.replace(/^เหลืออีก\s*/, "")}</b></p>
                      ) : null
                    ) : (
                      <>
                        <p className="br-box__h">{r.sealedTitle}</p>
                        <p className="br-box__count"><b>{fmt(totalVotes)}</b> <span>{r.ballots}</span></p>
                        {eligible > 0 && (
                          <>
                            <div className="br-meter" role="img" aria-label={`${r.turnout} ${turnout.toFixed(2)}%`}>
                              <motion.i initial={{ scaleX: 0 }} animate={{ scaleX: Math.min(1, turnout / 100) }} transition={{ duration: 1.1, ease: EASE, delay: 0.2 }} />
                            </div>
                            <p className="br-box__of">
                              {r.turnout} <b>{turnout.toFixed(2)}%</b> {r.eligible} {fmt(eligible)} {r.people}
                            </p>
                          </>
                        )}
                        <p className="br-box__note">{r.sealedNote}</p>
                        {countdownText && <p className="br-box__cd">{countdownText}</p>}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* the count sheet */}
                  <article className="br-sheet" aria-labelledby="br-sheet-h">
                    <header className="br-sheet__head">
                      <h2 id="br-sheet-h">{r.sheetTitle}</h2>
                      <span>{meta.wordmark}</span>
                    </header>
                    <dl className="br-sheet__sum">
                      <div><dt>{r.total}</dt><dd><b>{fmt(totalVotes)}</b> {r.ballots}</dd></div>
                      {eligible > 0 && <div><dt>{r.eligible}</dt><dd><b>{fmt(eligible)}</b> {r.people}</dd></div>}
                      {eligible > 0 && <div><dt>{r.turnout}</dt><dd><b>{turnout.toFixed(2)}</b> %</dd></div>}
                    </dl>
                    <div className="bo-perf" aria-hidden />

                    {verdictLine && (
                      <p className={`br-verdict br-verdict--${verdict.outcome}`}>{verdictLine}</p>
                    )}

                    <ol className="br-rows">
                      {rows.map((c, i) => {
                        const { score, share } = c; // revealed rows only — resultsView sets both
                        const featured = c.id === featuredId;
                        return (
                          <li key={c.id} className={`br-row ${featured ? "is-featured" : ""} ${c.number > 0 ? "" : "is-special"}`}>
                            <span className="br-row__no" aria-hidden={c.number <= 0}>{c.number > 0 ? c.number : c.number === 0 ? "–" : "✕"}</span>
                            <span className="br-row__name">{label(c)}</span>
                            <span className="br-row__figs"><b>{fmt(score)}</b><span>{share.toFixed(2)}%</span></span>
                            <span className="br-row__bar" aria-hidden>
                              <motion.i initial={{ scaleX: 0 }} animate={{ scaleX: Math.min(1, share / 100) }}
                                transition={{ duration: 0.9, ease: EASE, delay: 0.25 + i * 0.12 }} />
                            </span>
                            {featured && stampText && (
                              <motion.span className="br-row__stamp" aria-hidden
                                initial={{ opacity: 0, scale: 1.5, rotate: -14 }} animate={{ opacity: 1, scale: 1, rotate: -8 }}
                                transition={{ duration: 0.4, ease: EASE, delay: 0.5 + rows.length * 0.12 }}>
                                {stampText}
                              </motion.span>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                    <p className="br-sheet__foot">{r.order} {fmt(totalVotes)} {r.ballots}</p>
                  </article>

                  {demo.length > 0 && (
                    <section className="br-demo" aria-labelledby="br-demo-h">
                      <h2 id="br-demo-h" className="br-demo__h">{r.demoTitle}</h2>
                      <p className="br-demo__note">{r.demoNote}</p>
                      <div className="br-demo__grid">
                        {demo.map((g) => (
                          <div key={g.label} className="br-demo__g">
                            <b>{g.label}</b>
                            <ul>
                              {g.rows.map((x) => (
                                <li key={x.name}>
                                  <span>{x.name}</span>
                                  <span className="br-demo__v">{fmt(x.value)}</span>
                                  <span className="br-demo__bar" aria-hidden><i style={{ width: `${x.share}%` }} /></span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          </section>
        </main>

        <BallotFooter meta={meta} />

        <style jsx global>{`
          .br__in { max-width: var(--bo-max); margin: 0 auto; padding: 56px 20px 96px; }
          .br__ctx { margin: 0; font-size: 15px; color: var(--bo-muted); }
          .br__title { margin: 12px 0 0; font-size: clamp(32px, 3.8vw, 48px); font-weight: 800; line-height: 1.2; letter-spacing: -.015em; }
          .br__lede { margin: 12px 0 0; max-width: 36em; font-size: 17px; line-height: 1.7; color: var(--bo-muted); }

          /* the closed box */
          .br-box { margin-top: 48px; display: grid; grid-template-columns: minmax(0, 420px) minmax(0, 1fr); gap: 56px; align-items: center; }
          .br-box__art { aspect-ratio: 300 / 190; filter: drop-shadow(0 26px 30px rgba(var(--bo-shade-rgb),.25)); }
          .br-box--before .br-box__art { opacity: .92; }
          .br-box__h { margin: 0; font-size: 16px; font-weight: 600; color: var(--bo-muted); }
          .br-box__count { margin: 4px 0 0; line-height: 1; }
          .br-box__count b { font-size: clamp(56px, 7vw, 88px); font-weight: 800; letter-spacing: -.03em; font-variant-numeric: tabular-nums; color: var(--bo-plum); }
          .br-box__count span { font-size: 20px; font-weight: 600; color: var(--bo-ink); }
          .br-meter { margin-top: 20px; height: 10px; border-radius: 5px; background: var(--bo-rule); overflow: hidden; max-width: 460px; }
          .br-meter i { display: block; height: 100%; background: var(--bo-plum); transform-origin: left center; }
          .br-box__of { margin: 10px 0 0; font-size: 15.5px; color: var(--bo-muted); }
          .br-box__of b { color: var(--bo-ink); font-variant-numeric: tabular-nums; }
          .br-box__note { margin: 22px 0 0; max-width: 34em; font-size: 15px; line-height: 1.7; color: var(--bo-muted); }
          .br-box__cd { margin: 14px 0 0; font-weight: 600; color: var(--bo-plum); font-variant-numeric: tabular-nums; }
          .br-box__when { margin: 0; display: flex; flex-direction: column; gap: 4px; }
          .br-box__when span { font-size: 16px; font-weight: 600; color: var(--bo-muted); }
          .br-box__when b { font-size: clamp(32px, 4vw, 44px); font-weight: 800; color: var(--bo-plum); font-variant-numeric: tabular-nums; }

          /* the count sheet — paper, like the ballot it counts */
          .br-sheet {
            margin-top: 44px; background: var(--bo-paper); border-radius: 6px; padding: 30px 0 22px;
            box-shadow: 0 1px 0 var(--bo-rule), 0 28px 50px -34px rgba(var(--bo-shade-rgb),.4);
          }
          .br-sheet__head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px 16px; flex-wrap: wrap; padding: 0 32px; }
          .br-sheet__head h2 { margin: 0; font-size: 22px; font-weight: 800; }
          .br-sheet__head span { font-weight: 700; color: var(--bo-plum); }
          .br-sheet__sum { margin: 20px 0 24px; padding: 0 32px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
          .br-sheet__sum dt { font-size: 14px; color: var(--bo-muted); }
          .br-sheet__sum dd { margin: 2px 0 0; font-size: 15px; color: var(--bo-muted); }
          .br-sheet__sum dd b { font-size: 30px; font-weight: 800; color: var(--bo-ink); font-variant-numeric: tabular-nums; letter-spacing: -.01em; }

          .br-verdict { margin: 24px 32px 4px; font-size: 18px; font-weight: 700; color: var(--bo-plum-deep); }
          .br-verdict--tie, .br-verdict--no-votes, .br-verdict--disapproved { color: var(--bo-ink); padding: 12px 16px; border: 1.5px dashed var(--bo-rule); border-radius: 8px; font-size: 16px; }

          .br-rows { list-style: none; margin: 12px 0 0; padding: 0 32px; }
          .br-row {
            position: relative; display: grid; grid-template-columns: 48px minmax(0, 1fr) auto; align-items: center; gap: 6px 18px;
            padding: 18px 0 20px; border-bottom: 1px solid var(--bo-rule);
          }
          .br-row:last-child { border-bottom: 0; }
          /* the number in the ballot's own box */
          .br-row__no {
            width: 48px; height: 48px; display: grid; place-items: center; border: 2px solid var(--bo-ink); border-radius: 3px;
            font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums;
          }
          .br-row.is-special .br-row__no { border-color: var(--bo-rule); color: var(--bo-muted); }
          .br-row__name { font-size: 19px; font-weight: 700; line-height: 1.35; }
          .br-row.is-special .br-row__name { font-weight: 600; color: var(--bo-muted); }
          .br-row__figs { display: flex; align-items: baseline; gap: 10px; white-space: nowrap; }
          .br-row__figs b { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; }
          .br-row__figs span { font-size: 15px; color: var(--bo-muted); font-variant-numeric: tabular-nums; }
          .br-row__bar { grid-column: 2 / -1; height: 8px; border-radius: 4px; background: var(--bo-board); overflow: hidden; }
          .br-row__bar i { display: block; height: 100%; background: var(--bo-muted); opacity: .45; transform-origin: left center; }
          .br-row:not(.is-special) .br-row__bar i { background: var(--bo-plum); opacity: .55; }
          .br-row.is-featured .br-row__bar i { opacity: 1; }
          .br-row.is-featured .br-row__no { background: var(--bo-plum); border-color: var(--bo-plum); color: #fff; }
          .br-row.is-special.is-featured .br-row__no { background: var(--bo-ink); border-color: var(--bo-ink); }
          /* the committee's stamp on the elected row */
          .br-row__stamp {
            position: absolute; right: 150px; top: 10px; padding: 4px 12px; border: 2.5px solid var(--bo-plum); border-radius: 6px;
            color: var(--bo-plum); font-size: 16px; font-weight: 800; background: rgba(255,255,255,.85); pointer-events: none;
          }
          .br-sheet__foot { margin: 10px 32px 0; font-size: 13.5px; color: var(--bo-muted); }

          .br-demo { margin-top: 64px; }
          .br-demo__h { margin: 0; font-size: 24px; font-weight: 800; }
          .br-demo__note { margin: 6px 0 0; font-size: 15px; color: var(--bo-muted); }
          .br-demo__grid { margin-top: 22px; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 36px; }
          .br-demo__g > b { display: block; font-size: 16px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid var(--bo-ink); }
          .br-demo__g ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
          .br-demo__g li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 10px; align-items: baseline; font-size: 15px; }
          .br-demo__v { font-weight: 700; font-variant-numeric: tabular-nums; }
          .br-demo__bar { grid-column: 1 / -1; height: 5px; border-radius: 3px; background: var(--bo-rule); overflow: hidden; }
          .br-demo__bar i { display: block; height: 100%; background: var(--bo-plum); opacity: .6; }

          @media (max-width: 860px) {
            .br-box { grid-template-columns: minmax(0, 1fr); gap: 32px; }
            .br-box__art { max-width: 380px; width: 100%; margin: 0 auto; }
          }
          @media (max-width: 640px) {
            .br__in { padding: 28px 16px 64px; }
            .br__ctx { font-size: 13px; }
            .br__title { font-size: 28px; }
            .br__lede { font-size: 15px; }
            .br-box { margin-top: 32px; gap: 24px; }
            .br-box__art { max-width: 260px; }
            .br-box__count span { font-size: 17px; }
            .br-box__note { font-size: 14px; }
            .br-sheet { margin-top: 28px; padding: 22px 0 16px; }
            .br-sheet__head, .br-sheet__sum, .br-rows { padding: 0 18px; }
            .br-sheet__head h2 { font-size: 18px; }
            .br-sheet__sum { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
            .br-sheet__sum dt { font-size: 12.5px; }
            .br-sheet__sum dd b { font-size: 21px; }
            .br-verdict { margin: 20px 18px 4px; font-size: 16px; }
            .br-row { grid-template-columns: 38px minmax(0, 1fr); gap: 6px 12px; padding: 14px 0 16px; }
            .br-row__no { width: 38px; height: 38px; font-size: 18px; }
            .br-row__name { font-size: 16px; }
            /* the count gets its own line rather than shrinking */
            .br-row__figs { grid-column: 2; }
            .br-row__figs b { font-size: 21px; }
            .br-row__stamp { right: 0; top: 12px; font-size: 13px; padding: 3px 9px; }
            .br-sheet__foot { margin: 8px 18px 0; font-size: 12.5px; }
            .br-demo { margin-top: 44px; }
            .br-demo__h { font-size: 20px; }
            .br-demo__grid { gap: 28px; }
          }
        `}</style>
      </div>
    </MotionConfig>
  );
}
