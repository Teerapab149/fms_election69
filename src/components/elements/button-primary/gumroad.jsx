"use client";

// button-primary · atom · variant "gumroad" — the chunky pop-colour CTA. Renders
// as a span by default (the whole card is the link in the party-card composition);
// pass `as="a"` + `href` to make it a standalone link. Optional trailing `icon`.

export default function ButtonPrimaryGumroad({ children, icon, as = "span", href, style }) {
  const Tag = as;
  const tagProps = as === "a" && href ? { href } : {};
  return (
    <Tag className="el-btn" data-element="button-primary" data-variant="gumroad" style={style} {...tagProps}>
      {children}
      {icon}
      <style jsx global>{`
        .el-btn{
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          padding:12px 18px; background:var(--pop, var(--pink, #FF9CE9)); color:var(--ink, #26271c);
          border:2.5px solid var(--ink, #26271c); border-radius:14px; box-shadow:3px 3px 0 var(--ink, #26271c);
          font-weight:800; font-size:14px; text-decoration:none;
          transition:transform .1s ease-out, box-shadow .1s ease-out;
        }
      `}</style>
    </Tag>
  );
}
