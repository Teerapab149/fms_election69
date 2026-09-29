"use client";

// BallotHome — home of the ballot-official family ("บัตรเลือกตั้ง").
//
// The hero is a scene, not a card: this year's ballot, printed with the real
// choices, standing in the slot of a ballot box. The way in sits on the ballot's
// stub, above the slot. Hovering the button lowers the ballot a little further
// into the box — the success page finishes the drop.
//
// Neutrality: the sample ballot is printed EMPTY. A pre-ticked box on an election
// site reads as the site suggesting a choice; pen-blue marks belong to the voter.
//
// Words: nothing the admin can edit is written here. Bound elements come from
// globalConfig, the rest from Page Design (pageLayout.elementConfigs.home), then
// from this family's template definition (builtIn/ballot-official.js). Every
// editable block is wrapped in EditorElement so Page Design can select it.
//
// Status, action and countdown come from useElectionStatus (one source).

import { useEffect } from "react";
import { motion, MotionConfig, animate, useMotionValue, useReducedMotion, useTransform } from "framer-motion"; // Motion for React
import { Check } from "lucide-react";
import { getPath } from "../../../../utils/basePath";
import { useGlobalConfig } from "../../../../contexts/GlobalConfigContext";
import { useHomeModel } from "../../shared/home/useHomeModel";
import { ballotOfficialTemplate } from "../../../admin/editor/templates/builtIn/ballot-official";
import BallotJourney from "./BallotJourney";
import { ballotMeta, BallotHeader, BallotStatus, BallotCountdown, BallotFooter, BallotBaseStyles } from "./BallotChrome";
import { formatThaiDate, formatThaiTime } from "../../../../utils/electionConfig";

const src = (p) => (!p ? null : String(p).startsWith("http") ? p : getPath(p));

// Motion system: one easing for everything (fast out, long settle) and a short
// stagger for the hero's text. Nothing bounces.
const EASE = [0.16, 1, 0.3, 1];
const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const RISE = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } };

// The ballot's rows, from the real candidate list. One party → approve /
// disapprove / abstain; several → one row per party plus abstain. The special
// options keep the names the admin gave them.
function ballotRows(candidates, copy) {
  const parties = candidates.filter((c) => c.number > 0);
  const abstain = candidates.find((c) => c.number === 0);
  const disapprove = candidates.find((c) => c.number === -1);
  if (parties.length === 0) return [];
  if (parties.length === 1) {
    const p = parties[0];
    return [
      { key: "yes", no: p.number, logo: p.logoUrl, label: `${copy.approvePrefix} ${p.name || ""}`.trim() },
      ...(disapprove ? [{ key: "no", label: disapprove.name }] : []),
      ...(abstain ? [{ key: "abstain", label: abstain.name }] : []),
    ];
  }
  return [
    ...parties.map((p) => ({ key: `p${p.number}`, no: p.number, logo: p.logoUrl, label: p.name || String(p.number) })),
    ...(abstain ? [{ key: "abstain", label: abstain.name }] : []),
  ];
}

export default function BallotHome({
  initialData, editorMode = false, editorData = null, elementConfigs = null,
  selectedElement = null, hoveredElement = null, onSelectElement = null,
  onHoverElement = null, onHoverEnd = null, pageLayout = null,
  resolvedTemplate = null, onSignIn = null,
}) {
  // status, editable words, CTA state and turnout: shared by every v2 home
  const {
    mounted, globalConfig, election, Wrap, text, visible, copy,
    cta, ctaDisabled, ctaHref, onAction, stats, pct,
  } = useHomeModel({
    initialData, editorMode, editorData, elementConfigs, selectedElement, hoveredElement,
    onSelectElement, onHoverElement, onHoverEnd, pageLayout, resolvedTemplate, onSignIn,
  }, ballotOfficialTemplate);

  const meta = ballotMeta(globalConfig || {});
  const rows = ballotRows(initialData?.candidates || [], copy);
  const n = (v) => Number(v || 0).toLocaleString("en-US");

  // the countdown depends on the clock; render after mount so server HTML and
  // the first client paint agree
  // turnout counts up to the real figure once (instantly when motion is reduced
  // or in the editor); the spoken label never depends on it
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const countText = useTransform(count, (v) => Math.round(v).toLocaleString("en-US"));
  useEffect(() => {
    if (editorMode || reduceMotion) { count.set(stats.totalVoted); return undefined; }
    const c = animate(count, stats.totalVoted, { delay: 0.6, duration: 1.4, ease: EASE });
    return () => c.stop();
  }, [stats.totalVoted, editorMode, reduceMotion, count]);

  // motion: an entrance only on the live page (the editor renders still), and the
  // float only once the page is interactive and the user has not asked for less motion
  const intro = !editorMode;
  const floating = !editorMode && !reduceMotion;

  if (!mounted) return <div className="bo-root" />;

  const title = text("hero-title", meta.wordmark);
  // "วันที่ 9 กุมภาพันธ์ 2570" → day / month / year, from the configured start
  const [, dd = "", mm = "", yy = ""] = formatThaiDate(election.start).match(/(\d+)\s+(\S+)\s+(\d+)/) || [];
  const day = { d: dd, month: mm, year: yy };

  return (
    // reducedMotion="user": with the OS setting on, Motion drops transforms and
    // keeps only opacity, so nothing moves for people who asked for stillness
    <MotionConfig reducedMotion="user">
    <div className="fms-app bo-root">
      <BallotBaseStyles />
      <BallotHeader active="home" editorMode={editorMode} onSignIn={onSignIn} />

      <main>
        <section className="bo-hero">
          <div className="bo-hero__in">
            {/* staged entrance: status, heading, facts, turnout — one short cascade */}
            <motion.div className="bo-hero__text" variants={STAGGER} initial={intro ? "hidden" : false} animate="show">
              <motion.div variants={RISE} className="bo-hero__status"><BallotStatus status={election} showClock={false} /></motion.div>

              <motion.h1 variants={RISE} className="bo-hero__h1">
                <Wrap id="hero-title"><span className="bo-hero__title">{title}</span></Wrap>{" "}
                <Wrap id="hero-subtitle"><span className="bo-hero__campaign">{text("hero-subtitle", meta.campaign)}</span></Wrap>
              </motion.h1>
              <motion.p variants={RISE} className="bo-hero__sub">
                <Wrap id="hero-subtitle2"><span>{text("hero-subtitle2", meta.org)}</span></Wrap>{" "}
                <Wrap id="hero-year-badge"><span className="bo-nowrap">ปีการศึกษา {text("hero-year-badge", meta.ay)}</span></Wrap>
              </motion.p>

              <motion.div variants={RISE} className="bo-hero__facts">
              {election.phase === "before" ? (
                // before the polls open the useful fact is WHEN — posted like the
                // notice on the faculty board; the clock is on the ballot's stub
                <Wrap id="hero-countdown">
                  <div className="bo-date">
                    <b>{day.d} {day.month} {day.year}</b>
                    <span>เปิดหีบ {formatThaiTime(election.start)} ปิดหีบ {formatThaiTime(election.end)}</span>
                  </div>
                </Wrap>
              ) : (
                <Wrap id="stats-progress-card">
                  <div className="bo-turnout">
                    {/* the figure counts up and the meter fills once, together; the
                        spoken label always carries the final numbers */}
                    <p className="bo-turnout__line" aria-label={`${text("stats-header")} ${n(stats.totalVoted)} จาก ${n(stats.totalEligible)} คน ${pct.toFixed(1)}%`}>
                      <Wrap id="stats-header"><span aria-hidden>{text("stats-header")}</span></Wrap>{" "}
                      <motion.b aria-hidden>{countText}</motion.b>
                      <span aria-hidden> จาก {n(stats.totalEligible)} คน</span>
                      <span className="bo-turnout__pct" aria-hidden>{pct.toFixed(1)}%</span>
                    </p>
                    <div className="bo-meter" role="presentation">
                      <motion.i style={{ originX: 0 }}
                        initial={intro ? { scaleX: 0 } : false} animate={{ scaleX: Math.min(100, pct) / 100 }}
                        transition={{ delay: 0.6, duration: 1.4, ease: EASE }} />
                    </div>
                  </div>
                </Wrap>
              )}
              </motion.div>
            </motion.div>

            {/* the ballot, floating: a real interface held up off the page, with a
                ground shadow that breathes with it. It arrives after the words. */}
            <motion.div className="bo-stage"
              initial={intro ? { opacity: 0, y: 28 } : false} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.9, ease: EASE }}>
              <div className="bo-glow" aria-hidden />
              <motion.div className="bo-float"
                animate={floating ? { y: [0, -5, 0] } : undefined}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}>
              <div className="bo-lift">
                <article className="bo-ballot" aria-label={`${copy.sampleStamp}${copy.ballotTitle}`}>
                  <span className="bo-sample" aria-hidden>{copy.sampleStamp}</span>
                  <header className="bo-ballot__head">
                    <div>
                      <b className="bo-ballot__title">{copy.ballotTitle}</b>
                      <span className="bo-ballot__of">{text("hero-subtitle2", meta.org)}</span>
                    </div>
                    <span className="bo-ballot__mark">{title}</span>
                  </header>

                  {rows.length > 0 ? (
                    <ol className="bo-ballot__rows">
                      {rows.map((r) => (
                        <li key={r.key} className="bo-row">
                          <span className="bo-row__box" aria-hidden />
                          {r.no != null && <span className="bo-row__no">{r.no}</span>}
                          {r.logo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="bo-row__logo" src={src(r.logo)} alt="" />
                          )}
                          <span className="bo-row__label">{r.label}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="bo-ballot__empty">{copy.ballotEmpty}</p>
                  )}
                  <p className="bo-ballot__rule">{copy.ballotRule}</p>

                  <div className="bo-perf" aria-hidden />

                  <div className="bo-stub">
                    {election.target && (
                      <Wrap id="hero-countdown">
                        <div className="bo-stub__cd"><BallotCountdown status={election} /></div>
                      </Wrap>
                    )}
                    {election.action === "voted" && (
                      <p className="bo-stub__done"><Check size={18} aria-hidden /> {copy.voted}</p>
                    )}
                    <Wrap id="voteCTA-button">
                      <a
                        href={ctaHref}
                        onClick={onAction}
                        role="button"
                        aria-disabled={ctaDisabled || undefined}
                        className={`bo-cta ${ctaDisabled ? "is-disabled" : ""}`}
                      >
                        {cta.text}
                      </a>
                    </Wrap>
                    {cta.note && <p className="bo-stub__note">{cta.note}</p>}
                  </div>
                </article>
              </div>
              </motion.div>
              <motion.div className="bo-shadow" aria-hidden
                animate={floating ? { scaleX: [1, 0.93, 1], opacity: [0.55, 0.4, 0.55] } : undefined}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }} />
            </motion.div>
          </div>
        </section>

        {/* below the hero: the ballot's journey, in four chapters */}
        <BallotJourney candidates={initialData?.candidates || []} election={election} copy={copy}
          text={text} visible={visible} Wrap={Wrap} editorMode={editorMode} meta={meta} />
      </main>

      <BallotFooter meta={meta} tone="night" />

      <style jsx global>{`
        /* ── hero ── */
        /* the page itself is board-coloured, so the header (transparent at rest)
           reads as part of the hero without overlapping it */
        /* the board: light falling from the top left onto the page */
        .bo-hero { position: relative; overflow: hidden; background: radial-gradient(110% 90% at 12% 0%, var(--bo-tint-1) 0%, transparent 62%), var(--bo-board); }
        /* the ballot's security print (guilloche, BallotChrome) behind the
           ballot, fading out towards the words — the page's paper, themed */
        .bo-hero::before {
          content: ""; position: absolute; inset: 0; pointer-events: none; background: var(--bo-plum); opacity: .17;
          -webkit-mask-image: var(--bo-g), radial-gradient(60% 80% at 78% 50%, #000 0%, transparent 74%);
                  mask-image: var(--bo-g), radial-gradient(60% 80% at 78% 50%, #000 0%, transparent 74%);
          -webkit-mask-size: 200px 48px, 100% 100%; mask-size: 200px 48px, 100% 100%;
          -webkit-mask-repeat: repeat, no-repeat; mask-repeat: repeat, no-repeat;
          -webkit-mask-composite: source-in; mask-composite: intersect;
        }
        /* words and ballot share one centre line and one column rhythm — the two
           halves read as one statement, not two blocks side by side */
        .bo-hero__in {
          position: relative; max-width: var(--bo-max); margin: 0 auto; padding: 64px 20px 96px;
          display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 460px); gap: 72px; align-items: center;
        }

        /* the words stay quiet: the scene on the right is the page's picture */
        .bo-hero__h1 { margin: 20px 0 0; font-weight: 800; color: var(--bo-ink); line-height: 1.22; letter-spacing: -.01em; text-wrap: balance; }
        .bo-hero__title { display: block; color: var(--bo-plum); font-size: clamp(22px, 2vw, 26px); letter-spacing: 0; margin-bottom: 6px; }
        .bo-hero__campaign { display: block; font-size: clamp(34px, 4vw, 52px); }
        .bo-hero__sub { margin: 12px 0 0; font-size: 18px; color: var(--bo-muted); }
        .bo-nowrap { white-space: nowrap; }

        .bo-turnout { margin-top: 36px; max-width: 440px; }
        .bo-turnout__line { margin: 0 0 10px; font-size: 17px; }
        .bo-turnout__line b { font-weight: 800; font-variant-numeric: tabular-nums; }
        .bo-turnout__pct { margin-left: 10px; font-weight: 700; color: var(--bo-plum); font-variant-numeric: tabular-nums; }
        .bo-meter { height: 8px; border-radius: 999px; background: var(--bo-rule); overflow: hidden; }
        /* full width, scaled from the left — the fill is a transform, not a width */
        .bo-meter i { display: block; width: 100%; height: 100%; border-radius: inherit; background: var(--bo-plum); }

        .bo-date { margin-top: 32px; display: flex; flex-direction: column; gap: 4px; }
        .bo-date b { font-size: clamp(26px, 2.6vw, 34px); font-weight: 800; color: var(--bo-plum); line-height: 1.2; }
        .bo-date span { font-size: 18px; color: var(--bo-muted); }

        /* the ballot on the home page is a SAMPLE, stamped like the real ones, so
           nobody tries to vote on it */
        .bo-sample {
          position: absolute; z-index: 1; top: 38%; left: 72%; translate: -50% -50%; rotate: -12deg;
          padding: 2px 18px 4px; border: 3px solid currentColor; border-radius: 8px;
          font-size: 34px; font-weight: 800; letter-spacing: .06em; line-height: 1.25;
          color: rgba(196, 42, 58, .72); pointer-events: none; user-select: none; mix-blend-mode: multiply;
        }
        .bo-ballot__rows { cursor: default; }

        /* ── the ballot, floating ──
           Back to front: a soft plum light that slowly breathes (the only ambient
           motion on the page) · the ground shadow · the ballot. The float and the
           shadow share one 6s cycle, so height and shadow always agree. */
        .bo-stage { position: relative; padding-bottom: 44px; }
        .bo-glow {
          position: absolute; left: 50%; top: 46%; width: 130%; aspect-ratio: 1; translate: -50% -50%;
          background: radial-gradient(closest-side, rgba(var(--bo-plum-rgb),.17), rgba(var(--bo-plum-rgb),0));
          pointer-events: none; animation: boBreathe 14s ease-in-out infinite alternate;
        }
        @keyframes boBreathe { from { transform: scale(.94); opacity: .75; } to { transform: scale(1.06); opacity: 1; } }
        .bo-float { position: relative; z-index: 1; will-change: transform; }
        /* reaching for the button raises the ballot a little toward the voter */
        .bo-lift { transition: transform .5s cubic-bezier(.16,1,.3,1); }
        .bo-stage:has(.bo-cta:not(.is-disabled):hover) .bo-lift { transform: translateY(-4px); }
        .bo-shadow {
          position: absolute; left: 12%; right: 12%; bottom: 8px; height: 26px; border-radius: 50%;
          background: radial-gradient(closest-side, rgba(var(--bo-shade-rgb),.32), rgba(var(--bo-shade-rgb),0));
          filter: blur(6px); pointer-events: none;
        }

        /* the ballot reads as a live surface: hairline edge, layered depth, and a
           plum head rule drawn inside the radius */
        .bo-ballot {
          position: relative; background: var(--bo-paper); border-radius: 10px;
          overflow: hidden; /* the perforation notches bite INTO the ballot, nothing hangs outside */
          box-shadow:
            0 0 0 1px rgba(var(--bo-shade-rgb),.06),
            0 2px 4px rgba(var(--bo-shade-rgb),.05),
            0 18px 36px -18px rgba(var(--bo-shade-rgb),.28),
            0 48px 80px -48px rgba(var(--bo-shade-rgb),.4);
        }
        .bo-ballot__head {
          display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
          padding: 22px 24px 14px; border-radius: 10px 10px 0 0;
          box-shadow: inset 0 5px 0 var(--bo-plum); border-bottom: 1px solid var(--bo-rule);
        }
        .bo-ballot__title { display: block; font-size: 23px; font-weight: 800; line-height: 1.2; }
        .bo-ballot__of { display: block; font-size: 14px; color: var(--bo-muted); }
        .bo-ballot__mark { font-size: 15px; font-weight: 700; color: var(--bo-plum); white-space: nowrap; padding-top: 4px; }

        .bo-ballot__rows { list-style: none; margin: 0; padding: 6px 24px; }
        .bo-row { display: flex; align-items: center; gap: 14px; min-height: 56px; border-bottom: 1px dashed var(--bo-rule); }
        .bo-row:last-child { border-bottom: 0; }
        .bo-row__box { width: 28px; height: 28px; border: 2px solid var(--bo-ink); border-radius: 3px; flex-shrink: 0; }
        .bo-row__no { font-size: 22px; font-weight: 800; min-width: 1.1em; font-variant-numeric: tabular-nums; }
        .bo-row__logo { width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; }
        .bo-row__label { font-size: 16px; font-weight: 500; line-height: 1.35; }
        .bo-ballot__empty { margin: 0; padding: 26px 24px; color: var(--bo-muted); }
        .bo-ballot__rule { margin: 0; padding: 0 24px 16px; font-size: 14px; color: var(--bo-muted); }


        .bo-stub { padding: 20px 24px 26px; }
        .bo-stub__cd { margin-bottom: 16px; }
        .bo-stub__done { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; color: var(--bo-pen); font-weight: 700; }
        .bo-stub__note { margin: 10px 0 0; font-size: 14px; color: var(--bo-muted); text-align: center; }


        @media (max-width: 960px) {
          .bo-hero__in { grid-template-columns: 1fr; gap: 28px; padding: 32px 20px 56px; }
          .bo-stage { max-width: 520px; width: 100%; margin: 0 auto; }
          /* phones: the ballot comes straight after the heading so its button stays
             in the first screen; turnout moves under the ballot */
          .bo-hero__text { display: contents; }
          .bo-hero__status, .bo-hero__h1, .bo-hero__sub { order: 0; }
          .bo-stage { order: 1; }
          .bo-hero__facts { order: 2; }
          .bo-hero__facts .bo-turnout, .bo-hero__facts .bo-date { margin-top: 0; }
        }
        @media (max-width: 640px) {
          /* phone scale: one step down across the board, so the ballot reads as
             a ballot in the hand rather than a poster */
          .bo-hero__in { padding: 16px 16px 40px; gap: 16px; }
          .bo-hero__h1 { margin-top: 10px; }
          .bo-hero__title { font-size: 16px; margin-bottom: 2px; }
          .bo-hero__campaign { font-size: 23px; }
          .bo-hero__sub { font-size: 13.5px; margin-top: 4px; }
          .bo-turnout__line, .bo-date span { font-size: 14px; }
          .bo-date b { font-size: 22px; }
          .bo-stage { padding-bottom: 28px; }
          .bo-ballot__head { padding: 14px 16px 10px; }
          .bo-sample { font-size: 20px; padding: 1px 10px 2px; border-width: 2px; left: 80%; top: 42%; }
          .bo-ballot__title { font-size: 17px; }
          .bo-ballot__of { font-size: 12.5px; }
          .bo-ballot__mark { font-size: 13px; }
          .bo-ballot__rows { padding: 2px 16px; }
          .bo-row { min-height: 44px; gap: 10px; }
          .bo-row__box { width: 22px; height: 22px; }
          .bo-row__no { font-size: 18px; }
          .bo-row__logo { width: 26px; height: 26px; }
          .bo-row__label { font-size: 14px; }
          .bo-ballot__rule { padding: 0 16px 12px; font-size: 12.5px; }
          .bo-stub { padding: 14px 16px 18px; }
          .bo-stub__cd { margin-bottom: 12px; }
          .bo-stub__note { font-size: 12.5px; margin-top: 8px; }
        }
      `}</style>
    </div>
    </MotionConfig>
  );
}
