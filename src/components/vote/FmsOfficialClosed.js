"use client";

// FmsOfficialClosed — the system-status page for the FMS Official template:
// polls not open yet (waiting), polls finished (ended), or paused for
// maintenance (closed).
//
// A status page is the one screen most likely to be screenshotted and forwarded
// ("ทำไมเข้าไม่ได้"), so it states facts rather than mood: which state, the
// actual open/close datetime from globalConfig, and a live countdown when there
// is something real to count to. No slogans — an institution that cannot open
// its ballot on time should say so plainly.

import { useState, useEffect } from "react";
import { Clock, CheckCheck, Lock, LogOut, BarChart3, ArrowRight } from "lucide-react";
import { getPath } from "../../utils/basePath";
import FmsOfficialShell from "./FmsOfficialShell";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { resolveElectionDates, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";

const VARIANTS = {
  waiting: { Icon: Clock,      kicker: "สถานะระบบ", tone: "wait" },
  ended:   { Icon: CheckCheck, kicker: "สถานะระบบ", tone: "done" },
  closed:  { Icon: Lock,       kicker: "สถานะระบบ", tone: "hold" },
};

export default function FmsOfficialClosed({
  title = "", desc = "", variant = "closed",
  session = null, onLogout = () => {}, editorMode = false,
}) {
  const v = VARIANTS[variant] || VARIANTS.closed;
  const { Icon } = v;
  const globalConfig = useGlobalConfig();
  const { ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);

  // Only the `waiting` state has something real to count to. Everything else
  // renders no clock at all rather than a stuck 00:00:00 — a frozen countdown on
  // a status page reads as a broken system, which is the opposite of the job.
  const [cd, setCd] = useState(null);
  // The dependency is the TIMESTAMP, not the Date. resolveElectionDates() builds
  // fresh Date objects on every call and this component calls it every render, so
  // depending on the object re-ran this effect on every render — and because the
  // effect setState's a newly built object, React never bailed out and the page
  // span its own render loop. Measured 48 "Maximum update depth exceeded" errors
  // on the waiting state, which is also the default. A number compares by value.
  const startMs = ELECTION_START instanceof Date ? ELECTION_START.getTime() : NaN;
  useEffect(() => {
    if (variant !== "waiting" || isNaN(startMs)) { setCd(null); return; }
    const calc = () => {
      const diff = startMs - Date.now();
      if (diff <= 0) return null;
      return {
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      };
    };
    setCd(calc());
    if (editorMode) return;               // admin preview must not tick
    const id = setInterval(() => setCd(calc()), 1000);
    return () => clearInterval(id);
  }, [variant, editorMode, startMs]);

  const when = (d) =>
    d instanceof Date && !isNaN(d.getTime()) ? `${formatThaiDate(d)} เวลา ${formatThaiTime(d)}` : null;
  const openAt = when(ELECTION_START);
  const closeAt = when(ELECTION_END);

  return (
    <FmsOfficialShell active="vote" narrow plain editorMode={editorMode}>
      {/* One document, not a column of loose boxes. Before this the page stacked
          an icon, a heading, a countdown row and a facts panel as four unrelated
          objects floating in the middle of the screen — the same "flat" failure
          the home page had, for the same reason: no container, so nothing to
          read as a thing. A status page is a NOTICE; giving it the family's
          notice makes that literal. */}
      <div className="fo-closed">
        <div className="fo-notice">
          {/* No tab here. Owner's call: the hanging tab is the home page's mark
              and repeating it on every document made the set look stamped rather
              than designed. The notice itself carries the identity — head rule,
              frame, compartments — and that is enough on an inner page. */}
          <div className="fo-notice__body fo-closed__body">
            <span className={`fo-closed__ico fo-closed__ico--${v.tone}`}><Icon size={24} aria-hidden /></span>
            <h1 className="fo-closed__h1">{title}</h1>
            <span className="fo-rule" aria-hidden />
            {desc && <p className="fo-closed__desc">{desc}</p>}

            {cd && (
              <div className="fo-closed__cd">
                {[[cd.d, "วัน"], [cd.h, "ชั่วโมง"], [cd.m, "นาที"], [cd.s, "วินาที"]].map(([n, l]) => (
                  <div key={l} className="fo-cd__cell">
                    <b>{String(n).padStart(2, "0")}</b>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* the schedule becomes a compartment of the notice, divided by the
              same hairline the home page uses for its countdown strip */}
          {(openAt || closeAt) && (
            <dl className="fo-closed__facts">
              {openAt && (<><dt>เปิดลงคะแนน</dt><dd>{openAt}</dd></>)}
              {closeAt && (<><dt>ปิดลงคะแนน</dt><dd>{closeAt}</dd></>)}
            </dl>
          )}
        </div>

        {/* actions sit OUTSIDE the document — what you read and what you act on
            are different jobs, same rule the home page follows */}
        <div className="fo-closed__actions">
          {variant === "ended" ? (
            <>
              <a href={editorMode ? undefined : getPath("/results")} className="fo-btn fo-btn--primary">
                <BarChart3 size={17} aria-hidden /> ดูผลคะแนน
              </a>
              <a href={editorMode ? undefined : getPath("/")} className="fo-btn fo-btn--ghost">กลับหน้าแรก</a>
            </>
          ) : (
            <>
              <a href={editorMode ? undefined : getPath("/")} className="fo-btn fo-btn--primary">
                กลับหน้าแรก <ArrowRight size={17} aria-hidden />
              </a>
              {session && (
                <button type="button" onClick={editorMode ? undefined : onLogout} className="fo-btn fo-btn--ghost">
                  <LogOut size={16} aria-hidden /> ออกจากระบบ
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        /* centre the document in the page and let the main region grow, so short
           states do not leave a band of dead white above the footer */
        .fo-closed { display: flex; flex-direction: column; align-items: center; }
        .fo-closed .fo-notice { max-width: 620px; }
        .fo-closed__body { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .fo-closed__ico {
          width: 52px; height: 52px; border-radius: 12px; margin-bottom: 16px;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--fo-tint); color: var(--fo-brand); border: 1px solid var(--fo-line);
        }
        .fo-closed__ico--hold { color: var(--fo-plum); }
        .fo-closed__h1 { margin: 0; font-size: clamp(24px, 3.2vw, 34px); font-weight: 600; line-height: 1.25; color: var(--fo-ink); }
        .fo-closed__desc { margin: 14px 0 0; max-width: 460px; font-size: 15px; font-weight: 300; line-height: 1.65; color: var(--fo-muted); }
        .fo-closed__cd { display: flex; gap: 8px; margin-top: 24px; }

        /* Facts as a definition list, not sentences: a reader scanning for "when
           does it open" finds a label and a datetime, not a paragraph to parse.
           Now a compartment of the notice rather than a separate tinted box —
           same hairline division the home page uses for its countdown strip. */
        .fo-closed__facts {
          position: relative; z-index: 1; margin: 0;
          border-top: 1px solid var(--fo-line); padding: 18px 26px 20px;
          display: grid; grid-template-columns: auto 1fr; gap: 8px 20px; text-align: left;
        }
        .fo-closed__facts dt { font-size: 13px; font-weight: 400; color: var(--fo-muted); white-space: nowrap; }
        .fo-closed__facts dd { margin: 0; font-size: 14px; font-weight: 500; color: var(--fo-ink); }
        .fo-closed__actions { display: flex; gap: 12px; margin-top: 26px; flex-wrap: wrap; justify-content: center; }

        @media (max-width: 640px) {
          .fo-closed__cd { gap: 8px; width: 100%; }
          .fo-closed__cd .fo-cd__cell { flex: 1 1 0; min-width: 0; padding: 12px 4px 9px; }
          .fo-closed__actions { width: 100%; flex-direction: column; }
          .fo-closed__actions .fo-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </FmsOfficialShell>
  );
}
