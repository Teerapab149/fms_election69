"use client";

// text-body · atom · variant "gumroad" — body copy (e.g. a party slogan), clamped
// to 2 lines. Optional leading `icon` (a lucide node) tinted with the inherited
// `--pop` accent.

export default function TextBodyGumroad({ children, icon, style }) {
  return (
    <p className="el-body" data-element="text-body" data-variant="gumroad" style={style}>
      {icon && <span className="el-body__icon">{icon}</span>}
      {icon ? " " : null}{children}
      <style jsx global>{`
        .el-body{
          margin:0; font-size:14px; font-weight:500; line-height:1.55; color:var(--ink2, #5c5a4b);
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
        }
        .el-body__icon{ display:inline; vertical-align:-2px; color:var(--pop, var(--pink, #FF9CE9)); }
      `}</style>
    </p>
  );
}
