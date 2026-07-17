"use client";

// BlossomSuccess — POST-VOTE SUCCESS for the "Blossom Civic" template family, in
// the "Candy Editorial" language (same family as BlossomHome / BlossomCandidates,
// a UNIQUE celebration page). The CLIMAX moment: it reuses the home's full-bleed
// INK BAND as the centerpiece — a giant canvas headline "ลงคะแนนเรียบร้อย" with a
// hollow-stroke accent word, a mono bilingual receipt line, a solid geometric
// diamond index, and subtle solid-shape confetti (geometry only — no icons,
// reduced-motion-safe). Below the band: the NEXT-STEP panel with the evaluation
// entry point (opens the SHARED Google-Form modal owned by success/page.js — its
// semantics are untouched here), a results pill (getPath("/results"), gated until
// the form is done), and the home link.
//
// Pure presentation. success/page.js owns auth, the redirect guards, and the form
// + alert modals; this component only renders the Blossom chrome and calls
// onOpenForm. Colours flow ONLY through var(--bl-*), emitted by BlossomBaseStyles
// on .bl-root — a theme swap re-tints the whole page in place. The chrome (topbar
// + footer + blobs + dot-grid) mirrors BlossomHome byte-for-byte (only one Blossom
// page renders at a time, so the CSS is carried locally).

import { getPath } from "../../utils/basePath";
import { BlossomTopBar } from "../home/BlossomHome";
import { BlossomBaseStyles } from "../home/BlossomTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

export default function BlossomSuccess({ user = null, isUnlocked = false, onOpenForm = () => {}, editorMode = false }) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";
  const org = gc.organizationName || "สโมสรนักศึกษาคณะวิทยาการจัดการ";
  const copyrightYear = gc.copyrightYear ?? "";
  const sid = user?.studentId || (editorMode ? "6610510149" : "—");
  const name = user?.name || (editorMode ? "นักศึกษาตัวอย่าง" : "");

  const resultsUnlocked = isUnlocked || editorMode;

  return (
    <div className="fms-app bl-root bl-succ-root">
      <BlossomBaseStyles />

      {/* organic candy blobs (morph slowly, absolute within .bl-root) */}
      <span className="bl-blob bl-blob-1" aria-hidden="true" />
      <span className="bl-blob bl-blob-2" aria-hidden="true" />

      <BlossomTopBar editorMode={editorMode} active="" />

      <div className="bl-page">
        {/* ===== issue line (masthead — success variant) ===== */}
        <div className="bl-issue-line">
          <span>สำเร็จ <b>·</b> BALLOT RECORDED</span>
          <span>{prefix} {number}</span>
        </div>

        {/* ===== ink band — THE CLIMAX (mirrors home countdown band) ===== */}
        <section className="bl-succ-band">
          {/* confetti: solid geometry only (circles + diamonds), decorative,
              nuked by reduced-motion. base state is fully visible. */}
          <span className="bl-confetti" aria-hidden="true">
            <i className="bl-cf bl-cf--c bl-cf-1" /><i className="bl-cf bl-cf--d bl-cf-2" />
            <i className="bl-cf bl-cf--c bl-cf-3" /><i className="bl-cf bl-cf--d bl-cf-4" />
            <i className="bl-cf bl-cf--c bl-cf-5" /><i className="bl-cf bl-cf--d bl-cf-6" />
            <i className="bl-cf bl-cf--c bl-cf-7" /><i className="bl-cf bl-cf--d bl-cf-8" />
          </span>

          <div className="bl-succ-band__in">
            <div className="bl-succ-cap"><span className="bl-succ-cap__dia" aria-hidden="true" />บันทึกคะแนนแล้ว / BALLOT RECORDED</div>
            <h1 className="bl-succ-head">
              <span className="bl-succ-reveal"><span className="bl-succ-reveal__in bl-succ-solid">ลงคะแนน</span></span>
              <span className="bl-succ-reveal"><span className="bl-succ-reveal__in bl-succ-hollow">เรียบร้อย</span></span>
            </h1>
            <p className="bl-succ-deck">ขอบคุณที่ร่วมเป็นส่วนหนึ่งในการขับเคลื่อนกิจกรรมนักศึกษา {org}</p>

            {/* receipt line — mono, editorial */}
            <div className="bl-succ-receipt">
              <span className="bl-succ-receipt__row"><b>VOTER ID</b>{sid}</span>
              {name && <span className="bl-succ-receipt__row"><b>NAME</b>{name}</span>}
              <span className="bl-succ-receipt__row bl-succ-receipt__row--sec"><b>SECURED BY</b>PSU Passport</span>
            </div>

            {/* form-first CTA — the primary evaluation entry lives IN the ink band, at
                the climax, so it lands in the first viewport (v2-R8 T1). onOpenForm +
                isUnlocked gating are unchanged from the former next-section button. */}
            <div className="bl-succ-cta">
              <span className="bl-succ-cta__kick">ขั้นตอนสุดท้าย · 2 นาที · รับชั่วโมงกิจกรรม 2 ชม.</span>
              {isUnlocked && !editorMode ? (
                <div className="bl-succ-cta__done">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                  ส่งแบบประเมินเรียบร้อยแล้ว
                </div>
              ) : (
                <button type="button" className="bl-succ-cta__btn" onClick={() => !editorMode && onOpenForm()}>
                  เปิดแบบประเมิน (รับชั่วโมงกิจกรรม)
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ===== next step — evaluation entry + results + home (on canvas) ===== */}
        <section className="bl-succ-next">
          <header className="bl-succ-next__head">
            <span className="bl-succ-next__idx">04</span>
            <div>
              <span className="bl-succ-next__kick">ขั้นตอนถัดไป <b>·</b> NEXT STEP</span>
              <h2 className="bl-succ-next__title">ทำแบบประเมินเพื่อรับสิทธิ์</h2>
              <p className="bl-succ-next__desc">
                กรอกแบบประเมินให้ครบถ้วนเพื่อรับชั่วโมงกิจกรรม 2 ชั่วโมง และปลดล็อกหน้าสรุปผลคะแนนเสียง
              </p>
              <div className="bl-succ-tags">
                <span className="bl-succ-tag">ชั่วโมงกิจกรรม 2 ชม.</span>
                <span className="bl-succ-tag bl-succ-tag--alt">ประเภทเลือกเข้าร่วม</span>
              </div>
            </div>
          </header>

          <div className="bl-succ-actions">
            {/* the PRIMARY evaluate CTA now lives in the ink band above (v2-R8 T1);
                this section keeps the supporting results pill + home link only. The
                results gating (resultsUnlocked) is unchanged. */}
            <a
              href={resultsUnlocked ? getPath("/results") : undefined}
              className={`bl-succ-btn bl-succ-btn--results ${resultsUnlocked ? "" : "is-disabled"}`}
              aria-disabled={resultsUnlocked ? undefined : "true"}
            >
              {resultsUnlocked ? (
                <>ดูผลคะแนน · Results
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  ล็อก — ทำแบบประเมินก่อน
                </>
              )}
            </a>

            <a href={editorMode ? undefined : getPath("/")} className="bl-succ-home">← กลับหน้าแรก</a>
          </div>
        </section>
      </div>

      {/* ===== footer — plain classic line (mirrors bl-footer on home) ===== */}
      <footer className="bl-footer">
        <p>© FMS@PSU{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
      </footer>

      <style jsx global>{`
        /* ================= SHARED CHROME (mirrors BlossomHome) ================= */
        .bl-succ-root { overflow-x:hidden; }
        /* dot-grid paper texture — above the blobs, under content */
        .bl-succ-root::after { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:radial-gradient(color-mix(in srgb, var(--bl-ink) 8%, transparent) 1px, transparent 1.4px);
          background-size:28px 28px; }
        :where(.bl-succ-root) a { color:var(--bl-primary-deep); text-decoration:none; }
        :where(.bl-succ-root) a:hover { color:var(--bl-ink); }

        .bl-succ-root .bl-blob { position:absolute; pointer-events:none; z-index:0; }
        .bl-succ-root .bl-blob-1 { top:-16vw; right:-22vw; width:64vw; height:64vw; min-width:380px; min-height:380px;
          background:color-mix(in srgb, var(--bl-primary-soft) 45%, var(--bl-canvas)); border-radius:52% 48% 60% 40%/55% 60% 40% 45%;
          animation:blMorph 14s ease-in-out infinite alternate; }
        .bl-succ-root .bl-blob-2 { bottom:4%; left:-18vw; width:46vw; height:46vw; min-width:280px; min-height:280px;
          background:color-mix(in srgb, var(--bl-sup3) 45%, var(--bl-canvas)); border-radius:60% 40% 45% 55%/45% 55% 60% 40%;
          animation:blMorph 18s ease-in-out infinite alternate-reverse; }
        @keyframes blMorph {
          0%   { border-radius:52% 48% 60% 40%/55% 60% 40% 45%; }
          50%  { border-radius:44% 56% 42% 58%/60% 42% 58% 40%; }
          100% { border-radius:58% 42% 55% 45%/42% 58% 45% 55%; }
        }

        .bl-succ-root .bl-page { position:relative; z-index:1; max-width:1200px; margin:0 auto; padding:0 22px 90px; }

        /* ---- topbar (editorial hairline skin) ---- */
        .bl-succ-root .bl-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--bl-canvas) 88%, transparent);
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
          border-bottom:1.5px solid var(--bl-ink); }
        .bl-succ-root .bl-topbar__in { max-width:1200px; margin:0 auto; padding:14px 22px;
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .bl-succ-root .bl-logo { display:inline-flex; align-items:center; flex-shrink:0; border-radius:8px; }
        .bl-succ-root .bl-logo__img { height:30px; width:auto; object-fit:contain; display:block; }
        .bl-succ-root .bl-nav { display:none; gap:20px; margin-left:auto; align-items:center; }
        .bl-succ-root .bl-nav__link { font-family:var(--bl-fm); font-size:11.5px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--bl-ink2); position:relative; padding-bottom:2px; border-radius:4px; transition:color .2s ease; }
        .bl-succ-root .bl-nav__link.on, .bl-succ-root .bl-nav__link:hover { color:var(--bl-ink); }
        .bl-succ-root .bl-nav__link::after { content:""; position:absolute; left:0; right:0; bottom:-3px; height:3px;
          background:var(--bl-primary); border-radius:2px; transform:scaleX(0); transform-origin:left;
          transition:transform .28s cubic-bezier(.22,1,.36,1); }
        .bl-succ-root .bl-nav__link:hover::after { transform:scaleX(1); }
        .bl-succ-root .bl-nav__link.on::after { transform:scaleX(1); }

        .bl-succ-root .bl-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .bl-succ-root .bl-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--bl-fd); font-weight:600;
          font-size:13px; color:var(--bl-canvas); background:var(--bl-ink); border:none; cursor:pointer;
          padding:9px 20px; border-radius:999px; transition:background .2s ease, transform .15s ease; }
        .bl-succ-root .bl-loginbtn:hover { background:var(--bl-primary-deep); transform:translateY(-1px); }
        .bl-succ-root .bl-loginbtn:active { transform:scale(.96); }
        .bl-succ-root .bl-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--bl-line) 70%, var(--bl-card)); }
        .bl-succ-root .bl-skelbar { display:block; width:58px; height:12px; border-radius:6px;
          background:color-mix(in srgb, var(--bl-ink2) 30%, var(--bl-card)); animation:blPulse 1.3s ease-in-out infinite; }
        @keyframes blPulse { 0%,100%{opacity:.45} 50%{opacity:1} }

        .bl-succ-root .bl-userchip { position:relative; }
        .bl-succ-root .bl-userchip__btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:999px; padding:5px 12px 5px 5px; cursor:pointer;
          font-family:inherit; transition:transform .15s ease, background .2s ease; }
        .bl-succ-root .bl-userchip__btn:hover { background:color-mix(in srgb, var(--bl-primary) 7%, var(--bl-card)); }
        .bl-succ-root .bl-userchip__btn:active { transform:scale(.97); }
        .bl-succ-root .bl-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:linear-gradient(135deg, var(--bl-primary), var(--bl-primary-deep)); color:var(--bl-on-primary, var(--bl-card));
          font-family:var(--bl-fd); font-weight:700; font-size:14px; line-height:1; }
        .bl-succ-root .bl-userchip__name { font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-succ-root .bl-userchip__caret { color:var(--bl-ink2); font-size:11px; }
        .bl-succ-root .bl-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:16px; overflow:hidden; z-index:50;
          box-shadow:0 18px 40px -18px color-mix(in srgb, var(--bl-ink) 12%, transparent); }
        .bl-succ-root .bl-usermenu__head { padding:14px 16px; border-bottom:1px solid var(--bl-line); }
        .bl-succ-root .bl-usermenu__name { font-family:var(--bl-fd); font-weight:700; font-size:14px; color:var(--bl-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-succ-root .bl-usermenu__id { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.04em; color:var(--bl-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-succ-root .bl-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-primary-deep); }
        .bl-succ-root .bl-usermenu__out:hover { background:color-mix(in srgb, var(--bl-primary) 10%, var(--bl-card)); }

        .bl-succ-root .bl-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:12px; background:var(--bl-card); border:1.5px solid var(--bl-ink); cursor:pointer;
          transition:transform .15s ease, background .2s ease; }
        .bl-succ-root .bl-burger:hover { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }
        .bl-succ-root .bl-burger:active { transform:scale(.95); }
        .bl-succ-root .bl-burger span { display:block; height:2.5px; border-radius:2px; background:var(--bl-ink); }

        .bl-succ-root .bl-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .bl-succ-root .bl-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .bl-succ-root .bl-sheet__link { display:flex; align-items:center; min-height:44px; padding:11px 16px; border-radius:12px;
          font-family:var(--bl-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--bl-ink);
          background:var(--bl-card); border:1px solid var(--bl-line); transition:border-color .2s ease, background .2s ease; }
        .bl-succ-root .bl-sheet__link:hover { border-color:var(--bl-primary); }
        .bl-succ-root .bl-sheet__link:active { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }

        /* focus-visible (keyboard) — 2px primary-deep outline on every interactive element */
        .bl-succ-root a:focus-visible, .bl-succ-root button:focus-visible {
          outline:2px solid var(--bl-primary-deep); outline-offset:2px; }

        /* ---- issue line (masthead) ---- */
        .bl-succ-root .bl-issue-line { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:12px 0;
          border-bottom:1px solid var(--bl-line); font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--bl-ink2); }
        .bl-succ-root .bl-issue-line b { color:var(--bl-primary-deep); font-weight:700; }

        /* ---- footer: plain classic single line, centered ---- */
        .bl-succ-root .bl-footer { margin-top:0; padding:24px 0; border-top:1px solid var(--bl-line); text-align:center;
          position:relative; z-index:1; }
        .bl-succ-root .bl-footer p { margin:0; font-size:10px; letter-spacing:.12em; text-transform:uppercase;
          font-weight:500; color:var(--bl-ink2); }

        /* ================= SUCCESS PAGE (unique layout) ================= */
        /* ---- ink band centerpiece (full-bleed, mirrors home countdown band) ---- */
        .bl-succ-root .bl-succ-band { position:relative; margin:44px calc(50% - 50vw) 0; padding:68px 22px 74px;
          background:var(--bl-ink); overflow:hidden; }
        .bl-succ-root .bl-succ-band__in { position:relative; z-index:1; max-width:1200px; margin:0 auto; }
        .bl-succ-root .bl-succ-cap { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.22em; text-transform:uppercase;
          color:color-mix(in srgb, var(--bl-canvas) 55%, transparent); display:flex; align-items:center; gap:12px; }
        .bl-succ-root .bl-succ-cap__dia { width:10px; height:10px; flex:none; background:var(--bl-primary); transform:rotate(45deg); }
        .bl-succ-root .bl-succ-cap::after { content:""; flex:1; height:1px; background:color-mix(in srgb, var(--bl-canvas) 20%, transparent); }

        /* headline — solid canvas + hollow-stroke accent (entrance = CSS-only,
           base state visible; reduced-motion lands it visible) */
        .bl-succ-root .bl-succ-head { margin:18px 0 0; font-family:var(--bl-fd); font-weight:800; line-height:.98;
          font-size:clamp(52px,13vw,124px); letter-spacing:-.03em; }
        .bl-succ-root .bl-succ-reveal { display:block; overflow:hidden; }
        .bl-succ-root .bl-succ-reveal__in { display:block; animation:blSuccUp .62s cubic-bezier(.22,1,.36,1) both; }
        .bl-succ-root .bl-succ-head .bl-succ-reveal:nth-child(1) .bl-succ-reveal__in { animation-delay:.08s; }
        .bl-succ-root .bl-succ-head .bl-succ-reveal:nth-child(2) .bl-succ-reveal__in { animation-delay:.2s; }
        @keyframes blSuccUp { from { transform:translateY(108%); } }
        .bl-succ-root .bl-succ-solid { color:var(--bl-canvas); }
        .bl-succ-root .bl-succ-hollow { color:transparent;
          -webkit-text-stroke:2.5px var(--bl-primary); text-stroke:2.5px var(--bl-primary); }
        @supports not (-webkit-text-stroke: 1px #000) {
          .bl-succ-root .bl-succ-hollow { color:var(--bl-primary); -webkit-text-stroke:0; text-stroke:0; }
        }
        .bl-succ-root .bl-succ-deck { margin:22px 0 0; max-width:560px; font-family:var(--bl-fd); font-weight:500;
          font-size:clamp(15px,3.6vw,18px); line-height:1.7; color:color-mix(in srgb, var(--bl-canvas) 78%, transparent); }

        /* receipt line — mono chips on the ink */
        .bl-succ-root .bl-succ-receipt { margin-top:30px; display:flex; flex-wrap:wrap; gap:10px 26px;
          padding-top:20px; border-top:1px solid color-mix(in srgb, var(--bl-canvas) 20%, transparent); }
        .bl-succ-root .bl-succ-receipt__row { display:inline-flex; align-items:baseline; gap:9px;
          font-family:var(--bl-fm); font-size:12px; letter-spacing:.04em; color:var(--bl-canvas); }
        .bl-succ-root .bl-succ-receipt__row b { font-weight:400; letter-spacing:.16em; text-transform:uppercase;
          color:color-mix(in srgb, var(--bl-canvas) 52%, transparent); }

        /* ---- form-first CTA ON the ink band (v2-R8 T1) — a candy pill at the climax,
           with a one-line mono kick above it to entice the tap ---- */
        .bl-succ-root .bl-succ-cta { margin-top:30px; display:flex; flex-direction:column; align-items:flex-start; gap:13px; }
        .bl-succ-root .bl-succ-cta__kick { font-family:var(--bl-fm); font-size:11px; letter-spacing:.14em; text-transform:uppercase;
          color:color-mix(in srgb, var(--bl-canvas) 62%, transparent); }
        .bl-succ-root .bl-succ-cta__btn { display:inline-flex; align-items:center; justify-content:center; gap:11px; min-height:56px;
          padding:16px 34px; border-radius:999px; border:none; cursor:pointer;
          font-family:var(--bl-fd); font-weight:700; font-size:17px;
          color:var(--bl-on-primary, var(--bl-card)); background:var(--bl-primary);
          box-shadow:0 16px 34px color-mix(in srgb, var(--bl-primary) 42%, transparent);
          transition:transform .2s ease, background .25s ease, filter .25s ease; }
        .bl-succ-root .bl-succ-cta__btn svg { flex:none; transition:transform .25s ease; }
        .bl-succ-root .bl-succ-cta__btn:hover { transform:translateY(-3px); filter:brightness(1.05); }
        .bl-succ-root .bl-succ-cta__btn:hover svg { transform:translate(2px,-2px); }
        .bl-succ-root .bl-succ-cta__btn:active { transform:scale(.97); }
        .bl-succ-root .bl-succ-cta__done { display:inline-flex; align-items:center; justify-content:center; gap:10px; min-height:56px;
          padding:16px 30px; border-radius:999px; font-family:var(--bl-fd); font-weight:700; font-size:16px;
          color:var(--bl-canvas); background:color-mix(in srgb, var(--bl-primary) 28%, transparent);
          border:1.5px solid color-mix(in srgb, var(--bl-primary) 55%, transparent); }

        /* confetti — solid geometry, subtle float; nuked by reduced-motion */
        .bl-succ-root .bl-confetti { position:absolute; inset:0; z-index:0; pointer-events:none; }
        .bl-succ-root .bl-cf { position:absolute; width:11px; height:11px; opacity:.9; }
        .bl-succ-root .bl-cf--c { border-radius:50%; }
        .bl-succ-root .bl-cf--d { transform:rotate(45deg); }
        .bl-succ-root .bl-cf-1 { top:14%; left:6%; background:var(--bl-primary); animation:blCfFloat 5.5s ease-in-out infinite; }
        .bl-succ-root .bl-cf-2 { top:26%; left:22%; background:var(--bl-sup1); animation:blCfFloat 6.4s ease-in-out infinite .4s; }
        .bl-succ-root .bl-cf-3 { top:66%; left:12%; background:var(--bl-sup2); animation:blCfFloat 5.9s ease-in-out infinite .8s; }
        .bl-succ-root .bl-cf-4 { top:78%; left:30%; background:var(--bl-primary); animation:blCfFloat 6.8s ease-in-out infinite .2s; }
        .bl-succ-root .bl-cf-5 { top:18%; right:10%; background:var(--bl-sup2); animation:blCfFloat 6.1s ease-in-out infinite .6s; }
        .bl-succ-root .bl-cf-6 { top:40%; right:22%; background:var(--bl-sup1); animation:blCfFloat 5.4s ease-in-out infinite 1s; }
        .bl-succ-root .bl-cf-7 { top:70%; right:8%; background:var(--bl-primary); animation:blCfFloat 6.6s ease-in-out infinite .3s; }
        .bl-succ-root .bl-cf-8 { top:84%; right:26%; background:var(--bl-sup2); animation:blCfFloat 5.7s ease-in-out infinite .9s; }
        @keyframes blCfFloat { 0%,100%{ transform:translateY(0) rotate(var(--r,0deg)); } 50%{ transform:translateY(-10px) rotate(var(--r,0deg)); } }
        .bl-succ-root .bl-cf--d { --r:45deg; }

        /* ---- next step (on canvas) ---- */
        .bl-succ-root .bl-succ-next { margin-top:54px; display:grid; gap:34px; grid-template-columns:1fr;
          animation:blSuccRise .6s ease both .1s; }
        @keyframes blSuccRise { from { opacity:0; transform:translateY(18px); } }
        .bl-succ-root .bl-succ-next__head { display:grid; grid-template-columns:auto 1fr; gap:18px; align-items:start; }
        .bl-succ-root .bl-succ-next__idx { font-family:var(--bl-fm); font-weight:700; font-size:clamp(15px,3.4vw,20px);
          font-variant-numeric:tabular-nums; letter-spacing:.08em; color:var(--bl-faint); padding-top:6px; }
        .bl-succ-root .bl-succ-next__kick { display:block; font-family:var(--bl-fm); font-size:10px; letter-spacing:.16em;
          text-transform:uppercase; color:var(--bl-ink2); }
        .bl-succ-root .bl-succ-next__kick b { color:var(--bl-primary-deep); font-weight:700; }
        .bl-succ-root .bl-succ-next__title { margin:6px 0 0; font-family:var(--bl-fd); font-weight:800;
          font-size:clamp(24px,6vw,40px); line-height:1.12; letter-spacing:-.01em; color:var(--bl-ink); }
        .bl-succ-root .bl-succ-next__desc { margin:12px 0 0; max-width:560px; font-family:var(--bl-fd); font-weight:500;
          font-size:15px; line-height:1.8; color:var(--bl-ink2); }
        .bl-succ-root .bl-succ-tags { margin-top:16px; display:flex; flex-wrap:wrap; gap:9px; }
        .bl-succ-root .bl-succ-tag { display:inline-flex; align-items:center; padding:7px 14px; border-radius:999px;
          font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; font-weight:700;
          color:var(--bl-primary-deep); background:var(--bl-primary-soft); }
        .bl-succ-root .bl-succ-tag--alt { color:var(--bl-sup2-ink); background:var(--bl-sup2); }

        .bl-succ-root .bl-succ-actions { display:flex; flex-direction:column; gap:12px; max-width:520px; }
        .bl-succ-root .bl-succ-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px; min-height:52px;
          padding:15px 26px; border-radius:999px; font-family:var(--bl-fd); font-weight:700; font-size:16px;
          border:none; cursor:pointer; text-align:center; transition:transform .2s ease, background .25s ease, color .25s ease; }
        .bl-succ-root .bl-succ-btn svg { flex:none; transition:transform .25s ease; }
        .bl-succ-root .bl-succ-btn--primary { color:var(--bl-on-primary, var(--bl-card)); background:var(--bl-primary-deep);
          box-shadow:0 12px 26px color-mix(in srgb, var(--bl-primary-deep) 30%, transparent); }
        .bl-succ-root .bl-succ-btn--primary:hover { transform:translateY(-3px); }
        .bl-succ-root .bl-succ-btn--primary:hover svg { transform:translate(2px,-2px); }
        .bl-succ-root .bl-succ-btn--primary:active { transform:scale(.97); }
        .bl-succ-root .bl-succ-btn--results { color:var(--bl-ink); background:var(--bl-card); border:2px solid var(--bl-ink); }
        .bl-succ-root .bl-succ-btn--results:hover { color:var(--bl-primary-deep); border-color:var(--bl-primary-deep);
          transform:translateY(-2px); }
        .bl-succ-root .bl-succ-btn--results:hover svg { transform:translateX(4px); }
        .bl-succ-root .bl-succ-btn--results:active { transform:scale(.97); }
        .bl-succ-root .bl-succ-btn--results.is-disabled { color:var(--bl-faint);
          background:color-mix(in srgb, var(--bl-line) 55%, var(--bl-card)); border-color:var(--bl-line);
          cursor:not-allowed; box-shadow:none; pointer-events:none; }
        .bl-succ-root .bl-succ-done { display:inline-flex; align-items:center; justify-content:center; gap:10px; min-height:52px;
          padding:15px 26px; border-radius:999px; font-family:var(--bl-fd); font-weight:700; font-size:15px;
          color:var(--bl-primary-deep); background:var(--bl-primary-soft);
          border:1.5px solid color-mix(in srgb, var(--bl-primary) 30%, var(--bl-card)); }
        .bl-succ-root .bl-succ-home { align-self:flex-start; margin-top:6px; min-height:44px; display:inline-flex; align-items:center;
          font-family:var(--bl-fm); font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:var(--bl-ink2);
          transition:color .2s ease; }
        .bl-succ-root .bl-succ-home:hover { color:var(--bl-ink); }

        /* ================= TABLET+ : inline nav replaces burger/sheet ================= */
        @media (min-width:768px) {
          .bl-succ-root .bl-topbar__in { gap:22px; }
          .bl-succ-root .bl-nav { display:flex; }
          .bl-succ-root .bl-userwrap { margin-left:0; }
          .bl-succ-root .bl-burger, .bl-succ-root .bl-sheet { display:none; }
          .bl-succ-root .bl-footer p { font-size:12px; }
        }
        /* ================= DESKTOP: next-step becomes two columns ================= */
        @media (min-width:900px) {
          .bl-succ-root .bl-succ-next { grid-template-columns:1.3fr .9fr; align-items:start; gap:48px; }
          .bl-succ-root .bl-succ-actions { padding-top:6px; }
        }

        /* ================= MOBILE (<=560): tighten band so the form-first CTA lands
           in the first viewport (v2-R8 T1) ================= */
        @media (max-width:560px) {
          .bl-succ-root .bl-succ-band { padding:40px 20px 44px; }
          /* smaller display headline + tighter rhythm reclaim the vertical budget */
          .bl-succ-root .bl-succ-head { font-size:clamp(40px,10.5vw,124px); }
          .bl-succ-root .bl-succ-deck { margin-top:16px; }
          .bl-succ-root .bl-succ-receipt { margin-top:20px; padding-top:16px; }
          /* SECURED BY is not critical on the narrowest layout — drop it to buy space */
          .bl-succ-root .bl-succ-receipt__row--sec { display:none; }
          .bl-succ-root .bl-succ-cta { margin-top:22px; }
          .bl-succ-root .bl-succ-next__head { grid-template-columns:1fr; gap:6px; }
          .bl-succ-root .bl-succ-next__idx { padding-top:0; }
        }

        /* reduced motion — scope to .bl-succ-root, keep transitions */
        @media (prefers-reduced-motion:reduce) {
          .bl-succ-root *, .bl-succ-root *::before, .bl-succ-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
