"use client";

// BlossomResults — RESULTS page for the "Blossom Civic" template family, in the
// "Candy Editorial" language (same family as BlossomHome / BlossomCandidates /
// BlossomSuccess, a UNIQUE page). This is Blossom's DATA MOMENT — an editorial
// "results index":
//   • masthead: mono issue-line + a hollow display word ("ผลคะแนน")
//   • public FIGURES row (echoes the home stat grammar — hairline-ruled tabular
//     numerals: total votes · turnout with a candy progress track · eligible)
//   • when scores are EMBARGOED (isRevealed false) — the LOCKED moment, a designed
//     full-bleed ink band (mirrors the home countdown / success band grammar) with a
//     hollow-stroke headline + mono bilingual line + the closing countdown. No score
//     or ordering ever leaks before reveal (this is the state most voters see on
//     election day).
//   • when REVEALED — ranking rows in the home "figures" grammar: a big tabular vote
//     numeral coloured per row (winner = primary-deep + a solid geometric diamond
//     marker — NO trophy/medal icons), a hairline candy % track; then turnout
//     demographics as the EXISTING recharts (BarChart / PieChart) wrapped in Blossom
//     editorial panels — the FRAME is restyled, the chart internals are not.
//
// Pure presentation: results/page.js owns access control + data fetching + the 3s
// polling and hands the resolved data down (same prop contract as the gumroad /
// verdure / studio-dark Results). Colours flow ONLY through var(--bl-*) emitted by
// BlossomBaseStyles on .bl-root; chart FILLS resolve from the SAME Blossom palette
// source (blossomPalettes.js) since var() does not resolve inside SVG fill
// attributes — this keeps charts themed without touching any existing colour const.
//
// The chrome (topbar + footer + blobs + dot-grid) mirrors BlossomHome byte-for-byte
// (only one Blossom page renders at a time, so the CSS is carried locally).

import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { BlossomTopBar } from "../home/BlossomHome";
import { BlossomBaseStyles, blossomTheme } from "../home/BlossomTheme";
import { useGlobalConfig, useActiveTemplateId } from "../../contexts/GlobalConfigContext";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n);
const CHART_FONT = "var(--font-kanit),'Kanit',var(--font-anuphan),'Anuphan',system-ui,sans-serif";

// ── reveal ceremony: count-up (bl-B1B) ──────────────────────────────────────
// SSR-safe by construction: the INITIAL state is the FINAL value, so server HTML,
// no-JS, and pre-hydration paint all show the real number. Only AFTER hydration
// does the effect restart the number from 0 and ease it up (~1s). reduced-motion
// or editorMode (enabled=false) → snap to final, no rAF. Used ONLY inside the
// revealed branch — the EMBARGOED figures keep their literal fmt()/toFixed(1)
// strings, and the locked ink band never renders a Reveal* node at all.
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
function RevealInt({ value, enabled }) { const v = useCountUp(value, { enabled }); return <>{Math.round(v).toLocaleString("en-US")}</>; }
function RevealFixed({ value, digits = 1, enabled }) { const v = useCountUp(value, { enabled }); return <>{v.toFixed(digits)}</>; }

// Blossom-styled recharts tooltip (paper card, hairline, mono value).
function BlTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const name = label || p?.name || p?.payload?.name;
  return (
    <div className="bl-tip">
      <span className="bl-tip__name">{name}</span>
      <span className="bl-tip__val">{(p?.value || 0).toLocaleString()} <span className="bl-thai bl-thai--nw">คน</span></span>
    </div>
  );
}

export default function BlossomResults({
  candidates = [], totalVotes = 0, demographics = {}, finalStatus = "WAITING",
  isRevealed = false, isNotStarted = false, countdownText = "", onSelectParty = () => {}, editorMode = false,
}) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";
  const copyrightYear = gc.copyrightYear ?? "";

  // resolve the active Blossom palette (same read as BlossomBaseStyles) for chart
  // fills — SVG fill attributes do not resolve var(--bl-*), so charts pull real hex
  // from the SAME palette source. No new colour const is introduced.
  const activeSlug = useActiveTemplateId();
  const [previewSlug, setPreviewSlug] = useState(null);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("slug");
    if (s && s.startsWith("blossom")) setPreviewSlug(s);
  }, []);
  const t = blossomTheme(previewSlug || activeSlug);
  const CHART = [t.primary, t.sup1Ink, t.sup2Ink, t.sup3Ink];

  const revealed = !!isRevealed;
  const ended = finalStatus === "ENDED";
  const anim = !editorMode; // count-ups + bar-grow run in the live app, not admin preview

  const totalEligible = demographics?.totalEligible || 0;
  const turnout = totalEligible > 0 ? (totalVotes / totalEligible) * 100 : 0;

  const parties = candidates.filter((c) => parseInt(c.number) > 0);
  const singleParty = parties.length === 1; // approve / disapprove ballot, not a race

  const pctOf = (c) => (totalVotes > 0 ? ((c?.score || 0) / totalVotes) * 100 : 0);
  const subOf = (c) => {
    const n = parseInt(c.number);
    if (n > 0) return `PARTY NO. ${pad2(c.number)}`;
    return n === 0
      ? <><span className="bl-nw">ABSTAIN</span> · <span className="bl-thai bl-thai--nw">งดออกเสียง</span></>
      : <><span className="bl-nw">DISAPPROVE</span> · <span className="bl-thai bl-thai--nw">ไม่รับรอง</span></>;
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

  const statusTh = isNotStarted
    ? "ยังไม่เปิด"
    : revealed
      ? (ended ? "ผลอย่างเป็นทางการ" : "เรียลไทม์")
      : (ended ? "รอประกาศผล" : "กำลังนับคะแนน");
  const statusEn = isNotStarted
    ? "POLLS NOT OPEN"
    : revealed
      ? (ended ? "FINAL RESULT" : "LIVE RESULT")
      : (ended ? "AWAITING" : "COUNTING");

  const deckCopy = revealed
    ? "สรุปคะแนนเสียงการเลือกตั้ง เรียงลำดับตามจำนวนคะแนนที่แต่ละพรรคได้รับ พร้อมสถิติผู้ใช้สิทธิ์"
    : "สรุปยอดผู้ใช้สิทธิ์แบบเรียลไทม์ ผลคะแนนรายพรรคจะปลดล็อกพร้อมกันเมื่อปิดโหวต";

  const lockNote = ended
    ? "ปิดโหวตแล้ว · รอประกาศผลอย่างเป็นทางการ"
    : countdownText
      ? `ปิดโหวตในอีก · ${countdownText}`
      : "รอเปิดโหวต";

  const hasDemo = byYear.length > 0 || byGender.length > 0 || byMajor.length > 0;

  return (
    <div className="fms-app bl-root bl-res-root">
      <BlossomBaseStyles />

      {/* organic candy blobs (morph slowly, absolute within .bl-root) */}
      <span className="bl-blob bl-blob-1" aria-hidden="true" />
      <span className="bl-blob bl-blob-2" aria-hidden="true" />

      <BlossomTopBar editorMode={editorMode} active="/results" />

      <div className="bl-page">
        {/* ===== issue line (masthead — results variant) ===== */}
        <div className="bl-issue-line">
          <span><span className="bl-thai bl-thai--nw">ผลคะแนน</span> <b>·</b> RESULTS</span>
          <span>{prefix} {number}</span>
        </div>

        {/* ===== editorial masthead: mono status line + hollow display word ===== */}
        <header className="bl-res-head">
          <span className="bl-res-kick"><span className="bl-res-dot" aria-hidden="true" /><span className="bl-thai bl-thai--nw">{statusTh}</span> · <span className="bl-nw">{statusEn}</span></span>
          <h1 className="bl-res-word">ผลคะแนน</h1>
        </header>
        <p className="bl-res-deck">{deckCopy}</p>

        {isNotStarted ? (
          /* ---- polls-not-open: quiet editorial notice ---- */
          <div className="bl-res-empty">
            <span className="bl-res-empty__lab">POLLS NOT OPEN</span>
            <span className="bl-res-empty__th">ยังไม่เปิดรับลงคะแนน</span>
            <span className="bl-res-empty__sub">ผลการเลือกตั้งจะปรากฏที่นี่เมื่อเริ่มการลงคะแนน</span>
          </div>
        ) : (
          <>
            {/* ===== public FIGURES row (echoes the home stat grammar) ===== */}
            <section className="bl-res-figs" aria-label="สรุปยอดผู้ใช้สิทธิ์">
              <div className="bl-rfig bl-rfig-1">
                <span className="bl-rfig__idx">01</span>
                <span className="bl-rfig__n">{revealed ? <RevealInt value={totalVotes} enabled={anim} /> : fmt(totalVotes)}<small>เสียง</small></span>
                <span className="bl-rfig__lab"><span className="bl-res-live" aria-hidden="true" /><span className="bl-thai bl-thai--nw">ใช้สิทธิ์แล้ว</span> · <span className="bl-nw">TOTAL VOTES</span></span>
              </div>
              <div className="bl-rfig bl-rfig-2">
                <span className="bl-rfig__idx">02</span>
                <span className="bl-rfig__n">{revealed ? <RevealFixed value={turnout} digits={1} enabled={anim} /> : turnout.toFixed(1)}<small>%</small></span>
                <span className="bl-rfig__lab"><span className="bl-thai bl-thai--nw">อัตราการใช้สิทธิ์</span> · <span className="bl-nw">TURNOUT</span></span>
                <span className="bl-rfig__bar" aria-hidden="true"><span style={{ width: `${Math.min(100, turnout)}%` }} /></span>
              </div>
              <div className="bl-rfig bl-rfig-3">
                <span className="bl-rfig__idx">03</span>
                <span className="bl-rfig__n">{revealed ? <RevealInt value={totalEligible} enabled={anim} /> : fmt(totalEligible)}<small>คน</small></span>
                <span className="bl-rfig__lab"><span className="bl-thai bl-thai--nw">ผู้มีสิทธิ์</span> · <span className="bl-nw">ELIGIBLE</span></span>
              </div>
            </section>

            {revealed ? (
              <>
                {/* ===== ranking rows ===== */}
                <section className="bl-res-rank">
                  <div className="bl-res-sechead">
                    <span className="bl-res-sechead__kick">{singleParty
                      ? <><span className="bl-thai bl-thai--nw">ผลการรับรอง</span> · <span className="bl-nw">VERDICT</span></>
                      : <><span className="bl-thai bl-thai--nw">อันดับคะแนน</span> · <span className="bl-nw">STANDINGS</span></>}</span>
                    <h2 className="bl-res-sechead__h">{singleParty ? "ผลการรับรองพรรค" : "การกระจายคะแนนรายพรรค"}</h2>
                  </div>
                  <ol className="bl-rrows">
                    {candidates.map((c, i) => {
                      const n = parseInt(c.number);
                      const isWin = c.id === winnerId;
                      const isPseudo = n <= 0;
                      const pct = pctOf(c);
                      const cls = `bl-rrow${isWin ? " is-win" : ""}${isPseudo ? " is-pseudo" : ""}`;
                      const inner = (
                        <>
                          <span className="bl-rrow__idx">{pad2(i + 1)}</span>
                          <span className="bl-rrow__body">
                            <span className="bl-rrow__kick">{subOf(c)}</span>
                            <span className="bl-rrow__name">
                              {c.name}
                              {isWin && <span className="bl-rrow__dia" aria-hidden="true" />}
                              {isWin && <span className="bl-rrow__tag"><span className="bl-thai bl-thai--nw">ผู้ชนะ</span> · <span className="bl-nw">WINNER</span></span>}
                            </span>
                          </span>
                          <span className="bl-rrow__data">
                            <span className="bl-rrow__num"><RevealInt value={c.score || 0} enabled={anim} /><small>เสียง</small></span>
                            {/* fill carries its REAL width inline (no-JS / reduced-motion
                                fallback lands final); "is-grow" only staggers a 0→width CSS
                                grow via animationDelay, skipped in editorMode */}
                            <span className="bl-rrow__track"><span className={anim ? "is-grow" : undefined} style={{ width: `${Math.max(pct, c.score > 0 ? 2 : 0)}%`, ...(anim ? { animationDelay: `${i * 90}ms` } : {}) }} /></span>
                            <span className="bl-rrow__pct"><RevealFixed value={pct} digits={1} enabled={anim} />%</span>
                          </span>
                        </>
                      );
                      return (
                        <li key={c.id || i} className={cls}>
                          {n > 0 ? (
                            <button type="button" className="bl-rrow__link" onClick={() => onSelectParty(c)}>{inner}</button>
                          ) : (
                            <div className="bl-rrow__link bl-rrow__link--static">{inner}</div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </section>

                {/* ===== demographics: EXISTING recharts wrapped in Blossom panels ===== */}
                {hasDemo && (
                  <section className="bl-res-demo">
                    <div className="bl-res-sechead">
                      <span className="bl-res-sechead__kick"><span className="bl-thai bl-thai--nw">สถิติผู้ใช้สิทธิ์</span> · <span className="bl-nw">TURNOUT</span></span>
                      <h2 className="bl-res-sechead__h">ประชากรผู้มาใช้สิทธิ์</h2>
                    </div>
                    <div className="bl-demo-grid">
                      {byGender.length > 0 && (
                        <div className="bl-panel">
                          <div className="bl-panel__cap"><span><span className="bl-thai bl-thai--nw">เพศ</span> · <span className="bl-nw">BY GENDER</span></span><em>§ 01</em></div>
                          <div className="bl-donut">
                            <ResponsiveContainer width="100%" height={230}>
                              <PieChart>
                                <Pie data={byGender} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                  innerRadius={58} outerRadius={86} paddingAngle={3} stroke={t.card} strokeWidth={3}
                                  startAngle={90} endAngle={-270} isAnimationActive={false}>
                                  {byGender.map((g, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
                                </Pie>
                                <Tooltip content={<BlTooltip />} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="bl-donut__c"><strong>{genderTotal.toLocaleString()}</strong><span className="bl-thai bl-thai--nw">คน</span></div>
                          </div>
                          <div className="bl-legend">
                            {byGender.map((g, i) => (
                              <span className="bl-legend__i" key={i}>
                                <i style={{ background: CHART[i % CHART.length] }} />{g.name}<b>{(g.value || 0).toLocaleString()}</b>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {byYear.length > 0 && (
                        <div className="bl-panel">
                          <div className="bl-panel__cap"><span><span className="bl-thai bl-thai--nw">ชั้นปี</span> · <span className="bl-nw">BY YEAR</span></span><em>§ 02</em></div>
                          <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={byYear} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                              <CartesianGrid vertical={false} stroke={t.line} />
                              <XAxis dataKey="name" tick={{ fontFamily: CHART_FONT, fontSize: 12, fontWeight: 600, fill: t.ink }} tickLine={false} axisLine={{ stroke: t.ink }} />
                              <YAxis allowDecimals={false} width={34} tick={{ fontFamily: CHART_FONT, fontSize: 11, fill: t.ink2 }} tickLine={false} axisLine={false} />
                              <Tooltip content={<BlTooltip />} cursor={{ fill: t.primarySoft }} />
                              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={62} isAnimationActive={false}>
                                {byYear.map((_, i) => <Cell key={i} fill={CHART[i % CHART.length]} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {byMajor.length > 0 && (
                        <div className="bl-panel bl-panel--wide">
                          <div className="bl-panel__cap"><span><span className="bl-thai bl-thai--nw">สาขา</span> · <span className="bl-nw">BY MAJOR</span></span><em>§ 03</em></div>
                          <ResponsiveContainer width="100%" height={Math.max(240, byMajor.length * 46)}>
                            <BarChart data={byMajor} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 4 }}>
                              <CartesianGrid horizontal={false} stroke={t.line} />
                              <XAxis type="number" hide allowDecimals={false} />
                              <YAxis type="category" dataKey="name" width={140} tick={{ fontFamily: CHART_FONT, fontSize: 12, fontWeight: 600, fill: t.ink }} tickLine={false} axisLine={{ stroke: t.ink }} />
                              <Tooltip content={<BlTooltip />} cursor={{ fill: t.primarySoft }} />
                              <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={26} isAnimationActive={false}
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
              /* ===== LOCKED moment — full-bleed ink band (closed-page grammar) ===== */
              <section className="bl-res-lock">
                <div className="bl-res-lock__in">
                  <div className="bl-res-lock__cap"><span className="bl-res-lock__dia" aria-hidden="true" /><span className="bl-thai bl-thai--nw">ปิดผนึกไว้</span> · <span className="bl-nw">EMBARGOED</span></div>
                  <h2 className="bl-res-lock__head">
                    <span className="bl-res-lock__l1">ปิดผนึก</span>
                    <span className="bl-res-lock__l2">ผลคะแนน</span>
                  </h2>
                  <p className="bl-res-lock__deck">
                    {singleParty
                      ? "ผลการรับรองและสถิติผู้ใช้สิทธิ์จะเปิดเผยเมื่อปิดโหวต เพื่อความโปร่งใสและเป็นธรรม"
                      : "ผลคะแนนรายพรรคและสถิติผู้ใช้สิทธิ์จะเปิดเผยพร้อมกันเมื่อปิดโหวต เพื่อความเป็นธรรมกับทุกพรรค"}
                  </p>
                  <div className="bl-res-lock__note"><span className="bl-thai">{lockNote}</span></div>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* ===== footer — plain classic line (mirrors bl-footer on home) ===== */}
      <footer className="bl-footer">
        <p>© FMS@PSU{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
      </footer>

      <style jsx global>{`
        /* ================= SHARED CHROME (mirrors BlossomHome) ================= */
        .bl-res-root { overflow-x:hidden; }
        /* dot-grid paper texture — above the blobs, under content */
        .bl-res-root::after { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:radial-gradient(color-mix(in srgb, var(--bl-ink) 8%, transparent) 1px, transparent 1.4px);
          background-size:28px 28px; }
        :where(.bl-res-root) a { color:var(--bl-primary-deep); text-decoration:none; }
        :where(.bl-res-root) a:hover { color:var(--bl-ink); }

        .bl-res-root .bl-blob { position:absolute; pointer-events:none; z-index:0; }
        .bl-res-root .bl-blob-1 { top:-16vw; right:-22vw; width:64vw; height:64vw; min-width:380px; min-height:380px;
          background:color-mix(in srgb, var(--bl-primary-soft) 45%, var(--bl-canvas)); border-radius:52% 48% 60% 40%/55% 60% 40% 45%;
          animation:blMorph 14s ease-in-out infinite alternate; }
        .bl-res-root .bl-blob-2 { bottom:4%; left:-18vw; width:46vw; height:46vw; min-width:280px; min-height:280px;
          background:color-mix(in srgb, var(--bl-sup3) 45%, var(--bl-canvas)); border-radius:60% 40% 45% 55%/45% 55% 60% 40%;
          animation:blMorph 18s ease-in-out infinite alternate-reverse; }
        @keyframes blMorph {
          0%   { border-radius:52% 48% 60% 40%/55% 60% 40% 45%; }
          50%  { border-radius:44% 56% 42% 58%/60% 42% 58% 40%; }
          100% { border-radius:58% 42% 55% 45%/42% 58% 45% 55%; }
        }

        .bl-res-root .bl-page { position:relative; z-index:1; max-width:1200px; margin:0 auto; padding:0 22px 90px; }

        /* ---- topbar (editorial hairline skin) ---- */
        .bl-res-root .bl-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--bl-canvas) 88%, transparent);
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
          border-bottom:1.5px solid var(--bl-ink); }
        .bl-res-root .bl-topbar__in { max-width:1200px; margin:0 auto; padding:14px 22px;
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .bl-res-root .bl-logo { display:inline-flex; align-items:center; flex-shrink:0; border-radius:8px; }
        .bl-res-root .bl-logo__img { height:30px; width:auto; object-fit:contain; display:block; }
        .bl-res-root .bl-nav { display:none; gap:20px; margin-left:auto; align-items:center; }
        .bl-res-root .bl-nav__link { font-family:var(--bl-fm); font-size:11.5px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--bl-ink2); position:relative; padding-bottom:2px; border-radius:4px; transition:color .2s ease; }
        .bl-res-root .bl-nav__link.on, .bl-res-root .bl-nav__link:hover { color:var(--bl-ink); }
        .bl-res-root .bl-nav__link::after { content:""; position:absolute; left:0; right:0; bottom:-3px; height:3px;
          background:var(--bl-primary); border-radius:2px; transform:scaleX(0); transform-origin:left;
          transition:transform .28s cubic-bezier(.22,1,.36,1); }
        .bl-res-root .bl-nav__link:hover::after { transform:scaleX(1); }
        .bl-res-root .bl-nav__link.on::after { transform:scaleX(1); }

        .bl-res-root .bl-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .bl-res-root .bl-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--bl-fd); font-weight:600;
          font-size:13px; color:var(--bl-canvas); background:var(--bl-ink); border:none; cursor:pointer;
          padding:9px 20px; border-radius:999px; transition:background .2s ease, transform .15s ease; }
        .bl-res-root .bl-loginbtn:hover { background:var(--bl-primary-deep); transform:translateY(-1px); }
        .bl-res-root .bl-loginbtn:active { transform:scale(.96); }
        .bl-res-root .bl-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--bl-line) 70%, var(--bl-card)); }
        .bl-res-root .bl-skelbar { display:block; width:58px; height:12px; border-radius:6px;
          background:color-mix(in srgb, var(--bl-ink2) 30%, var(--bl-card)); animation:blPulse 1.3s ease-in-out infinite; }
        @keyframes blPulse { 0%,100%{opacity:.45} 50%{opacity:1} }

        .bl-res-root .bl-userchip { position:relative; }
        .bl-res-root .bl-userchip__btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:999px; padding:5px 12px 5px 5px; cursor:pointer;
          font-family:inherit; transition:transform .15s ease, background .2s ease; }
        .bl-res-root .bl-userchip__btn:hover { background:color-mix(in srgb, var(--bl-primary) 7%, var(--bl-card)); }
        .bl-res-root .bl-userchip__btn:active { transform:scale(.97); }
        .bl-res-root .bl-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:linear-gradient(135deg, var(--bl-primary), var(--bl-primary-deep)); color:var(--bl-on-primary, var(--bl-card));
          font-family:var(--bl-fd); font-weight:700; font-size:14px; line-height:1; }
        .bl-res-root .bl-userchip__name { font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-res-root .bl-userchip__caret { color:var(--bl-ink2); font-size:11px; }
        .bl-res-root .bl-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:16px; overflow:hidden; z-index:50;
          box-shadow:0 18px 40px -18px color-mix(in srgb, var(--bl-ink) 12%, transparent); }
        .bl-res-root .bl-usermenu__head { padding:14px 16px; border-bottom:1px solid var(--bl-line); }
        .bl-res-root .bl-usermenu__name { font-family:var(--bl-fd); font-weight:700; font-size:14px; color:var(--bl-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-res-root .bl-usermenu__id { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.04em; color:var(--bl-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-res-root .bl-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-primary-deep); }
        .bl-res-root .bl-usermenu__out:hover { background:color-mix(in srgb, var(--bl-primary) 10%, var(--bl-card)); }

        .bl-res-root .bl-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:12px; background:var(--bl-card); border:1.5px solid var(--bl-ink); cursor:pointer;
          transition:transform .15s ease, background .2s ease; }
        .bl-res-root .bl-burger:hover { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }
        .bl-res-root .bl-burger:active { transform:scale(.95); }
        .bl-res-root .bl-burger span { display:block; height:2.5px; border-radius:2px; background:var(--bl-ink); }

        .bl-res-root .bl-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .bl-res-root .bl-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .bl-res-root .bl-sheet__link { display:flex; align-items:center; min-height:44px; padding:11px 16px; border-radius:12px;
          font-family:var(--bl-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--bl-ink);
          background:var(--bl-card); border:1px solid var(--bl-line); transition:border-color .2s ease, background .2s ease; }
        .bl-res-root .bl-sheet__link:hover { border-color:var(--bl-primary); }
        .bl-res-root .bl-sheet__link:active { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }

        /* focus-visible (keyboard) — 2px primary-deep outline on every interactive element */
        .bl-res-root a:focus-visible, .bl-res-root button:focus-visible {
          outline:2px solid var(--bl-primary-deep); outline-offset:2px; }

        /* ---- issue line (masthead) ---- */
        .bl-res-root .bl-issue-line { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:12px 0;
          border-bottom:1px solid var(--bl-line); font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--bl-ink2); }
        .bl-res-root .bl-issue-line b { color:var(--bl-primary-deep); font-weight:700; }

        /* ---- footer: plain classic single line, centered ---- */
        .bl-res-root .bl-footer { margin-top:0; padding:24px 0; border-top:1px solid var(--bl-line); text-align:center;
          position:relative; z-index:1; }
        .bl-res-root .bl-footer p { margin:0; font-size:10px; letter-spacing:.12em; text-transform:uppercase;
          font-weight:500; color:var(--bl-ink2); }

        /* ================= RESULTS PAGE (unique layout) ================= */
        /* ---- masthead: mono status line + hollow display word ---- */
        .bl-res-root .bl-res-head { margin-top:44px; padding-bottom:22px; border-bottom:1.5px solid var(--bl-ink);
          animation:blRRise .6s ease both .05s; }
        .bl-res-root .bl-res-kick { display:inline-flex; align-items:center; gap:9px; font-family:var(--bl-fm); font-size:10.5px;
          letter-spacing:.2em; text-transform:uppercase; color:var(--bl-ink2); }
        .bl-res-root .bl-res-dot { width:7px; height:7px; border-radius:50%; background:var(--bl-primary);
          animation:blResBlip 1.6s infinite; }
        @keyframes blResBlip { 50%{opacity:.3} }
        .bl-res-root .bl-res-word { margin:12px 0 0; font-family:var(--bl-fd); font-weight:800; line-height:.9;
          font-size:clamp(56px,15vw,132px); letter-spacing:-.02em; color:transparent;
          -webkit-text-stroke:2px var(--bl-primary-deep); text-stroke:2px var(--bl-primary-deep); }
        @supports not (-webkit-text-stroke: 1px #000) {
          .bl-res-root .bl-res-word { color:var(--bl-primary-deep); -webkit-text-stroke:0; text-stroke:0; }
        }
        .bl-res-root .bl-res-deck { margin:20px 0 0; max-width:600px; font-family:var(--bl-fd); font-weight:500;
          font-size:clamp(15px,3.6vw,18px); line-height:1.7; color:var(--bl-ink2);
          animation:blRRise .6s ease both .16s; }

        /* ---- polls-not-open notice ---- */
        .bl-res-root .bl-res-empty { margin-top:44px; padding:72px 24px; border:1.5px dashed var(--bl-line);
          border-radius:20px; text-align:center; display:flex; flex-direction:column; gap:10px; align-items:center; }
        .bl-res-root .bl-res-empty__lab { font-family:var(--bl-fm); font-size:11px; letter-spacing:.24em; text-transform:uppercase;
          color:var(--bl-faint); }
        .bl-res-root .bl-res-empty__th { font-family:var(--bl-fd); font-weight:700; font-size:clamp(20px,5vw,28px); color:var(--bl-ink); }
        .bl-res-root .bl-res-empty__sub { font-family:var(--bl-fd); font-weight:500; font-size:14px; color:var(--bl-ink2); max-width:420px; }

        /* ---- figures (public stat row — home grammar) ---- */
        .bl-res-root .bl-res-figs { margin-top:40px; border-top:1.5px solid var(--bl-ink); border-bottom:1px solid var(--bl-line);
          animation:blRRise .6s ease both .22s; }
        .bl-res-root .bl-rfig { display:flex; align-items:baseline; gap:16px; padding:20px 4px; border-bottom:1px solid var(--bl-line); flex-wrap:wrap; }
        .bl-res-root .bl-rfig:last-child { border-bottom:none; }
        .bl-res-root .bl-rfig__idx { font-family:var(--bl-fm); font-size:10px; letter-spacing:.2em; color:var(--bl-faint); width:34px; flex:none; }
        .bl-res-root .bl-rfig__n { font-family:var(--bl-fd); font-weight:800; font-size:clamp(38px,9vw,64px); line-height:1;
          font-variant-numeric:tabular-nums; letter-spacing:-.02em; }
        .bl-res-root .bl-rfig__n small { font-size:.4em; font-weight:600; color:var(--bl-ink2); margin-left:6px; letter-spacing:0; }
        .bl-res-root .bl-rfig__lab { margin-left:auto; text-align:right; font-family:var(--bl-fm); font-size:10px; letter-spacing:.16em;
          color:var(--bl-ink2); line-height:1.9; }
        .bl-res-root .bl-rfig-1 .bl-rfig__n { color:var(--bl-sup1-ink); }
        .bl-res-root .bl-rfig-2 .bl-rfig__n { color:var(--bl-primary-deep); }
        .bl-res-root .bl-rfig-3 .bl-rfig__n { color:var(--bl-sup2-ink); }
        .bl-res-root .bl-rfig-1 .bl-rfig__idx { color:var(--bl-sup1-ink); }
        .bl-res-root .bl-rfig-2 .bl-rfig__idx { color:var(--bl-primary-deep); }
        .bl-res-root .bl-rfig-3 .bl-rfig__idx { color:var(--bl-sup2-ink); }
        .bl-res-root .bl-rfig__bar { flex:0 0 100%; height:3px; border-radius:2px; margin-top:12px; overflow:hidden;
          background:color-mix(in srgb, var(--bl-line) 60%, var(--bl-card)); }
        .bl-res-root .bl-rfig__bar > span { display:block; height:100%; border-radius:2px;
          background:linear-gradient(90deg, var(--bl-primary), var(--bl-primary-deep)); transition:width .6s ease; }
        .bl-res-root .bl-res-live { display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--bl-primary);
          margin-right:5px; animation:blResBlip 1.6s infinite; }

        /* ---- section head (shared: rank + demo) ---- */
        .bl-res-root .bl-res-sechead { margin-top:56px; padding-bottom:16px; border-bottom:1.5px solid var(--bl-ink); }
        .bl-res-root .bl-res-sechead__kick { font-family:var(--bl-fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase;
          color:var(--bl-ink2); }
        .bl-res-root .bl-res-sechead__h { margin:8px 0 0; font-family:var(--bl-fd); font-weight:800; font-size:clamp(22px,5.4vw,34px);
          line-height:1.12; letter-spacing:-.01em; color:var(--bl-ink); }

        /* ---- ranking rows (home figures grammar: big tabular numeral + candy track) ---- */
        .bl-res-root .bl-rrows { list-style:none; margin:0; padding:0; }
        .bl-res-root .bl-rrow { border-bottom:1px solid var(--bl-line); animation:blRRise .55s ease both; }
        .bl-res-root .bl-rrow:nth-child(1) { animation-delay:.06s; }
        .bl-res-root .bl-rrow:nth-child(2) { animation-delay:.12s; }
        .bl-res-root .bl-rrow:nth-child(3) { animation-delay:.18s; }
        .bl-res-root .bl-rrow:nth-child(n+4) { animation-delay:.24s; }
        .bl-res-root .bl-rrow__link { width:100%; display:grid; grid-template-columns:auto 1fr; gap:8px 18px; align-items:center;
          padding:22px 8px; background:none; border:0; text-align:left; color:var(--bl-ink); font-family:inherit;
          transition:background .25s ease, padding-left .25s ease; }
        .bl-res-root button.bl-rrow__link { cursor:pointer; }
        .bl-res-root button.bl-rrow__link:hover { background:color-mix(in srgb, var(--bl-primary) 7%, var(--bl-canvas)); padding-left:16px; }
        .bl-res-root button.bl-rrow__link:active { background:color-mix(in srgb, var(--bl-primary) 11%, var(--bl-canvas)); }
        .bl-res-root .bl-rrow__idx { font-family:var(--bl-fm); font-weight:700; font-size:clamp(15px,3.4vw,20px);
          font-variant-numeric:tabular-nums; letter-spacing:.08em; color:var(--bl-faint); width:38px; flex:none; align-self:start; padding-top:4px; }
        .bl-res-root .bl-rrow__body { min-width:0; display:flex; flex-direction:column; gap:3px; }
        .bl-res-root .bl-rrow__kick { font-family:var(--bl-fm); font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--bl-ink2); }
        .bl-res-root .bl-rrow__name { font-family:var(--bl-fd); font-weight:800; font-size:clamp(20px,5vw,30px); line-height:1.12;
          letter-spacing:-.01em; color:var(--bl-ink); display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .bl-res-root button.bl-rrow__link:hover .bl-rrow__name { color:var(--bl-primary-deep); }
        .bl-res-root .bl-rrow__dia { width:14px; height:14px; flex:none; background:var(--bl-primary-deep); transform:rotate(45deg); }
        .bl-res-root .bl-rrow__tag { font-family:var(--bl-fm); font-size:9px; letter-spacing:.14em; text-transform:uppercase;
          background:var(--bl-primary-deep); color:var(--bl-on-primary, var(--bl-card)); border-radius:999px; padding:4px 10px; }
        .bl-res-root .bl-rrow__data { grid-column:2; display:grid; grid-template-columns:1fr; gap:8px; margin-top:6px; }
        .bl-res-root .bl-rrow__num { font-family:var(--bl-fd); font-weight:800; font-size:clamp(34px,8vw,56px); line-height:1;
          font-variant-numeric:tabular-nums; letter-spacing:-.02em; color:var(--bl-ink); }
        .bl-res-root .bl-rrow__num small { font-size:.32em; font-weight:600; color:var(--bl-ink2); margin-left:6px; letter-spacing:0; }
        .bl-res-root .bl-rrow.is-win .bl-rrow__num { color:var(--bl-primary-deep); }
        .bl-res-root .bl-rrow.is-pseudo .bl-rrow__num { color:var(--bl-faint); }
        .bl-res-root .bl-rrow__track { height:6px; border-radius:3px; overflow:hidden;
          background:color-mix(in srgb, var(--bl-line) 60%, var(--bl-card)); }
        .bl-res-root .bl-rrow__track > span { display:block; height:100%; border-radius:3px;
          background:linear-gradient(90deg, var(--bl-primary), var(--bl-primary-deep)); transition:width .7s cubic-bezier(.16,1,.3,1); }
        /* reveal ceremony: fills grow 0→real width with a per-row stagger (animationDelay
           set inline). Pure CSS keyframe — without JS / under reduced-motion the bar still
           ends at its inline width, so a fill is NEVER gated behind hydration. Scoped to
           .is-grow only (absent in editorMode). The blanket reduced-motion rule below
           nukes this animation, leaving the inline width. */
        .bl-res-root .bl-rrow__track > span.is-grow { animation:blRBar .7s cubic-bezier(.16,1,.3,1) backwards; }
        @keyframes blRBar { from { width:0; } }
        .bl-res-root .bl-rrow.is-win .bl-rrow__track > span { background:var(--bl-primary-deep);
          box-shadow:0 0 10px color-mix(in srgb, var(--bl-primary) 45%, transparent); }
        .bl-res-root .bl-rrow.is-pseudo .bl-rrow__track > span { background:var(--bl-faint); }
        .bl-res-root .bl-rrow__pct { font-family:var(--bl-fm); font-size:12px; letter-spacing:.06em; color:var(--bl-ink2);
          font-variant-numeric:tabular-nums; }
        /* winner row — gentle candy wash + an inset ink accent so the win reads at a
           glance beyond the diamond/tag/tinted numeral (bl-B1B, color-mix only) */
        .bl-res-root .bl-rrow.is-win { background:color-mix(in srgb, var(--bl-primary) 6%, var(--bl-canvas));
          box-shadow:inset 3px 0 0 var(--bl-primary-deep); }

        /* ---- demographics panels (frame restyled; recharts internals untouched) ---- */
        .bl-res-root .bl-demo-grid { display:grid; grid-template-columns:1fr; gap:20px; margin-top:28px; }
        .bl-res-root .bl-panel { background:var(--bl-card); border:1.5px solid var(--bl-line); border-radius:22px; padding:22px 22px 24px;
          animation:blRRise .55s ease both; }
        .bl-res-root .bl-panel__cap { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
          padding-bottom:14px; margin-bottom:14px; border-bottom:1px solid var(--bl-line); }
        .bl-res-root .bl-panel__cap span { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--bl-ink); }
        .bl-res-root .bl-panel__cap em { font-family:var(--bl-fm); font-style:normal; font-size:10px; letter-spacing:.14em; color:var(--bl-primary-deep); }
        .bl-res-root .bl-donut { position:relative; }
        .bl-res-root .bl-donut__c { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; }
        .bl-res-root .bl-donut__c strong { font-family:var(--bl-fd); font-weight:800; font-size:32px; line-height:1; color:var(--bl-ink); }
        .bl-res-root .bl-donut__c span { font-family:var(--bl-fm); font-size:11px; color:var(--bl-ink2); margin-top:2px; }
        .bl-res-root .bl-legend { display:flex; flex-wrap:wrap; justify-content:center; gap:9px; margin-top:14px; }
        .bl-res-root .bl-legend__i { display:inline-flex; align-items:center; gap:7px; font-family:var(--bl-fd); font-weight:600; font-size:13px;
          color:var(--bl-ink); background:var(--bl-canvas); border:1px solid var(--bl-line); border-radius:999px; padding:5px 12px; }
        .bl-res-root .bl-legend__i i { width:12px; height:12px; border-radius:4px; display:inline-block; }
        .bl-res-root .bl-legend__i b { font-family:var(--bl-fm); font-weight:700; color:var(--bl-ink2); }
        .bl-res-root .bl-tip { display:flex; flex-direction:column; gap:2px; background:var(--bl-card); border:1.5px solid var(--bl-ink);
          border-radius:12px; box-shadow:0 12px 26px -14px color-mix(in srgb, var(--bl-ink) 20%, transparent); padding:8px 12px; }
        .bl-res-root .bl-tip__name { font-family:var(--bl-fd); font-weight:700; font-size:13px; color:var(--bl-ink); }
        .bl-res-root .bl-tip__val { font-family:var(--bl-fm); font-size:12px; color:var(--bl-ink2); }

        /* ---- LOCKED moment: full-bleed ink band (closed-page grammar) ---- */
        .bl-res-root .bl-res-lock { position:relative; margin:52px calc(50% - 50vw) 0; padding:72px 22px 78px;
          background:var(--bl-ink); overflow:hidden; animation:blRRise .6s ease both .28s; }
        .bl-res-root .bl-res-lock__in { position:relative; z-index:1; max-width:1200px; margin:0 auto; }
        .bl-res-root .bl-res-lock__cap { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.22em; text-transform:uppercase;
          color:color-mix(in srgb, var(--bl-canvas) 55%, transparent); display:flex; align-items:center; gap:12px; }
        .bl-res-root .bl-res-lock__dia { width:10px; height:10px; flex:none; background:var(--bl-primary); transform:rotate(45deg); }
        .bl-res-root .bl-res-lock__cap::after { content:""; flex:1; height:1px; background:color-mix(in srgb, var(--bl-canvas) 20%, transparent); }
        .bl-res-root .bl-res-lock__head { margin:20px 0 0; font-family:var(--bl-fd); font-weight:800; line-height:.98;
          font-size:clamp(52px,13vw,124px); letter-spacing:-.03em; display:flex; flex-direction:column; }
        .bl-res-root .bl-res-lock__l1 { color:transparent; -webkit-text-stroke:2.5px var(--bl-primary); text-stroke:2.5px var(--bl-primary); }
        @supports not (-webkit-text-stroke: 1px #000) {
          .bl-res-root .bl-res-lock__l1 { color:var(--bl-primary); -webkit-text-stroke:0; text-stroke:0; }
        }
        .bl-res-root .bl-res-lock__l2 { color:var(--bl-canvas); }
        .bl-res-root .bl-res-lock__deck { margin:22px 0 0; max-width:600px; font-family:var(--bl-fd); font-weight:500;
          font-size:clamp(15px,3.6vw,18px); line-height:1.7; color:color-mix(in srgb, var(--bl-canvas) 78%, transparent); }
        .bl-res-root .bl-res-lock__note { margin-top:30px; display:inline-flex; align-items:center; padding-top:20px;
          border-top:1px solid color-mix(in srgb, var(--bl-canvas) 20%, transparent);
          font-family:var(--bl-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--bl-canvas); }

        @keyframes blRRise { from { opacity:0; transform:translateY(16px); } }

        /* ================= TABLET+ : inline nav + wider layout ================= */
        @media (min-width:768px) {
          .bl-res-root .bl-topbar__in { gap:22px; }
          .bl-res-root .bl-nav { display:flex; }
          .bl-res-root .bl-userwrap { margin-left:0; }
          .bl-res-root .bl-burger, .bl-res-root .bl-sheet { display:none; }
          .bl-res-root .bl-footer p { font-size:12px; }
          .bl-res-root .bl-rfig { padding:26px 8px; }
          /* ranking: numeral + track + pct move to a right column beside the name */
          .bl-res-root .bl-rrow__link { grid-template-columns:auto 1fr minmax(240px,360px); align-items:center; }
          .bl-res-root .bl-rrow__data { grid-column:auto; margin-top:0; grid-template-columns:1fr; gap:10px; }
          .bl-res-root .bl-demo-grid { grid-template-columns:1fr 1fr; }
          .bl-res-root .bl-panel--wide { grid-column:1 / -1; }
        }

        /* ================= MOBILE (<=560): tighten ================= */
        @media (max-width:560px) {
          .bl-res-root .bl-rrow__link { padding:20px 6px; }
          .bl-res-root button.bl-rrow__link:hover { padding-left:6px; }
          .bl-res-root .bl-res-lock { padding:56px 20px 60px; }
        }

        /* reduced motion — scope to .bl-res-root, keep transitions */
        @media (prefers-reduced-motion:reduce) {
          .bl-res-root *, .bl-res-root *::before, .bl-res-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
