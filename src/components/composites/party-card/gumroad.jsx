"use client";

// party-card · composite (Layer 2) · variant "gumroad"
//
// A LOCKED COMPOSITION of Layer-1 atoms (image · badge · text-title · text-label
// · text-body · button-primary) arranged in responsive flex frames. This is what
// the user means by "จับกลุ่ม element เป็น 1 component": the card is no longer a
// monolith — it's DATA (buildPartyCard → a node tree) rendered by <Composition>.
// Every piece is an independent library atom; the editor will manipulate this
// tree. Layout stays flex/clamp → responsive (Hybrid model C, no absolute canvas).
//
// Composition-level concerns live here: the frame styling (.el-card*) and the
// coupled hover (card hover → lift + grow the CTA shadow). Per-piece identity
// lives in each atom. The per-party accent flows via `--pop` set on the root.

import { getPath } from "../../../utils/basePath";
import { ArrowRight, Quote } from "lucide-react";
import Composition from "../../elements/_composer/Composition";

// party media is loose JSON from the admin — pull the first usable image.
const firstImage = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) return val[0] || null;
  if (typeof val === "string") {
    const s = val.trim();
    if (s.startsWith("[")) { try { const a = JSON.parse(s); return Array.isArray(a) ? a[0] : null; } catch { return s; } }
    return s;
  }
  return null;
};
const resolveSrc = (u) => (u ? (String(u).startsWith("http") ? u : getPath(u)) : null);

// buildPartyCard — the Layer-2 DESCRIPTOR. Pure data (atoms + frames + props).
export function buildPartyCard(party, pop, editorMode = false) {
  const cover = resolveSrc(firstImage(party.groupImageUrls) || party.officialImageUrl || firstImage(party.mobileHeroImage));
  const logo = resolveSrc(party.logoUrl);
  const href = editorMode ? undefined : getPath(`/party?id=${party.number}`);

  return {
    kind: "frame", as: "a", className: "el-card", href,
    style: { "--pop": pop },
    attrs: { "data-component": "party-card", "data-variant": "gumroad" },
    children: [
      // COVER frame (relative) — image fills it, number badge pinned over it
      {
        kind: "frame", className: "el-card__cover",
        children: [
          { kind: "atom", type: "image", props: { src: cover, alt: party.name, fit: "cover", empty: !cover }, style: { position: "absolute", inset: 0 } },
          { kind: "atom", type: "badge", props: { children: party.number }, style: { position: "absolute", top: 14, right: 14 } },
        ],
      },
      // BODY frame
      {
        kind: "frame", className: "el-card__body",
        children: [
          {
            kind: "frame", className: "el-card__head",
            children: [
              logo && { kind: "frame", className: "el-card__logo", children: [
                { kind: "atom", type: "image", props: { src: logo, alt: "", fit: "cover" } },
              ] },
              {
                kind: "frame", className: "el-card__id",
                children: [
                  { kind: "atom", type: "text-title", props: { children: party.name } },
                  { kind: "atom", type: "text-label", props: { children: `NO. ${party.number}` }, style: { marginTop: 6 } },
                ],
              },
            ].filter(Boolean),
          },
          party.slogan && { kind: "atom", type: "text-body", props: { children: party.slogan, icon: <Quote size={14} /> } },
          { kind: "atom", type: "button-primary", props: { children: "ดูรายละเอียดพรรค", icon: <ArrowRight size={16} /> }, style: { marginTop: "auto" } },
        ].filter(Boolean),
      },
    ],
  };
}

export default function PartyCardGumroad({ party, pop, editorMode = false }) {
  return (
    <>
      <Composition node={buildPartyCard(party, pop, editorMode)} />
      <style jsx global>{`
        .el-card, .el-card *{ box-sizing:border-box; }
        .el-card{
          display:flex; flex-direction:column; background:#FFFDFA;
          border:2.5px solid #26271c; border-radius:22px; box-shadow:5px 5px 0 #26271c;
          overflow:hidden; text-decoration:none; color:inherit;
          transition:transform .14s ease-out, box-shadow .14s ease-out;
        }
        .el-card:hover{ transform:translate(-3px,-3px); box-shadow:8px 8px 0 #26271c; }
        .el-card__cover{ position:relative; aspect-ratio:16/9; background:#FFF6EC; border-bottom:2.5px solid #26271c; overflow:hidden; }
        .el-card__body{ display:flex; flex-direction:column; gap:14px; padding:22px 24px 24px; flex:1; }
        .el-card__head{ display:flex; align-items:center; gap:14px; }
        .el-card__logo{ width:58px; height:58px; flex-shrink:0; border:2.5px solid #26271c; border-radius:14px; background:#FFF6EC; overflow:hidden; box-shadow:3px 3px 0 #26271c; }
        .el-card__id{ min-width:0; }
        .el-card:hover .el-btn{ box-shadow:5px 5px 0 #26271c; transform:translate(-1px,-1px); }
      `}</style>
    </>
  );
}
