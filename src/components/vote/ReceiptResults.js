"use client";

// ReceiptResults — RESULTS page for the "Receipt · Paper Materiality" template
// family (Template #6), in the print/desk language established by ReceiptHome
// (v2-R1.5) and the ballot pages (R3a: on-sheet masthead, circular ink stamps,
// ticket-stub chrome, lanyard cards). v2-R3b rebalances the DATA MOMENT away from
// a giant full-page roll (P-LOG-088 "หนักข้าง"): the standings are a CONTENT-WIDTH
// receipt STRIP offset to one side, and the public turnout + demographics sit as
// desk SCATTER on the other side, overlapping the strip's edge.
//   • the page title is now PRINTED on the results sheet (A5) — no floating
//     editorial H1. The strip's masthead is a mono serial + live status + big Thai
//     title + deck, on the same receipt stock as the standings below it.
//   • public FIGURES — the turnout register (total votes · turnout track · eligible)
//     ride a MANILA NOTE in the right rail. These are public turnout figures, never
//     per-party scores.
//   • EMBARGO (isRevealed false) — the receipt is a SEALED, tied-shut roll: a holo
//     security strip stamped "SEALED" + a string tie + a rolled bottom lip. Per-party
//     scores NEVER enter the DOM before reveal (the standings only render revealed).
//   • REVEALED — a register-tape standings list (index · name · big tabular score ·
//     ink track · %), the winner marked with a tilted two-ring "ผู้ชนะ · WINNER"
//     ink STAMP in SEMANTIC GREEN (theme-independent, never the brand accent). Then
//     turnout demographics as the EXISTING recharts (BarChart / PieChart) wrapped in
//     holo-taped report cards — the FRAME is restyled, the chart internals/props are
//     byte-identical to BlossomResults; only the categorical FILL ramp is ours.
//
// Pure presentation: results/page.js owns access control + data fetching + the 3s
// polling and hands the resolved data down (same prop contract as every other family
// Results). Colours flow ONLY through var(--rc-*) emitted by ReceiptBaseStyles on
// .rc-root; chart FILLS resolve from the SAME receipt palette source (receiptPalettes
// via receiptTheme) since var(--rc-*) does not resolve inside SVG fill attributes —
// the categorical ramp is re-derived from the theme accent (accent / accentDeep /
// accent 55% / accent 30%, computed as solid hex so it reads on every theme incl.
// achromatic carbon, where order + labels still carry meaning). No semantic vote
// colour is introduced except the winner's green. The shared desk language (laid
// paper / vignette / emboss seals / holo foil) comes from .rc-desk in
// ReceiptBaseStyles; the topbar mirrors the ReceiptHome/ReceiptVote ticket-stub skin.

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
// wrap the THAI runs of a runtime string in Chakra spans (A10.3 / ruling C4 — Space
// Mono has no Thai glyphs). Font-family only: text bytes + order stay identical.
const thaiSafe = (s) => String(s ?? "").split(/([฀-๿]+)/).map((part, i) =>
  /[฀-๿]/.test(part) ? <span className="rc-th" key={i}>{part}</span> : part);
const CHART_FONT = "var(--font-chakra),'Chakra Petch',var(--font-plex-thai),system-ui,sans-serif";

// mix two #rrggbb colours — `wa` is the weight of `a` (0..1), the rest is `b`. Used
// to derive the categorical chart ramp as SOLID hex tints of the theme accent over
// the receipt stock (SVG fill attributes don't resolve var()/color-mix reliably, so
// we hand recharts real hex). Never touches the semantic vote colours.
function mixHex(a, b, wa) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const ch = (x, y) => Math.round(x * wa + y * (1 - wa)).toString(16).padStart(2, "0");
  return `#${ch(ar, br)}${ch(ag, bg)}${ch(ab, bb)}`;
}

// Receipt-styled recharts tooltip — a small receipt card (hairline tooth, mono value).
function RcTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const name = label || p?.name || p?.payload?.name;
  return (
    <div className="rc-tip">
      <span className="rc-tip__name">{name}</span>
      <span className="rc-tip__val">{(p?.value || 0).toLocaleString()} <span className="rc-th">คน</span></span>
    </div>
  );
}

export default function ReceiptResults({
  candidates = [], totalVotes = 0, demographics = {}, finalStatus = "WAITING",
  isRevealed = false, isNotStarted = false, countdownText = "", editorMode = false,
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
  // categorical chart ramp — the theme accent, deepened, then two solid tints of the
  // accent over the receipt stock (55% / 30%). Reads as one warm/branded family on
  // every theme; on achromatic carbon the four steps separate by lightness (order +
  // labels carry the meaning). Never reaches for the vote semantic greens/reds/oranges.
  const CHART = [t.accent, t.accentDeep, mixHex(t.accent, t.receipt, 0.55), mixHex(t.accent, t.receipt, 0.30)];
  // DONUT ramp (v2-R6) — the SAME four ramp steps, re-ordered so adjacent categories
  // pull from OPPOSITE ends of the ramp (dark accentDeep → palest tint → mid → accent).
  // The gender donut is usually 2 categories; with CHART's order those were accent +
  // accentDeep (two near-identical darks). This order gives the 2-slice donut its
  // widest possible lightness gap while staying one branded family (no new hue, never
  // the vote semantics). Bars keep CHART (their extra categories read fine there).
  const DONUT = [t.accentDeep, mixHex(t.accent, t.receipt, 0.30), mixHex(t.accent, t.receipt, 0.55), t.accent];

  const revealed = !!isRevealed;
  const ended = finalStatus === "ENDED";

  const totalEligible = demographics?.totalEligible || 0;
  const turnout = totalEligible > 0 ? (totalVotes / totalEligible) * 100 : 0;

  const parties = candidates.filter((c) => parseInt(c.number) > 0);
  const singleParty = parties.length === 1; // approve / disapprove ballot, not a race

  const pctOf = (c) => (totalVotes > 0 ? ((c?.score || 0) / totalVotes) * 100 : 0);
  const subOf = (c) => {
    const n = parseInt(c.number);
    return n > 0 ? `PARTY NO. ${pad2(c.number)}` : (n === 0
      ? <>ABSTAIN · <span className="rc-th">งดออกเสียง</span></>
      : <>DISAPPROVE · <span className="rc-th">ไม่รับรอง</span></>);
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

  // owner round-5 (ข) — 3-layer hierarchy. Layer 1 = the WINNER HERO (the winning
  // party — or in a single-party ballot, the winning verdict — presented headline-
  // size at the top of the sheet). Layer 2 = the remaining standings, compact.
  // The winner row is EXTRACTED from the list; ranks keep the original array order
  // (call sites sort by score when revealed) so layer 2 numbering stays truthful.
  const winner = revealed ? candidates.find((c) => c.id === winnerId) : null;
  const standingRows = winner ? candidates.filter((c) => c.id !== winnerId) : candidates;
  const rankOf = (c) => pad2(candidates.indexOf(c) + 1);

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
    : "สรุปยอดผู้ใช้สิทธิ์แบบเรียลไทม์ ผลคะแนนรายพรรคจะปลดผนึกพร้อมกันเมื่อปิดโหวต";

  const lockNote = ended
    ? "ปิดโหวตแล้ว · รอประกาศผลอย่างเป็นทางการ"
    : countdownText
      ? `ปิดโหวตในอีก · ${countdownText}`
      : "รอเปิดโหวต";

  const hasDemo = byYear.length > 0 || byGender.length > 0 || byMajor.length > 0;
  const live = revealed && !ended;

  // the public turnout register — shared by both the revealed + sealed layouts (it is
  // public in every state), printed on a manila note in the right rail.
  const turnoutNote = (
    <div className="rc-rnote" aria-label="สรุปยอดผู้ใช้สิทธิ์">
      <span className="rc-rnote__pin rc-rnote__pin--l" aria-hidden="true" />
      <span className="rc-rnote__pin rc-rnote__pin--r" aria-hidden="true" />
      <div className="rc-rnote__cap"><span className="rc-mono">REGISTER</span><span>บันทึกผู้ใช้สิทธิ์</span></div>
      <div className="rc-rfig">
        <span className="rc-rfig__k">{live && <span className="rc-live-dot" aria-hidden="true" />}<span className="rc-th">ใช้สิทธิ์แล้ว</span> · TOTAL VOTES</span>
        <span className="rc-rfig__n">{fmt(totalVotes)}<small><span className="rc-th">เสียง</span></small></span>
      </div>
      <div className="rc-rfig">
        <span className="rc-rfig__k"><span className="rc-th">อัตราการใช้สิทธิ์</span> · TURNOUT</span>
        <span className="rc-rfig__n">{turnout.toFixed(1)}<small>%</small></span>
      </div>
      <div className="rc-rfig__bar" aria-hidden="true"><span style={{ width: `${Math.min(100, turnout)}%` }} /></div>
      <div className="rc-rfig">
        <span className="rc-rfig__k"><span className="rc-th">ผู้มีสิทธิ์</span> · ELIGIBLE</span>
        <span className="rc-rfig__n">{fmt(totalEligible)}<small><span className="rc-th">คน</span></small></span>
      </div>
    </div>
  );

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
          <span><span className="rc-th">ผลคะแนน</span> · RESULTS</span>
          <span>{prefix} {number}</span>
        </div>

        {isNotStarted ? (
          /* ---- polls-not-open: a quiet taped slip ---- */
          <section className="rc-res-empty">
            <span className="rc-res-empty__lab">POLLS NOT OPEN</span>
            <span className="rc-res-empty__th">ยังไม่เปิดรับลงคะแนน</span>
            <span className="rc-res-empty__sub">ผลการเลือกตั้งจะปรากฏที่นี่เมื่อเริ่มการลงคะแนน</span>
          </section>
        ) : revealed ? (
          /* ===== REVEALED — standings strip (offset left) + scatter rail (right) ===== */
          <div className="rc-res-stage">
            {/* ---- LEFT: the register-tape standings, masthead PRINTED on the sheet ---- */}
            <section className="rc-strip rc-strip--rank" aria-label="อันดับคะแนน">
              <div className="rc-strip-mast">
                <span className="rc-strip-serial rc-mono">RESULTS · No. {prefix} {number} · {pad2(parties.length)}</span>
                <span className="rc-strip-status">
                  {live && <span className="rc-strip-dot" aria-hidden="true" />}{statusMono}
                </span>
                <h1 className="rc-strip-title">ผลคะแนน</h1>
                <p className="rc-strip-deck">{deckCopy}</p>
                <span className="rc-strip-stamp rc-mono" aria-hidden="true">✶ {faculty} · OFFICIAL COUNT{calYear !== "" ? ` · ${calYear}` : ""} ✶</span>
              </div>
              <div className="rc-perf" aria-hidden="true" />

              {/* ===== LAYER 1 — WINNER HERO (3-second read: who won) =====
                  the winning party (or the winning verdict on a single-party ballot)
                  printed headline-size with the big green ผู้ชนะ · WINNER text stamp.
                  Semantic green only — never the brand accent; text-only stamp. */}
              {winner && (
                <section className="rc-hero" aria-label={singleParty ? "ผลการรับรอง" : "ผู้ชนะการเลือกตั้ง"}>
                  <div className="rc-hero__body">
                    <span className="rc-hero__kick rc-mono">
                      {singleParty ? <><span className="rc-th">ผลการรับรอง</span> · VERDICT</> : subOf(winner)}
                    </span>
                    <h2 className="rc-hero__name">{winner.name}</h2>
                    <div className="rc-hero__figs">
                      <span className="rc-hero__num">{fmt(winner.score || 0)}<small><span className="rc-th">เสียง</span></small></span>
                      <span className="rc-hero__pct rc-mono">{pctOf(winner).toFixed(1)}%</span>
                    </div>
                    <span className="rc-hero__track" aria-hidden="true"><span style={{ width: `${Math.max(pctOf(winner), 2)}%` }} /></span>
                  </div>
                  <span className="rc-herostamp" aria-hidden="true">
                    <span className="rc-herostamp__ring" />
                    <span className="rc-herostamp__txt">ผู้ชนะ<em>WINNER</em></span>
                  </span>
                </section>
              )}

              {/* ===== LAYER 2 — remaining standings, compact printed record ===== */}
              <div className="rc-strip-sechead">
                <span className="rc-strip-kick rc-mono">{winner ? "STANDINGS" : (singleParty ? "VERDICT" : "STANDINGS")}</span>
                <h2 className="rc-strip-h">
                  {winner
                    ? (singleParty ? "คะแนนตัวเลือกที่เหลือ" : "อันดับคะแนนที่เหลือ")
                    : (singleParty ? "ผลการรับรองพรรค" : "การกระจายคะแนนรายพรรค")}
                </h2>
              </div>

              <ol className="rc-standings">
                <li className="rc-standings-head" aria-hidden="true">
                  <span>ITEM · <span className="rc-th">รายการ</span></span><span><span className="rc-th">คะแนน</span> · VOTES</span>
                </li>
                {standingRows.map((c, i) => {
                  const n = parseInt(c.number);
                  const isPseudo = n <= 0;
                  const pct = pctOf(c);
                  return (
                    <li key={c.id || i} className={`rc-srow${isPseudo ? " is-pseudo" : ""}`}>
                      {/* owner round-5 (ก): standings rows are a PRINTED RECORD — never a
                          link. No button, no hover affordance, no cursor lie. */}
                      <div className="rc-srow__row">
                        <span className="rc-srow__idx">{rankOf(c)}</span>
                        <span className="rc-srow__body">
                          <span className="rc-srow__kick">{subOf(c)}</span>
                          <span className="rc-srow__name">{c.name}</span>
                        </span>
                        <span className="rc-srow__data">
                          <span className="rc-srow__num">{fmt(c.score || 0)}<small><span className="rc-th">เสียง</span></small></span>
                          <span className="rc-srow__track" aria-hidden="true"><span style={{ width: `${Math.max(pct, c.score > 0 ? 2 : 0)}%` }} /></span>
                          <span className="rc-srow__pct">{pct.toFixed(1)}%</span>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <div className="rc-standings-foot" aria-hidden="true">✶ ✶ ✶ <span className="rc-th">สรุปผลคะแนน</span> ✶ ✶ ✶</div>
            </section>

            {/* ---- RIGHT: scatter rail — LAYER 3, the general data, voiced down ---- */}
            <aside className="rc-res-rail">
              <span className="rc-rail-kick rc-mono" aria-hidden="true"><span className="rc-th">ข้อมูลประกอบ</span> · TURNOUT &amp; DEMOGRAPHICS</span>
              {turnoutNote}

              {hasDemo && (
                <div className="rc-reports">
                  {byGender.length > 0 && (
                    <div className="rc-report">
                      <span className="rc-report__tape" aria-hidden="true"><span className="rc-foil" /></span>
                      <div className="rc-panel__cap"><span><span className="rc-th">เพศ</span> · BY GENDER</span><em>§ 01</em></div>
                      <div className="rc-donut">
                        <ResponsiveContainer width="100%" height={230}>
                          <PieChart accessibilityLayer={false}>
                            <Pie data={byGender} dataKey="value" nameKey="name" cx="50%" cy="50%"
                              innerRadius={58} outerRadius={86} paddingAngle={3} stroke={t.receipt} strokeWidth={3}
                              startAngle={90} endAngle={-270} isAnimationActive={false}>
                              {byGender.map((g, i) => <Cell key={i} fill={DONUT[i % DONUT.length]} />)}
                            </Pie>
                            <Tooltip content={<RcTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="rc-donut__c"><strong>{genderTotal.toLocaleString()}</strong><span><span className="rc-th">คน</span></span></div>
                      </div>
                      <div className="rc-legend">
                        {byGender.map((g, i) => (
                          <span className="rc-legend__i" key={i}>
                            <i style={{ background: DONUT[i % DONUT.length] }} />{g.name}<b>{(g.value || 0).toLocaleString()}</b>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {byYear.length > 0 && (
                    <div className="rc-report">
                      <span className="rc-report__tape" aria-hidden="true"><span className="rc-foil" /></span>
                      <div className="rc-panel__cap"><span><span className="rc-th">ชั้นปี</span> · BY YEAR</span><em>§ 02</em></div>
                      <ResponsiveContainer width="100%" height={230}>
                        {/* left:0, not -18 — the negative margin pushed the Y axis off the
                            SVG's left edge, and an <svg> clips: the 3-digit ticks painted at
                            x 682.5 inside a wrapper starting at x 689.1, so "120"/"160" read
                            as ":0" on screen. width:34 already reserves room for them. */}
                        <BarChart accessibilityLayer={false} data={byYear} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
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
                    <div className="rc-report rc-report--wide">
                      <span className="rc-report__tape" aria-hidden="true"><span className="rc-foil" /></span>
                      <div className="rc-panel__cap"><span><span className="rc-th">สาขา</span> · BY MAJOR</span><em>§ 03</em></div>
                      <ResponsiveContainer width="100%" height={Math.max(240, byMajor.length * 46)}>
                        <BarChart accessibilityLayer={false} data={byMajor} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 4 }}>
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
              )}
            </aside>
          </div>
        ) : (
          /* ===== EMBARGO — a SEALED, tied-shut roll (no score in the DOM) ===== */
          <div className="rc-res-stage rc-res-stage--seal">
            <section className="rc-strip rc-strip--seal" aria-label="ผลคะแนนถูกผนึกไว้">
              <div className="rc-seal-slip">
                {/* holo-foil security strip stamped SEALED across the slip */}
                <div className="rc-seal-strip" aria-hidden="true">
                  <span className="rc-foil" />
                  <span className="rc-seal-strip__txt">SEALED · <span className="rc-th">ปิดผนึก</span> · SEALED · <span className="rc-th">ปิดผนึก</span></span>
                </div>
                {/* the string tie that keeps the roll shut (SVG, decorative) */}
                <svg className="rc-seal-tie" viewBox="0 0 400 60" aria-hidden="true" focusable="false" preserveAspectRatio="none">
                  <path className="rc-seal-tie__ln" d="M0 30 H160 M240 30 H400" />
                  <path className="rc-seal-tie__ln" d="M200 0 V60" />
                  <circle className="rc-seal-tie__knot" cx="200" cy="30" r="7" />
                  <path className="rc-seal-tie__bow" d="M200 30 C176 12, 160 20, 172 32 C160 44, 176 50, 200 30" />
                  <path className="rc-seal-tie__bow" d="M200 30 C224 12, 240 20, 228 32 C240 44, 224 50, 200 30" />
                </svg>
                <div className="rc-seal-cap"><span className="rc-seal-cap__dia" aria-hidden="true" /><span className="rc-th">ปิดผนึกไว้</span> · EMBARGOED</div>
                <h1 className="rc-seal-head">ผลคะแนนถูกผนึกไว้</h1>
                <p className="rc-seal-deck">
                  {singleParty
                    ? "ผลการรับรองและสถิติผู้ใช้สิทธิ์จะเปิดเผยเมื่อปิดโหวต เพื่อความโปร่งใสและเป็นธรรม"
                    : "ผลคะแนนรายพรรคและสถิติผู้ใช้สิทธิ์จะเปิดเผยพร้อมกันเมื่อปิดโหวต เพื่อความเป็นธรรมกับทุกพรรค"}
                </p>
                <div className="rc-perf" aria-hidden="true" />
                <div className="rc-seal-note">{thaiSafe(lockNote)}</div>
                <div className="rc-seal-foot" aria-hidden="true">✶ {faculty} ELECTION{calYear !== "" ? ` · ${calYear}` : ""} ✶</div>
                {/* rolled-up bottom lip — the receipt is still a wound coil */}
                <div className="rc-seal-roll" aria-hidden="true" />
              </div>
            </section>

            <aside className="rc-res-rail">
              {turnoutNote}
            </aside>
          </div>
        )}

        {/* ===== footer — classic single centered line ===== */}
        <footer className="rc-res-footer">
          <p>© {gc.facultyShortEn || "FMS"}@{gc.university || "PSU"}{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
        </footer>
      </div>

      <style jsx global>{`
        /* ================= BASE (the polling desk) ================= */
        /* laid-paper ::after + desk vignette ::before + emboss seals + holo foil come
           from the SHARED .rc-desk classes in ReceiptBaseStyles (R3 T1) — this root
           opts in via the rc-desk class, matching the home reference language. */
        /* clip not hidden — hidden makes overflow-y compute to auto, this root becomes the
           scroll container, and .rc-topbar's sticky pins to it instead of the viewport.
           xo=0 measured on every viewport, so no horizontal scroll is lost. */
        .rc-res-root { --rc-stamp-red:#B91C1C; --rc-win-green:#15803D; overflow-x:clip; }

        :where(.rc-res-root) a { text-decoration:none; color:var(--rc-ink); }
        .rc-res-root a:focus-visible, .rc-res-root button:focus-visible {
          outline:2px solid var(--rc-accent-deep); outline-offset:3px; }
        /* mono utility — ONLY Latin / digits / symbols ever wear it (A10.3) */
        .rc-res-root .rc-mono { font-family:var(--rc-fm); }
        /* Thai-in-a-mono-line utility — the Thai half of a bilingual mono label wears
           Chakra Petch so it never falls back (Space Mono has no Thai glyphs, C4) */
        .rc-res-root .rc-th { font-family:var(--rc-fr) !important; }

        /* ---- topbar "head of the desk" (A3 / ruling #4: NO backdrop-filter — opaque
           desk fill + a perforated hairline; ticket-stub nav ported from ReceiptHome) ---- */
        .rc-res-root .rc-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--rc-desk) 96%, var(--rc-receipt)); }
        .rc-res-root .rc-topbar::after { content:""; position:absolute; left:0; right:0; bottom:0; height:1.5px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-res-root .rc-topbar__in { max-width:1120px; margin:0 auto; padding:10px 20px;
          display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
        /* logo on a clipped paper tag with a tiny clip */
        .rc-res-root .rc-logo { position:relative; display:inline-flex; align-items:center; flex-shrink:0;
          padding:6px 12px 6px 14px; background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px);
          box-shadow:1px 3px 8px -5px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-res-root .rc-logo::before { content:""; position:absolute; left:-3px; top:8px; width:10px; height:18px;
          border:2px solid var(--rc-faint); border-right:none; border-radius:6px 0 0 6px; background:transparent; transform:rotate(-4deg); }
        .rc-res-root .rc-logo__img { height:28px; width:auto; object-fit:contain; display:block; }
        /* nav = a row of ticket STUBS (cut corner + left perforation); active = torn */
        .rc-res-root .rc-nav { display:none; gap:8px; margin-left:auto; align-items:center; }
        .rc-res-root .rc-nav__link { position:relative; display:inline-flex; align-items:center; min-height:40px;
          font-family:var(--rc-fr); font-weight:600; font-size:12.5px; letter-spacing:.01em; color:var(--rc-ink2);
          padding:0 13px 0 16px; background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px);
          transition:transform .15s ease, color .2s ease, background .2s ease, border-color .2s ease; }
        .rc-res-root .rc-nav__link::before { content:""; position:absolute; left:4px; top:7px; bottom:7px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 2px, transparent 2px 5px); }
        .rc-res-root .rc-nav__link:hover { transform:translateY(-1px); color:var(--rc-ink); border-color:var(--rc-accent); }
        .rc-res-root .rc-nav__link.on { color:var(--rc-accent-deep); border-color:var(--rc-accent);
          background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); }
        .rc-res-root .rc-nav__link.on::before { left:1px;
          background:repeating-linear-gradient(180deg, var(--rc-accent) 0 2px, transparent 2px 5px); }
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
        /* user chip = a LANYARD CARD (cut corner + a punched grommet hole on top) */
        .rc-res-root .rc-userchip { position:relative; }
        .rc-res-root .rc-userchip__btn { position:relative; display:inline-flex; align-items:center; gap:9px; min-height:44px;
          background:var(--rc-receipt); border:1.5px solid var(--rc-stamp-line); padding:5px 14px 5px 5px; cursor:pointer;
          font-family:inherit; clip-path:polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
          transition:transform .15s ease, border-color .2s ease; }
        .rc-res-root .rc-userchip__btn::after { content:""; position:absolute; top:5px; right:12px; width:9px; height:9px;
          border-radius:50%; background:var(--rc-desk);
          box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--rc-faint) 62%, var(--rc-ink2)); }
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
        .rc-res-root .rc-sheet__link { position:relative; display:flex; align-items:center; min-height:48px; padding:0 16px 0 20px;
          font-family:var(--rc-fr); font-weight:600; font-size:14px; color:var(--rc-ink);
          background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px); transition:border-color .2s ease; }
        .rc-res-root .rc-sheet__link::before { content:""; position:absolute; left:5px; top:9px; bottom:9px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 2px, transparent 2px 5px); }
        .rc-res-root .rc-sheet__link:hover { border-color:var(--rc-accent); }

        /* ---- page container ---- */
        .rc-res-root .rc-res-wrap { position:relative; z-index:1; max-width:1120px; margin:0 auto; padding:0 20px 40px; }

        .rc-res-root .rc-issue { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:14px 0;
          border-bottom:1px dotted var(--rc-line); font-family:var(--rc-fm); font-size:10px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--rc-faint); }

        /* ---- polls-not-open notice (a quiet taped slip) ---- */
        .rc-res-root .rc-res-empty { margin-top:36px; padding:56px 24px; background:var(--rc-receipt);
          border:1px dashed var(--rc-stamp-line); border-radius:4px; text-align:center;
          display:flex; flex-direction:column; gap:10px; align-items:center;
          box-shadow:2px 14px 30px -18px color-mix(in srgb, var(--rc-ink) 26%, transparent); }
        .rc-res-root .rc-res-empty__lab { font-family:var(--rc-fm); font-size:11px; letter-spacing:.24em;
          text-transform:uppercase; color:var(--rc-faint); }
        .rc-res-root .rc-res-empty__th { font-family:var(--rc-fh); font-weight:700; font-size:clamp(20px,5vw,28px); color:var(--rc-ink); }
        .rc-res-root .rc-res-empty__sub { font-family:var(--rc-fr); font-size:14px; color:var(--rc-ink2); max-width:420px; }

        /* ================= STAGE — strip offset one side + scatter rail ================= */
        /* mobile-first: single column (strip, then rail). desktop lifts into a 2-col
           grid — the receipt strip offset LEFT, the rail pulled left to OVERLAP its
           right edge (>=24px), matching the tape-spine + desk-scatter constitution. */
        .rc-res-root .rc-res-stage { position:relative; margin-top:26px; display:flex; flex-direction:column; gap:26px; }

        /* ---- the receipt STRIP (standings / sealed slip) ---- */
        .rc-res-root .rc-strip { position:relative; z-index:1; background:var(--rc-receipt);
          border:1px solid var(--rc-line); border-radius:4px 4px 0 0; padding:24px clamp(16px,4vw,26px) 6px;
          background-image:repeating-linear-gradient(180deg, transparent 0 30px, color-mix(in srgb, var(--rc-ink) 3%, transparent) 30px 31px);
          box-shadow:2px 16px 34px -20px color-mix(in srgb, var(--rc-ink) 34%, transparent); }
        .rc-res-root .rc-strip--seal { background-image:none; border-radius:4px; padding:0; border:none; box-shadow:none; }

        /* on-sheet masthead (A5 — no floating editorial H1) */
        .rc-res-root .rc-strip-mast { position:relative; padding-bottom:2px; }
        .rc-res-root .rc-strip-serial { display:block; font-size:10px; letter-spacing:.14em; color:var(--rc-ink2);
          font-variant-numeric:tabular-nums; }
        .rc-res-root .rc-strip-status { display:inline-flex; align-items:center; gap:8px; margin-top:10px;
          font-family:var(--rc-fr); font-weight:600; font-size:11px; letter-spacing:.06em; text-transform:uppercase;
          color:var(--rc-accent-deep); }
        .rc-res-root .rc-strip-dot { width:7px; height:7px; border-radius:50%; background:var(--rc-accent); animation:rcBlip 1.6s infinite; }
        .rc-res-root .rc-strip-title { margin:6px 0 0; font-family:var(--rc-fh); font-weight:700; line-height:1.04;
          letter-spacing:-.01em; font-size:clamp(32px, 7vw, 54px); color:var(--rc-ink); }
        .rc-res-root .rc-strip-deck { margin:12px 0 0; max-width:46ch; font-family:var(--rc-fr); font-size:14px;
          line-height:1.65; color:var(--rc-ink2); }
        .rc-res-root .rc-strip-stamp { position:absolute; top:-4px; right:0; font-size:8px; letter-spacing:.14em;
          color:var(--rc-faint); border:1.5px solid var(--rc-faint); border-radius:4px; padding:4px 8px;
          transform:rotate(4deg); opacity:.7; white-space:nowrap; }
        .rc-res-root .rc-strip .rc-perf { margin:20px calc(-1 * clamp(16px,4vw,26px)) 0; height:1px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }

        .rc-res-root .rc-strip-sechead { margin-top:18px; }
        .rc-res-root .rc-strip-kick { display:block; font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--rc-faint); }
        .rc-res-root .rc-strip-h { margin:5px 0 0; font-family:var(--rc-fh); font-weight:700; font-size:clamp(18px,4.4vw,24px);
          line-height:1.15; letter-spacing:-.01em; color:var(--rc-ink); }

        /* ---- register-tape standings ---- */
        .rc-res-root .rc-standings { list-style:none; margin:16px 0 0; padding:0; position:relative; }
        .rc-res-root .rc-standings-head { display:flex; align-items:center; justify-content:space-between;
          padding-bottom:10px; margin-bottom:4px; border-bottom:1.5px solid var(--rc-ink);
          font-family:var(--rc-fm); font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--rc-faint); }
        .rc-res-root .rc-srow { position:relative; border-bottom:1px dotted var(--rc-line); }
        .rc-res-root .rc-srow:last-child { border-bottom:none; }
        /* LAYER 2 — a printed record row: NOT interactive (owner round-5 ก). No button,
           no hover shift, no pointer cursor. Quieter figures than the hero; the name
           column owns the width and clamps at 2 lines max. */
        .rc-res-root .rc-srow__row { width:100%; display:grid; grid-template-columns:auto 1fr; gap:6px 14px; align-items:center;
          padding:14px 4px; color:var(--rc-ink); }
        .rc-res-root .rc-srow__idx { font-family:var(--rc-fm); font-weight:700; font-size:clamp(13px,3.2vw,16px);
          font-variant-numeric:tabular-nums; letter-spacing:.08em; color:var(--rc-faint); width:32px; flex:none; align-self:start; padding-top:4px; }
        .rc-res-root .rc-srow__body { min-width:0; display:flex; flex-direction:column; gap:3px; }
        .rc-res-root .rc-srow__kick { font-family:var(--rc-fm); font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--rc-ink2); }
        /* 3 lines, not 2 — the standings must name the party in full. The 53-char name
           overflowed by exactly one line at 2 (scrollHeight 80 vs 51 clientHeight) and
           the ellipsis landed mid-word. */
        /* ink gutter — 5.19px of Thai upper-vowel+tone ink sat above the clamp's clip
           edge at 21px/1.22 (heading font box = 1.654em). padding-top only; a
           padding-bottom would let the clamped-away 4th line bleed through. */
        .rc-res-root .rc-srow__name { font-family:var(--rc-fh); font-weight:700; font-size:clamp(16px,4vw,21px); line-height:1.22;
          letter-spacing:-.01em; color:var(--rc-ink); padding-top:.32em; margin-top:-.32em;
          display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
        .rc-res-root .rc-srow__data { grid-column:2; display:grid; grid-template-columns:1fr; gap:6px; margin-top:5px; }
        .rc-res-root .rc-srow__num { font-family:var(--rc-fr); font-weight:700; font-size:clamp(20px,5vw,28px); line-height:1;
          font-variant-numeric:tabular-nums; letter-spacing:-.01em; color:var(--rc-ink); }
        .rc-res-root .rc-srow__num small { font-family:var(--rc-fm); font-size:.34em; font-weight:400; color:var(--rc-ink2); margin-left:6px; letter-spacing:.04em; }
        .rc-res-root .rc-srow.is-pseudo .rc-srow__num { color:var(--rc-faint); }
        .rc-res-root .rc-srow__track { height:5px; border-radius:3px; overflow:hidden;
          background:color-mix(in srgb, var(--rc-line) 60%, var(--rc-receipt)); }
        .rc-res-root .rc-srow__track > span { display:block; height:100%; border-radius:3px; background:var(--rc-accent);
          transition:width .7s cubic-bezier(.16,1,.3,1); }
        .rc-res-root .rc-srow.is-pseudo .rc-srow__track > span { background:var(--rc-faint); }
        .rc-res-root .rc-srow__pct { font-family:var(--rc-fm); font-size:12px; letter-spacing:.06em; color:var(--rc-ink2);
          font-variant-numeric:tabular-nums; }

        /* ===== LAYER 1 — WINNER HERO (owner round-5 ข: 3-second read) =====
           the winning party / verdict at headline scale + the big green ink stamp.
           SEMANTIC GREEN only (theme-independent, never the brand accent); the stamp
           is text-only (no star/diamond marks — owner mark rule). */
        .rc-res-root .rc-hero { position:relative; display:grid; grid-template-columns:1fr; gap:16px; align-items:center;
          margin-top:20px; padding:4px 4px 24px; border-bottom:1.5px solid var(--rc-ink); }
        .rc-res-root .rc-hero__body { min-width:0; }
        .rc-res-root .rc-hero__kick { display:block; font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--rc-ink2); }
        .rc-res-root .rc-hero__name { margin:8px 0 0; font-family:var(--rc-fh); font-weight:800; font-size:clamp(34px,8vw,58px);
          line-height:1.06; letter-spacing:-.015em; color:var(--rc-ink); overflow-wrap:anywhere; }
        .rc-res-root .rc-hero__figs { display:flex; align-items:baseline; gap:16px; margin-top:12px; flex-wrap:wrap; }
        .rc-res-root .rc-hero__num { font-family:var(--rc-fr); font-weight:800; font-size:clamp(34px,8vw,52px); line-height:1;
          font-variant-numeric:tabular-nums; letter-spacing:-.01em; color:var(--rc-win-green); }
        .rc-res-root .rc-hero__num small { font-family:var(--rc-fm); font-size:.28em; font-weight:400; color:var(--rc-ink2);
          margin-left:7px; letter-spacing:.06em; }
        .rc-res-root .rc-hero__pct { font-size:15px; font-weight:700; letter-spacing:.06em; color:var(--rc-ink2);
          font-variant-numeric:tabular-nums; }
        .rc-res-root .rc-hero__track { display:block; height:8px; border-radius:4px; margin-top:14px; overflow:hidden;
          background:color-mix(in srgb, var(--rc-line) 60%, var(--rc-receipt)); }
        .rc-res-root .rc-hero__track > span { display:block; height:100%; border-radius:4px; background:var(--rc-win-green);
          transition:width .7s cubic-bezier(.16,1,.3,1); }
        .rc-res-root .rc-herostamp { position:relative; justify-self:start; display:inline-grid; place-items:center;
          padding:12px 24px; transform:rotate(-6deg); color:var(--rc-win-green); pointer-events:none; }
        .rc-res-root .rc-herostamp__ring { position:absolute; inset:0; border-radius:9px; border:3px solid var(--rc-win-green); opacity:.9; }
        .rc-res-root .rc-herostamp__ring::after { content:""; position:absolute; inset:4px; border-radius:6px;
          border:1.5px solid var(--rc-win-green); opacity:.7; }
        .rc-res-root .rc-herostamp__txt { position:relative; display:flex; flex-direction:column; align-items:center; line-height:1;
          font-family:var(--rc-fh); font-weight:800; font-size:clamp(20px,4.6vw,26px); letter-spacing:.01em; }
        .rc-res-root .rc-herostamp__txt em { font-family:var(--rc-fm); font-style:normal; font-weight:700; font-size:10px;
          letter-spacing:.3em; margin-top:4px; }
        @media (min-width:640px) {
          .rc-res-root .rc-hero { grid-template-columns:1fr auto; }
          .rc-res-root .rc-herostamp { justify-self:end; margin-right:6px; }
        }

        /* jagged receipt tear at the very bottom of the strip */
        .rc-res-root .rc-standings-foot { position:relative; text-align:center; padding:14px 0 20px; margin-top:6px;
          background:var(--rc-receipt); font-family:var(--rc-fm); font-size:9px; letter-spacing:.24em; color:var(--rc-faint);
          box-shadow:2px 16px 34px -20px color-mix(in srgb, var(--rc-ink) 34%, transparent);
          -webkit-mask:radial-gradient(6px 8px at 8px 100%, transparent 96%, #000) bottom left/16px 8px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat;
                  mask:radial-gradient(6px 8px at 8px 100%, transparent 96%, #000) bottom left/16px 8px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat; }

        /* ================= RIGHT RAIL — LAYER 3, scatter (manila note + report cards) ================= */
        .rc-res-root .rc-res-rail { position:relative; z-index:2; display:flex; flex-direction:column; gap:22px; }
        /* layer-3 kick — a faint filing label; whispers "supporting data" (revealed only) */
        .rc-res-root .rc-rail-kick { font-size:9px; letter-spacing:.22em; text-transform:uppercase;
          color:var(--rc-faint); margin-bottom:-8px; }

        /* manila turnout note, pinned — the public figures live here */
        .rc-res-root .rc-rnote { position:relative; align-self:flex-start; width:100%; max-width:360px; background:var(--rc-note);
          border-radius:3px; padding:20px 18px 16px; transform:rotate(-1deg);
          border:1px solid color-mix(in srgb, var(--rc-note) 80%, var(--rc-ink));
          box-shadow:2px 13px 26px -15px color-mix(in srgb, var(--rc-ink) 34%, transparent); }
        .rc-res-root .rc-rnote__pin { position:absolute; top:9px; width:11px; height:11px; border-radius:50%; z-index:1;
          background:radial-gradient(circle at 38% 32%, var(--rc-receipt), var(--rc-faint) 52%, var(--rc-ink2) 100%);
          box-shadow:0 1.5px 2px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-res-root .rc-rnote__pin--l { left:12px; } .rc-res-root .rc-rnote__pin--r { right:12px; }
        .rc-res-root .rc-rnote__cap { display:flex; align-items:baseline; gap:8px; margin-bottom:6px;
          padding-bottom:10px; border-bottom:1px dashed color-mix(in srgb, var(--rc-note) 60%, var(--rc-ink)); }
        .rc-res-root .rc-rnote__cap .rc-mono { font-size:9px; letter-spacing:.2em; color:var(--rc-ink2); }
        .rc-res-root .rc-rnote__cap span:last-child { font-family:var(--rc-fh); font-weight:700; font-size:15px; color:var(--rc-ink); }
        .rc-res-root .rc-rfig { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
          padding:9px 0; border-bottom:1px dotted color-mix(in srgb, var(--rc-note) 55%, var(--rc-ink)); }
        .rc-res-root .rc-rfig:last-of-type { border-bottom:none; }
        .rc-res-root .rc-rfig__k { font-family:var(--rc-fm); font-size:9.5px; letter-spacing:.12em; text-transform:uppercase;
          color:var(--rc-ink2); display:inline-flex; align-items:center; }
        .rc-res-root .rc-rfig__n { font-family:var(--rc-fr); font-weight:700; font-size:clamp(22px,5vw,28px); color:var(--rc-ink);
          font-variant-numeric:tabular-nums; letter-spacing:.01em; }
        .rc-res-root .rc-rfig__n small { font-family:var(--rc-fm); font-size:9px; font-weight:400; color:var(--rc-ink2);
          margin-left:5px; letter-spacing:.04em; }
        .rc-res-root .rc-rfig__bar { height:3px; border-radius:2px; margin:2px 0 4px; overflow:hidden;
          background:color-mix(in srgb, var(--rc-note) 55%, var(--rc-ink)); }
        .rc-res-root .rc-rfig__bar > span { display:block; height:100%; border-radius:2px; background:var(--rc-accent);
          transition:width .6s ease; }
        .rc-res-root .rc-live-dot { width:6px; height:6px; border-radius:50%; background:var(--rc-accent); margin-right:6px;
          animation:rcBlip 1.6s infinite; }
        @keyframes rcBlip { 50%{opacity:.3} }

        /* ---- demographics report cards — holo-taped, tilted, slightly overlapping ---- */
        .rc-res-root .rc-reports { display:flex; flex-direction:column; gap:20px; }
        .rc-res-root .rc-report { position:relative; background:var(--rc-receipt); border:1px solid var(--rc-line); border-radius:4px;
          padding:22px 20px 22px; transform:rotate(-.8deg);
          box-shadow:2px 14px 30px -18px color-mix(in srgb, var(--rc-ink) 28%, transparent);
          transition:transform .25s ease; }
        .rc-res-root .rc-report:nth-child(even) { transform:rotate(.8deg); }
        .rc-res-root .rc-report:hover { transform:rotate(0deg) translateY(-2px); }
        /* holographic tape strip laid over the card head */
        .rc-res-root .rc-report__tape { position:absolute; z-index:2; top:-10px; left:50%; margin-left:-34px; width:68px; height:22px;
          border-radius:2px; overflow:hidden; opacity:.62; mix-blend-mode:multiply; transform:rotate(-3deg);
          box-shadow:1px 2px 3px -1px color-mix(in srgb, var(--rc-ink) 30%, transparent); }
        .rc-res-root .rc-report__tape .rc-foil { position:absolute; inset:-40%; }
        .rc-res-root .rc-panel__cap { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
          padding-bottom:12px; margin-bottom:14px; border-bottom:1px dotted var(--rc-line); }
        /* layer-3 section heads voiced DOWN (ink2, not ink) so the hero stays the loudest voice */
        .rc-res-root .rc-panel__cap span { font-family:var(--rc-fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--rc-ink2); }
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

        /* ================= EMBARGO — sealed, tied-shut roll ================= */
        .rc-res-root .rc-strip--seal .rc-seal-slip { position:relative; width:100%; max-width:560px; background:var(--rc-receipt);
          border:1px solid var(--rc-line); border-radius:4px; padding:56px 26px 44px; overflow:hidden;
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
        /* the string tie — two runs of cord crossing at a knotted bow (holds the roll shut) */
        .rc-res-root .rc-seal-tie { position:absolute; z-index:1; left:0; right:0; top:82px; height:60px; width:100%;
          pointer-events:none; filter:drop-shadow(1px 2px 1px color-mix(in srgb, var(--rc-ink) 20%, transparent)); }
        .rc-res-root .rc-seal-tie__ln { fill:none; stroke:var(--rc-stamp-line); stroke-width:2.4; stroke-linecap:round; }
        .rc-res-root .rc-seal-tie__bow { fill:none; stroke:var(--rc-accent-deep); stroke-width:2.4; stroke-linecap:round; opacity:.85; }
        .rc-res-root .rc-seal-tie__knot { fill:var(--rc-accent-deep); opacity:.9; }
        .rc-res-root .rc-seal-cap { position:relative; z-index:3; margin-top:52px; display:flex; align-items:center; gap:12px;
          font-family:var(--rc-fm); font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:var(--rc-ink2); }
        .rc-res-root .rc-seal-cap__dia { width:9px; height:9px; flex:none; background:var(--rc-accent); border-radius:50%; }
        .rc-res-root .rc-seal-cap::after { content:""; flex:1; height:1px; background:repeating-linear-gradient(90deg, var(--rc-line) 0 4px, transparent 4px 8px); }
        .rc-res-root .rc-seal-head { position:relative; z-index:3; margin:16px 0 0; font-family:var(--rc-fh); font-weight:700;
          font-size:clamp(26px,7vw,40px); line-height:1.08; letter-spacing:-.01em; color:var(--rc-ink); }
        .rc-res-root .rc-seal-deck { position:relative; z-index:3; margin:14px 0 0; font-family:var(--rc-fr); font-size:15px; line-height:1.7; color:var(--rc-ink2); }
        .rc-res-root .rc-strip--seal .rc-perf { margin:22px -26px; height:1px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-res-root .rc-seal-note { position:relative; z-index:3; display:inline-flex; align-items:center; font-family:var(--rc-fm);
          font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--rc-accent-deep); font-weight:700;
          font-variant-numeric:tabular-nums; }
        .rc-res-root .rc-seal-foot { position:relative; z-index:3; margin-top:18px; text-align:center; font-family:var(--rc-fm); font-size:9px;
          letter-spacing:.24em; text-transform:uppercase; color:var(--rc-faint); }
        /* rolled-up bottom lip — a wound coil, the roll isn't unspooled yet */
        .rc-res-root .rc-seal-roll { position:absolute; left:0; right:0; bottom:0; height:16px;
          background:linear-gradient(180deg, var(--rc-receipt-edge), color-mix(in srgb, var(--rc-ink) 14%, var(--rc-receipt)));
          border-top:1px solid var(--rc-line);
          box-shadow:inset 0 3px 6px -3px color-mix(in srgb, var(--rc-ink) 40%, transparent); }

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
          /* standings: score column moves beside the name — the NAME column owns the
             leftover width (long party names get 1-2 lines, no squeeze) */
          .rc-res-root .rc-srow__row { grid-template-columns:auto 1fr minmax(150px,210px); align-items:center; }
          .rc-res-root .rc-srow__data { grid-column:auto; margin-top:0; }
        }

        /* ================= DESKTOP : strip LEFT + scatter rail RIGHT (overlap) ================= */
        @media (min-width:1024px) {
          .rc-res-root .rc-res-stage { display:grid; align-items:start;
            grid-template-columns:minmax(0, 560px) minmax(0, 1fr);
            column-gap:0; row-gap:0; padding-left:max(0px, calc(5vw - 20px)); }
          .rc-res-root .rc-res-stage--seal { grid-template-columns:minmax(0, 560px) minmax(0, 1fr); }
          .rc-res-root .rc-strip { grid-column:1; grid-row:1; }
          .rc-res-root .rc-res-rail { grid-column:2; grid-row:1; margin-left:-34px; margin-top:14px; z-index:4; }
          /* keep the hero stamp + the score column clear of the 34px rail overlap:
             inset the stamp and pull the standings' right edge in on desktop only */
          .rc-res-root .rc-herostamp { margin-right:44px; }
          .rc-res-root .rc-srow__row { grid-template-columns:auto 1fr minmax(150px,200px); padding-right:44px; }
          .rc-res-root .rc-standings-head { margin-right:40px; }
          .rc-res-root .rc-rnote { transform:rotate(-1.4deg); max-width:none; }
          .rc-res-root .rc-report--wide { margin-right:-10px; }
        }

        /* ================= MOBILE (<=420): tighten ================= */
        @media (max-width:420px) {
          .rc-res-root .rc-strip { padding:20px 14px 6px; }
          .rc-res-root .rc-strip .rc-perf { margin-left:-14px; margin-right:-14px; }
          .rc-res-root .rc-herostamp { padding:9px 17px; }
          .rc-res-root .rc-herostamp__txt { font-size:17px; }
          .rc-res-root .rc-herostamp__txt em { font-size:8px; }
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
