"use client";

// hero-countdown · variant "gumroad" — the ink bento countdown tile on the home
// mosaic. Library element (Lego brick): self-contained timing (ELECTION_CONFIG) +
// own scoped styles. The host layout owns the grid-area; this owns the tile.

import { useState, useEffect, useMemo } from "react";
import { resolveElectionDates } from "../../../utils/electionConfig";
import { useGlobalConfig } from "../../../contexts/GlobalConfigContext";

export default function HeroCountdownGumroad({ systemMode = "AUTO" }) {
  const globalConfig = useGlobalConfig();
  // memoize so the resolved Date objects are STABLE across renders — otherwise the
  // effect below (deps on these dates) re-runs every render → setT loop → crash.
  const { ELECTION_START, ELECTION_END } = useMemo(
    () => resolveElectionDates(globalConfig),
    [globalConfig?.campaignStartAt, globalConfig?.electionStartAt, globalConfig?.electionEndAt]
  );
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0, label: "STARTS IN", sub: "เปิดรับลงคะแนนใน", live: false });
  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      let diff, label, sub, live = false;
      if (systemMode === "PAUSE") { label = "PAUSED"; sub = "พักลงคะแนนชั่วคราว"; diff = 0; }
      else if (systemMode === "ENDED") { label = "ENDED"; sub = "ปิดรับลงคะแนนแล้ว"; diff = 0; }
      else if (systemMode === "MANUAL_OPEN") { label = "CLOSES IN"; sub = "ปิดรับลงคะแนนใน"; diff = ELECTION_END - now; live = true; }
      else if (now < ELECTION_START) { label = "STARTS IN"; sub = "เปิดรับลงคะแนนใน"; diff = ELECTION_START - now; }
      else if (now < ELECTION_END) { label = "CLOSES IN"; sub = "ปิดรับลงคะแนนใน"; diff = ELECTION_END - now; live = true; }
      else { label = "ENDED"; sub = "ปิดรับลงคะแนนแล้ว"; diff = 0; }
      setT(diff > 0
        ? { d: Math.floor(diff / 86400000), h: Math.floor((diff / 3600000) % 24), m: Math.floor((diff / 60000) % 60), s: Math.floor((diff / 1000) % 60), label, sub, live }
        : { d: 0, h: 0, m: 0, s: 0, label, sub, live });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [ELECTION_START, ELECTION_END, systemMode]);
  const cells = [{ n: t.d, u: "DAYS" }, { n: t.h, u: "HRS" }, { n: t.m, u: "MIN" }, { n: t.s, u: "SEC" }];
  return (
    <div className="gh-cd" data-element="hero-countdown" data-variant="gumroad">
      <div className="gh-cd__lbl">{t.live && <span className="gh-livedot" />}{t.label} · <span className="gm-thai">{t.sub}</span></div>
      <div className="gh-cd__grid">
        {cells.map((c, i) => (
          <div key={i} className="gh-cd__cell">
            <div className="gh-cd__num">{String(c.n).padStart(2, "0")}</div>
            <div className="gh-cd__unit">{c.u}</div>
          </div>
        ))}
      </div>
      <style jsx global>{`
        .gh-cd{ height:100%; background:var(--cd-bg, var(--ink, #26271c)); color:var(--cd-text, var(--cream, #FFF6EC)); border:2.5px solid var(--cd-border, var(--ink, #26271c)); border-radius:22px; box-shadow:8px 8px 0 var(--cd-border, var(--ink, #26271c));
          padding:clamp(20px,2.2cqw,30px); display:flex; flex-direction:column; justify-content:space-between; gap:clamp(14px,2cqw,22px); }
        .gh-cd__lbl{ display:flex; align-items:center; gap:8px; font-family:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace; font-weight:600; font-size:clamp(12px,1.4cqw,14px); text-transform:uppercase; letter-spacing:.15em; color:var(--cd-accent, var(--pink, #FF9CE9)); }
        /* Space Grotesk has no Thai glyphs — pin the Thai run to the family's real
           Thai body font so vowel/tone marks render correctly. */
        .gm-thai{ font-family:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif !important; letter-spacing:.04em; white-space:nowrap; }
        .gh-cd__grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:clamp(10px,1.4cqw,16px); margin-top:0; }
        .gh-cd__cell{ background:var(--cd-cell, var(--cream, #FFF6EC)); color:var(--ink, #26271c); border-radius:14px; padding:clamp(12px,1.8cqw,20px) 8px; text-align:center; border:2px solid var(--ink, #26271c); }
        .gh-cd__num{ font-family:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif; font-size:clamp(30px,4.6cqw,52px); line-height:1; font-variant-numeric:tabular-nums; }
        .gh-cd__unit{ font-family:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace; font-size:clamp(10px,1.1cqw,12px); color:var(--ink2, #5c5a4b); margin-top:5px; text-transform:uppercase; letter-spacing:.1em; }
        .gh-cd .gh-livedot{ width:10px; height:10px; border-radius:999px; background:var(--coral, #FF8A8A); display:inline-block; box-shadow:0 0 0 0 color-mix(in srgb, var(--coral) 80%, transparent); animation:ghCdPulse 1.6s ease-out infinite; }
        @keyframes ghCdPulse{ 0%{box-shadow:0 0 0 0 color-mix(in srgb, var(--coral) 70%, transparent)} 70%{box-shadow:0 0 0 12px rgba(255,110,110,0)} 100%{box-shadow:0 0 0 0 rgba(255,110,110,0)} }
      `}</style>
    </div>
  );
}
