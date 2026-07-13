"use client";

// ReceiptResults — RESULTS page for the "Receipt · Paper Materiality" template
// family (Template #6), in the print/desk language established by ReceiptHome
// (R2.5) and the ballot pages (R3). This is Receipt's DATA MOMENT — a single long
// REGISTER TAPE that itemises the whole election like a summary receipt:
//   • masthead: mono issue-line + eyebrow + a structural title ("ผลคะแนน")
//   • public FIGURES — the turnout register block (total votes · turnout with a thin
//     ink track · eligible), the SAME aggregate stats the home register shows. These
//     are public turnout figures, never per-party scores.
//   • EMBARGO (isRevealed false) — the receipt is SEALED: a holo-foil security strip
//     stamped "SEALED" over a sealed slip with the bilingual embargo copy + closing
//     countdown. Per-party scores NEVER enter the DOM before reveal (the ranking rows
//     only render when revealed — this is the state most voters see on election day).
//   • REVEALED — a register-tape standings list: each party is a receipt line item
//     (index · name · big tabular score · thin ink track · % ), winner marked with a
//     geometric ink STAMP (no trophy/medal icons). Then turnout demographics as the
//     EXISTING recharts (BarChart / PieChart) wrapped in paper panels — the FRAME is
//     restyled, the chart internals/props are byte-identical to BlossomResults.
//
// Pure presentation: results/page.js owns access control + data fetching + the 3s
// polling and hands the resolved data down (same prop contract as every other family
// Results). Colours flow ONLY through var(--rc-*) emitted by ReceiptBaseStyles on
// .rc-root; chart FILLS resolve from the SAME receipt palette source (receiptPalettes
// via receiptTheme) since var(--rc-*) does not resolve inside SVG fill attributes —
// this keeps charts themed without touching any semantic vote colour. The shared desk
// language (laid paper / vignette / emboss seals / holo foil) comes from .rc-desk in
// ReceiptBaseStyles; the topbar + footer mirror ReceiptHome.

import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { ReceiptTopBar } from "../home/ReceiptHome";
import { ReceiptBaseStyles, receiptTheme } from "../home/ReceiptTheme";
import { useGlobalConfig, useActiveTemplateId } from "../../contexts/GlobalConfigContext";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n);
const CHART_FONT = "var(--font-chakra),'Chakra Petch',var(--font-plex-thai),system-ui,sans-serif";

// Receipt-styled recharts tooltip — a small receipt card (hairline tooth, mono value).
function RcTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const name = label || p?.name || p?.payload?.name;
  return (
    <div className="rc-tip">
      <span className="rc-tip__name">{name}</span>
      <span className="rc-tip__val">{(p?.value || 0).toLocaleString()} คน</span>
    </div>
  );
}

export default function ReceiptResults({
  candidates = [], totalVotes = 0, demographics = {}, finalStatus = "WAITING",
  isRevealed = false, isNotStarted = false, countdownText = "", onSelectParty = () => {}, editorMode = false,
}) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";
  const faculty = gc.facultyShortEn || "FMS";
  const calYear = gc.electionCalendarYear ?? "";
  const copyrightYear = gc.copyrightYear ?? "";

  // resolve the active Receipt palette (same read as ReceiptBaseStyles) for chart
  // fills — SVG fill attributes do not resolve var(--rc-*), so charts pull real hex
  // from the SAME palette source. No semantic vote colour is introduced or touched.
  const activeSlug = useActiveTemplateId();
  const [previewSlug, setPreviewSlug] = useState(null);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("slug");
    if (s && s.startsWith("receipt")) setPreviewSlug(s);
  }, []);
  const t = receiptTheme(previewSlug || activeSlug);
  // categorical chart ramp — brand accent + deep accent + two in-palette inks. Stays
  // warm/purple; never reaches for the vote semantic greens/reds/oranges.
  const CHART = [t.accent, t.accentDeep, t.ink2, t.faint];

  const revealed = !!isRevealed;
  const ended = finalStatus === "ENDED";

  const totalEligible = demographics?.totalEligible || 0;
  const turnout = totalEligible > 0 ? (totalVotes / totalEligible) * 100 : 0;

  const parties = candidates.filter((c) => parseInt(c.number) > 0);
  const singleParty = parties.length === 1; // approve / disapprove ballot, not a race

  const pctOf = (c) => (totalVotes > 0 ? ((c?.score || 0) / totalVotes) * 100 : 0);
  const subOf = (c) => {
    const n = parseInt(c.number);
    return n > 0 ? `PARTY NO. ${pad2(c.number)}` : (n === 0 ? "ABSTAIN · งดออกเสียง" : "DISAPPROVE · ไม่รับรอง");
  };

  // winner = highest score in the eligible pool (parties, plus DISAPPROVE only in a
  // single-party ballot); geometry-only marker, never for งดออกเสียง or a 0 tally.
  const winnerId = useMemo(() => {
    if (!revealed) return null;
    const pool = candidates.filter((c) => {
      const n = parseInt(c.number);
      return n > 0 || (singleParty && n === -1);
    });
    let top = null;
    pool.forEach((c) => { if ((c.score || 0) > (top?.score ?? -1)) top = c; });
    return top && (top.score || 0) > 0 ? top.id : null;
  }, [candidates, revealed, singleParty]);

  const clean = (arr) => (arr || []).filter((d) => d && d.name != null && String(d.name).trim() !== "");
  const byYear = clean(demographics?.byYear);
  const byGender = clean(demographics?.byGender);
  const byMajor = clean(demographics?.byMajor);
  const genderTotal = byGender.reduce((a, b) => a + (b.value || 0), 0);

  const statusMono = isNotStarted
    ? "ยังไม่เปิด · POLLS NOT OPEN"
    : revealed
      ? (ended ? "ผลอย่างเป็นทางการ · FINAL RESULT" : "เรียลไทม์ · LIVE RESULT")
      : (ended ? "รอประกาศผล · AWAITING" : "กำลังนับคะแนน · COUNTING");

  const deckCopy = revealed
    ? "ใบสรุปคะแนนเสียงการเลือกตั้ง ไล่รายพรรคตามจำนวนคะแนนที่ได้รับ พร้อมสถิติผู้ใช้สิทธิ์"
    : "สรุปยอดผู้ใช้สิทธิ์แบบเรียลไทม์ ผลคะแนนรายพรรคจะปลดผนึกพร้อมกันเมื่อปิดหีบเลือกตั้ง";

  const lockNote = ended
    ? "ปิดหีบแล้ว · รอประกาศผลอย่างเป็นทางการ"
    : countdownText
      ? `ปิดหีบในอีก · ${countdownText}`
      : "รอเปิดหีบเลือกตั้ง";

  const hasDemo = byYear.length > 0 || byGender.length > 0 || byMajor.length > 0;

  return (
    <div className="fms-app rc-root rc-res-root rc-desk">
      <ReceiptBaseStyles />

      <ReceiptTopBar editorMode={editorMode} active="/results" />

      {/* blind-emboss seals pressed into the desk paper (shared .rc-desk-seals) */}
      <div className="rc-desk-seals" aria-hidden="true">
        <span className="rc-seal rc-seal--a"><i /><b /></span>
        <span className="rc-seal rc-seal--b"><i /><b /></span>
        <span className="rc-seal rc-seal--c"><i /><b /></span>
      </div>

      <div className="rc-res-wrap">
        {/* ===== issue / eyebrow line ===== */}
        <div className="rc-issue">
          <span>ผลคะแนน · RESULTS</span>
          <span>{prefix} {number}</span>
        </div>

        {/* ===== masthead ===== */}
        <header className="rc-rhead">
          <span className="rc-rhead__eyebrow"><span className="rc-rhead__dot" aria-hidden="true" />{statusMono}</span>
          <h1 className="rc-rhead__title">ผลคะแนน</h1>
          <p className="rc-rhead__deck">{deckCopy}</p>
        </header>

        {isNotStarted ? (
          /* ---- polls-not-open: a quiet taped slip ---- */
          <section className="rc-res-empty">
            <span className="rc-res-empty__lab">POLLS NOT OPEN</span>
            <span className="rc-res-empty__th">ยังไม่เปิดรับลงคะแนน</span>
            <span className="rc-res-empty__sub">ผลการเลือกตั้งจะปรากฏที่นี่เมื่อเริ่มการลงคะแนน</span>
          </section>
        ) : (
          <>
            {/* ===== public FIGURES — the turnout register block ===== */}
            <section className="rc-res-figs" aria-label="สรุปยอดผู้ใช้สิทธิ์">
              <div className="rc-res-tape">
                <div className="rc-rfig">
                  <span className="rc-rfig__k"><span className="rc-live-dot" aria-hidden="true" />ใช้สิทธิ์แล้ว · TOTAL VOTES</span>
                  <span className="rc-rfig__n">{fmt(totalVotes)}<small>เสียง</small></span>
                </div>
                <div className="rc-rfig">
                  <span className="rc-rfig__k">อัตราการใช้สิทธิ์ · TURNOUT</span>
                  <span className="rc-rfig__n">{turnout.toFixed(1)}<small>%</small></span>
                </div>
                <div className="rc-rfig__bar" aria-hidden="true"><span style={{ width: `${Math.min(100, turnout)}%` }} /></div>
                <div className="rc-rfig">
                  <span className="rc-rfig__k">ผู้มีสิทธิ์ · ELIGIBLE</span>
                  <span className="rc-rfig__n">{fmt(totalEligible)}<small>คน</small></span>
                </div>
              </div>
            </section>

            {revealed ? (
              <>
                {/* ===== register-tape standings ===== */}
                <section className="rc-res-rank">
                  <div className="rc-res-sechead">
                    <span className="rc-res-sechead__kick">{singleParty ? "ผลการรับรอง · VERDICT" : "อันดับคะแนน · STANDINGS"}</span>
                    <h2 className="rc-res-sechead__h">{singleParty ? "ผลการรับรองพรรค" : "การกระจายคะแนนรายพรรค"}</h2>
                  </div>

                  <ol className="rc-standings">
                    <li className="rc-standings-head" aria-hidden="true">
                      <span>ITEM · รายการ</span><span>คะแนน · VOTES</span>
                    </li>
                    {candidates.map((c, i) => {
                      const n = parseInt(c.number);
                      const isWin = c.id === winnerId;
                      const isPseudo = n <= 0;
                      const pct = pctOf(c);
                      const cls = `rc-srow${isWin ? " is-win" : ""}${isPseudo ? " is-pseudo" : ""}`;
                      const inner = (
                        <>
                          <span className="rc-srow__idx">{pad2(i + 1)}</span>
                          <span className="rc-srow__body">
                            <span className="rc-srow__kick">{subOf(c)}</span>
                            <span className="rc-srow__name">
                              {c.name}
                              {isWin && <span className="rc-srow__stamp">ผู้ชนะ · WINNER</span>}
                            </span>
                          </span>
                          <span className="rc-srow__data">
                            <span className="rc-srow__num">{fmt(c.score || 0)}<small>เสียง</small></span>
                            <span className="rc-srow__track" aria-hidden="true"><span style={{ width: `${Math.max(pct, c.score > 0 ? 2 : 0)}%` }} /></span>
                            <span className="rc-srow__pct">{pct.toFixed(1)}%</span>
                          </span>
                        </>
                      );
                      return (
                        <li key={c.id || i} className={cls}>
                          {n > 0 ? (
                            <button type="button" className="rc-srow__link" onClick={() => onSelectParty(c)}>{inner}</button>
                          ) : (
                            <div className="rc-srow__link rc-srow__link--static">{inner}</div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                  <div className="rc-standings-foot" aria-hidden="true">◆ ◆ ◆ สรุปผลคะแนน ◆ ◆ ◆</div>
                </section>

                {/* ===== demographics — EXISTING recharts wrapped in paper panels ===== */}
                {hasDemo && (
                  <section className="rc-res-demo">
                    <div className="rc-res-sechead">
                      <span className="rc-res-sechead__kick">สถิติผู้ใช้สิทธิ์ · TURNOUT</span>
                      <h2 className="rc-res-sechead__h">ประชากรผู้มาใช้สิทธิ์</h2>
                    </div>
                    <div className="rc-demo-grid">
                      {byGender.length > 0 && (
                        <div className="rc-panel">
                          <div className="rc-panel__cap"><span>เพศ · BY GENDER</span><em>§ 01</em></div>
                          <div className="rc-donut">
                            <ResponsiveContainer width="100%" height={230}>
                              <PieChart>
                                <Pie data={byGender} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                  innerRadius={58} outerRadius={86} paddingAngle={3} stroke={t.receipt} strokeWidth={3}
                                  startAngle={90} endAngle={-270} isAnimationActive={false}>
                                  {byGender.map((g, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
                                </Pie>
                                <Tooltip content={<RcTooltip />} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="rc-donut__c"><strong>{genderTotal.toLocaleString()}</strong><span>คน</span></div>
                          </div>
                          <div className="rc-legend">
                            {byGender.map((g, i) => (
                              <span className="rc-legend__i" key={i}>
                                <i style={{ background: CHART[i % CHART.length] }} />{g.name}<b>{(g.value || 0).toLocaleString()}</b>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {byYear.length > 0 && (
                        <div className="rc-panel">
                          <div className="rc-panel__cap"><span>ชั้นปี · BY YEAR</span><em>§ 02</em></div>
                          <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={byYear} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                              <CartesianGrid vertical={false} stroke={t.line} />
                              <XAxis dataKey="name" tick={{ fontFamily: CHART_FONT, fontSize: 12, fontWeight: 600, fill: t.ink }} tickLine={false} axisLine={{ stroke: t.ink }} />
                              <YAxis allowDecimals={false} width={34} tick={{ fontFamily: CHART_FONT, fontSize: 11, fill: t.ink2 }} tickLine={false} axisLine={false} />
                              <Tooltip content={<RcTooltip />} cursor={{ fill: `color-mix(in srgb, ${t.accent} 10%, transparent)` }} />
                              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={62} isAnimationActive={false}>
                                {byYear.map((_, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {byMajor.length > 0 && (
                        <div className="rc-panel rc-panel--wide">
                          <div className="rc-panel__cap"><span>สาขา · BY MAJOR</span><em>§ 03</em></div>
                          <ResponsiveContainer width="100%" height={Math.max(240, byMajor.length * 46)}>
                            <BarChart data={byMajor} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 4 }}>
                              <CartesianGrid horizontal={false} stroke={t.line} />
                              <XAxis type="number" hide allowDecimals={false} />
                              <YAxis type="category" dataKey="name" width={140} tick={{ fontFamily: CHART_FONT, fontSize: 12, fontWeight: 600, fill: t.ink }} tickLine={false} axisLine={{ stroke: t.ink }} />
                              <Tooltip content={<RcTooltip />} cursor={{ fill: `color-mix(in srgb, ${t.accent} 10%, transparent)` }} />
                              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={26} isAnimationActive={false}
                                label={{ position: "right", fontFamily: CHART_FONT, fontSize: 12, fontWeight: 700, fill: t.ink, formatter: (v) => (v || 0).toLocaleString() }}>
                                {byMajor.map((_, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </>
            ) : (
              /* ===== EMBARGO — the receipt is SEALED (no score in the DOM) ===== */
              <section className="rc-res-seal" aria-label="ผลคะแนนถูกผนึกไว้">
                <div className="rc-seal-slip">
                  {/* holo-foil security strip stamped SEALED across the slip */}
                  <div className="rc-seal-strip" aria-hidden="true">
                    <span className="rc-foil" />
                    <span className="rc-seal-strip__txt">SEALED · ปิดผนึก · SEALED · ปิดผนึก</span>
                  </div>
                  <div className="rc-seal-cap"><span className="rc-seal-cap__dia" aria-hidden="true" />ปิดผนึกไว้ · EMBARGOED</div>
                  <h2 className="rc-seal-head">ผลคะแนนถูกผนึกไว้</h2>
                  <p className="rc-seal-deck">
                    {singleParty
                      ? "ผลการรับรองและสถิติผู้ใช้สิทธิ์จะเปิดเผยเมื่อปิดหีบเลือกตั้ง เพื่อความโปร่งใสและเป็นธรรม"
                      : "ผลคะแนนรายพรรคและสถิติผู้ใช้สิทธิ์จะเปิดเผยพร้อมกันเมื่อปิดหีบเลือกตั้ง เพื่อความเป็นธรรมกับทุกพรรค"}
                  </p>
                  <div className="rc-perf" aria-hidden="true" />
                  <div className="rc-seal-note">{lockNote}</div>
                  <div className="rc-seal-foot" aria-hidden="true">◆ {faculty} ELECTION{calYear !== "" ? ` · ${calYear}` : ""} ◆</div>
                </div>
              </section>
            )}
          </>
        )}

        {/* ===== footer — classic single centered line ===== */}
        <footer className="rc-res-footer">
          <p>© FMS@PSU{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
        </footer>
      </div>

      <style jsx global>{`
        /* ================= BASE (the polling desk) ================= */
        /* laid-paper ::after + desk vignette ::before + emboss seals + holo foil come
           from the SHARED .rc-desk classes in ReceiptBaseStyles (R3 T1) — this root
           opts in via the rc-desk class, matching the home reference language. */
        .rc-res-root { --rc-stamp-red:#B91C1C; overflow-x:hidden; }

        :where(.rc-res-root) a { text-decoration:none; color:var(--rc-ink); }
        .rc-res-root a:focus-visible, .rc-res-root button:focus-visible {
          outline:2px solid var(--rc-accent-deep); outline-offset:3px; }

        /* ---- topbar (ported 1:1 from ReceiptHome, scoped to .rc-res-root) ---- */
        .rc-res-root .rc-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--rc-desk) 88%, transparent);
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px); }
        .rc-res-root .rc-topbar::after { content:""; position:absolute; left:0; right:0; bottom:0; height:1.5px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-res-root .rc-topbar__in { max-width:1120px; margin:0 auto; padding:12px 20px;
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .rc-res-root .rc-logo { display:inline-flex; align-items:center; flex-shrink:0; }
        .rc-res-root .rc-logo__img { height:30px; width:auto; object-fit:contain; display:block; }
        .rc-res-root .rc-nav { display:none; gap:20px; margin-left:auto; align-items:center; }
        .rc-res-root .rc-nav__link { font-family:var(--rc-fm); font-size:11px; letter-spacing:.16em;
          text-transform:uppercase; color:var(--rc-ink2); position:relative; padding-bottom:2px; transition:color .2s ease; }
        .rc-res-root .rc-nav__link.on, .rc-res-root .rc-nav__link:hover { color:var(--rc-ink); }
        .rc-res-root .rc-nav__link::after { content:""; position:absolute; left:0; right:0; bottom:-3px; height:2px;
          background:var(--rc-accent); transform:scaleX(0); transform-origin:left;
          transition:transform .28s cubic-bezier(.22,1,.36,1); }
        .rc-res-root .rc-nav__link:hover::after, .rc-res-root .rc-nav__link.on::after { transform:scaleX(1); }
        .rc-res-root .rc-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .rc-res-root .rc-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--rc-fh);
          font-weight:600; font-size:13px; color:var(--rc-on-accent); background:var(--rc-accent); border:none; cursor:pointer;
          padding:9px 20px; border-radius:var(--rc-radius-button, 8px); transition:background .2s ease, transform .15s ease; }
        .rc-res-root .rc-loginbtn:hover { background:var(--rc-accent-deep); transform:translateY(-1px); }
        .rc-res-root .rc-loginbtn:active { transform:scale(.96); }
        .rc-res-root .rc-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--rc-line) 70%, var(--rc-receipt)); }
        .rc-res-root .rc-skelbar { display:block; width:58px; height:12px; border-radius:3px;
          background:color-mix(in srgb, var(--rc-ink2) 30%, var(--rc-receipt)); animation:rcPulse 1.3s ease-in-out infinite; }
        @keyframes rcPulse { 0%,100%{opacity:.45} 50%{opacity:1} }
        .rc-res-root .rc-userchip { position:relative; }
        .rc-res-root .rc-userchip__btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; background:var(--rc-receipt);
          border:1.5px solid var(--rc-stamp-line); border-radius:var(--rc-radius-button, 8px); padding:5px 12px 5px 5px; cursor:pointer;
          font-family:inherit; transition:transform .15s ease, border-color .2s ease; }
        .rc-res-root .rc-userchip__btn:hover { border-color:var(--rc-accent); }
        .rc-res-root .rc-userchip__btn:active { transform:scale(.97); }
        .rc-res-root .rc-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:var(--rc-accent); color:var(--rc-on-accent); font-family:var(--rc-fh); font-weight:700; font-size:14px; line-height:1; }
        .rc-res-root .rc-userchip__name { font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-res-root .rc-userchip__caret { color:var(--rc-ink2); font-size:11px; }
        .rc-res-root .rc-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--rc-receipt);
          border:1.5px solid var(--rc-stamp-line); border-radius:10px; overflow:hidden; z-index:50;
          box-shadow:2px 20px 42px -20px color-mix(in srgb, var(--rc-ink) 22%, transparent); }
        .rc-res-root .rc-usermenu__head { padding:14px 16px; border-bottom:1px dotted var(--rc-line); }
        .rc-res-root .rc-usermenu__name { font-family:var(--rc-fh); font-weight:700; font-size:14px; color:var(--rc-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-res-root .rc-usermenu__id { font-family:var(--rc-fm); font-size:10.5px; letter-spacing:.04em; color:var(--rc-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-res-root .rc-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-accent-deep); }
        .rc-res-root .rc-usermenu__out:hover { background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); }
        .rc-res-root .rc-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:8px; background:var(--rc-receipt); border:1.5px solid var(--rc-stamp-line); cursor:pointer;
          transition:transform .15s ease, border-color .2s ease; }
        .rc-res-root .rc-burger:hover { border-color:var(--rc-accent); }
        .rc-res-root .rc-burger:active { transform:scale(.95); }
        .rc-res-root .rc-burger span { display:block; height:2.5px; border-radius:2px; background:var(--rc-ink); }
        .rc-res-root .rc-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .rc-res-root .rc-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .rc-res-root .rc-sheet__link { display:flex; align-items:center; min-height:44px; padding:11px 16px; border-radius:8px;
          font-family:var(--rc-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--rc-ink);
          background:var(--rc-receipt); border:1px solid var(--rc-line); transition:border-color .2s ease; }
        .rc-res-root .rc-sheet__link:hover { border-color:var(--rc-accent); }

        /* ---- page container ---- */
        .rc-res-root .rc-res-wrap { position:relative; z-index:1; max-width:1120px; margin:0 auto; padding:0 20px 40px; }

        .rc-res-root .rc-issue { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:14px 0;
          border-bottom:1px dotted var(--rc-line); font-family:var(--rc-fm); font-size:10px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--rc-faint); }

        /* ---- masthead ---- */
        .rc-res-root .rc-rhead { margin-top:30px; padding-bottom:22px; border-bottom:1px dotted var(--rc-line); }
        .rc-res-root .rc-rhead__eyebrow { display:inline-flex; align-items:center; gap:9px; font-family:var(--rc-fm);
          font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--rc-ink2); }
        .rc-res-root .rc-rhead__dot { width:7px; height:7px; border-radius:50%; background:var(--rc-accent);
          animation:rcBlip 1.6s infinite; }
        @keyframes rcBlip { 50%{opacity:.3} }
        .rc-res-root .rc-rhead__title { margin:12px 0 0; font-family:var(--rc-fh); font-weight:700; line-height:1.05;
          letter-spacing:-.01em; font-size:clamp(34px, 8.6vw, 72px); color:var(--rc-ink); }
        .rc-res-root .rc-rhead__deck { margin:14px 0 0; max-width:56ch; font-family:var(--rc-fr); font-size:15px;
          line-height:1.7; color:var(--rc-ink2); }

        /* ---- polls-not-open notice (a quiet taped slip) ---- */
        .rc-res-root .rc-res-empty { margin-top:36px; padding:56px 24px; background:var(--rc-receipt);
          border:1px dashed var(--rc-stamp-line); border-radius:4px; text-align:center;
          display:flex; flex-direction:column; gap:10px; align-items:center;
          box-shadow:2px 14px 30px -18px color-mix(in srgb, var(--rc-ink) 26%, transparent); }
        .rc-res-root .rc-res-empty__lab { font-family:var(--rc-fm); font-size:11px; letter-spacing:.24em;
          text-transform:uppercase; color:var(--rc-faint); }
        .rc-res-root .rc-res-empty__th { font-family:var(--rc-fh); font-weight:700; font-size:clamp(20px,5vw,28px); color:var(--rc-ink); }
        .rc-res-root .rc-res-empty__sub { font-family:var(--rc-fr); font-size:14px; color:var(--rc-ink2); max-width:420px; }

        /* ---- public figures — turnout register block (manila note stock) ---- */
        .rc-res-root .rc-res-figs { margin-top:30px; }
        .rc-res-root .rc-res-tape { position:relative; background:var(--rc-note); border-radius:3px;
          padding:20px 20px 16px; border:1px solid color-mix(in srgb, var(--rc-note) 80%, var(--rc-ink));
          box-shadow:2px 14px 28px -16px color-mix(in srgb, var(--rc-ink) 30%, transparent); }
        .rc-res-root .rc-rfig { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
          padding:9px 0; border-bottom:1px dotted var(--rc-line); }
        .rc-res-root .rc-rfig:last-child { border-bottom:none; }
        .rc-res-root .rc-rfig__k { font-family:var(--rc-fm); font-size:10px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--rc-ink2); display:inline-flex; align-items:center; }
        .rc-res-root .rc-rfig__n { font-family:var(--rc-fr); font-weight:700; font-size:clamp(26px,6vw,34px); color:var(--rc-ink);
          font-variant-numeric:tabular-nums; letter-spacing:.01em; }
        .rc-res-root .rc-rfig__n small { font-family:var(--rc-fm); font-size:10px; font-weight:400; color:var(--rc-ink2);
          margin-left:5px; letter-spacing:.04em; }
        .rc-res-root .rc-rfig__bar { height:3px; border-radius:2px; margin:2px 0 4px; overflow:hidden;
          background:color-mix(in srgb, var(--rc-line) 60%, var(--rc-receipt)); }
        .rc-res-root .rc-rfig__bar > span { display:block; height:100%; border-radius:2px; background:var(--rc-accent);
          transition:width .6s ease; }
        .rc-res-root .rc-live-dot { width:6px; height:6px; border-radius:50%; background:var(--rc-accent); margin-right:6px;
          animation:rcBlip 1.6s infinite; }

        /* ---- section head (shared: rank + demo) ---- */
        .rc-res-root .rc-res-sechead { margin-top:44px; padding-bottom:14px; border-bottom:1px dotted var(--rc-line); }
        .rc-res-root .rc-res-sechead__kick { font-family:var(--rc-fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase;
          color:var(--rc-ink2); }
        .rc-res-root .rc-res-sechead__h { margin:8px 0 0; font-family:var(--rc-fh); font-weight:700; font-size:clamp(22px,5.4vw,32px);
          line-height:1.12; letter-spacing:-.01em; color:var(--rc-ink); }

        /* ---- register-tape standings — one long receipt of line items ---- */
        .rc-res-root .rc-standings { list-style:none; margin:24px 0 0; padding:22px 20px 8px; position:relative;
          background:var(--rc-receipt); border:1px solid var(--rc-line); border-radius:4px 4px 0 0;
          background-image:repeating-linear-gradient(180deg, transparent 0 30px, color-mix(in srgb, var(--rc-ink) 3%, transparent) 30px 31px);
          box-shadow:2px 16px 34px -20px color-mix(in srgb, var(--rc-ink) 34%, transparent); }
        .rc-res-root .rc-standings-head { display:flex; align-items:center; justify-content:space-between;
          padding-bottom:10px; margin-bottom:4px; border-bottom:1.5px solid var(--rc-ink);
          font-family:var(--rc-fm); font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--rc-faint); }
        .rc-res-root .rc-srow { border-bottom:1px dotted var(--rc-line); }
        .rc-res-root .rc-srow:last-child { border-bottom:none; }
        .rc-res-root .rc-srow__link { width:100%; display:grid; grid-template-columns:auto 1fr; gap:6px 14px; align-items:center;
          padding:16px 4px; background:none; border:0; text-align:left; color:var(--rc-ink); font-family:inherit;
          transition:background .22s ease, padding-left .22s ease; }
        .rc-res-root button.rc-srow__link { cursor:pointer; }
        .rc-res-root button.rc-srow__link:hover { background:color-mix(in srgb, var(--rc-accent) 6%, var(--rc-receipt)); padding-left:10px; }
        .rc-res-root button.rc-srow__link:active { background:color-mix(in srgb, var(--rc-accent) 10%, var(--rc-receipt)); }
        .rc-res-root .rc-srow__idx { font-family:var(--rc-fm); font-weight:700; font-size:clamp(14px,3.4vw,18px);
          font-variant-numeric:tabular-nums; letter-spacing:.08em; color:var(--rc-faint); width:32px; flex:none; align-self:start; padding-top:4px; }
        .rc-res-root .rc-srow__body { min-width:0; display:flex; flex-direction:column; gap:3px; }
        .rc-res-root .rc-srow__kick { font-family:var(--rc-fm); font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--rc-ink2); }
        .rc-res-root .rc-srow__name { font-family:var(--rc-fh); font-weight:700; font-size:clamp(18px,4.4vw,26px); line-height:1.14;
          letter-spacing:-.01em; color:var(--rc-ink); display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .rc-res-root button.rc-srow__link:hover .rc-srow__name { color:var(--rc-accent-deep); }
        .rc-res-root .rc-srow__stamp { font-family:var(--rc-fm); font-size:9px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--rc-accent-deep); border:1.5px solid var(--rc-accent-deep); border-radius:4px; padding:3px 9px;
          transform:rotate(-3deg); }
        .rc-res-root .rc-srow__data { grid-column:2; display:grid; grid-template-columns:1fr; gap:7px; margin-top:5px; }
        .rc-res-root .rc-srow__num { font-family:var(--rc-fr); font-weight:700; font-size:clamp(28px,7vw,44px); line-height:1;
          font-variant-numeric:tabular-nums; letter-spacing:-.01em; color:var(--rc-ink); }
        .rc-res-root .rc-srow__num small { font-family:var(--rc-fm); font-size:.3em; font-weight:400; color:var(--rc-ink2); margin-left:6px; letter-spacing:.04em; }
        .rc-res-root .rc-srow.is-win .rc-srow__num { color:var(--rc-accent-deep); }
        .rc-res-root .rc-srow.is-pseudo .rc-srow__num { color:var(--rc-faint); }
        .rc-res-root .rc-srow__track { height:5px; border-radius:3px; overflow:hidden;
          background:color-mix(in srgb, var(--rc-line) 60%, var(--rc-receipt)); }
        .rc-res-root .rc-srow__track > span { display:block; height:100%; border-radius:3px; background:var(--rc-accent);
          transition:width .7s cubic-bezier(.16,1,.3,1); }
        .rc-res-root .rc-srow.is-win .rc-srow__track > span { background:var(--rc-accent-deep); }
        .rc-res-root .rc-srow.is-pseudo .rc-srow__track > span { background:var(--rc-faint); }
        .rc-res-root .rc-srow__pct { font-family:var(--rc-fm); font-size:12px; letter-spacing:.06em; color:var(--rc-ink2);
          font-variant-numeric:tabular-nums; }
        /* jagged receipt tear at the very bottom of the tape */
        .rc-res-root .rc-standings-foot { position:relative; text-align:center; padding:14px 0 20px; margin-top:-1px;
          background:var(--rc-receipt); font-family:var(--rc-fm); font-size:9px; letter-spacing:.24em; color:var(--rc-faint);
          box-shadow:2px 16px 34px -20px color-mix(in srgb, var(--rc-ink) 34%, transparent);
          -webkit-mask:radial-gradient(6px 8px at 8px 100%, transparent 96%, #000) bottom left/16px 8px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat;
                  mask:radial-gradient(6px 8px at 8px 100%, transparent 96%, #000) bottom left/16px 8px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat; }

        /* ---- demographics panels (frame restyled; recharts internals untouched) ---- */
        .rc-res-root .rc-demo-grid { display:grid; grid-template-columns:1fr; gap:18px; margin-top:26px; }
        .rc-res-root .rc-panel { background:var(--rc-receipt); border:1px solid var(--rc-line); border-radius:4px; padding:20px 20px 22px;
          box-shadow:2px 14px 30px -18px color-mix(in srgb, var(--rc-ink) 28%, transparent); }
        .rc-res-root .rc-panel__cap { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
          padding-bottom:12px; margin-bottom:14px; border-bottom:1px dotted var(--rc-line); }
        .rc-res-root .rc-panel__cap span { font-family:var(--rc-fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--rc-ink); }
        .rc-res-root .rc-panel__cap em { font-family:var(--rc-fm); font-style:normal; font-size:9.5px; letter-spacing:.14em; color:var(--rc-accent-deep); }
        .rc-res-root .rc-donut { position:relative; }
        .rc-res-root .rc-donut__c { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; }
        .rc-res-root .rc-donut__c strong { font-family:var(--rc-fr); font-weight:700; font-size:30px; line-height:1; color:var(--rc-ink); font-variant-numeric:tabular-nums; }
        .rc-res-root .rc-donut__c span { font-family:var(--rc-fm); font-size:10px; color:var(--rc-ink2); margin-top:2px; }
        .rc-res-root .rc-legend { display:flex; flex-wrap:wrap; justify-content:center; gap:9px; margin-top:14px; }
        .rc-res-root .rc-legend__i { display:inline-flex; align-items:center; gap:7px; font-family:var(--rc-fh); font-weight:600; font-size:13px;
          color:var(--rc-ink); background:var(--rc-desk); border:1px solid var(--rc-line); border-radius:4px; padding:5px 12px; }
        .rc-res-root .rc-legend__i i { width:12px; height:12px; border-radius:3px; display:inline-block; }
        .rc-res-root .rc-legend__i b { font-family:var(--rc-fm); font-weight:700; color:var(--rc-ink2); }
        .rc-res-root .rc-tip { display:flex; flex-direction:column; gap:2px; background:var(--rc-receipt); border:1.5px solid var(--rc-ink);
          border-radius:4px; box-shadow:2px 12px 26px -14px color-mix(in srgb, var(--rc-ink) 30%, transparent); padding:8px 12px; }
        .rc-res-root .rc-tip__name { font-family:var(--rc-fh); font-weight:700; font-size:13px; color:var(--rc-ink); }
        .rc-res-root .rc-tip__val { font-family:var(--rc-fm); font-size:12px; color:var(--rc-ink2); }

        /* ---- EMBARGO — the sealed receipt with a holo security strip ---- */
        .rc-res-root .rc-res-seal { margin-top:36px; display:flex; justify-content:center; }
        .rc-res-root .rc-seal-slip { position:relative; width:min(100%, 560px); background:var(--rc-receipt);
          border:1px solid var(--rc-line); border-radius:4px; padding:56px 26px 30px; overflow:hidden;
          box-shadow:2px 18px 40px -20px color-mix(in srgb, var(--rc-ink) 34%, transparent); }
        /* holo-foil security strip diagonally across the top, stamped SEALED */
        .rc-res-root .rc-seal-strip { position:absolute; top:26px; left:-40px; right:-40px; height:34px; z-index:2;
          transform:rotate(-4deg); overflow:hidden; display:grid; place-items:center;
          border-top:1px solid color-mix(in srgb, var(--rc-ink) 18%, transparent);
          border-bottom:1px solid color-mix(in srgb, var(--rc-ink) 18%, transparent); }
        .rc-res-root .rc-seal-strip .rc-foil { position:absolute; inset:0; opacity:.9; }
        .rc-res-root .rc-seal-strip__txt { position:relative; z-index:1; font-family:var(--rc-fm); font-weight:700;
          font-size:12px; letter-spacing:.32em; text-transform:uppercase; color:var(--rc-ink);
          mix-blend-mode:multiply; white-space:nowrap; }
        .rc-res-root .rc-seal-cap { margin-top:14px; display:flex; align-items:center; gap:12px; font-family:var(--rc-fm);
          font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:var(--rc-ink2); }
        .rc-res-root .rc-seal-cap__dia { width:9px; height:9px; flex:none; background:var(--rc-accent); transform:rotate(45deg); }
        .rc-res-root .rc-seal-cap::after { content:""; flex:1; height:1px; background:repeating-linear-gradient(90deg, var(--rc-line) 0 4px, transparent 4px 8px); }
        .rc-res-root .rc-seal-head { margin:16px 0 0; font-family:var(--rc-fh); font-weight:700; font-size:clamp(26px,7vw,40px);
          line-height:1.08; letter-spacing:-.01em; color:var(--rc-ink); }
        .rc-res-root .rc-seal-deck { margin:14px 0 0; font-family:var(--rc-fr); font-size:15px; line-height:1.7; color:var(--rc-ink2); }
        .rc-res-root .rc-res-seal .rc-perf { margin:22px -26px; height:1px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-res-root .rc-seal-note { display:inline-flex; align-items:center; font-family:var(--rc-fm); font-size:12px;
          letter-spacing:.1em; text-transform:uppercase; color:var(--rc-accent-deep); font-weight:700;
          font-variant-numeric:tabular-nums; }
        .rc-res-root .rc-seal-foot { margin-top:18px; text-align:center; font-family:var(--rc-fm); font-size:9px;
          letter-spacing:.24em; text-transform:uppercase; color:var(--rc-faint); }

        /* ---- footer ---- */
        .rc-res-root .rc-res-footer { margin-top:48px; padding:22px 0; border-top:1px dotted var(--rc-line); text-align:center; }
        .rc-res-root .rc-res-footer p { margin:0; font-family:var(--rc-fm); font-size:10px; letter-spacing:.12em;
          text-transform:uppercase; color:var(--rc-ink2); }

        /* ================= TABLET+ : inline nav replaces burger/sheet ================= */
        @media (min-width:768px) {
          .rc-res-root .rc-topbar__in { gap:22px; }
          .rc-res-root .rc-nav { display:flex; }
          .rc-res-root .rc-userwrap { margin-left:0; }
          .rc-res-root .rc-burger, .rc-res-root .rc-sheet { display:none; }
          .rc-res-root .rc-demo-grid { grid-template-columns:1fr 1fr; }
          .rc-res-root .rc-panel--wide { grid-column:1 / -1; }
          /* standings: score column moves beside the name */
          .rc-res-root .rc-srow__link { grid-template-columns:auto 1fr minmax(220px,320px); align-items:center; }
          .rc-res-root .rc-srow__data { grid-column:auto; margin-top:0; }
        }

        /* ================= MOBILE (<=420): tighten ================= */
        @media (max-width:420px) {
          .rc-res-root .rc-standings { padding:20px 14px 8px; }
          .rc-res-root .rc-seal--c { display:none; }
        }

        /* reduced motion — freeze every animation (foil stays statically iridescent),
           full page visible. Scoped to .rc-res-root. */
        @media (prefers-reduced-motion:reduce) {
          .rc-res-root *, .rc-res-root *::before, .rc-res-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
