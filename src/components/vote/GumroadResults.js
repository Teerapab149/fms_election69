"use client";

// GumroadResults — the "Active Pulse" RESULTS layout (template: gumroad).
//
// Ported from docs/design-refs index.html #06: gumroad topbar → page head (status
// sticker + title) → (when results are still locked) an ink "WHO WILL WIN?" headline
// + a lock card with the closing countdown → pop stat cards (total / eligible /
// turnout) → a per-party race chart (locked ??.?% behind a blur until reveal; real
// %, sorted, with a 👑 winner once revealed) → turnout demographics as chunky bars.
//
// Pure presentation: results/page.js owns access control + data fetching and hands
// the resolved data down. No scores leak before `isRevealed`.

import { getPath } from "../../utils/basePath";
import React from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

const POPS = ["#FF90E8", "#A8E1FF", "#B6FF6E", "#FFC900", "#FF6E6E"];

export default function GumroadResults({
  candidates = [],
  totalVotes = 0,
  demographics = {},
  finalStatus = "WAITING",
  isRevealed = false,
  isNotStarted = false,
  countdownText = "",
  onSelectParty = () => {},
}) {
  const globalConfig = useGlobalConfig();
  const ended = finalStatus === "ENDED";
  const revealed = !!isRevealed;
  const counting = !isNotStarted && !revealed;       // active/ended but scores still locked
  const totalEligible = demographics?.totalEligible || 0;
  const turnout = totalEligible > 0 ? ((totalVotes / totalEligible) * 100) : 0;

  const parties = candidates.filter((c) => parseInt(c.number) > 0);
  const topScore = revealed ? Math.max(0, ...parties.map((p) => p.score || 0)) : -1;

  const statusLabel = ended ? (revealed ? "FINAL RESULT" : "COUNTING IN PROGRESS")
    : finalStatus === "ONGOING" ? "REAL-TIME UPDATE" : "UPCOMING";

  const Bars = ({ items, colorFor }) => {
    const max = Math.max(1, ...items.map((i) => i.value || 0));
    return (
      <div className="gr-bars">
        {items.map((it, i) => (
          <div className="gr-bar" key={i}>
            <div className="gr-bar__name">{it.name}</div>
            <div className="gr-bar__track"><div className="gr-bar__fill" style={{ width: `${Math.round((it.value || 0) / max * 100)}%`, background: colorFor(i, it) }} /></div>
            <div className="gr-bar__val">{(it.value || 0).toLocaleString()}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fms-app gr-root">
      {/* TOPBAR */}
      <header className="gr-topbar">
        <a href={getPath("/")} className="gr-brand">
          <Image src={getPath("/images/logo/fms_logo50_color.png")} alt="FMS 50th" width={480} height={480} className="gr-badge" />
          <span className="gr-div" />
          <Image src={getPath("/images/logo/FMS_Standard_Logo_PNG.png")} alt="FMS PSU" width={1200} height={384} className="gr-word" />
        </a>
        <nav className="gr-nav">
          <a href={getPath("/")} className="gr-navlink">หน้าแรก</a>
          <a href={getPath("/candidates")} className="gr-navlink">Meet Candidates</a>
          <a href={getPath("/results")} className="gr-navlink is-active">ผลการลงคะแนนเสียง</a>
        </nav>
      </header>

      <main className="gr-page">
        {/* HEAD */}
        <div className="gr-head">
          <span className="gr-sticker gr-sticker--ink"><span className="gr-dot" /> {statusLabel}</span>
          <h1 className="gr-title">ผลการเลือกตั้ง<em>{globalConfig.electionName}</em></h1>
          <p className="gr-subtitle">ระบบเลือกตั้ง{globalConfig.organizationShort} {globalConfig.facultyName} ประจำปีการศึกษา <strong>{globalConfig.academicYearTh}</strong></p>
        </div>

        {isNotStarted ? (
          <div className="gr-waiting">
            <div className="gr-waiting__icon">⏳</div>
            <h2>ยังไม่เปิดรับลงคะแนน</h2>
            <p>ผลการเลือกตั้งจะแสดงที่นี่เมื่อเริ่มการลงคะแนน</p>
          </div>
        ) : (
          <>
            {/* LOCKED headline (while counting) */}
            {counting && (
              <div className="gr-locked">
                <div className="gr-headline">
                  <span className="gr-headline__lbl"><span className="gr-dot" /> COUNTING · กำลังนับคะแนน</span>
                  <h2 className="gr-headline__title">WHO<br />WILL<br />WIN<em>?</em></h2>
                  <p className="gr-headline__sub">ผลการนับคะแนนยังเป็นความลับจนกว่าจะปิดหีบเลือกตั้ง</p>
                </div>
                <div className="gr-lock">
                  <div className="gr-lock__icon"><Lock size={32} strokeWidth={2.5} /></div>
                  <h3>ผลการนับ<br />ยังถูกล็อก</h3>
                  <p>เพื่อความเป็นธรรม คะแนนรายพรรคจะแสดงเฉพาะหลังหมดเวลาลงคะแนน — ขณะนี้ระบบกำลังนับคะแนนเสียงของชาว FMS</p>
                  {countdownText ? <div className="gr-lock__cd">{ended ? "ปิดหีบแล้ว · รอประกาศผล" : `ปิดใน ${countdownText}`}</div> : null}
                </div>
              </div>
            )}

            {/* STAT CARDS */}
            <div className="gr-stats">
              <div className="gr-stat gr-stat--pink">
                <div className="gr-stat__lbl">★ คะแนนเสียงรวม · TOTAL</div>
                <div className="gr-stat__val tabular">{totalVotes.toLocaleString()}</div>
                <div className="gr-stat__sub">นับสะสมตั้งแต่เปิดหีบ</div>
              </div>
              <div className="gr-stat">
                <div className="gr-stat__lbl">ผู้มีสิทธิ์ · ELIGIBLE</div>
                <div className="gr-stat__val tabular">{totalEligible.toLocaleString()}</div>
                <div className="gr-stat__sub">นักศึกษาที่ลงทะเบียน</div>
              </div>
              <div className="gr-stat gr-stat--lime">
                <div className="gr-stat__lbl">ความคืบหน้า · TURNOUT</div>
                <div className="gr-stat__val tabular">{turnout.toFixed(2)}<span className="gr-stat__pct">%</span></div>
                <div className="gr-stat__sub">{ended ? "สรุปยอดผู้มาใช้สิทธิ์" : "↑ อัปเดต Real-time"}</div>
              </div>
            </div>

            {/* RACE */}
            <section className="gr-race">
              <div className="gr-race__head">
                <div>
                  <h3>📊 การกระจายคะแนนรายพรรค</h3>
                  <p>{revealed ? "สรุปผลคะแนนแต่ละพรรค" : "ข้อมูลจะปรากฏหลังปิดหีบเลือกตั้งแล้วเท่านั้น"}</p>
                </div>
                <span className={`gr-sticker ${revealed ? "gr-sticker--lime" : "gr-sticker--ink"}`}>{revealed ? "● LIVE" : "🔒 LOCKED"}</span>
              </div>
              <div className="gr-race__bars">
                {candidates.map((c, i) => {
                  const pct = revealed && totalVotes > 0 ? ((c.score || 0) / totalVotes * 100) : 0;
                  const isParty = parseInt(c.number) > 0;
                  const isWinner = revealed && isParty && (c.score || 0) === topScore && topScore > 0;
                  const color = isParty ? POPS[i % POPS.length] : "#C9C4BE";
                  const numLabel = parseInt(c.number) > 0 ? `NO. ${c.number}` : (parseInt(c.number) === 0 ? "ABSTAIN" : "DISAPPROVE");
                  return (
                    <button type="button" className="gr-rrow" key={c.id} onClick={() => onSelectParty(c)}>
                      <div className="gr-rrow__name">{isWinner ? "👑 " : ""}{c.name}<small>{numLabel}</small></div>
                      <div className="gr-rrow__track"><div className="gr-rrow__fill" style={{ width: revealed ? `${Math.max(pct, 2)}%` : "50%", background: color }} /></div>
                      <div className="gr-rrow__pct">{revealed ? `${pct.toFixed(1)}%` : "??.?%"}</div>
                    </button>
                  );
                })}
              </div>
              {!revealed && (
                <div className="gr-race__hidden">
                  <div>🔒 HIDDEN UNTIL CLOSE</div>
                  <span>ผลคะแนนจะแสดงเมื่อปิดหีบเลือกตั้งแล้วเท่านั้น</span>
                </div>
              )}
            </section>

            {/* DEMOGRAPHICS */}
            <section className="gr-demo">
              <div className="gr-demo__head">
                <span className="gr-sticker gr-sticker--pink">👥 สถิติผู้มาใช้สิทธิ์</span>
                {!revealed && <span className="gr-sticker gr-sticker--ink">🔒 LOCKED</span>}
              </div>
              {revealed ? (
                <div className="gr-demo__grid">
                  {(demographics?.byYear?.length > 0) && (
                    <div className="gr-card"><h4>แยกตามชั้นปี</h4><Bars items={demographics.byYear} colorFor={(i) => POPS[i % POPS.length]} /></div>
                  )}
                  {(demographics?.byGender?.length > 0) && (
                    <div className="gr-card"><h4>แยกตามเพศ</h4><Bars items={demographics.byGender} colorFor={(i, it) => (/female|หญิง/i.test(it.name) ? "#FF90E8" : "#A8E1FF")} /></div>
                  )}
                  {(demographics?.byMajor?.length > 0) && (
                    <div className="gr-card gr-card--wide"><h4>แยกตามสาขา</h4><Bars items={demographics.byMajor} colorFor={(i) => POPS[i % POPS.length]} /></div>
                  )}
                </div>
              ) : (
                <div className="gr-demo__locked">สถิติผู้มาใช้สิทธิ์จะปลดล็อกเมื่อเปิดผลการเลือกตั้ง</div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="gr-footer">
        <div>© {globalConfig.facultyShortEn || "FMS"}@{globalConfig.university || "PSU"} {globalConfig.copyrightYear || ""} · ALL RIGHTS RESERVED</div>
        <div className="gr-footer__edition"><span className="gr-star">★</span> ACTIVE PULSE EDITION <span className="gr-star">★</span></div>
      </footer>

      <style jsx global>{`
        .gr-root{
          --ink:#1A1A1A; --ink2:#4A4A4A; --cream:#FFF1E5; --cream2:#FFE4CE; --paper:#FFF;
          --pink:#FF90E8; --lime:#B6FF6E; --yellow:#FFC900; --sky:#A8E1FF; --coral:#FF6E6E;
          --bw:2.5px; --sh:5px 5px 0 var(--ink); --sh-sm:3px 3px 0 var(--ink); --sh-lg:8px 8px 0 var(--ink); --sh-xl:12px 12px 0 var(--ink);
          --fd:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --fm:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace;
          --fb:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif;
          min-height:100vh; display:flex; flex-direction:column; color:var(--ink); background:var(--cream);
          font-family:var(--fb); container-type:inline-size; container-name:gr;
          background-image:radial-gradient(circle at 10% 8%, #FFD1F2 0,transparent 34%),radial-gradient(circle at 92% 96%, #DCF2FF 0,transparent 38%);
          background-attachment:fixed;
        }
        .gr-root *{ box-sizing:border-box; } .gr-root a{ text-decoration:none; color:inherit; } .gr-root img{ display:block; max-width:100%; }
        .tabular{ font-variant-numeric:tabular-nums; }

        .gr-topbar{ position:sticky; top:0; z-index:40; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 32px; background:var(--cream); border-bottom:var(--bw) solid var(--ink); }
        .gr-brand{ display:flex; align-items:center; gap:14px; } .gr-badge{ width:auto; height:46px; object-fit:contain; } .gr-div{ width:2px; height:34px; background:var(--ink); } .gr-word{ width:auto; height:32px; object-fit:contain; }
        .gr-nav{ display:flex; gap:4px; } .gr-navlink{ padding:8px 16px; border-radius:999px; font-weight:600; font-size:14px; border:2px solid transparent; } .gr-navlink:hover{ background:var(--paper); border-color:var(--ink); } .gr-navlink.is-active{ background:var(--pink); border-color:var(--ink); box-shadow:var(--sh-sm); }

        .gr-page{ flex:1; width:100%; max-width:1100px; margin:0 auto; padding:36px 28px 64px; }
        .gr-head{ text-align:center; margin-bottom:30px; }
        .gr-sticker{ display:inline-flex; align-items:center; gap:8px; padding:6px 15px; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:999px; font-weight:700; font-size:13px; box-shadow:var(--sh-sm); white-space:nowrap; }
        .gr-sticker--ink{ background:var(--ink); color:var(--cream); } .gr-sticker--pink{ background:var(--pink); } .gr-sticker--lime{ background:var(--lime); }
        .gr-dot{ width:9px; height:9px; border-radius:999px; background:var(--coral); box-shadow:0 0 0 0 rgba(255,110,110,.7); animation:grPulse 1.6s ease-out infinite; }
        @keyframes grPulse{ 0%{box-shadow:0 0 0 0 rgba(255,110,110,.7)} 70%{box-shadow:0 0 0 12px rgba(255,110,110,0)} 100%{box-shadow:0 0 0 0 rgba(255,110,110,0)} }
        .gr-title{ font-family:var(--fd); font-size:clamp(34px,7cqw,72px); line-height:.95; letter-spacing:-.03em; margin:14px 0 6px; text-transform:uppercase; }
        .gr-title em{ font-style:normal; background:var(--pink); border:var(--bw) solid var(--ink); padding:0 12px; display:inline-block; box-shadow:var(--sh); transform:rotate(-1.5deg); margin-left:6px; }
        .gr-subtitle{ font-size:clamp(14px,2cqw,17px); color:var(--ink2); font-weight:500; max-width:640px; margin:0 auto; }

        .gr-waiting{ text-align:center; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:28px; box-shadow:var(--sh-lg); padding:56px 28px; }
        .gr-waiting__icon{ font-size:48px; } .gr-waiting h2{ font-family:var(--fd); font-size:28px; text-transform:uppercase; margin:12px 0 6px; } .gr-waiting p{ color:var(--ink2); margin:0; }

        /* locked headline */
        .gr-locked{ display:grid; grid-template-columns:1.1fr 1fr; gap:28px; margin-bottom:30px; align-items:stretch; }
        .gr-headline{ position:relative; overflow:hidden; background:var(--ink); color:var(--cream); border:var(--bw) solid var(--ink); border-radius:28px; box-shadow:var(--sh-xl); padding:36px; }
        .gr-headline::after{ content:""; position:absolute; inset:-50% -10% auto auto; width:300px; height:300px; background:var(--pink); border-radius:999px; opacity:.25; filter:blur(20px); }
        .gr-headline__lbl{ position:relative; z-index:2; display:inline-flex; align-items:center; gap:10px; font-family:var(--fm); font-size:13px; text-transform:uppercase; letter-spacing:.2em; color:var(--lime); }
        .gr-headline__title{ position:relative; z-index:2; font-family:var(--fd); font-size:clamp(48px,7cqw,88px); letter-spacing:-.03em; line-height:.92; margin:16px 0 6px; text-transform:uppercase; }
        .gr-headline__title em{ font-style:normal; color:var(--pink); }
        .gr-headline__sub{ position:relative; z-index:2; font-size:16px; color:rgba(255,241,229,.78); margin:4px 0 0; }
        .gr-lock{ position:relative; overflow:hidden; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:28px; box-shadow:var(--sh-xl); padding:34px; }
        .gr-lock::before{ content:""; position:absolute; inset:0; background-image:radial-gradient(circle at 20% 20%, #FFD1F2 0,transparent 50%),radial-gradient(circle at 80% 80%, #DFFFC2 0,transparent 50%); z-index:0; }
        .gr-lock > *{ position:relative; z-index:1; }
        .gr-lock__icon{ width:74px; height:74px; background:var(--yellow); border:var(--bw) solid var(--ink); border-radius:20px; box-shadow:var(--sh); display:grid; place-items:center; margin-bottom:18px; transform:rotate(-4deg); }
        .gr-lock h3{ font-family:var(--fd); font-size:clamp(26px,3cqw,38px); margin:4px 0 8px; text-transform:uppercase; }
        .gr-lock p{ color:var(--ink2); margin:0; line-height:1.55; }
        .gr-lock__cd{ margin-top:20px; display:inline-block; font-family:var(--fm); font-weight:600; font-size:14px; background:var(--ink); color:var(--cream); padding:10px 18px; border-radius:12px; }

        /* stat cards */
        .gr-stats{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:30px; }
        .gr-stat{ background:var(--paper); border:var(--bw) solid var(--ink); border-radius:22px; box-shadow:var(--sh); padding:24px; }
        .gr-stat--pink{ background:var(--pink); } .gr-stat--lime{ background:var(--lime); }
        .gr-stat__lbl{ font-family:var(--fm); font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.12em; }
        .gr-stat__val{ font-family:var(--fd); font-size:clamp(38px,6cqw,56px); line-height:1; margin-top:10px; }
        .gr-stat__pct{ font-size:.55em; } .gr-stat__sub{ font-size:13px; margin-top:6px; color:var(--ink2); }

        /* race */
        .gr-race{ position:relative; overflow:hidden; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:28px; box-shadow:var(--sh-lg); padding:30px; margin-bottom:30px; }
        .gr-race__head{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:22px; }
        .gr-race__head h3{ font-family:var(--fd); font-size:22px; margin:0 0 6px; text-transform:uppercase; } .gr-race__head p{ margin:0; color:var(--ink2); font-size:14px; }
        .gr-race__bars{ display:grid; gap:16px; }
        .gr-rrow{ display:grid; grid-template-columns:200px 1fr 64px; gap:16px; align-items:center; background:none; border:0; padding:0; font-family:inherit; color:inherit; text-align:left; cursor:pointer; }
        .gr-rrow__name{ font-weight:700; font-size:15px; } .gr-rrow__name small{ display:block; font-family:var(--fm); font-size:11px; color:var(--ink2); text-transform:uppercase; letter-spacing:.12em; font-weight:600; }
        .gr-rrow__track{ height:30px; background:var(--cream2); border:2px solid var(--ink); border-radius:999px; overflow:hidden; background-image:repeating-linear-gradient(45deg,transparent 0 10px,rgba(0,0,0,.05) 10px 12px); }
        .gr-rrow__fill{ height:100%; border-right:2px solid var(--ink); background-image:repeating-linear-gradient(45deg,transparent 0 10px,rgba(255,255,255,.4) 10px 12px); transition:width .6s cubic-bezier(.16,1,.3,1); min-width:6px; }
        .gr-rrow__pct{ font-family:var(--fd); font-size:17px; text-align:right; }
        .gr-race__hidden{ position:absolute; inset:0; display:grid; place-items:center; gap:6px; background:rgba(255,241,229,.84); backdrop-filter:blur(6px); text-align:center; }
        .gr-race__hidden div{ font-family:var(--fd); font-size:clamp(22px,4cqw,30px); text-transform:uppercase; letter-spacing:.04em; }
        .gr-race__hidden span{ font-size:14px; font-weight:500; color:var(--ink2); }

        /* demographics */
        .gr-demo__head{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; }
        .gr-demo__grid{ display:grid; grid-template-columns:1fr 1fr; gap:20px; }
        .gr-card{ background:var(--paper); border:var(--bw) solid var(--ink); border-radius:22px; box-shadow:var(--sh); padding:22px 24px; }
        .gr-card--wide{ grid-column:1 / -1; }
        .gr-card h4{ font-family:var(--fd); font-size:16px; margin:0 0 16px; text-transform:uppercase; }
        .gr-bars{ display:flex; flex-direction:column; gap:12px; }
        .gr-bar{ display:grid; grid-template-columns:120px 1fr 56px; gap:12px; align-items:center; }
        .gr-bar__name{ font-size:13px; font-weight:600; }
        .gr-bar__track{ height:20px; background:var(--cream2); border:2px solid var(--ink); border-radius:999px; overflow:hidden; }
        .gr-bar__fill{ height:100%; border-right:2px solid var(--ink); }
        .gr-bar__val{ font-family:var(--fm); font-size:13px; font-weight:600; text-align:right; }
        .gr-demo__locked{ background:var(--cream2); border:2px dashed var(--ink); border-radius:18px; padding:26px; text-align:center; color:var(--ink2); font-weight:500; }

        .gr-footer{ margin-top:auto; border-top:var(--bw) solid var(--ink); padding:22px 32px; background:var(--ink); color:var(--cream); display:flex; align-items:center; justify-content:space-between; gap:16px; font-family:var(--fm); font-size:13px; flex-wrap:wrap; }
        .gr-footer__edition{ display:flex; gap:14px; align-items:center; } .gr-star{ color:var(--pink); font-size:18px; }

        /* RESPONSIVE */
        @container gr (max-width:900px){
          .gr-nav{ display:none; } .gr-word,.gr-div{ display:none; } .gr-topbar{ padding:12px 18px; }
          .gr-locked{ grid-template-columns:1fr; } .gr-stats{ grid-template-columns:1fr; } .gr-demo__grid{ grid-template-columns:1fr; }
          .gr-rrow{ grid-template-columns:120px 1fr 52px; gap:10px; }
        }
        @container gr (max-width:520px){
          .gr-page{ padding:28px 16px 52px; } .gr-bar{ grid-template-columns:84px 1fr 46px; }
          .gr-rrow{ grid-template-columns:90px 1fr 46px; } .gr-rrow__name{ font-size:13px; }
        }
      `}</style>
    </div>
  );
}
