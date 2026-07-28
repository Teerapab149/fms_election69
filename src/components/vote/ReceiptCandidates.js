"use client";

// ReceiptCandidates — CANDIDATES page for the "Receipt · Paper Materiality"
// template family (Template #6), in the print/desk language of ReceiptHome
// (v2-R1.5) and the ballot pages (R3a: ticket-stub chrome, ink stamps, lanyard
// cards, on-sheet mastheads). v2-R3b is the heaviest recompose of the family — the
// old page read as two flat white cards. The INDEX MOMENT is now a real desk:
//   • a narrow receipt INDEX strip (party directory) offset LEFT — masthead printed
//     on the sheet, then one row per party (number · name · team · a scroll link to
//     the flyer), jagged die-cut foot.
//   • the party FLYERS scatter to the RIGHT, overlapping the index edge. Each flyer
//     is a full sheet of receipt stock at a hair of alternating tilt, with: a holo
//     tape strip over the head, a 64px logo in an INK-STAMP frame, a big faint tilted
//     accent party-number stamp behind the content, name · slogan · team count, a
//     folded dog-ear corner (revealing the receiptEdge back — a fold, NOT a tear,
//     P-LOG-086), and a "เปิดแฟ้มพรรค →" ticket-STUB CTA that links to the party
//     detail via getPath. N<=2 → the flyers scale up to fill the scatter (fixes the
//     "empty half" of the small-field case); N>=3 → a masonry of overlapping sheets.
//   • the foot carries ticket-stub CTAs (home / vote) + light ephemera.
//
// Pseudo-candidates (number <= 0 — งดออกเสียง / ไม่รับรอง) are NOT parties and never
// render (same filter as the classic page: parseInt(number) > 0). Data flows in from
// the shared CandidatesPage exactly like the classic layout; this component is pure
// presentation and editor-safe (party links are stripped in editorMode).
//
// Colours flow ONLY through var(--rc-*) emitted by ReceiptBaseStyles on .rc-root — a
// theme swap re-tints the whole page in place. The shared desk language (laid paper /
// vignette / emboss seals / holo foil) comes from .rc-desk; topbar mirrors the
// ReceiptHome/ReceiptVote ticket-stub skin. Mono lines are Latin/digits only (A10.3).

import { getPath } from "../../utils/basePath";
import { ReceiptTopBar } from "../home/ReceiptHome";
import { ReceiptBaseStyles } from "../home/ReceiptTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

export default function ReceiptCandidates({ candidates = [], editorMode = false }) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";
  const faculty = gc.facultyShortEn || "FMS";
  const calYear = gc.electionCalendarYear ?? "";
  const copyrightYear = gc.copyrightYear ?? "";

  // pseudo-candidates (งดออกเสียง / ไม่รับรอง, number <= 0) are NOT parties — mirror
  // the classic page filter (parseInt(number) > 0).
  const parties = (candidates || []).filter((p) => p && parseInt(p.number) > 0);
  const count = parties.length;
  const masonry = count >= 3; // <=2 → large flyers fill the scatter; >=3 → masonry

  return (
    <div className="fms-app rc-root rc-cand-root rc-desk">
      <ReceiptBaseStyles />

      <ReceiptTopBar editorMode={editorMode} active="/candidates" />

      {/* blind-emboss seals pressed into the desk paper (shared .rc-desk-seals) */}
      <div className="rc-desk-seals" aria-hidden="true">
        <span className="rc-seal rc-seal--a"><i /><b /></span>
        <span className="rc-seal rc-seal--b"><i /><b /></span>
        <span className="rc-seal rc-seal--c"><i /><b /></span>
      </div>

      <div className="rc-cand-wrap">
        {/* ===== issue / eyebrow line ===== */}
        <div className="rc-issue">
          <span><span className="rc-th">ผู้สมัคร</span> · CANDIDATES</span>
          <span>{prefix} {number}</span>
        </div>

        {count > 0 ? (
          <div className="rc-cand-stage">
            {/* ---- LEFT: the INDEX strip (party directory), masthead on the sheet ---- */}
            <aside className="rc-index" aria-label="สารบบผู้สมัคร">
              <div className="rc-index-mast">
                <span className="rc-index-serial rc-mono">INDEX · No. {prefix} {number} · {pad2(count)}</span>
                <span className="rc-index-eyebrow rc-mono">✶ {faculty} ELECTION{calYear !== "" ? ` · ${calYear}` : ""} ✶</span>
                <h1 className="rc-index-title">ผู้สมัคร</h1>
                <div className="rc-index-count"><strong>{pad2(count)}</strong><span><span className="rc-th">พรรค</span><br />PARTIES</span></div>
                <p className="rc-index-deck">เลือกพรรคเพื่อเปิดอ่านวิสัยทัศน์ นโยบาย และรายชื่อทีมงานทั้งหมด ก่อนตัดสินใจกาบัตร</p>
              </div>
              <div className="rc-perf" aria-hidden="true" />

              <ol className="rc-index-list">
                <li className="rc-index-head" aria-hidden="true"><span>NO.</span><span><span className="rc-th">พรรค</span> · PARTY</span></li>
                {parties.map((p, i) => (
                  <li className="rc-index-row" key={p.id || i}>
                    <a className="rc-index-link" href={`#rc-flyer-${p.number}`}>
                      <span className="rc-index-num">{pad2(p.number)}</span>
                      <span className="rc-index-body">
                        <span className="rc-index-name">{p.name}</span>
                        <span className="rc-index-team rc-mono">{p.members?.length ? `${p.members.length} MEMBERS` : "TEAM TBA"}</span>
                      </span>
                      <span className="rc-index-arrow" aria-hidden="true">↓</span>
                    </a>
                  </li>
                ))}
              </ol>
              <div className="rc-index-foot" aria-hidden="true">✶ ✶ ✶ <span className="rc-th">สิ้นสุดสารบบ</span> ✶ ✶ ✶</div>
            </aside>

            {/* ---- RIGHT: the party FLYERS scattered on the desk ---- */}
            <ul className={`rc-flyers${masonry ? " rc-flyers--masonry" : ""}`}>
              {parties.map((p, i) => {
                const logo = resolveSrc(p.logoUrl);
                const memberCount = p.members?.length || 0;
                return (
                  <li className="rc-flyer" id={`rc-flyer-${p.number}`} key={p.id || i}>
                    <a className="rc-flyer__link" href={editorMode ? undefined : getPath(`/party?id=${p.number}`)}>
                      {/* big faint tilted accent number stamp behind the content */}
                      <span className="rc-flyer__wm" aria-hidden="true"><span>{p.number}</span></span>
                      {/* holo tape strip over the head */}
                      <span className="rc-flyer__tape" aria-hidden="true"><span className="rc-foil" /></span>
                      {/* folded dog-ear corner — reveals the receiptEdge back (a fold, not a tear) */}
                      <span className="rc-flyer__fold" aria-hidden="true" />

                      <span className="rc-flyer__head">
                        <span className="rc-flyer__logo">
                          {logo ? (
                            <img src={logo} alt={p.name} width="64" height="64" loading="lazy" />
                          ) : (
                            <span className="rc-flyer__logo-ph" aria-hidden="true">{pad2(p.number)}</span>
                          )}
                        </span>
                        <span className="rc-flyer__no rc-mono"><span className="rc-th">พรรคหมายเลข</span><b>{pad2(p.number)}</b></span>
                      </span>

                      <span className="rc-flyer__body">
                        <span className="rc-flyer__name">{p.name}</span>
                        {p.slogan && <span className="rc-flyer__slogan">{p.slogan}</span>}
                        <span className="rc-flyer__stat">{memberCount > 0 ? <><span className="rc-th">ทีมงาน</span> {memberCount} <span className="rc-th">คน</span></> : <span className="rc-th">ทีมงานกำลังปรับปรุงข้อมูล</span>}</span>
                      </span>

                      <span className="rc-flyer__cta">เปิดแฟ้มพรรค<span className="rc-flyer__arrow" aria-hidden="true"> →</span></span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="rc-cand-empty">
            <span className="rc-cand-empty__lab">NO CANDIDATES YET</span>
            <span className="rc-cand-empty__th">ยังไม่มีข้อมูลผู้สมัครในขณะนี้</span>
          </div>
        )}

        {/* ===== foot band — ticket-stub CTAs + light ephemera ===== */}
        {count > 0 && (
          <div className="rc-cand-foot">
            <div className="rc-cand-stubs">
              <a href={editorMode ? undefined : getPath("/")} className="rc-stubcta">
                <span aria-hidden="true">← </span>กลับหน้าแรก
              </a>
              <a href={editorMode ? undefined : getPath("/vote")} className="rc-stubcta rc-stubcta--go">
                ไปลงคะแนน<span className="rc-flyer__arrow" aria-hidden="true"> →</span>
              </a>
            </div>
            <span className="rc-chip" aria-hidden="true"><span className="rc-foil rc-foil--conic" /></span>
            <span className="rc-cand-ref rc-mono" aria-hidden="true">{prefix} {number} · INDEX · {pad2(count)}</span>
          </div>
        )}

        {/* ===== footer — classic single centered line ===== */}
        <footer className="rc-cand-footer">
          <p>© {gc.facultyShortEn || "FMS"}@{gc.university || "PSU"}{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
        </footer>
      </div>

      <style jsx global>{`
        /* ================= BASE (the polling desk) ================= */
        /* laid-paper ::after + desk vignette ::before + emboss seals + holo foil come
           from the SHARED .rc-desk classes in ReceiptBaseStyles (R3 T1) — this root
           opts in via the rc-desk class, matching the home reference language. */
        /* clip not hidden — hidden makes overflow-y compute to auto, this root becomes the
           scroll container, and every sticky child (.rc-topbar, .rc-index) pins to it
           instead of the viewport, i.e. never pins at all. xo=0 on every viewport. */
        .rc-cand-root { --rc-stamp-red:#B91C1C; overflow-x:clip; }

        :where(.rc-cand-root) a { text-decoration:none; color:var(--rc-ink); }
        .rc-cand-root a:focus-visible, .rc-cand-root button:focus-visible {
          outline:2px solid var(--rc-accent-deep); outline-offset:3px; }
        /* mono utility — ONLY Latin / digits / symbols ever wear it (A10.3) */
        .rc-cand-root .rc-mono { font-family:var(--rc-fm); }
        /* Thai-in-a-mono-line utility — the Thai half of a bilingual mono label wears
           Chakra Petch so it never falls back (Space Mono has no Thai glyphs, C4) */
        .rc-cand-root .rc-th { font-family:var(--rc-fr) !important; }

        /* ---- topbar "head of the desk" (A3 / ruling #4: NO backdrop-filter — opaque
           desk fill + a perforated hairline; ticket-stub nav ported from ReceiptHome) ---- */
        .rc-cand-root .rc-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--rc-desk) 96%, var(--rc-receipt)); }
        .rc-cand-root .rc-topbar::after { content:""; position:absolute; left:0; right:0; bottom:0; height:1.5px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-cand-root .rc-topbar__in { max-width:1120px; margin:0 auto; padding:10px 20px;
          display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
        .rc-cand-root .rc-logo { position:relative; display:inline-flex; align-items:center; flex-shrink:0;
          padding:6px 12px 6px 14px; background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px);
          box-shadow:1px 3px 8px -5px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-cand-root .rc-logo::before { content:""; position:absolute; left:-3px; top:8px; width:10px; height:18px;
          border:2px solid var(--rc-faint); border-right:none; border-radius:6px 0 0 6px; background:transparent; transform:rotate(-4deg); }
        .rc-cand-root .rc-logo__img { height:28px; width:auto; object-fit:contain; display:block; }
        .rc-cand-root .rc-nav { display:none; gap:8px; margin-left:auto; align-items:center; }
        .rc-cand-root .rc-nav__link { position:relative; display:inline-flex; align-items:center; min-height:40px;
          font-family:var(--rc-fr); font-weight:600; font-size:12.5px; letter-spacing:.01em; color:var(--rc-ink2);
          padding:0 13px 0 16px; background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px);
          transition:transform .15s ease, color .2s ease, background .2s ease, border-color .2s ease; }
        .rc-cand-root .rc-nav__link::before { content:""; position:absolute; left:4px; top:7px; bottom:7px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 2px, transparent 2px 5px); }
        .rc-cand-root .rc-nav__link:hover { transform:translateY(-1px); color:var(--rc-ink); border-color:var(--rc-accent); }
        .rc-cand-root .rc-nav__link.on { color:var(--rc-accent-deep); border-color:var(--rc-accent);
          background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); }
        .rc-cand-root .rc-nav__link.on::before { left:1px;
          background:repeating-linear-gradient(180deg, var(--rc-accent) 0 2px, transparent 2px 5px); }
        .rc-cand-root .rc-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .rc-cand-root .rc-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--rc-fh);
          font-weight:600; font-size:13px; color:var(--rc-on-accent); background:var(--rc-accent); border:none; cursor:pointer;
          padding:9px 20px; border-radius:var(--rc-radius-button, 8px); transition:background .2s ease, transform .15s ease; }
        .rc-cand-root .rc-loginbtn:hover { background:var(--rc-accent-deep); transform:translateY(-1px); }
        .rc-cand-root .rc-loginbtn:active { transform:scale(.96); }
        .rc-cand-root .rc-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--rc-line) 70%, var(--rc-receipt)); }
        .rc-cand-root .rc-skelbar { display:block; width:58px; height:12px; border-radius:3px;
          background:color-mix(in srgb, var(--rc-ink2) 30%, var(--rc-receipt)); animation:rcPulse 1.3s ease-in-out infinite; }
        @keyframes rcPulse { 0%,100%{opacity:.45} 50%{opacity:1} }
        .rc-cand-root .rc-userchip { position:relative; }
        .rc-cand-root .rc-userchip__btn { position:relative; display:inline-flex; align-items:center; gap:9px; min-height:44px;
          background:var(--rc-receipt); border:1.5px solid var(--rc-stamp-line); padding:5px 14px 5px 5px; cursor:pointer;
          font-family:inherit; clip-path:polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
          transition:transform .15s ease, border-color .2s ease; }
        .rc-cand-root .rc-userchip__btn::after { content:""; position:absolute; top:5px; right:12px; width:9px; height:9px;
          border-radius:50%; background:var(--rc-desk);
          box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--rc-faint) 62%, var(--rc-ink2)); }
        .rc-cand-root .rc-userchip__btn:hover { border-color:var(--rc-accent); }
        .rc-cand-root .rc-userchip__btn:active { transform:scale(.97); }
        .rc-cand-root .rc-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:var(--rc-accent); color:var(--rc-on-accent); font-family:var(--rc-fh); font-weight:700; font-size:14px; line-height:1; }
        .rc-cand-root .rc-userchip__name { font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-cand-root .rc-userchip__caret { color:var(--rc-ink2); font-size:11px; }
        .rc-cand-root .rc-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--rc-receipt);
          border:1.5px solid var(--rc-stamp-line); border-radius:10px; overflow:hidden; z-index:50;
          box-shadow:2px 20px 42px -20px color-mix(in srgb, var(--rc-ink) 22%, transparent); }
        .rc-cand-root .rc-usermenu__head { padding:14px 16px; border-bottom:1px dotted var(--rc-line); }
        .rc-cand-root .rc-usermenu__name { font-family:var(--rc-fh); font-weight:700; font-size:14px; color:var(--rc-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-cand-root .rc-usermenu__id { font-family:var(--rc-fm); font-size:10.5px; letter-spacing:.04em; color:var(--rc-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-cand-root .rc-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-accent-deep); }
        .rc-cand-root .rc-usermenu__out:hover { background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); }
        .rc-cand-root .rc-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:8px; background:var(--rc-receipt); border:1.5px solid var(--rc-stamp-line); cursor:pointer;
          transition:transform .15s ease, border-color .2s ease; }
        .rc-cand-root .rc-burger:hover { border-color:var(--rc-accent); }
        .rc-cand-root .rc-burger:active { transform:scale(.95); }
        .rc-cand-root .rc-burger span { display:block; height:2.5px; border-radius:2px; background:var(--rc-ink); }
        .rc-cand-root .rc-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .rc-cand-root .rc-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .rc-cand-root .rc-sheet__link { position:relative; display:flex; align-items:center; min-height:48px; padding:0 16px 0 20px;
          font-family:var(--rc-fr); font-weight:600; font-size:14px; color:var(--rc-ink);
          background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px); transition:border-color .2s ease; }
        .rc-cand-root .rc-sheet__link::before { content:""; position:absolute; left:5px; top:9px; bottom:9px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 2px, transparent 2px 5px); }
        .rc-cand-root .rc-sheet__link:hover { border-color:var(--rc-accent); }

        /* ---- page container ---- */
        .rc-cand-root .rc-cand-wrap { position:relative; z-index:1; max-width:1120px; margin:0 auto; padding:0 20px 40px; }
        .rc-cand-root .rc-issue { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:14px 0;
          border-bottom:1px dotted var(--rc-line); font-family:var(--rc-fm); font-size:10px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--rc-faint); }

        /* ================= STAGE — index strip offset left + flyers scatter right ================= */
        .rc-cand-root .rc-cand-stage { position:relative; margin-top:26px; display:flex; flex-direction:column; gap:26px; }

        /* ---- the INDEX strip (receipt stock, masthead printed on it) ---- */
        .rc-cand-root .rc-index { position:relative; z-index:1; align-self:flex-start; width:100%; background:var(--rc-receipt);
          border:1px solid var(--rc-line); border-radius:4px 4px 0 0; padding:24px clamp(16px,4vw,24px) 6px;
          background-image:repeating-linear-gradient(180deg, transparent 0 30px, color-mix(in srgb, var(--rc-ink) 3%, transparent) 30px 31px);
          box-shadow:2px 16px 34px -20px color-mix(in srgb, var(--rc-ink) 34%, transparent); }
        .rc-cand-root .rc-index-mast { position:relative; }
        .rc-cand-root .rc-index-serial { display:block; font-size:10px; letter-spacing:.14em; color:var(--rc-ink2); font-variant-numeric:tabular-nums; }
        .rc-cand-root .rc-index-eyebrow { display:block; margin-top:10px; font-size:9.5px; letter-spacing:.2em; color:var(--rc-faint); }
        .rc-cand-root .rc-index-title { margin:6px 0 0; font-family:var(--rc-fh); font-weight:700; line-height:1.02;
          letter-spacing:-.01em; font-size:clamp(34px,8vw,58px); color:var(--rc-ink); }
        .rc-cand-root .rc-index-count { display:flex; align-items:flex-end; gap:10px; margin-top:12px; }
        .rc-cand-root .rc-index-count strong { font-family:var(--rc-fr); font-weight:700; font-size:clamp(30px,7vw,44px); line-height:.82;
          font-variant-numeric:tabular-nums; letter-spacing:-.02em; color:var(--rc-accent-deep); }
        .rc-cand-root .rc-index-count span { font-family:var(--rc-fm); font-size:9px; letter-spacing:.18em; text-transform:uppercase;
          color:var(--rc-ink2); line-height:1.6; padding-bottom:4px; }
        .rc-cand-root .rc-index-deck { margin:14px 0 0; max-width:42ch; font-family:var(--rc-fr); font-size:13.5px; line-height:1.6; color:var(--rc-ink2); }
        .rc-cand-root .rc-index .rc-perf { margin:18px calc(-1 * clamp(16px,4vw,24px)) 0; height:1px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }

        /* ---- directory rows — a receipt table of contents ---- */
        .rc-cand-root .rc-index-list { list-style:none; margin:14px 0 0; padding:0; }
        .rc-cand-root .rc-index-head { display:flex; align-items:center; justify-content:space-between;
          padding-bottom:9px; margin-bottom:2px; border-bottom:1.5px solid var(--rc-ink);
          font-family:var(--rc-fm); font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--rc-faint); }
        .rc-cand-root .rc-index-row { border-bottom:1px dotted var(--rc-line); }
        .rc-cand-root .rc-index-row:last-child { border-bottom:none; }
        .rc-cand-root .rc-index-link { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:14px;
          padding:13px 4px; color:var(--rc-ink); transition:background .2s ease, padding-left .2s ease; }
        .rc-cand-root .rc-index-link:hover { background:color-mix(in srgb, var(--rc-accent) 6%, var(--rc-receipt)); padding-left:9px; }
        .rc-cand-root .rc-index-num { font-family:var(--rc-fr); font-weight:700; font-size:20px; font-variant-numeric:tabular-nums;
          letter-spacing:.02em; color:var(--rc-accent-deep); width:34px; flex:none; }
        .rc-cand-root .rc-index-body { min-width:0; display:flex; flex-direction:column; gap:2px; }
        /* 3 lines, not 2: this rail IS the party directory, and the longest real name
           (53 Thai chars) needed a third line in the 260px column — at 2 it ended
           "…เพื่อการ…" (scrollHeight 61 vs 38 clientHeight). Rows are already
           variable-height, so nothing else moves. */
        /* INK GUTTER — the heading face (IBM Plex Sans Thai) has a 1.654em font box,
           so ANY line-height under that lets the line-clamp's own overflow:hidden cut
           real glyph ink off the top: at 16px/1.2 the tallest Thai stack (upper vowel +
           tone, e.g. "ที่") overshot the box by 3.90px and the tone mark vanished
           outright ("คนที่" printed as "คนที"). .32em of padding-top, pulled straight
           back out with a matching negative margin-top, gives the marks room without
           moving a single pixel of layout. padding-BOTTOM is deliberately NOT used —
           Chrome paints the clamped-away next line into it (measured: a 4th line
           bled through on a 3-line clamp). Descenders already fit (cutBot −1.1px). */
        .rc-cand-root .rc-index-name { font-family:var(--rc-fh); font-weight:700; font-size:16px; line-height:1.2; color:var(--rc-ink);
          padding-top:.32em; margin-top:-.32em;
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; }
        .rc-cand-root .rc-index-link:hover .rc-index-name { color:var(--rc-accent-deep); }
        .rc-cand-root .rc-index-team { font-size:9px; letter-spacing:.14em; color:var(--rc-faint); }
        .rc-cand-root .rc-index-arrow { font-family:var(--rc-fr); font-size:15px; color:var(--rc-ink2); transition:transform .2s ease; }
        .rc-cand-root .rc-index-link:hover .rc-index-arrow { transform:translateY(2px); color:var(--rc-accent-deep); }
        .rc-cand-root .rc-index-foot { position:relative; text-align:center; padding:14px 0 20px; margin-top:6px;
          background:var(--rc-receipt); font-family:var(--rc-fm); font-size:9px; letter-spacing:.24em; color:var(--rc-faint);
          box-shadow:2px 16px 34px -20px color-mix(in srgb, var(--rc-ink) 34%, transparent);
          -webkit-mask:radial-gradient(6px 8px at 8px 100%, transparent 96%, #000) bottom left/16px 8px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat;
                  mask:radial-gradient(6px 8px at 8px 100%, transparent 96%, #000) bottom left/16px 8px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat; }

        /* ================= party FLYERS ================= */
        /* mobile-first: a single column of full-width flyers under the index. A hair of
           alternating tilt reads as loose sheets laid on the desk; hover straightens
           + lifts. scroll-margin lands the anchor jump below the sticky topbar. */
        .rc-cand-root .rc-flyers { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:24px; }
        .rc-cand-root .rc-flyer { position:relative; scroll-margin-top:86px; break-inside:avoid; }
        .rc-cand-root .rc-flyer__link { position:relative; display:block; overflow:hidden; background:var(--rc-receipt);
          border:1px solid var(--rc-line); border-radius:4px; padding:24px 22px 22px; color:var(--rc-ink);
          transform:rotate(-1.4deg); transform-origin:center;
          box-shadow:2px 18px 38px -22px color-mix(in srgb, var(--rc-ink) 34%, transparent);
          transition:transform .25s ease, box-shadow .25s ease; }
        .rc-cand-root .rc-flyer:nth-child(even) .rc-flyer__link { transform:rotate(2deg); }
        .rc-cand-root .rc-flyer__link:hover { transform:rotate(0deg) translateY(-3px);
          box-shadow:3px 24px 46px -22px color-mix(in srgb, var(--rc-ink) 40%, transparent); }

        /* big faint tilted accent party-number stamp behind the content */
        .rc-cand-root .rc-flyer__wm { position:absolute; z-index:0; right:-6px; bottom:-30px; line-height:.7; pointer-events:none;
          font-family:var(--rc-fr); font-weight:700; font-variant-numeric:tabular-nums; font-size:clamp(150px,32vw,220px);
          color:var(--rc-accent); opacity:.07; transform:rotate(-9deg); }
        .rc-cand-root .rc-flyer__wm span { display:block; }
        /* holographic tape strip over the flyer head */
        .rc-cand-root .rc-flyer__tape { position:absolute; z-index:3; top:-9px; left:34px; width:78px; height:24px; border-radius:2px;
          overflow:hidden; opacity:.6; mix-blend-mode:multiply; transform:rotate(-5deg);
          box-shadow:1px 2px 3px -1px color-mix(in srgb, var(--rc-ink) 30%, transparent); }
        .rc-cand-root .rc-flyer__tape .rc-foil { position:absolute; inset:-40%; }
        /* folded dog-ear — bottom-right corner peeled up, showing the receiptEdge back */
        .rc-cand-root .rc-flyer__fold { position:absolute; z-index:3; right:0; bottom:0; width:30px; height:30px;
          background:linear-gradient(135deg, transparent 0 46%, var(--rc-receipt-edge) 47% 100%);
          box-shadow:inset 2px 2px 4px -1px color-mix(in srgb, var(--rc-ink) 34%, transparent);
          border-top-left-radius:5px; }

        .rc-cand-root .rc-flyer__head { position:relative; z-index:1; display:flex; align-items:center; gap:14px; }
        /* logo 64px in an INK-STAMP frame (double ink ring) */
        /* FLEX centring, not grid: a percentage max-height does not resolve against a
           grid area, so the img below kept its intrinsic ratio height (76px in a 60px
           content box → the bottom 16px of every portrait mark was cut). Flex gives the
           item a definite container height and max-height:100% finally applies. */
        .rc-cand-root .rc-flyer__logo { position:relative; width:64px; height:64px; flex:none; border-radius:5px; overflow:hidden;
          background:var(--rc-desk); border:2px solid var(--rc-stamp-line);
          display:flex; align-items:center; justify-content:center; padding:3px;
          box-shadow:inset 0 0 0 3px var(--rc-receipt), inset 0 0 0 4px color-mix(in srgb, var(--rc-stamp-line) 60%, transparent); }
        /* a party LOGO must never be cropped — letterbox it inside the stamp frame.
           (width/height:100% + object-fit:cover cut ~20% off the bottom of every
           portrait logo.) */
        .rc-cand-root .rc-flyer__logo img { max-width:100%; max-height:100%; width:auto; height:auto;
          object-fit:contain; border-radius:2px; }
        .rc-cand-root .rc-flyer__logo-ph { font-family:var(--rc-fr); font-weight:700; font-size:22px; font-variant-numeric:tabular-nums;
          color:var(--rc-accent-deep); }
        .rc-cand-root .rc-flyer__no { display:inline-flex; align-items:baseline; gap:6px; font-size:9.5px; letter-spacing:.14em;
          text-transform:uppercase; color:var(--rc-ink2); }
        .rc-cand-root .rc-flyer__no b { font-family:var(--rc-fr); font-weight:700; font-size:16px; color:var(--rc-accent-deep);
          font-variant-numeric:tabular-nums; letter-spacing:0; }

        .rc-cand-root .rc-flyer__body { position:relative; z-index:1; display:flex; flex-direction:column; gap:3px; margin-top:16px; }
        /* 3 lines: in the 2-column masonry the 53-char name needs a third line at 30px
           (scrollHeight 108 vs 67 clientHeight → the headline of the card was cut).
           On phones the same name already fits in 2, so nothing moves there. */
        /* ink gutter — see .rc-index-name. Tighter here (1.12) so the overshoot is
           worse: 8.70px at the 30px size. */
        .rc-cand-root .rc-flyer__name { font-family:var(--rc-fh); font-weight:700; font-size:clamp(21px,5vw,30px); line-height:1.12;
          letter-spacing:-.01em; color:var(--rc-ink); padding-top:.32em; margin-top:-.32em;
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; }
        .rc-cand-root .rc-flyer__link:hover .rc-flyer__name { color:var(--rc-accent-deep); }
        .rc-cand-root .rc-flyer__slogan { margin-top:4px; font-family:var(--rc-fr); font-size:14px; line-height:1.5; color:var(--rc-ink2);
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .rc-cand-root .rc-flyer__stat { margin-top:10px; font-family:var(--rc-fm); font-size:9.5px; letter-spacing:.14em;
          text-transform:uppercase; color:var(--rc-faint); }
        /* CTA = a ticket STUB (cut corner + left perforation, A3) */
        .rc-cand-root .rc-flyer__cta { position:relative; z-index:1; margin-top:18px; display:inline-flex; align-items:center;
          min-height:44px; padding:0 16px 0 20px; background:var(--rc-receipt); border:1.5px solid var(--rc-ink);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px);
          font-family:var(--rc-fh); font-weight:600; font-size:14px; color:var(--rc-ink);
          transition:border-color .2s ease, color .2s ease, transform .18s ease; }
        .rc-cand-root .rc-flyer__cta::before { content:""; position:absolute; left:5px; top:8px; bottom:8px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-ink) 0 2px, transparent 2px 5px); }
        .rc-cand-root .rc-flyer__link:hover .rc-flyer__cta { border-color:var(--rc-accent-deep); color:var(--rc-accent-deep); transform:translateY(-1px); }
        .rc-cand-root .rc-flyer__link:hover .rc-flyer__cta::before { background:repeating-linear-gradient(180deg, var(--rc-accent-deep) 0 2px, transparent 2px 5px); }
        .rc-cand-root .rc-flyer__arrow { transition:transform .25s ease; }
        .rc-cand-root .rc-flyer__link:hover .rc-flyer__arrow { transform:translateX(3px); }

        /* ================= foot band — ticket-stub CTAs + ephemera ================= */
        .rc-cand-root .rc-cand-foot { margin-top:40px; padding-top:22px; border-top:1px dotted var(--rc-line);
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .rc-cand-root .rc-cand-stubs { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .rc-cand-root .rc-stubcta { position:relative; display:inline-flex; align-items:center; gap:4px; min-height:44px;
          padding:0 16px 0 20px; font-family:var(--rc-fh); font-weight:600; font-size:14px; color:var(--rc-ink);
          background:var(--rc-receipt); border:1.5px solid var(--rc-ink);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px);
          transition:transform .18s ease, border-color .2s ease, color .2s ease; }
        .rc-cand-root .rc-stubcta::before { content:""; position:absolute; left:5px; top:8px; bottom:8px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-ink) 0 2px, transparent 2px 5px); }
        .rc-cand-root .rc-stubcta:hover { transform:translateY(-2px); color:var(--rc-accent-deep); border-color:var(--rc-accent-deep); }
        .rc-cand-root .rc-stubcta:active { transform:scale(.98); }
        .rc-cand-root .rc-stubcta--go { border-color:var(--rc-accent); color:var(--rc-accent-deep);
          background:color-mix(in srgb, var(--rc-accent) 7%, var(--rc-receipt)); }
        .rc-cand-root .rc-chip { position:relative; width:40px; height:40px; border-radius:50%; overflow:hidden; flex:none;
          transform:rotate(12deg); box-shadow:1px 8px 18px -10px color-mix(in srgb, var(--rc-ink) 42%, transparent); }
        .rc-cand-root .rc-chip .rc-foil { position:absolute; inset:-30%; }
        .rc-cand-root .rc-cand-ref { margin-left:auto; font-size:9px; letter-spacing:.2em; color:var(--rc-faint); font-variant-numeric:tabular-nums; }

        /* ---- empty state: a quiet taped slip ---- */
        .rc-cand-root .rc-cand-empty { margin-top:36px; padding:56px 24px; background:var(--rc-receipt);
          border:1px dashed var(--rc-stamp-line); border-radius:4px; text-align:center;
          display:flex; flex-direction:column; gap:12px; align-items:center;
          box-shadow:2px 14px 30px -18px color-mix(in srgb, var(--rc-ink) 26%, transparent); }
        .rc-cand-root .rc-cand-empty__lab { font-family:var(--rc-fm); font-size:11px; letter-spacing:.24em; text-transform:uppercase;
          color:var(--rc-faint); }
        .rc-cand-root .rc-cand-empty__th { font-family:var(--rc-fh); font-weight:700; font-size:clamp(18px,4.5vw,24px); color:var(--rc-ink); }

        /* ---- footer ---- */
        .rc-cand-root .rc-cand-footer { margin-top:40px; padding:22px 0; border-top:1px dotted var(--rc-line); text-align:center; }
        .rc-cand-root .rc-cand-footer p { margin:0; font-family:var(--rc-fm); font-size:10px; letter-spacing:.12em;
          text-transform:uppercase; color:var(--rc-ink2); }

        /* ================= TABLET+ : inline nav ================= */
        @media (min-width:768px) {
          .rc-cand-root .rc-topbar__in { gap:22px; }
          .rc-cand-root .rc-nav { display:flex; }
          .rc-cand-root .rc-userwrap { margin-left:0; }
          .rc-cand-root .rc-burger, .rc-cand-root .rc-sheet { display:none; }
        }

        /* ================= DESKTOP : index strip LEFT + flyers scatter RIGHT ================= */
        /* the index is a narrow sticky strip offset LEFT; the flyers pull LEFT to
           OVERLAP its right edge (>=34px). N<=2 → one column of large flyers filling
           the scatter; N>=3 → a 2-column masonry of overlapping sheets. */
        @media (min-width:1024px) {
          .rc-cand-root .rc-cand-stage { display:grid; align-items:start;
            grid-template-columns:minmax(0, 340px) minmax(0, 1fr); column-gap:0; row-gap:0;
            padding-left:max(0px, calc(4vw - 20px)); }
          .rc-cand-root .rc-index { grid-column:1; grid-row:1; position:sticky; top:80px;
            /* keep the directory content clear of the 34px flyer overlap: inset the
               index text; the perforation keeps bleeding to the true paper edge */
            padding-right:calc(clamp(16px,4vw,24px) + 30px); }
          .rc-cand-root .rc-index .rc-perf { margin-right:calc(-1 * clamp(16px,4vw,24px) - 30px); }
          .rc-cand-root .rc-flyers { grid-column:2; grid-row:1; margin-left:-34px; z-index:2; margin-top:12px; }
          /* N<=2: large single-column flyers fill the right scatter */
          .rc-cand-root .rc-flyers:not(.rc-flyers--masonry) .rc-flyer__link { padding:30px 28px 26px; }
          /* N>=3: masonry of overlapping sheets */
          .rc-cand-root .rc-flyers--masonry { display:block; column-count:2; column-gap:22px; }
          .rc-cand-root .rc-flyers--masonry .rc-flyer { display:inline-block; width:100%; margin:0 0 22px; }
        }

        /* ================= MOBILE : index first, single-column flyers (tilt reduced) ================= */
        @media (max-width:767px) {
          .rc-cand-root .rc-flyer__link { transform:rotate(-1deg); }
          .rc-cand-root .rc-flyer:nth-child(even) .rc-flyer__link { transform:rotate(1deg); }
        }
        @media (max-width:420px) {
          .rc-cand-root .rc-flyer__link { padding:22px 18px 20px; }
          .rc-cand-root .rc-flyer__wm { font-size:clamp(130px,40vw,170px); }
          .rc-cand-root .rc-seal--c { display:none; }
          .rc-cand-root .rc-cand-ref { display:none; }
        }

        /* reduced motion — freeze every animation (foil stays statically iridescent),
           full page visible. Scoped to .rc-cand-root. */
        @media (prefers-reduced-motion:reduce) {
          .rc-cand-root *, .rc-cand-root *::before, .rc-cand-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
