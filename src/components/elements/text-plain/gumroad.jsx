"use client";

// text-plain · atom · variant "gumroad" — plain muted body line (no clamp), e.g. a
// stat sub-caption. For clamped card copy use text-body instead. Generic.

export default function TextPlainGumroad({ children, style }) {
  return (
    <p className="el-plain" data-element="text-plain" data-variant="gumroad" style={style}>
      {children}
      <style jsx global>{`
        .el-plain{ margin:0; font-size:13px; font-weight:400; line-height:1.5; color:#5c5a4b; }
      `}</style>
    </p>
  );
}
