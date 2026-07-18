"use client";

// site-footer · variant "gumroad" — the ink credit bar at the bottom of gumroad
// pages. Library element (Lego brick): self-contained, exposes --foot-* vars →
// gumroad identity literals. Copy text is data (props), not hardcoded.

export default function SiteFooterGumroad({ faculty = "FMS", uni = "PSU", year = "" }) {
  return (
    <footer className="sfoot" data-element="site-footer" data-variant="gumroad">
      <div>© {faculty}@{uni} {year} · ALL RIGHTS RESERVED</div>
      <style jsx global>{`
        .sfoot{
          margin-top:auto; border-top:2.5px solid var(--foot-border, var(--ink, #26271c));
          padding:22px 32px;
          background:var(--foot-bg, var(--ink, #26271c)); color:var(--foot-text, var(--cream, #FFF6EC));
          display:flex; align-items:center; justify-content:center; gap:16px;
          font-family:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace;
          font-size:13px; flex-wrap:wrap; text-align:center;
        }
      `}</style>
    </footer>
  );
}
