"use client";

// GumroadVote — the "Active Pulse" VOTE LAYOUT (template: gumroad).
//
// Recreated from docs/design-refs/index.html (02 Vote): gumroad topbar + page
// head (LIVE BALLOT sticker + chunky title + greeting) + party-card grid (NO.
// badge, lime check on select, logo media, name/slogan, ดูรายละเอียด) + a
// special-option card (งดออกเสียง for multi · ไม่รับรอง for single) + sticky
// chunky vote footer (selection label + confirm). Chunky identity hardcoded
// (Rule 9). Container-query responsive (works in the editor frame + real device).
//
// Election correctness: same vote-system contract as MultiPartyView/SinglePartyView
// — regularParties + specialOptions{abstain,disapprove} + selectedPartyId +
// onSelect(id) + onViewDetails(party). Single-party (1 candidate) shows that party
// + the ไม่รับรอง (disapprove, number -1) option; multi shows งดออกเสียง (abstain, 0).
// Confirm calls onConfirm (parent owns submit + VoteConfirmationModal). editorMode:
// key elements carry data-element + the stable Wrap → selectable in the editor.

import React, { useRef, useCallback } from "react";
import { GumroadBaseStyles } from "../home/GumroadTheme";
import SiteNavbar from "../elements/site-navbar/gumroad";
import { Check, Ban } from "lucide-react";
import EditorElement from "../admin/editor/EditorElement";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import GumroadSingleParty from "./GumroadSingleParty";
import VotePartyCard from "../composites/vote-party-card/gumroad";

const INK = "#26271c", CREAM = "#FFF6EC", PAPER = "#FFFDFA", PINK = "#FF9CE9",
  LIME = "#C2F47E", YELLOW = "#FFD24D", CREAM_2 = "#FFE9D6", INK_2 = "#5c5a4b";

export default function GumroadVote({
  regularParties = [],
  specialOptions = {},
  selectedPartyId = null,
  onSelect = () => {},
  onViewDetails = () => {},
  isSingleParty = false,
  user = null,
  onConfirm = () => {},
  isSubmitting = false,
  editorMode = false,
  elementConfigs = null,
  selectedElement = null,
  hoveredElement = null,
  onSelectElement = null,
  onHoverElement = null,
  onHoverEnd = null,
}) {
  const editorStateRef = useRef(null);
  editorStateRef.current = { editorMode, elementConfigs, selectedElement, hoveredElement, onSelectElement, onHoverElement, onHoverEnd };
  const Wrap = useCallback(({ id, children }) => {
    const s = editorStateRef.current;
    if (!s.editorMode) return children;
    return (
      <EditorElement id={id} config={s.elementConfigs?.[id]}
        isSelected={s.selectedElement === id} isHovered={s.hoveredElement === id}
        onSelect={s.onSelectElement} onHover={s.onHoverElement} onHoverEnd={s.onHoverEnd}>{children}</EditorElement>
    );
  }, []);

  // Special option: multi → abstain (งดออกเสียง, 0); single → disapprove (ไม่รับรอง, -1).
  const special = isSingleParty ? specialOptions?.disapprove : specialOptions?.abstain;
  const specialId = special?.id;
  const specialElementId = isSingleParty ? "vote-disapprove-button" : "vote-abstain-button";
  const specialTitle = isSingleParty ? "ไม่รับรอง · Disapprove" : "งดออกเสียง · Abstain";
  const specialDesc = isSingleParty
    ? "ไม่เห็นชอบให้พรรคเดียวที่ลงสมัครดำรงตำแหน่ง"
    : "ไม่ประสงค์ลงคะแนนเสียงในการเลือกตั้งครั้งนี้";

  const selected = selectedPartyId != null;
  const selectedName = (() => {
    if (selectedPartyId == null) return null;
    const p = regularParties.find((x) => x.id === selectedPartyId);
    if (p) return p.name;
    if (specialId === selectedPartyId) return specialTitle.split(" · ")[0];
    return null;
  })();

  const globalConfig = useGlobalConfig();
  const orgShort = globalConfig?.organizationShort || "สโมสรนักศึกษา";

  const userName = user?.name || (editorMode ? "Teerapab Boonsri" : "");

  const POPS = [PINK, LIME, YELLOW, "#A8E1FF"];

  // Single party → full party-presentation view (cinematic intro + 3-choice vote).
  // Multi party → the card grid below.
  if (isSingleParty) {
    return (
      <GumroadSingleParty
        party={regularParties[0] || {}}
        specialOptions={specialOptions}
        selectedPartyId={selectedPartyId}
        onSelect={onSelect}
        onConfirm={onConfirm}
        isSubmitting={isSubmitting}
        user={user}
        editorMode={editorMode}
      />
    );
  }

  return (
    <div className="fms-app gv-root gum-root">
      <GumroadBaseStyles />
      {/* TOPBAR — shared gumroad navbar element */}
      <SiteNavbar />

      <main className="gv-page">
        {/* HEAD */}
        <div className="gv-head">
          <Wrap id="vote-header-badge">
            <span className="gv-sticker gv-sticker--pink" data-element="vote-header-badge"><span className="gv-livedot" /> ลงคะแนนเสียง · LIVE BALLOT</span>
          </Wrap>
          <Wrap id="vote-header-title">
            <h1 className="gv-title" data-element="vote-header-title">เลือกตั้ง<em>{orgShort}</em></h1>
          </Wrap>
          <Wrap id="vote-header-subtitle">
            <p className="gv-subtitle" data-element="vote-header-subtitle">
              {userName ? <>สวัสดีคุณ <strong>{userName}</strong> · </> : null}คลิกพรรคที่คุณต้องการ{isSingleParty ? " หรือเลือกไม่รับรอง" : " หรือเลือกงดออกเสียง"}
            </p>
          </Wrap>
        </div>

        {/* PARTY GRID */}
        <div className={`gv-grid ${isSingleParty ? "gv-grid--single" : ""}`}>
          {regularParties.map((party, i) => {
            const isSel = selectedPartyId === party.id;
            const pop = POPS[i % POPS.length];
            const cardEl = (
              <VotePartyCard
                party={party} pop={pop} isSel={isSel}
                onSelect={onSelect} onViewDetails={onViewDetails} editorMode={editorMode}
                dataElement={i === 0 ? "vote-party-card" : undefined}
              />
            );
            return (
              <React.Fragment key={party.id}>
                {i === 0 ? <Wrap id="vote-party-card">{cardEl}</Wrap> : cardEl}
              </React.Fragment>
            );
          })}
        </div>

        {/* OR divider */}
        <div className="gv-or"><hr /><span>หรือ · OR</span><hr /></div>

        {/* SPECIAL OPTION (abstain / disapprove) */}
        <Wrap id={specialElementId}>
          <div
            data-element={specialElementId}
            className={`gv-special ${selectedPartyId === specialId ? "is-selected" : ""}`}
            onClick={() => !editorMode && specialId != null && onSelect(specialId)}
          >
            <div className="gv-special__icon"><Ban size={22} strokeWidth={2.5} /></div>
            <div>
              <h3>{specialTitle}</h3>
              <p>{specialDesc}</p>
            </div>
          </div>
        </Wrap>
      </main>

      {/* STICKY VOTE FOOTER */}
      <div className="gv-footer">
        <div className="gv-footer__info">
          <div className="gv-footer__lbl">YOUR SELECTION</div>
          <div className="gv-footer__sel">{selectedName || "ยังไม่ได้เลือก · No selection yet"}</div>
        </div>
        <button
          type="button"
          className="gv-confirm"
          disabled={!selected || isSubmitting || editorMode}
          onClick={() => !editorMode && onConfirm()}
        >
          <Check size={20} strokeWidth={3} /> {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการลงคะแนน"}
        </button>
      </div>

      <style jsx global>{`
        .gv-root{
          --ink:#26271c; --cream:#FFF6EC; --paper:#FFFDFA; --pink:#FF9CE9; --lime:#C2F47E;
          --yellow:#FFD24D; --cream2:#FFE9D6; --bw:2.5px; --sh:5px 5px 0 var(--ink);
          --sh-sm:3px 3px 0 var(--ink);
          --fd:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --fm:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace;
          --fb:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif;
          min-height:100vh; display:flex; flex-direction:column; color:var(--ink);
          font-family:var(--fb); container-type:inline-size; container-name:gv;
          background:linear-gradient(135deg, var(--gw1, #FFE6F2) 0%, var(--gw2, #FFF7EE) 46%, var(--gw3, #EEF7DB) 100%) fixed;
          padding-bottom:96px;
        }
        .gv-root *{ box-sizing:border-box; } .gv-root a{ text-decoration:none; color:inherit; }
        /* topbar = shared <SiteNavbar> element */
        .gv-page{ flex:1; width:100%; max-width:980px; margin:0 auto; padding:40px 28px 40px; }
        .gv-head{ display:flex; flex-direction:column; align-items:center; text-align:center; gap:16px; margin-bottom:36px; }
        .gv-sticker{ display:inline-flex; align-items:center; gap:8px; padding:6px 16px; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:999px; font-weight:700; font-size:13px; box-shadow:var(--sh-sm); }
        .gv-sticker--pink{ background:var(--pink); }
        .gv-livedot{ width:9px; height:9px; border-radius:999px; background:var(--coral, #FF6E6E); box-shadow:0 0 0 0 color-mix(in srgb, var(--coral) 70%, transparent); animation:gvPulse 1.6s ease-out infinite; }
        @keyframes gvPulse{ 0%{box-shadow:0 0 0 0 color-mix(in srgb, var(--coral) 70%, transparent)} 70%{box-shadow:0 0 0 12px rgba(255,110,110,0)} 100%{box-shadow:0 0 0 0 rgba(255,110,110,0)} }
        .gv-title{ font-family:var(--fd); font-size:clamp(40px,8cqw,82px); letter-spacing:-.03em; line-height:.95; margin:0; text-transform:uppercase; }
        .gv-title em{ font-style:normal; background:var(--pink); border:var(--bw) solid var(--ink); padding:0 12px; display:inline-block; box-shadow:var(--sh); }
        .gv-subtitle{ font-size:clamp(14px,2cqw,18px); color:#4A4A4A; font-weight:500; max-width:620px; margin:0; }
        .gv-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:24px; }
        .gv-grid--single{ grid-template-columns:1fr; max-width:460px; margin:0 auto; }
        /* party tiles = <VotePartyCard> composites (own scoped styles) */
        .gv-or{ display:flex; align-items:center; gap:16px; margin:32px auto; }
        .gv-or hr{ flex:1; border:0; border-top:2px dashed var(--ink); }
        .gv-or span{ font-family:var(--fd); font-size:16px; }
        .gv-special{ background:var(--cream2); border:var(--bw) solid var(--ink); border-radius:22px; padding:20px 26px; display:flex; align-items:center; gap:16px; box-shadow:var(--sh); cursor:pointer; transition:transform .15s ease-out, box-shadow .15s ease-out; }
        .gv-special:hover{ transform:translate(-2px,-2px); box-shadow:7px 7px 0 var(--ink); }
        .gv-special.is-selected{ background:var(--yellow); transform:rotate(.5deg); }
        .gv-special__icon{ width:48px; height:48px; border-radius:999px; background:var(--paper); border:2px solid var(--ink); display:grid; place-items:center; flex-shrink:0; }
        .gv-special h3{ margin:0; font-size:18px; font-weight:700; } .gv-special p{ margin:2px 0 0; font-size:13px; color:#4A4A4A; }
        .gv-footer{ position:fixed; bottom:0; left:0; right:0; z-index:45; display:flex; align-items:center; justify-content:space-between; gap:20px; padding:16px 28px; background:var(--ink); color:var(--cream); border-top:var(--bw) solid var(--ink); }
        .gv-footer__lbl{ font-family:var(--fm); font-size:11px; color:var(--lime); text-transform:uppercase; letter-spacing:.15em; }
        .gv-footer__sel{ font-size:17px; font-weight:700; }
        .gv-confirm{ display:inline-flex; align-items:center; gap:8px; padding:14px 26px; border:var(--bw) solid var(--ink); border-radius:16px; background:var(--lime); color:var(--ink); font-family:var(--fb); font-weight:800; font-size:16px; box-shadow:5px 5px 0 rgba(255,241,229,.35); cursor:pointer; transition:transform .12s ease-out; white-space:nowrap; }
        .gv-confirm:not(:disabled):hover{ transform:translate(-2px,-2px); }
        .gv-confirm:disabled{ opacity:.45; cursor:not-allowed; }

        @container gv (max-width:780px){
          .gv-grid{ grid-template-columns:1fr; gap:18px; }
          .gv-page{ padding:28px 16px; }
          .gv-footer{ flex-direction:column; align-items:stretch; gap:10px; padding:12px 16px; }
          .gv-confirm{ justify-content:center; }
        }
      `}</style>
    </div>
  );
}
