"use client";

// vote-party-card · composite (Layer 2) · variant "gumroad"
//
// The selectable party tile on the vote page grid. Composed from Layer-1 atoms
// (image · text-title · text-body) + bespoke stateful bits (NO. pill, lime check,
// "ดูรายละเอียด" pill) carried as escape-hatch `node`s. The composite owns the
// frame (.gv-card*) + the is-selected state (className) + the per-party pop fill.
//
// Election contract preserved: card click → onSelect(id); CTA click (stop-prop) →
// onViewDetails(party). editorMode disables both.

import { getPath } from "../../../utils/basePath";
import { ArrowRight, Check } from "lucide-react";
import Composition from "../../elements/_composer/Composition";

const PAPER = "#FFFDFA", CREAM = "#FFF6EC";
const resolveLogo = (u) => (u ? (String(u).startsWith("http") ? u : getPath(u)) : null);

export function buildVotePartyCard({ party, pop, isSel, onSelect, onViewDetails, editorMode, dataElement }) {
  const logo = resolveLogo(party?.logoUrl);
  return {
    kind: "frame", as: "article",
    className: `gv-card ${isSel ? "is-selected" : ""}`,
    // keyboard/AT parity with the other families (Verdure/StudioDark/Receipt all
    // expose the ballot option as a focusable radio) — without this the gumroad
    // ballot could only be filled with a pointer
    attrs: {
      onClick: () => !editorMode && onSelect(party.id),
      role: "radio",
      "aria-checked": !!isSel,
      tabIndex: editorMode ? -1 : 0,
      onKeyDown: (e) => {
        if (editorMode) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(party.id); }
      },
      ...(dataElement ? { "data-element": dataElement } : {}),
      "data-component": "vote-party-card",
    },
    children: [
      { kind: "node", render: <span className="gv-card__no">NO. {party.number}</span> },
      { kind: "node", render: <div className="gv-card__check"><Check size={20} strokeWidth={3.5} /></div> },
      {
        kind: "frame", className: "gv-card__media", style: { background: isSel ? PAPER : CREAM },
        children: [
          logo
            ? { kind: "atom", type: "image", props: { src: logo, alt: party?.name, fit: "contain" } }
            : { kind: "node", render: <span className="gv-card__ph" style={{ background: pop }}>★ {party?.name?.slice(0, 14) || "PARTY"} ★</span> },
        ],
      },
      {
        kind: "frame", className: "gv-card__body",
        children: [
          { kind: "atom", type: "text-title", props: { children: party?.name } },
          party?.slogan ? { kind: "atom", type: "text-body", props: { children: `“${party.slogan}”` } } : null,
          { kind: "node", render: (
            <button type="button" className="gv-card__cta" onClick={(e) => { e.stopPropagation(); if (!editorMode) onViewDetails(party); }}>
              VIEW PROFILE <ArrowRight size={14} />
            </button>
          ) },
        ].filter(Boolean),
      },
    ],
  };
}

export default function VotePartyCardGumroad(props) {
  return (
    <>
      <Composition node={buildVotePartyCard(props)} />
      <style jsx global>{`
        .gv-card{ position:relative; display:flex; flex-direction:column; background:var(--paper, #FFFDFA); border:2.5px solid var(--ink, #26271c); border-radius:22px; box-shadow:5px 5px 0 var(--ink, #26271c); overflow:hidden; cursor:pointer; transition:transform .15s ease-out, box-shadow .15s ease-out; }
        .gv-card:hover{ transform:translate(-3px,-3px); box-shadow:8px 8px 0 var(--ink, #26271c); }
        .gv-card.is-selected{ background:var(--pink, #FF9CE9); transform:rotate(-1deg); }
        .gv-card__no{ position:absolute; top:16px; left:16px; z-index:2; padding:6px 14px; background:var(--ink, #26271c); color:var(--cream, #FFF6EC); border-radius:999px; font-family:var(--font-archivo),'Archivo Black',system-ui,sans-serif; font-size:13px; }
        .gv-card__check{ position:absolute; top:16px; right:16px; z-index:2; width:40px; height:40px; border-radius:999px; background:var(--lime, #C2F47E); border:2.5px solid var(--ink, #26271c); display:grid; place-items:center; opacity:0; transform:scale(.6) rotate(-20deg); transition:all .2s cubic-bezier(.34,1.56,.64,1); }
        .gv-card.is-selected .gv-card__check{ opacity:1; transform:scale(1) rotate(0); }
        .gv-card__media{ position:relative; height:220px; display:grid; place-items:center; border-bottom:2.5px solid var(--ink, #26271c); overflow:hidden; }
        /* absolutely-position the logo + object-fit:contain so it letterboxes inside the
           fixed 220px box reliably (percentage max-height on a grid item doesn't resolve →
           tall/portrait logos were overflowing + getting clipped). padding keeps it off the edges. */
        .gv-card__media .el-img{ position:absolute; inset:0; width:100%; height:100%; object-fit:contain; padding:22px; box-sizing:border-box; }
        /* same reason as .el-title below — this placeholder prints the party NAME when
           the party has no logo, so its stack needs the Thai face too */
        .gv-card__ph{ font-family:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif; font-size:18px; text-transform:uppercase; padding:6px 14px; border:2px solid var(--ink, #26271c); border-radius:999px; }
        .gv-card__body{ padding:20px 22px; flex:1; display:flex; flex-direction:column; }
        .gv-card__cta{ margin-top:auto; align-self:flex-start; }
        /* font stack mirrors --fd (Archivo Black is latin-only, so Thai MUST fall to
           Anuphan like every other gumroad surface — before this it fell to system-ui
           and the party name was set in a different face from the rest of the page).
           overflow:visible: -webkit-line-clamp is unset here, so the atom's
           overflow:hidden clamps nothing and only clipped glyph ink — worst legitimate
           Thai stack measured -1.77px at 24px and -1.23px at 15px (412). */
        .gv-card__body .el-title{ font-family:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif; font-size:24px; font-weight:400; letter-spacing:-.02em; margin:0 0 6px; text-transform:uppercase; -webkit-line-clamp:unset; overflow:visible; }
        .gv-card__body .el-body{ display:none; }
        .gv-card__cta{ display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border:2px solid var(--ink, #26271c); border-radius:999px; background:var(--paper, #FFFDFA); font-weight:700; font-size:13px; cursor:pointer; font-family:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif; }
        .gv-card.is-selected .gv-card__cta{ background:var(--ink, #26271c); color:var(--cream, #FFF6EC); }
        /* narrow (2-up mobile): shrink so the chunky title fits inside the card */
        @media (max-width:560px){
          .gv-card{ border-width:2px; box-shadow:4px 4px 0 var(--ink, #26271c); }
          .gv-card__media{ height:140px; border-bottom-width:2px; }
          .gv-card__media .el-img{ padding:14px; }
          .gv-card__body{ padding:13px 13px 15px; align-items:center; text-align:center; }
          .gv-card__body .el-title{ font-size:15px; letter-spacing:-.01em; margin-bottom:4px; }
          .gv-card__body .el-body{ font-size:11px; margin-bottom:12px; }
          .gv-card__no{ top:10px; left:10px; padding:4px 10px; font-size:11px; }
          .gv-card__check{ top:10px; right:10px; width:30px; height:30px; }
          .gv-card__cta{ padding:6px 12px; font-size:12px; align-self:center; }
        }
      `}</style>
    </>
  );
}
