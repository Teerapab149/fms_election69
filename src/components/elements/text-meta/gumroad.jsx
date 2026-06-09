"use client";

// text-meta · atom · variant "gumroad" — a small mono uppercase meta label (stat
// labels, "NO. X" eyebrows, kicker text). Plain (no pill) — for the bordered pill
// use text-label instead. Generic & reusable across pages.

export default function TextMetaGumroad({ children, style }) {
  return (
    <span className="el-meta" data-element="text-meta" data-variant="gumroad" style={style}>
      {children}
      <style jsx global>{`
        .el-meta{
          font-family:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace;
          font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.12em; color:#26271c;
        }
      `}</style>
    </span>
  );
}
