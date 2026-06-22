"use client";

// VerdureResults — RETURNS (results) for the Verdure template. Faithful to
// docs/design-refs/verdure.css §returns: a big moss disc (orbited by TOTAL VOTES
// / TURNOUT / ELIGIBLE stat cards) showing a locked "Who will win?" (single →
// "Yes or no?") with the unlock countdown, then a race chart that stays EMBARGOED
// (placeholder widths + ??.?% behind a veil, no ordering leak) until reveal, when
// it shows real sorted %, the winner row, and turnout demographics.
//
// The embargo logic is ported verbatim — hidden results must never leak a score
// or ordering. Pure presentation; results/page.js owns access + data.

import { useMemo } from "react";
import { Lock } from "lucide-react";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import VerdureShell from "./VerdureShell";
import { verdureMeta } from "../home/VerdureChrome";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n);
const LOCK_WIDTHS = [56, 44, 28, 36, 22];

export default function VerdureResults({
  candidates = [], totalVotes = 0, demographics = {}, finalStatus = "WAITING",
  isRevealed = false, isNotStarted = false, countdownText = "", onSelectParty = () => {}, editorMode = false,
}) {
  const gc = useGlobalConfig();
  const meta = verdureMeta(gc);
  const revealed = !!isRevealed;
  const ended = finalStatus === "ENDED";

  const totalEligible = demographics?.totalEligible || 0;
  const turnout = totalEligible > 0 ? ((totalVotes / totalEligible) * 100) : 0;

  const parties = candidates.filter((c) => parseInt(c.number) > 0);
  const singleParty = parties.length === 1;
  const disapprove = candidates.find((c) => parseInt(c.number) === -1);

  const pctOf = (c) => (totalVotes > 0 ? ((c?.score || 0) / totalVotes) * 100 : 0);
  const labelOf = (c) => parseInt(c.number) > 0 ? c.name : (parseInt(c.number) === 0 ? "งดออกเสียง" : "ไม่รับรอง");
  const subOf = (c) => parseInt(c.number) > 0 ? `PARTY No. ${pad2(c.number)}` : (parseInt(c.number) === 0 ? "ABSTAIN" : "DISAPPROVE");

  const topScore = revealed ? Math.max(0, ...parties.map((p) => p.score || 0)) : -1;
  const winner = revealed && !singleParty && topScore > 0 ? parties.find((p) => (p.score || 0) === topScore) : null;
  const approveWins = revealed && singleParty ? (parties[0]?.score || 0) >= (disapprove?.score || 0) : null;

  const raceRows = useMemo(() => { const r = [...candidates]; if (revealed) r.sort((a, b) => (b.score || 0) - (a.score || 0)); return r; }, [candidates, revealed]);

  const clean = (arr) => (arr || []).filter((d) => d && d.name != null && String(d.name).trim() !== "");
  const demoGroups = [
    { title: "BY YEAR · ชั้นปี", rows: clean(demographics?.byYear) },
    { title: "BY GENDER · เพศ", rows: clean(demographics?.byGender) },
    { title: "BY MAJOR · สาขา", rows: clean(demographics?.byMajor) },
  ].filter((g) => g.rows.length > 0);

  const statusTxt = isNotStarted ? "POLLS NOT OPEN" : ended ? (revealed ? "FINAL" : "COUNTING") : "LIVE";

  return (
    <VerdureShell active="results" editorMode={editorMode}
      edge={{ num: "05", label: "Returns", th: "ผลคะแนน", right: true }}
      cornermarkTitle="Returns" cornermarkSub={revealed ? "Final result" : "Live tally · embargoed"}
      statusChip={<div className="vd-chip-live"><span className="dot" /> {revealed ? "RESULT" : "COUNTING"} · <strong>{statusTxt}</strong></div>}>
      <div className="vd-returns">
        <div className="vd-returns__h">
          <div className="vd-returns__kicker">NO. 05 · {revealed ? "FINAL RESULT" : "LIVE RETURNS"}</div>
          <h1 className="vd-returns__title">The <em>Returns.</em></h1>
        </div>

        <div className="vd-stage">
          <div className="vd-rdisc">
            {revealed ? (
              <>
                <div className="vd-rdisc__kicker">{singleParty ? "OFFICIAL VERDICT · ผลรับรอง" : "THE WINNER · ผู้ชนะ"}</div>
                <div className="vd-rdisc__name">
                  {singleParty ? (approveWins ? "รับรอง" : "ไม่รับรอง") : (winner ? winner.name : "—")}
                </div>
                <div className="vd-rdisc__pct">
                  {singleParty
                    ? <>{fmt((approveWins ? parties[0] : disapprove)?.score || 0)} เสียง · {pctOf(approveWins ? parties[0] : disapprove).toFixed(1)}%</>
                    : (winner ? <>{fmt(winner.score || 0)} เสียง · {pctOf(winner).toFixed(1)}% ของคะแนน</> : "")}
                </div>
              </>
            ) : (
              <>
                <div className="vd-rdisc__lock"><Lock size={22} strokeWidth={2} /></div>
                <div className="vd-rdisc__title">{singleParty ? <>Yes or <em>no?</em></> : <>Who will <em>win?</em></>}</div>
                <p className="vd-rdisc__deck">ผลคะแนน{singleParty ? "" : "รายพรรค"}จะถูกปลดล็อกเมื่อปิดหีบเลือกตั้งเท่านั้น</p>
                {countdownText && <div className="vd-rdisc__cd">CLOSES IN <strong className="vd-tabular">{countdownText}</strong></div>}
              </>
            )}
          </div>
        </div>

        <div className="vd-rstats">
          <div className="vd-rstat"><div className="lbl">TOTAL VOTES · คะแนนรวม</div><div className="val vd-tabular"><em>{fmt(totalVotes)}</em></div></div>
          <div className="vd-rstat"><div className="lbl">TURNOUT · สัดส่วน</div><div className="val vd-tabular">{turnout.toFixed(2)}<small>%</small></div></div>
          <div className="vd-rstat"><div className="lbl">ELIGIBLE · ผู้มีสิทธิ์</div><div className="val vd-tabular">{fmt(totalEligible)}<small>คน</small></div></div>
        </div>

        <div className="vd-race">
          <div className="vd-race__head">
            <h3>Vote distribution <em>{singleParty ? "yes / no." : "by party."}</em></h3>
            <span className="vd-smallcaps" style={{ color: "var(--terra)" }}>{revealed ? "§ OFFICIAL" : "§ EMBARGOED"}</span>
          </div>
          <div className="vd-race__bars">
            {raceRows.map((c, i) => {
              const isWin = revealed && (winner ? c === winner : (singleParty && approveWins != null && (approveWins ? c === parties[0] : c === disapprove)));
              const w = revealed ? Math.max(pctOf(c), c.score > 0 ? 2 : 0) : LOCK_WIDTHS[i % LOCK_WIDTHS.length];
              return (
                <div className={`vd-race__row ${isWin ? "is-win" : ""}`} key={c.id || i}
                  onClick={() => { if (revealed && parseInt(c.number) > 0) onSelectParty(c); }}
                  style={revealed && parseInt(c.number) > 0 ? { cursor: "pointer" } : undefined}>
                  <div className="vd-race__name">{labelOf(c)}{isWin && <span className="vd-race__tag">WINNER</span>}<small>{subOf(c)}</small></div>
                  <div className="vd-race__track"><div className={`vd-race__fill ${revealed ? "real" : ""}`} style={{ width: `${w}%` }} /></div>
                  <div className="vd-race__pct">{revealed ? `${pctOf(c).toFixed(1)}%` : "??.?%"}</div>
                </div>
              );
            })}
          </div>
          {!revealed && (
            <div className="vd-race__veil">
              <div>
                <h4>Embargoed until <em>polls close.</em></h4>
                <p>ผลคะแนน{singleParty ? "" : "รายพรรค"}จะปรากฏที่นี่ทันทีเมื่อปิดหีบเลือกตั้ง</p>
              </div>
            </div>
          )}
        </div>

        {(!revealed || demoGroups.length > 0) && (
          <div className="vd-demo">
            <div className="vd-race__head">
              <h3>Turnout <em>demographics.</em></h3>
              <span className="vd-smallcaps" style={{ color: "var(--terra)" }}>{revealed ? "§ PARTICIPATION" : "§ EMBARGOED"}</span>
            </div>
            {revealed ? (
              <div className="vd-demo__grid">
                {demoGroups.map((g) => {
                  const max = Math.max(1, ...g.rows.map((r) => r.value || 0));
                  return (
                    <div className="vd-demo__col" key={g.title}>
                      <div className="vd-demo__title">{g.title}</div>
                      {g.rows.map((r, i) => (
                        <div className="vd-demo__row" key={i}>
                          <div className="vd-demo__name">{r.name}</div>
                          <div className="vd-demo__track"><div className="vd-demo__fill" style={{ width: `${((r.value || 0) / max) * 100}%` }} /></div>
                          <div className="vd-demo__val vd-tabular">{fmt(r.value || 0)}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="vd-demo__locked"><Lock size={18} strokeWidth={2} /><p>สถิติผู้ใช้สิทธิ์รายชั้นปี · เพศ · สาขา จะเปิดเผยพร้อมผลคะแนน เมื่อปิดหีบเลือกตั้งแล้วเท่านั้น</p></div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        .vd-returns { flex:1; padding:96px 80px 150px; max-width:1320px; margin:0 auto; width:100%; position:relative; z-index:1; }
        .vd-returns__h { text-align:center; margin-bottom:48px; }
        .vd-returns__kicker { font-family:var(--fm); font-size:11px; letter-spacing:.25em; text-transform:uppercase; color:var(--terra); margin-bottom:18px; }
        .vd-returns__title { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(52px,7vw,96px); line-height:.96; letter-spacing:-.015em; margin:0; color:var(--moss); }
        .vd-returns__title em { color:var(--terra); }

        /* result seal — moderate size, content fits inside; clean centred stat row
           below it (no more scattered/tilted orbital cards) */
        .vd-stage { display:grid; place-items:center; margin:4px 0 0; }
        .vd-rdisc { width:clamp(300px,40vw,430px); height:clamp(300px,40vw,430px); border-radius:50%; background:radial-gradient(125% 125% at 32% 24%, #305041 0%, #1F3A2C 58%); color:var(--cream); display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; text-align:center; padding:0 13%; box-shadow:0 50px 70px -40px rgba(31,58,44,.5), inset 0 3px 12px rgba(244,236,219,.06); }
        .vd-rdisc::before { content:""; position:absolute; inset:14px; border:1px dashed rgba(244,236,219,.22); border-radius:50%; }
        .vd-rdisc::after { content:""; position:absolute; inset:-26px; border:1px dashed rgba(188,94,62,.4); border-radius:50%; }
        .vd-rdisc__kicker { font-family:var(--fm); font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:var(--terra-soft); margin-bottom:16px; }
        .vd-rdisc__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(30px,3.6vw,50px); line-height:1.04; letter-spacing:-.02em; color:var(--cream); }
        .vd-rdisc__pct { font-family:var(--fm); font-size:12px; letter-spacing:.12em; color:var(--terra-soft); margin-top:16px; }
        .vd-rdisc__lock { width:54px; height:54px; border-radius:50%; background:var(--terra); color:var(--cream); display:grid; place-items:center; margin-bottom:20px; }
        .vd-rdisc__title { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(44px,6vw,84px); line-height:.92; letter-spacing:-.03em; color:var(--cream); margin:0; }
        .vd-rdisc__title em { color:var(--terra-soft); }
        .vd-rdisc__deck { font-family:var(--ft); font-size:14px; color:rgba(244,236,219,.72); line-height:1.5; max-width:280px; margin:16px auto 0; }
        .vd-rdisc__cd { margin-top:18px; font-family:var(--fm); font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:rgba(244,236,219,.65); }
        .vd-rdisc__cd strong { font-family:var(--fd); font-style:italic; font-size:20px; font-weight:400; color:var(--cream); letter-spacing:-.02em; margin-left:8px; text-transform:none; }

        .vd-rstats { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:36px; }
        .vd-rstat { padding:24px 28px; background:var(--cream-2); border:1px solid var(--rule); border-radius:22px; text-align:center; }
        .vd-rstat .lbl { font-family:var(--fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--moss); opacity:.55; margin-bottom:10px; }
        .vd-rstat .val { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(34px,3.6vw,46px); line-height:1; letter-spacing:-.02em; color:var(--moss); }
        .vd-rstat .val em { color:var(--terra); }
        .vd-rstat .val small { font-family:var(--fs); font-style:normal; font-size:13px; opacity:.5; margin-left:5px; letter-spacing:0; }

        .vd-race, .vd-demo { background:var(--cream-2); border:1px solid var(--rule); border-radius:28px; padding:36px; position:relative; overflow:hidden; }
        .vd-race { margin-top:40px; }
        .vd-demo { margin-top:24px; }
        .vd-race__head { display:flex; justify-content:space-between; align-items:baseline; padding-bottom:22px; border-bottom:1px solid var(--rule); margin-bottom:26px; }
        .vd-race__head h3 { font-family:var(--fd); font-style:italic; font-weight:400; font-size:30px; letter-spacing:-.015em; margin:0; color:var(--moss); }
        .vd-race__head h3 em { color:var(--terra); }
        .vd-race__bars { display:grid; gap:22px; padding-top:4px; }
        .vd-race__row { display:grid; grid-template-columns:260px 1fr 80px; gap:24px; align-items:center; }
        .vd-race__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:20px; letter-spacing:-.005em; color:var(--moss); }
        .vd-race__name small { display:block; font-family:var(--fm); font-style:normal; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--moss); opacity:.55; margin-top:2px; }
        .vd-race__tag { margin-left:10px; font-family:var(--fm); font-size:9px; letter-spacing:.14em; background:var(--terra); color:var(--cream); border-radius:999px; padding:3px 9px; vertical-align:middle; text-transform:uppercase; }
        .vd-race__track { height:10px; background:var(--cream-3); border:1px solid var(--rule); border-radius:999px; overflow:hidden; }
        .vd-race__fill { height:100%; background:var(--terra); opacity:.4; background-image:repeating-linear-gradient(45deg, rgba(255,255,255,0) 0 6px, rgba(255,255,255,.18) 6px 7px); transition:width .6s ease-out; }
        .vd-race__fill.real { opacity:1; }
        .vd-race__pct { font-family:var(--fm); font-size:14px; color:var(--moss); opacity:.55; text-align:right; }
        .vd-race__veil { position:absolute; inset:92px 0 0 0; background:rgba(244,236,219,.95); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); display:grid; place-items:center; text-align:center; padding:0 24px; }
        .vd-race__veil h4 { font-family:var(--fd); font-style:italic; font-weight:400; font-size:32px; letter-spacing:-.015em; margin:0 0 8px; color:var(--moss); }
        .vd-race__veil h4 em { color:var(--terra); }
        .vd-race__veil p { font-family:var(--ft); font-size:15px; color:var(--moss); opacity:.75; max-width:380px; margin:0; }

        .vd-demo__grid { display:grid; grid-template-columns:repeat(3,1fr); gap:36px; }
        .vd-demo__title { font-family:var(--fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--moss); opacity:.55; margin-bottom:16px; }
        .vd-demo__row { display:grid; grid-template-columns:minmax(60px,auto) 1fr auto; gap:12px; align-items:center; margin-bottom:12px; }
        .vd-demo__name { font-family:var(--ft); font-size:13px; color:var(--moss); opacity:.8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .vd-demo__track { height:7px; background:var(--cream-3); border:1px solid var(--rule); border-radius:999px; overflow:hidden; }
        .vd-demo__fill { height:100%; background:var(--terra); opacity:.65; }
        .vd-demo__val { font-family:var(--fm); font-size:12px; color:var(--moss); opacity:.6; }
        .vd-demo__locked { display:flex; align-items:center; gap:16px; color:var(--moss); }
        .vd-demo__locked p { font-family:var(--ft); font-size:14px; opacity:.75; margin:0; line-height:1.5; }

        @media (max-width:1100px) {
          .vd-returns { padding:92px 24px 130px; }
          .vd-race__row { grid-template-columns:130px 1fr 56px; gap:12px; }
          .vd-race__name { font-size:16px; }
          .vd-demo__grid { grid-template-columns:1fr; gap:24px; }
          .vd-race__veil { inset:80px 0 0 0; }
        }
        @media (max-width:640px) {
          .vd-rstats { grid-template-columns:1fr; }
        }
      `}</style>
    </VerdureShell>
  );
}
