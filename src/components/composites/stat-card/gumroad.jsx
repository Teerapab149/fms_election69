"use client";

// stat-card · composite (Layer 2) · variant "gumroad"
//
// A chunky stat tile = frame + meta label + big number + caption. Composed from
// Layer-1 atoms (text-meta · text-stat · text-plain) via <Composition>. `tone`
// switches the fill (paper / pink / lime). Reusable on results + home stat tiles.

import Composition from "../../elements/_composer/Composition";

export function buildStatCard({ lbl, value, unit, sub, tone = "paper" }) {
  return {
    kind: "frame", className: `el-stat-card el-stat-card--${tone}`,
    children: [
      { kind: "atom", type: "text-meta", props: { children: lbl }, style: { display: "block" } },
      { kind: "atom", type: "text-stat", props: { children: value, unit }, style: { marginTop: 10, display: "block" } },
      { kind: "atom", type: "text-plain", props: { children: sub }, style: { marginTop: 6 } },
    ],
  };
}

export default function StatCardGumroad(props) {
  return (
    <>
      <Composition node={buildStatCard(props)} />
      <style jsx global>{`
        .el-stat-card{ background:var(--paper, #FFFDFA); border:2.5px solid var(--ink, #26271c); border-radius:22px; box-shadow:5px 5px 0 var(--ink, #26271c); padding:24px; }
        .el-stat-card--pink{ background:var(--pink, #FF9CE9); }
        .el-stat-card--lime{ background:var(--lime, #C2F47E); }
        /* the caption atom defaults to --ink2 (a muted grey tuned for the paper tile).
           On the pop fills that reads 3.70:1 at 13px on pink — under AA. The label and
           the number on the same tile already use full --ink, so follow them. */
        .el-stat-card--pink .el-plain, .el-stat-card--lime .el-plain{ color:var(--ink, #26271c); }
      `}</style>
    </>
  );
}
