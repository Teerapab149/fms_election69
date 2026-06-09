"use client";

// hero-year-badge · variant "gumroad" — the academic-year pill under the subtitle.
// Library element (self-contained scoped styles); host passes the resolved text.

import { Calendar } from "lucide-react";

export default function HeroYearBadgeGumroad({ text = "" }) {
  return (
    <div className="ghyb" data-element="hero-year-badge" data-variant="gumroad">
      <span className="ghyb__pill"><Calendar size={17} /> {text}</span>
      <style jsx global>{`
        .ghyb{ margin-top:6px; }
        .ghyb__pill{ display:inline-flex; align-items:center; gap:8px; padding:7px 15px;
          background:var(--yb-bg, #FFFDFA); border:2.5px solid #26271c; border-radius:999px;
          font-weight:700; font-size:13px; box-shadow:3px 3px 0 #26271c; }
      `}</style>
    </div>
  );
}
