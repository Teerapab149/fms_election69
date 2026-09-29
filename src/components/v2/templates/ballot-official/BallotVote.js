"use client";

// BallotVote — the ballot page of the ballot-official family, single- and
// multi-party. Same contract as every family's vote component (props computed by
// app/vote/page.js); only the experience differs.
//
// The story continues from the home page's "journey":
//   1. you are handed your ballot — it arrives folded and opens in front of you
//      (a short, skippable intro; the reverse of the fold you will see at the end)
//   2. you mark it — tapping a row draws the pen's X in that row's box
//   3. you confirm — the shared VoteConfirm step, in this family's skin
//   4. it is folded and sent into the online box (useVoteCast → the family's scene)
//
// Rules this screen keeps:
//   - Options are equal: same row, same size, same hit area for party, disapprove
//     and abstain. A ballot that makes one choice easier than another is not neutral.
//   - Selection is unmistakable: the pen X, a tinted row, and the choice restated
//     on the stub next to the button.
//   - Nothing that carries meaning waits on an animation. Rows, labels and the
//     selected state are painted by CSS at rest; motion only adds the pen stroke.
//   - The decision is always reachable: a bar holding the choice and the button
//     floats at the bottom of the screen until the ballot itself is in view.
//
// Layout (single party): one column that uses the full width — the party's
// hero (name beside its group photo), its material laid out wide, then the
// ballot as the page's ending, on the decision band. Several parties: the
// title, then the ballot, centred.

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion"; // Motion for React
import { Info } from "lucide-react";
import { getPath } from "../../../../utils/basePath";
import { useGlobalConfig } from "../../../../contexts/GlobalConfigContext";
import VoteConfirm from "../../../vote/VoteConfirm";
import BallotPartyBody, { PhotoViewer } from "./BallotPartyBody";
import BallotPartyHero, { partyCover } from "./BallotPartyHero";
import { ballotOfficialTemplate } from "../../../admin/editor/templates/builtIn/ballot-official";
import { ballotMeta, BallotHeader, BallotFooter, BallotBaseStyles } from "./BallotChrome";

const EASE = [0.16, 1, 0.3, 1];
const src = (p) => (!p ? null : String(p).startsWith("http") ? p : getPath(p));

// The rows of this ballot. Single party: approve / disapprove / abstain.
// Several: one row per party, then abstain. Special options keep their names.
function ballotOptions(regularParties, specialOptions, isSingleParty, copy) {
  const { abstain, disapprove } = specialOptions || {};
  if (isSingleParty) {
    const p = regularParties[0];
    return [
      p && { id: p.id, kind: "party", party: p, no: p.number, logo: p.logoUrl, label: `${copy.approvePrefix} ${p.name || ""}`.trim() },
      disapprove && { id: disapprove.id, kind: "disapprove", party: disapprove, label: disapprove.name },
      abstain && { id: abstain.id, kind: "abstain", party: abstain, label: abstain.name },
    ].filter(Boolean);
  }
  return [
    ...regularParties.map((p) => ({ id: p.id, kind: "party", party: p, no: p.number, logo: p.logoUrl, label: p.name || String(p.number) })),
    ...(abstain ? [{ id: abstain.id, kind: "abstain", party: abstain, label: abstain.name }] : []),
  ];
}

// The pen X, drawn when a row is chosen (and instantly under reduced motion).
function PenMark({ reduce }) {
  const stroke = (d, delay) => (
    <motion.path d={d} pathLength="1"
      initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
      transition={{ duration: 0.22, delay, ease: "easeOut" }} />
  );
  return (
    <svg viewBox="0 0 24 24" className="bv-x" aria-hidden>
      {stroke("M5 5 L19 19", 0)}
      {stroke("M19 5 L5 19", 0.16)}
    </svg>
  );
}

// Opening: your ballot arrives folded and opens. Tap anywhere to skip; it also
// releases itself, and never blocks the page under reduced motion.
function HandOver({ wordmark, title, skip, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div className="bv-intro" onClick={onDone} role="presentation"
      initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}>
      <motion.div className="bv-intro__ballot"
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: EASE }}>
        <motion.div className="bv-intro__top" style={{ transformPerspective: 900 }}
          initial={{ rotateX: -180 }} animate={{ rotateX: 0 }} transition={{ delay: 0.75, duration: 0.8, ease: EASE }}>
          <div className="bv-intro__face bv-intro__face--front">
            <b>{title}</b>
            <span>{wordmark}</span>
          </div>
          <div className="bv-intro__face bv-intro__face--back" />
        </motion.div>
        <div className="bv-intro__bottom"><i /><i /><i /></div>
      </motion.div>
      <motion.p className="bv-intro__hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.5 }}>
        {skip}
      </motion.p>
    </motion.div>
  );
}


export default function BallotVote({
  regularParties = [], specialOptions = {}, selectedPartyId = null, onSelect = () => {},
  onViewDetails = () => {}, isSingleParty = false, isSubmitting = false, onConfirm = () => {},
  editorMode = false,
}) {
  const gc = useGlobalConfig() || {};
  const meta = ballotMeta(gc);
  const copy = ballotOfficialTemplate.copy;
  const v = copy.vote;
  const k = copy.party;
  const reduce = useReducedMotion();
  const [intro, setIntro] = useState(!editorMode);
  // the hand-over only plays with motion allowed; under reduced motion it never
  // mounts, so nothing may wait for it to finish
  const showIntro = intro && !reduce;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [viewing, setViewing] = useState(null); // src of the photo open full-screen
  const [ballotInView, setBallotInView] = useState(false);
  const [heroCtaInView, setHeroCtaInView] = useState(false);
  const heroCtaRef = useRef(null);
  const ballotRef = useRef(null);

  // the floating bar only appears when neither the hero's own button nor the
  // ballot is on screen — never two identical buttons in one view
  useEffect(() => {
    const el = heroCtaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setHeroCtaInView(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [showIntro]);

  // …and steps aside once the ballot itself is on screen
  useEffect(() => {
    const el = ballotRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setBallotInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [showIntro]);

  const options = ballotOptions(regularParties, specialOptions, isSingleParty, copy);
  const chosen = options.find((o) => o.id === selectedPartyId) || null;
  const lead = isSingleParty ? regularParties[0] : null;
  const photo = lead ? partyCover(lead) : null;

  const pick = (id) => { if (!editorMode && !isSubmitting) onSelect(id); };
  const toBallot = (e) => {
    e?.preventDefault?.();
    document.getElementById("bv-ballot")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  };
  const openConfirm = () => { if (!editorMode && chosen && !isSubmitting) setConfirmOpen(true); };
  // the page's onConfirm submits and plays the cast; the sheet steps aside for it
  const confirm = () => { setConfirmOpen(false); onConfirm(); };

  const ballot = (
    <article id="bv-ballot" ref={ballotRef} className="bv-ballot" aria-label={copy.ballotTitle}>
      <header className="bv-ballot__head">
        <div>
          <b className="bv-ballot__title">{copy.ballotTitle}</b>
          <span className="bv-ballot__of">{meta.org}</span>
        </div>
        <span className="bv-ballot__mark">{meta.wordmark}</span>
      </header>

      <div className="bv-rows" role="radiogroup" aria-label={v.options}>
        {options.map((o) => {
          const on = o.id === selectedPartyId;
          return (
            <div key={o.id} className={`bv-row ${on ? "is-on" : ""}`}>
              <button type="button" role="radio" aria-checked={on} className="bv-row__hit"
                onClick={() => pick(o.id)} disabled={isSubmitting}>
                <span className="bv-row__box">{on && <PenMark reduce={reduce} />}</span>
                {o.no != null && <span className="bv-row__no">{o.no}</span>}
                {o.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="bv-row__logo" src={src(o.logo)} alt="" />
                )}
                <span className="bv-row__label">{o.label}</span>
              </button>
              {!isSingleParty && o.kind === "party" && (
                <button type="button" className="bv-row__info" onClick={() => onViewDetails(o.party)}
                  aria-label={`${v.detailsOf} ${o.label}`}>
                  <Info size={18} aria-hidden />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="bv-ballot__rule">{v.rule}</p>

      <div className="bo-perf" aria-hidden />

      <div className="bv-stub">
        <p className="bv-stub__choice" aria-live="polite">
          {chosen ? <>{v.chosen} <b>{chosen.label}</b></> : v.none}
        </p>
        <button type="button" className="bo-cta" onClick={openConfirm} disabled={!chosen || isSubmitting}>
          {v.confirm}
        </button>
      </div>
    </article>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="fms-app bo-root">
        <BallotBaseStyles />
        <BallotHeader active="vote" editorMode={editorMode} />

        <AnimatePresence>
          {showIntro && <HandOver key="intro" title={copy.ballotTitle} wordmark={meta.wordmark} skip={v.skip} onDone={() => setIntro(false)} />}
        </AnimatePresence>

        <main className="bv">
          {lead ? (
            <>
              {/* the party you are asked about: its name beside its people — the
                  group photo is the first thing a voter should recognise */}
              <BallotPartyHero ref={heroCtaRef} party={lead} meta={meta} hidden={showIntro}
                onView={setViewing} cta={{ href: "#bv-ballot", label: k.toBallot, onClick: toBallot }} />

              {/* everything the party page carries, laid out wide */}
              <section className="bv-wrap bv-body">
                <BallotPartyBody party={lead} cover={false} wide />
              </section>

              {/* the page ends where the voter acts */}
              <section className="bv-decide">
                <div className="bv-wrap bv-decide__in">
                  <h2 className="bv-decide__title">{v.decideTitle}</h2>
                  <p className="bv-decide__note">{v.decideSingle}</p>
                  {ballot}
                </div>
              </section>
            </>
          ) : (
            <section className="bv-decide bv-decide--solo">
              <div className="bv-wrap bv-decide__in">
                <h1 className="bv-decide__title">{v.titleMulti}</h1>
                <p className="bv-decide__note">{meta.campaign} {meta.org} <span className="bo-nowrap">ปีการศึกษา {meta.ay}</span></p>
                <p className="bv-decide__note">{v.decideMulti}</p>
                {ballot}
              </div>
            </section>
          )}
        </main>

        {/* the decision floats under the thumb until the ballot is on screen; with
            nothing chosen it takes you there, once a box is marked it confirms */}
        <AnimatePresence>
          {!ballotInView && !heroCtaInView && !showIntro && (
            <motion.div className="bv-bar" key="bar" role="region" aria-label={v.decideTitle}
              initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}>
              <p className="bv-bar__choice">
                {chosen ? <><span className="bv-bar__dot" aria-hidden />{chosen.label}</> : v.none}
              </p>
              <button type="button" className="bo-cta bv-bar__cta" onClick={chosen ? openConfirm : toBallot} disabled={isSubmitting}>
                {chosen ? v.confirm : k.toBallot}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <BallotFooter meta={meta} />

        <PhotoViewer photo={viewing || null} alt={lead?.name || ""} onClose={() => setViewing(null)} />

        <VoteConfirm
          family="ballot-official"
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={confirm}
          party={chosen?.party}
          isVoteNo={chosen?.kind === "abstain"}
          isDisapprove={chosen?.kind === "disapprove"}
          isSubmitting={isSubmitting}
        />

        <style jsx global>{`
          .bv-wrap { max-width: var(--bo-max); margin: 0 auto; padding-left: 20px; padding-right: 20px; }


          /* ── the party's material ── */
          .bv-body { padding-top: 64px; padding-bottom: 88px; }
          .bh + .bv-body { border-top: 1px solid var(--bo-rule); }

          /* ── the decision band: the page's ending ── */
          .bv-decide { background: linear-gradient(var(--bo-board), var(--bo-tint-3)); padding: 80px 0 104px; border-top: 1px solid var(--bo-rule); }
          .bv-decide--solo { border-top: 0; padding-top: 48px; background: linear-gradient(var(--bo-board), var(--bo-tint-2)); }
          .bv-decide__in { display: flex; flex-direction: column; align-items: center; text-align: center; }
          .bv-decide__title { margin: 0; font-size: clamp(28px, 3vw, 38px); font-weight: 800; line-height: 1.2; }
          .bv-decide__note { margin: 10px 0 0; max-width: 38em; font-size: 16px; line-height: 1.7; color: var(--bo-muted); }

          /* ── the ballot ── */
          .bv-ballot {
            width: 100%; max-width: 560px; margin-top: 36px; text-align: left; scroll-margin-top: 112px;
            background: var(--bo-paper); border-radius: 10px; overflow: hidden;
            box-shadow: 0 0 0 1px rgba(var(--bo-shade-rgb),.06), 0 2px 4px rgba(var(--bo-shade-rgb),.05), 0 18px 36px -18px rgba(var(--bo-shade-rgb),.28), 0 48px 80px -48px rgba(var(--bo-shade-rgb),.4);
          }
          .bv-ballot__head { display: flex; justify-content: space-between; gap: 16px; padding: 22px 24px 14px; box-shadow: inset 0 5px 0 var(--bo-plum); border-bottom: 1px solid var(--bo-rule); }
          .bv-ballot__title { display: block; font-size: 23px; font-weight: 800; line-height: 1.2; }
          .bv-ballot__of { display: block; font-size: 14px; color: var(--bo-muted); }
          .bv-ballot__mark { font-size: 15px; font-weight: 700; color: var(--bo-plum); white-space: nowrap; padding-top: 4px; }

          .bv-rows { padding: 8px 12px; }
          .bv-row { display: flex; align-items: stretch; border-radius: 8px; transition: background-color .2s; }
          .bv-row + .bv-row { margin-top: 2px; }
          .bv-row.is-on { background: rgba(var(--bo-pen-rgb),.07); }
          .bv-row__hit {
            flex: 1; display: flex; align-items: center; gap: 14px; min-height: 60px; padding: 8px 12px;
            background: none; border: 0; border-radius: 8px; text-align: left; color: var(--bo-ink);
          }
          .bv-row__hit:hover:not(:disabled) { background: rgba(var(--bo-shade-rgb),.04); }
          .bv-row__box { position: relative; width: 30px; height: 30px; border: 2px solid var(--bo-ink); border-radius: 3px; flex-shrink: 0; background: #fff; }
          .bv-row.is-on .bv-row__box { border-color: var(--bo-pen); }
          .bv-x { position: absolute; inset: 1px; }
          .bv-x path { fill: none; stroke: var(--bo-pen); stroke-width: 3.4; stroke-linecap: round; }
          .bv-row__no { font-size: 22px; font-weight: 800; min-width: 1.1em; font-variant-numeric: tabular-nums; }
          .bv-row__logo { width: 34px; height: 34px; object-fit: contain; flex-shrink: 0; }
          .bv-row__label { font-size: 17px; font-weight: 600; line-height: 1.35; }
          .bv-row.is-on .bv-row__label { color: var(--bo-pen); }
          .bv-row__info { width: 48px; flex-shrink: 0; display: grid; place-items: center; background: none; border: 0; border-radius: 8px; color: var(--bo-muted); }
          .bv-row__info:hover { color: var(--bo-plum); background: rgba(var(--bo-shade-rgb),.04); }
          .bv-ballot__rule { margin: 0; padding: 4px 24px 16px; font-size: 14px; color: var(--bo-muted); }
          .bv-stub { padding: 20px 24px 24px; }
          .bv-stub__choice { margin: 0 0 12px; font-size: 15px; color: var(--bo-muted); min-height: 1.6em; }
          .bv-stub__choice b { color: var(--bo-pen); font-weight: 700; }

          /* ── the floating decision bar (every width) ── */
          .bv-bar {
            position: fixed; left: 50%; bottom: 20px; z-index: 60; translate: -50% 0;
            width: min(560px, calc(100% - 24px)); display: flex; align-items: center; gap: 14px;
            padding: 10px 10px 10px 20px; border-radius: 14px; background: rgba(255,255,255,.97);
            box-shadow: 0 0 0 1px rgba(var(--bo-shade-rgb),.08), 0 18px 40px -16px rgba(var(--bo-shade-rgb),.45);
          }
          .bv-bar__choice { flex: 1; min-width: 0; margin: 0; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .bv-bar__dot { width: 9px; height: 9px; border-radius: 50%; background: var(--bo-pen); flex-shrink: 0; }
          .bv-bar__cta { width: auto; min-height: 46px; padding: 0 20px; font-size: 15.5px; flex-shrink: 0; }

          @media (max-width: 640px) {
            .bv-wrap { padding-left: 16px; padding-right: 16px; }
            .bv-body { padding-top: 44px; padding-bottom: 60px; }
            .bv-decide { padding: 56px 0 120px; }
            .bv-decide__title { font-size: 25px; }
            .bv-decide__note { font-size: 14.5px; }
            .bv-ballot { margin-top: 26px; }
            .bv-ballot__head { padding: 16px 16px 12px; }
            .bv-ballot__title { font-size: 18px; }
            .bv-ballot__mark { font-size: 13px; }
            .bv-rows { padding: 6px; }
            .bv-row__hit { min-height: 54px; gap: 11px; padding: 6px 10px; }
            .bv-row__box { width: 26px; height: 26px; }
            .bv-row__no { font-size: 18px; }
            .bv-row__logo { width: 28px; height: 28px; }
            .bv-row__label { font-size: 15px; }
            .bv-ballot__rule { padding: 4px 16px 12px; font-size: 12.5px; }
            .bv-stub { padding: 14px 16px 18px; }
            .bv-bar { bottom: calc(10px + env(safe-area-inset-bottom)); padding: 8px 8px 8px 14px; gap: 10px; }
            .bv-bar__choice { font-size: 14px; }
            .bv-bar__cta { min-height: 44px; padding: 0 16px; font-size: 14.5px; }
          }

          /* opening: the handed-over ballot */
          .bv-intro {
            position: fixed; inset: 0; z-index: 9000; display: grid; place-items: center; align-content: center; gap: 22px;
            background: var(--bo-board); cursor: pointer;
          }
          .bv-intro__ballot { width: 240px; transform-style: preserve-3d; }
          .bv-intro__top { position: relative; height: 120px; transform-origin: 50% 100%; transform-style: preserve-3d; }
          .bv-intro__face {
            position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden;
            border-radius: 8px 8px 0 0; background: #fff; box-shadow: inset 0 5px 0 var(--bo-plum), 0 0 0 1px rgba(var(--bo-shade-rgb),.07);
            display: flex; flex-direction: column; justify-content: center; padding: 0 20px;
          }
          .bv-intro__face b { font-size: 24px; font-weight: 800; }
          .bv-intro__face span { color: var(--bo-plum); font-weight: 700; }
          .bv-intro__face--back { transform: rotateX(180deg); border-radius: 0 0 8px 8px; background: linear-gradient(var(--bo-tint-1), var(--bo-tint-2)); box-shadow: 0 0 0 1px rgba(var(--bo-shade-rgb),.08); }
          .bv-intro__bottom {
            height: 120px; background: #fff; border-radius: 0 0 8px 8px; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px;
            box-shadow: 0 0 0 1px rgba(var(--bo-shade-rgb),.07), 0 24px 44px -24px rgba(var(--bo-shade-rgb),.5);
          }
          .bv-intro__bottom i { display: block; height: 10px; border-radius: 5px; background: var(--bo-rule); }
          .bv-intro__hint { margin: 0; font-size: 13px; color: var(--bo-muted); }
        `}</style>
      </div>
    </MotionConfig>
  );
}
