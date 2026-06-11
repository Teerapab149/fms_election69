"use client";

// StudioDarkResults — the RESULTS (returns) page layout for the Studio Dark v2
// template. Rendered by /results when activeTemplateId === 'studio-dark'.
//
// Faithful to docs/design-refs/Studio Dark v2.html §05 "ledger board":
//   - ledger header: "The Returns, <SAMO 50>." + LIVE/FINAL pill
//   - LOCKED: board = "Who will win?" hero (single-party → "Yes or no?") +
//     editor's-note aside (why scores stay hidden) with the unlock countdown
//   - REVEALED: board = winner spotlight (name + share of votes; single-party →
//     รับรอง/ไม่รับรอง outcome)
//   - stat row: TOTAL VOTES / ELIGIBLE / TURNOUT
//   - race chart: hairline tracks; locked = placeholder widths + ??.?% behind a
//     blur veil (NO real ordering leaks); revealed = real %, sorted, winner row
//     accented
//   - turnout demographics (year / gender / major) as ledger-style hairline bars
//     — participation data only, never per-party scores.
//
// Pure presentation: results/page.js owns access control + data fetching.

import { useMemo } from "react";
import { Lock } from "lucide-react";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import StudioDarkShell from "./StudioDarkShell";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n);
// deterministic locked-state widths — same for every party order, no leak
const LOCK_WIDTHS = [56, 44, 28, 36, 22];

export default function StudioDarkResults({
  candidates = [],
  totalVotes = 0,
  demographics = {},
  finalStatus = "WAITING",
  isRevealed = false,
  isNotStarted = false,
  countdownText = "",
  onSelectParty = () => {},
  editorMode = false,
}) {
  const globalConfig = useGlobalConfig();
  const revealed = !!isRevealed;
  const ended = finalStatus === "ENDED";

  const totalEligible = demographics?.totalEligible || 0;
  const turnout = totalEligible > 0 ? ((totalVotes / totalEligible) * 100) : 0;

  const parties = candidates.filter((c) => parseInt(c.number) > 0);
  const singleParty = parties.length === 1;
  const disapprove = candidates.find((c) => parseInt(c.number) === -1);

  const pctOf = (c) => (totalVotes > 0 ? ((c?.score || 0) / totalVotes) * 100 : 0);
  const labelOf = (c) =>
    parseInt(c.number) > 0 ? c.name : (parseInt(c.number) === 0 ? "งดออกเสียง" : "ไม่รับรอง");
  const subOf = (c) =>
    parseInt(c.number) > 0 ? `PARTY № ${pad2(c.number)}` : (parseInt(c.number) === 0 ? "ABSTAIN" : "DISAPPROVE");

  // winner — multi: top-scoring party; single: รับรอง (party) vs ไม่รับรอง verdict
  const topScore = revealed ? Math.max(0, ...parties.map((p) => p.score || 0)) : -1;
  const winner = revealed && !singleParty && topScore > 0
    ? parties.find((p) => (p.score || 0) === topScore)
    : null;
  const approveWins = revealed && singleParty
    ? (parties[0]?.score || 0) >= (disapprove?.score || 0)
    : null;

  const raceRows = useMemo(() => {
    const rows = [...candidates];
    if (revealed) rows.sort((a, b) => (b.score || 0) - (a.score || 0));
    return rows;
  }, [candidates, revealed]);

  const clean = (arr) => (arr || []).filter((d) => d && d.name != null && String(d.name).trim() !== "");
  const demoGroups = [
    { title: "BY YEAR · ชั้นปี", rows: clean(demographics?.byYear) },
    { title: "BY GENDER · เพศ", rows: clean(demographics?.byGender) },
    { title: "BY MAJOR · สาขา", rows: clean(demographics?.byMajor) },
  ].filter((g) => g.rows.length > 0);

  const samo = `${globalConfig?.electionNamePrefix || "SAMO"} ${globalConfig?.electionNumber ?? ""}`.trim();
  const statusTxt = isNotStarted ? "POLLS NOT OPEN" : ended ? (revealed ? "FINAL RESULT" : "COUNTING") : "LIVE TALLY";

  return (
    <StudioDarkShell
      active="results"
      num="05"
      label="Returns"
      labelTh="ผลคะแนน"
      editorMode={editorMode}
      right={<span className={revealed ? "" : "live"}>{!revealed && <span className="sd-dot" />}{statusTxt}</span>}
    >
      <div className="sdr-ledger">
        {/* header */}
        <div className="sdr-h">
          <h1 className="sdr-title">The <em>Returns,</em><br />{samo}.</h1>
          <div className={`sdr-pill ${revealed ? "sdr-pill--final" : ""}`}>
            {!revealed && <span className="sd-dot" />}
            {revealed ? "FINAL · ผลอย่างเป็นทางการ" : isNotStarted ? "WAITING · ยังไม่เปิดหีบ" : "LIVE TALLY · กำลังนับ"}
          </div>
        </div>

        {/* board */}
        <div className="sdr-board">
          <div className="sdr-board__hero">
            <div className="sdr-kicker">
              <span className="dot" />
              {revealed ? "OFFICIAL RESULT · ผลการเลือกตั้ง" : isNotStarted ? "POLLS NOT OPEN · ยังไม่เปิดลงคะแนน" : "COUNTING IN PROGRESS · กำลังนับคะแนน"}
            </div>

            {revealed ? (
              singleParty ? (
                <>
                  <h2 className="sdr-board__title">{approveWins ? <>It&rsquo;s a <em>yes.</em></> : <>It&rsquo;s a <em>no.</em></>}</h2>
                  <p className="sdr-board__deck">
                    {approveWins
                      ? <>ผลการลงคะแนน <strong className="sdr-strong">รับรอง</strong> {parties[0]?.name} ด้วยคะแนน {fmt(parties[0]?.score || 0)} เสียง ({pctOf(parties[0]).toFixed(1)}%)</>
                      : <>ผลการลงคะแนน <strong className="sdr-strong">ไม่รับรอง</strong> ด้วยคะแนน {fmt(disapprove?.score || 0)} เสียง ({pctOf(disapprove).toFixed(1)}%)</>}
                  </p>
                </>
              ) : winner ? (
                <>
                  <h2 className="sdr-board__title sdr-board__title--name">{winner.name}<em>.</em></h2>
                  <p className="sdr-board__deck">
                    ชนะการเลือกตั้งด้วยคะแนน {fmt(winner.score || 0)} เสียง — <strong className="sdr-strong">{pctOf(winner).toFixed(1)}%</strong> ของผู้ลงคะแนนทั้งหมด
                  </p>
                </>
              ) : (
                <>
                  <h2 className="sdr-board__title">The <em>returns.</em></h2>
                  <p className="sdr-board__deck">ผลคะแนนอย่างเป็นทางการแสดงอยู่ด้านล่าง</p>
                </>
              )
            ) : (
              <>
                <h2 className="sdr-board__title">{singleParty ? <>Yes or <em>no?</em></> : <>Who will <em>win?</em></>}</h2>
                <p className="sdr-board__deck">
                  เพื่อรักษาความเป็นกลาง ผลคะแนน{singleParty ? "" : "รายพรรค"}ยังถูกปิดไว้ — การประกาศจะเกิดขึ้นเมื่อปิดหีบเลือกตั้งแล้วเท่านั้น
                </p>
              </>
            )}
          </div>

          <div className="sdr-board__aside">
            {revealed ? (
              <>
                <div className="sdr-aside__kicker">§ THE NUMBERS</div>
                <h3>นับครบ <em>ทุกเสียง.</em></h3>
                <p>คะแนนทั้งหมด {fmt(totalVotes)} เสียง จากผู้มีสิทธิ์ {fmt(totalEligible)} คน คิดเป็นสัดส่วนผู้ใช้สิทธิ์ {turnout.toFixed(2)}%</p>
              </>
            ) : (
              <>
                <div className="sdr-aside__kicker">§ EDITOR&rsquo;S NOTE</div>
                <h3>การประกาศจะเกิด<br />เมื่อ <em>ปิดหีบ.</em></h3>
                <p>ระหว่างการลงคะแนน เราเลือกที่จะไม่แสดง{singleParty ? "ผลรับรอง" : "พรรคที่กำลังนำ"} — เพื่อไม่ให้ตัวเลขมีอิทธิพลต่อการตัดสินใจของผู้ที่ยังไม่ได้ลงคะแนน</p>
                {countdownText && <div className="sdr-aside__cd">{countdownText}</div>}
              </>
            )}
          </div>
        </div>

        {/* stat row */}
        <div className="sdr-stats">
          <div className="sdr-stat">
            <div className="sdr-stat__lbl">TOTAL VOTES <em>i.</em></div>
            <div className="sdr-stat__val">{fmt(totalVotes)}</div>
            <div className="sdr-stat__sub">นับสะสมตั้งแต่เปิดหีบเลือกตั้ง</div>
          </div>
          <div className="sdr-stat">
            <div className="sdr-stat__lbl">ELIGIBLE <em>ii.</em></div>
            <div className="sdr-stat__val">{fmt(totalEligible)}</div>
            <div className="sdr-stat__sub">นักศึกษาผู้มีสิทธิ์เลือกตั้ง</div>
          </div>
          <div className="sdr-stat">
            <div className="sdr-stat__lbl">TURNOUT <em>iii.</em></div>
            <div className="sdr-stat__val">{turnout.toFixed(2)}<small>%</small></div>
            <div className="sdr-stat__sub">สัดส่วนผู้ใช้สิทธิ์ · อัปเดตเรียลไทม์</div>
          </div>
        </div>

        {/* race */}
        <div className="sdr-race">
          <div className="sdr-race__head">
            <h3>Vote distribution <em>{singleParty ? "yes / no." : "by party."}</em></h3>
            <span className="sd-smallcaps">{revealed ? "§ OFFICIAL" : "§ EMBARGOED"}</span>
          </div>
          <div className="sdr-race__bars">
            {raceRows.map((c, i) => {
              const isWin = revealed && (winner ? c === winner : (singleParty && approveWins != null && (approveWins ? c === parties[0] : c === disapprove)));
              const w = revealed ? Math.max(pctOf(c), c.score > 0 ? 2 : 0) : LOCK_WIDTHS[i % LOCK_WIDTHS.length];
              return (
                <div
                  className={`sdr-race__row ${isWin ? "is-winner" : ""}`}
                  key={c.id || i}
                  onClick={() => { if (revealed && parseInt(c.number) > 0) onSelectParty(c); }}
                  style={revealed && parseInt(c.number) > 0 ? { cursor: "pointer" } : undefined}
                >
                  <div className="sdr-race__name">
                    {labelOf(c)}{isWin && <span className="sdr-win-tag">WINNER</span>}
                    <small>{subOf(c)}</small>
                  </div>
                  <div className="sdr-race__track"><div className={`sdr-race__fill ${revealed ? "is-real" : ""}`} style={{ width: `${w}%` }} /></div>
                  <div className="sdr-race__pct">{revealed ? `${pctOf(c).toFixed(1)}%` : "??.?%"}</div>
                </div>
              );
            })}
          </div>
          {!revealed && (
            <div className="sdr-veil">
              <div>
                <div className="sdr-veil__lock"><Lock size={20} strokeWidth={2} /></div>
                <h4>Embargoed until <em>polls close.</em></h4>
                <p>ผลคะแนน{singleParty ? "" : "รายพรรค"}จะปรากฏที่นี่ทันทีเมื่อปิดหีบเลือกตั้ง</p>
              </div>
            </div>
          )}
        </div>

        {/* turnout demographics (participation only — no per-party scores) */}
        {demoGroups.length > 0 && (
          <div className="sdr-demo">
            <div className="sdr-race__head">
              <h3>Turnout <em>demographics.</em></h3>
              <span className="sd-smallcaps">§ PARTICIPATION</span>
            </div>
            <div className="sdr-demo__grid">
              {demoGroups.map((g) => {
                const max = Math.max(1, ...g.rows.map((r) => r.value || 0));
                return (
                  <div className="sdr-demo__col" key={g.title}>
                    <div className="sdr-demo__title">{g.title}</div>
                    {g.rows.map((r, i) => (
                      <div className="sdr-demo__row" key={i}>
                        <div className="sdr-demo__name">{r.name}</div>
                        <div className="sdr-demo__track"><div className="sdr-demo__fill" style={{ width: `${((r.value || 0) / max) * 100}%` }} /></div>
                        <div className="sdr-demo__val">{fmt(r.value || 0)}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .sdr-strong { color:var(--sd-accent); font-weight:500; }

        .sdr-ledger { padding:40px 48px 64px; flex:1; }
        .sdr-h {
          display:grid; grid-template-columns:1fr auto; gap:32px; align-items:end;
          padding-bottom:28px; border-bottom:1px solid var(--sd-line); margin-bottom:32px;
        }
        .sdr-title { font-family:var(--sd-sans); font-weight:400; font-size:clamp(44px,6vw,88px); letter-spacing:-.04em; line-height:.95; margin:0; }
        .sdr-pill {
          font-family:var(--sd-mono); font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--sd-accent);
          display:flex; align-items:center; gap:10px; padding:10px 18px;
          border:1px solid rgba(213,255,63,.3); border-radius:999px; background:rgba(213,255,63,.06); white-space:nowrap;
        }
        .sdr-pill--final { color:var(--sd-bg); background:var(--sd-accent); border-color:var(--sd-accent); }

        /* board */
        .sdr-board {
          display:grid; grid-template-columns:1.4fr 1fr; border:1px solid var(--sd-line);
          border-radius:22px; background:var(--sd-bg-2); margin-bottom:32px; overflow:hidden;
        }
        .sdr-board__hero { padding:48px; border-right:1px solid var(--sd-line); }
        .sdr-kicker {
          font-family:var(--sd-mono); font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--sd-ink-3);
          display:flex; align-items:center; gap:10px; margin-bottom:26px;
        }
        .sdr-kicker .dot { width:8px; height:8px; border-radius:999px; background:var(--sd-accent); animation:sdDotPulse 1.8s ease-out infinite; }
        .sdr-board__title { font-family:var(--sd-sans); font-weight:400; font-size:clamp(52px,7vw,110px); line-height:.9; letter-spacing:-.05em; margin:0 0 22px; }
        .sdr-board__title--name { font-size:clamp(36px,4.6vw,72px); line-height:1; }
        .sdr-board__deck { font-size:16px; color:var(--sd-ink-2); line-height:1.55; max-width:460px; margin:0; font-weight:300; }

        .sdr-board__aside { padding:48px; background:radial-gradient(circle at 80% 90%, rgba(213,255,63,.05) 0, transparent 50%), var(--sd-bg-3); }
        .sdr-aside__kicker { font-family:var(--sd-mono); font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--sd-accent); margin-bottom:14px; }
        .sdr-board__aside h3 { font-family:var(--sd-sans); font-weight:400; font-size:25px; line-height:1.18; letter-spacing:-.02em; margin:0 0 14px; color:var(--sd-ink); }
        .sdr-board__aside p { color:var(--sd-ink-2); font-size:14px; line-height:1.55; margin:0; font-weight:300; }
        .sdr-aside__cd {
          margin-top:24px; padding-top:16px; border-top:1px solid var(--sd-line);
          font-family:var(--sd-mono); font-size:13px; letter-spacing:.08em; color:var(--sd-ink); font-variant-numeric:tabular-nums;
        }

        /* stats */
        .sdr-stats { display:grid; grid-template-columns:repeat(3,1fr); border:1px solid var(--sd-line); border-radius:18px; background:var(--sd-bg-2); overflow:hidden; margin-bottom:32px; }
        .sdr-stat { padding:26px 28px; border-right:1px solid var(--sd-line); }
        .sdr-stat:last-child { border-right:0; }
        .sdr-stat__lbl { font-family:var(--sd-mono); font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--sd-ink-3); display:flex; justify-content:space-between; align-items:center; }
        .sdr-stat__lbl em { font-size:17px; letter-spacing:0; text-transform:none; }
        .sdr-stat__val { font-family:var(--sd-sans); font-weight:400; font-size:clamp(40px,4.6vw,60px); letter-spacing:-.04em; line-height:1; margin:16px 0 8px; font-variant-numeric:tabular-nums; color:var(--sd-ink); }
        .sdr-stat__val small { font-size:18px; color:var(--sd-ink-3); margin-left:4px; }
        .sdr-stat__sub { font-size:13px; color:var(--sd-ink-3); font-weight:300; }

        /* race */
        .sdr-race { background:var(--sd-bg-2); border:1px solid var(--sd-line); border-radius:22px; padding:32px; position:relative; overflow:hidden; }
        .sdr-race__head { display:flex; justify-content:space-between; align-items:baseline; gap:16px; padding-bottom:20px; border-bottom:1px solid var(--sd-line); margin-bottom:24px; }
        .sdr-race__head h3 { font-family:var(--sd-sans); font-weight:400; font-size:24px; letter-spacing:-.025em; margin:0; color:var(--sd-ink); }
        .sdr-race__bars { display:grid; gap:22px; padding-top:6px; }
        .sdr-race__row { display:grid; grid-template-columns:240px 1fr 80px; gap:24px; align-items:center; }
        .sdr-race__name { font-family:var(--sd-sans); font-size:16px; color:var(--sd-ink); font-weight:500; min-width:0; }
        .sdr-race__name small { display:block; font-family:var(--sd-mono); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--sd-ink-3); font-weight:400; margin-top:3px; }
        .sdr-win-tag {
          margin-left:10px; font-family:var(--sd-mono); font-size:9px; letter-spacing:.18em;
          background:var(--sd-accent); color:var(--sd-bg); border-radius:999px; padding:3px 9px; vertical-align:middle;
        }
        .sdr-race__track { height:10px; background:var(--sd-bg); border:1px solid var(--sd-line); border-radius:999px; overflow:hidden; }
        .sdr-race__fill { height:100%; background:var(--sd-accent); opacity:.35; transition:width .6s ease-out; }
        .sdr-race__fill.is-real { opacity:1; }
        .sdr-race__row.is-winner .sdr-race__fill { box-shadow:0 0 12px rgba(213,255,63,.5); }
        .sdr-race__pct { font-family:var(--sd-mono); font-size:14px; color:var(--sd-ink-2); text-align:right; font-variant-numeric:tabular-nums; }

        .sdr-veil {
          position:absolute; inset:84px 0 0 0; background:rgba(27,27,20,.9); backdrop-filter:blur(8px);
          display:grid; place-items:center; text-align:center; padding:0 24px;
        }
        .sdr-veil__lock {
          width:44px; height:44px; border:1px solid var(--sd-line-strong); border-radius:999px;
          display:grid; place-items:center; color:var(--sd-accent); margin:0 auto 16px;
        }
        .sdr-veil h4 { font-family:var(--sd-sans); font-weight:400; font-size:26px; letter-spacing:-.025em; margin:0 0 8px; color:var(--sd-ink); }
        .sdr-veil p { font-size:14px; color:var(--sd-ink-2); max-width:380px; margin:0; font-weight:300; }

        /* demographics */
        .sdr-demo { background:var(--sd-bg-2); border:1px solid var(--sd-line); border-radius:22px; padding:32px; margin-top:32px; }
        .sdr-demo__grid { display:grid; grid-template-columns:repeat(3,1fr); gap:40px; }
        .sdr-demo__col { min-width:0; }
        .sdr-demo__title { font-family:var(--sd-mono); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--sd-ink-3); margin-bottom:16px; }
        .sdr-demo__row { display:grid; grid-template-columns:minmax(64px,auto) 1fr auto; gap:12px; align-items:center; margin-bottom:12px; }
        .sdr-demo__name { font-size:13px; color:var(--sd-ink-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .sdr-demo__track { height:6px; background:var(--sd-bg); border:1px solid var(--sd-line); border-radius:999px; overflow:hidden; }
        .sdr-demo__fill { height:100%; background:var(--sd-accent); opacity:.7; }
        .sdr-demo__val { font-family:var(--sd-mono); font-size:12px; color:var(--sd-ink-2); font-variant-numeric:tabular-nums; }

        @media (max-width:1100px) {
          .sdr-ledger { padding:28px 24px 48px; }
          .sdr-h { grid-template-columns:1fr; gap:16px; align-items:start; }
          .sdr-pill { justify-self:start; }
          .sdr-board { grid-template-columns:1fr; }
          .sdr-board__hero { border-right:0; border-bottom:1px solid var(--sd-line); padding:32px 24px; }
          .sdr-board__aside { padding:32px 24px; }
          .sdr-stats { grid-template-columns:1fr; }
          .sdr-stat { border-right:0; border-bottom:1px solid var(--sd-line); }
          .sdr-stat:last-child { border-bottom:0; }
          .sdr-race { padding:24px 18px; }
          .sdr-race__row { grid-template-columns:130px 1fr 56px; gap:12px; }
          .sdr-race__name { font-size:14px; }
          .sdr-demo { padding:24px 18px; }
          .sdr-demo__grid { grid-template-columns:1fr; gap:28px; }
          .sdr-veil { inset:76px 0 0 0; }
        }
      `}</style>
    </StudioDarkShell>
  );
}
