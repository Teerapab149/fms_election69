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
import { GumroadBaseStyles } from "../home/GumroadTheme";
import React, { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { resolveElectionDates, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";
import SiteNavbar from "../elements/site-navbar/gumroad";
import SiteFooter from "../elements/site-footer/gumroad";
import ResultsHead from "../elements/results-head/gumroad";
import StatCard from "../composites/stat-card/gumroad";
import { getPartyColor } from "../../utils/partyColors";

const POPS = ["#FF9CE9", "#B6E6FF", "#C2F47E", "#FFD24D", "#FF8A8A"];
const CHART_FONT = "'Anuphan','Kanit',system-ui,sans-serif";
const genderColor = (n) => {
  const s = String(n).toLowerCase();
  if (s.includes("female") || s.includes("หญิง")) return "#FF9CE9";
  if (s.includes("male") || s.includes("ชาย")) return "#B6E6FF";
  return "#C2F47E";
};

// Gumroad-styled chart tooltip (paper card, ink border, hard shadow).
function GrTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const name = label || p?.name || p?.payload?.name;
  return (
    <div className="gr-tip">
      <span className="gr-tip__name">{name}</span>
      <span className="gr-tip__val">{(p?.value || 0).toLocaleString()} <span className="gm-thai">คน</span></span>
    </div>
  );
}

// ── reveal ceremony: count-up (gm-B1B) ───────────────────────────────────────
// SSR-safe by construction: the INITIAL state is the FINAL value, so server HTML,
// no-JS, and pre-hydration paint all show the real number. Only after hydration
// does the effect restart the number from 0 and ease it up (~1s). reduced-motion
// or editorMode (enabled=false) → snap to final, no rAF. Used ONLY inside the
// revealed branch — embargoed numbers keep their literal "??.?%" string.
function useCountUp(target, { duration = 1000, enabled = true } = {}) {
  const [val, setVal] = useState(target);
  useEffect(() => {
    if (!enabled || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) { setVal(target); return undefined; }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setVal(target * (1 - Math.pow(1 - p, 3))); // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);
  return val;
}
// revealed-only value renderers — count 0→value after hydration, final otherwise
function RevealPct({ value, enabled }) { const v = useCountUp(value, { enabled }); return <>{v.toFixed(1)}%</>; }
function RevealInt({ value, enabled }) { const v = useCountUp(value, { enabled }); return <>{Math.round(v).toLocaleString()}</>; }
function RevealFixed({ value, digits = 2, enabled }) { const v = useCountUp(value, { enabled }); return <>{v.toFixed(digits)}</>; }

// ── waiting state (gm-B1B): real "polls open soon" ink card with a live countdown
// to ELECTION_START + a factual open/close window caption, derived from the resolved
// schedule (same recipe as VerdureClosed's waiting variant). editorMode → compute
// once, no interval (admin preview never ticks); interval cleared on unmount.
const GR_CD_UNITS = [["d", "วัน"], ["hh", "ชม."], ["mm", "นาที"], ["ss", "วินาที"]];
function GrWaiting({ globalConfig, editorMode }) {
  const { ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);
  const [cd, setCd] = useState(null);
  useEffect(() => {
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
    if (editorMode) return undefined;
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalConfig?.electionStartAt, editorMode]);

  let factual = null;
  const d = formatThaiDate(ELECTION_START);
  if (d) factual = `เปิดโหวต ${d} · ${formatThaiTime(ELECTION_START)}–${formatThaiTime(ELECTION_END)}`;

  return (
    <div className="gr-waiting">
      <div className="gr-waiting__kicker"><span className="gr-dot" /> UPCOMING · <span className="gm-thai">ยังไม่เปิดโหวต</span></div>
      <h2 className="gr-waiting__title">POLLS<br />OPEN <em>SOON</em></h2>
      <p className="gr-waiting__deck">ผลการเลือกตั้งจะแสดงที่นี่แบบเรียลไทม์เมื่อเปิดหีบเลือกตั้ง</p>
      {cd && (
        <div className="gr-waiting__cd" role="timer" aria-label="เวลาที่เหลือก่อนเปิดโหวต">
          {GR_CD_UNITS.map(([k, u]) => (
            <div className="gr-cd__seg" key={u}>
              <span className="gr-cd__num tabular">{k === "d" ? cd.d : String(cd[k]).padStart(2, "0")}</span>
              <span className="gr-cd__u gm-thai">{u}</span>
            </div>
          ))}
        </div>
      )}
      {factual && <div className="gr-waiting__fact">{factual}</div>}
    </div>
  );
}

export default function GumroadResults({
  candidates = [],
  totalVotes = 0,
  demographics = {},
  finalStatus = "WAITING",
  isRevealed = false,
  isNotStarted = false,
  countdownText = "",
  editorMode = false,
}) {
  const globalConfig = useGlobalConfig();
  const anim = !editorMode; // count-ups + bar-grow run in the live app, not admin preview
  const ended = finalStatus === "ENDED";
  const revealed = !!isRevealed;
  const counting = !isNotStarted && !revealed;       // active/ended but scores still locked
  const totalEligible = demographics?.totalEligible || 0;
  const turnout = totalEligible > 0 ? ((totalVotes / totalEligible) * 100) : 0;

  const parties = candidates.filter((c) => parseInt(c.number) > 0);
  const singleParty = parties.length === 1; // single-party ballot → รับรอง/ไม่รับรอง, not a race
  // drop blank-named groups (e.g. a null-gender bucket the groupBy emits) so they
  // don't render as an empty "0" legend chip / ghost bar.
  const clean = (arr) => (arr || []).filter((d) => d && d.name != null && String(d.name).trim() !== "");
  const byYear = clean(demographics?.byYear);
  const byGender = clean(demographics?.byGender);
  const byMajor = clean(demographics?.byMajor);
  const genderTotal = byGender.reduce((a, b) => a + (b.value || 0), 0);
  const topScore = revealed ? Math.max(0, ...parties.map((p) => p.score || 0)) : -1;
  const winner = revealed && topScore > 0 ? parties.find((p) => (p.score || 0) === topScore) : null;
  const restCards = winner ? candidates.filter((c) => c !== winner) : candidates;
  const pctOf = (c) => (totalVotes > 0 ? ((c.score || 0) / totalVotes * 100) : 0);
  const logoSrc = (c) => (c?.logoUrl ? (String(c.logoUrl).startsWith("http") ? c.logoUrl : getPath(c.logoUrl)) : null);
  const labelOf = (c) => {
    const n = parseInt(c.number);
    if (n > 0) return `NO. ${n}`;
    return <span className="gm-thai">{n === 0 ? "งดออกเสียง" : "ไม่รับรอง"}</span>;
  };

  const statusLabel = ended ? (revealed ? "FINAL RESULT" : "COUNTING IN PROGRESS")
    : finalStatus === "ONGOING" ? "REAL-TIME UPDATE" : "UPCOMING";

  return (
    <div className="fms-app gr-root gum-root">
      <GumroadBaseStyles />
      {/* TOPBAR — shared gumroad navbar element */}
      <SiteNavbar active="results" />

      <main className="gr-page">
        {/* HEAD — results-head element */}
        <ResultsHead
          statusLabel={statusLabel}
          title={globalConfig.electionName}
          subtitle={<>ระบบเลือกตั้ง{globalConfig.organizationShort} {globalConfig.facultyName} ประจำปีการศึกษา <strong>{globalConfig.academicYearTh}</strong></>}
        />

        {isNotStarted ? (
          <GrWaiting globalConfig={globalConfig} editorMode={editorMode} />
        ) : (
          <>
            {/* LOCKED headline (while counting) */}
            {counting && (
              <div className="gr-locked">
                <div className="gr-headline">
                  <span className="gr-headline__lbl"><span className="gr-dot" /> COUNTING · <span className="gm-thai">กำลังนับคะแนน</span></span>
                  {/* single party = approve/disapprove, not a multi-party race */}
                  <h2 className="gr-headline__title">
                    {singleParty ? <>YES<br />OR<br />NO<em>?</em></> : <>WHO<br />WILL<br />WIN<em>?</em></>}
                  </h2>
                  {/* left = the suspense teaser (emotion); right card = the factual reason */}
                  <p className="gr-headline__sub">
                    {singleParty
                      ? "ลุ้นกันว่าพรรคนี้จะได้รับการรับรองจากชาว FMS หรือไม่"
                      : "ลุ้นกันว่าพรรคไหนจะครองใจชาว FMS ได้มากที่สุด"}
                  </p>
                </div>
                <div className="gr-lock">
                  <div className="gr-lock__icon"><Lock size={32} strokeWidth={2.5} /></div>
                  <h3>ผลการนับ<br />ยังถูกล็อก</h3>
                  <p>
                    {singleParty
                      ? "เพื่อความโปร่งใส ผลการรับรองจะถูกเปิดเผยเมื่อปิดโหวตแล้วเท่านั้น"
                      : "เพื่อความเป็นธรรมกับทุกพรรค ผลคะแนนจะถูกเปิดเผยพร้อมกันเมื่อปิดโหวตแล้วเท่านั้น"}
                  </p>
                  {countdownText ? (
                    <div className="gr-lock__cd">
                      {ended
                        ? <><span className="gm-thai">ปิดโหวตแล้ว</span> · <span className="gm-thai">รอประกาศผล</span></>
                        : <><span className="gm-thai">ปิดใน</span> {countdownText}</>}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* STAT CARDS — stat-card composites (Layer 2) */}
            <div className="gr-stats">
              {/* revealed → the three tallies count up (reveal ceremony); embargoed/live
                  stays a plain string so the counting state is byte-identical to before */}
              <StatCard tone="pink" lbl={<>★ <span className="gm-thai">คะแนนเสียงรวม</span> · TOTAL</>} value={revealed ? <RevealInt value={totalVotes} enabled={anim} /> : totalVotes.toLocaleString()} sub="นับสะสมตั้งแต่เปิดโหวต" />
              <StatCard lbl={<><span className="gm-thai">ผู้มีสิทธิ์</span> · ELIGIBLE</>} value={revealed ? <RevealInt value={totalEligible} enabled={anim} /> : totalEligible.toLocaleString()} sub="นักศึกษาที่ลงทะเบียน" />
              <StatCard tone="lime" lbl={<><span className="gm-thai">ความคืบหน้า</span> · TURNOUT</>} value={revealed ? <RevealFixed value={turnout} digits={2} enabled={anim} /> : turnout.toFixed(2)} unit="%" sub={ended ? "สรุปยอดผู้มาใช้สิทธิ์" : "↑ อัปเดต Real-time"} />
            </div>

            {/* RACE */}
            <section className="gr-race">
              <div className="gr-race__head">
                <div>
                  <h3>📊 {singleParty ? "ผลการรับรองพรรค" : "การกระจายคะแนนรายพรรค"}</h3>
                  <p>{revealed ? (singleParty ? "สรุปผลการรับรอง" : "สรุปผลคะแนนแต่ละพรรค") : "ข้อมูลจะปรากฏหลังปิดโหวตแล้วเท่านั้น"}</p>
                </div>
                <span className={`gr-sticker ${revealed ? "gr-sticker--lime" : "gr-sticker--ink"}`}>{revealed ? "● LIVE" : "🔒 LOCKED"}</span>
              </div>
              {revealed ? (
                <div className="gr-reveal">
                  {winner && (
                    <div className="gr-winner" style={{ background: getPartyColor(winner, winner.number - 1) }}>
                      <span className="gr-winner__badge">👑 <span className="gm-thai">ผู้ชนะ</span> · WINNER</span>
                      <div className="gr-winner__main">
                        {logoSrc(winner) && <div className="gr-winner__logo"><img src={logoSrc(winner)} alt={winner.name} /></div>}
                        <div className="gr-winner__id">
                          <div className="gr-winner__no">NO. {winner.number}</div>
                          <h3 className="gr-winner__name">{winner.name}</h3>
                          {winner.slogan ? <p className="gr-winner__slogan">&ldquo;{winner.slogan}&rdquo;</p> : null}
                        </div>
                        <div className="gr-winner__score">
                          <div className="gr-winner__pct tabular"><RevealFixed value={pctOf(winner)} digits={1} enabled={anim} /><span>%</span></div>
                          <div className="gr-winner__votes"><span className="tabular"><RevealInt value={winner.score || 0} enabled={anim} /></span> <span className="gm-thai">คะแนน</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                  {restCards.length > 0 && (
                    <div className="gr-ranks">
                      {restCards.map((c, i) => {
                        const isParty = parseInt(c.number) > 0;
                        const color = isParty ? getPartyColor(c, c.number - 1) : "#C9C4BE";
                        // RES-1: read-only tally board — standings rows are not
                        // links (owner decision, mirrors ReceiptResults)
                        return (
                          <div className="gr-rank" key={c.id}>
                            <div className="gr-rank__name">{c.name}<small>{labelOf(c)}</small></div>
                            {/* fill carries its REAL width inline (no-JS/reduced-motion safe);
                                --real only staggers a 0→width grow via animationDelay */}
                            <div className="gr-rank__track"><div className={`gr-rank__fill${anim ? " gr-rank__fill--real" : ""}`} style={{ width: `${Math.max(pctOf(c), 2)}%`, background: color, animationDelay: `${i * 90}ms` }} /></div>
                            <div className="gr-rank__pct tabular"><RevealPct value={pctOf(c)} enabled={anim} /></div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="gr-race__bars">
                    {candidates.map((c, i) => {
                      const color = parseInt(c.number) > 0 ? getPartyColor(c, c.number - 1) : "#C9C4BE";
                      return (
                        <div className="gr-rrow" key={c.id}>
                          <div className="gr-rrow__name">{c.name}<small>{labelOf(c)}</small></div>
                          <div className="gr-rrow__track"><div className="gr-rrow__fill" style={{ width: "50%", background: color }} /></div>
                          <div className="gr-rrow__pct">??.?%</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="gr-race__hidden">
                    <div>🔒 HIDDEN UNTIL CLOSE</div>
                    <span>ผลคะแนนจะแสดงเมื่อปิดโหวตแล้วเท่านั้น</span>
                  </div>
                </>
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
                  {byGender.length > 0 && (
                    <div className="gr-card">
                      <h4>แยกตามเพศ</h4>
                      <div className="gr-donut">
                        <ResponsiveContainer width="100%" height={230}>
                          <PieChart>
                            <Pie data={byGender} dataKey="value" nameKey="name" cx="50%" cy="50%"
                              innerRadius={58} outerRadius={88} paddingAngle={3} stroke="#1A1A1A" strokeWidth={2.5}
                              startAngle={90} endAngle={-270} isAnimationActive={false}>
                              {byGender.map((g, i) => <Cell key={i} fill={genderColor(g.name)} />)}
                            </Pie>
                            <Tooltip content={<GrTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="gr-donut__center"><strong>{genderTotal.toLocaleString()}</strong><span><span className="gm-thai">คน</span></span></div>
                      </div>
                      <div className="gr-legend">
                        {byGender.map((g, i) => (
                          <span className="gr-legend__item" key={i}>
                            <i style={{ background: genderColor(g.name) }} />{g.name}<b>{(g.value || 0).toLocaleString()}</b>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {byYear.length > 0 && (
                    <div className="gr-card">
                      <h4>แยกตามชั้นปี</h4>
                      <ResponsiveContainer width="100%" height={230}>
                        <BarChart data={byYear} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
                          <CartesianGrid vertical={false} stroke="rgba(26,26,26,.08)" />
                          <XAxis dataKey="name" tick={{ fontFamily: CHART_FONT, fontSize: 12, fontWeight: 600, fill: "#1A1A1A" }} tickLine={false} axisLine={{ stroke: "#1A1A1A", strokeWidth: 2 }} />
                          <YAxis allowDecimals={false} width={34} tick={{ fontFamily: CHART_FONT, fontSize: 11, fill: "#4A4A4A" }} tickLine={false} axisLine={false} />
                          <Tooltip content={<GrTooltip />} cursor={{ fill: "rgba(26,26,26,.05)" }} />
                          <Bar dataKey="value" stroke="#1A1A1A" strokeWidth={2.5} radius={[8, 8, 0, 0]} maxBarSize={66} isAnimationActive={false}>
                            {byYear.map((_, i) => <Cell key={i} fill={POPS[i % POPS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {byMajor.length > 0 && (
                    <div className="gr-card gr-card--wide">
                      <h4>แยกตามสาขา</h4>
                      <ResponsiveContainer width="100%" height={Math.max(240, byMajor.length * 46)}>
                        <BarChart data={byMajor} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 4 }}>
                          <CartesianGrid horizontal={false} stroke="rgba(26,26,26,.08)" />
                          <XAxis type="number" hide allowDecimals={false} />
                          <YAxis type="category" dataKey="name" width={210} tick={{ fontFamily: CHART_FONT, fontSize: 12, fontWeight: 600, fill: "#1A1A1A" }} tickLine={false} axisLine={{ stroke: "#1A1A1A", strokeWidth: 2 }} />
                          <Tooltip content={<GrTooltip />} cursor={{ fill: "rgba(26,26,26,.05)" }} />
                          <Bar dataKey="value" stroke="#1A1A1A" strokeWidth={2.5} radius={[0, 8, 8, 0]} maxBarSize={28} isAnimationActive={false}
                            label={{ position: "right", fontFamily: CHART_FONT, fontSize: 12, fontWeight: 700, fill: "#1A1A1A", formatter: (v) => (v || 0).toLocaleString() }}>
                            {byMajor.map((_, i) => <Cell key={i} fill={POPS[i % POPS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : (
                <div className="gr-demo__locked">สถิติผู้มาใช้สิทธิ์จะปลดล็อกเมื่อเปิดผลการเลือกตั้ง</div>
              )}
            </section>
          </>
        )}
      </main>

      <SiteFooter faculty={globalConfig.facultyShortEn || "FMS"} uni={globalConfig.university || "PSU"} year={globalConfig.copyrightYear || ""} />

      <style jsx global>{`
        .gr-root{
          --ink:#26271c; --ink2:#5c5a4b; --cream:#FFF6EC; --cream2:#FFE9D6; --paper:#FFFDFA;
          --pink:#FF9CE9; --lime:#C2F47E; --yellow:#FFD24D; --sky:#B6E6FF; --coral:#FF8A8A;
          --bw:2.5px; --sh:5px 5px 0 var(--ink); --sh-sm:3px 3px 0 var(--ink); --sh-lg:8px 8px 0 var(--ink); --sh-xl:12px 12px 0 var(--ink);
          --fd:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --fm:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace;
          --fb:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif;
          min-height:100vh; display:flex; flex-direction:column; color:var(--ink);
          font-family:var(--fb); container-type:inline-size; container-name:gr;
          background:linear-gradient(135deg, var(--gw1, #FFE6F2) 0%, var(--gw2, #FFF7EE) 46%, var(--gw3, #EEF7DB) 100%) fixed;
        }
        .gr-root *{ box-sizing:border-box; } .gr-root a{ text-decoration:none; color:inherit; } .gr-root img{ display:block; max-width:100%; }
        .tabular{ font-variant-numeric:tabular-nums; }
        /* Thai runs inside mono (--fm/Space Grotesk) kickers/labels — that stack has
           no Thai glyphs so Thai text falls back to a mismatched system font
           (misaligned vowel/tone marks, wider metrics → wraps). Pin Thai runs to
           the family's real Thai body font instead; keep "·" as the only break point. */
        .gm-thai{ font-family:var(--fb) !important; letter-spacing:.04em; white-space:nowrap; }

        .gr-page{ flex:1; width:100%; max-width:1100px; margin:0 auto; padding:36px 28px 64px; }
        /* head = <ResultsHead> element (own scoped styles) */
        /* shared stickers (used by race + demo heads) */
        .gr-sticker{ display:inline-flex; align-items:center; gap:8px; padding:6px 15px; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:999px; font-weight:700; font-size:13px; box-shadow:var(--sh-sm); white-space:nowrap; }
        .gr-sticker--ink{ background:var(--ink); color:var(--cream); } .gr-sticker--pink{ background:var(--pink); } .gr-sticker--lime{ background:var(--lime); }
        .gr-dot{ width:9px; height:9px; border-radius:999px; background:var(--coral); box-shadow:0 0 0 0 color-mix(in srgb, var(--coral) 70%, transparent); animation:grPulse 1.6s ease-out infinite; }
        @keyframes grPulse{ 0%{box-shadow:0 0 0 0 color-mix(in srgb, var(--coral) 70%, transparent)} 70%{box-shadow:0 0 0 12px rgba(255,110,110,0)} 100%{box-shadow:0 0 0 0 rgba(255,110,110,0)} }

        /* waiting state — "polls open soon" ink hero + live countdown chips */
        .gr-waiting{ position:relative; overflow:hidden; text-align:center; background:var(--ink); color:var(--cream); border:var(--bw) solid var(--ink); border-radius:28px; box-shadow:var(--sh-xl); padding:64px 40px; }
        .gr-waiting::after{ content:""; position:absolute; inset:-42% -12% auto auto; width:340px; height:340px; background:var(--pink); border-radius:999px; opacity:.22; filter:blur(24px); pointer-events:none; }
        .gr-waiting > *{ position:relative; z-index:1; }
        .gr-waiting__kicker{ display:inline-flex; align-items:center; gap:10px; font-family:var(--fm); font-size:13px; text-transform:uppercase; letter-spacing:.2em; color:var(--lime); margin-bottom:16px; }
        .gr-waiting__title{ font-family:var(--fd); font-size:clamp(40px,7cqw,72px); line-height:.92; letter-spacing:-.03em; text-transform:uppercase; margin:0 0 14px; }
        .gr-waiting__title em{ font-style:normal; color:var(--pink); }
        .gr-waiting__deck{ color:rgba(255,241,229,.78); font-size:16px; line-height:1.55; margin:0 auto; max-width:460px; }
        .gr-waiting__cd{ display:inline-flex; gap:12px; margin-top:32px; flex-wrap:wrap; justify-content:center; }
        .gr-cd__seg{ min-width:78px; background:var(--paper); color:var(--ink); border:var(--bw) solid var(--ink); border-radius:16px; box-shadow:var(--sh-sm); padding:14px 12px; display:flex; flex-direction:column; align-items:center; gap:5px; }
        .gr-cd__num{ font-family:var(--fd); font-size:clamp(28px,4cqw,40px); line-height:1; }
        .gr-cd__u{ font-size:11px; letter-spacing:.06em; color:var(--ink2); }
        .gr-waiting__fact{ margin-top:28px; display:inline-block; font-size:14px; font-weight:600; background:var(--yellow); color:var(--ink); border:var(--bw) solid var(--ink); border-radius:999px; box-shadow:var(--sh-sm); padding:10px 20px; }

        /* locked headline */
        .gr-locked{ display:grid; grid-template-columns:1.1fr 1fr; gap:28px; margin-bottom:30px; align-items:stretch; }
        .gr-headline{ position:relative; overflow:hidden; background:var(--ink); color:var(--cream); border:var(--bw) solid var(--ink); border-radius:28px; box-shadow:var(--sh-xl); padding:36px; }
        .gr-headline::after{ content:""; position:absolute; inset:-50% -10% auto auto; width:300px; height:300px; background:var(--pink); border-radius:999px; opacity:.25; filter:blur(20px); }
        .gr-headline__lbl{ position:relative; z-index:2; display:inline-flex; align-items:center; gap:10px; font-family:var(--fm); font-size:13px; text-transform:uppercase; letter-spacing:.2em; color:var(--lime); }
        .gr-headline__title{ position:relative; z-index:2; font-family:var(--fd); font-size:clamp(48px,7cqw,88px); letter-spacing:-.03em; line-height:.92; margin:16px 0 6px; text-transform:uppercase; }
        .gr-headline__title em{ font-style:normal; color:var(--pink); }
        .gr-headline__sub{ position:relative; z-index:2; font-size:16px; color:rgba(255,241,229,.78); margin:4px 0 0; }
        .gr-lock{ position:relative; overflow:hidden; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:28px; box-shadow:var(--sh-xl); padding:34px; }
        .gr-lock::before{ content:""; position:absolute; inset:0; background-image:radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--pink) 46%, white) 0,transparent 50%),radial-gradient(circle at 80% 80%, color-mix(in srgb, var(--lime) 50%, white) 0,transparent 50%); z-index:0; }
        .gr-lock > *{ position:relative; z-index:1; }
        .gr-lock__icon{ width:74px; height:74px; background:var(--yellow); border:var(--bw) solid var(--ink); border-radius:20px; box-shadow:var(--sh); display:grid; place-items:center; margin-bottom:18px; transform:rotate(-4deg); }
        .gr-lock h3{ font-family:var(--fd); font-size:clamp(26px,3cqw,38px); margin:4px 0 8px; text-transform:uppercase; }
        .gr-lock p{ color:var(--ink2); margin:0; line-height:1.55; }
        .gr-lock__cd{ margin-top:20px; display:inline-block; font-family:var(--fm); font-weight:600; font-size:14px; background:var(--ink); color:var(--cream); padding:10px 18px; border-radius:12px; }

        /* stat cards = <StatCard> composites (own scoped styles); .gr-stats = grid only */
        .gr-stats{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:30px; }

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
        .gr-race__hidden{ position:absolute; inset:0; display:grid; place-items:center; gap:6px; background:color-mix(in srgb, var(--cream) 84%, transparent); backdrop-filter:blur(6px); text-align:center; }
        .gr-race__hidden div{ font-family:var(--fd); font-size:clamp(22px,4cqw,30px); text-transform:uppercase; letter-spacing:.04em; }
        .gr-race__hidden span{ font-size:14px; font-weight:500; color:var(--ink2); }

        /* revealed: winner spotlight + ranked cards */
        .gr-reveal{ display:flex; flex-direction:column; gap:18px; }
        .gr-winner{ position:relative; background:var(--lime); border:var(--bw) solid var(--ink); border-radius:24px; box-shadow:var(--sh-lg); padding:24px 26px; }
        .gr-winner__badge{ display:inline-flex; align-items:center; gap:8px; background:var(--ink); color:var(--cream); font-family:var(--fm); font-weight:600; font-size:12px; letter-spacing:.14em; text-transform:uppercase; padding:7px 14px; border-radius:999px; }
        .gr-winner__main{ display:flex; align-items:center; gap:22px; margin-top:16px; flex-wrap:wrap; }
        .gr-winner__logo{ width:88px; height:88px; flex-shrink:0; border:var(--bw) solid var(--ink); border-radius:20px; background:var(--paper); overflow:hidden; box-shadow:var(--sh-sm); }
        .gr-winner__logo img{ width:100%; height:100%; object-fit:contain; }
        .gr-winner__id{ min-width:0; flex:1; }
        .gr-winner__no{ font-family:var(--fm); font-size:12px; font-weight:600; letter-spacing:.14em; color:var(--ink2); }
        .gr-winner__name{ font-family:var(--fd); font-size:clamp(26px,4.5cqw,46px); line-height:.98; letter-spacing:-.02em; margin:4px 0 0; text-transform:uppercase; text-wrap:balance; }
        .gr-winner__slogan{ font-style:italic; font-size:14px; color:var(--ink2); margin:8px 0 0; }
        .gr-winner__score{ margin-left:auto; text-align:right; }
        .gr-winner__pct{ font-family:var(--fd); font-size:clamp(48px,9cqw,84px); line-height:.9; } .gr-winner__pct span{ font-size:.5em; }
        .gr-winner__votes{ font-family:var(--fm); font-size:13px; font-weight:600; color:var(--ink2); margin-top:2px; }

        .gr-ranks{ display:flex; flex-direction:column; gap:12px; }
        .gr-rank{ display:grid; grid-template-columns:200px 1fr 64px; gap:16px; align-items:center; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:16px; box-shadow:var(--sh-sm); padding:14px 18px; font-family:inherit; color:inherit; text-align:left; }
        .gr-rank__name{ font-weight:700; font-size:15px; } .gr-rank__name small{ display:block; font-family:var(--fm); font-size:11px; color:var(--ink2); text-transform:uppercase; letter-spacing:.12em; font-weight:600; }
        .gr-rank__track{ height:24px; background:var(--cream2); border:2px solid var(--ink); border-radius:999px; overflow:hidden; }
        .gr-rank__fill{ height:100%; border-right:2px solid var(--ink); background-image:repeating-linear-gradient(45deg,transparent 0 8px,rgba(255,255,255,.4) 8px 10px); }
        /* reveal ceremony: fills grow 0→real width with a per-row stagger (animationDelay
           set inline). Pure CSS keyframe — without JS the bar still ends at its inline
           width, so a fill is NEVER gated behind hydration. Scoped to --real only. */
        .gr-rank__fill--real{ animation:grFillGrow .7s cubic-bezier(.22,1,.36,1) backwards; }
        @keyframes grFillGrow{ from{ width:0; } }
        @media (prefers-reduced-motion: reduce){ .gr-rank__fill--real{ animation:none; } }
        .gr-rank__pct{ font-family:var(--fd); font-size:16px; text-align:right; }

        /* demographics */
        .gr-demo__head{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; }
        .gr-demo__grid{ display:grid; grid-template-columns:1fr 1fr; gap:20px; }
        .gr-card{ background:var(--paper); border:var(--bw) solid var(--ink); border-radius:22px; box-shadow:var(--sh); padding:22px 24px; }
        .gr-card--wide{ grid-column:1 / -1; }
        .gr-card h4{ font-family:var(--fd); font-size:16px; margin:0 0 16px; text-transform:uppercase; }
        /* recharts surfaces inherit the gumroad ink/flat look via per-element props */
        .gr-card .recharts-cartesian-axis-tick text{ font-family:var(--fb); }
        /* donut (gender) — ink-stroked slices + chunky centre total */
        .gr-donut{ position:relative; }
        .gr-donut__center{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; }
        .gr-donut__center strong{ font-family:var(--fd); font-size:34px; line-height:1; }
        .gr-donut__center span{ font-family:var(--fm); font-size:12px; color:var(--ink2); margin-top:2px; }
        .gr-legend{ display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin-top:14px; }
        .gr-legend__item{ display:inline-flex; align-items:center; gap:7px; font-size:13px; font-weight:600; background:var(--cream); border:2px solid var(--ink); border-radius:999px; padding:5px 12px; box-shadow:var(--sh-sm); }
        .gr-legend__item i{ width:13px; height:13px; border-radius:4px; border:2px solid var(--ink); display:inline-block; }
        .gr-legend__item b{ font-family:var(--fm); }
        /* chart tooltip */
        .gr-tip{ display:flex; flex-direction:column; gap:2px; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:12px; box-shadow:var(--sh-sm); padding:8px 12px; }
        .gr-tip__name{ font-weight:700; font-size:13px; } .gr-tip__val{ font-family:var(--fm); font-size:13px; color:var(--ink2); }
        .gr-demo__locked{ background:var(--cream2); border:2px dashed var(--ink); border-radius:18px; padding:26px; text-align:center; color:var(--ink2); font-weight:500; }

        /* footer = <SiteFooter> element (own scoped styles) */

        /* RESPONSIVE */
        @container gr (max-width:900px){
          .gr-locked{ grid-template-columns:1fr; } .gr-stats{ grid-template-columns:1fr; } .gr-demo__grid{ grid-template-columns:1fr; }
          .gr-rrow{ grid-template-columns:120px 1fr 52px; gap:10px; }
          .gr-rank{ grid-template-columns:130px 1fr 52px; gap:10px; }
          .gr-winner__main{ gap:14px; } .gr-winner__score{ margin-left:0; text-align:left; }
        }
        @container gr (max-width:520px){
          .gr-page{ padding:28px 16px 52px; }
          .gr-waiting{ padding:44px 22px; } .gr-cd__seg{ min-width:66px; padding:12px 10px; }
          .gr-rrow{ grid-template-columns:90px 1fr 46px; } .gr-rrow__name{ font-size:13px; }
          .gr-rank{ grid-template-columns:1fr auto; gap:8px 12px; }
          .gr-rank__track{ grid-column:1 / -1; order:3; }
          .gr-winner{ transform:none; } .gr-winner__logo{ width:64px; height:64px; }
          /* winner hero stacks on phones — logo / identity / score each on its own
             line so the big % can never collide with the name or slogan */
          .gr-winner__main{ flex-direction:column; align-items:flex-start; }
          .gr-winner__name{ font-size:clamp(24px,7.5cqw,34px); }
          .gr-winner__pct{ font-size:clamp(40px,13cqw,60px); }
        }
      `}</style>
    </div>
  );
}
