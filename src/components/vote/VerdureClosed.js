"use client";

// VerdureClosed — SYSTEM-CLOSED status page for the Verdure template (composed in
// the design's language: a moss seal disc with the variant icon + dashed orbit,
// a serif headline, the page's Thai title + desc, and one action). Variants:
// waiting (Clock) · ended (CheckCheck) · closed (Lock). Cream screen.
//
// State theatre (vd-B1A): the state is spoken in verdure's own voice instead of a
// bare text-swap. `waiting` carries a LIVE serif-italic countdown to ELECTION_START
// (mono unit labels, echoing VerdureResults' vd-rdisc__cd) + a factual open-window
// caption; `ended` carries the close-time caption + a PRIMARY link to the results
// (the sign-out/home button drops to a ghost secondary). Every added string is a
// real date/time/number — no narrative copy.

import { useState, useEffect } from "react";
import { getPath } from "../../utils/basePath";
import { motion } from "framer-motion";
import { Lock, Clock, CheckCheck, LogOut, BarChart3 } from "lucide-react";
import VerdureShell from "./VerdureShell";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { resolveElectionDates, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";

const VARIANTS = {
  waiting: { Icon: Clock,      kicker: "OPENS SOON · ยังไม่เปิดโหวต", head: (<>Not yet<br /><em>open.</em></>), edge: "Status" },
  ended:   { Icon: CheckCheck, kicker: "POLLS CLOSED · ปิดโหวตแล้ว",  head: (<>That&rsquo;s<br />a <em>wrap.</em></>), edge: "Status" },
  closed:  { Icon: Lock,       kicker: "ON HOLD · ปิดชั่วคราว",      head: (<>Ballot<br />on <em>hold.</em></>),  edge: "Status" },
};

// Countdown segments — days shown as-is (can exceed 2 digits), the rest padded.
const CD_UNITS = [["d", "DAYS"], ["hh", "HRS"], ["mm", "MIN"], ["ss", "SEC"]];

export default function VerdureClosed({ title = "", desc = "", variant = "closed", session = null, onLogout = () => {}, editorMode = false }) {
  const v = VARIANTS[variant] || VARIANTS.closed;
  const { Icon } = v;
  const globalConfig = useGlobalConfig();
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
  // (empty-guarded so an invalid date renders nothing rather than "เปิดโหวต ").
  let factual = null;
  if (variant === "waiting") {
    const d = formatThaiDate(ELECTION_START);
    if (d) factual = `เปิดโหวต ${d} · ${formatThaiTime(ELECTION_START)}–${formatThaiTime(ELECTION_END)}`;
  } else if (variant === "ended") {
    const d = formatThaiDate(ELECTION_END);
    if (d) factual = `ปิดหีบ ${d} · ${formatThaiTime(ELECTION_END)}`;
  }

  return (
    <VerdureShell active="vote" editorMode={editorMode}
      edge={{ num: "✕", label: "Status", th: "สถานะการลงคะแนน" }}
      cornermarkTitle="Status" cornermarkSub="ระบบการลงคะแนน"
      statusChip={<div className="vd-chip-live"><span className="dot" /> {v.kicker.split(" · ")[0]}</div>}>
      <div className="vd-warm-bg" aria-hidden />
      <div className="vd-closed">
        <div className="vd-closed__disc">
          <motion.span className="ring" animate={{ rotate: 360 }} transition={{ duration: 40, ease: "linear", repeat: Infinity }} />
          <Icon size={48} strokeWidth={1.8} />
        </div>
        <div className="vd-closed__kicker">{v.kicker}</div>
        <h1 className="vd-closed__head">{v.head}</h1>
        <div className="vd-closed__accent" aria-hidden />

        {cd && (
          <div className="vd-closed__cd" role="timer" aria-label="เวลาที่เหลือก่อนเปิดโหวต">
            {CD_UNITS.map(([k, u]) => (
              <div className="seg" key={u}>
                <span className="num vd-tabular">{k === "d" ? cd.d : String(cd[k]).padStart(2, "0")}</span>
                <span className="u">{u}</span>
              </div>
            ))}
          </div>
        )}
        {factual && <div className="vd-closed__fact">{factual}</div>}

        <h2 className="vd-closed__title">{title}</h2>
        <p className="vd-closed__desc">{desc}</p>

        {variant === "ended" ? (
          <div className="vd-closed__actions">
            <a href={editorMode ? undefined : getPath("/results")} className="vd-btn vd-btn--terra vd-btn--lg"><BarChart3 size={16} /> ดูผลคะแนน</a>
            {session ? (
              <button type="button" className="vd-btn vd-btn--ghost vd-btn--lg" onClick={() => !editorMode && onLogout()}><LogOut size={16} /> ออกจากระบบ</button>
            ) : (
              <a href={editorMode ? undefined : getPath("/")} className="vd-btn vd-btn--ghost vd-btn--lg">← กลับหน้าหลัก</a>
            )}
          </div>
        ) : session ? (
          <button type="button" className="vd-btn vd-btn--terra vd-btn--lg" onClick={() => !editorMode && onLogout()}><LogOut size={16} /> ออกจากระบบ</button>
        ) : (
          <a href={editorMode ? undefined : getPath("/")} className="vd-btn vd-btn--terra vd-btn--lg">← กลับหน้าหลัก</a>
        )}
      </div>

      <style jsx global>{`
        /* golden-hour warm wash — same recipe as the single-vote booth so the
           status page carries the template's warmth, not flat cream */
        .vd-warm-bg { position:fixed; inset:0; z-index:0; pointer-events:none;
          background:
            radial-gradient(72% 46% at 50% 0%, rgba(var(--gold-rgb),.16) 0%, transparent 56%),
            radial-gradient(60% 44% at 100% 8%, rgba(var(--terra-rgb),.09) 0%, transparent 50%),
            radial-gradient(66% 52% at 0% 100%, rgba(var(--terra-soft-rgb),.30) 0%, transparent 56%),
            linear-gradient(168deg, var(--cream-2) 0%, var(--cream) 46%, var(--cream-3) 100%); }

        .vd-closed { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:120px 24px 150px; position:relative; z-index:1; }
        .vd-closed__disc { width:180px; height:180px; border-radius:50%; background:var(--moss); color:var(--cream); display:grid; place-items:center; position:relative; margin-bottom:36px; box-shadow:0 40px 60px -30px rgba(var(--moss-rgb),.4); }
        .vd-closed__disc .ring { position:absolute; inset:-14px; border-radius:50%; border:1px dashed var(--terra); opacity:.4; }
        .vd-closed__kicker { font-family:var(--fm); font-size:11px; letter-spacing:.28em; text-transform:uppercase; color:var(--terra-2); margin-bottom:22px; }
        .vd-closed__head { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(56px,8vw,108px); line-height:.92; letter-spacing:-.02em; margin:0 0 10px; color:var(--moss); }
        .vd-closed__head em { color:var(--terra); }
        .vd-closed__accent { width:72px; height:2px; background:var(--terra); margin:4px auto 26px; }

        /* live countdown — serif-italic digits + mono unit labels, echoing the
           results disc's vd-rdisc__cd voice. tabular digits keep the ticker from
           reflowing as seconds roll. */
        .vd-closed__cd { display:flex; align-items:flex-start; justify-content:center; gap:22px; margin:0 0 20px; }
        .vd-closed__cd .seg { display:flex; flex-direction:column; align-items:center; min-width:58px; }
        .vd-closed__cd .num { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(46px,6.5vw,74px); line-height:.88; letter-spacing:-.03em; color:var(--moss); }
        .vd-closed__cd .seg:first-child .num { color:var(--terra); }
        .vd-closed__cd .u { font-family:var(--fm); font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:var(--terra-2); margin-top:9px; }

        .vd-closed__fact { font-family:var(--fm); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:rgba(var(--moss-rgb),.62); margin:0 0 30px; }

        .vd-closed__title { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(20px,2.4vw,26px); margin:0 0 12px; color:var(--moss); }
        .vd-closed__desc { font-family:var(--ft); font-size:16px; color:rgba(var(--moss-rgb),.85); line-height:1.6; max-width:460px; margin:0 0 36px; }
        .vd-closed__actions { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:12px; }
        @media (max-width:1100px) { .vd-closed { padding:96px 20px 130px; } }
        @media (max-width:560px) {
          .vd-closed { padding:84px 18px 128px; }
          .vd-closed__disc { width:150px; height:150px; margin-bottom:28px; }
          .vd-closed__cd { gap:14px; }
          .vd-closed__cd .seg { min-width:46px; }
          .vd-closed__actions { flex-direction:column; align-items:stretch; width:100%; max-width:320px; }
        }
      `}</style>
    </VerdureShell>
  );
}
