"use client";

// BallotPartyHero — the party's name beside its group photo. Shared by the
// single-party ballot page and the party page so a voter meets a party the same
// way on both. The action button is the caller's (go to the ballot, or back to
// it); the photo opens full-screen through the caller's viewer.

import { forwardRef } from "react";
import { motion } from "framer-motion"; // Motion for React
import { Maximize2 } from "lucide-react";
import { getPath } from "../../../../utils/basePath";
import { normalizeImageUrls } from "../../../../utils/imageUrls";
import { ballotOfficialTemplate } from "../../../admin/editor/templates/builtIn/ballot-official";

const EASE = [0.16, 1, 0.3, 1];
const src = (p) => (!p ? null : String(p).startsWith("http") ? p : getPath(p));

export function partyCover(party) {
  return src(normalizeImageUrls(party?.groupImageUrls)[0] || party?.officialImageUrl);
}

const BallotPartyHero = forwardRef(function BallotPartyHero(
  { party, meta, cta = null, onView = () => {}, hidden = false, as: Heading = "h1" }, ctaRef,
) {
  const copy = ballotOfficialTemplate.copy;
  const k = copy.party;
  const v = copy.vote;
  const photo = partyCover(party);
  const teamCount = party?.members?.length || 0;
  const policyCount = (party?.policies || []).length;

  return (
    <section className="bh">
      <div className="bh__in">
        <div className="bh__txt">
          <p className="bh__ctx">{meta.wordmark} {meta.campaign}</p>
          <div className="bh__mark">
            {party?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="bh__logo" src={src(party.logoUrl)} alt="" />
            )}
            <span className="bh__no">{k.numberLabel} {party?.number}</span>
          </div>
          <Heading className="bh__name">{party?.name}</Heading>
          {party?.slogan && <p className="bh__slogan">{party.slogan}</p>}
          {(teamCount > 0 || policyCount > 0) && (
            <dl className="bh__facts">
              {teamCount > 0 && <div><dt>{v.team}</dt><dd>{teamCount} <span>{k.people}</span></dd></div>}
              {policyCount > 0 && <div><dt>{v.policies}</dt><dd>{policyCount} <span>{k.items}</span></dd></div>}
            </dl>
          )}
          {cta && (
            <a href={cta.href} ref={ctaRef} className="bo-cta bh__cta" onClick={cta.onClick}>{cta.label}</a>
          )}
        </div>
        {photo && (
          <motion.button type="button" className="bh__photo" onClick={() => onView(photo)}
            aria-label={`${k.enlarge} ${party?.name || ""}`}
            initial={{ opacity: 0, y: 24 }} animate={hidden ? { opacity: 0, y: 24 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" />
            <span className="bh__zoom" aria-hidden><Maximize2 size={14} /> {k.enlarge}</span>
          </motion.button>
        )}
      </div>

      <style jsx global>{`
        .bh { padding: 48px 0 72px; }
        .bh__in {
          max-width: var(--bo-max); margin: 0 auto; padding: 0 20px;
          display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 56px; align-items: center;
        }
        .bh__ctx { margin: 0; font-size: 15px; color: var(--bo-muted); }
        .bh__mark { display: flex; align-items: center; gap: 14px; margin-top: 20px; }
        .bh__logo { width: 64px; height: 64px; object-fit: contain; border-radius: 12px; background: #fff; padding: 7px; box-shadow: 0 0 0 1px var(--bo-rule); }
        .bh__no {
          display: inline-flex; align-items: center; height: 40px; padding: 0 14px; border-radius: 6px;
          background: var(--bo-plum); color: #fff; font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums;
        }
        .bh__name { margin: 18px 0 0; font-size: clamp(34px, 4vw, 52px); font-weight: 800; line-height: 1.15; letter-spacing: -.015em; text-wrap: balance; }
        .bh__slogan { margin: 12px 0 0; font-family: var(--bo-font-read); font-size: 18px; line-height: 1.7; color: var(--bo-muted); max-width: 30em; }
        .bh__facts { display: flex; gap: 36px; margin: 28px 0 0; padding: 18px 0 0; border-top: 1px solid var(--bo-rule); }
        .bh__facts dt { font-size: 14px; color: var(--bo-muted); }
        .bh__facts dd { margin: 2px 0 0; font-size: 28px; font-weight: 800; line-height: 1.1; font-variant-numeric: tabular-nums; }
        .bh__facts dd span { font-size: 15px; font-weight: 600; color: var(--bo-muted); margin-left: 2px; }
        .bh__cta { display: inline-flex; width: auto; margin-top: 30px; padding: 0 28px; }
        .bh__photo {
          position: relative; display: block; padding: 0; border: 0; border-radius: 14px; overflow: hidden;
          aspect-ratio: 4 / 3; background: var(--bo-rule); cursor: zoom-in;
          box-shadow: 0 0 0 1px rgba(var(--bo-shade-rgb),.06), 0 30px 60px -36px rgba(var(--bo-shade-rgb),.5);
        }
        .bh__photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .7s cubic-bezier(.16,1,.3,1); }
        .bh__photo:hover img { transform: scale(1.02); }
        .bh__zoom {
          position: absolute; right: 12px; bottom: 12px; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
          padding: 6px 10px; border-radius: 8px; background: rgba(var(--bo-ink-rgb),.66); color: #fff; font-size: 13px;
        }
        @media (max-width: 960px) {
          .bh { padding: 24px 0 48px; }
          .bh__in { grid-template-columns: 1fr; gap: 20px; }
          .bh__photo { order: -1; aspect-ratio: 16 / 10; }
        }
        @media (max-width: 640px) {
          .bh { padding: 16px 0 40px; }
          .bh__in { padding: 0 16px; }
          .bh__ctx { font-size: 13px; }
          .bh__mark { margin-top: 12px; gap: 10px; }
          .bh__logo { width: 48px; height: 48px; padding: 5px; }
          .bh__no { height: 34px; padding: 0 11px; font-size: 15px; }
          .bh__name { margin-top: 12px; font-size: 27px; }
          .bh__slogan { font-size: 15px; }
          .bh__facts { gap: 28px; margin-top: 20px; padding-top: 14px; }
          .bh__facts dd { font-size: 23px; }
          .bh__cta { display: flex; width: 100%; margin-top: 22px; }
        }
      `}</style>
    </section>
  );
});

export default BallotPartyHero;
