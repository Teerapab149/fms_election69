"use client";

// FmsOfficialSingleParty — the ballot when exactly one party stands.
//
// It is a different question from the multi-party ballot, and it used to be
// asked with the same widget: three rows in a list, where the party got one
// slogan and a team count. But a voter here is not choosing BETWEEN parties,
// they are deciding whether this one should govern — and that is the one vote
// you cannot cast honestly without the party's case in front of you.
//
// So the screen is the party's dossier, presented in full, ending in the
// decision. The order is the argument: read, then decide. The three choices sit
// at the foot of it because that is where a reader arrives having read.
//
// Three rules this screen holds, in order of importance:
//   1. The choices are visually equal. รับรอง, ไม่รับรอง and งดออกเสียง get the
//      same footprint, the same weight, the same hit area. A ballot that makes
//      one answer easier to click than another is not neutral, and the whole
//      claim of this template is that it is the faculty's neutral instrument.
//   2. Nothing that carries meaning is hidden behind an animation. The intro is
//      an overlay on content that has already rendered; the ballot underneath is
//      painted by CSS at rest. This project has shipped an invisible ballot
//      before by hanging it off a reveal that never fired.
//   3. The submit is irreversible, so it is confirmed, and the confirmation
//      names the choice back to the voter in words.

import { useMemo, useState } from "react";
import { Check, Loader2, ShieldCheck, ArrowDown } from "lucide-react";
import FmsOfficialShell from "./FmsOfficialShell";
import FmsOfficialPartyBody from "./FmsOfficialPartyBody";
import FmsOfficialPartyIntro from "./FmsOfficialPartyIntro";

export default function FmsOfficialSingleParty({
  party = {}, galleryImages = [], specialOptions = {},
  selectedPartyId = null, onSelect = () => {},
  user = null, onConfirm = () => {}, isSubmitting = false, editorMode = false,
}) {
  // The intro never gates the ballot: it is an overlay, and the page beneath it
  // is fully rendered from the first paint. Skipped outright in the editor,
  // where a full-screen curtain over a preview pane is just in the way.
  const [introDone, setIntroDone] = useState(editorMode);
  const [confirming, setConfirming] = useState(false);

  const choices = useMemo(() => {
    const out = [];
    if (party?.id != null) {
      // spaces around the name on purpose: Thai does not space between words,
      // but a Latin party name butted straight against สรรพนาม reads as one run
      // of characters — "ให้พรรคThe Unity Concord Of FMS 2เข้า"
      out.push({
        id: party.id, kind: "approve", label: "รับรอง",
        sub: party?.name
          ? `เห็นชอบให้พรรค ${party.name} เข้าดำรงตำแหน่ง`
          : "เห็นชอบให้พรรคนี้เข้าดำรงตำแหน่ง",
      });
    }
    if (specialOptions?.disapprove) {
      out.push({
        id: specialOptions.disapprove.id, kind: "disapprove", label: "ไม่รับรอง",
        sub: "ไม่เห็นชอบให้พรรคนี้เข้าดำรงตำแหน่ง",
      });
    }
    if (specialOptions?.abstain) {
      out.push({
        id: specialOptions.abstain.id, kind: "abstain", label: "งดออกเสียง",
        sub: "ใช้สิทธิ์โดยไม่ลงคะแนนให้ฝ่ายใด",
      });
    }
    return out;
  }, [party?.id, party?.name, specialOptions]);

  const chosen = choices.find((c) => c.id === selectedPartyId) || null;

  return (
    <FmsOfficialShell active="vote" plain editorMode={editorMode}>
      {!introDone && !editorMode && (
        <FmsOfficialPartyIntro party={party} onDone={() => setIntroDone(true)} />
      )}

      {/* Says what this screen is before the dossier begins, because the dossier
          looks exactly like /party and a voter who lands here mid-scroll should
          never be unsure whether they are reading or voting. */}
      <div className="fo-sballot__lead">
        <span className="fo-sballot__kicker">บัตรลงคะแนน · ผู้สมัครเพียงพรรคเดียว</span>
        <p>
          ปีนี้มีผู้สมัครเพียงพรรคเดียว โปรดพิจารณาข้อมูลของพรรคด้านล่าง
          แล้วเลือกว่าจะรับรอง ไม่รับรอง หรืองดออกเสียง เลือกได้หนึ่งข้อ
        </p>
        <a href="#fo-decision" className="fo-sballot__jump">
          ข้ามไปที่การลงคะแนน <ArrowDown size={15} aria-hidden />
        </a>
      </div>

      <FmsOfficialPartyBody party={party} galleryImages={galleryImages} editorMode={editorMode} />

      <section id="fo-decision" className="fo-party__sec fo-decision">
        <div className="fo-sechead">
          <h2>การลงคะแนน</h2>
          <p>เลือกได้หนึ่งข้อ เมื่อยืนยันแล้วจะไม่สามารถแก้ไขได้</p>
        </div>

        {user?.name && (
          <p className="fo-voter">
            กำลังลงคะแนนในนาม <b>{user.name}</b>
          </p>
        )}

        {/* radiogroup, not three buttons: the one fact a voter must be told here
            is that these are mutually exclusive and exactly one applies */}
        <div className="fo-dec" role="radiogroup" aria-label="ตัวเลือกการลงคะแนน">
          {choices.map((c) => {
            const selected = c.id === selectedPartyId;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`fo-dec__opt ${selected ? "is-selected" : ""}`}
                onClick={editorMode ? undefined : () => onSelect(c.id)}
              >
                <span className="fo-dec__mark" aria-hidden>
                  {selected ? <Check size={17} strokeWidth={3} /> : null}
                </span>
                <b className="fo-dec__label">{c.label}</b>
                <span className="fo-dec__sub">{c.sub}</span>
              </button>
            );
          })}
        </div>

        <div className="fo-dec__foot">
          <span className="fo-dec__state">
            {chosen
              ? <>เลือกไว้: <b>{chosen.label}</b></>
              : <span className="fo-note">ยังไม่ได้เลือก</span>}
          </span>
          <button
            type="button"
            className="fo-btn fo-btn--primary"
            disabled={!chosen || isSubmitting || editorMode}
            onClick={editorMode ? undefined : () => setConfirming(true)}
          >
            {isSubmitting
              ? <><Loader2 size={17} className="fo-spin" aria-hidden /> กำลังบันทึก…</>
              : <>ยืนยันการลงคะแนน</>}
          </button>
        </div>

        <p className="fo-privacy">
          <ShieldCheck size={15} aria-hidden />
          ระบบบันทึกเฉพาะตัวเลือกในรูปแบบเข้ารหัส ไม่ผูกกับบัญชีของคุณ ไม่มีใครย้อนดูได้ว่าคุณเลือกอะไร
        </p>
      </section>

      {confirming && chosen && (
        <div className="fo-cm" role="dialog" aria-modal="true" aria-labelledby="fo-cm-title">
          <div className="fo-cm__card">
            <h3 id="fo-cm-title">ยืนยันการลงคะแนน</h3>
            {/* names the choice back rather than saying "your selection" — the
                last chance to catch a mis-tap before something irreversible */}
            <p className="fo-cm__pick">{chosen.label}</p>
            <p className="fo-cm__warn">เมื่อยืนยันแล้วจะไม่สามารถแก้ไขได้</p>
            <div className="fo-cm__acts">
              <button type="button" className="fo-btn fo-btn--ghost" onClick={() => setConfirming(false)}>
                ย้อนกลับ
              </button>
              <button
                type="button"
                className="fo-btn fo-btn--primary"
                disabled={isSubmitting}
                onClick={onConfirm}
              >
                {isSubmitting
                  ? <><Loader2 size={17} className="fo-spin" aria-hidden /> กำลังบันทึก…</>
                  : <>ยืนยัน</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .fo-sballot__lead { margin-bottom: 26px; }
        .fo-sballot__kicker { display: block; font-size: 12.5px; font-weight: 500; letter-spacing: .04em; color: var(--fo-brand-soft); }
        .fo-sballot__lead p { margin: 8px 0 0; max-width: 760px; font-size: 15px; font-weight: 300; line-height: 1.7; color: var(--fo-muted); }
        /* The dossier runs several thousand pixels before the choices appear.
           A voter who has already made up their mind should not have to scroll
           past all of it to act. */
        .fo-sballot__jump {
          display: inline-flex; align-items: center; gap: 7px; margin-top: 14px;
          font-size: 14px; font-weight: 500; color: var(--fo-brand);
          border-bottom: 1px solid var(--fo-line); padding-bottom: 3px;
          transition: border-color .18s;
        }
        .fo-sballot__jump:hover { border-bottom-color: var(--fo-brand); }

        /* scroll-margin, so the anchor jump does not tuck the heading under the
           sticky header — it lands with the section title visible */
        .fo-decision { scroll-margin-top: 90px; }
        .fo-voter { margin: 0 0 18px; font-size: 14px; font-weight: 300; color: var(--fo-muted); }
        .fo-voter b { font-weight: 500; color: var(--fo-ink); }

        /* Three equal columns — the ballot's neutrality made structural. Every
           choice gets the same width, the same height and the same padding, so
           no answer is easier to reach than another. */
        /* grid-auto-rows: 1fr is what actually holds rule 1, not the min-height
           below. The รับรอง line carries the party's name, so it is as long as
           the party made it — measured two distinct card heights on a phone,
           where it wrapped and the other two did not. Equal rows makes every
           choice the height of the tallest, whatever anyone types. */
        .fo-dec { display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 1fr; gap: 14px; }
        .fo-dec__opt {
          display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
          width: 100%; min-height: 152px; text-align: left; cursor: pointer;
          font-family: inherit; padding: 22px 24px; border-radius: 12px;
          background: var(--fo-surface); border: 1px solid var(--fo-line);
          transition: border-color .16s, background .16s, box-shadow .16s;
        }
        .fo-dec__opt:hover { border-color: var(--fo-brand-soft); background: var(--fo-tint); }
        /* Three signals for selection — ring, field, check — because one is not
           enough on a screen someone reads once and commits to. */
        .fo-dec__opt.is-selected {
          border-color: var(--fo-brand); box-shadow: inset 0 0 0 1px var(--fo-brand);
          background: var(--fo-tint);
        }
        .fo-dec__opt:focus-visible { outline: 2px solid var(--fo-brand); outline-offset: 2px; }
        .fo-dec__mark {
          width: 28px; height: 28px; border-radius: 50%; margin-bottom: 4px;
          display: inline-flex; align-items: center; justify-content: center;
          border: 2px solid var(--fo-line); color: #fff; background: transparent;
        }
        .fo-dec__opt.is-selected .fo-dec__mark { background: var(--fo-brand); border-color: var(--fo-brand); }
        .fo-dec__label { font-size: 19px; font-weight: 500; color: var(--fo-ink); }
        .fo-dec__sub { font-size: 13.5px; font-weight: 300; line-height: 1.6; color: var(--fo-muted); }

        .fo-dec__foot {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-top: 18px;
          padding: 16px 20px; border-radius: 12px;
          background: var(--fo-surface); border: 1px solid var(--fo-line);
        }
        .fo-dec__state { font-size: 14.5px; font-weight: 300; color: var(--fo-muted); }
        .fo-dec__state b { font-weight: 500; color: var(--fo-ink); }
        .fo-spin { animation: fo-spin 1s linear infinite; }
        @keyframes fo-spin { to { transform: rotate(360deg); } }

        .fo-privacy {
          display: flex; align-items: flex-start; gap: 8px; margin: 20px 0 0;
          font-size: 13px; font-weight: 300; line-height: 1.6; color: var(--fo-muted);
        }
        .fo-privacy svg { flex: 0 0 auto; margin-top: 2px; color: var(--fo-brand-soft); }

        .fo-cm {
          position: fixed; inset: 0; z-index: 200; display: grid; place-items: center;
          padding: 24px; background: rgba(36, 30, 40, .55);
        }
        .fo-cm__card {
          width: min(440px, 100%); padding: 28px 30px 24px; border-radius: 4px;
          background: var(--fo-surface); border: 1px solid var(--fo-line);
          border-top: 6px solid var(--fo-brand);
          box-shadow: 0 40px 80px -50px rgba(36, 30, 40, .8);
        }
        .fo-cm__card h3 { margin: 0; font-size: 19px; font-weight: 600; color: var(--fo-ink); }
        .fo-cm__pick {
          margin: 16px 0 0; padding: 14px 18px; border-radius: 8px;
          background: var(--fo-tint); border: 1px solid var(--fo-line);
          font-size: 18px; font-weight: 500; color: var(--fo-brand);
        }
        .fo-cm__warn { margin: 14px 0 0; font-size: 13.5px; font-weight: 300; color: var(--fo-muted); }
        .fo-cm__acts { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }

        @media (max-width: 860px) {
          /* Stacked, and each choice keeps its full row. Two-up would have left
             a lone third card on its own line, which reads as the odd one out —
             on a ballot that is not a cosmetic problem. */
          .fo-dec { grid-template-columns: 1fr; gap: 10px; }
          .fo-dec__opt { min-height: 0; flex-direction: row; align-items: center; flex-wrap: wrap; padding: 16px 18px; gap: 4px 14px; }
          .fo-dec__mark { margin-bottom: 0; flex: 0 0 auto; }
          .fo-dec__label { font-size: 17px; }
          .fo-dec__sub { flex: 1 0 100%; padding-left: 42px; }
          .fo-dec__foot { flex-direction: column; align-items: stretch; }
          .fo-dec__foot .fo-btn { width: 100%; justify-content: center; }
          .fo-cm__acts { flex-direction: column-reverse; }
          .fo-cm__acts .fo-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </FmsOfficialShell>
  );
}
