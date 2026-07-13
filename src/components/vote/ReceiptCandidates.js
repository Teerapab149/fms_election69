"use client";

// ReceiptCandidates — CANDIDATES page for the "Receipt · Paper Materiality"
// template family (Template #6), in the print/desk language of ReceiptHome (R2.5)
// and the ballot pages (R3). This is Receipt's INDEX MOMENT — the parties laid out
// as printed campaign FLYERS resting on the polling desk:
//   • masthead: mono issue-line + eyebrow + a structural title ("ผู้สมัคร") with the
//     party count as a big tabular numeral
//   • each party is a die-cut paper FLYER (4px corners, a hair of alternating tilt,
//     a curl shadow that falls down-right) headed by an INK-STAMP of the party number
//     (two-ring stamp, not an icon), then logo · name · slogan · team count · a
//     "ดูรายละเอียด →" tag. The flyer links to the party detail via getPath.
//
// Pseudo-candidates (number <= 0 — งดออกเสียง / ไม่รับรอง) are NOT parties and never
// render as flyers (same filter as the classic page: parseInt(number) > 0). Data
// flows in from the shared CandidatesPage exactly like the classic layout; this
// component is pure presentation.
//
// Colours flow ONLY through var(--rc-*) emitted by ReceiptBaseStyles on .rc-root — a
// theme swap re-tints the whole page in place. The shared desk language (laid paper /
// vignette / emboss seals / holo foil) comes from .rc-desk; topbar + footer mirror
// ReceiptHome.

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
  const copyrightYear = gc.copyrightYear ?? "";

  // pseudo-candidates (งดออกเสียง / ไม่รับรอง, number <= 0) are NOT parties — mirror
  // the classic page filter (parseInt(number) > 0).
  const parties = (candidates || []).filter((p) => p && parseInt(p.number) > 0);
  const count = parties.length;

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
          <span>ผู้สมัคร · CANDIDATES</span>
          <span>{prefix} {number}</span>
        </div>

        {/* ===== masthead ===== */}
        <header className="rc-chead">
          <div className="rc-chead__l">
            <span className="rc-chead__eyebrow">◆ {faculty} ELECTION · ผู้ลงสมัคร ◆</span>
            <h1 className="rc-chead__title">ผู้สมัคร</h1>
          </div>
          <div className="rc-chead__meta">
            <span className="rc-chead__count">{pad2(count)}</span>
            <span className="rc-chead__count-lab">พรรค<br />PARTIES</span>
          </div>
        </header>
        <p className="rc-chead__deck">เลือกพรรคเพื่อเปิดอ่านวิสัยทัศน์ นโยบาย และรายชื่อทีมงานทั้งหมด ก่อนตัดสินใจกาบัตรลงคะแนน</p>

        {/* ===== party flyers on the desk ===== */}
        {count > 0 ? (
          <ul className="rc-flyers">
            {parties.map((p, i) => {
              const logo = resolveSrc(p.logoUrl);
              const memberCount = p.members?.length || 0;
              return (
                <li className="rc-flyer" key={p.id || i}>
                  <a className="rc-flyer__link" href={editorMode ? undefined : getPath(`/party?id=${p.number}`)}>
                    {/* two-ring ink stamp of the party number (not an icon) */}
                    <span className="rc-flyer__stamp" aria-hidden="true">
                      <span className="rc-flyer__stamp-ring" />
                      <span className="rc-flyer__stamp-n">{p.number}</span>
                      <span className="rc-flyer__stamp-lab">NO.</span>
                    </span>

                    <span className="rc-flyer__logo">
                      {logo ? (
                        <img src={logo} alt={p.name} />
                      ) : (
                        <span className="rc-flyer__logo-ph" aria-hidden="true">{pad2(p.number)}</span>
                      )}
                    </span>

                    <span className="rc-flyer__body">
                      <span className="rc-flyer__kick">พรรคหมายเลข <b>{p.number}</b></span>
                      <span className="rc-flyer__name">{p.name}</span>
                      {p.slogan && <span className="rc-flyer__slogan">{p.slogan}</span>}
                      <span className="rc-flyer__stat">{memberCount > 0 ? `ทีมงาน ${memberCount} คน` : "ทีมงานกำลังปรับปรุงข้อมูล"}</span>
                    </span>

                    <span className="rc-flyer__cta">ดูรายละเอียด<span className="rc-flyer__arrow" aria-hidden="true"> →</span></span>
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rc-cand-empty">
            <span className="rc-cand-empty__lab">NO CANDIDATES YET</span>
            <span className="rc-cand-empty__th">ยังไม่มีข้อมูลผู้สมัครในขณะนี้</span>
          </div>
        )}

        {/* ===== footer — classic single centered line ===== */}
        <footer className="rc-cand-footer">
          <p>© FMS@PSU{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
        </footer>
      </div>

      <style jsx global>{`
        /* ================= BASE (the polling desk) ================= */
        /* laid-paper ::after + desk vignette ::before + emboss seals + holo foil come
           from the SHARED .rc-desk classes in ReceiptBaseStyles (R3 T1) — this root
           opts in via the rc-desk class, matching the home reference language. */
        .rc-cand-root { --rc-stamp-red:#B91C1C; overflow-x:hidden; }

        :where(.rc-cand-root) a { text-decoration:none; color:var(--rc-ink); }
        .rc-cand-root a:focus-visible, .rc-cand-root button:focus-visible {
          outline:2px solid var(--rc-accent-deep); outline-offset:3px; }

        /* ---- topbar (ported 1:1 from ReceiptHome, scoped to .rc-cand-root) ---- */
        .rc-cand-root .rc-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--rc-desk) 88%, transparent);
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px); }
        .rc-cand-root .rc-topbar::after { content:""; position:absolute; left:0; right:0; bottom:0; height:1.5px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-cand-root .rc-topbar__in { max-width:1120px; margin:0 auto; padding:12px 20px;
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .rc-cand-root .rc-logo { display:inline-flex; align-items:center; flex-shrink:0; }
        .rc-cand-root .rc-logo__img { height:30px; width:auto; object-fit:contain; display:block; }
        .rc-cand-root .rc-nav { display:none; gap:20px; margin-left:auto; align-items:center; }
        .rc-cand-root .rc-nav__link { font-family:var(--rc-fm); font-size:11px; letter-spacing:.16em;
          text-transform:uppercase; color:var(--rc-ink2); position:relative; padding-bottom:2px; transition:color .2s ease; }
        .rc-cand-root .rc-nav__link.on, .rc-cand-root .rc-nav__link:hover { color:var(--rc-ink); }
        .rc-cand-root .rc-nav__link::after { content:""; position:absolute; left:0; right:0; bottom:-3px; height:2px;
          background:var(--rc-accent); transform:scaleX(0); transform-origin:left;
          transition:transform .28s cubic-bezier(.22,1,.36,1); }
        .rc-cand-root .rc-nav__link:hover::after, .rc-cand-root .rc-nav__link.on::after { transform:scaleX(1); }
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
        .rc-cand-root .rc-userchip__btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; background:var(--rc-receipt);
          border:1.5px solid var(--rc-stamp-line); border-radius:var(--rc-radius-button, 8px); padding:5px 12px 5px 5px; cursor:pointer;
          font-family:inherit; transition:transform .15s ease, border-color .2s ease; }
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
        .rc-cand-root .rc-sheet__link { display:flex; align-items:center; min-height:44px; padding:11px 16px; border-radius:8px;
          font-family:var(--rc-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--rc-ink);
          background:var(--rc-receipt); border:1px solid var(--rc-line); transition:border-color .2s ease; }
        .rc-cand-root .rc-sheet__link:hover { border-color:var(--rc-accent); }

        /* ---- page container ---- */
        .rc-cand-root .rc-cand-wrap { position:relative; z-index:1; max-width:1120px; margin:0 auto; padding:0 20px 40px; }

        .rc-cand-root .rc-issue { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:14px 0;
          border-bottom:1px dotted var(--rc-line); font-family:var(--rc-fm); font-size:10px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--rc-faint); }

        /* ---- masthead ---- */
        .rc-cand-root .rc-chead { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap;
          margin-top:30px; padding-bottom:20px; border-bottom:1px dotted var(--rc-line); }
        .rc-cand-root .rc-chead__eyebrow { font-family:var(--rc-fm); font-size:10px; letter-spacing:.22em; text-transform:uppercase;
          color:var(--rc-ink2); }
        .rc-cand-root .rc-chead__title { margin:12px 0 0; font-family:var(--rc-fh); font-weight:700; line-height:1.02;
          letter-spacing:-.01em; font-size:clamp(38px,10vw,80px); color:var(--rc-ink); }
        .rc-cand-root .rc-chead__meta { display:flex; align-items:flex-end; gap:12px; padding-bottom:6px; }
        .rc-cand-root .rc-chead__count { font-family:var(--rc-fr); font-weight:700; font-size:clamp(38px,10vw,72px); line-height:.82;
          font-variant-numeric:tabular-nums; letter-spacing:-.02em; color:var(--rc-accent-deep); }
        .rc-cand-root .rc-chead__count-lab { font-family:var(--rc-fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase;
          color:var(--rc-ink2); line-height:1.7; padding-bottom:5px; }
        .rc-cand-root .rc-chead__deck { margin:16px 0 0; max-width:56ch; font-family:var(--rc-fr); font-size:15px;
          line-height:1.7; color:var(--rc-ink2); }

        /* ---- party flyers ---- */
        .rc-cand-root .rc-flyers { list-style:none; margin:32px 0 0; padding:0; display:grid; grid-template-columns:1fr; gap:26px; }
        .rc-cand-root .rc-flyer { position:relative; }
        /* the flyer is a SHEET OF PAPER — crisp 4px corners + a curl shadow that falls
           down-right (light from top-left, T6). Alternating tilt reads as loose sheets
           laid on the desk; hover straightens + lifts. */
        .rc-cand-root .rc-flyer__link { position:relative; display:grid; grid-template-columns:auto 1fr; gap:6px 16px;
          align-items:start; background:var(--rc-receipt); border:1px solid var(--rc-line); border-radius:4px;
          padding:22px 20px 20px; color:var(--rc-ink); transform:rotate(-.7deg); transform-origin:center;
          box-shadow:2px 16px 34px -20px color-mix(in srgb, var(--rc-ink) 32%, transparent);
          transition:transform .25s ease, box-shadow .25s ease; }
        .rc-cand-root .rc-flyer:nth-child(even) .rc-flyer__link { transform:rotate(.7deg); }
        .rc-cand-root .rc-flyer__link:hover { transform:rotate(0deg) translateY(-3px);
          box-shadow:3px 22px 42px -20px color-mix(in srgb, var(--rc-ink) 38%, transparent); }
        /* two-ring ink stamp of the party number, tilted like a real stamp */
        .rc-cand-root .rc-flyer__stamp { grid-row:1 / span 2; align-self:start; position:relative; width:66px; height:66px; flex:none;
          display:grid; place-items:center; color:var(--rc-accent-deep); transform:rotate(-8deg); }
        .rc-cand-root .rc-flyer__stamp-ring { position:absolute; inset:0; border-radius:50%;
          border:2.5px solid var(--rc-accent-deep); opacity:.82; }
        .rc-cand-root .rc-flyer__stamp-ring::after { content:""; position:absolute; inset:5px; border-radius:50%;
          border:1px solid var(--rc-accent-deep); opacity:.7; }
        .rc-cand-root .rc-flyer__stamp-n { font-family:var(--rc-fr); font-weight:700; font-size:26px; line-height:1;
          font-variant-numeric:tabular-nums; color:var(--rc-accent-deep); }
        .rc-cand-root .rc-flyer__stamp-lab { position:absolute; bottom:9px; font-family:var(--rc-fm); font-size:7px;
          letter-spacing:.18em; color:var(--rc-accent-deep); opacity:.85; }
        .rc-cand-root .rc-flyer__logo { grid-column:2; width:52px; height:52px; flex:none; border-radius:4px; overflow:hidden;
          background:var(--rc-desk); border:1px solid var(--rc-line); display:grid; place-items:center; }
        .rc-cand-root .rc-flyer__logo img { width:100%; height:100%; object-fit:cover; }
        .rc-cand-root .rc-flyer__logo-ph { font-family:var(--rc-fr); font-weight:700; font-size:18px;
          font-variant-numeric:tabular-nums; color:var(--rc-accent-deep); }
        .rc-cand-root .rc-flyer__body { grid-column:2; min-width:0; display:flex; flex-direction:column; gap:3px; }
        .rc-cand-root .rc-flyer__kick { font-family:var(--rc-fm); font-size:9.5px; letter-spacing:.16em; text-transform:uppercase;
          color:var(--rc-ink2); }
        .rc-cand-root .rc-flyer__kick b { color:var(--rc-accent-deep); font-weight:700; }
        .rc-cand-root .rc-flyer__name { font-family:var(--rc-fh); font-weight:700; font-size:clamp(20px,5vw,28px); line-height:1.14;
          letter-spacing:-.01em; color:var(--rc-ink);
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .rc-cand-root .rc-flyer__link:hover .rc-flyer__name { color:var(--rc-accent-deep); }
        .rc-cand-root .rc-flyer__slogan { margin-top:3px; font-family:var(--rc-fr); font-size:14px; line-height:1.5; color:var(--rc-ink2);
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .rc-cand-root .rc-flyer__stat { margin-top:8px; font-family:var(--rc-fm); font-size:9.5px; letter-spacing:.14em;
          text-transform:uppercase; color:var(--rc-faint); }
        /* CTA tag — ink-outline pill with an arrow that slides on hover */
        .rc-cand-root .rc-flyer__cta { grid-column:2; margin-top:14px; display:inline-flex; align-items:center; align-self:start;
          min-height:40px; padding:9px 18px; border-radius:4px; border:1.5px solid var(--rc-ink); background:none;
          font-family:var(--rc-fh); font-weight:600; font-size:14px; color:var(--rc-ink);
          transition:border-color .2s ease, color .2s ease; }
        .rc-cand-root .rc-flyer__link:hover .rc-flyer__cta { border-color:var(--rc-accent-deep); color:var(--rc-accent-deep); }
        .rc-cand-root .rc-flyer__arrow { transition:transform .25s ease; }
        .rc-cand-root .rc-flyer__link:hover .rc-flyer__arrow { transform:translateX(3px); }

        /* ---- empty state: a quiet taped slip ---- */
        .rc-cand-root .rc-cand-empty { margin-top:36px; padding:56px 24px; background:var(--rc-receipt);
          border:1px dashed var(--rc-stamp-line); border-radius:4px; text-align:center;
          display:flex; flex-direction:column; gap:12px; align-items:center;
          box-shadow:2px 14px 30px -18px color-mix(in srgb, var(--rc-ink) 26%, transparent); }
        .rc-cand-root .rc-cand-empty__lab { font-family:var(--rc-fm); font-size:11px; letter-spacing:.24em; text-transform:uppercase;
          color:var(--rc-faint); }
        .rc-cand-root .rc-cand-empty__th { font-family:var(--rc-fh); font-weight:700; font-size:clamp(18px,4.5vw,24px); color:var(--rc-ink); }

        /* ---- footer ---- */
        .rc-cand-root .rc-cand-footer { margin-top:48px; padding:22px 0; border-top:1px dotted var(--rc-line); text-align:center; }
        .rc-cand-root .rc-cand-footer p { margin:0; font-family:var(--rc-fm); font-size:10px; letter-spacing:.12em;
          text-transform:uppercase; color:var(--rc-ink2); }

        /* ================= TABLET+ : inline nav + 2-up flyers ================= */
        @media (min-width:768px) {
          .rc-cand-root .rc-topbar__in { gap:22px; }
          .rc-cand-root .rc-nav { display:flex; }
          .rc-cand-root .rc-userwrap { margin-left:0; }
          .rc-cand-root .rc-burger, .rc-cand-root .rc-sheet { display:none; }
          .rc-cand-root .rc-flyers { grid-template-columns:1fr 1fr; gap:30px; }
        }

        /* ================= MOBILE (<=420): tighten flyer padding ================= */
        @media (max-width:420px) {
          .rc-cand-root .rc-flyer__link { padding:20px 16px 18px; gap:6px 12px; }
          .rc-cand-root .rc-flyer__stamp { width:56px; height:56px; }
          .rc-cand-root .rc-flyer__stamp-n { font-size:22px; }
          .rc-cand-root .rc-seal--c { display:none; }
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
