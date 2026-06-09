"use client";

// GumroadClosed — the "Active Pulse" CLOSED / locked-state layout (template:
// gumroad). Shown when voting is not open: waiting (before start), ended, or paused
// for maintenance. Same chunky identity as the other gumroad pages.
//
// Pure presentation — closed/page.js owns status fetching + the (PSU SSO) logout.

import { getPath } from "../../utils/basePath";
import React from "react";
import { Lock, Clock, Flag, LogOut, ArrowRight } from "lucide-react";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import SiteNavbar from "../elements/site-navbar/gumroad";
import SiteFooter from "../elements/site-footer/gumroad";
import InfoCard from "../composites/info-card/gumroad";

// variant → icon + accent (cream pops). Falls back to the "closed/paused" look.
const VARIANTS = {
  waiting: { Icon: Clock, accent: "#FFC900", badge: "ใกล้เปิดลงคะแนน", eyebrow: "UPCOMING" },
  ended:   { Icon: Flag,  accent: "#B6FF6E", badge: "ปิดลงคะแนนแล้ว", eyebrow: "ELECTION CLOSED" },
  closed:  { Icon: Lock,  accent: "#FF6E6E", badge: "พักลงคะแนนชั่วคราว", eyebrow: "MAINTENANCE" },
};

export default function GumroadClosed({ title, desc, variant = "closed", session = null, onLogout }) {
  const globalConfig = useGlobalConfig();
  const v = VARIANTS[variant] || VARIANTS.closed;
  const Icon = v.Icon;
  const facultyEn = globalConfig.facultyShortEn || "FMS";
  const uni = globalConfig.university || "PSU";
  const copyrightYear = globalConfig.copyrightYear || globalConfig.electionCalendarYear || "";

  return (
    <div className="fms-app gcl-root">
      {/* TOPBAR — shared gumroad navbar element */}
      <SiteNavbar />

      <main className="gcl-main">
        <InfoCard
          icon={<Icon size={40} strokeWidth={2.5} />}
          accent={v.accent}
          eyebrow={v.eyebrow}
          title={title}
          desc={desc}
          action={session ? (
            <button className="gcl-btn gcl-btn--coral" onClick={onLogout}>
              <LogOut size={18} /> ออกจากระบบ
            </button>
          ) : (
            <a href={getPath("/")} className="gcl-btn gcl-btn--ink">
              กลับสู่หน้าหลัก <ArrowRight size={18} />
            </a>
          )}
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
          background:linear-gradient(135deg, #FFE6F2 0%, #FFF7EE 46%, #EEF7DB 100%) fixed;
        }
        .gcl-root *{ box-sizing:border-box; } .gcl-root a{ text-decoration:none; color:inherit; } .gcl-root img{ display:block; max-width:100%; }

        /* topbar = shared <SiteNavbar> element */
        .gcl-main{ flex:1; display:grid; place-items:center; padding:48px 24px; }
        /* card = <InfoCard> composite (own scoped styles); buttons passed as action slot */
        .gcl-btn{ width:100%; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:16px 24px;
          border:var(--bw) solid var(--ink); border-radius:16px; font-weight:800; font-size:16px; box-shadow:var(--sh);
          cursor:pointer; color:var(--ink); font-family:var(--fb); transition:transform .12s ease-out, box-shadow .12s ease-out; }
        .gcl-btn:hover{ transform:translate(-2px,-2px); box-shadow:var(--sh-lg); }
        .gcl-btn:active{ transform:translate(2px,2px); box-shadow:0 0 0 var(--ink); }
        .gcl-btn--ink{ background:var(--ink); color:var(--cream); }
        .gcl-btn--coral{ background:var(--coral); }

        /* footer = <SiteFooter> element (own scoped styles) */
      `}</style>
    </div>
  );
}
