"use client";

// BallotParty — the party page of the ballot-official family. Same props as every
// family's party component (app/party/page.js). It tells the same story as the
// single-party ballot page — the shared hero and BallotPartyBody — and ends by
// pointing at the ballot instead of holding one.

import { useState } from "react";
import { MotionConfig } from "framer-motion"; // Motion for React
import { getPath } from "../../../../utils/basePath";
import { useGlobalConfig } from "../../../../contexts/GlobalConfigContext";
import { ballotOfficialTemplate } from "../../../admin/editor/templates/builtIn/ballot-official";
import { ballotMeta, BallotHeader, BallotFooter, BallotBaseStyles } from "./BallotChrome";
import BallotPartyHero from "./BallotPartyHero";
import BallotPartyBody, { PhotoViewer } from "./BallotPartyBody";

export default function BallotParty({ party = {}, showBackToVote = false, isSingleParty = false, editorMode = false }) {
  const meta = ballotMeta(useGlobalConfig() || {});
  const copy = ballotOfficialTemplate.copy;
  const k = copy.party;
  const p = copy.partyPage;
  const [viewing, setViewing] = useState(null);
  const href = (h) => (editorMode ? undefined : getPath(h));
  // coming from the ballot, the way back is the way forward
  const toBallot = { href: href("/vote"), label: showBackToVote ? p.backToBallot : k.toBallot };

  return (
    <MotionConfig reducedMotion="user">
      <div className="fms-app bo-root">
        <BallotBaseStyles />
        <BallotHeader active="candidates" editorMode={editorMode} />

        <main>
          <BallotPartyHero party={party} meta={meta} onView={setViewing} cta={toBallot} />

          <section className="bpp-body">
            <BallotPartyBody party={party} cover={false} wide />
          </section>

          {/* the page ends pointing at the ballot */}
          <section className="bo-end">
            <div className="bo-end__in">
              <h2 className="bo-end__title">{p.endTitle}</h2>
              <p className="bo-end__note">{p.endNote}</p>
              <div className="bo-end__acts">
                <a href={toBallot.href} className="bo-cta bo-end__cta">{toBallot.label}</a>
                {!isSingleParty && (
                  <a href={href("/candidates")} className="bo-end__alt">{p.allCandidates}</a>
                )}
              </div>
            </div>
          </section>
        </main>

        <BallotFooter meta={meta} />
        <PhotoViewer photo={viewing} alt={party?.name || ""} onClose={() => setViewing(null)} />

        <style jsx global>{`
          .bpp-body { max-width: var(--bo-max); margin: 0 auto; padding: 64px 20px 88px; border-top: 1px solid var(--bo-rule); }
          @media (max-width: 640px) {
            .bpp-body { padding: 44px 16px 60px; }
          }
        `}</style>
      </div>
    </MotionConfig>
  );
}
