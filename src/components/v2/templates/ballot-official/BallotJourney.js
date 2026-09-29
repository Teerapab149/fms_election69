"use client";

// BallotJourney — the home page below the hero: the life of one ballot, in the
// four steps a voter actually takes. The steps are a real sequence, so they are
// numbered — each number sits in a ballot box, the family's one motif.
//
//   1  meet the candidates   (each party: group photo, number, slogan)
//   2  sign in               (why the system knows you voted but not how)
//   3  mark and cast         (a blank sample is marked, folded and dropped as you scroll)
//   4  count and announce    (closing time from settings, results link, poster)
//
// The page deepens from the lilac board to the faculty's deep plum chapter by
// chapter — from paperwork in daylight to the count at night.
//
// Neutrality: the ballot marked in chapter 3 carries no party names — it shows
// the gesture, never a choice.

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"; // Motion for React
import { Lock } from "lucide-react";
import BallotBox from "./BallotBox";
import BallotPartyCard from "./BallotPartyCard";
import { getPath } from "../../../../utils/basePath";
import { formatThaiDate, formatThaiTime } from "../../../../utils/electionConfig";

const EASE = [0.16, 1, 0.3, 1];

// chapter headings rise in once as they enter; the rest of each chapter is still
function ChapterHead({ no, title, body, intro, children }) {
  return (
    <motion.div className="bj-head"
      initial={intro ? { opacity: 0, y: 18 } : false}
      whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-15% 0px" }}
      transition={{ duration: 0.7, ease: EASE }}>
      <span className="bj-no" aria-hidden>{no}</span>
      <h2 className="bj-title">{title}</h2>
      {body && <p className="bj-body">{body}</p>}
      {children}
    </motion.div>
  );
}

// chapter 3's scene, driven by the chapter's own scroll progress (reversible,
// never on a timer):
//   mark    the pen draws an X in a box on the lower half
//   fold    the upper half folds down over it — the choice is covered, as a real
//           ballot is folded before it leaves your hand
//   send    the folded ballot slides into the slot; the slot glows as it arrives
function MiniRow({ mark }) {
  return (
    <span className="bj-mini__row">
      <span className="bj-mini__box">
        {mark && (
          <svg viewBox="0 0 24 24" className="bj-mini__x">
            <motion.path d="M5 5 L19 19" pathLength="1" style={mark === true ? undefined : { pathLength: mark }} />
            <motion.path d="M19 5 L5 19" pathLength="1" style={mark === true ? undefined : { pathLength: mark }} />
          </svg>
        )}
      </span>
      <span className="bj-mini__line" />
    </span>
  );
}

function CastScene({ reduce, boxLabel, wordmark }) {
  const ref = useRef(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start 0.85", "end 0.35"] });
  const mark = useTransform(p, [0.04, 0.28], [0, 1]);
  const fold = useTransform(p, [0.34, 0.56], [0, -180]);
  const send = useTransform(p, [0.62, 0.9], [0, 132]);
  const glow = useTransform(p, [0.8, 0.88, 1], [0, 1, 0.25]);
  return (
    <div ref={ref} className="bj-cast" aria-hidden>
      {/* the ballot lives in a window whose floor is the slot, so sending it
          slides it out of the window — into the box */}
      <div className="bj-cast__window">
        <motion.div className="bj-mini" style={reduce ? undefined : { y: send }}>
          <motion.div className="bj-mini__top" style={reduce ? undefined : { rotateX: fold, transformPerspective: 700 }}>
            <div className="bj-mini__face bj-mini__face--front">
              <span className="bj-mini__head" />
              <MiniRow />
            </div>
            <div className="bj-mini__face bj-mini__face--back" />
          </motion.div>
          <div className="bj-mini__bottom">
            <MiniRow mark={reduce ? true : mark} />
            <MiniRow />
          </div>
        </motion.div>
      </div>

      {/* the online ballot box: a lit slot, a lock (the ballot is encrypted on
          the way in), and this election's name on its face */}
      <div className="bj-box">
        <BallotBox glow={reduce ? 0 : glow} label={boxLabel} wordmark={wordmark} idPrefix="bj" />
      </div>
      <span className="bj-cast__ground" />
    </div>
  );
}

export default function BallotJourney({ candidates = [], election, copy, text, visible, Wrap, editorMode, meta }) {
  const reduce = useReducedMotion();
  const intro = !editorMode;
  const j = copy.journey || {};
  const parties = candidates.filter((c) => c.number > 0).slice(0, 4);
  const href = (h) => (editorMode ? undefined : getPath(h));

  return (
    <div className="bj">
      {/* 1 · meet the candidates */}
      {visible("meet-section") && (
        <Wrap id="meet-section">
          <section className="bj-ch bj-ch--1">
            <div className="bj-in">
              <ChapterHead no="1" intro={intro}
                title={<Wrap id="meet-title"><span>{text("meet-title")}</span></Wrap>}
                body={<Wrap id="meet-cta"><span>{text("meet-cta")}</span></Wrap>} />
              <div className={`bj-parties ${parties.length === 1 ? "is-one" : ""}`}>
                {parties.map((p) => (
                  <BallotPartyCard key={p.id ?? p.number} party={p} editorMode={editorMode} large={parties.length === 1} />
                ))}
              </div>
            </div>
          </section>
        </Wrap>
      )}

      {/* 2 · sign in — and why your choice stays yours */}
      <section className="bj-ch bj-ch--2">
        <div className="bj-in bj-in--split">
          <ChapterHead no="2" intro={intro} title={j.ch2Title} body={j.ch2Body} />
          <div className="bj-secret" aria-label={`${j.ch2List} ${j.ch2Box} ${j.ch2Gap}`}>
            <div className="bj-secret__side">
              <span className="bj-secret__lbl">{j.ch2List}</span>
              <span className="bj-secret__rows" aria-hidden>
                <i /><i className="is-you" /><i /><i />
              </span>
              <span className="bj-secret__you">{j.ch2ListYou}</span>
            </div>
            <div className="bj-secret__gap">
              <Lock size={18} aria-hidden />
              <span>{j.ch2Gap}</span>
            </div>
            <div className="bj-secret__side">
              <span className="bj-secret__lbl">{j.ch2Box}</span>
              <span className="bj-secret__slips" aria-hidden><i /><i /><i /></span>
              <span className="bj-secret__note">{j.ch2BoxNote}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 · mark, then cast */}
      <section className="bj-ch bj-ch--3">
        <div className="bj-in bj-in--split">
          <ChapterHead no="3" intro={intro} title={j.ch3Title} body={j.ch3Body} />
          <CastScene reduce={reduce || editorMode} boxLabel={j.ch3Box} wordmark={meta.wordmark} />
        </div>
      </section>

      {/* 4 · count and announce — the page's night */}
      <section className="bj-ch bj-ch--4">
        <div className="bj-in">
          <ChapterHead no="4" intro={intro} title={j.ch4Title} body={j.ch4Body}>
            <p className="bj-close">
              {j.ch4Close} {formatThaiDate(election.end)} {formatThaiTime(election.end)}
            </p>
            <a href={href("/results")} className="bj-link">{j.ch4Link}</a>
          </ChapterHead>
          {visible("banner-section") && meta.bannerUrl && (
            <Wrap id="banner-section">
              <figure className="bj-poster">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getPath(meta.bannerUrl)} alt={`${text("hero-subtitle", meta.campaign)} ${meta.wordmark}`} />
              </figure>
            </Wrap>
          )}
        </div>
      </section>

      <style jsx global>{`
        /* the page deepens chapter by chapter; each chapter's background runs from
           the previous chapter's colour into its own, so there is no seam */
        .bj { --c1: #E8E2EE; --c2: #DFD6E8; --c3: #D2C4DD; --c4: #2A0E28; }
        .bj-ch { position: relative; }
        .bj-ch--1 { background: linear-gradient(var(--bo-board), var(--c1)); }
        .bj-ch--2 { background: linear-gradient(var(--c1), var(--c2)); }
        .bj-ch--3 { background: linear-gradient(var(--c2), var(--c3)); }
        .bj-ch--4 { background: linear-gradient(var(--c3), #5E1A58 140px, var(--c4) 420px); color: #fff; }
        .bj-in { max-width: var(--bo-max); margin: 0 auto; padding: 96px 20px; }
        .bj-ch--4 .bj-in { padding-top: 180px; }
        .bj-in--split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 72px; align-items: center; }

        /* chapter heading: the step number in a ballot box */
        .bj-head { max-width: 34em; }
        .bj-no {
          display: inline-grid; place-items: center; width: 44px; height: 44px; border: 2.5px solid var(--bo-ink);
          border-radius: 4px; font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums;
        }
        .bj-ch--4 .bj-no { border-color: #fff; }
        .bj-title { margin: 18px 0 0; font-size: clamp(28px, 3.2vw, 40px); font-weight: 800; line-height: 1.2; letter-spacing: -.01em; text-wrap: balance; }
        .bj-body { margin: 12px 0 0; font-family: var(--bo-font-read); font-size: 17px; line-height: 1.75; color: var(--bo-muted); max-width: 36em; }
        .bj-ch--4 .bj-body { color: rgba(255,255,255,.75); }

        /* 1 — parties: photo with a caption, not a card */
        .bj-parties { margin-top: 40px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; }
        .bj-parties.is-one { grid-template-columns: minmax(0, 760px); }

        /* 2 — two records that never meet */
        .bj-secret { display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px; align-items: center; }
        .bj-secret__side {
          display: flex; flex-direction: column; gap: 12px; padding: 22px; border-radius: 10px;
          background: rgba(255,255,255,.7); box-shadow: 0 0 0 1px rgba(46,20,60,.07);
        }
        .bj-secret__lbl { font-weight: 700; font-size: 16px; }
        .bj-secret__rows { display: flex; flex-direction: column; gap: 8px; }
        .bj-secret__rows i { display: block; height: 10px; border-radius: 5px; background: var(--bo-rule); }
        .bj-secret__rows i.is-you { background: var(--bo-plum); width: 70%; }
        .bj-secret__you { font-size: 14px; color: var(--bo-plum); font-weight: 600; }
        .bj-secret__slips { display: flex; gap: 8px; }
        .bj-secret__slips i { display: block; width: 34px; height: 44px; border-radius: 3px; background: #fff; box-shadow: 0 0 0 1px var(--bo-rule), 0 6px 12px -8px rgba(46,20,60,.4); }
        .bj-secret__note { font-size: 14px; color: var(--bo-muted); }
        .bj-secret__gap { display: flex; flex-direction: column; align-items: center; gap: 8px; max-width: 96px; text-align: center; font-size: 13px; color: var(--bo-muted); }
        .bj-secret__gap svg { color: var(--bo-plum); }

        /* 3 — the cast. Geometry (stage 300×440): the box's top face starts at
           y=250 and its slot sits 24–34px into it, so the window the ballot lives
           in ends at the slot (y=279). The ballot: 150 wide (it fits the slot),
           two 95px halves, resting just above the box. */
        .bj-cast { position: relative; width: 300px; height: 460px; margin: 0 auto; }
        /* the window sits IN FRONT of the box: the ballot crosses the top face and
           is cut exactly at the slot, so it reads as going into the slot rather
           than disappearing behind the box's back edge */
        .bj-cast__window { position: absolute; left: 0; right: 0; top: 0; height: 279px; overflow: hidden; perspective: 900px; z-index: 2; }
        .bj-mini { position: absolute; left: 75px; width: 150px; top: 84px; transform-style: preserve-3d; }
        .bj-mini__top { position: relative; height: 95px; transform-origin: 50% 100%; transform-style: preserve-3d; z-index: 2; }
        .bj-mini__face {
          position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden;
          background: #fff; border-radius: 5px 5px 0 0; padding: 14px 14px 0;
          box-shadow: 0 0 0 1px rgba(46,20,60,.07);
          display: flex; flex-direction: column; gap: 12px;
        }
        /* the back of the paper, seen once the top half has folded over */
        .bj-mini__face--back {
          transform: rotateX(180deg); border-radius: 0 0 5px 5px;
          background: linear-gradient(#F3EEF6, #E9E1EF);
          box-shadow: 0 0 0 1px rgba(46,20,60,.08), 0 10px 18px -12px rgba(46,20,60,.5);
        }
        .bj-mini__bottom {
          position: relative; height: 95px; background: #fff; border-radius: 0 0 5px 5px; padding: 8px 14px 0;
          display: flex; flex-direction: column; gap: 12px;
          box-shadow: 0 0 0 1px rgba(46,20,60,.07), 0 18px 30px -18px rgba(46,20,60,.45);
        }
        .bj-mini__head { display: block; height: 8px; width: 62%; border-radius: 4px; background: var(--bo-plum); margin-bottom: 4px; }
        .bj-mini__row { display: flex; align-items: center; gap: 10px; }
        .bj-mini__box { position: relative; width: 24px; height: 24px; border: 2px solid var(--bo-ink); border-radius: 3px; flex-shrink: 0; }
        .bj-mini__x { position: absolute; inset: 0; }
        .bj-mini__x path { fill: none; stroke: var(--bo-pen); stroke-width: 3.2; stroke-linecap: round; }
        .bj-mini__line { display: block; height: 8px; flex: 1; border-radius: 4px; background: var(--bo-rule); }

        .bj-box { position: absolute; left: 0; right: 0; top: 250px; height: 190px; z-index: 1; }
        .bj-cast__ground {
          position: absolute; left: 6%; right: 6%; bottom: -14px; height: 28px; border-radius: 50%;
          background: radial-gradient(closest-side, rgba(46,20,60,.35), rgba(46,20,60,0)); filter: blur(4px);
        }

        /* 4 — the count, at night */
        .bj-close { margin: 22px 0 0; font-size: 20px; font-weight: 700; }
        .bj-link { display: inline-block; margin-top: 14px; font-weight: 600; color: #fff; border-bottom: 1.5px solid rgba(255,255,255,.6); padding-bottom: 1px; transition: border-color .2s; }
        .bj-link:hover { border-color: #fff; }
        .bj-poster { margin: 56px 0 0; border-radius: 12px; overflow: hidden; box-shadow: 0 30px 60px -30px rgba(0,0,0,.6); }
        .bj-poster img { display: block; width: 100%; height: auto; }

        @media (max-width: 900px) {
          .bj-in { padding: 64px 20px; }
          .bj-ch--4 .bj-in { padding-top: 120px; }
          .bj-in--split { grid-template-columns: 1fr; gap: 36px; }
          .bj-parties { grid-template-columns: 1fr; gap: 28px; }
          .bj-secret { grid-template-columns: 1fr; }
          .bj-secret__gap { flex-direction: row; max-width: none; justify-content: center; }
        }
        @media (max-width: 640px) {
          .bj-in { padding: 48px 16px; }
          .bj-no { width: 36px; height: 36px; font-size: 18px; }
          .bj-title { font-size: 23px; margin-top: 14px; }
          .bj-body { font-size: 15px; }
          .bj-cast { transform: scale(.86); transform-origin: top center; margin-bottom: -64px; }
          .bj-close { font-size: 17px; }
          .bj-poster { margin-top: 36px; }
        }
      `}</style>
    </div>
  );
}
