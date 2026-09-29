"use client";

// BallotPartyCard — one party, as a photo with its caption (not a boxed card):
// group photo, ballot number, name, slogan, and the way into its page. Used by
// the home page's first chapter and by the candidates page, so a party is
// introduced the same way wherever a voter meets it.
//
// The party page takes the party's NUMBER as ?id= (app/party/page.js).

import { getPath } from "../../../../utils/basePath";
import { ballotOfficialTemplate } from "../../../admin/editor/templates/builtIn/ballot-official";
import { partyCover } from "./BallotPartyHero";

export default function BallotPartyCard({ party, editorMode = false, large = false }) {
  const k = ballotOfficialTemplate.copy.party;
  const photo = partyCover(party);
  const teamCount = party?.members?.length || 0;
  return (
    <a href={editorMode ? undefined : getPath(`/party?id=${party.number}`)} className={`bpc ${large ? "bpc--large" : ""}`}>
      <span className="bpc__photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo && <img src={photo} alt={party.name || ""} loading="lazy" />}
      </span>
      <span className="bpc__cap">
        <span className="bpc__no">{party.number}</span>
        <span className="bpc__txt">
          <b>{party.name}</b>
          {party.slogan && <span className="bpc__slogan">{party.slogan}</span>}
          {teamCount > 0 && <span className="bpc__meta">{copyTeam(teamCount)}</span>}
          <span className="bpc__go">{ballotOfficialTemplate.copy.journey.ch1Link}</span>
        </span>
      </span>
      <style jsx global>{`
        .bpc { display: block; color: var(--bo-ink); text-decoration: none; }
        .bpc__photo { display: block; aspect-ratio: 16 / 9; border-radius: 10px; overflow: hidden; background: var(--bo-rule); }
        .bpc__photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .6s cubic-bezier(.16,1,.3,1); }
        .bpc:hover .bpc__photo img { transform: scale(1.03); }
        .bpc__cap { display: flex; gap: 14px; align-items: flex-start; margin-top: 16px; }
        .bpc__no {
          flex-shrink: 0; display: inline-grid; place-items: center; width: 40px; height: 40px;
          border-radius: 4px; background: var(--bo-plum); color: #fff; font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums;
        }
        .bpc__txt { min-width: 0; }
        .bpc__txt b { display: block; font-size: 20px; font-weight: 700; line-height: 1.3; }
        .bpc__slogan { display: block; margin-top: 2px; font-family: var(--bo-font-read); color: var(--bo-muted); font-size: 15px; line-height: 1.6; }
        .bpc__meta { display: block; margin-top: 4px; font-size: 13.5px; color: var(--bo-muted); }
        .bpc__go { display: inline-block; margin-top: 10px; font-weight: 600; color: var(--bo-plum); border-bottom: 1.5px solid currentColor; padding-bottom: 1px; }
        .bpc--large .bpc__txt b { font-size: 24px; }
        .bpc--large .bpc__no { width: 48px; height: 48px; font-size: 24px; }
        @media (max-width: 640px) {
          .bpc__txt b, .bpc--large .bpc__txt b { font-size: 17px; }
          .bpc__slogan { font-size: 14px; }
          .bpc__no, .bpc--large .bpc__no { width: 34px; height: 34px; font-size: 17px; }
          .bpc__go { font-size: 14px; }
        }
      `}</style>
    </a>
  );

  function copyTeam(n) { return `${ballotOfficialTemplate.copy.vote.team} ${n} ${k.people}`; }
}
