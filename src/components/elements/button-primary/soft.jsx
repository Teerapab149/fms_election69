"use client";

// button-primary · atom · variant "soft" — a rounded pill with a soft drop-shadow
// (no chunky ink border). The clean/modern counterpart to the gumroad variant.
// Same prop contract (children · icon · as · href · style) so it's swap-compatible.

export default function ButtonPrimarySoft({ children, icon, as = "span", href, style }) {
  const Tag = as;
  const tagProps = as === "a" && href ? { href } : {};
  return (
    <Tag className="el-btn-soft" data-element="button-primary" data-variant="soft" style={style} {...tagProps}>
      {children}
      {icon}
      <style jsx global>{`
        .el-btn-soft{
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          padding:11px 22px; background:var(--pop, #FF9CE9); color:#26271c;
          border:none; border-radius:999px; box-shadow:0 6px 16px rgba(38,39,28,.16);
          font-weight:600; font-size:14px; text-decoration:none;
          transition:transform .12s ease-out, box-shadow .12s ease-out;
        }
        .el-btn-soft:hover{ transform:translateY(-1px); box-shadow:0 10px 22px rgba(38,39,28,.22); }
      `}</style>
    </Tag>
  );
}
