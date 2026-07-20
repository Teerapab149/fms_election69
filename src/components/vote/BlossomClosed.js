"use client";

// BlossomClosed — CLOSED / locked-state page for the "Blossom Civic" template
// family, in the "Candy Editorial" language (same family as BlossomHome, a UNIQUE
// page). Shown when voting is not open: waiting (before start), ended, or paused.
//
// Deliberately QUIET vs the celebratory success page: one solid full-bleed INK BAND
// carries a big canvas label (the reason-aware title) + a mono bilingual status
// line + the reason eyebrow with a geometric diamond index. No confetti, no digit
// roll — an editorial notice, not a party. The single action (home / logout) lives
// as a light pill on the ink so the whole message reads as one block.
//
// Pure presentation — closed/page.js owns status fetching + the (PSU SSO) logout,
// and passes the reason-aware title/desc/variant. Colours flow ONLY through
// var(--bl-*), emitted by BlossomBaseStyles on .bl-root — a theme swap re-tints the
// whole page in place. Chrome mirrors BlossomHome (carried locally — one Blossom
// page renders at a time).
//
// State theatre (bl-B1A): the state is spoken in Blossom's own editorial voice
// instead of a bare eyebrow/title swap. On the ink band `waiting` carries a LIVE
// countdown to ELECTION_START (canvas Kanit digits, mono unit ledger — the home
// bl-count band's grammar at notice scale) + a factual open-window caption; `ended`
// carries the close-time caption + a PRIMARY "ดูผลคะแนน" pill (the home/logout button
// demotes to a ghost outline on the ink); `closed`/paused stays the quiet single
// affordance. Every added string is a real date/time — no narrative copy. The
// TopBar chrome carries NO schedule-derived state (no countdown/rail), so unlike
// studio-dark's rail there is nothing that can go stale on ended/paused — the
// reason-aware `variant` from closed/page.js is the single source, so no systemMode
// thread is needed here.

import { useState, useEffect } from "react";
import { getPath } from "../../utils/basePath";
import { BlossomTopBar } from "../home/BlossomHome";
import { BlossomBaseStyles } from "../home/BlossomTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { resolveElectionDates, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";

// reason eyebrow (bilingual). Copy stays reason-aware while the accent stays token-
// only (var(--bl-*)) — the family has one accent identity, so all variants share it.
// {th, en} so the render side can pin the Thai run to the real Thai font (Space Mono
// has no Thai glyphs) while keeping the "·" separator between the two runs.
const EYEBROW = {
  waiting: { th: "ใกล้เปิดลงคะแนน", en: "UPCOMING" },
  ended: { th: "ปิดลงคะแนนแล้ว", en: "CLOSED" },
  closed: { th: "พักระบบชั่วคราว", en: "MAINTENANCE" },
};

// Countdown segments — [key, EN unit, TH unit]. days shown as-is (can exceed 2
// digits); hh/mm/ss zero-padded. Mirrors the home bl-count DAYS/HRS/MIN/SEC ledger.
const CD_UNITS = [["d", "DAYS", "วัน"], ["hh", "HRS", "ชม."], ["mm", "MIN", "นาที"], ["ss", "SEC", "วินาที"]];

export default function BlossomClosed({
  title, desc, variant = "closed", session = null, onLogout = () => {}, editorMode = false,
}) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";
  const copyrightYear = gc.copyrightYear ?? "";
  const eyebrow = EYEBROW[variant] || EYEBROW.closed;
  const { ELECTION_START, ELECTION_END } = resolveElectionDates(gc);

  // Live countdown to ELECTION_START — waiting variant only. Null when the target
  // has passed or the dates are invalid (so no stuck 00:00:00 or negative ever
  // shows). editorMode computes ONCE (no interval) so the admin preview never ticks.
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
  }, [variant, editorMode, gc?.electionStartAt]);

  // Factual caption — a real open/close window derived from the resolved schedule
  // (empty-guarded so an invalid date renders nothing rather than "เปิดโหวต ").
  // Single-date + time window is the system's own convention (closed/page.js + the
  // other families) — the production election is same-day.
  let factual = null;
  if (variant === "waiting") {
    const d = formatThaiDate(ELECTION_START);
    if (d) factual = `เปิดโหวต ${d} · ${formatThaiTime(ELECTION_START)}–${formatThaiTime(ELECTION_END)}`;
  } else if (variant === "ended") {
    const d = formatThaiDate(ELECTION_END);
    if (d) factual = `ปิดหีบ ${d} · ${formatThaiTime(ELECTION_END)}`;
  }

  return (
    <div className="fms-app bl-root bl-closed-root">
      <BlossomBaseStyles />

      {/* organic candy blobs (morph slowly, absolute within .bl-root) */}
      <span className="bl-blob bl-blob-1" aria-hidden="true" />
      <span className="bl-blob bl-blob-2" aria-hidden="true" />

      <BlossomTopBar editorMode={editorMode} active="" />

      <div className="bl-page">
        {/* ===== issue line (masthead — closed variant) ===== */}
        <div className="bl-issue-line">
          <span><span className="bl-thai bl-thai--nw">สถานะระบบ</span> <b>·</b> SYSTEM STATUS</span>
          <span>{prefix} {number}</span>
        </div>

        {/* ===== ink band — quiet editorial notice (mirrors home closed grammar) ===== */}
        <section className="bl-closed-band">
          <div className="bl-closed-band__in">
            <div className="bl-closed-cap"><span className="bl-closed-cap__dia" aria-hidden="true" /><span className="bl-thai bl-thai--nw">{eyebrow.th}</span> · <span className="bl-nw">{eyebrow.en}</span></div>
            <h1 className="bl-closed-head">{title}</h1>
            <p className="bl-closed-desc">{desc}</p>

            {/* live countdown to open (waiting only) — canvas Kanit digits on the
                ink, mono unit ledger; null when the target has passed → renders
                nothing (no stuck 00:00), never gated behind opacity */}
            {cd && (
              <div className="bl-closed-cd" role="timer" aria-label="เวลาที่เหลือก่อนเปิดลงคะแนน">
                {CD_UNITS.map(([k, en, th]) => (
                  <div className="bl-closed-cd__seg" key={en}>
                    <span className="bl-closed-cd__n">{k === "d" ? cd.d : String(cd[k]).padStart(2, "0")}</span>
                    <span className="bl-closed-cd__u"><span className="bl-thai bl-thai--nw">{th}</span> / {en}</span>
                  </div>
                ))}
              </div>
            )}
            {factual && <div className="bl-closed-fact"><span className="bl-thai">{factual}</span></div>}

            <div className="bl-closed-cta">
              {variant === "ended" ? (
                <>
                  {/* ended → results is the primary act; home/logout demotes to a
                      ghost outline pill on the ink so the notice still reads as one block */}
                  <a href={editorMode ? undefined : getPath("/results")} className="bl-closed-btn">
                    ดูผลคะแนน
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v18h18M7 15l4-4 3 3 5-6" /></svg>
                  </a>
                  {session ? (
                    <button type="button" className="bl-closed-btn bl-closed-btn--ghost" onClick={() => !editorMode && onLogout()} aria-label="ออกจากระบบ">
                      ออกจากระบบ
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                    </button>
                  ) : (
                    <a href={editorMode ? undefined : getPath("/")} className="bl-closed-btn bl-closed-btn--ghost">
                      กลับหน้าแรก
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </a>
                  )}
                </>
              ) : session ? (
                <button type="button" className="bl-closed-btn" onClick={() => !editorMode && onLogout()} aria-label="ออกจากระบบ">
                  ออกจากระบบ
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                </button>
              ) : (
                <a href={editorMode ? undefined : getPath("/")} className="bl-closed-btn">
                  กลับหน้าแรก
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </a>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ===== footer — plain classic line (mirrors bl-footer on home) ===== */}
      <footer className="bl-footer">
        <p>© FMS@PSU{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
      </footer>

      <style jsx global>{`
        /* ================= SHARED CHROME (mirrors BlossomHome) ================= */
        .bl-closed-root { overflow-x:hidden; }
        /* dot-grid paper texture — above the blobs, under content */
        .bl-closed-root::after { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:radial-gradient(color-mix(in srgb, var(--bl-ink) 8%, transparent) 1px, transparent 1.4px);
          background-size:28px 28px; }
        :where(.bl-closed-root) a { color:var(--bl-primary-deep); text-decoration:none; }
        :where(.bl-closed-root) a:hover { color:var(--bl-ink); }

        .bl-closed-root .bl-blob { position:absolute; pointer-events:none; z-index:0; }
        .bl-closed-root .bl-blob-1 { top:-16vw; right:-22vw; width:64vw; height:64vw; min-width:380px; min-height:380px;
          background:color-mix(in srgb, var(--bl-primary-soft) 45%, var(--bl-canvas)); border-radius:52% 48% 60% 40%/55% 60% 40% 45%;
          animation:blMorph 14s ease-in-out infinite alternate; }
        .bl-closed-root .bl-blob-2 { bottom:4%; left:-18vw; width:46vw; height:46vw; min-width:280px; min-height:280px;
          background:color-mix(in srgb, var(--bl-sup3) 45%, var(--bl-canvas)); border-radius:60% 40% 45% 55%/45% 55% 60% 40%;
          animation:blMorph 18s ease-in-out infinite alternate-reverse; }
        @keyframes blMorph {
          0%   { border-radius:52% 48% 60% 40%/55% 60% 40% 45%; }
          50%  { border-radius:44% 56% 42% 58%/60% 42% 58% 40%; }
          100% { border-radius:58% 42% 55% 45%/42% 58% 45% 55%; }
        }

        .bl-closed-root .bl-page { position:relative; z-index:1; max-width:1200px; margin:0 auto; padding:0 22px 90px; }

        /* ---- topbar (editorial hairline skin) ---- */
        .bl-closed-root .bl-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--bl-canvas) 88%, transparent);
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
          border-bottom:1.5px solid var(--bl-ink); }
        .bl-closed-root .bl-topbar__in { max-width:1200px; margin:0 auto; padding:14px 22px;
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .bl-closed-root .bl-logo { display:inline-flex; align-items:center; flex-shrink:0; border-radius:8px; }
        .bl-closed-root .bl-logo__img { height:30px; width:auto; object-fit:contain; display:block; }
        .bl-closed-root .bl-nav { display:none; gap:20px; margin-left:auto; align-items:center; }
        .bl-closed-root .bl-nav__link { font-family:var(--bl-fm); font-size:11.5px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--bl-ink2); position:relative; padding-bottom:2px; border-radius:4px; transition:color .2s ease; }
        .bl-closed-root .bl-nav__link.on, .bl-closed-root .bl-nav__link:hover { color:var(--bl-ink); }
        .bl-closed-root .bl-nav__link::after { content:""; position:absolute; left:0; right:0; bottom:-3px; height:3px;
          background:var(--bl-primary); border-radius:2px; transform:scaleX(0); transform-origin:left;
          transition:transform .28s cubic-bezier(.22,1,.36,1); }
        .bl-closed-root .bl-nav__link:hover::after { transform:scaleX(1); }
        .bl-closed-root .bl-nav__link.on::after { transform:scaleX(1); }

        .bl-closed-root .bl-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .bl-closed-root .bl-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--bl-fd); font-weight:600;
          font-size:13px; color:var(--bl-canvas); background:var(--bl-ink); border:none; cursor:pointer;
          padding:9px 20px; border-radius:999px; transition:background .2s ease, transform .15s ease; }
        .bl-closed-root .bl-loginbtn:hover { background:var(--bl-primary-deep); transform:translateY(-1px); }
        .bl-closed-root .bl-loginbtn:active { transform:scale(.96); }
        .bl-closed-root .bl-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--bl-line) 70%, var(--bl-card)); }
        .bl-closed-root .bl-skelbar { display:block; width:58px; height:12px; border-radius:6px;
          background:color-mix(in srgb, var(--bl-ink2) 30%, var(--bl-card)); animation:blPulse 1.3s ease-in-out infinite; }
        @keyframes blPulse { 0%,100%{opacity:.45} 50%{opacity:1} }

        .bl-closed-root .bl-userchip { position:relative; }
        .bl-closed-root .bl-userchip__btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:999px; padding:5px 12px 5px 5px; cursor:pointer;
          font-family:inherit; transition:transform .15s ease, background .2s ease; }
        .bl-closed-root .bl-userchip__btn:hover { background:color-mix(in srgb, var(--bl-primary) 7%, var(--bl-card)); }
        .bl-closed-root .bl-userchip__btn:active { transform:scale(.97); }
        .bl-closed-root .bl-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:linear-gradient(135deg, var(--bl-primary), var(--bl-primary-deep)); color:var(--bl-on-primary, var(--bl-card));
          font-family:var(--bl-fd); font-weight:700; font-size:14px; line-height:1; }
        .bl-closed-root .bl-userchip__name { font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-closed-root .bl-userchip__caret { color:var(--bl-ink2); font-size:11px; }
        .bl-closed-root .bl-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:16px; overflow:hidden; z-index:50;
          box-shadow:0 18px 40px -18px color-mix(in srgb, var(--bl-ink) 12%, transparent); }
        .bl-closed-root .bl-usermenu__head { padding:14px 16px; border-bottom:1px solid var(--bl-line); }
        .bl-closed-root .bl-usermenu__name { font-family:var(--bl-fd); font-weight:700; font-size:14px; color:var(--bl-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-closed-root .bl-usermenu__id { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.04em; color:var(--bl-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-closed-root .bl-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-primary-deep); }
        .bl-closed-root .bl-usermenu__out:hover { background:color-mix(in srgb, var(--bl-primary) 10%, var(--bl-card)); }

        .bl-closed-root .bl-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:12px; background:var(--bl-card); border:1.5px solid var(--bl-ink); cursor:pointer;
          transition:transform .15s ease, background .2s ease; }
        .bl-closed-root .bl-burger:hover { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }
        .bl-closed-root .bl-burger:active { transform:scale(.95); }
        .bl-closed-root .bl-burger span { display:block; height:2.5px; border-radius:2px; background:var(--bl-ink); }

        .bl-closed-root .bl-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .bl-closed-root .bl-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .bl-closed-root .bl-sheet__link { display:flex; align-items:center; min-height:44px; padding:11px 16px; border-radius:12px;
          font-family:var(--bl-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--bl-ink);
          background:var(--bl-card); border:1px solid var(--bl-line); transition:border-color .2s ease, background .2s ease; }
        .bl-closed-root .bl-sheet__link:hover { border-color:var(--bl-primary); }
        .bl-closed-root .bl-sheet__link:active { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }

        /* focus-visible (keyboard) — 2px primary-deep outline on every interactive element */
        .bl-closed-root a:focus-visible, .bl-closed-root button:focus-visible {
          outline:2px solid var(--bl-primary-deep); outline-offset:2px; }

        /* ---- issue line (masthead) ---- */
        .bl-closed-root .bl-issue-line { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:12px 0;
          border-bottom:1px solid var(--bl-line); font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--bl-ink2); }
        .bl-closed-root .bl-issue-line b { color:var(--bl-primary-deep); font-weight:700; }

        /* ---- footer: plain classic single line, centered ---- */
        .bl-closed-root .bl-footer { margin-top:0; padding:24px 0; border-top:1px solid var(--bl-line); text-align:center;
          position:relative; z-index:1; }
        .bl-closed-root .bl-footer p { margin:0; font-size:10px; letter-spacing:.12em; text-transform:uppercase;
          font-weight:500; color:var(--bl-ink2); }

        /* ================= CLOSED PAGE (unique layout) ================= */
        /* ink band — quiet editorial notice (full-bleed, mirrors home band) */
        .bl-closed-root .bl-closed-band { position:relative; margin:64px calc(50% - 50vw) 0; padding:88px 22px 96px;
          background:var(--bl-ink); overflow:hidden; }
        .bl-closed-root .bl-closed-band__in { position:relative; z-index:1; max-width:1200px; margin:0 auto; }
        .bl-closed-root .bl-closed-cap { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.22em; text-transform:uppercase;
          color:color-mix(in srgb, var(--bl-canvas) 55%, transparent); display:flex; align-items:center; gap:12px; }
        .bl-closed-root .bl-closed-cap__dia { width:10px; height:10px; flex:none; background:var(--bl-primary); transform:rotate(45deg); }
        .bl-closed-root .bl-closed-cap::after { content:""; flex:1; height:1px; background:color-mix(in srgb, var(--bl-canvas) 20%, transparent); }

        .bl-closed-root .bl-closed-head { margin:22px 0 0; max-width:14ch; font-family:var(--bl-fd); font-weight:800;
          font-size:clamp(40px,10vw,92px); line-height:1.02; letter-spacing:-.02em; color:var(--bl-canvas);
          animation:blClosedRise .6s ease both .05s; }
        .bl-closed-root .bl-closed-desc { margin:20px 0 0; max-width:52ch; font-family:var(--bl-fd); font-weight:500;
          font-size:clamp(15px,3.6vw,19px); line-height:1.75; color:color-mix(in srgb, var(--bl-canvas) 74%, transparent);
          animation:blClosedRise .6s ease both .16s; }
        @keyframes blClosedRise { from { opacity:0; transform:translateY(16px); } }

        /* ---- state theatre (bl-B1A) ---- */
        /* live countdown — canvas Kanit digits + mono unit ledger, echoing the home
           bl-count band at notice scale. tabular digits keep the ticker from
           reflowing as seconds roll; the DAYS seg is accented primary (the family's
           one candy accent) so the notice keeps a pastel pop on the ink. */
        .bl-closed-root .bl-closed-cd { margin:32px 0 0; display:flex; align-items:flex-start;
          gap:clamp(16px,4vw,34px); flex-wrap:wrap; animation:blClosedRise .6s ease both .2s; }
        .bl-closed-root .bl-closed-cd__seg { display:flex; flex-direction:column; }
        .bl-closed-root .bl-closed-cd__n { font-family:var(--bl-fd); font-weight:800; line-height:.95;
          font-size:clamp(40px,9vw,74px); letter-spacing:-.02em; font-variant-numeric:tabular-nums; color:var(--bl-canvas); }
        .bl-closed-root .bl-closed-cd__seg:first-child .bl-closed-cd__n { color:var(--bl-primary); }
        .bl-closed-root .bl-closed-cd__u { font-family:var(--bl-fm); font-size:10px; letter-spacing:.2em;
          text-transform:uppercase; color:color-mix(in srgb, var(--bl-canvas) 50%, transparent); margin-top:9px; }

        /* factual caption — a real open/close window. The run is a full Thai sentence
           (date + time), so it uses the Thai body font (--bl-fb, via .bl-thai) and
           wraps naturally rather than the tracked mono ledger above. */
        .bl-closed-root .bl-closed-fact { margin:26px 0 0; font-size:13px; line-height:1.65;
          color:color-mix(in srgb, var(--bl-canvas) 66%, transparent); animation:blClosedRise .6s ease both .22s; }

        .bl-closed-root .bl-closed-cta { margin-top:38px; display:flex; align-items:center; gap:14px; flex-wrap:wrap;
          animation:blClosedRise .6s ease both .26s; }
        /* light pill on the ink — the primary affordance, so the notice reads as one block */
        .bl-closed-root .bl-closed-btn { display:inline-flex; align-items:center; justify-content:center; gap:10px; min-height:52px;
          padding:15px 30px; border-radius:999px; font-family:var(--bl-fd); font-weight:700; font-size:16px;
          color:var(--bl-ink); background:var(--bl-canvas); border:none; cursor:pointer;
          transition:transform .2s ease, background .25s ease, color .25s ease, box-shadow .25s ease; }
        .bl-closed-root .bl-closed-btn:hover { transform:translateY(-3px); color:var(--bl-ink);
          background:color-mix(in srgb, var(--bl-primary) 16%, var(--bl-canvas)); }
        .bl-closed-root .bl-closed-btn:active { transform:scale(.97); }
        .bl-closed-root .bl-closed-btn svg { flex:none; transition:transform .25s ease; }
        .bl-closed-root .bl-closed-btn:hover svg { transform:translateX(4px); }
        /* ghost secondary (ended only) — outline-on-ink so the results pill stays the
           lead act; canvas ring via inset shadow (no layout shift vs the solid pill) */
        .bl-closed-root .bl-closed-btn--ghost { background:transparent; color:var(--bl-canvas);
          box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--bl-canvas) 58%, transparent); }
        .bl-closed-root .bl-closed-btn--ghost:hover { color:var(--bl-canvas);
          background:color-mix(in srgb, var(--bl-canvas) 12%, transparent);
          box-shadow:inset 0 0 0 2px var(--bl-canvas); }

        /* ================= TABLET+ : inline nav replaces burger/sheet ================= */
        @media (min-width:768px) {
          .bl-closed-root .bl-topbar__in { gap:22px; }
          .bl-closed-root .bl-nav { display:flex; }
          .bl-closed-root .bl-userwrap { margin-left:0; }
          .bl-closed-root .bl-burger, .bl-closed-root .bl-sheet { display:none; }
          .bl-closed-root .bl-footer p { font-size:12px; }
        }

        /* ================= MOBILE (<=560): tighten band ================= */
        @media (max-width:560px) {
          .bl-closed-root .bl-closed-band { padding:64px 20px 72px; }
          .bl-closed-root .bl-closed-btn { width:100%; }
          .bl-closed-root .bl-closed-cd { gap:16px; }
        }

        /* reduced motion — scope to .bl-closed-root, keep transitions */
        @media (prefers-reduced-motion:reduce) {
          .bl-closed-root *, .bl-closed-root *::before, .bl-closed-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
