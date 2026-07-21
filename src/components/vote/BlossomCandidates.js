"use client";

// BlossomCandidates — CANDIDATES page for the "Blossom Civic" template family,
// in the "Candy Editorial" language (same family as BlossomHome, a UNIQUE page).
//
// An editorial INDEX: a mono issue-line masthead, a hollow-stroke display word
// "ผู้สมัคร" ruled by a hairline with the party count as a giant tabular numeral,
// then the parties as INDEX ROWS (big mono index · logo · name/number/slogan ·
// member count · "ดูรายละเอียด →" pill). Echoes the home "figures" hairline
// grammar but richer. Pseudo-candidates (number <= 0 — งดออกเสียง / ไม่รับรอง)
// never render as parties. Data flows in from the shared CandidatesPage exactly
// like the classic layout (same fetch/props); this component is pure presentation.
//
// Chrome (topbar + footer) is the SAME editorial skin as home: BlossomTopBar is a
// shared named export from BlossomHome; the footer markup mirrors bl-footer. The
// chrome CSS is carried here (only one Blossom page renders at a time) so the bar +
// footer look byte-identical to home. Colours flow ONLY through var(--bl-*), emitted
// by BlossomBaseStyles on .bl-root — a theme swap re-tints the whole page in place.

import { getPath } from "../../utils/basePath";
import { BlossomTopBar } from "../home/BlossomHome";
import { BlossomBaseStyles } from "../home/BlossomTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

export default function BlossomCandidates({ candidates = [], editorMode = false }) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";
  const copyrightYear = gc.copyrightYear ?? "";

  // pseudo-candidates (งดออกเสียง / ไม่รับรอง, number <= 0) are NOT parties — mirror
  // the classic page filter (parseInt(number) > 0).
  const parties = (candidates || []).filter((p) => p && parseInt(p.number) > 0);
  const count = parties.length;

  return (
    <div className="fms-app bl-root bl-cand-root">
      <BlossomBaseStyles />

      {/* organic candy blobs (morph slowly, absolute within .bl-root) */}
      <span className="bl-blob bl-blob-1" aria-hidden="true" />
      <span className="bl-blob bl-blob-2" aria-hidden="true" />

      <BlossomTopBar editorMode={editorMode} active="/candidates" />

      <div className="bl-page">
        {/* ===== issue line (masthead — candidates variant) ===== */}
        <div className="bl-issue-line">
          <span><span className="bl-thai bl-thai--nw">ผู้สมัคร</span> <b>·</b> CANDIDATES</span>
          <span>{prefix} {number}</span>
        </div>

        {/* ===== editorial index header ===== */}
        <header className="bl-cand-head">
          <h1 className="bl-cand-word">ผู้สมัคร</h1>
          <div className="bl-cand-meta">
            <span className="bl-cand-count">{pad2(count)}</span>
            <span className="bl-cand-count-lab"><span className="bl-thai bl-thai--nw">พรรค</span><br />PARTIES</span>
          </div>
        </header>
        <p className="bl-cand-deck">
          เลือกพรรคเพื่อเปิดอ่านวิสัยทัศน์ นโยบาย และรายชื่อทีมงานทั้งหมด ก่อนตัดสินใจกาบัตรลงคะแนน
        </p>

        {/* ===== party index rows ===== */}
        {count > 0 ? (
          <ul className="bl-cand-list">
            {parties.map((p, i) => {
              const logo = resolveSrc(p.logoUrl);
              const memberCount = p.members?.length || 0;
              return (
                <li className="bl-crow" key={p.id || i}>
                  <a
                    className="bl-crow__link"
                    href={editorMode ? undefined : getPath(`/party?id=${p.number}`)}
                  >
                    <span className="bl-crow__idx">{pad2(i + 1)}</span>
                    <span className="bl-crow__logo">
                      {logo ? (
                        <img src={logo} alt={p.name} />
                      ) : (
                        <span className="bl-crow__logo-ph" aria-hidden="true">{pad2(p.number)}</span>
                      )}
                    </span>
                    <span className="bl-crow__body">
                      <span className="bl-crow__kick"><span className="bl-thai bl-thai--nw">พรรคหมายเลข</span> <b>{p.number}</b></span>
                      <span className="bl-crow__name">{p.name}</span>
                      {p.slogan && <span className="bl-crow__slogan">{p.slogan}</span>}
                      <span className="bl-crow__stat">
                        {memberCount > 0 ? <><span className="bl-thai bl-thai--nw">ทีมงาน</span> {memberCount} <span className="bl-thai bl-thai--nw">คน</span></> : <span className="bl-thai bl-thai--nw">ทีมงานกำลังปรับปรุงข้อมูล</span>}
                      </span>
                    </span>
                    <span className="bl-crow__cta">
                      ดูรายละเอียด
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="bl-cand-empty">
            <span className="bl-cand-empty__lab">NO CANDIDATES YET</span>
            <span className="bl-cand-empty__th">ยังไม่มีข้อมูลผู้สมัครในขณะนี้</span>
          </div>
        )}
      </div>

      {/* ===== footer — plain classic line (mirrors bl-footer on home) ===== */}
      <footer className="bl-footer">
        <p>© {gc.facultyShortEn || "FMS"}@{gc.university || "PSU"}{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
      </footer>

      <style jsx global>{`
        /* ================= SHARED CHROME (mirrors BlossomHome) ================= */
        .bl-cand-root { overflow-x:hidden; }
        /* dot-grid paper texture — above the blobs, under content */
        .bl-cand-root::after { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:radial-gradient(color-mix(in srgb, var(--bl-ink) 8%, transparent) 1px, transparent 1.4px);
          background-size:28px 28px; }
        :where(.bl-cand-root) a { color:var(--bl-primary-deep); text-decoration:none; }
        :where(.bl-cand-root) a:hover { color:var(--bl-ink); }

        .bl-cand-root .bl-blob { position:absolute; pointer-events:none; z-index:0; }
        .bl-cand-root .bl-blob-1 { top:-16vw; right:-22vw; width:64vw; height:64vw; min-width:380px; min-height:380px;
          background:color-mix(in srgb, var(--bl-primary-soft) 45%, var(--bl-canvas)); border-radius:52% 48% 60% 40%/55% 60% 40% 45%;
          animation:blMorph 14s ease-in-out infinite alternate; }
        .bl-cand-root .bl-blob-2 { bottom:4%; left:-18vw; width:46vw; height:46vw; min-width:280px; min-height:280px;
          background:color-mix(in srgb, var(--bl-sup3) 45%, var(--bl-canvas)); border-radius:60% 40% 45% 55%/45% 55% 60% 40%;
          animation:blMorph 18s ease-in-out infinite alternate-reverse; }
        @keyframes blMorph {
          0%   { border-radius:52% 48% 60% 40%/55% 60% 40% 45%; }
          50%  { border-radius:44% 56% 42% 58%/60% 42% 58% 40%; }
          100% { border-radius:58% 42% 55% 45%/42% 58% 45% 55%; }
        }

        .bl-cand-root .bl-page { position:relative; z-index:1; max-width:1200px; margin:0 auto; padding:0 22px 90px; }

        /* ---- topbar (editorial hairline skin) ---- */
        .bl-cand-root .bl-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--bl-canvas) 88%, transparent);
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
          border-bottom:1.5px solid var(--bl-ink); }
        .bl-cand-root .bl-topbar__in { max-width:1200px; margin:0 auto; padding:14px 22px;
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .bl-cand-root .bl-logo { display:inline-flex; align-items:center; flex-shrink:0; border-radius:8px; }
        .bl-cand-root .bl-logo__img { height:30px; width:auto; object-fit:contain; display:block; }
        .bl-cand-root .bl-nav { display:none; gap:20px; margin-left:auto; align-items:center; }
        .bl-cand-root .bl-nav__link { font-family:var(--bl-fm); font-size:11.5px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--bl-ink2); position:relative; padding-bottom:2px; border-radius:4px; transition:color .2s ease; }
        .bl-cand-root .bl-nav__link.on, .bl-cand-root .bl-nav__link:hover { color:var(--bl-ink); }
        .bl-cand-root .bl-nav__link::after { content:""; position:absolute; left:0; right:0; bottom:-3px; height:3px;
          background:var(--bl-primary); border-radius:2px; transform:scaleX(0); transform-origin:left;
          transition:transform .28s cubic-bezier(.22,1,.36,1); }
        .bl-cand-root .bl-nav__link:hover::after { transform:scaleX(1); }
        .bl-cand-root .bl-nav__link.on::after { transform:scaleX(1); }

        .bl-cand-root .bl-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .bl-cand-root .bl-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--bl-fd); font-weight:600;
          font-size:13px; color:var(--bl-canvas); background:var(--bl-ink); border:none; cursor:pointer;
          padding:9px 20px; border-radius:999px; transition:background .2s ease, transform .15s ease; }
        .bl-cand-root .bl-loginbtn:hover { background:var(--bl-primary-deep); transform:translateY(-1px); }
        .bl-cand-root .bl-loginbtn:active { transform:scale(.96); }
        .bl-cand-root .bl-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--bl-line) 70%, var(--bl-card)); }
        .bl-cand-root .bl-skelbar { display:block; width:58px; height:12px; border-radius:6px;
          background:color-mix(in srgb, var(--bl-ink2) 30%, var(--bl-card)); animation:blPulse 1.3s ease-in-out infinite; }
        @keyframes blPulse { 0%,100%{opacity:.45} 50%{opacity:1} }

        .bl-cand-root .bl-userchip { position:relative; }
        .bl-cand-root .bl-userchip__btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:999px; padding:5px 12px 5px 5px; cursor:pointer;
          font-family:inherit; transition:transform .15s ease, background .2s ease; }
        .bl-cand-root .bl-userchip__btn:hover { background:color-mix(in srgb, var(--bl-primary) 7%, var(--bl-card)); }
        .bl-cand-root .bl-userchip__btn:active { transform:scale(.97); }
        .bl-cand-root .bl-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:linear-gradient(135deg, var(--bl-primary), var(--bl-primary-deep)); color:var(--bl-on-primary, var(--bl-card));
          font-family:var(--bl-fd); font-weight:700; font-size:14px; line-height:1; }
        .bl-cand-root .bl-userchip__name { font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-cand-root .bl-userchip__caret { color:var(--bl-ink2); font-size:11px; }
        .bl-cand-root .bl-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:16px; overflow:hidden; z-index:50;
          box-shadow:0 18px 40px -18px color-mix(in srgb, var(--bl-ink) 12%, transparent); }
        .bl-cand-root .bl-usermenu__head { padding:14px 16px; border-bottom:1px solid var(--bl-line); }
        .bl-cand-root .bl-usermenu__name { font-family:var(--bl-fd); font-weight:700; font-size:14px; color:var(--bl-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-cand-root .bl-usermenu__id { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.04em; color:var(--bl-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-cand-root .bl-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-primary-deep); }
        .bl-cand-root .bl-usermenu__out:hover { background:color-mix(in srgb, var(--bl-primary) 10%, var(--bl-card)); }

        .bl-cand-root .bl-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:12px; background:var(--bl-card); border:1.5px solid var(--bl-ink); cursor:pointer;
          transition:transform .15s ease, background .2s ease; }
        .bl-cand-root .bl-burger:hover { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }
        .bl-cand-root .bl-burger:active { transform:scale(.95); }
        .bl-cand-root .bl-burger span { display:block; height:2.5px; border-radius:2px; background:var(--bl-ink); }

        .bl-cand-root .bl-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .bl-cand-root .bl-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .bl-cand-root .bl-sheet__link { display:flex; align-items:center; min-height:44px; padding:11px 16px; border-radius:12px;
          font-family:var(--bl-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--bl-ink);
          background:var(--bl-card); border:1px solid var(--bl-line); transition:border-color .2s ease, background .2s ease; }
        .bl-cand-root .bl-sheet__link:hover { border-color:var(--bl-primary); }
        .bl-cand-root .bl-sheet__link:active { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }

        /* focus-visible (keyboard) — 2px primary-deep outline on every interactive element */
        .bl-cand-root a:focus-visible, .bl-cand-root button:focus-visible {
          outline:2px solid var(--bl-primary-deep); outline-offset:2px; }

        /* ---- issue line (masthead) ---- */
        .bl-cand-root .bl-issue-line { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:12px 0;
          border-bottom:1px solid var(--bl-line); font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--bl-ink2); }
        .bl-cand-root .bl-issue-line b { color:var(--bl-primary-deep); font-weight:700; }

        /* ---- footer: plain classic single line, centered ---- */
        .bl-cand-root .bl-footer { margin-top:0; padding:24px 0; border-top:1px solid var(--bl-line); text-align:center;
          position:relative; z-index:1; }
        .bl-cand-root .bl-footer p { margin:0; font-size:10px; letter-spacing:.12em; text-transform:uppercase;
          font-weight:500; color:var(--bl-ink2); }

        /* ================= CANDIDATES PAGE (unique layout) ================= */
        /* editorial index header — hollow display word ruled by a hairline, count as
           a giant tabular numeral. base state is fully visible (entrance only supplies
           the hidden from-frame → reduced-motion lands everything visible, no JS gate). */
        .bl-cand-root .bl-cand-head { display:flex; align-items:flex-end; justify-content:space-between; gap:24px;
          flex-wrap:wrap; margin-top:44px; padding-bottom:22px; border-bottom:1.5px solid var(--bl-ink);
          animation:blCRise .6s ease both .05s; }
        .bl-cand-root .bl-cand-word { margin:0; font-family:var(--bl-fd); font-weight:800; line-height:.9;
          font-size:clamp(56px,15vw,140px); letter-spacing:-.02em; color:transparent;
          -webkit-text-stroke:2px var(--bl-primary-deep); text-stroke:2px var(--bl-primary-deep); }
        @supports not (-webkit-text-stroke: 1px #000) {
          .bl-cand-root .bl-cand-word { color:var(--bl-primary-deep); -webkit-text-stroke:0; text-stroke:0; }
        }
        .bl-cand-root .bl-cand-meta { display:flex; align-items:flex-end; gap:12px; padding-bottom:8px; }
        .bl-cand-root .bl-cand-count { font-family:var(--bl-fd); font-weight:800; font-size:clamp(44px,11vw,88px); line-height:.8;
          font-variant-numeric:tabular-nums; letter-spacing:-.03em; color:var(--bl-ink); }
        .bl-cand-root .bl-cand-count-lab { font-family:var(--bl-fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase;
          color:var(--bl-ink2); line-height:1.7; padding-bottom:6px; }
        .bl-cand-root .bl-cand-deck { margin:20px 0 0; max-width:560px; font-family:var(--bl-fd); font-weight:500;
          font-size:clamp(15px,3.6vw,18px); line-height:1.7; color:var(--bl-ink2);
          animation:blCRise .6s ease both .18s; }

        /* ---- party index rows ---- */
        .bl-cand-root .bl-cand-list { list-style:none; margin:44px 0 0; padding:0;
          border-top:1px solid var(--bl-line); }
        .bl-cand-root .bl-crow { border-bottom:1px solid var(--bl-line); animation:blCRise .55s ease both; }
        .bl-cand-root .bl-crow:nth-child(1) { animation-delay:.06s; }
        .bl-cand-root .bl-crow:nth-child(2) { animation-delay:.12s; }
        .bl-cand-root .bl-crow:nth-child(3) { animation-delay:.18s; }
        .bl-cand-root .bl-crow:nth-child(4) { animation-delay:.24s; }
        .bl-cand-root .bl-crow:nth-child(n+5) { animation-delay:.3s; }
        .bl-cand-root .bl-crow__link { display:grid; grid-template-columns:auto auto 1fr auto; align-items:center;
          gap:18px; padding:22px 8px; color:var(--bl-ink);
          transition:background .25s ease, padding-left .25s ease; }
        .bl-cand-root .bl-crow__link:hover { color:var(--bl-ink);
          background:color-mix(in srgb, var(--bl-primary) 7%, var(--bl-canvas)); padding-left:18px; }
        .bl-cand-root .bl-crow__link:active { background:color-mix(in srgb, var(--bl-primary) 11%, var(--bl-canvas)); }
        .bl-cand-root .bl-crow__idx { font-family:var(--bl-fm); font-weight:700; font-size:clamp(15px,3.4vw,20px);
          font-variant-numeric:tabular-nums; letter-spacing:.08em; color:var(--bl-faint); width:38px; flex:none; }
        .bl-cand-root .bl-crow__logo { width:62px; height:62px; flex:none; border-radius:16px; overflow:hidden;
          background:var(--bl-card); border:1.5px solid var(--bl-line); display:grid; place-items:center; }
        .bl-cand-root .bl-crow__logo img { width:100%; height:100%; object-fit:cover; }
        .bl-cand-root .bl-crow__logo-ph { font-family:var(--bl-fd); font-weight:800; font-size:20px;
          font-variant-numeric:tabular-nums; color:var(--bl-primary-deep); }
        .bl-cand-root .bl-crow__body { min-width:0; display:flex; flex-direction:column; gap:3px; }
        .bl-cand-root .bl-crow__kick { font-family:var(--bl-fm); font-size:10px; letter-spacing:.16em; text-transform:uppercase;
          color:var(--bl-ink2); }
        .bl-cand-root .bl-crow__kick b { color:var(--bl-primary-deep); font-weight:700; }
        .bl-cand-root .bl-crow__name { font-family:var(--bl-fd); font-weight:800; font-size:clamp(20px,5vw,32px); line-height:1.12;
          letter-spacing:-.01em; color:var(--bl-ink);
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .bl-cand-root .bl-crow__link:hover .bl-crow__name { color:var(--bl-primary-deep); }
        .bl-cand-root .bl-crow__slogan { margin-top:2px; font-family:var(--bl-fd); font-weight:500; font-size:14px; line-height:1.5;
          color:var(--bl-ink2); font-style:italic;
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
        .bl-cand-root .bl-crow__stat { margin-top:6px; font-family:var(--bl-fm); font-size:10px; letter-spacing:.14em;
          text-transform:uppercase; color:var(--bl-faint); }
        /* CTA: soft pill with an accent arrow that slides on row hover */
        .bl-cand-root .bl-crow__cta { display:inline-flex; align-items:center; gap:7px; flex:none; min-height:44px;
          padding:11px 20px; border-radius:999px; background:var(--bl-primary-soft);
          font-family:var(--bl-fd); font-weight:600; font-size:14px; color:var(--bl-primary-deep);
          transition:background .25s ease, transform .2s ease; }
        .bl-cand-root .bl-crow__link:hover .bl-crow__cta { background:color-mix(in srgb, var(--bl-primary) 20%, var(--bl-card)); }
        .bl-cand-root .bl-crow__cta svg { transition:transform .25s ease; }
        .bl-cand-root .bl-crow__link:hover .bl-crow__cta svg { transform:translateX(4px); }

        /* ---- empty state: editorial block, mono label, no icons ---- */
        .bl-cand-root .bl-cand-empty { margin-top:44px; padding:72px 24px; border:1.5px dashed var(--bl-line);
          border-radius:20px; text-align:center; display:flex; flex-direction:column; gap:12px; align-items:center; }
        .bl-cand-root .bl-cand-empty__lab { font-family:var(--bl-fm); font-size:11px; letter-spacing:.24em; text-transform:uppercase;
          color:var(--bl-faint); }
        .bl-cand-root .bl-cand-empty__th { font-family:var(--bl-fd); font-weight:700; font-size:clamp(18px,4.5vw,24px);
          color:var(--bl-ink); }

        @keyframes blCRise { from { opacity:0; transform:translateY(16px); } }

        /* ================= TABLET+ : inline nav replaces burger/sheet ================= */
        @media (min-width:768px) {
          .bl-cand-root .bl-topbar__in { gap:22px; }
          .bl-cand-root .bl-nav { display:flex; }
          .bl-cand-root .bl-userwrap { margin-left:0; }
          .bl-cand-root .bl-burger, .bl-cand-root .bl-sheet { display:none; }
          .bl-cand-root .bl-footer p { font-size:12px; }
          .bl-cand-root .bl-crow__link { gap:26px; padding:28px 8px; }
        }

        /* ================= MOBILE (<=560): rows stack, tap targets >=44px ================= */
        @media (max-width:560px) {
          .bl-cand-root .bl-crow__link { grid-template-columns:auto 1fr; grid-template-areas:"idx logo" "body body" "cta cta";
            gap:14px 16px; padding:20px 6px; }
          .bl-cand-root .bl-crow__idx { grid-area:idx; align-self:center; }
          .bl-cand-root .bl-crow__logo { grid-area:logo; width:54px; height:54px; }
          .bl-cand-root .bl-crow__body { grid-area:body; }
          .bl-cand-root .bl-crow__cta { grid-area:cta; justify-content:center; width:100%; }
          .bl-cand-root .bl-crow__link:hover { padding-left:6px; }
        }

        /* reduced motion — scope to .bl-cand-root, keep transitions */
        @media (prefers-reduced-motion:reduce) {
          .bl-cand-root *, .bl-cand-root *::before, .bl-cand-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
