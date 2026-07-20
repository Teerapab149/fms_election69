"use client";

// StudioDarkClosed — the SYSTEM-CLOSED status page for the Studio Dark v2
// template. Rendered by /closed when activeTemplateId === 'studio-dark'.
//
// The prototype has no closed screen (same situation gumroad hit) — this is
// composed in the template's own language: centered scene on the shared shell,
// variant icon inside the slowly-spinning dashed ring (the success-page mark
// device), mono kicker, giant English headline with the serif-italic accent,
// then the page's real Thai title + desc, and ONE primary action (logout when
// signed in, back-home otherwise).
//
// Variants (decided by closed/page.js from electionStatus/systemMode):
//   waiting → polls not open yet (Clock)
//   ended   → election finished (CheckCheck)
//   closed  → paused / maintenance (Lock)
//
// State theatre (sd-B1A, mirrors gumroad gm-B1A/876606c + VerdureClosed): the
// state is spoken in studio-dark's own material instead of a bare text-swap.
// `waiting` carries a LIVE countdown to ELECTION_START (JetBrains Mono tabular
// ledger cells, lime accent numerals — the template's own countdown voice, NOT
// gumroad's cream cells) + a factual open-window caption; `ended` carries a
// factual close-time caption. OWNER DECISION: no results-button in the card
// body on studio-dark — the rail's Returns nav is the only path to results
// (like receipt), so `ended` does NOT get a CTA the other families have.
// `closed` (paused) stays a plain hold, no invented copy.
//
// Rail/card systemMode bug (sd-B1A part B): StudioDarkShell → StudioDarkRail
// renders a LIVE "POLLS OPEN IN" countdown whenever it isn't told the real
// systemMode (defaults to AUTO, which falls through to date math). closed/page.js
// never passed systemMode down, so an ended/paused body could sit next to a rail
// still counting down to a stale future date. Fixed by threading systemMode
// through (closed/page.js → here → StudioDarkShell → StudioDarkRail already
// wired for it, cf StudioDarkShell.js) with a variant→systemMode fallback map
// for callers that only pass `variant` (e.g. template-preview, which has no
// live status fetch to source a real systemMode from).
//
// Pure presentation: page owns status fetch + the PSU SSO logout flow.

import { useState, useEffect } from "react";
import { getPath } from "../../utils/basePath";
import { Lock, Clock, CheckCheck, LogOut } from "lucide-react";
import StudioDarkShell from "./StudioDarkShell";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { resolveElectionDates, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";

const VARIANTS = {
  waiting: {
    Icon: Clock,
    kickerEn: "OPENS SOON",
    kickerTh: "ยังไม่เปิดโหวต",
    headline: (<>Not yet<br /><em>open.</em></>),
    live: false,
  },
  ended: {
    Icon: CheckCheck,
    kickerEn: "POLLS CLOSED",
    kickerTh: "ปิดโหวตแล้ว",
    headline: (<>That&rsquo;s<br />a <em>wrap.</em></>),
    live: false,
  },
  closed: {
    Icon: Lock,
    kickerEn: "ON HOLD",
    kickerTh: "ปิดชั่วคราว",
    headline: (<>Ballot<br />on <em>hold.</em></>),
    live: false,
  },
};

// variant → systemMode fallback, used only when the caller doesn't pass a real
// `systemMode` (see comment above). `waiting` is only ever reached via AUTO
// (closed/page.js's getMessage() — WAITING is an AUTO-only electionStatus), so
// leaving it AUTO is correct: the rail's own AUTO date-math already produces the
// right live "POLLS OPEN IN" countdown for a genuinely-waiting page.
const VARIANT_SYSMODE = { waiting: "AUTO", ended: "ENDED", closed: "PAUSE" };

// Countdown segments — days shown as-is (can exceed 2 digits), the rest padded.
const CD_UNITS = [["d", "DAYS"], ["hh", "HRS"], ["mm", "MIN"], ["ss", "SEC"]];

export default function StudioDarkClosed({
  title = "",
  desc = "",
  variant = "closed",
  session = null,
  onLogout = () => {},
  editorMode = false,
  systemMode = null,
}) {
  const v = VARIANTS[variant] || VARIANTS.closed;
  const { Icon } = v;
  const effectiveSystemMode = systemMode || VARIANT_SYSMODE[variant] || "AUTO";

  const globalConfig = useGlobalConfig();
  const { ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);

  // Live countdown to ELECTION_START — waiting variant only. Null once the
  // target has passed or dates are invalid (no stuck 00:00:00 / negative
  // digits). editorMode computes once (no interval) so the admin preview never
  // ticks — same contract as VerdureClosed/GumroadClosed.
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

  // Factual caption — a real open/close window, derived from the resolved
  // schedule (empty-guarded so an invalid date renders nothing rather than
  // "เปิดลงคะแนน "). Mirrors VerdureClosed/GumroadClosed's convention.
  let factual = null;
  if (variant === "waiting") {
    const d = formatThaiDate(ELECTION_START);
    if (d) factual = `เปิดลงคะแนน ${d} · ${formatThaiTime(ELECTION_START)}–${formatThaiTime(ELECTION_END)}`;
  } else if (variant === "ended") {
    const d = formatThaiDate(ELECTION_END);
    if (d) factual = `ปิดลงคะแนน ${d} · ${formatThaiTime(ELECTION_END)}`;
  }

  return (
    <StudioDarkShell
      active="vote"
      num="03"
      label="Status"
      labelTh="สถานะการลงคะแนน"
      editorMode={editorMode}
      systemMode={effectiveSystemMode}
      right={<span>{v.kickerEn}</span>}
    >
      <div className="sdcl-scene">
        <div className="sdcl-card">
          <div className="sdcl-mark"><Icon size={28} strokeWidth={2} /></div>
          <div className="sdcl-kicker"><span className="sd-nw">{v.kickerEn}</span> · <span className="sd-thai">{v.kickerTh}</span></div>
          <h1 className="sdcl-headline">{v.headline}</h1>

          {cd && (
            <div className="sdcl-cd" role="timer" aria-label="เวลาที่เหลือก่อนเปิดลงคะแนน">
              {CD_UNITS.map(([k, u]) => (
                <div className="sdcl-cd__cell" key={u}>
                  <div className="sdcl-cd__num">{k === "d" ? cd.d : String(cd[k]).padStart(2, "0")}</div>
                  <div className="sdcl-cd__unit">{u}</div>
                </div>
              ))}
            </div>
          )}
          {factual && (
            <div className="sdcl-fact">
              <span className="sdcl-fact__txt">{factual}</span>
            </div>
          )}

          <h2 className="sdcl-title">{title}</h2>
          <p className="sdcl-desc">{desc}</p>

          <div className="sdcl-actions">
            {session ? (
              <button type="button" className="sd-btn sd-btn--accent sd-btn--lg" onClick={() => !editorMode && onLogout()}>
                <LogOut size={16} /> ออกจากระบบ
              </button>
            ) : (
              <a href={editorMode ? undefined : getPath("/")} className="sd-btn sd-btn--accent sd-btn--lg">
                ← กลับหน้าหลัก
              </a>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .sdcl-scene {
          flex:1; display:grid; place-items:center;
          padding:64px 24px; position:relative; overflow:hidden;
          min-height:calc(100vh - 64px);
        }
        .sdcl-scene::after {
          content:""; position:absolute; right:-120px; bottom:-120px; width:360px; height:360px;
          background:radial-gradient(circle, rgba(213,255,63,.07) 0, transparent 70%); pointer-events:none;
        }
        .sdcl-card { max-width:640px; width:100%; text-align:center; display:flex; flex-direction:column; align-items:center; position:relative; z-index:1; }

        .sdcl-mark {
          width:80px; height:80px; border:1px solid var(--sd-accent); border-radius:999px;
          display:grid; place-items:center; color:var(--sd-accent); margin-bottom:30px; position:relative;
        }
        .sdcl-mark::before {
          content:""; position:absolute; inset:-8px; border:1px dashed var(--sd-line-strong); border-radius:999px;
          animation:sdclSpin 30s linear infinite;
        }
        @keyframes sdclSpin { to { transform:rotate(360deg); } }

        .sdcl-kicker {
          font-family:var(--sd-mono); font-size:11px; letter-spacing:.25em; text-transform:uppercase;
          color:var(--sd-ink-3); margin-bottom:24px;
        }
        .sdcl-headline {
          font-family:var(--sd-sans); font-weight:400; font-size:clamp(52px,7vw,96px);
          line-height:.92; letter-spacing:-.05em; margin:0 0 28px; color:var(--sd-ink);
        }
        .sdcl-title { font-family:var(--sd-sans); font-weight:500; font-size:clamp(19px,2.2vw,24px); letter-spacing:-.01em; margin:0 0 12px; color:var(--sd-ink); }
        .sdcl-desc { font-size:15px; color:var(--sd-ink-2); line-height:1.65; font-weight:300; max-width:460px; margin:0 0 36px; }
        .sdcl-actions { display:flex; gap:14px; }

        /* live countdown — JetBrains Mono tabular ledger cells + lime numerals,
           the template's own countdown voice (distinct from the rail's smaller
           sans-numeral widget and from gumroad's cream cells / verdure's serif
           digits). tabular-nums keeps the ticker from reflowing as seconds roll. */
        .sdcl-cd { display:flex; gap:14px; margin:0 0 22px; }
        .sdcl-cd__cell {
          min-width:68px; text-align:center; padding:16px 8px;
          border:1px solid var(--sd-line); border-radius:14px; background:var(--sd-bg-2);
        }
        .sdcl-cd__num {
          font-family:var(--sd-mono); font-weight:500; font-size:clamp(26px,4vw,38px);
          letter-spacing:-.01em; color:var(--sd-accent); line-height:1; font-variant-numeric:tabular-nums;
        }
        .sdcl-cd__unit { font-family:var(--sd-mono); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--sd-ink-3); margin-top:9px; }

        /* factual caption — small tracked mono line carrying the real schedule.
           The run is a full Thai sentence (date + time window), so unlike the
           short .sd-thai kicker labels (sd-T1, StudioDarkShell.js) it must WRAP:
           this local class keeps the family's Thai body font + gentle tracking
           but allows normal wrapping (mirrors verdure's vd-thai-flow / gumroad's
           gcl-fact__txt deviation — nowrap here would overflow the card on
           mobile). Scoped to this component only. */
        .sdcl-fact { font-family:var(--sd-mono); font-size:11px; letter-spacing:.1em; color:var(--sd-ink-3); text-align:center; margin:0 0 30px; }
        .sdcl-fact__txt { font-family:var(--font-anuphan),'Anuphan',system-ui,sans-serif; letter-spacing:.03em; white-space:normal; line-height:1.6; }

        @media (max-width:1100px) {
          .sdcl-scene { min-height:calc(100vh - 110px); padding:48px 24px; }
        }
        @media (max-width:560px) {
          .sdcl-cd { gap:10px; }
          .sdcl-cd__cell { min-width:58px; padding:13px 6px; }
        }
      `}</style>
    </StudioDarkShell>
  );
}
