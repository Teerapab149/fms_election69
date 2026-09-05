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

import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import VerdureShell from "./VerdureShell";
import { verdureMeta } from "../home/VerdureChrome";
import { resolveVerdict } from "../../utils/electionVerdict";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n);
const LOCK_WIDTHS = [56, 44, 28, 36, 22];

// ── reveal ceremony: count-up (vd-B1B) ───────────────────────────────────────
// SSR-safe by construction: the INITIAL state is the FINAL value, so server
// HTML + no-JS + pre-hydration paint all show the real number. Only after
// hydration does the effect restart the number from 0 and ease it up (~1s).
// prefers-reduced-motion → snap to final, no animation. Used ONLY inside
// revealed branches — embargoed numbers stay the literal "??.?%" string.
function useCountUp(target, duration = 1000) {
  const [val, setVal] = useState(target);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) { setVal(target); return undefined; }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setVal(target * (1 - Math.pow(1 - p, 3))); // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// row percent (revealed only) — counts 0→pct after hydration, final value otherwise
function RevealPct({ value }) {
  const v = useCountUp(value);
  return <>{v.toFixed(1)}%</>;
}

// winner-disc score line (revealed only) — votes + share count up together
function RevealScoreLine({ score, pct, suffix = "" }) {
  const s = useCountUp(score);
  const p = useCountUp(pct);
  // segments are each nowrap so the ONLY break point is the "·" separator (two
  // centred lines if the disc is too narrow — never an orphaned Thai word); the
  // Thai runs get the Plex reset so "เสียง"/"ของคะแนน" render with correct marks
  return (
    <>
      <span className="vd-nw">{fmt(Math.round(s))} <span className="vd-thai">เสียง</span></span>
      {" · "}
      <span className="vd-nw">{p.toFixed(1)}%{suffix ? <> <span className="vd-thai">{suffix.trim()}</span></> : null}</span>
    </>
  );
}

export default function VerdureResults({
  candidates = [], totalVotes = 0, demographics = {}, finalStatus = "WAITING",
  isRevealed = false, isNotStarted = false, countdownText = "", editorMode = false,
}) {
  const gc = useGlobalConfig();
  const meta = verdureMeta(gc);
  const revealed = !!isRevealed;
  const ended = finalStatus === "ENDED";

  const totalEligible = demographics?.totalEligible || 0;
  const turnout = totalEligible > 0 ? ((totalVotes / totalEligible) * 100) : 0;

  // ผลตัดสินมาจาก resolveVerdict() ที่เดียว — ห้ามคำนวณเองในไฟล์ธีม
  const verdict = resolveVerdict(candidates, { revealed });
  const parties = verdict.parties;
  const singleParty = verdict.mode === "single";
  const disapprove = verdict.disapprove;

  const pctOf = (c) => (totalVotes > 0 ? ((c?.score || 0) / totalVotes) * 100 : 0);
  const labelOf = (c) => parseInt(c.number) > 0 ? c.name : (parseInt(c.number) === 0 ? "งดออกเสียง" : "ไม่รับรอง");
  const subOf = (c) => parseInt(c.number) > 0 ? `PARTY No. ${pad2(c.number)}` : (parseInt(c.number) === 0 ? "ABSTAIN" : "DISAPPROVE");

  // ของเดิม: `(parties[0].score||0) >= (disapprove.score||0)` — `>=` ทำให้เสมอกันนับเป็น
  // รับรอง และไม่มีด่านคะแนน 0 เลย ทุกฝ่าย 0 เสียงจึงประกาศ "รับรอง" ทั้งที่ยังไม่มีใครโหวต
  const winner = verdict.winner;
  const approveWins = singleParty ? verdict.approved : null;      // null = ตัดสินไม่ได้
  const undecided = revealed && (verdict.outcome === "tie" || verdict.outcome === "no-votes");
  const undecidedNote = verdict.outcome === "tie"
    ? "คะแนนสูงสุดเสมอกัน รอคณะกรรมการชี้ขาด"
    : "ยังไม่มีคะแนนในระบบ";

  // Winner label + a LENGTH-TIERED type size for it. Party names are admin-typed and
  // unbounded — the live 2569 roster has a 43-character one — so a single fixed size
  // cannot serve both "พรรคก้าวหน้า" and "พรรคพลังนักศึกษาวิทยาการจัดการเพื่อการพัฒนา"
  // inside a circle. Derived from the string (no measurement, no effect) so SSR, the
  // pre-hydration paint and the client all agree, and names up to 27 characters keep
  // the ORIGINAL clamp untouched — the disc is byte-identical for every name that
  // already fit. Longer names step down one/two notches so the whole label still lands
  // inside the inner dashed ring.
  const winnerLabel = undecided
    ? (verdict.outcome === "tie" ? "เสมอกัน" : "ยังไม่มีผล")
    : singleParty ? (approveWins ? "รับรอง" : "ไม่รับรอง") : (winner ? winner.name : "—");
  const winnerNameSize = winnerLabel.length >= 40 ? "clamp(23px,2.6vw,33px)"
    : winnerLabel.length >= 28 ? "clamp(26px,3.0vw,38px)"
    : null;

  const raceRows = useMemo(() => { const r = [...candidates]; if (revealed) r.sort((a, b) => (b.score || 0) - (a.score || 0)); return r; }, [candidates, revealed]);

  const clean = (arr) => (arr || []).filter((d) => d && d.name != null && String(d.name).trim() !== "");
  const demoGroups = [
    { en: "BY YEAR", th: "ชั้นปี", rows: clean(demographics?.byYear) },
    { en: "BY GENDER", th: "เพศ", rows: clean(demographics?.byGender) },
    { en: "BY MAJOR", th: "สาขา", rows: clean(demographics?.byMajor) },
  ].filter((g) => g.rows.length > 0);

  const statusTxt = isNotStarted ? "POLLS NOT OPEN" : ended ? (revealed ? "FINAL" : "COUNTING") : "LIVE";

  return (
    <VerdureShell active="results" editorMode={editorMode}
      edge={{ num: "05", label: "Returns", th: "ผลคะแนน", right: true }}
      cornermarkTitle="Returns" cornermarkSub={revealed ? "Final result" : "Live tally · embargoed"}
      statusChip={<div className="vd-chip-live"><span className="dot" /> {revealed ? "RESULT" : "COUNTING"} · <strong>{statusTxt}</strong></div>}>
      <div className="vd-warm-bg" aria-hidden />
      <div className="vd-returns">
        <div className="vd-returns__h">
          <div className="vd-returns__kicker">
            <span className="vd-nw">NO. 05</span> · {revealed
              ? <><span className="vd-nw">FINAL RESULT</span> · <span className="vd-thai">ผลอย่างเป็นทางการ</span></>
              : <><span className="vd-nw">LIVE RETURNS</span> · <span className="vd-thai">กำลังนับคะแนน</span></>}
          </div>
          <h1 className="vd-returns__title">The <em>Returns.</em></h1>
          <div className="vd-returns__accent" aria-hidden />
        </div>

        <div className="vd-stage">
          <div className="vd-rdisc">
            {revealed ? (
              <>
                <div className="vd-rdisc__kicker">{undecided
                  ? <><span className="vd-nw">NO CALL</span> · <span className="vd-thai">ยังประกาศผลไม่ได้</span></>
                  : singleParty
                    ? <><span className="vd-nw">OFFICIAL VERDICT</span> · <span className="vd-thai">ผลรับรอง</span></>
                    : <><span className="vd-nw">THE WINNER</span> · <span className="vd-thai">ผู้ชนะ</span></>}</div>
                <div className="vd-rdisc__name" style={winnerNameSize ? { fontSize: winnerNameSize } : undefined}>
                  {winnerLabel}
                </div>
                <div className="vd-rdisc__pct vd-tabular">
                  {undecided
                    ? <span className="vd-thai">{undecidedNote}</span>
                    : singleParty
                      ? <RevealScoreLine score={(approveWins ? parties[0] : disapprove)?.score || 0} pct={pctOf(approveWins ? parties[0] : disapprove)} />
                      : (winner ? <RevealScoreLine score={winner.score || 0} pct={pctOf(winner)} suffix=" ของคะแนน" /> : "")}
                </div>
              </>
            ) : (
              <>
                <div className="vd-rdisc__lock"><Lock size={22} strokeWidth={2} /></div>
                <div className="vd-rdisc__title">{singleParty ? <>Yes or <em>no?</em></> : <>Who will <em>win?</em></>}</div>
                <p className="vd-rdisc__deck">ผลคะแนน{singleParty ? "" : "รายพรรค"}จะถูกปลดล็อกเมื่อปิดโหวตเท่านั้น</p>
                {countdownText && <div className="vd-rdisc__cd">CLOSES IN <strong className="vd-tabular">{countdownText}</strong></div>}
              </>
            )}
          </div>
        </div>

        <div className="vd-rstats">
          <div className="vd-rstat"><div className="lbl"><span className="vd-nw">TOTAL VOTES</span> · <span className="vd-thai">คะแนนรวม</span></div><div className="val vd-tabular"><em>{fmt(totalVotes)}</em></div></div>
          <div className="vd-rstat"><div className="lbl"><span className="vd-nw">TURNOUT</span> · <span className="vd-thai">สัดส่วน</span></div><div className="val vd-tabular">{turnout.toFixed(2)}<small>%</small></div></div>
          <div className="vd-rstat"><div className="lbl"><span className="vd-nw">ELIGIBLE</span> · <span className="vd-thai">ผู้มีสิทธิ์</span></div><div className="val vd-tabular">{fmt(totalEligible)}<small>คน</small></div></div>
        </div>

        <div className="vd-race">
          <div className="vd-race__head">
            <div className="vd-race__lead">
              <span className="vd-race__kicker"><span className="vd-nw">{revealed ? "Official tally" : "Embargoed"}</span> · <span className="vd-thai">{singleParty ? "ผลเห็นชอบ" : "ผลรายพรรค"}</span></span>
              <h3>Vote distribution <em>{singleParty ? "yes / no." : "by party."}</em></h3>
            </div>
            <span className="vd-smallcaps" style={{ color: "var(--terra)" }}>{revealed ? "§ OFFICIAL" : "§ EMBARGOED"}</span>
          </div>
          <div className="vd-race__barswrap">
            <div className="vd-race__bars">
              {raceRows.map((c, i) => {
                const isWin = revealed && (winner ? c === winner : (singleParty && approveWins != null && (approveWins ? c === parties[0] : c === disapprove)));
                const w = revealed ? Math.max(pctOf(c), c.score > 0 ? 2 : 0) : LOCK_WIDTHS[i % LOCK_WIDTHS.length];
                return (
                  <div className={`vd-race__row ${isWin ? "is-win" : ""}`} key={c.id || i}>
                    <div className="vd-race__name">{labelOf(c)}{isWin && <span className="vd-race__tag">WINNER</span>}<small>{subOf(c)}</small></div>
                    {/* stagger delay ONLY on revealed fills — embargoed placeholder bars keep the static LOCK_WIDTHS render, no animation */}
                    <div className="vd-race__track"><div className={`vd-race__fill ${revealed ? "real" : ""}`} style={revealed ? { width: `${w}%`, animationDelay: `${i * 100}ms` } : { width: `${w}%` }} /></div>
                    <div className="vd-race__pct vd-tabular">{revealed ? <RevealPct value={pctOf(c)} /> : "??.?%"}</div>
                  </div>
                );
              })}
            </div>
            {!revealed && (
              <div className="vd-race__veil">
                <div>
                  <h4>Embargoed until <em>polls close.</em></h4>
                  <p>ผลคะแนน{singleParty ? "" : "รายพรรค"}จะปรากฏที่นี่ทันทีเมื่อปิดโหวต</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {(!revealed || demoGroups.length > 0) && (
          <div className="vd-demo">
            <div className="vd-race__head">
              <div className="vd-race__lead">
                <span className="vd-race__kicker"><span className="vd-nw">Turnout</span> · <span className="vd-thai">สถิติผู้ใช้สิทธิ์</span></span>
                <h3>Turnout <em>demographics.</em></h3>
              </div>
              <span className="vd-smallcaps" style={{ color: "var(--terra)" }}>{revealed ? "§ PARTICIPATION" : "§ EMBARGOED"}</span>
            </div>
            {revealed ? (
              <div className="vd-demo__grid">
                {demoGroups.map((g) => {
                  const max = Math.max(1, ...g.rows.map((r) => r.value || 0));
                  return (
                    <div className="vd-demo__col" key={g.en}>
                      <div className="vd-demo__title"><span className="vd-nw">{g.en}</span> · <span className="vd-thai">{g.th}</span></div>
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
              <div className="vd-demo__locked"><Lock size={18} strokeWidth={2} /><p>สถิติผู้ใช้สิทธิ์รายชั้นปี · เพศ · สาขา จะเปิดเผยพร้อมผลคะแนน เมื่อปิดโหวตแล้วเท่านั้น</p></div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        /* golden-hour warm wash — same recipe as the single-vote booth so the
           returns page carries the template's warmth, not flat cream */
        .vd-warm-bg { position:fixed; inset:0; z-index:0; pointer-events:none;
          background:
            radial-gradient(72% 46% at 50% 0%, rgba(var(--gold-rgb),.16) 0%, transparent 56%),
            radial-gradient(60% 44% at 100% 8%, rgba(var(--terra-rgb),.09) 0%, transparent 50%),
            radial-gradient(66% 52% at 0% 100%, rgba(var(--terra-soft-rgb),.30) 0%, transparent 56%),
            linear-gradient(168deg, var(--cream-2) 0%, var(--cream) 46%, var(--cream-3) 100%); }

        .vd-returns { flex:1; padding:96px 80px 150px; max-width:1320px; margin:0 auto; width:100%; position:relative; z-index:1; }
        .vd-returns__h { text-align:center; margin-bottom:48px; }
        .vd-returns__kicker { font-family:var(--fm); font-size:11px; letter-spacing:.25em; text-transform:uppercase; color:var(--terra-2); margin-bottom:18px; }
        .vd-returns__title { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(52px,7vw,96px); line-height:.96; letter-spacing:-.015em; margin:0; color:var(--moss); }
        .vd-returns__title em { color:var(--terra); }
        .vd-returns__accent { width:84px; height:2px; background:var(--terra); margin:22px auto 0; }

        /* result seal — moderate size, content fits inside; clean centred stat row
           below it (no more scattered/tilted orbital cards) */
        .vd-stage { display:grid; place-items:center; margin:4px 0 0; }
        /* --rd is the ONE source of the disc diameter: width, height AND the side
           padding all derive from it. The padding used to be \`0 13%\` — a percentage
           padding resolves against the CONTAINING BLOCK's width, not the element's,
           so on a 1280 desktop it became 13% of the ~1120px stage = ~146px per side
           and left a 138px text column inside a 430px disc (a 12-char party name
           broke into two lines; the real 43-char name broke into SEVEN and pushed
           the kicker + score line off the moss circle onto the cream). Phones were
           barely affected (13% of the 327px stage ≈ 42px ≈ the intended 39px), which
           is why it never showed there. calc(var(--rd) * .13) is the geometry the
           design always meant: 13% OF THE DISC. */
        .vd-rdisc { --rd:clamp(300px,40vw,430px); width:var(--rd); height:var(--rd); border-radius:50%; background:radial-gradient(125% 125% at 32% 24%, var(--moss-3) 0%, var(--moss) 58%); color:var(--cream); display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; text-align:center; padding:0 calc(var(--rd) * .13); box-shadow:0 50px 70px -40px rgba(var(--moss-rgb),.5), inset 0 3px 12px rgba(var(--cream-rgb),.06); }
        .vd-rdisc::before { content:""; position:absolute; inset:14px; border:1px dashed rgba(var(--cream-rgb),.22); border-radius:50%; }
        .vd-rdisc::after { content:""; position:absolute; inset:-26px; border:1px dashed rgba(var(--terra-rgb),.4); border-radius:50%; }
        .vd-rdisc__kicker { font-family:var(--fm); font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:var(--terra-soft); margin-bottom:16px; }
        .vd-rdisc__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(30px,3.6vw,50px); line-height:1.04; letter-spacing:-.02em; color:var(--cream); text-wrap:balance; }
        /* English-run nowrap partner to .vd-thai: keeps multi-word EN phrases
           ("FINAL RESULT", "TOTAL VOTES") whole so a kicker can only break at "·" */
        .vd-nw { white-space:nowrap; }
        .vd-rdisc__pct { font-family:var(--fm); font-size:12px; letter-spacing:.12em; color:var(--terra-soft); margin-top:16px; }
        .vd-rdisc__lock { width:54px; height:54px; border-radius:50%; background:var(--terra); color:var(--cream); display:grid; place-items:center; margin-bottom:20px; }
        .vd-rdisc__title { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(44px,6vw,84px); line-height:.92; letter-spacing:-.03em; color:var(--cream); margin:0; }
        .vd-rdisc__title em { color:var(--terra-soft); }
        .vd-rdisc__deck { font-family:var(--ft); font-size:14px; color:rgba(var(--cream-rgb),.72); line-height:1.5; max-width:280px; margin:16px auto 0; }
        .vd-rdisc__cd { margin-top:18px; font-family:var(--fm); font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:rgba(var(--cream-rgb),.65); }
        .vd-rdisc__cd strong { font-family:var(--fd); font-style:italic; font-size:20px; font-weight:400; color:var(--cream); letter-spacing:-.02em; margin-left:8px; text-transform:none; }

        .vd-rstats { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:36px; }
        .vd-rstat { padding:24px 28px; background:var(--cream-2); border:1px solid var(--rule); border-radius:22px; text-align:center; box-shadow:0 16px 40px -30px rgba(var(--moss-rgb),.4); }
        .vd-rstat .lbl { font-family:var(--fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--terra-2); margin-bottom:10px; }
        .vd-rstat .val { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(34px,3.6vw,46px); line-height:1; letter-spacing:-.02em; color:var(--moss); }
        .vd-rstat .val em { color:var(--terra); }
        .vd-rstat .val small { font-family:var(--fs); font-style:normal; font-size:13px; opacity:.5; margin-left:5px; letter-spacing:0; }

        .vd-race, .vd-demo { background:var(--cream-2); border:1px solid var(--rule); border-radius:28px; padding:36px; position:relative; overflow:hidden; box-shadow:0 24px 60px -42px rgba(var(--moss-rgb),.45); }
        .vd-race { margin-top:40px; }
        .vd-demo { margin-top:24px; }
        /* bilingual two-tier section head (EN kicker + serif headline) + terra
           accent bar — mirrors the single-vote booth's section headers */
        .vd-race__head { display:flex; justify-content:space-between; align-items:flex-end; padding-bottom:22px; border-bottom:1px solid var(--rule); margin-bottom:26px; position:relative; }
        .vd-race__head::after { content:""; position:absolute; left:0; bottom:-1px; width:58px; height:2px; background:var(--terra); }
        .vd-race__lead { display:flex; flex-direction:column; min-width:0; }
        .vd-race__kicker { font-family:var(--fm); font-size:10px; letter-spacing:.26em; text-transform:uppercase; color:var(--terra-2); margin-bottom:10px; }
        .vd-race__head h3 { font-family:var(--fd); font-style:italic; font-weight:400; font-size:30px; letter-spacing:-.015em; margin:0; color:var(--moss); }
        .vd-race__head h3 em { color:var(--terra); }
        .vd-race__bars { display:grid; gap:22px; padding-top:4px; }
        .vd-race__row { display:grid; grid-template-columns:260px 1fr 80px; gap:24px; align-items:center; }
        /* reveal ceremony (vd-B1B): the winner row reads at a glance — gentle
           terra-on-cream tint, negative margins so the 3-col grid stays aligned
           with the untinted rows */
        .vd-race__row.is-win { background:color-mix(in srgb, var(--terra) 9%, var(--cream-2)); border-radius:16px; padding:10px 14px; margin:-10px -14px; }
        .vd-race__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:20px; letter-spacing:-.005em; color:var(--moss); }
        .vd-race__name small { display:block; font-family:var(--fm); font-style:normal; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--moss); opacity:.7; margin-top:2px; }
        /* WINNER medallion-stamp — terra seal with an inner dashed cream ring
           (the vd-rdisc dashed-ring motif at pill scale) + one-shot scale-settle
           after the bars land. \`backwards\` holds the from-state during the
           delay, so the stamp is visible at every moment (never opacity-hidden) */
        .vd-race__tag { display:inline-block; margin-left:10px; font-family:var(--fm); font-size:9px; letter-spacing:.14em; background:var(--terra); color:var(--cream); border-radius:999px; padding:4px 10px; vertical-align:middle; text-transform:uppercase; border:1px dashed rgba(var(--cream-rgb),.6); box-shadow:0 0 0 2px var(--terra), 0 8px 16px -8px rgba(var(--terra-rgb),.6); animation:vdStampIn .5s cubic-bezier(.34,1.56,.64,1) .5s backwards; }
        .vd-race__track { height:10px; background:var(--cream-3); border:1px solid var(--rule); border-radius:999px; overflow:hidden; }
        .vd-race__fill { height:100%; background:var(--terra); opacity:.4; background-image:repeating-linear-gradient(45deg, rgba(255,255,255,0) 0 6px, rgba(255,255,255,.18) 6px 7px); transition:width .6s ease-out; }
        /* revealed bars grow 0→final with a per-row stagger (animationDelay set
           inline). Pure CSS keyframe: without JS the animation still ends at the
           specified width, so the final bars are never gated behind hydration.
           Scoped to .real ONLY — embargoed placeholder bars never animate. */
        .vd-race__fill.real { opacity:1; animation:vdBarGrow .7s cubic-bezier(.22,1,.36,1) backwards; }
        @keyframes vdBarGrow { from { width:0; } }
        @keyframes vdStampIn { from { transform:scale(1.15); } }
        @media (prefers-reduced-motion: reduce) {
          .vd-race__fill.real, .vd-race__tag { animation:none; }
        }
        .vd-race__pct { font-family:var(--fm); font-size:14px; color:var(--moss); opacity:.72; text-align:right; }
        /* veil covers exactly the bars wrapper (not a fixed offset) so it never
           overlaps the taller two-tier head, at any breakpoint */
        .vd-race__barswrap { position:relative; }
        .vd-race__veil { position:absolute; inset:0; background:rgba(var(--cream-rgb),.95); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); display:grid; place-items:center; text-align:center; padding:0 24px; }
        .vd-race__veil h4 { font-family:var(--fd); font-style:italic; font-weight:400; font-size:32px; letter-spacing:-.015em; margin:0 0 8px; color:var(--moss); }
        .vd-race__veil h4 em { color:var(--terra); }
        .vd-race__veil p { font-family:var(--ft); font-size:15px; color:var(--moss); opacity:.82; max-width:380px; margin:0; }

        .vd-demo__grid { display:grid; grid-template-columns:repeat(3,1fr); gap:36px; }
        .vd-demo__title { font-family:var(--fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--terra-2); margin-bottom:16px; }
        .vd-demo__row { display:grid; grid-template-columns:minmax(60px,auto) 1fr auto; gap:12px; align-items:center; margin-bottom:12px; }
        /* the ellipsis needs overflow:hidden, which also clips VERTICALLY at the
           padding box — and these names are admin/DB free text (สาขา), so a tone
           mark over a Thai upper vowel gets shaved: measured needEm .019 at every
           breakpoint (-.25px of ink). .07em = .019 + .05 cushion. Equal negative
           margin so the margin box stays 19.5px and the centred grid row does not
           move. Never padding-bottom here. */
        .vd-demo__name { font-family:var(--ft); font-size:13px; color:var(--moss); opacity:.85; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-top:.07em; margin-top:-.07em; }
        .vd-demo__track { height:7px; background:var(--cream-3); border:1px solid var(--rule); border-radius:999px; overflow:hidden; }
        .vd-demo__fill { height:100%; background:var(--terra); opacity:.65; }
        .vd-demo__val { font-family:var(--fm); font-size:12px; color:var(--moss); opacity:.72; }
        .vd-demo__locked { display:flex; align-items:center; gap:16px; color:var(--moss); }
        .vd-demo__locked p { font-family:var(--ft); font-size:14px; opacity:.75; margin:0; line-height:1.5; }

        @media (max-width:1100px) {
          .vd-returns { padding:92px 24px 130px; }
          .vd-race__row { grid-template-columns:130px 1fr 56px; gap:12px; }
          .vd-race__name { font-size:16px; }
          .vd-demo__grid { grid-template-columns:1fr; gap:24px; }
        }
        @media (max-width:640px) {
          .vd-rstats { grid-template-columns:1fr; }
        }
        /* phones — the two-tier section head stacks into a column so the big serif
           headline gets the FULL width instead of being crowded by the "§" smallcaps.
           The smallcaps floats to the TOP of the column, right-aligned on its own row
           (order:-1) — robust for any label length ("§ OFFICIAL" .. "§ PARTICIPATION"),
           no collision with the kicker or headline. Desktop (≥561px) is untouched. */
        @media (max-width:560px) {
          .vd-race__head { flex-direction:column; align-items:stretch; gap:0; }
          .vd-race__head .vd-smallcaps { order:-1; align-self:flex-end; margin-bottom:14px; }
          .vd-race__head h3 { font-size:24px; }
        }
      `}</style>
    </VerdureShell>
  );
}
