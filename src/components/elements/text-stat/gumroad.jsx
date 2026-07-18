"use client";

// text-stat · atom · variant "gumroad" — a big Archivo display number (stat values,
// percentages). Tabular nums so digits don't jitter. Optional `unit` (e.g. "%")
// rendered smaller alongside. Generic & reusable.

export default function TextStatGumroad({ children, unit, style }) {
  return (
    <div className="el-stat-num" data-element="text-stat" data-variant="gumroad" style={style}>
      {children}{unit ? <span className="el-stat-num__unit">{unit}</span> : null}
      <style jsx global>{`
        .el-stat-num{
          font-family:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          font-size:clamp(38px,6cqw,56px); line-height:1; color:var(--ink, #26271c); font-variant-numeric:tabular-nums;
        }
        .el-stat-num__unit{ font-size:.55em; }
      `}</style>
    </div>
  );
}
