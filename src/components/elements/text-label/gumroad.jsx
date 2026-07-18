"use client";

// text-label · atom · variant "gumroad" — a small mono pill label (e.g. "NO. 1").
// Cream fill + 2px ink border + full radius = gumroad chip identity.

export default function TextLabelGumroad({ children, style }) {
  return (
    <span className="el-label" data-element="text-label" data-variant="gumroad" style={style}>
      {children}
      <style jsx global>{`
        .el-label{
          display:inline-block; padding:2px 11px;
          background:var(--cream, #FFF6EC); border:2px solid var(--ink, #26271c); border-radius:999px;
          font-family:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace;
          font-size:11px; font-weight:700; letter-spacing:.08em; color:var(--ink, #26271c);
        }
      `}</style>
    </span>
  );
}
