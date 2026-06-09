"use client";

// results-head · variant "gumroad" — the results page masthead: an ink status
// sticker with a pulsing dot + a big Archivo title where the election name sits in
// an INK "live scoreboard" plaque (lime digits, pink hard-shadow) + a muted subtitle.
// Its OWN identity: a counting-board look — distinct from home's pink-fill "50" stamp
// and candidates' pink offset-echo. Library element: self-contained scoped CSS; copy=props.

export default function ResultsHeadGumroad({ statusLabel = "", title = "", subtitle = null }) {
  return (
    <div className="gr-head" data-element="results-head" data-variant="gumroad">
      <span className="gr-sticker gr-sticker--ink"><span className="gr-dot" /> {statusLabel}</span>
      <h1 className="gr-title">ผลการเลือกตั้ง<em>{title}</em></h1>
      <p className="gr-subtitle">{subtitle}</p>
      <style jsx global>{`
        .gr-head{ text-align:center; margin-bottom:42px; }
        .gr-head .gr-sticker{ display:inline-flex; align-items:center; gap:8px; padding:9px 20px; background:#26271c; color:#FFF6EC;
          border:2.5px solid #26271c; border-radius:999px; font-weight:700; font-size:14px; box-shadow:5px 5px 0 #26271c; white-space:nowrap; }
        .gr-head .gr-dot{ width:9px; height:9px; border-radius:999px; background:#FF8A8A; box-shadow:0 0 0 0 rgba(255,110,110,.7); animation:grPulse 1.6s ease-out infinite; }
        @keyframes grPulse{ 0%{box-shadow:0 0 0 0 rgba(255,110,110,.7)} 70%{box-shadow:0 0 0 12px rgba(255,110,110,0)} 100%{box-shadow:0 0 0 0 rgba(255,110,110,0)} }
        .gr-head .gr-title{ font-family:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          font-size:clamp(42px,9cqw,92px); line-height:.9; letter-spacing:-.035em; margin:20px 0 12px; text-transform:uppercase; }
        .gr-head .gr-title em{ font-style:normal; background:#26271c; color:#C2F47E; border:2.5px solid #26271c; padding:2px 16px; display:inline-block; box-shadow:8px 8px 0 #FF9CE9; margin-left:10px; }
        .gr-head .gr-subtitle{ font-size:clamp(15px,2cqw,18px); color:#5c5a4b; font-weight:600; max-width:660px; margin:0 auto; }
      `}</style>
    </div>
  );
}
