"use client";

// hero-subtitle · variant "gumroad" — the lime-marker lead line (campaign title)
// + the quieter organisation line. Library element; host resolves both texts
// (bindings) and passes leadText/org/style. (gumroad renders hero-subtitle2 inline
// here as the org line — no separate wrap, matching the original layout.)

import React from "react";

export default function HeroSubtitleGumroad({ leadText = "", org = "", style }) {
  return (
    <>
      <p className="gh-subtitle" data-element="hero-subtitle" data-variant="gumroad" style={style}>
        <span className="gh-subtitle__lead"><span className="gh-hl">
          {String(leadText).split("\n").map((ln, i, arr) => (
            <React.Fragment key={i}>{ln}{i < arr.length - 1 && <br />}</React.Fragment>
          ))}
        </span></span>
        <span className="gh-subtitle__org">{org}</span>
      </p>
      <style jsx global>{`
        .gh-subtitle{ margin:0; font-size:clamp(16px,2cqw,21px); font-weight:600; line-height:1.5; color:var(--sub-color, #26271c); max-width:520px; }
        .gh-hl{ background:var(--sub-accent, #C2F47E); padding:3px 8px; border-radius:4px; border:1.5px solid #26271c; font-weight:700; box-decoration-break:clone; -webkit-box-decoration-break:clone; }
        .gh-subtitle__lead{ display:block; line-height:1.45; }
        .gh-subtitle__lead .gh-hl{ font-size:clamp(17px,3.8cqw,23px); font-weight:800; letter-spacing:-.01em; }
        .gh-subtitle__org{ display:inline-block; margin-top:14px; font-size:clamp(15px,2cqw,19px); font-weight:600; color:#26271c; letter-spacing:.01em; border-bottom:3px solid var(--sub-accent, #C2F47E); padding-bottom:2px; }
      `}</style>
    </>
  );
}
