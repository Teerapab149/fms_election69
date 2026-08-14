"use client";

// FmsOfficialSuccess — the screen a student sees immediately after their ballot
// is accepted.
//
// This page carries a specific responsibility in this system: since v2-SEC the
// ballot is anonymous and encrypted, so there is NO record anywhere linking this
// person to their choice — and that is a feature the voter should be told about
// plainly, here, at the one moment they are paying attention. A student who
// understands the ballot is untraceable is a student who votes honestly next
// year. So the confirmation states two facts: your vote was counted, and nobody
// can tell what it was.
//
// It deliberately does NOT echo the choice back. Rendering "you voted for X"
// would put the very link the ballot design removes onto a screen that can be
// shoulder-surfed or screenshotted.

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, ShieldCheck, ClipboardList, BarChart3, Lock, Check, CalendarClock } from "lucide-react";
import { getPath } from "../../utils/basePath";
import FmsOfficialShell from "./FmsOfficialShell";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { fmsMeta } from "../home/FmsOfficialChrome";
import { resolveElectionDates, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";

export default function FmsOfficialSuccess({
  user = null, isUnlocked = false, onOpenForm = () => {}, editorMode = false,
}) {
  const globalConfig = useGlobalConfig();
  const meta = fmsMeta(globalConfig);
  const reduce = useReducedMotion();
  const name = user?.name || "";
  // editorMode previews the unlocked end-state; live follows the real gate
  const resultsOpen = isUnlocked || editorMode;

  // The two questions a voter actually has once the ballot is in: is that it,
  // and when do we find out. The second had no answer on this page at all. The
  // close time is already resolved from globalConfig everywhere else in the
  // system, so it derives rather than being written down and drifting when an
  // admin moves the schedule.
  const closesAt = useMemo(() => {
    const end = resolveElectionDates(globalConfig)?.ELECTION_END;
    if (!end || isNaN(new Date(end).getTime())) return null;
    return { date: formatThaiDate(end), time: formatThaiTime(end) };
  }, [globalConfig]);

  return (
    <FmsOfficialShell active="vote" narrow plain editorMode={editorMode}>
      {/* A confirmation IS a receipt, so it gets the family's document. Before
          this it was a loose centred column — icon, heading, paragraph, tinted
          box — with no container holding them together. */}
      <div className="fo-succ">
        <div className="fo-notice">
          {/* No tab here — owner's call, same as the other inner pages: the
              hanging tab belongs to the home page alone, and repeating it made
              the documents look stamped rather than designed. The frame and the
              head rule already say which family this is. */}
          {/* The family's ghost sits on every other document it prints — the
              home page's edition numeral, the party header's number, the
              ballot's. This one had none, which is why it read as a card rather
              than as the last page of the same set. */}
          <span className="fo-notice__ghost fo-succ__ghost" aria-hidden>{meta.num}</span>

          <div className="fo-notice__body fo-succ__body">
            {/* The one moment in this template that is allowed to arrive rather
                than just be there. It is a transform-and-opacity settle on an
                element that is already painted and already says what it says —
                never a reveal the content depends on, which is the failure this
                project has actually shipped before. */}
            <motion.span
              className="fo-succ__ico"
              initial={reduce ? false : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <CheckCircle2 size={26} aria-hidden />
            </motion.span>
            <h1 className="fo-succ__h1">บันทึกการลงคะแนนเรียบร้อย</h1>
            <span className="fo-rule" aria-hidden />
            <p className="fo-succ__desc">
              {name ? `ขอบคุณ ${name} ` : "ขอบคุณ "}
              ระบบได้รับคะแนนของคุณแล้ว และนับรวมในผลการเลือกตั้งเรียบร้อย
            </p>
          </div>

          {/* The anonymity note is a compartment of the receipt, not a floating
              tinted box — it is the single most load-bearing claim this system
              makes about itself, and it belongs ON the document that proves it. */}
          <div className="fo-succ__panel">
            <span className="fo-succ__panel-ico"><ShieldCheck size={18} aria-hidden /></span>
            <div>
              <b>บัตรของคุณไม่ระบุตัวตน</b>
              <p>
                ระบบบันทึกเฉพาะตัวเลือกในรูปแบบเข้ารหัส แยกออกจากบัญชีผู้ใช้ ไม่มีใคร
                รวมถึงผู้ดูแลระบบ ที่ย้อนดูได้ว่าคุณเลือกอะไร ระบบเก็บไว้เพียงว่าคุณใช้สิทธิ์แล้ว
                เพื่อไม่ให้ลงคะแนนซ้ำ
              </p>
            </div>
          </div>

          {/* Another compartment of the same receipt, on the same hairline. It
              answers the question the page was silent on: the ballot is in, so
              when is it counted. Renders only when the schedule resolves — a
              "ประกาศผลวันที่ —" is worse than not raising the subject at all. */}
          {closesAt && (
            <div className="fo-succ__next">
              <span className="fo-succ__next-ico"><CalendarClock size={18} aria-hidden /></span>
              <div>
                <b>ผลคะแนนประกาศหลังปิดหีบ</b>
                {/* Both gates in one sentence. They used to be two: this block
                    said results come after the close, and a separate line below
                    the buttons said they come after the evaluation. Both true —
                    the count needs the election over AND this voter's form in —
                    but sitting 100px apart they read as two different answers to
                    the same question. */}
                <p>
                  การลงคะแนนปิด{closesAt.date} เวลา {closesAt.time}
                  {resultsOpen
                    ? " จากนั้นระบบจะเปิดให้ดูผลคะแนนอย่างเป็นทางการ"
                    : " และจะเปิดให้คุณดูได้เมื่อทำแบบประเมินเรียบร้อยแล้ว"}
                </p>
              </div>
            </div>
          )}

        {/* The actions live INSIDE the receipt on this page, unlike closed —
            they are its last compartment, the way a form ends in a submit row.
            That is what makes the phone fix possible at all: the panel and the
            buttons have to be siblings for an order swap to reach them, and on a
            360×640 handset the 200px panel had been pushing the evaluation
            button 131px below the fold. */}
        {/* The evaluation form is the GATE that unlocks results, so the actions
            invert on `isUnlocked` — that is the contract every other family
            implements and the one the parent page's state machine expects.
            An earlier version gated the form button on globalConfig.googleFormUrl,
            which is not where that URL lives on this page (the parent fetches it
            into its own state and hands down only onOpenForm) — so the button
            never rendered and the voter had no way to reach the form at all. */}
        <div className="fo-succ__actions">
          {/* The form control is ALWAYS present — it never disappears once done,
              it just stops being an action. A button that vanishes on completion
              leaves the voter unsure whether they did the thing or the page
              simply changed; a greyed "ทำแล้ว" with a tick answers that on sight. */}
          {resultsOpen ? (
            <>
              <a href={editorMode ? undefined : getPath("/results")} className="fo-btn fo-btn--primary">
                <BarChart3 size={17} aria-hidden /> ดูผลคะแนน
              </a>
              <span className="fo-btn fo-btn--done" role="status">
                <Check size={17} strokeWidth={3} aria-hidden /> ทำแบบประเมินแล้ว
              </span>
            </>
          ) : (
            <button type="button" onClick={editorMode ? undefined : onOpenForm} className="fo-btn fo-btn--primary">
              <ClipboardList size={17} aria-hidden /> ทำแบบประเมิน (รับชั่วโมงกิจกรรม)
            </button>
          )}
          <a href={editorMode ? undefined : getPath("/")} className="fo-btn fo-btn--ghost">กลับหน้าแรก</a>
        </div>

          {/* Only the fallback now: when the schedule cannot be resolved there is
              no compartment above to carry the gate, and a voter must still be
              told why the results button is not here. */}
          {!resultsOpen && !closesAt && (
            <p className="fo-succ__lock">
              <Lock size={14} aria-hidden /> ผลคะแนนจะเปิดให้ดูหลังทำแบบประเมินเรียบร้อย
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        .fo-succ { display: flex; flex-direction: column; align-items: center; }
        /* a flex column so its compartments can be re-ordered on a phone */
        .fo-succ .fo-notice { max-width: 620px; display: flex; flex-direction: column; }
        .fo-succ__body { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .fo-succ__ico {
          width: 56px; height: 56px; border-radius: 50%; margin-bottom: 16px;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--fo-brand); color: #fff;
          box-shadow: 0 14px 30px -16px rgba(110, 31, 103, .85);
        }
        .fo-succ__h1 { margin: 0; font-size: clamp(24px, 3.2vw, 34px); font-weight: 600; line-height: 1.25; color: var(--fo-ink); }
        .fo-succ__desc { margin: 14px 0 0; max-width: 460px; font-size: 15px; font-weight: 300; line-height: 1.65; color: var(--fo-muted); }

        /* a compartment, divided by the hairline — no second border, no second
           background, because it is part of the same piece of paper */
        .fo-succ__panel {
          position: relative; z-index: 1;
          display: flex; gap: 14px; text-align: left;
          border-top: 1px solid var(--fo-line); padding: 20px 26px 22px;
          background: var(--fo-tint);
        }
        .fo-succ__panel-ico {
          flex: 0 0 auto; width: 34px; height: 34px; border-radius: 8px;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--fo-surface); color: var(--fo-brand); border: 1px solid var(--fo-line);
        }
        .fo-succ__panel b { display: block; font-size: 15px; font-weight: 500; color: var(--fo-ink); }
        .fo-succ__panel p { margin: 6px 0 0; font-size: 13.5px; font-weight: 300; line-height: 1.65; color: var(--fo-muted); }

        /* Same compartment shape as the anonymity note, on the surface rather
           than the tint: the two are peers, and giving both the tint would have
           made the receipt two-thirds coloured. */
        .fo-succ__next {
          position: relative; z-index: 1;
          display: flex; gap: 14px; text-align: left;
          border-top: 1px solid var(--fo-line); padding: 18px 26px 20px;
        }
        .fo-succ__next-ico {
          flex: 0 0 auto; width: 34px; height: 34px; border-radius: 8px;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--fo-tint); color: var(--fo-brand); border: 1px solid var(--fo-line);
        }
        .fo-succ__next b { display: block; font-size: 14.5px; font-weight: 500; color: var(--fo-ink); }
        .fo-succ__next p { margin: 5px 0 0; font-size: 13px; font-weight: 300; line-height: 1.65; color: var(--fo-muted); }

        /* Anchored to the TOP, unlike every other document's ghost. Theirs sit
           bottom-right behind one continuous body; this receipt is compartments,
           and two of them (the anonymity note's tint, the actions row) paint
           their own ground — so a bottom-anchored numeral surfaced through some
           and not others and read as a stain rather than a device. The head is
           the one clean field on the page.
           Weaker too: .07 behind centred text on a 620px card read as dirt under
           the words rather than as watermark. */
        .fo-succ__ghost {
          top: -.3em; bottom: auto; right: -.04em;
          font-size: clamp(150px, 20vw, 240px); opacity: .05;
        }

        /* the submit row of the receipt: its own compartment, hairline-divided
           like every other one, so the document ends on the thing to do next */
        .fo-succ__actions {
          position: relative; z-index: 1;
          display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
          border-top: 1px solid var(--fo-line); padding: 20px 26px 22px;
        }
        .fo-succ__lock {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          margin: 0; padding: 0 26px 20px;
          font-size: 13px; font-weight: 300; color: var(--fo-muted); text-align: center;
        }
        .fo-succ__lock svg { color: var(--fo-brand-soft); }

        @media (max-width: 640px) {
          /* The anonymity panel stands 206px tall on a phone, which pushed the
             first action to y=712 — below the fold on any 667px handset. The panel
             is something to READ; the button is something to DO, and the thing to
             do belongs above the thing to read. Reordering in CSS keeps the DOM in
             reading order for screen readers, which still meet the explanation
             before the buttons. */
          /* Phone: the buttons come BEFORE the explainer. The anonymity panel is
             ~200px tall here and it had been pushing the evaluation button 131px
             below the fold on a 360x640 handset. Reordering in CSS leaves the DOM
             in reading order, so a screen reader still meets the explanation
             before the actions — only the eye sees them swapped. */
          .fo-succ__body    { order: 1; }
          .fo-succ__actions { order: 2; flex-direction: column; padding: 18px 16px 16px; }
          .fo-succ__lock    { order: 3; padding: 0 16px 16px; }
          /* the schedule is a thing to DO something about (come back later), so
             it stays above the anonymity note, which is a thing to read */
          .fo-succ__next    { order: 4; padding: 16px; }
          .fo-succ__panel   { order: 5; flex-direction: column; gap: 12px; padding: 18px 16px; }
          .fo-succ__actions .fo-btn { width: 100%; justify-content: center; }
          .fo-succ__actions .fo-btn { width: 100%; justify-content: center; }
          .fo-succ__ico { width: 56px; height: 56px; margin-bottom: 16px; }
        }
        @media (max-width: 380px) {
          .fo-succ__h1 { font-size: 23px; }
          .fo-succ__desc { font-size: 14px; }
          .fo-succ__panel { padding: 16px; }
        }
      `}</style>
    </FmsOfficialShell>
  );
}
