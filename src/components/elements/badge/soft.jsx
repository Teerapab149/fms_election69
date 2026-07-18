"use client";

// badge · atom · variant "soft" — a round soft-shadow number badge (no chunky ink
// border). Clean counterpart to the gumroad square stamp. Fill rides on --pop.

export default function BadgeSoft({ children, style }) {
  return (
    <span className="el-badge-soft" data-element="badge" data-variant="soft" style={style}>
      {children}
      <style jsx global>{`
        .el-badge-soft{
          min-width:42px; height:42px; padding:0 10px; display:inline-flex; align-items:center; justify-content:center;
          background:var(--pop, #FF9CE9); color:#26271c; border:none; border-radius:50%;
          box-shadow:0 5px 14px rgba(38,39,28,.18);
          font-family:var(--font-archivo),'Archivo Black',system-ui,sans-serif; font-size:20px; line-height:1;
        }
      `}</style>
    </span>
  );
}
