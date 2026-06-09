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
        .el-stat-card{ background:#FFFDFA; border:2.5px solid #26271c; border-radius:22px; box-shadow:5px 5px 0 #26271c; padding:24px; }
        .el-stat-card--pink{ background:#FF9CE9; }
        .el-stat-card--lime{ background:#C2F47E; }
      `}</style>
    </>
  );
}
