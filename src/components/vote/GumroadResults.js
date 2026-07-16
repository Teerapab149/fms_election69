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
import React from "react";
import { Lock } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
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
      <span className="gr-tip__val">{(p?.value || 0).toLocaleString()} คน</span>
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
  onSelectParty = () => {},
}) {
  const globalConfig = useGlobalConfig();
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
  const labelOf = (c) => (parseInt(c.number) > 0 ? `NO. ${c.number}` : (parseInt(c.number) === 0 ? "งดออกเสียง" : "ไม่รับรอง"));

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
                  {countdownText ? <div className="gr-lock__cd">{ended ? "ปิดโหวตแล้ว · รอประกาศผล" : `ปิดใน ${countdownText}`}</div> : null}
                </div>
              </div>
            )}

            {/* STAT CARDS — stat-card composites (Layer 2) */}
            <div className="gr-stats">
              <StatCard tone="pink" lbl="★ คะแนนเสียงรวม · TOTAL" value={totalVotes.toLocaleString()} sub="นับสะสมตั้งแต่เปิดโหวต" />
              <StatCard lbl="ผู้มีสิทธิ์ · ELIGIBLE" value={totalEligible.toLocaleString()} sub="นักศึกษาที่ลงทะเบียน" />
              <StatCard tone="lime" lbl="ความคืบหน้า · TURNOUT" value={turnout.toFixed(2)} unit="%" sub={ended ? "สรุปยอดผู้มาใช้สิทธิ์" : "↑ อัปเดต Real-time"} />
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
                      <span className="gr-winner__badge">👑 ผู้ชนะ · WINNER</span>
                      <div className="gr-winner__main">
                        {logoSrc(winner) && <div className="gr-winner__logo"><img src={logoSrc(winner)} alt={winner.name} /></div>}
                        <div className="gr-winner__id">
                          <div className="gr-winner__no">NO. {winner.number}</div>
                          <h3 className="gr-winner__name">{winner.name}</h3>
                          {winner.slogan ? <p className="gr-winner__slogan">&ldquo;{winner.slogan}&rdquo;</p> : null}
                        </div>
                        <div className="gr-winner__score">
                          <div className="gr-winner__pct">{pctOf(winner).toFixed(1)}<span>%</span></div>
                          <div className="gr-winner__votes">{(winner.score || 0).toLocaleString()} คะแนน</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {restCards.length > 0 && (
                    <div className="gr-ranks">
                      {restCards.map((c, i) => {
                        const isParty = parseInt(c.number) > 0;
                        const color = isParty ? getPartyColor(c, c.number - 1) : "#C9C4BE";
                        return (
                          <button type="button" className="gr-rank" key={c.id} onClick={() => onSelectParty(c)}>
                            <div className="gr-rank__name">{c.name}<small>{labelOf(c)}</small></div>
                            <div className="gr-rank__track"><div className="gr-rank__fill" style={{ width: `${Math.max(pctOf(c), 2)}%`, background: color }} /></div>
                            <div className="gr-rank__pct">{pctOf(c).toFixed(1)}%</div>
                          </button>
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
                        <div className="gr-donut__center"><strong>{genderTotal.toLocaleString()}</strong><span>คน</span></div>
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

        .gr-page{ flex:1; width:100%; max-width:1100px; margin:0 auto; padding:36px 28px 64px; }
        /* head = <ResultsHead> element (own scoped styles) */
        /* shared stickers (used by race + demo heads) */
        .gr-sticker{ display:inline-flex; align-items:center; gap:8px; padding:6px 15px; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:999px; font-weight:700; font-size:13px; box-shadow:var(--sh-sm); white-space:nowrap; }
        .gr-sticker--ink{ background:var(--ink); color:var(--cream); } .gr-sticker--pink{ background:var(--pink); } .gr-sticker--lime{ background:var(--lime); }
        .gr-dot{ width:9px; height:9px; border-radius:999px; background:var(--coral); box-shadow:0 0 0 0 color-mix(in srgb, var(--coral) 70%, transparent); animation:grPulse 1.6s ease-out infinite; }
        @keyframes grPulse{ 0%{box-shadow:0 0 0 0 color-mix(in srgb, var(--coral) 70%, transparent)} 70%{box-shadow:0 0 0 12px rgba(255,110,110,0)} 100%{box-shadow:0 0 0 0 rgba(255,110,110,0)} }

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
        .gr-rank{ display:grid; grid-template-columns:200px 1fr 64px; gap:16px; align-items:center; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:16px; box-shadow:var(--sh-sm); padding:14px 18px; cursor:pointer; font-family:inherit; color:inherit; text-align:left; transition:transform .12s ease-out, box-shadow .12s ease-out; }
        .gr-rank:hover{ transform:translate(-2px,-2px); box-shadow:var(--sh); }
        .gr-rank__name{ font-weight:700; font-size:15px; } .gr-rank__name small{ display:block; font-family:var(--fm); font-size:11px; color:var(--ink2); text-transform:uppercase; letter-spacing:.12em; font-weight:600; }
        .gr-rank__track{ height:24px; background:var(--cream2); border:2px solid var(--ink); border-radius:999px; overflow:hidden; }
        .gr-rank__fill{ height:100%; border-right:2px solid var(--ink); background-image:repeating-linear-gradient(45deg,transparent 0 8px,rgba(255,255,255,.4) 8px 10px); }
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
          .gr-rrow{ grid-template-columns:90px 1fr 46px; } .gr-rrow__name{ font-size:13px; }
          .gr-rank{ grid-template-columns:1fr auto; gap:8px 12px; }
          .gr-rank__track{ grid-column:1 / -1; order:3; }
          .gr-winner{ transform:none; } .gr-winner__logo{ width:64px; height:64px; }
        }
      `}</style>
    </div>
  );
}
