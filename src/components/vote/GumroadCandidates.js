"use client";

// GumroadCandidates — the "Active Pulse" CANDIDATES / party-listing LAYOUT
// (template: gumroad). Shown when 2+ parties run (a single party redirects to the
// party detail page). Pure LAYOUT shell now: the page root + grid + empty state,
// composing library elements (site-navbar / candidates-head / candidates-party-card
// / site-footer). Same chunky identity as the rest of gumroad: cream base, 2.5px
// ink borders, hard offset shadows, pop-colour accents.
//
// candidates/page.js owns fetching + the single-party redirect.

import React from "react";
import { GumroadBaseStyles } from "../home/GumroadTheme";
import { Users } from "lucide-react";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import SiteNavbar from "../elements/site-navbar/gumroad";
import SiteFooter from "../elements/site-footer/gumroad";
import CandidatesHead from "../elements/candidates-head/gumroad";
import PartyCard from "../composites/party-card/gumroad";
import { getPartyColor } from "../../utils/partyColors";

export default function GumroadCandidates({ candidates = [], editorMode = false }) {
  const globalConfig = useGlobalConfig();
  const parties = (candidates || []).filter((p) => p && parseInt(p.number) > 0);
  const facultyEn = globalConfig.facultyShortEn || "FMS";
  const calendarYear = globalConfig.electionCalendarYear || "";
  const uni = globalConfig.university || "PSU";
  const copyrightYear = globalConfig.copyrightYear || calendarYear;

  return (
    <div className="fms-app gc-root gum-root">
      <GumroadBaseStyles />
      {/* TOPBAR — shared gumroad navbar element */}
      <SiteNavbar active="candidates" editorMode={editorMode} />

      <main className="gc-page">
        {/* HEAD — candidates-head element (own identity: echo headline + confetti) */}
        <CandidatesHead count={parties.length} />

        {/* GRID */}
        {parties.length > 0 ? (
          <div className="gc-grid">
            {parties.map((p) => (
              <PartyCard key={p.id || p.number} party={p} pop={getPartyColor(p, p.number - 1)} editorMode={editorMode} />
            ))}
          </div>
        ) : (
          <div className="gc-empty">
            <Users size={48} />
            <h3>ยังไม่มีข้อมูลผู้สมัคร</h3>
            <p>รายชื่อพรรคจะแสดงที่นี่เมื่อเปิดรับสมัครและประกาศผู้สมัครอย่างเป็นทางการ</p>
          </div>
        )}
      </main>

      {/* FOOTER — shared gumroad footer element */}
      <SiteFooter faculty={facultyEn} uni={uni} year={copyrightYear} />

      <style jsx global>{`
        .gc-root{
          /* soft "ละมุน" palette — matches home (warm dark-olive ink + pastel wash) */
          --ink:#26271c; --ink2:#5c5a4b; --cream:#FFF6EC; --paper:#FFFDFA;
          --pink:#FF9CE9; --lime:#C2F47E; --yellow:#FFD24D; --sky:#B6E6FF; --coral:#FF8A8A;
          --bw:2.5px; --sh:5px 5px 0 var(--ink); --sh-sm:3px 3px 0 var(--ink); --sh-lg:8px 8px 0 var(--ink);
          --fd:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --fm:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace;
          --fb:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif;
          min-height:100vh; display:flex; flex-direction:column; color:var(--ink); font-family:var(--fb);
          container-type:inline-size; container-name:gc;
          background:linear-gradient(135deg, #FFE6F2 0%, #FFF7EE 46%, #EEF7DB 100%) fixed;
        }
        .gc-root *{ box-sizing:border-box; } .gc-root a{ text-decoration:none; color:inherit; } .gc-root img{ display:block; max-width:100%; }

        .gc-page{ flex:1; width:100%; max-width:1200px; margin:0 auto; padding:48px 32px 72px; }

        /* head = <CandidatesHead> element (own scoped styles) */

        /* grid */
        .gc-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:28px; }
        /* party tiles = <CandidatesPartyCard> elements (own scoped styles) */

        /* empty */
        .gc-empty{ text-align:center; padding:72px 24px; background:var(--paper); border:var(--bw) dashed var(--ink); border-radius:22px; color:var(--ink2); }
        .gc-empty h3{ margin:16px 0 6px; font-size:22px; font-weight:800; color:var(--ink); }
        .gc-empty p{ margin:0 auto; max-width:420px; font-size:14px; line-height:1.6; }

        /* footer = <SiteFooter> element (own scoped styles) */

        /* RESPONSIVE */
        @container gc (max-width:900px){
          .gc-page{ padding:36px 20px 56px; }
        }
        @container gc (max-width:620px){
          .gc-grid{ grid-template-columns:1fr; gap:20px; }
        }
      `}</style>
    </div>
  );
}
