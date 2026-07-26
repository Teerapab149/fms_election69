"use client";

// StudioDarkSuccess — the POST-VOTE SUCCESS page layout for the Studio Dark v2
// template. Rendered by /success when activeTemplateId === 'studio-dark'.
//
// Faithful to docs/design-refs/Studio Dark v2.html §04b: 50/50 split scene —
// LEFT: lime check mark inside a slowly spinning dashed ring + "Thank you for
// voting." (voting in serif italic) + deck; RIGHT (raised surface): a receipt
// card (VOTER / VOTER ID / STATUS / SECURED BY rows), a lime-edged callout for
// the activity-transcript evaluation, and the action stack — เปิดแบบประเมิน
// (accent, switches to a done state once submitted), ดูผลคะแนน (gated until the
// evaluation is done), กลับหน้าหลัก (ghost).
//
// Pure presentation: success/page.js owns auth/redirects + the SHARED form
// modal — onOpenForm() opens it; isUnlocked = evaluation completed.

import { getPath } from "../../utils/basePath";
import { Check, Lock, BarChart3 } from "lucide-react";
import StudioDarkShell from "./StudioDarkShell";

export default function StudioDarkSuccess({
  user = null,
  isUnlocked = false,
  onOpenForm = () => {},
  editorMode = false,
}) {
  const name = user?.name || (editorMode ? "Teerapab Boonsri" : "-");
  const sid = user?.studentId || (editorMode ? "6610510149" : "-");

  return (
    <StudioDarkShell
      active="vote"
      num="03b"
      label="Receipt"
      labelTh="ลงคะแนนสำเร็จ"
      editorMode={editorMode}
      right={<span className="live"><span className="sd-dot" /> RECORDED</span>}
    >
      <div className="sds-scene">
        {/* LEFT — thank you */}
        <div className="sds-left">
          <div className="sds-mark"><Check size={30} strokeWidth={2.5} /></div>
          <div className="sds-chapter"><span className="sd-dot" /> <span className="sd-nw">BALLOT RECORDED</span> · <span className="sd-thai">บันทึกแล้ว</span></div>
          <h1 className="sds-title">Thank<br />you for<br /><em>voting.</em></h1>
          <p className="sds-deck">
            บันทึกคะแนนเรียบร้อยแล้ว ขอบคุณที่ร่วมเป็นส่วนหนึ่งของการขับเคลื่อนกิจกรรมนักศึกษา คณะวิทยาการจัดการ
          </p>
        </div>

        {/* RIGHT — receipt + actions */}
        <div className="sds-right">
          <div className="sds-receipt">
            <div className="sds-receipt__h">
              <span>RECEIPT</span>
              <span><span className="sds-accent">●</span> CONFIRMED</span>
            </div>
            <div className="sds-row"><div className="sds-row__lbl">VOTER</div><div className="sds-row__val">{name}</div></div>
            <div className="sds-row"><div className="sds-row__lbl">VOTER ID</div><div className="sds-row__val">№ {sid}</div></div>
            <div className="sds-row"><div className="sds-row__lbl">STATUS</div><div className="sds-row__val"><span className="sd-thai">บันทึกคะแนนแล้ว</span> · <span className="sd-nw">1 VOTE</span></div></div>
            <div className="sds-row"><div className="sds-row__lbl">SECURED BY</div><div className="sds-row__val">PSU Passport · OAuth</div></div>
          </div>

          <div className="sds-callout">
            <h4>รับทรานสคริปต์กิจกรรม</h4>
            <p>ทำแบบประเมินให้ครบเพื่อรับชั่วโมงกิจกรรม (2 ชม. ประเภทเลือกเข้าร่วม) และปลดล็อกหน้าสรุปผลคะแนน</p>
          </div>

          <div className="sds-actions">
            {isUnlocked && !editorMode ? (
              <div className="sds-done"><Check size={16} strokeWidth={3} /> ส่งแบบประเมินเรียบร้อยแล้ว</div>
            ) : (
              <button type="button" className="sd-btn sd-btn--accent sd-btn--lg sd-btn--block" onClick={() => !editorMode && onOpenForm()}>
                เปิดแบบประเมิน →
              </button>
            )}

            <a
              href={(isUnlocked || editorMode) ? getPath("/results") : undefined}
              className={`sd-btn sd-btn--block ${(isUnlocked || editorMode) ? "" : "is-disabled"}`}
              aria-disabled={!isUnlocked && !editorMode}
            >
              {(isUnlocked || editorMode)
                ? <>ดูผลคะแนน · Results <BarChart3 size={16} /></>
                : <><Lock size={14} /> ล็อค — ทำแบบประเมินก่อน</>}
            </a>

            {/* was .sd-textlink — a 14px underline-on-hover line stacked under two full
                pills, so the only unlocked exit on the page was the one thing that did
                not look pressable. Same pill as the results button, dashed to stay a
                step below it. */}
            <a href={editorMode ? undefined : getPath("/")} className="sd-btn sd-btn--block sds-home">
              ← กลับหน้าหลัก <span className="sd-smallcaps">Home</span>
            </a>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .sds-accent { color:var(--sd-accent); }

        .sds-scene { flex:1; display:grid; grid-template-columns:1fr 1fr; min-height:calc(100vh - 64px); }

        .sds-left {
          padding:64px 56px; border-right:1px solid var(--sd-line);
          display:flex; flex-direction:column; justify-content:center; position:relative; overflow:hidden;
        }
        .sds-left::after {
          content:""; position:absolute; right:-100px; bottom:-100px; width:320px; height:320px;
          background:radial-gradient(circle, rgba(213,255,63,.08) 0, transparent 70%); pointer-events:none;
        }
        .sds-mark {
          width:80px; height:80px; border:1px solid var(--sd-accent); border-radius:999px;
          display:grid; place-items:center; color:var(--sd-accent); margin-bottom:32px; position:relative; z-index:1;
        }
        .sds-mark::before {
          content:""; position:absolute; inset:-8px; border:1px dashed var(--sd-line-strong); border-radius:999px;
          animation:sdsSpin 30s linear infinite;
        }
        @keyframes sdsSpin { to { transform:rotate(360deg); } }
        .sds-chapter {
          font-family:var(--sd-mono); font-size:11px; letter-spacing:.25em; text-transform:uppercase;
          color:var(--sd-accent); margin-bottom:28px; display:flex; align-items:center; gap:10px;
        }
        .sds-title { font-family:var(--sd-sans); font-weight:400; font-size:clamp(56px,7vw,108px); line-height:.92; letter-spacing:-.05em; margin:0 0 24px; position:relative; z-index:1; }
        .sds-deck { font-size:17px; color:var(--sd-ink-2); line-height:1.6; font-weight:300; max-width:440px; margin:0; position:relative; z-index:1; }

        .sds-right { padding:64px 56px; background:var(--sd-bg-2); display:flex; flex-direction:column; gap:24px; justify-content:center; }

        .sds-receipt { border:1px solid var(--sd-line); border-radius:16px; overflow:hidden; }
        .sds-receipt__h {
          padding:18px 24px; background:var(--sd-bg-3); border-bottom:1px solid var(--sd-line);
          display:flex; justify-content:space-between; align-items:center;
          font-family:var(--sd-mono); font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--sd-ink-3);
        }
        .sds-row { display:grid; grid-template-columns:auto 1fr; gap:24px; padding:14px 24px; align-items:baseline; border-bottom:1px dashed var(--sd-line); }
        .sds-row:last-child { border-bottom:0; }
        .sds-row__lbl { font-family:var(--sd-mono); font-size:11px; letter-spacing:.15em; text-transform:uppercase; color:var(--sd-ink-3); }
        .sds-row__val { font-family:var(--sd-mono); font-size:13px; color:var(--sd-ink); text-align:right; overflow-wrap:anywhere; }

        .sds-callout { padding:22px 24px; border:1px solid var(--sd-line); border-left:2px solid var(--sd-accent); border-radius:12px; background:var(--sd-bg-3); }
        .sds-callout h4 { margin:0 0 6px; font-family:var(--sd-sans); font-weight:500; font-size:15px; color:var(--sd-ink); }
        .sds-callout p { margin:0; font-size:13px; color:var(--sd-ink-2); line-height:1.55; }

        .sds-actions { display:grid; gap:10px; }
        .sds-done {
          display:flex; align-items:center; justify-content:center; gap:10px;
          padding:15px 22px; border:1px solid rgba(213,255,63,.4); border-radius:999px;
          background:rgba(213,255,63,.08); color:var(--sd-accent); font-family:var(--sd-sans); font-size:14px; font-weight:500;
        }
        .sds-home { margin-top:2px; border-style:dashed; border-color:var(--sd-ink-2); }
        .sds-home:hover { border-color:var(--sd-ink); }

        @media (max-width:1100px) {
          .sds-scene { grid-template-columns:1fr; min-height:0; }
          .sds-left { border-right:0; border-bottom:1px solid var(--sd-line); padding:48px 24px; }
          .sds-right { padding:40px 24px 56px; }
          /* v2-R8 T4 (form-first): single-column, lift the pitch + evaluate CTA above
             the receipt so the button lands in the first viewport. The receipt (the
             proof) trails below — desktop 50/50 split is untouched. */
          .sds-right .sds-callout { order:1; }
          .sds-right .sds-actions { order:2; }
          .sds-right .sds-receipt { order:3; }
        }
        /* SHORT single-column viewports — the laptop class (1024×760), which the
           width-only rules above missed. That band gets the widest 1-col title
           (clamp 7vw = 71.7px at 1024, three lines) on the shortest viewport, so
           BOTH actions fell past the fold: measured "เปิดแบบประเมิน" at y=851 and
           "ดูผลคะแนน · Results" at y=919 in a 760px viewport, while PC (2-col),
           tablet 768×1024 and mobile 412×880 all showed them in the first screen.
           Same reclaim the phone rule below makes, keyed on height instead of
           width. Declared BEFORE the 560 block on purpose: where both match (a
           short, narrow phone) the phone tuning should still win. */
        @media (max-width:1100px) and (max-height:820px) {
          .sds-left { padding:30px 24px 26px; }
          .sds-mark { width:60px; height:60px; margin-bottom:20px; }
          .sds-chapter { margin-bottom:18px; }
          .sds-title { font-size:clamp(44px,5vw,64px); margin-bottom:18px; }
          .sds-right { padding:26px 24px 48px; gap:18px; }
        }
        @media (max-width:560px) {
          /* tighten the thank-you hero on phones so the reordered evaluate CTA
             clears the fold on Pixel-class devices (412×915) once the browser
             URL bar is accounted for — a ~16px padding reclaim on the already-
             passed thank-you hero, no CTA shrink, no relayout. */
          .sds-left { padding:30px 20px 26px; }
          .sds-mark { width:60px; height:60px; margin-bottom:20px; }
          .sds-chapter { margin-bottom:18px; }
          .sds-title { font-size:clamp(44px,12vw,108px); margin-bottom:18px; }
          .sds-right { padding:24px 20px 52px; gap:18px; }
        }
      `}</style>
    </StudioDarkShell>
  );
}
