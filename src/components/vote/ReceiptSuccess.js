"use client";

// ReceiptSuccess — POST-VOTE SUCCESS for the "Receipt · Paper Materiality" template
// family (Template #6), direction B ("printer moment"): a dark ballot-printer head
// with a slot, and a long thermal receipt printing DOWNWARD out of it — print
// banding, a jagged die-cut bottom edge, the ballot record, a holographic security
// strip, a barcode, a foil seal, and the "ไม่ใช่หลักฐานทางการ" stamp.
//
// R1.5 "dress the desk": the receipt/printer MOMENT is untouched. What changed is the
// SCENE around it (CONCEPT §3.1 — "curated collage on a polling desk, invisible grid"):
//   • Desktop (>=900px) is an asymmetric two-column composition — a display headline
//     block + the actions on the LEFT, the machine + printing receipt on the RIGHT.
//     Mobile keeps the single stack but gains a compact headline above the machine.
//   • Desk ephemera (aria-hidden, print-language only — stamps not icons): a ballot
//     STUB tucked under the receipt, holo tape strips, a foil seal chip, a ghost
//     ink-stamp mark, a register-tape scrap. Mobile keeps only the stub + one tape.
//   • Desk depth — a calmer dot grid, a very soft radial vignette, and an elliptical
//     drop-zone shadow so the receipt column "rests" on the desk.
//
// Pure presentation. success/page.js owns auth, the redirect guards, and the form +
// alert modals; this component only renders the Receipt chrome and calls onOpenForm.
// Colours flow ONLY through var(--rc-*), emitted by ReceiptBaseStyles on .rc-root —
// a theme swap re-tints the whole page in place.
//
// BALLOT SECRECY (CONCEPT §2 — every point is a hard gate, v2-R4a shape):
//   • NO save / download / share / copy affordance anywhere.
//   • The receipt shows NO vote choice in ANY form — it is an IDENTITY receipt:
//     the voter's own name / student id / major / year + their real cast time
//     (User.votedAt via the session-gated `voter` block of /api/check-status).
//     Nothing on it is secret; nothing on it links to a ballot.
//   • The barcode is a purely decorative CSS graphic — it encodes NOTHING. The ref
//     line is a random ephemeral ballot-ref, NEVER anything vote-related. The desk
//     STUB reuses that SAME ephemeral ref (a non-secret).
//   • The "ไม่ใช่หลักฐานทางการ / not an official record" stamp is always visible.
//
// PRINT ANIMATION (v2-R4a "พิมพ์จริง" — CSS-only, transform-only, base-visible):
// the whole receipt sits inside an overflow-hidden WINDOW under the printer slot
// and FEEDS DOWN out of it — translateY from -101% to 0 with thermal-burst holds
// in the keyframes (advance… hold… advance), so the paper physically emerges and
// its printed content appears as the paper does (not a fade of rows on an already
// unrolled sheet). The BASE state is translateY(0) (fully fed), so JS-off /
// reduced-motion / editorMode / animation:none all show the full receipt
// instantly — never JS-gated (past incident). Only `.rc-printing` (live,
// non-editor render) opts the paper into the feed; transform is the only
// animated property (A7.1). The desk ephemera + headline are always base-visible.

import { useState, useEffect } from "react";
import { getPath } from "../../utils/basePath";
import { ReceiptBaseStyles, ReceiptShipMark } from "../home/ReceiptTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const HEX = "0123456789ABCDEFGHJKMNPQRTUVWXY";

// wrap the THAI runs of a runtime string in Chakra spans (A10.3 / ruling C4 — Space
// Mono has no Thai glyphs). Font-family only: text bytes + order stay identical.
const thaiSafe = (s) => String(s ?? "").split(/([฀-๿]+)/).map((part, i) =>
  /[฀-๿]/.test(part) ? <span className="rc-th" key={i}>{part}</span> : part);

function randRefGroup() {
  let s = "";
  for (let i = 0; i < 4; i++) s += HEX[Math.floor(Math.random() * HEX.length)];
  return s;
}

// format a User.votedAt value (ISO string / Date) into the receipt's Thai
// date + time stamp. Returns null when absent — the receipt then OMITS the
// date/time lines cleanly (no "-") per v2-R4a.
function formatVotedAt(votedAt) {
  if (!votedAt) return null;
  const d = new Date(votedAt);
  if (isNaN(d.getTime())) return null;
  // ADM-2: election time is Asia/Bangkok, never the host clock. getDate()/getHours()
  // read the viewer's timezone — identical on a Thai device, but an hour/day off for
  // anyone voting abroad (and on a UTC server render), which is not something a
  // receipt stamped "เวลาใช้สิทธิ์" may get wrong. Seconds are kept, so this formats
  // its own parts instead of using formatThaiTime (minute precision).
  const p = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(d)) p[part.type] = part.value;
  const dd = p.day;
  const mon = TH_MONTHS[Number(p.month) - 1];
  const yy = Number(p.year) + 543; // Buddhist era
  return { date: `${dd} ${mon} ${yy}`, time: `${p.hour}:${p.minute}:${p.second}` };
}

export default function ReceiptSuccess({ user = null, isUnlocked = false, onOpenForm = () => {}, editorMode = false }) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";
  const copyrightYear = gc.copyrightYear ?? "";

  const resultsUnlocked = isUnlocked || editorMode;

  // Decorative ballot-ref — random, ephemeral, encodes nothing (client-effect so
  // SSR has no hydration mismatch). editor/preview uses a stable sample so the
  // reviewed slide is deterministic.
  const [ref, setRef] = useState(editorMode ? "A7F3 · 90K2 · 1739 · 0847" : null);
  useEffect(() => {
    if (editorMode) return;
    setRef(`${randRefGroup()} · ${randRefGroup()} · ${randRefGroup()} · ${randRefGroup()}`);
  }, [editorMode]);

  // VOTER IDENTITY (v2-R4a) — the user's OWN profile: name / studentId / major /
  // year, and the REAL cast time from User.votedAt (server truth, not the client
  // clock). Missing fields → their line is omitted cleanly (never "-").
  // editor/preview uses a deterministic mock so the slide is reviewable.
  const voterName = user?.name || (editorMode ? "นักศึกษาตัวอย่าง" : null);
  const voterId = user?.studentId || (editorMode ? "6610510149" : null);
  const voterMajor = user?.major || (editorMode ? "สาขาวิชาการตลาด" : null);
  const voterYear = user?.year || (editorMode ? "ปี 3" : null);
  const stamp = editorMode
    ? { date: "06 ก.พ. 2569", time: "10:24:07" }
    : formatVotedAt(user?.votedAt);

  const stubRef = ref || "···· · ···· · ···· · ····";

  return (
    <div className={`fms-app rc-root rc-suc-root rc-desk${editorMode ? "" : " rc-printing"}`}>
      <ReceiptBaseStyles />

      {/* blind-emboss seals on the desk behind the receipt — faint, shared .rc-desk
          language (matches home/vote), pure decoration (aria-hidden) */}
      <div className="rc-desk-seals" aria-hidden="true">
        <span className="rc-seal rc-seal--a"><i /><b /></span>
        <span className="rc-seal rc-seal--b"><i /><b /></span>
      </div>

      <div className="rc-suc-wrap">
        {/* LEFT (desktop) / TOP (mobile) — the display headline block */}
        <header className="rc-suc-headline">
          <div className="rc-suc-hl-eyebrow">✶ <span className="rc-th">บันทึกคะแนนแล้ว</span> · BALLOT RECORDED ✶</div>
          <div className="rc-suc-display">
            <span className="rc-suc-display-1">เสียงของคุณ</span>
            <span className="rc-suc-display-2">ถูกนับแล้ว</span>
          </div>
          <p className="rc-suc-deck">ขอบคุณที่ออกมาใช้สิทธิ์ เสียงของคุณถูกบันทึกอย่างปลอดภัยและเป็นความลับ</p>
        </header>

        {/* RIGHT (desktop) / MIDDLE (mobile) — the machine + printing receipt (the
            MOMENT, untouched) surrounded by desk ephemera resting on the polling desk */}
        <div className="rc-suc-stage">
          {/* desk ephemera — aria-hidden, print-language only; positioned on the desk
              with soft object shadows. z-below the receipt so objects tuck under it. */}
          <div className="rc-suc-ephemera" aria-hidden="true">
            {/* a tiny test-print calibration strip peeking beside the slot (thermal
                bands, decorative — desktop only) */}
            <div className="rc-suc-testprint" />
            {/* a ghost of a previous ink stamp, ON the desk (very faint) */}
            <div className="rc-suc-ghost"><span>{prefix} {number} ✓</span></div>
            {/* a short register-tape scrap peeking from the left edge */}
            <div className="rc-suc-regtape"><span>0142 · 0938 · 1204 · 0071 · 0559</span></div>
            {/* the ballot STUB — tucked under the receipt's lower-left, same ref */}
            <div className="rc-suc-stub">
              <div className="rc-suc-stub-h"><span className="rc-th">ต้นขั้ว</span> · STUB No.</div>
              <div className="rc-suc-stub-ref">{stubRef}</div>
            </div>
            {/* holo tape strips — one pins the stub, one loose on the desk */}
            <span className="rc-suc-tape rc-suc-tape--stub" />
            <span className="rc-suc-tape rc-suc-tape--loose" />
            {/* a small foil seal chip resting on the desk at an angle */}
            <span className="rc-suc-chip"><span className="rc-foil rc-foil--conic" /></span>
          </div>

          <div className="rc-suc-eyebrow">✶ <span className="rc-th">กำลังพิมพ์ใบเสร็จ</span> · printing ✶</div>

          {/* the ballot-printer head + slot */}
          <div className="rc-suc-machine" aria-hidden="true">
            <span className="rc-suc-led" />
            <div className="rc-suc-brand">{prefix} {number} · BALLOT PRINTER</div>
            <div className="rc-suc-slot" />
          </div>

          {/* the feed WINDOW — overflow-hidden throat under the slot; the receipt
              translates down out of it (v2-R4a "พิมพ์จริง"). Layout height comes from
              the receipt in normal flow (transform never reflows → CLS 0). */}
          <div className="rc-suc-window">
            {/* the receipt feeding out of the slot */}
            <div className="rc-suc-receipt">
              <div className="rc-suc-logo">✶ ✶ ✶ {prefix} {number} ✶ ✶ ✶</div>
              <h1 className="rc-suc-title">บันทึกคะแนนแล้ว</h1>
              <div className="rc-suc-sub">BALLOT RECORDED</div>

              {/* VOTER IDENTITY (v2-R4a) — the voter's own record; never any choice.
                  Missing fields are omitted cleanly (no "-"). */}
              {stamp && <div className="rc-suc-line"><span className="rc-suc-k">วันที่ / DATE</span><b>{thaiSafe(stamp.date)}</b></div>}
              {stamp && <div className="rc-suc-line"><span className="rc-suc-k">เวลาใช้สิทธิ์ / TIME</span><b>{stamp.time}</b></div>}
              {voterName && <div className="rc-suc-line"><span className="rc-suc-k">ผู้ใช้สิทธิ์ / VOTER</span><b>{thaiSafe(voterName)}</b></div>}
              {voterId && <div className="rc-suc-line"><span className="rc-suc-k">รหัสนักศึกษา / ID</span><b>{voterId}</b></div>}
              {voterMajor && <div className="rc-suc-line"><span className="rc-suc-k">สาขา / MAJOR</span><b>{thaiSafe(voterMajor)}</b></div>}
              {voterYear && <div className="rc-suc-line"><span className="rc-suc-k">ชั้นปี / YEAR</span><b>{thaiSafe(voterYear)}</b></div>}

              {/* holographic security strip */}
              <div className="rc-suc-strip">
                <span className="rc-foil" aria-hidden="true" />
                <span className="rc-suc-strip-t">Security · <span className="rc-th">ของแท้</span></span>
              </div>

              {/* decorative barcode — encodes NOTHING (pure CSS) */}
              <div className="rc-suc-barcode" aria-hidden="true" />
              <div className="rc-suc-ref">{stubRef}</div>

              {/* decorative print mark — a small, STATIC data-dot pattern printed under
                  the barcode (thermal-ink module grid). Purely ornamental (aria-hidden):
                  a fixed, hardcoded module map with NO QR finder squares and NO scan
                  label — it is honest print decoration, NOT a scannable code. Encodes
                  nothing; the on-screen evaluate button is the real affordance. */}
              <div className="rc-suc-print" aria-hidden="true">
                <svg className="rc-suc-print-svg" viewBox="0 0 8 8" shapeRendering="crispEdges">
                  <path d="M0 0h1v1h-1zM2 0h1v1h-1zM3 0h1v1h-1zM6 0h1v1h-1zM1 1h1v1h-1zM4 1h1v1h-1zM5 1h1v1h-1zM7 1h1v1h-1zM0 2h1v1h-1zM2 2h1v1h-1zM4 2h1v1h-1zM6 2h1v1h-1zM7 2h1v1h-1zM0 3h1v1h-1zM1 3h1v1h-1zM3 3h1v1h-1zM5 3h1v1h-1zM2 4h1v1h-1zM4 4h1v1h-1zM5 4h1v1h-1zM7 4h1v1h-1zM0 5h1v1h-1zM2 5h1v1h-1zM3 5h1v1h-1zM6 5h1v1h-1zM1 6h1v1h-1zM4 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM0 7h1v1h-1zM1 7h1v1h-1zM3 7h1v1h-1zM5 7h1v1h-1z" />
                </svg>
              </div>

              {/* foil seal */}
              <div className="rc-suc-seal" aria-hidden="true">
                <span className="rc-suc-seal-disc"><span className="rc-foil rc-foil--conic" /></span>
                <span className="rc-suc-seal-core"><ReceiptShipMark className="rc-suc-seal-ship" strokeWidth={3} /></span>
              </div>

              {/* not-an-official-record stamp (ballot secrecy) */}
              <div className="rc-suc-stamp">✻ <span className="rc-th">ไม่ใช่หลักฐานทางการ</span> ✻</div>
            </div>
          </div>
        </div>

        {/* TAIL — actions on the desk + fine print. In the LEFT column on desktop
            (below the headline), below the receipt on mobile. */}
        <div className="rc-suc-tail">
          <div className="rc-suc-actions">
            {isUnlocked && !editorMode ? (
              <div className="rc-suc-done">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                ส่งแบบประเมินเรียบร้อยแล้ว
              </div>
            ) : (
              /* evaluate button — restyled as a die-cut TAG hung on a string with a
                 grommet (same language as home); the BUTTON + its onOpenForm action are
                 unchanged (RULING C2: the evaluate button must NOT be removed) */
              <div className="rc-suc-tagwrap">
                <svg className="rc-suc-tag-string" viewBox="0 0 60 40" aria-hidden="true" focusable="false" preserveAspectRatio="none">
                  <path className="rc-suc-tag-ln" d="M14 0 C 10 20, 40 20, 30 39" fill="none" />
                  <path className="rc-suc-tag-ln" d="M46 0 C 50 20, 20 20, 30 39" fill="none" />
                  <circle className="rc-suc-tag-pin" cx="30" cy="1.5" r="3" />
                </svg>
                <button type="button" className="rc-suc-cta" onClick={() => !editorMode && onOpenForm()}>
                  <span className="rc-foil" aria-hidden="true" />
                  <span className="rc-suc-grommet" aria-hidden="true" />
                  <span className="rc-suc-cta-in">
                    ทำแบบประเมิน (รับชั่วโมงกิจกรรม)
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
                  </span>
                </button>
              </div>
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

            <a href={editorMode ? undefined : getPath("/")} className="rc-suc-home">← <span className="rc-th">กลับหน้าแรก</span></a>
          </div>

          <div className="rc-suc-foot">
            <span className="rc-th">ใบเสร็จยืนยันการใช้สิทธิ์เท่านั้น</span> · <span className="rc-th">การลงคะแนนของคุณเป็นความลับ</span> · barcode = <span className="rc-th">เลขอ้างอิงเท่านั้น</span>
          </div>

          <footer className="rc-suc-copy">© {gc.facultyShortEn || "FMS"}@{gc.university || "PSU"}{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</footer>
        </div>
      </div>

      <style jsx global>{`
        /* one identity constant with no palette token: the warning-red of the
           "not an official record" stamp (Rule 9 — variant identity is hardcoded;
           NOT a vote-semantic red, which stays untouched and unused on success). */
        /* laid-paper ::after + desk vignette ::before + blind-emboss seals now come
           from the SHARED .rc-desk classes in ReceiptBaseStyles (T1) — this root opts
           in via rc-desk so the printer moment rests on the SAME desk as home/vote
           (was a bespoke dot-grid + vignette). The machine/receipt/ephemera below are
           untouched. */
        .rc-suc-root { --rc-stamp-red:#B91C1C; overflow-x:hidden; padding:26px 18px 44px; }

        /* MOBILE (default): the wrap is a single-column grid so the evaluate ACTIONS
           ride UP directly under the headline — above the printer stage — so the
           form CTA lands in the first viewport (form-first, v2-R8 T2). The printing
           of the receipt stays a moment, just below the CTA. .rc-suc-tail dissolves
           (display:contents) so its children (actions / foot / copy) become grid
           siblings and the stage can slot BETWEEN actions and the fine print. Desktop
           (>=900) restores the original two-column collage byte-for-byte. */
        .rc-suc-wrap { position:relative; z-index:1; max-width:400px; margin:0 auto;
          display:grid; grid-template-columns:1fr;
          grid-template-areas:"headline" "actions" "stage" "foot" "copy"; }
        .rc-suc-root .rc-suc-headline { grid-area:headline; }
        .rc-suc-root .rc-suc-stage { grid-area:stage; }
        .rc-suc-root .rc-suc-tail { display:contents; }
        .rc-suc-root .rc-suc-actions { grid-area:actions; }
        .rc-suc-root .rc-suc-foot { grid-area:foot; }
        .rc-suc-root .rc-suc-copy { grid-area:copy; }

        /* Thai-in-a-mono-line utility (A10.3 / ruling C4): the Thai half of a bilingual
           mono label wears Chakra Petch so it never silently falls back — Space Mono has
           no Thai glyphs. Font-family ONLY; wording/DOM of the printer moment untouched. */
        .rc-suc-root .rc-th { font-family:var(--rc-fr) !important; }

        :where(.rc-suc-root) a { text-decoration:none; }
        .rc-suc-root a:focus-visible, .rc-suc-root button:focus-visible {
          outline:2px solid var(--rc-accent-deep); outline-offset:3px; }

        /* ---- display headline block (LEFT column on desktop) — a manila note card
           taped down with two holo strips (B4) ---- */
        .rc-suc-root .rc-suc-headline { position:relative; text-align:center; margin-bottom:22px;
          background:var(--rc-note); border:1px solid color-mix(in srgb, var(--rc-note) 80%, var(--rc-ink));
          border-radius:4px; padding:26px 22px 24px; transform:rotate(-.8deg);
          box-shadow:2px 14px 30px -18px color-mix(in srgb, var(--rc-ink) 34%, transparent); }
        .rc-suc-root .rc-suc-headline::before, .rc-suc-root .rc-suc-headline::after { content:""; position:absolute;
          top:-10px; width:66px; height:20px; border-radius:1px; opacity:.55; mix-blend-mode:multiply;
          background:linear-gradient(135deg, color-mix(in srgb, var(--rc-holo-1) 55%, transparent), color-mix(in srgb, var(--rc-holo-3) 55%, transparent));
          box-shadow:1px 2px 3px -1px color-mix(in srgb, var(--rc-ink) 30%, transparent); }
        .rc-suc-root .rc-suc-headline::before { left:22px; transform:rotate(-7deg); }
        .rc-suc-root .rc-suc-headline::after { right:22px; transform:rotate(6deg); }
        .rc-suc-root .rc-suc-hl-eyebrow { font-family:var(--rc-fm); font-size:10px; letter-spacing:.24em;
          text-transform:uppercase; color:var(--rc-ink2); margin-bottom:14px; }
        .rc-suc-root .rc-suc-display { display:flex; flex-direction:column; align-items:center;
          font-family:var(--rc-fh); font-weight:700; line-height:1.04; letter-spacing:-.02em;
          font-size:clamp(30px, 8vw, 40px); }
        .rc-suc-root .rc-suc-display-1 { color:var(--rc-ink); }
        /* accent-as-TEXT uses accentDeep — the text-safe accent per receiptPalettes §5
           (raw --rc-accent as large text fails on yellow/jade). No new hex. */
        .rc-suc-root .rc-suc-display-2 { color:var(--rc-accent-deep); }
        .rc-suc-root .rc-suc-deck { margin:16px auto 0; max-width:34ch; font-family:var(--rc-fr);
          font-size:15px; line-height:1.7; color:var(--rc-ink2); }

        .rc-suc-root .rc-suc-eyebrow { font-family:var(--rc-fm); font-size:10px; letter-spacing:.24em;
          text-transform:uppercase; color:var(--rc-ink2); text-align:center; margin-bottom:12px; }

        /* ---- the stage: machine + receipt + desk ephemera ---- */
        .rc-suc-root .rc-suc-stage { position:relative; }
        /* elliptical drop-zone shadow — the receipt column rests on the desk. Behind
           the receipt (z:0 < receipt z:2). */
        .rc-suc-root .rc-suc-stage::after { content:""; position:absolute; z-index:0; left:9%; right:9%; bottom:-4px;
          height:38px; pointer-events:none; filter:blur(3px);
          background:radial-gradient(ellipse 60% 100% at 50% 100%, color-mix(in srgb, var(--rc-ink) 20%, transparent), transparent 72%); }

        /* ---- the printer machine head ---- */
        .rc-suc-root .rc-suc-machine { position:relative; z-index:2; padding:16px 18px 22px; border-radius:14px 14px 6px 6px;
          background:linear-gradient(180deg, color-mix(in srgb, var(--rc-ink) 86%, var(--rc-faint)), var(--rc-ink));
          box-shadow:var(--rc-shadow-curl, 0 10px 30px -14px color-mix(in srgb, var(--rc-ink) 35%, transparent)); }
        .rc-suc-root .rc-suc-led { position:absolute; top:14px; right:16px; width:8px; height:8px; border-radius:50%;
          background:var(--rc-holo-4); box-shadow:0 0 8px var(--rc-holo-4); animation:rcLed 2.4s ease-in-out infinite; }
        @keyframes rcLed { 0%,100%{ opacity:1; } 50%{ opacity:.45; } }
        /* LIGHT text on the DARK printer body — mixed off the paper side, not off
           --rc-faint (that token is tuned for ink-on-paper AA; using it here made the
           brand plate 4.4:1 instead of 6.4:1). */
        .rc-suc-root .rc-suc-brand { font-family:var(--rc-fm); font-size:9px; letter-spacing:.22em;
          color:color-mix(in srgb, var(--rc-ink2) 55%, var(--rc-receipt)); text-align:center; }
        .rc-suc-root .rc-suc-slot { margin-top:14px; height:14px; border-radius:8px; background:var(--rc-ink);
          box-shadow:inset 0 2px 5px color-mix(in srgb, var(--rc-ink) 80%, transparent); position:relative; }
        .rc-suc-root .rc-suc-slot::after { content:""; position:absolute; left:8px; right:8px; top:5px; height:3px;
          border-radius:2px; background:color-mix(in srgb, var(--rc-ink) 55%, var(--rc-faint)); }

        /* ---- the feed WINDOW + the receipt printing downward (v2-R4a) ----
           The window is the overflow-hidden throat below the slot: the receipt
           starts translated fully above it (hidden) and FEEDS DOWN into view.
           Height comes from the receipt in normal flow — transform never
           reflows, so the stage never shifts (CLS 0). Horizontal padding keeps
           the paper's soft shadow inside the clip. */
        .rc-suc-root .rc-suc-window { position:relative; z-index:2; margin:-2px 0 0; padding:0 10px 16px;
          overflow:hidden; }
        .rc-suc-root .rc-suc-receipt { position:relative; z-index:2; padding:22px 20px 30px;
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

        .rc-suc-root .rc-suc-strip { position:relative; overflow:hidden; height:30px; margin:16px 0 6px; border-radius:6px; }
        .rc-suc-root .rc-suc-strip .rc-foil { position:absolute; inset:0; }
        .rc-suc-root .rc-suc-strip-t { position:absolute; inset:0; display:grid; place-items:center;
          font-family:var(--rc-fm); font-size:9px; letter-spacing:.3em; text-transform:uppercase; font-weight:700;
          color:var(--rc-ink); mix-blend-mode:overlay; }

        .rc-suc-root .rc-suc-barcode { height:34px; margin-top:12px; opacity:.9;
          background:repeating-linear-gradient(90deg, var(--rc-ink) 0 2px, transparent 2px 4px, var(--rc-ink) 4px 5px, transparent 5px 8px); }
        .rc-suc-root .rc-suc-ref { margin-top:6px; font-family:var(--rc-fm); font-size:10px; letter-spacing:.26em;
          color:var(--rc-ink2); text-align:center; font-variant-numeric:tabular-nums; }

        /* ---- decorative print mark — a small static thermal-ink data-dot grid
           (no finder squares, no label; ornament only) printed under the barcode ---- */
        .rc-suc-root .rc-suc-print { margin:14px 0 2px; display:flex; justify-content:center; }
        .rc-suc-root .rc-suc-print-svg { display:block; width:56px; height:56px; opacity:.62; }
        .rc-suc-root .rc-suc-print-svg path { fill:var(--rc-ink2); }

        .rc-suc-root .rc-suc-seal { position:relative; width:56px; height:56px; margin:16px auto 0; border-radius:50%;
          display:grid; place-items:center;
          box-shadow:var(--rc-shadow-object, 0 2px 8px -3px color-mix(in srgb, var(--rc-ink) 25%, transparent)); }
        .rc-suc-root .rc-suc-seal-disc { position:absolute; inset:0; border-radius:50%; overflow:hidden; }
        .rc-suc-root .rc-suc-seal-disc .rc-foil { position:absolute; inset:-40%; }
        .rc-suc-root .rc-suc-seal-core { position:relative; width:34px; height:34px; border-radius:50%;
          display:grid; place-items:center; background:var(--rc-receipt);
          box-shadow:inset 0 0 0 1px var(--rc-stamp-line); }
        /* the seal core carries the faculty เรือสำเภา line-art (v2-R6) — ink stroke on
           the receipt-stock core, ringed by the foil disc behind it. Replaces the old
           "OK" text medallion so success wears the same system ship as the desk seals. */
        .rc-suc-root .rc-suc-seal-ship { width:22px; height:22px; color:var(--rc-ink); }

        .rc-suc-root .rc-suc-stamp { width:fit-content; margin:16px auto 0; padding:4px 12px; transform:rotate(-6deg);
          border:2px solid var(--rc-stamp-red); border-radius:6px; color:var(--rc-stamp-red); opacity:.85;
          font-family:var(--rc-fm); font-size:9px; letter-spacing:.16em; text-transform:uppercase; }

        /* ---- desk ephemera (aria-hidden, print-language only, on the desk) ---- */
        .rc-suc-root .rc-suc-ephemera { position:absolute; inset:0; z-index:1; pointer-events:none; }

        /* ballot STUB — tucked under the receipt's lower-left (z:1 < receipt z:2) */
        .rc-suc-root .rc-suc-stub { position:absolute; z-index:1; left:-14px; bottom:56px; width:150px;
          padding:9px 12px 10px 15px; transform:rotate(-5deg); transform-origin:bottom left;
          background:var(--rc-receipt); border-radius:4px; border-left:3px solid var(--rc-accent);
          box-shadow:2px 8px 18px -9px color-mix(in srgb, var(--rc-ink) 42%, transparent); }
        .rc-suc-root .rc-suc-stub::before { content:""; position:absolute; top:5px; bottom:5px; right:30px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 3px, transparent 3px 6px); }
        .rc-suc-root .rc-suc-stub-h { font-family:var(--rc-fm); font-size:8px; letter-spacing:.16em;
          text-transform:uppercase; color:var(--rc-ink2); }
        .rc-suc-root .rc-suc-stub-ref { margin-top:4px; font-family:var(--rc-fm); font-size:9px; letter-spacing:.1em;
          color:var(--rc-ink); font-variant-numeric:tabular-nums; }

        /* holo tape strips — translucent, tinted by the shared foil ramp */
        .rc-suc-root .rc-suc-tape { position:absolute; z-index:1; width:62px; height:19px; border-radius:1px;
          opacity:.5; mix-blend-mode:multiply;
          background:linear-gradient(135deg, color-mix(in srgb, var(--rc-holo-1) 55%, transparent),
            color-mix(in srgb, var(--rc-holo-3) 55%, transparent));
          box-shadow:0 1px 3px -1px color-mix(in srgb, var(--rc-ink) 30%, transparent); }
        .rc-suc-root .rc-suc-tape--stub { left:-6px; bottom:110px; transform:rotate(-40deg); }
        .rc-suc-root .rc-suc-tape--loose { right:16px; top:154px; transform:rotate(22deg); }

        /* a small foil seal chip resting on the desk */
        .rc-suc-root .rc-suc-chip { position:absolute; z-index:1; right:-8px; bottom:132px; width:44px; height:44px;
          border-radius:50%; overflow:hidden; transform:rotate(12deg); display:grid; place-items:center;
          box-shadow:2px 8px 18px -9px color-mix(in srgb, var(--rc-ink) 42%, transparent); }
        .rc-suc-root .rc-suc-chip .rc-foil { position:absolute; inset:-30%; }

        /* a ghost of a previous ink stamp, ON the desk (border ink ~9% opacity) */
        .rc-suc-root .rc-suc-ghost { position:absolute; z-index:0; right:-34px; top:6px; width:92px; height:92px;
          border-radius:50%; border:2px solid var(--rc-ink); opacity:.09; transform:rotate(-14deg);
          display:grid; place-items:center; }
        .rc-suc-root .rc-suc-ghost span { font-family:var(--rc-fm); font-size:10px; letter-spacing:.14em;
          text-transform:uppercase; color:var(--rc-ink); text-align:center; }

        /* a short register-tape scrap peeking from the left edge */
        .rc-suc-root .rc-suc-regtape { position:absolute; z-index:0; left:-34px; top:128px; width:126px; height:26px;
          background:var(--rc-receipt); transform:rotate(-6deg); overflow:hidden; display:flex; align-items:center;
          padding-left:12px; box-shadow:2px 5px 12px -7px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-suc-root .rc-suc-regtape span { font-family:var(--rc-fm); font-size:8px; letter-spacing:.18em;
          color:var(--rc-faint); white-space:nowrap; font-variant-numeric:tabular-nums; }

        /* a tiny test-print calibration strip peeking beside the slot (thermal bands) */
        .rc-suc-root .rc-suc-testprint { position:absolute; z-index:1; right:-12px; top:38px; width:96px; height:20px;
          transform:rotate(6deg); background:var(--rc-receipt); overflow:hidden;
          box-shadow:2px 6px 14px -8px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-suc-root .rc-suc-testprint::after { content:""; position:absolute; inset:4px 8px;
          background:repeating-linear-gradient(90deg, color-mix(in srgb, var(--rc-ink) 40%, transparent) 0 3px, transparent 3px 7px); }

        /* holographic foil (.rc-foil / .rc-foil--conic + keyframes) now shared via
           .rc-desk in ReceiptBaseStyles (T1) — byte-identical to the former local
           block, so the security strip + seal render unchanged. */

        /* ---- actions (on the desk) ---- */
        .rc-suc-root .rc-suc-actions { margin-top:24px; display:flex; flex-direction:column; gap:10px; }
        /* the foil sits as a shimmering RIM behind an accent fill (::before), text on
           top — so the button reads as an accent CTA with a holographic edge (concept:
           "foil = CTA edge"), NOT a low-contrast foil-filled block. Layered by z-index
           because a negative-z child would paint OVER the element's own background. */
        /* the evaluate button hangs from a string as a die-cut TAG (home language) */
        .rc-suc-root .rc-suc-tagwrap { position:relative; padding-top:26px; }
        .rc-suc-root .rc-suc-tag-string { position:absolute; z-index:1; left:50%; top:-2px; width:60px; height:40px;
          transform:translateX(-50%); pointer-events:none; overflow:visible;
          filter:drop-shadow(1px 1.5px 1px color-mix(in srgb, var(--rc-ink) 22%, transparent)); }
        .rc-suc-root .rc-suc-tag-ln { stroke:var(--rc-stamp-line); stroke-width:1.8; stroke-linecap:round;
          transform-origin:30px 0; transition:transform .3s ease; fill:none; }
        .rc-suc-root .rc-suc-tag-pin { fill:var(--rc-ink2); }
        .rc-suc-root .rc-suc-tagwrap:hover .rc-suc-tag-ln { animation:rcSucSway 1.4s ease-in-out infinite; }
        @keyframes rcSucSway { 0%,100%{ transform:rotate(-1.5deg); } 50%{ transform:rotate(1.5deg); } }

        .rc-suc-root .rc-suc-cta { position:relative; isolation:isolate; display:block; width:100%; text-align:center;
          border:none; cursor:pointer; padding:15px 16px 15px 36px; border-radius:var(--rc-radius-button, 8px);
          background:transparent; transition:transform .18s ease; }
        .rc-suc-root .rc-suc-cta .rc-foil { position:absolute; inset:-2px; z-index:0;
          border-radius:calc(var(--rc-radius-button, 8px) + 2px); }
        .rc-suc-root .rc-suc-cta::before { content:""; position:absolute; inset:0; z-index:1;
          border-radius:inherit; background:var(--rc-accent); transition:background .2s ease; }
        /* die-cut grommet — punched hole ringed with metal (matches home) */
        .rc-suc-root .rc-suc-grommet { position:absolute; z-index:3; left:15px; top:50%; transform:translateY(-50%);
          width:15px; height:15px; border-radius:50%; background:var(--rc-desk);
          box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--rc-faint) 62%, var(--rc-ink2)),
                     inset 0 2px 3px color-mix(in srgb, var(--rc-ink) 45%, transparent); }
        .rc-suc-root .rc-suc-cta-in { position:relative; z-index:2; display:inline-flex; align-items:center;
          justify-content:center; gap:9px; font-family:var(--rc-fh); font-weight:600; font-size:15px;
          color:var(--rc-on-accent); }
        .rc-suc-root .rc-suc-cta-in svg { flex:none; transition:transform .2s ease; }
        .rc-suc-root .rc-suc-cta:hover { transform:translateY(-2px); }
        .rc-suc-root .rc-suc-cta:hover::before { background:var(--rc-accent-deep); }
        .rc-suc-root .rc-suc-cta:hover .rc-suc-cta-in svg { transform:translate(2px,-2px); }
        .rc-suc-root .rc-suc-cta:active { transform:scale(.98); }

        /* results button = a real ticket STUB (cut corner + left perforation, home language) */
        .rc-suc-root .rc-suc-cta2 { position:relative; display:inline-flex; align-items:center; justify-content:center; gap:9px;
          min-height:46px; padding:0 16px 0 24px; font-family:var(--rc-fh); font-weight:600; font-size:14px;
          background:var(--rc-receipt); border:1.5px solid var(--rc-ink); color:var(--rc-ink); cursor:pointer;
          clip-path:polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px);
          transition:transform .18s ease, border-color .2s ease, color .2s ease; }
        .rc-suc-root .rc-suc-cta2::before { content:""; position:absolute; left:6px; top:9px; bottom:9px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-ink) 0 2px, transparent 2px 5px); }
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

        /* ---- PRINT FEED (v2-R4a "พิมพ์จริง" — CSS-only, transform-only, BASE-VISIBLE)
           The receipt translates from fully above the window (-101%, clipped =
           invisible) down to its resting place (0). The keyframes hold at
           intermediate positions — the stop-start rhythm of a thermal printer
           feeding paper in bursts. BASE state is translateY(0) (fully fed), so
           JS-off / editorMode / reduced-motion / animation:none all show the
           complete receipt instantly; only .rc-printing opts the paper into the
           feed. fill-mode "both" keeps it hidden during the small lead-in delay. ---- */
        .rc-suc-root.rc-printing .rc-suc-receipt { animation:rcFeed 2.6s linear both .2s; }
        @keyframes rcFeed {
          0%   { transform:translateY(-101%); }
          10%  { transform:translateY(-86%); }
          17%  { transform:translateY(-86%); }
          30%  { transform:translateY(-58%); }
          38%  { transform:translateY(-58%); }
          52%  { transform:translateY(-34%); }
          60%  { transform:translateY(-34%); }
          74%  { transform:translateY(-12%); }
          82%  { transform:translateY(-12%); }
          100% { transform:translateY(0); }
        }

        /* ---- TABLET+ : a touch more air ---- */
        @media (min-width:768px) {
          .rc-suc-root .rc-suc-wrap { max-width:420px; }
        }

        /* ---- DESKTOP : asymmetric two-column collage (headline + actions left,
           machine + receipt right, ephemera on the desk between them) ---- */
        @media (min-width:900px) {
          .rc-suc-root { padding:48px 40px 60px; }
          /* rc-SF form-first: the left column packs headline + actions to the TOP so
             the evaluate CTA lands in the first viewport (the printing receipt is a
             tall object; with 1fr 1fr rows its height stretched both left rows and
             pushed the CTA past centre). Row 1 sizes to the headline (min-content),
             the flexible row 2 (1fr) absorbs the stage's extra height, and the tail
             sits directly under the headline (align-self:start, unchanged). The stage
             stays vertically centred against the full column height. The leftover
             space now falls BELOW the actions as dignified desk whitespace. */
          .rc-suc-root .rc-suc-wrap { max-width:960px; display:grid; align-items:stretch;
            grid-template-columns:minmax(0, 1fr) minmax(340px, 400px);
            grid-template-rows:min-content 1fr; column-gap:clamp(32px, 5vw, 72px);
            grid-template-areas:"headline stage" "tail stage"; }
          .rc-suc-root .rc-suc-headline { grid-area:headline; align-self:start; text-align:left; margin-bottom:0; }
          .rc-suc-root .rc-suc-display { align-items:flex-start; font-size:clamp(34px, 3.6vw, 52px); }
          .rc-suc-root .rc-suc-deck { margin-left:0; margin-right:0; }
          .rc-suc-root .rc-suc-stage { grid-area:stage; align-self:center; }
          /* restore the tail box (dissolved to display:contents on mobile) so the
             desktop left column re-groups actions + fine print + copyright exactly
             as before — byte-for-byte with the pre-R8 collage. */
          .rc-suc-root .rc-suc-tail { grid-area:tail; align-self:start; display:block; }
          .rc-suc-root .rc-suc-actions { margin-top:26px; }
        }

        /* ---- MOBILE : keep the desk calm — only the stub + one tape survive ---- */
        @media (max-width:767px) {
          .rc-suc-root .rc-suc-ghost,
          .rc-suc-root .rc-suc-regtape,
          .rc-suc-root .rc-suc-chip,
          .rc-suc-root .rc-suc-testprint,
          .rc-suc-root .rc-suc-tape--loose { display:none; }
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
