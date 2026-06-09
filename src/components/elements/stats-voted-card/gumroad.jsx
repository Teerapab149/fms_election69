"use client";

// stats-voted-card · variant "gumroad" — the pink "VOTED" stat tile (live ballots
// cast) with the heartbeat ECG trace. Library element; host owns the grid-area.

import { CheckCircle2 } from "lucide-react";

export default function StatsVotedGumroad({ voted = 0 }) {
  return (
    <div className="gh-stat gh-stat--pink" data-element="stats-voted-card" data-variant="gumroad">
      <div className="gh-stat__lbl"><CheckCircle2 size={14} /> ใช้สิทธิ์แล้ว · VOTED</div>
      <div className="gh-stat__val">{Number(voted).toLocaleString()}<span className="gh-stat__unit">คน</span></div>
      <div className="gh-stat__sub">ลงคะแนนแล้ว</div>
      <svg className="gh-ekg" viewBox="0 0 200 60" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M0 30 L40 30 L48 30 L54 10 L62 50 L70 30 L100 30 L108 30 L116 18 L124 42 L132 30 L200 30" /></svg>
      <style jsx global>{`
        .gh-stat{ position:relative; overflow:hidden; height:100%; display:flex; flex-direction:column; justify-content:space-between; gap:10px;
          border:2.5px solid var(--stat-border, #26271c); border-radius:22px; padding:clamp(20px,2.2cqw,30px); box-shadow:5px 5px 0 var(--stat-border, #26271c); }
        .gh-stat--pink{ background:var(--stat-bg, #FF9CE9); }
        .gh-stat__lbl{ display:flex; align-items:center; gap:6px; font-family:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace; font-size:clamp(11px,1.3cqw,13px); font-weight:600; text-transform:uppercase; letter-spacing:.12em; }
        .gh-stat__val{ font-family:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif; font-size:clamp(44px,7cqw,78px); line-height:.9; margin:0; font-variant-numeric:tabular-nums; position:relative; z-index:1; }
        .gh-stat__unit{ font-size:clamp(16px,2cqw,22px); font-family:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif; font-weight:700; margin-left:8px; }
        .gh-stat__sub{ font-size:clamp(12px,1.4cqw,14px); margin:0; font-weight:500; position:relative; z-index:1; }
        .gh-ekg{ position:absolute; right:-12px; bottom:-10px; width:150px; opacity:.9; z-index:0; }
        .gh-ekg path{ stroke-dasharray:330; stroke-dashoffset:330; animation:ghEkg 2.2s cubic-bezier(.66,0,.34,1) infinite; }
        @keyframes ghEkg{ 0%{stroke-dashoffset:330} 8%{stroke-dashoffset:330} 52%{stroke-dashoffset:0} 100%{stroke-dashoffset:-330} }
        @media (prefers-reduced-motion: reduce){ .gh-ekg path{ animation:none; stroke-dashoffset:0; } }
      `}</style>
    </div>
  );
}
