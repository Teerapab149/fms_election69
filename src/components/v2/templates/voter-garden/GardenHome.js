"use client";

// GardenHome — home of the voter-garden family ("สวนของทุกเสียง").
//
// The hero IS the plate: one botanical drawing of a garden across the page.
// It grows with the real turnout while the box is open and blooms, in faculty
// plum, once it closes (GardenPlate). The figures sit on a specimen label pinned
// to the plate — a caption to the drawing, not a dashboard.
//
// Below, three more plates tell the rest in order: this year's seeds (the
// parties), how a vote is planted without a name, and when the count happens.
//
// Words: nothing the admin can edit is written here — useHomeModel resolves
// every editable element (globalConfig → Page Design → builtIn/voter-garden.js).
// Status, action and countdown come from useElectionStatus through it.

import { useReducedMotion, MotionConfig, motion } from "framer-motion"; // Motion for React
import { Check } from "lucide-react";
import { getPath } from "../../../../utils/basePath";
import { formatThaiDate, formatThaiTime } from "../../../../utils/electionConfig";
import { voterGardenTemplate } from "../../../admin/editor/templates/builtIn/voter-garden";
import { useHomeModel } from "../../shared/home/useHomeModel";
import { usePartyContent } from "../../shared/party/usePartyContent";
import { gardenMeta, GardenHeader, GardenFooter, GardenBaseStyles } from "./GardenChrome";
import GardenPlate from "./GardenPlate";

const EASE = [0.16, 1, 0.3, 1];
const n = (v) => Number(v || 0).toLocaleString("en-US");
const pad = (v) => String(v).padStart(2, "0");

// a party as a seed packet: its group photo on the front, number, name, slogan
function SeedPacket({ party, copy, editorMode }) {
  const { cover, members } = usePartyContent(party);
  return (
    <a href={editorMode ? undefined : getPath(`/party?id=${party.number}`)} className="vg-packet">
      <span className="vg-packet__photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {cover && <img src={cover} alt={party.name || ""} loading="lazy" />}
        <span className="vg-packet__no" aria-hidden>{party.number}</span>
      </span>
      <span className="vg-packet__body">
        <b>{party.name}</b>
        {party.slogan && <span className="vg-packet__slogan">{party.slogan}</span>}
        <span className="vg-packet__foot">
          {members.length > 0 && <span>{copy.team} {members.length} {copy.people}</span>}
          <span className="vg-packet__go">{copy.link}</span>
        </span>
      </span>
    </a>
  );
}

// the stages of one plant, drawn small: seed, sprout, grown
const Stage = ({ k }) => (
  <svg viewBox="0 0 48 48" className="vg-stage" aria-hidden>
    <path d="M4 38 Q24 35 44 38" className="vg-stage__soil" />
    {k === 0 && <ellipse cx="24" cy="42" rx="4.5" ry="3" className="vg-stage__seed" />}
    {k >= 1 && <path d="M24 38 Q23 28 25 20" className="vg-stage__line" />}
    {k === 1 && <path d="M24.6 24 Q31 17 35 21 Q30 26 24.6 24Z" className="vg-stage__leaf" />}
    {k === 2 && (
      <>
        <path d="M24 38 Q22 22 25 8" className="vg-stage__line" />
        <path d="M24.2 26 Q15 19 12 23 Q18 29 24.2 26Z" className="vg-stage__leaf" />
        <path d="M24.8 18 Q33 11 37 15 Q31 21 24.8 18Z" className="vg-stage__leaf" />
        <circle cx="25" cy="7" r="4" className="vg-stage__bloom" />
      </>
    )}
  </svg>
);

export default function GardenHome(props) {
  const { editorMode = false, onSignIn = null } = props;
  const {
    mounted, globalConfig, election, Wrap, text, copy,
    cta, ctaDisabled, ctaHref, onAction, stats, pct, candidates,
  } = useHomeModel(props, voterGardenTemplate);
  const reduce = useReducedMotion();
  const still = editorMode || !!reduce;

  if (!mounted) return <div className="vg-root" />;

  const meta = gardenMeta(globalConfig || {});
  const phase = election.phase; // before | open | paused | ended
  const parties = candidates.filter((c) => c.number > 0).sort((a, b) => a.number - b.number);
  const p = copy.plates;
  const r = election.remaining;
  const clock = r ? `${r.d > 0 ? `${r.d} ${copy.days} ` : ""}${pad(r.h)}:${pad(r.m)}:${pad(r.s)}` : null;
  const rise = (d) => (still ? { initial: false } : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: EASE, delay: d } });

  return (
    <MotionConfig reducedMotion="user">
      <div className="fms-app vg-root">
        <GardenBaseStyles />
        <GardenHeader active="home" editorMode={editorMode} onSignIn={onSignIn} />

        <main>
          <section className="vg-hero">
            <div className="vg-hero__head">
              <motion.p className="vg-hero__ctx" {...rise(0.05)}>
                <Wrap id="hero-title"><span className="vg-hero__mark">{text("hero-title", meta.wordmark)}</span></Wrap>{" "}
                <Wrap id="hero-subtitle2"><span>{text("hero-subtitle2", meta.org)}</span></Wrap>{" "}
                <Wrap id="hero-year-badge"><span className="vg-nowrap">{copy.ay} {text("hero-year-badge", meta.ay)}</span></Wrap>
              </motion.p>
              <motion.h1 className="vg-hero__title" {...rise(0.12)}>
                <Wrap id="hero-subtitle"><span>{text("hero-subtitle", meta.campaign)}</span></Wrap>
              </motion.h1>
              <motion.p className="vg-hero__date" {...rise(0.2)}>
                {formatThaiDate(election.start)} <span className="vg-nowrap">{copy.opens} {formatThaiTime(election.start)} {copy.closes} {formatThaiTime(election.end)}</span>
              </motion.p>
            </div>

            <figure className={`vg-plate vg-plate--${phase}`}>
              <div className="vg-plate__art">
                <GardenPlate phase={phase} turnout={pct / 100} still={still} />
              </div>

              {/* the specimen label: what the plate is showing, in words */}
              <Wrap id="stats-progress-card">
                <motion.figcaption className="vg-label" {...(still ? { initial: false } : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: EASE, delay: 0.9 } })}>
                  <span className="vg-label__hole" aria-hidden />
                  <span className="vg-label__cap">{copy.plateCaption[phase] || copy.plateCaption.open}</span>
                  {phase === "before" ? (
                    clock && (
                      <Wrap id="hero-countdown">
                        <span className="vg-label__big" role="timer" aria-label={`${copy.opensIn} ${clock}`}>
                          <small>{copy.opensIn}</small> <b>{clock}</b>
                        </span>
                      </Wrap>
                    )
                  ) : (
                    <>
                      <span className="vg-label__big">
                        <Wrap id="stats-header"><small>{text("stats-header")}</small></Wrap>{" "}
                        <b>{n(stats.totalVoted)}</b> <small>{copy.people}</small>
                      </span>
                      {stats.totalEligible > 0 && (
                        <span className="vg-label__of">{copy.labelOf} {n(stats.totalEligible)} {copy.people} <b>{pct.toFixed(1)}%</b></span>
                      )}
                      {election.target && clock && (
                        <Wrap id="hero-countdown">
                          <span className="vg-label__clock" role="timer" aria-label={`${copy.closesIn} ${clock}`}>{copy.closesIn} <b>{clock}</b></span>
                        </Wrap>
                      )}
                    </>
                  )}
                </motion.figcaption>
              </Wrap>
            </figure>

            <motion.div className="vg-hero__act" {...rise(0.35)}>
              {election.action === "voted" && <span className="vg-voted"><Check size={16} aria-hidden /> {cta.note}</span>}
              <Wrap id="voteCTA-button">
                <a href={ctaHref} onClick={onAction} role={ctaHref ? undefined : "button"} aria-disabled={ctaDisabled || undefined}
                  className={`vg-cta ${ctaDisabled ? "is-disabled" : ""}`}>{cta.text}</a>
              </Wrap>
              {cta.note && election.action !== "voted" && <p className="vg-hero__note">{cta.note}</p>}
            </motion.div>
          </section>

          {/* plate 1 — this year's seeds */}
          <section className="vg-sec">
            <div className="vg-sec__in">
              <header className="vg-sec__head">
                <span className="vg-sec__no">{p.seeds.no}</span>
                <Wrap id="meet-title"><h2>{text("meet-title", p.seeds.title)}</h2></Wrap>
                <Wrap id="meet-cta"><p>{text("meet-cta", p.seeds.body)}</p></Wrap>
              </header>
              {parties.length > 0 ? (
                <div className={`vg-packets ${parties.length === 1 ? "is-one" : ""}`}>
                  {parties.map((party) => <SeedPacket key={party.id ?? party.number} party={party} copy={{ ...p.seeds, people: copy.people }} editorMode={editorMode} />)}
                </div>
              ) : <p className="vg-empty">{p.seeds.empty}</p>}
            </div>
          </section>

          {/* plate 2 — planting a vote without a name on it */}
          <section className="vg-sec vg-sec--plant">
            <div className="vg-sec__in">
              <header className="vg-sec__head">
                <span className="vg-sec__no">{p.plant.no}</span>
                <h2>{p.plant.title}</h2>
              </header>
              <ol className="vg-steps">
                {p.plant.steps.map((s, i) => (
                  <li key={s.t}>
                    <Stage k={i} />
                    <b><span className="vg-steps__n">{i + 1}</span> {s.t}</b>
                    <p>{s.d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* plate 3 — the count, after the box closes */}
          <section className="vg-sec vg-sec--harvest">
            <div className="vg-sec__in vg-harvest">
              <header className="vg-sec__head">
                <span className="vg-sec__no">{p.harvest.no}</span>
                <h2>{p.harvest.title}</h2>
                <p>{p.harvest.body}</p>
              </header>
              <div className="vg-harvest__act">
                <p className="vg-harvest__close">{copy.closes} {formatThaiDate(election.end)} {formatThaiTime(election.end)}</p>
                <a href={editorMode ? undefined : getPath("/results")} className="vg-link">{p.harvest.link}</a>
              </div>
            </div>
          </section>
        </main>

        <GardenFooter meta={meta} />

        <style jsx global>{`
          .vg-nowrap { white-space: nowrap; }
          .vg-hero { max-width: var(--vg-max); margin: 0 auto; padding: 44px 20px 72px; }
          .vg-hero__head { max-width: 760px; }
          .vg-hero__ctx { margin: 0; font-size: 15.5px; color: var(--vg-muted); display: flex; flex-wrap: wrap; gap: 4px 12px; }
          .vg-hero__mark { font-weight: 700; color: var(--vg-moss); }
          .vg-hero__title { margin: 10px 0 0; font-size: clamp(34px, 4.6vw, 58px); font-weight: 700; line-height: 1.16; letter-spacing: -.02em; text-wrap: balance; }
          .vg-hero__date { margin: 14px 0 0; font-size: 17px; color: var(--vg-muted); }

          /* the plate: a sheet with a thin frame, the drawing standing on its ground */
          .vg-plate { position: relative; margin: 36px 0 0; padding: 18px 18px 0; background: #F7F9F3; border: 1px solid var(--vg-rule); border-radius: 4px; }
          .vg-plate::before { content: ""; position: absolute; inset: 7px; border: 1px solid color-mix(in srgb, var(--vg-rule) 70%, transparent); border-radius: 2px; pointer-events: none; }
          .vg-plate__art { position: relative; aspect-ratio: 1200 / 440; }
          .vg-label {
            /* pinned in the plate's open sky, top right — never over the plants */
            position: absolute; right: 34px; top: 30px; width: 300px; padding: 16px 18px 16px 34px;
            background: var(--vg-card); border: 1px solid var(--vg-rule); border-radius: 3px;
            box-shadow: 0 14px 28px -20px rgba(30,51,38,.55); transform-origin: left center; rotate: 1.5deg;
            display: flex; flex-direction: column; gap: 4px;
          }
          .vg-label__hole { position: absolute; left: 12px; top: 50%; width: 10px; height: 10px; margin-top: -5px; border-radius: 50%; border: 1.5px solid var(--vg-muted); background: var(--vg-paper); }
          .vg-label__cap { font-size: 13.5px; color: var(--vg-muted); line-height: 1.45; }
          .vg-label__big { display: block; line-height: 1.2; }
          .vg-label__big small { font-size: 14px; font-weight: 600; color: var(--vg-ink); }
          .vg-label__big b { font-size: 34px; font-weight: 700; color: var(--vg-moss); font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
          .vg-label__of { font-size: 14px; color: var(--vg-muted); }
          .vg-label__of b { color: var(--vg-bloom); font-variant-numeric: tabular-nums; }
          .vg-label__clock { font-size: 14px; color: var(--vg-muted); }
          .vg-label__clock b { color: var(--vg-ink); font-variant-numeric: tabular-nums; }
          .vg-plate--before .vg-label__big b { font-size: 28px; }

          .vg-hero__act { margin-top: 28px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; }
          .vg-hero__note { margin: 0; font-size: 15px; color: var(--vg-muted); }
          .vg-voted { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: var(--vg-moss); }

          .vg-sec { border-top: 1px solid var(--vg-rule); }
          .vg-sec__in { max-width: var(--vg-max); margin: 0 auto; padding: 72px 20px 84px; }
          .vg-sec__head { max-width: 640px; }
          .vg-sec__no { display: inline-block; font-size: 14px; font-weight: 600; color: var(--vg-moss); padding-bottom: 6px; border-bottom: 1.5px solid var(--vg-moss); }
          .vg-sec__head h2 { margin: 14px 0 0; font-size: clamp(26px, 3vw, 38px); font-weight: 700; line-height: 1.25; letter-spacing: -.01em; }
          .vg-sec__head p { margin: 10px 0 0; font-family: var(--vg-font-read); font-size: 16.5px; line-height: 1.75; color: var(--vg-muted); }

          /* seed packets: one per party, the group photo on the front */
          .vg-packets { margin-top: 36px; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 28px; }
          .vg-packets.is-one { grid-template-columns: minmax(0, 560px); }
          .vg-packet { display: flex; flex-direction: column; background: var(--vg-card); border: 1px solid var(--vg-rule); border-radius: 6px; overflow: hidden; transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s; }
          .vg-packet:hover { transform: translateY(-3px); box-shadow: 0 22px 36px -28px rgba(30,51,38,.6); }
          .vg-packet__photo { position: relative; display: block; aspect-ratio: 16 / 10; background: var(--vg-rule); }
          .vg-packet__photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
          /* the packet's crimped top edge */
          .vg-packet__photo::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 8px; background: repeating-linear-gradient(90deg, var(--vg-card) 0 6px, transparent 6px 12px); }
          .vg-packet__no { position: absolute; left: 14px; bottom: -22px; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; background: var(--vg-card); border: 1.5px solid var(--vg-ink); font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
          .vg-packet__body { display: flex; flex-direction: column; gap: 4px; padding: 30px 18px 18px; flex: 1; }
          .vg-packet__body b { font-size: 20px; font-weight: 700; line-height: 1.3; }
          .vg-packet__slogan { font-family: var(--vg-font-read); font-size: 15px; line-height: 1.6; color: var(--vg-muted); }
          .vg-packet__foot { margin-top: auto; padding-top: 12px; display: flex; justify-content: space-between; gap: 10px; font-size: 14px; color: var(--vg-muted); }
          .vg-packet__go { font-weight: 600; color: var(--vg-moss); }
          .vg-empty { margin-top: 32px; padding: 28px; border: 1px dashed var(--vg-rule); border-radius: 6px; color: var(--vg-muted); text-align: center; }

          /* planting: seed, sprout, grown — the steps really are a sequence */
          .vg-steps { margin: 40px 0 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; }
          .vg-stage { width: 64px; height: 64px; }
          .vg-stage__soil { fill: none; stroke: var(--vg-ink); stroke-width: 1.4; stroke-linecap: round; }
          .vg-stage__seed { fill: color-mix(in srgb, var(--vg-leaf) 25%, transparent); stroke: var(--vg-ink); stroke-width: 1.2; }
          .vg-stage__line { fill: none; stroke: var(--vg-ink); stroke-width: 1.5; stroke-linecap: round; }
          .vg-stage__leaf { fill: color-mix(in srgb, var(--vg-leaf) 28%, transparent); stroke: var(--vg-ink); stroke-width: 1.2; }
          .vg-stage__bloom { fill: color-mix(in srgb, var(--vg-bloom) 75%, white); stroke: var(--vg-bloom); stroke-width: 1.2; }
          .vg-steps b { display: flex; align-items: baseline; gap: 8px; margin-top: 12px; font-size: 19px; }
          .vg-steps__n { font-size: 14px; color: var(--vg-moss); font-variant-numeric: tabular-nums; }
          .vg-steps p { margin: 6px 0 0; font-family: var(--vg-font-read); font-size: 15.5px; line-height: 1.75; color: var(--vg-muted); }

          .vg-harvest { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 24px 48px; }
          .vg-harvest__act { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
          .vg-harvest__close { margin: 0; font-size: 16px; font-weight: 600; }
          .vg-link { font-weight: 600; color: var(--vg-moss); border-bottom: 1.5px solid currentColor; padding-bottom: 1px; }

          @media (max-width: 860px) {
            .vg-steps { grid-template-columns: minmax(0, 1fr); gap: 24px; }
            .vg-steps li { display: grid; grid-template-columns: 56px minmax(0, 1fr); column-gap: 14px; }
            .vg-steps .vg-stage { grid-row: span 2; width: 56px; height: 56px; }
            .vg-steps b { margin-top: 4px; }
          }
          @media (max-width: 640px) {
            .vg-hero { padding: 24px 16px 52px; }
            .vg-hero__ctx { font-size: 13.5px; }
            .vg-hero__title { font-size: 30px; }
            .vg-hero__date { font-size: 15px; }
            .vg-plate { margin-top: 24px; padding: 10px 10px 0; }
            /* phones: the plate is cropped to its middle, taller, and the label
               moves under it — never over the drawing */
            .vg-plate__art { aspect-ratio: auto; height: 250px; }
            .vg-label { position: relative; right: auto; top: auto; width: auto; margin: -8px 8px 16px; rotate: 0deg; }
            .vg-label__big b { font-size: 28px; }
            .vg-hero__act { margin-top: 22px; }
            .vg-sec__in { padding: 52px 16px 60px; }
            .vg-sec__head p { font-size: 15px; }
            .vg-packets { grid-template-columns: minmax(0, 1fr); gap: 22px; }
            .vg-packet__body b { font-size: 18px; }
          }
        `}</style>
      </div>
    </MotionConfig>
  );
}
