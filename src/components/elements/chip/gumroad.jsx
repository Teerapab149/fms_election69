"use client";

// chip · atom · variant "gumroad" — a small pill with an optional leading icon +
// label, ink-bordered. `tone` switches the fill (lime / pink / cream). Generic &
// reusable (success info chips, tags, filters…).

export default function ChipGumroad({ children, icon, tone = "cream", style }) {
  return (
    <span className={`el-chip el-chip--${tone}`} data-element="chip" data-variant="gumroad" style={style}>
      {icon}{children}
      <style jsx global>{`
        .el-chip{ display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border:2px solid var(--ink, #26271c); border-radius:999px;
          font-size:12px; font-weight:700; color:var(--ink, #26271c); }
        .el-chip--lime{ background:var(--lime, #C2F47E); } .el-chip--pink{ background:var(--pink, #FF9CE9); } .el-chip--cream{ background:var(--cream, #FFF6EC); }
      `}</style>
    </span>
  );
}
