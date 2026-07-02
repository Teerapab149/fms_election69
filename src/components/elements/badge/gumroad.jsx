"use client";

// badge · atom · variant "gumroad" — the chunky square number stamp. Pop-colour
// fill rides in on the inherited `--pop` var (host sets it on the composition
// root); ink border + hard offset shadow = gumroad identity (Rule 9: hardcoded).

export default function BadgeGumroad({ children, style }) {
  return (
    <span className="el-badge" data-element="badge" data-variant="gumroad" style={style}>
      {children}
      <style jsx global>{`
        .el-badge{
          min-width:46px; height:46px; padding:0 10px;
          display:inline-flex; align-items:center; justify-content:center;
          background:var(--pop, var(--pink, #FF9CE9)); color:var(--ink, #26271c);
          border:2.5px solid var(--ink, #26271c); border-radius:12px; box-shadow:3px 3px 0 var(--ink, #26271c);
          font-family:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          font-size:24px; line-height:1;
        }
      `}</style>
    </span>
  );
}
