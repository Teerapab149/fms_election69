"use client";

// FmsOfficialParty — a single party's page for the FMS Official template.
//
// This is the one inner page that legitimately gets its own opening rather than
// the shared title band: the subject IS the party, so the faculty chrome frames
// it rather than competing with it.
//
// The dossier itself lives in FmsOfficialPartyBody, because the single-party
// ballot presents the same document before asking for a decision. What is left
// here is what belongs to /party alone — where the reader came from, and where
// they go next.

import { ArrowLeft, ArrowRight } from "lucide-react";
import { getPath } from "../../utils/basePath";
import FmsOfficialShell from "./FmsOfficialShell";
import FmsOfficialPartyBody from "./FmsOfficialPartyBody";

export default function FmsOfficialParty({
  party = {}, galleryImages = [], showBackToVote = false, isSingleParty = false, editorMode = false,
}) {
  // A single-party election has no listing worth going back to — the vote page is
  // the only place the reader came from that they would want to return to.
  const backHref = showBackToVote ? "/vote" : isSingleParty ? "/vote" : "/candidates";
  const backLabel = showBackToVote || isSingleParty ? "กลับไปหน้าลงคะแนน" : "กลับไปรายชื่อผู้สมัคร";

  return (
    <FmsOfficialShell active="candidates" plain editorMode={editorMode}>
      <a href={editorMode ? undefined : getPath(backHref)} className="fo-back">
        <ArrowLeft size={16} aria-hidden /> {backLabel}
      </a>

      <FmsOfficialPartyBody party={party} galleryImages={galleryImages} editorMode={editorMode} />

      {/* The page runs ~4,300px on desktop and used to simply stop. A voter who
          reaches the bottom of a party's dossier has one obvious next move, so
          the family's plum panel closes it — the same device the home page uses
          to send readers to the candidate list. */}
      <section className="fo-party__sec">
        <a href={editorMode ? undefined : getPath(backHref)} className="fo-meet fo-party__next">
          <div className="fo-meet__txt">
            <b>{showBackToVote || isSingleParty ? "กลับไปลงคะแนน" : "ดูผู้สมัครรายอื่น"}</b>
            <span className="fo-meet__sub">
              {showBackToVote || isSingleParty
                ? "เมื่อศึกษาข้อมูลครบแล้ว กลับไปที่บัตรลงคะแนนเพื่อตัดสินใจ"
                : "เปรียบเทียบนโยบายและทีมงานของพรรคอื่นก่อนตัดสินใจ"}
            </span>
            <span className="fo-meet__rule" aria-hidden />
            <span className="fo-meet__go">{backLabel} <ArrowRight size={16} aria-hidden /></span>
          </div>
        </a>
      </section>

      <style jsx global>{`
        /* shorter than the home page panel: this one closes a long document
           rather than opening a section */
        .fo-party__next { min-height: 190px; padding: 34px 38px; }
        @media (max-width: 760px) {
          .fo-party__next { min-height: 0; padding: 26px 20px; }
        }
      `}</style>
    </FmsOfficialShell>
  );
}
