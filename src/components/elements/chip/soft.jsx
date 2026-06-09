"use client";

// chip · atom · variant "soft" — a filled pale pill, no border. Clean counterpart
// to the gumroad bordered chip. tone switches the tint (lime / pink / cream).

export default function ChipSoft({ children, icon, tone = "cream", style }) {
  return (
    <span className={`el-chip-soft el-chip-soft--${tone}`} data-element="chip" data-variant="soft" style={style}>
      {icon}{children}
      <style jsx global>{`
        .el-chip-soft{ display:inline-flex; align-items:center; gap:6px; padding:6px 13px; border:none; border-radius:999px;
          font-size:12px; font-weight:600; }
        .el-chip-soft--lime{ background:#E8FBC9; color:#43631a; } .el-chip-soft--pink{ background:#FFE2F7; color:#9c2b7e; } .el-chip-soft--cream{ background:#F1ECE3; color:#5c5a4b; }
      `}</style>
    </span>
  );
}
