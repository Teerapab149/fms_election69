"use client";

// ReceiptSuccess — POST-VOTE SUCCESS for the "Receipt · Paper Materiality" template
// family (Template #6), direction B ("printer moment"): a dark ballot-printer head
// with a slot, and a long thermal receipt printing DOWNWARD out of it — print
// banding, a jagged die-cut bottom edge, the ballot record, a holographic security
// strip, a barcode, a foil seal, and the "ไม่ใช่หลักฐานทางการ" stamp. Below, on the
// desk: the foil evaluation CTA + a gated results link + the home link.
//
// Pure presentation. success/page.js owns auth, the redirect guards, and the form +
// alert modals; this component only renders the Receipt chrome and calls onOpenForm.
// Colours flow ONLY through var(--rc-*), emitted by ReceiptBaseStyles on .rc-root —
// a theme swap re-tints the whole page in place.
//
// BALLOT SECRECY (CONCEPT §2 — every point is a hard gate):
//   • NO save / download / share / copy affordance anywhere.
//   • The chosen item renders ONCE, here, from the ephemeral `choice` prop (or a
//     sample in editor/preview). It is NEVER fetched or persisted; production with
//     no ephemeral choice shows a secrecy statement instead of a party.
//   • The barcode is a purely decorative CSS graphic — it encodes NOTHING. The ref
//     line is a random ephemeral ballot-ref + timestamp, NEVER the choice.
//   • The "ไม่ใช่หลักฐานทางการ / not an official record" stamp is always visible.
//
// PRINT ANIMATION (CSS-only, base-visible): the receipt rows reveal top-to-bottom
// with a stepper jitter via keyframes whose ONLY job is the hidden `from` (opacity
// 0). The BASE state is fully visible, so JS-off / reduced-motion / editorMode /
// animation:none all show the full receipt instantly — never JS-gated (past
// incident). The `.rc-printing` class (added only in the live, non-editor render)
// opts the rows into the reveal; reduced-motion nukes every animation but keeps the
// foil statically iridescent.

import { useState, useEffect } from "react";
import { getPath } from "../../utils/basePath";
import { ReceiptBaseStyles } from "../home/ReceiptTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const HEX = "0123456789ABCDEFGHJKMNPQRTUVWXY";

function randRefGroup() {
  let s = "";
  for (let i = 0; i < 4; i++) s += HEX[Math.floor(Math.random() * HEX.length)];
  return s;
}

export default function ReceiptSuccess({ user = null, isUnlocked = false, onOpenForm = () => {}, editorMode = false, choice = null }) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";
  const copyrightYear = gc.copyrightYear ?? "";

  const resultsUnlocked = isUnlocked || editorMode;

  // Ephemeral print-moment stamp (date / time / ballot-ref) — computed client-side
  // only, never persisted, never sent anywhere. editor/preview uses a stable sample
  // so the reviewed slide is deterministic (and SSR has no hydration mismatch).
  const [stamp, setStamp] = useState(
    editorMode ? { date: "06 ก.พ. 2569", time: "10:24:07", ref: "A7F3 · 90K2 · 1739 · 0847" } : null
  );
  useEffect(() => {
    if (editorMode) return;
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mon = TH_MONTHS[now.getMonth()];
    const yy = now.getFullYear() + 543; // Buddhist era
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    setStamp({
      date: `${dd} ${mon} ${yy}`,
      time: `${hh}:${mm}:${ss}`,
      ref: `${randRefGroup()} · ${randRefGroup()} · ${randRefGroup()} · ${randRefGroup()}`,
    });
  }, [editorMode]);

  // The choice is shown ONCE, ephemerally. In editor/preview a sample makes the
  // "printer moment" reviewable; in production with no ephemeral choice we show a
  // secrecy statement rather than a party (never fetched, never persisted).
  const choiceText = choice || (editorMode ? "พรรคตัวอย่างวิทยาการจัดการ" : "บันทึกแล้ว · เป็นความลับ");

  return (
    <div className={`fms-app rc-root rc-suc-root${editorMode ? "" : " rc-printing"}`}>
      <ReceiptBaseStyles />

      <div className="rc-suc-wrap">
        <div className="rc-suc-eyebrow">◆ กำลังพิมพ์ใบเสร็จ · printing ◆</div>

        {/* the ballot-printer head + slot */}
        <div className="rc-suc-machine" aria-hidden="true">
          <span className="rc-suc-led" />
          <div className="rc-suc-brand">{prefix} {number} · BALLOT PRINTER</div>
          <div className="rc-suc-slot" />
        </div>

        {/* the receipt hanging out of the slot */}
        <div className="rc-suc-receipt">
          <div className="rc-suc-pr rc-suc-logo">◆ ◆ ◆ {prefix} {number} ◆ ◆ ◆</div>
          <h1 className="rc-suc-pr rc-suc-title">บันทึกคะแนนแล้ว</h1>
          <div className="rc-suc-pr rc-suc-sub">BALLOT RECORDED</div>

          <div className="rc-suc-pr rc-suc-line"><span className="rc-suc-k">วันที่ / DATE</span><b>{stamp?.date || "—"}</b></div>
          <div className="rc-suc-pr rc-suc-line"><span className="rc-suc-k">เวลา / TIME</span><b>{stamp?.time || "—"}</b></div>

          {/* the CHOICE — rendered exactly once, ephemeral */}
          <div className="rc-suc-pr rc-suc-pick">
            <div className="rc-suc-pick-lbl">ตัวเลือกของคุณ · your choice (แสดงครั้งเดียว)</div>
            <div className="rc-suc-pick-val">{choiceText}</div>
          </div>

          {/* holographic security strip */}
          <div className="rc-suc-pr rc-suc-strip">
            <span className="rc-foil" aria-hidden="true" />
            <span className="rc-suc-strip-t">Security · ของแท้</span>
          </div>

          {/* decorative barcode — encodes NOTHING (pure CSS) */}
          <div className="rc-suc-pr rc-suc-barcode" aria-hidden="true" />
          <div className="rc-suc-pr rc-suc-ref">{stamp?.ref || "···· · ···· · ···· · ····"}</div>

          {/* foil seal */}
          <div className="rc-suc-pr rc-suc-seal" aria-hidden="true">
            <span className="rc-suc-seal-disc"><span className="rc-foil rc-foil--conic" /></span>
            <span className="rc-suc-seal-core"><b>OK</b></span>
          </div>

          {/* not-an-official-record stamp (ballot secrecy) */}
          <div className="rc-suc-pr rc-suc-stamp">✻ ไม่ใช่หลักฐานทางการ ✻</div>
        </div>

        {/* actions — on the desk, below the receipt */}
        <div className="rc-suc-actions">
          {isUnlocked && !editorMode ? (
            <div className="rc-suc-done">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              ส่งแบบประเมินเรียบร้อยแล้ว
            </div>
          ) : (
            <button type="button" className="rc-suc-cta" onClick={() => !editorMode && onOpenForm()}>
              <span className="rc-foil" aria-hidden="true" />
              <span className="rc-suc-cta-in">
                ทำแบบประเมิน (รับชั่วโมงกิจกรรม)
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
              </span>
            </button>
          )}

          <a
            href={resultsUnlocked ? getPath("/results") : undefined}
            className={`rc-suc-cta2 rc-suc-results${resultsUnlocked ? "" : " is-disabled"}`}
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

          <a href={editorMode ? undefined : getPath("/")} className="rc-suc-home">← กลับหน้าแรก</a>
        </div>

        <div className="rc-suc-foot">
          ใบเสร็จนี้ดูซ้ำไม่ได้ · ไม่มีการบันทึก/ดาวน์โหลด · barcode = เลขอ้างอิงเท่านั้น
        </div>

        <footer className="rc-suc-copy">© FMS@PSU{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</footer>
      </div>

      <style jsx global>{`
        /* one identity constant with no palette token: the warning-red of the
           "not an official record" stamp (Rule 9 — variant identity is hardcoded;
           NOT a vote-semantic red, which stays untouched and unused on success). */
        .rc-suc-root { --rc-stamp-red:#B91C1C;
          overflow-x:hidden; padding:26px 18px 44px;
          background-image:radial-gradient(color-mix(in srgb, var(--rc-ink) 5%, transparent) 1px, transparent 1.5px);
          background-size:22px 22px; }
        .rc-suc-wrap { max-width:400px; margin:0 auto; }

        :where(.rc-suc-root) a { text-decoration:none; }
        .rc-suc-root a:focus-visible, .rc-suc-root button:focus-visible {
          outline:2px solid var(--rc-accent-deep); outline-offset:3px; }

        .rc-suc-root .rc-suc-eyebrow { font-family:var(--rc-fm); font-size:10px; letter-spacing:.24em;
          text-transform:uppercase; color:var(--rc-ink2); text-align:center; margin-bottom:12px; }

        /* ---- the printer machine head ---- */
        .rc-suc-root .rc-suc-machine { position:relative; padding:16px 18px 22px; border-radius:14px 14px 6px 6px;
          background:linear-gradient(180deg, color-mix(in srgb, var(--rc-ink) 86%, var(--rc-faint)), var(--rc-ink));
          box-shadow:var(--rc-shadow-curl, 0 10px 30px -14px color-mix(in srgb, var(--rc-ink) 35%, transparent)); }
        .rc-suc-root .rc-suc-led { position:absolute; top:14px; right:16px; width:8px; height:8px; border-radius:50%;
          background:var(--rc-holo-4); box-shadow:0 0 8px var(--rc-holo-4); animation:rcLed 2.4s ease-in-out infinite; }
        @keyframes rcLed { 0%,100%{ opacity:1; } 50%{ opacity:.45; } }
        .rc-suc-root .rc-suc-brand { font-family:var(--rc-fm); font-size:9px; letter-spacing:.22em;
          color:color-mix(in srgb, var(--rc-faint) 78%, var(--rc-receipt)); text-align:center; }
        .rc-suc-root .rc-suc-slot { margin-top:14px; height:14px; border-radius:8px; background:var(--rc-ink);
          box-shadow:inset 0 2px 5px color-mix(in srgb, var(--rc-ink) 80%, transparent); position:relative; }
        .rc-suc-root .rc-suc-slot::after { content:""; position:absolute; left:8px; right:8px; top:5px; height:3px;
          border-radius:2px; background:color-mix(in srgb, var(--rc-ink) 55%, var(--rc-faint)); }

        /* ---- the receipt printing downward ---- */
        .rc-suc-root .rc-suc-receipt { position:relative; margin:-2px 10px 0; padding:22px 20px 30px;
          background:var(--rc-receipt);
          box-shadow:0 14px 30px -16px color-mix(in srgb, var(--rc-ink) 40%, transparent);
          background-image:repeating-linear-gradient(180deg, transparent 0 26px, color-mix(in srgb, var(--rc-ink) 3%, transparent) 26px 27px);
          -webkit-mask:radial-gradient(6px 8px at 8px 100%, transparent 96%, #000) bottom left/16px 8px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat;
                  mask:radial-gradient(6px 8px at 8px 100%, transparent 96%, #000) bottom left/16px 8px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat; }

        .rc-suc-root .rc-suc-logo { font-family:var(--rc-fm); font-size:10px; letter-spacing:.28em;
          color:var(--rc-ink2); text-align:center; }
        .rc-suc-root .rc-suc-title { margin:10px 0 2px; font-family:var(--rc-fh); font-weight:700; font-size:26px;
          text-align:center; letter-spacing:-.01em; color:var(--rc-ink); }
        .rc-suc-root .rc-suc-sub { margin-bottom:16px; font-family:var(--rc-fm); font-size:10px; letter-spacing:.14em;
          color:var(--rc-ink2); text-align:center; }
        .rc-suc-root .rc-suc-line { display:flex; justify-content:space-between; align-items:baseline; font-size:13px;
          padding:8px 0; border-bottom:1px dotted var(--rc-line); font-variant-numeric:tabular-nums; }
        .rc-suc-root .rc-suc-line .rc-suc-k { color:var(--rc-ink2); }
        .rc-suc-root .rc-suc-line b { font-family:var(--rc-fm); font-weight:600; color:var(--rc-ink); }

        .rc-suc-root .rc-suc-pick { margin:14px 0; padding:12px; text-align:center;
          border:1.5px dashed var(--rc-stamp-line); border-radius:6px; }
        .rc-suc-root .rc-suc-pick-lbl { font-family:var(--rc-fm); font-size:9px; letter-spacing:.2em;
          text-transform:uppercase; color:var(--rc-faint); }
        .rc-suc-root .rc-suc-pick-val { margin-top:4px; font-family:var(--rc-fh); font-weight:700; font-size:17px;
          color:var(--rc-ink); }

        .rc-suc-root .rc-suc-strip { position:relative; overflow:hidden; height:30px; margin:16px 0 6px; border-radius:6px; }
        .rc-suc-root .rc-suc-strip .rc-foil { position:absolute; inset:0; }
        .rc-suc-root .rc-suc-strip-t { position:absolute; inset:0; display:grid; place-items:center;
          font-family:var(--rc-fm); font-size:9px; letter-spacing:.3em; text-transform:uppercase; font-weight:700;
          color:var(--rc-ink); mix-blend-mode:overlay; }

        .rc-suc-root .rc-suc-barcode { height:34px; margin-top:12px; opacity:.9;
          background:repeating-linear-gradient(90deg, var(--rc-ink) 0 2px, transparent 2px 4px, var(--rc-ink) 4px 5px, transparent 5px 8px); }
        .rc-suc-root .rc-suc-ref { margin-top:6px; font-family:var(--rc-fm); font-size:10px; letter-spacing:.26em;
          color:var(--rc-ink2); text-align:center; font-variant-numeric:tabular-nums; }

        .rc-suc-root .rc-suc-seal { position:relative; width:56px; height:56px; margin:16px auto 0; border-radius:50%;
          display:grid; place-items:center;
          box-shadow:var(--rc-shadow-object, 0 2px 8px -3px color-mix(in srgb, var(--rc-ink) 25%, transparent)); }
        .rc-suc-root .rc-suc-seal-disc { position:absolute; inset:0; border-radius:50%; overflow:hidden; }
        .rc-suc-root .rc-suc-seal-disc .rc-foil { position:absolute; inset:-40%; }
        .rc-suc-root .rc-suc-seal-core { position:relative; width:34px; height:34px; border-radius:50%;
          display:grid; place-items:center; background:var(--rc-receipt);
          box-shadow:inset 0 0 0 1px var(--rc-stamp-line); }
        .rc-suc-root .rc-suc-seal-core b { font-family:var(--rc-fm); font-size:7px; letter-spacing:.1em; color:var(--rc-accent-deep); }

        .rc-suc-root .rc-suc-stamp { width:fit-content; margin:16px auto 0; padding:4px 12px; transform:rotate(-6deg);
          border:2px solid var(--rc-stamp-red); border-radius:6px; color:var(--rc-stamp-red); opacity:.85;
          font-family:var(--rc-fm); font-size:9px; letter-spacing:.16em; text-transform:uppercase; }

        /* ---- holographic foil (ported from tokens.css .rc-foil) ---- */
        .rc-suc-root .rc-foil { background-image:linear-gradient(var(--rc-holo-angle),
            var(--rc-holo-1), var(--rc-holo-2), var(--rc-holo-3), var(--rc-holo-4), var(--rc-holo-5), var(--rc-holo-1));
          background-size:300% 300%; background-position:calc(var(--rc-px, .5) * 100%) calc(var(--rc-py, .5) * 100%);
          filter:hue-rotate(var(--rc-holo-shift)) saturate(1.15); animation:rcFoilDrift 9s linear infinite; }
        .rc-suc-root .rc-foil--conic { background-image:conic-gradient(from 0deg,
            var(--rc-holo-1), var(--rc-holo-2), var(--rc-holo-3), var(--rc-holo-4), var(--rc-holo-5), var(--rc-holo-1));
          background-size:auto; animation:rcFoilSpin 14s linear infinite; }
        @keyframes rcFoilDrift { 0%{ background-position:0% 50%; } 50%{ background-position:100% 50%; } 100%{ background-position:0% 50%; } }
        @keyframes rcFoilSpin { to { transform:rotate(360deg); } }

        /* ---- actions (on the desk) ---- */
        .rc-suc-root .rc-suc-actions { margin-top:24px; display:flex; flex-direction:column; gap:10px; }
        /* the foil sits as a shimmering RIM behind an accent fill (::before), text on
           top — so the button reads as an accent CTA with a holographic edge (concept:
           "foil = CTA edge"), NOT a low-contrast foil-filled block. Layered by z-index
           because a negative-z child would paint OVER the element's own background. */
        .rc-suc-root .rc-suc-cta { position:relative; isolation:isolate; border:none; cursor:pointer;
          padding:15px; border-radius:var(--rc-radius-button, 8px); background:transparent;
          transition:transform .18s ease; }
        .rc-suc-root .rc-suc-cta .rc-foil { position:absolute; inset:-2px; z-index:0;
          border-radius:calc(var(--rc-radius-button, 8px) + 2px); }
        .rc-suc-root .rc-suc-cta::before { content:""; position:absolute; inset:0; z-index:1;
          border-radius:inherit; background:var(--rc-accent); transition:background .2s ease; }
        .rc-suc-root .rc-suc-cta-in { position:relative; z-index:2; display:inline-flex; align-items:center;
          justify-content:center; gap:9px; font-family:var(--rc-fh); font-weight:600; font-size:15px;
          color:var(--rc-on-accent); }
        .rc-suc-root .rc-suc-cta-in svg { flex:none; transition:transform .2s ease; }
        .rc-suc-root .rc-suc-cta:hover { transform:translateY(-2px); }
        .rc-suc-root .rc-suc-cta:hover::before { background:var(--rc-accent-deep); }
        .rc-suc-root .rc-suc-cta:hover .rc-suc-cta-in svg { transform:translate(2px,-2px); }
        .rc-suc-root .rc-suc-cta:active { transform:scale(.98); }

        .rc-suc-root .rc-suc-cta2 { display:inline-flex; align-items:center; justify-content:center; gap:9px;
          padding:13px; border-radius:var(--rc-radius-button, 8px); font-family:var(--rc-fh); font-weight:600; font-size:14px;
          background:none; border:1.5px solid var(--rc-ink); color:var(--rc-ink); cursor:pointer;
          transition:transform .18s ease, border-color .2s ease, color .2s ease; }
        .rc-suc-root .rc-suc-cta2 svg { flex:none; transition:transform .2s ease; }
        .rc-suc-root .rc-suc-results:hover { color:var(--rc-accent-deep); border-color:var(--rc-accent-deep); transform:translateY(-2px); }
        .rc-suc-root .rc-suc-results:hover svg { transform:translateX(3px); }
        .rc-suc-root .rc-suc-results.is-disabled { color:var(--rc-faint); border-color:var(--rc-line);
          cursor:not-allowed; pointer-events:none; }

        .rc-suc-root .rc-suc-done { display:inline-flex; align-items:center; justify-content:center; gap:10px;
          padding:14px; border-radius:var(--rc-radius-button, 8px); font-family:var(--rc-fh); font-weight:600; font-size:14px;
          color:var(--rc-accent-deep); background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt));
          border:1.5px solid color-mix(in srgb, var(--rc-accent) 30%, var(--rc-receipt)); }

        .rc-suc-root .rc-suc-home { align-self:center; margin-top:6px; min-height:44px; display:inline-flex; align-items:center;
          font-family:var(--rc-fm); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--rc-ink2);
          transition:color .2s ease; }
        .rc-suc-root .rc-suc-home:hover { color:var(--rc-ink); }

        .rc-suc-root .rc-suc-foot { margin-top:16px; font-family:var(--rc-fm); font-size:9px; letter-spacing:.06em;
          color:var(--rc-faint); text-align:center; line-height:1.6; }
        .rc-suc-root .rc-suc-copy { margin-top:18px; padding-top:16px; border-top:1px solid var(--rc-line);
          font-family:var(--rc-fm); font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:var(--rc-ink2);
          text-align:center; }

        /* ---- PRINT REVEAL (CSS-only, BASE-VISIBLE) — the keyframes only supply the
           hidden 'from'; base state is opacity 1, so JS-off / editorMode / no-anim =
           the full receipt shows instantly. Only .rc-printing opts rows into the
           stepper-jitter reveal. ---- */
        .rc-suc-root.rc-printing .rc-suc-pr { animation:rcPrintRow .5s steps(5, end) both; }
        .rc-suc-root.rc-printing .rc-suc-logo  { animation-delay:.05s; }
        .rc-suc-root.rc-printing .rc-suc-title { animation-delay:.18s; }
        .rc-suc-root.rc-printing .rc-suc-sub   { animation-delay:.30s; }
        .rc-suc-root.rc-printing .rc-suc-line:nth-of-type(1) { animation-delay:.42s; }
        .rc-suc-root.rc-printing .rc-suc-line:nth-of-type(2) { animation-delay:.52s; }
        .rc-suc-root.rc-printing .rc-suc-pick    { animation-delay:.66s; }
        .rc-suc-root.rc-printing .rc-suc-strip   { animation-delay:.82s; }
        .rc-suc-root.rc-printing .rc-suc-barcode { animation-delay:.94s; }
        .rc-suc-root.rc-printing .rc-suc-ref     { animation-delay:1.02s; }
        .rc-suc-root.rc-printing .rc-suc-seal    { animation-delay:1.14s; }
        .rc-suc-root.rc-printing .rc-suc-stamp   { animation-delay:1.28s; }
        @keyframes rcPrintRow { from { opacity:0; transform:translateY(-8px); } }

        /* ---- TABLET+ : a touch more air ---- */
        @media (min-width:768px) {
          .rc-suc-root .rc-suc-wrap { max-width:420px; }
        }

        /* reduced motion — freeze every animation (foil stays statically iridescent),
           full receipt visible. Scoped to .rc-suc-root. */
        @media (prefers-reduced-motion:reduce) {
          .rc-suc-root *, .rc-suc-root *::before, .rc-suc-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
