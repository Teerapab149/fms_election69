"use client";

// GumroadClosed — the "Active Pulse" CLOSED / locked-state layout (template:
// gumroad). Shown when voting is not open: waiting (before start), ended, or paused
// for maintenance. Same chunky identity as the other gumroad pages.
//
// State theatre (gm-B1A): the state is spoken in gumroad's own material instead of
// a bare icon/eyebrow swap. `waiting` carries a LIVE countdown to ELECTION_START
// (ink-bordered cream cells echoing hero-countdown/gumroad) + a factual open-window
// caption; `ended` carries a close-time caption + a PRIMARY "ดูผลคะแนน" link to the
// results (the logout/home button drops to secondary); `paused` stays a plain hold.
// Every added string is a real date/time/status — no narrative copy.
//
// Pure presentation — closed/page.js owns status fetching + the (PSU SSO) logout.

import { useState, useEffect } from "react";
import { getPath } from "../../utils/basePath";
import { GumroadBaseStyles } from "../home/GumroadTheme";
import React from "react";
import { Lock, Clock, Flag, LogOut, ArrowRight, BarChart3 } from "lucide-react";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { resolveElectionDates, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";
import SiteNavbar from "../elements/site-navbar/gumroad";
import SiteFooter from "../elements/site-footer/gumroad";
import InfoCard from "../composites/info-card/gumroad";

// variant → icon + accent (cream pops). Falls back to the "closed/paused" look.
const VARIANTS = {
  waiting: { Icon: Clock, accent: "#FFC900", eyebrow: "UPCOMING" },
  ended:   { Icon: Flag,  accent: "#B6FF6E", eyebrow: "ELECTION CLOSED" },
  closed:  { Icon: Lock,  accent: "#FF6E6E", eyebrow: "MAINTENANCE" },
};

// Countdown segments — days shown as-is (can exceed 2 digits), the rest padded.
const CD_UNITS = [["d", "DAYS"], ["hh", "HRS"], ["mm", "MIN"], ["ss", "SEC"]];

export default function GumroadClosed({ title, desc, variant = "closed", session = null, onLogout, editorMode = false }) {
  const globalConfig = useGlobalConfig();
  const v = VARIANTS[variant] || VARIANTS.closed;
  const Icon = v.Icon;
  const facultyEn = globalConfig.facultyShortEn || "FMS";
  const uni = globalConfig.university || "PSU";
  const copyrightYear = globalConfig.copyrightYear || globalConfig.electionCalendarYear || "";
  const { ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);

  // Live countdown to ELECTION_START — waiting variant only. Null when the target
  // has passed or dates are invalid (so no stuck 00:00:00 or negative shows). In
  // editorMode we compute once (no interval) so the admin preview never ticks.
  const [cd, setCd] = useState(null);
  useEffect(() => {
    if (variant !== "waiting") { setCd(null); return; }
    const target = ELECTION_START instanceof Date ? ELECTION_START.getTime() : NaN;
    const compute = () => {
      const diff = target - Date.now();
      if (isNaN(diff) || diff <= 0) { setCd(null); return; }
      setCd({
        d: Math.floor(diff / 86400000),
        hh: Math.floor((diff / 3600000) % 24),
        mm: Math.floor((diff / 60000) % 60),
        ss: Math.floor((diff / 1000) % 60),
      });
    };
    compute();
    if (editorMode) return;
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, editorMode, globalConfig?.electionStartAt]);

  // Factual caption — a real open/close window, derived from the resolved schedule
  // (empty-guarded so an invalid date renders nothing rather than "เปิดลงคะแนน ").
  // Single-date + time-range is the system's own convention (closed/page.js +
  // the other families) — the production election is same-day.
  let factual = null;
  if (variant === "waiting") {
    const d = formatThaiDate(ELECTION_START);
    if (d) factual = `เปิดลงคะแนน ${d} · ${formatThaiTime(ELECTION_START)}–${formatThaiTime(ELECTION_END)}`;
  } else if (variant === "ended") {
    const d = formatThaiDate(ELECTION_END);
    if (d) factual = `ปิดลงคะแนน ${d} · ${formatThaiTime(ELECTION_END)}`;
  }

  const logoutBtn = (
    <button className="gcl-btn gcl-btn--coral" onClick={() => !editorMode && onLogout?.()}>
      <LogOut size={18} /> ออกจากระบบ
    </button>
  );
  const homeBtn = (
    <a href={editorMode ? undefined : getPath("/")} className="gcl-btn gcl-btn--ink">
      กลับสู่หน้าหลัก <ArrowRight size={18} />
    </a>
  );

  // State theatre block — rides in the InfoCard's action slot so it composes INSIDE
  // gumroad's card language, below the desc. Order: countdown (waiting) · factual
  // caption · action(s). Paused/closed has neither cd nor caption → just the button.
  const stateBlock = (
    <div className="gcl-state">
      {cd && (
        <div className="gcl-cd" role="timer" aria-label="เวลาที่เหลือก่อนเปิดลงคะแนน">
          <div className="gcl-cd__lbl">STARTS IN · <span className="gm-thai">เปิดรับลงคะแนนใน</span></div>
          <div className="gcl-cd__grid">
            {CD_UNITS.map(([k, u]) => (
              <div className="gcl-cd__cell" key={u}>
                <div className="gcl-cd__num">{k === "d" ? cd.d : String(cd[k]).padStart(2, "0")}</div>
                <div className="gcl-cd__unit">{u}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {factual && <div className="gcl-fact"><span className="gcl-fact__txt">{factual}</span></div>}
      <div className="gcl-actions">
        {variant === "ended" ? (
          <>
            <a href={editorMode ? undefined : getPath("/results")} className="gcl-btn gcl-btn--lime">
              <BarChart3 size={18} /> ดูผลคะแนน
            </a>
            {session ? logoutBtn : homeBtn}
          </>
        ) : (
          session ? logoutBtn : homeBtn
        )}
      </div>
    </div>
  );

  return (
    <div className="fms-app gcl-root gum-root">
      <GumroadBaseStyles />
      {/* TOPBAR — shared gumroad navbar element */}
      <SiteNavbar />

      <main className="gcl-main">
        <InfoCard
          icon={<Icon size={40} strokeWidth={2.5} />}
          accent={v.accent}
          eyebrow={v.eyebrow}
          title={title}
          desc={desc}
          action={stateBlock}
        />
      </main>

      {/* FOOTER — shared gumroad footer element */}
      <SiteFooter faculty={facultyEn} uni={uni} year={copyrightYear} />

      <style jsx global>{`
        .gcl-root{
          --ink:#26271c; --ink2:#5c5a4b; --cream:#FFF6EC; --paper:#FFFDFA;
          --pink:#FF9CE9; --lime:#C2F47E; --yellow:#FFD24D; --sky:#B6E6FF; --coral:#FF8A8A;
          --bw:2.5px; --sh:5px 5px 0 var(--ink); --sh-sm:3px 3px 0 var(--ink); --sh-lg:8px 8px 0 var(--ink);
          --fd:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --fm:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace;
          --fb:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif;
          min-height:100vh; display:flex; flex-direction:column; color:var(--ink); font-family:var(--fb);
          container-type:inline-size; container-name:gcl;
          background:linear-gradient(135deg, var(--gw1, #FFE6F2) 0%, var(--gw2, #FFF7EE) 46%, var(--gw3, #EEF7DB) 100%) fixed;
        }
        .gcl-root *{ box-sizing:border-box; } .gcl-root a{ text-decoration:none; color:inherit; } .gcl-root img{ display:block; max-width:100%; }

        /* topbar = shared <SiteNavbar> element */
        .gcl-main{ flex:1; display:grid; place-items:center; padding:48px 24px; }
        /* card = <InfoCard> composite (own scoped styles); the state-theatre block
           rides in its action slot */

        /* Space Grotesk has no Thai glyphs — pin short tracked Thai labels to the
           family's real Thai body font so vowel/tone marks render correctly. */
        .gcl-root .gm-thai{ font-family:var(--fb) !important; letter-spacing:.04em; white-space:nowrap; }

        .gcl-state{ display:flex; flex-direction:column; }

        /* live countdown — ink-bordered cream cells + Archivo numerals, echoing the
           home hero-countdown tile (hero-countdown/gumroad) at card scale. tabular
           digits keep the ticker from reflowing as seconds roll. */
        .gcl-cd{ margin:2px 0 2px; }
        .gcl-cd__lbl{ display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:6px;
          font-family:var(--fm); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.15em;
          color:var(--ink2); margin-bottom:14px; }
        .gcl-cd__grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
        .gcl-cd__cell{ background:var(--cream); color:var(--ink); border:2px solid var(--ink); border-radius:12px;
          padding:14px 4px; text-align:center; box-shadow:var(--sh-sm); }
        .gcl-cd__num{ font-family:var(--fd); font-size:clamp(26px,7.4cqw,40px); line-height:1; font-variant-numeric:tabular-nums; }
        .gcl-cd__unit{ font-family:var(--fm); font-size:10px; color:var(--ink2); margin-top:5px; text-transform:uppercase; letter-spacing:.1em; }

        /* factual caption — small tracked mono line carrying the real schedule. The
           run is a full Thai sentence (date + time window), so unlike the short
           .gm-thai labels it must WRAP: this local variant keeps the Thai body font
           + gentle tracking but allows normal wrapping (mirrors verdure's vd-B2C
           deviation — nowrap here would overflow the card on mobile). */
        .gcl-fact{ font-family:var(--fm); font-size:11px; letter-spacing:.08em; color:var(--ink2); text-align:center; margin-top:18px; }
        .gcl-fact__txt{ font-family:var(--fb); letter-spacing:.03em; white-space:normal; line-height:1.6; }

        .gcl-actions{ display:flex; flex-direction:column; gap:12px; margin-top:22px; }
        .gcl-btn{ width:100%; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:16px 24px;
          border:var(--bw) solid var(--ink); border-radius:16px; font-weight:800; font-size:16px; box-shadow:var(--sh);
          cursor:pointer; color:var(--ink); font-family:var(--fb); transition:transform .12s ease-out, box-shadow .12s ease-out; }
        .gcl-btn:hover{ transform:translate(-2px,-2px); box-shadow:var(--sh-lg); }
        .gcl-btn:active{ transform:translate(2px,2px); box-shadow:0 0 0 var(--ink); }
        /* scoped under .gcl-root so the ink text colour beats .gcl-root a{color:inherit}
           (0,1,1) — the CTA is an <a>, so at (0,1,0) it lost and rendered ink-on-ink */
        .gcl-root .gcl-btn--ink{ background:var(--ink); color:var(--cream); }
        .gcl-btn--coral{ background:var(--coral); }
        .gcl-btn--lime{ background:var(--lime); }

        /* footer = <SiteFooter> element (own scoped styles) */
      `}</style>
    </div>
  );
}
