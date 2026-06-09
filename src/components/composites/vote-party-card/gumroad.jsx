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
    attrs: { onClick: () => !editorMode && onSelect(party.id), ...(dataElement ? { "data-element": dataElement } : {}), "data-component": "vote-party-card" },
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
              ดูรายละเอียด <ArrowRight size={14} />
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
        .gv-card{ position:relative; background:#FFFDFA; border:2.5px solid #26271c; border-radius:22px; box-shadow:5px 5px 0 #26271c; overflow:hidden; cursor:pointer; transition:transform .15s ease-out, box-shadow .15s ease-out; }
        .gv-card:hover{ transform:translate(-3px,-3px); box-shadow:8px 8px 0 #26271c; }
        .gv-card.is-selected{ background:#FF9CE9; transform:rotate(-1deg); }
        .gv-card__no{ position:absolute; top:16px; left:16px; z-index:2; padding:6px 14px; background:#26271c; color:#FFF6EC; border-radius:999px; font-family:var(--font-archivo),'Archivo Black',system-ui,sans-serif; font-size:13px; }
        .gv-card__check{ position:absolute; top:16px; right:16px; z-index:2; width:40px; height:40px; border-radius:999px; background:#C2F47E; border:2.5px solid #26271c; display:grid; place-items:center; opacity:0; transform:scale(.6) rotate(-20deg); transition:all .2s cubic-bezier(.34,1.56,.64,1); }
        .gv-card.is-selected .gv-card__check{ opacity:1; transform:scale(1) rotate(0); }
        .gv-card__media{ position:relative; height:220px; display:grid; place-items:center; border-bottom:2.5px solid #26271c; overflow:hidden; }
        /* absolutely-position the logo + object-fit:contain so it letterboxes inside the
           fixed 220px box reliably (percentage max-height on a grid item doesn't resolve →
           tall/portrait logos were overflowing + getting clipped). padding keeps it off the edges. */
        .gv-card__media .el-img{ position:absolute; inset:0; width:100%; height:100%; object-fit:contain; padding:22px; box-sizing:border-box; }
        .gv-card__ph{ font-family:var(--font-archivo),'Archivo Black',system-ui,sans-serif; font-size:18px; text-transform:uppercase; padding:6px 14px; border:2px solid #26271c; border-radius:999px; }
        .gv-card__body{ padding:20px 22px; }
        .gv-card__body .el-title{ font-family:var(--font-archivo),'Archivo Black',system-ui,sans-serif; font-size:24px; font-weight:400; letter-spacing:-.02em; margin:0 0 6px; text-transform:uppercase; -webkit-line-clamp:unset; }
        .gv-card__body .el-body{ font-size:14px; color:#4A4A4A; margin:0 0 16px; font-style:italic; -webkit-line-clamp:unset; }
        .gv-card__cta{ display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border:2px solid #26271c; border-radius:999px; background:#FFFDFA; font-weight:700; font-size:13px; cursor:pointer; font-family:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif; }
        .gv-card.is-selected .gv-card__cta{ background:#26271c; color:#FFF6EC; }
      `}</style>
    </>
  );
}
