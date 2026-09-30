"use client";

// BallotCandidates — the candidates page of the ballot-official family: every
// party standing, in ballot order, introduced the same way as on the home page
// (BallotPartyCard). Only real parties — numbers 0 and -1 are the abstain /
// disapprove options on the ballot, not people standing. The page ends pointing
// at the ballot, like the party page.

import { MotionConfig } from "framer-motion"; // Motion for React
import { getPath } from "../../../../utils/basePath";
import { useGlobalConfig } from "../../../../contexts/GlobalConfigContext";
import { ballotOfficialTemplate } from "../../../admin/editor/templates/builtIn/ballot-official";
import { ballotMeta, BallotHeader, BallotFooter, BallotBaseStyles, BallotPageHead } from "./BallotChrome";
import BallotPartyCard from "./BallotPartyCard";

export default function BallotCandidates({ candidates = [], editorMode = false }) {
  const meta = ballotMeta(useGlobalConfig() || {});
  const copy = ballotOfficialTemplate.copy;
  const c = copy.candidates;
  const p = copy.partyPage;
  const parties = candidates.filter((x) => x.number > 0).sort((a, b) => a.number - b.number);

  return (
    <MotionConfig reducedMotion="user">
      <div className="fms-app bo-root">
        <BallotBaseStyles />
        <BallotHeader active="candidates" editorMode={editorMode} />

        <main>
          <section className="bc">
            <div className="bc__in">
              <BallotPageHead meta={meta} title={c.title} lede={c.lede}
                aside={parties.length > 0 ? `${parties.length} ${c.count}` : null} />

              {parties.length > 0 ? (
                <div className={`bc__grid ${parties.length === 1 ? "is-one" : ""}`}>
                  {parties.map((party) => (
                    <BallotPartyCard key={party.id ?? party.number} party={party} editorMode={editorMode} large={parties.length <= 2} />
                  ))}
                </div>
              ) : (
                <p className="bc__empty">{c.empty}</p>
              )}
            </div>
          </section>

          {parties.length > 0 && (
            <section className="bo-end bc__end">
              <div className="bo-end__in">
                <h2 className="bo-end__title">{p.endTitle}</h2>
                <div className="bo-end__acts">
                  <a href={editorMode ? undefined : getPath("/vote")} className="bo-cta bo-end__cta">{copy.party.toBallot}</a>
                </div>
              </div>
            </section>
          )}
        </main>

        <BallotFooter meta={meta} />

        <style jsx global>{`
          .bc__in { max-width: var(--bo-max); margin: 0 auto; padding: 56px 20px 88px; }
          .bc__grid { margin-top: 44px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 48px 36px; }
          .bc__grid.is-one { grid-template-columns: minmax(0, 820px); }
          .bc__empty { margin-top: 44px; padding: 32px; border-radius: 10px; border: 1px dashed var(--bo-rule); color: var(--bo-muted); text-align: center; }
          @media (max-width: 760px) {
            .bc__grid { grid-template-columns: minmax(0, 1fr); gap: 36px; }
          }
          @media (max-width: 640px) {
            .bc__in { padding: 28px 16px 60px; }
            .bc__grid { margin-top: 28px; }
          }
        `}</style>
      </div>
    </MotionConfig>
  );
}
