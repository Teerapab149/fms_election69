"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Lock } from "lucide-react";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { getPath } from "../../utils/basePath";
import { evaluationPromptText } from "../../utils/activityHours";

const COPY = {
  blossom: { kicker: "A LITTLE NOTE OF THANKS", title: <>หนึ่งเสียงของคุณ<br />มีความหมายเสมอ</>, next: "เขียนบทต่อไปด้วยกัน" },
  "fms-official": { kicker: "OUR FACULTY. OUR FUTURE.", title: <>ร่วมกำหนดทิศทาง<br />ไปด้วยกัน</>, next: "อีกหนึ่งขั้นตอน" },
  gumroad: { kicker: "YOU SHOWED UP. YOU MADE A MARK.", title: <>ใช้สิทธิ์แล้ว<br />เสียงคุณอยู่ในนี้!</>, next: "ต่ออีกนิด ก็ครบแล้ว" },
  "studio-dark": { kicker: "YOUR VOICE HAS ARRIVED", title: <>Thank you<br />for <em>voting.</em></>, next: "The next chapter." },
  verdure: { kicker: "SMALL VOICES. SHARED GROWTH.", title: <>จากหนึ่งเสียง<br />สู่การเติบโต</>, next: "ดูแลการเติบโตต่ออีกนิด" },
};

// Decorative only. The artwork never receives a voter, party, ballot ID or tally.
export function VoteCompletionMark({ family, quiet = false }) {
  const timing = { duration: quiet ? 0 : .65, ease: [.22, 1, .36, 1] };
  const enter = quiet ? false : { opacity: 0, y: 12, scale: .96 };
  return (
    <motion.svg className="vx-art" viewBox="0 0 280 210" fill="none" aria-hidden="true"
      initial={enter} animate={{ opacity: 1, y: 0, scale: 1 }} transition={timing}>
      {family === "blossom" ? <>
        {/* ซองจดหมายที่พับได้จริง เรียงชั้นตามของจริง:
              หลังซอง → ฝา(พับ) → รอยพับ → จดหมาย → ปากซอง → ดอกไม้
            ของเดิมรวมฝาไว้ใน path เดียวกับหลังซอง จึงไม่มีชิ้นไหนพับได้เลย — วัดบนหน้าเว็บ
            ได้ 10 โหนด ขยับจริงใบเดียวคือจดหมาย ฝาที่แยกออกมาหมุนรอบเส้นพับด้วย scaleY
            -1 → 1 คือการพับที่อ่านออกโดยไม่ต้องใช้ 3D
            ฝาต้องอยู่ "หลัง" จดหมาย ไม่งั้นตอนกางออกมันจะทับหัวจดหมายจนเครื่องหมายถูกหาย
            จดหมายจึงซ่อนด้วย opacity ระหว่างที่ฝายังปิด แล้วค่อยไล่ขึ้นมาเมื่อฝาเปิดพ้น */}
        <path d="M42 87 140 25l98 62v96H42Z" fill="var(--vx-tint)" stroke="var(--vx-accent)" strokeWidth="1.5" />
        <motion.g style={{ originX: "50%", originY: "100%" }}
          initial={quiet ? false : { scaleY: -1 }} animate={{ scaleY: 1 }}
          transition={{ duration: quiet ? 0 : 0.62, ease: [0.22, 1, 0.36, 1], delay: quiet ? 0 : 0.26 }}>
          {/* ⚠️ จุดหมุนต้องส่งเป็น originX/originY ใน style เท่านั้น: framer 12 ประกอบ
              transform-origin จาก latest.originX/originY (ปริยาย 50%/50%) แล้วเขียนทับ
              transformOrigin ที่เราเขียนเองเสมอ — ใส่ผิดที่แล้วฝาพับรอบกึ่งกลางตัวเอง
              (วัดได้ transform-origin:98px 31px แทนที่จะเป็น 98px 62px = กลางเส้นพับ) */}
          <path d="M42 87 140 25l98 62Z" fill="var(--vx-tint)" stroke="var(--vx-accent)" strokeWidth="1.5" strokeLinejoin="round" />
          {/* ด้านในของฝาเป็นคนละสีกับด้านนอก — สลับด้วย opacity เพราะค่า var() interpolate ไม่ได้ */}
          <motion.path d="M42 87 140 25l98 62Z" fill="var(--vx-paper)" stroke="var(--vx-accent)" strokeWidth="1.5" strokeLinejoin="round"
            initial={quiet ? false : { opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: quiet ? 0 : 0.28, delay: quiet ? 0 : 0.52 }} />
        </motion.g>
        <path d="M42 87h196" stroke="var(--vx-accent)" strokeWidth="1.5" opacity=".5" />
        <motion.g initial={quiet ? false : { y: 52, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ y: { duration: quiet ? 0 : 0.7, ease: [0.22, 1, 0.36, 1], delay: quiet ? 0 : 0.5 }, opacity: { duration: quiet ? 0 : 0.18, delay: quiet ? 0 : 0.5 } }}>
          <rect x="64" y="42" width="152" height="125" rx="5" fill="var(--vx-paper)" stroke="var(--vx-line)" />
          <path d="m124 80 11 11 23-25" stroke="var(--vx-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M94 111h92m-76 12h60" stroke="var(--vx-line)" strokeWidth="2" />
        </motion.g>
        <path d="m42 87 98 64 98-64v96H42Z" fill="var(--vx-tint)" stroke="var(--vx-accent)" strokeWidth="1.5" />
        <path d="m42 183 79-61m117 61-79-61" stroke="var(--vx-accent)" opacity=".3" />
        {/* ดอกไม้คือตราปิดผนึก ลงเป็นจังหวะสุดท้ายหลังฝากางสุดและจดหมายขึ้นสุด */}
        <motion.g initial={quiet ? false : { scale: 0.4, opacity: 0, rotate: -28 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: quiet ? 0 : 0.46, ease: [0.34, 1.56, 0.64, 1], delay: quiet ? 0 : 1 }}>
          {[0, 1, 2, 3, 4].map(i => <g key={i} transform={`rotate(${i * 72} 140 146)`}><ellipse cx="140" cy="135" rx="8" ry="14" fill="var(--vx-accent)" /></g>)}
          <circle cx="140" cy="146" r="7" fill="var(--vx-paper)" />
        </motion.g>
      </> : family === "verdure" ? <>
        <ellipse cx="141" cy="188" rx="74" ry="8" fill="var(--vx-accent)" opacity=".1" />
        <path d="M38 183h204M58 193h164" stroke="var(--vx-line)" />
        <motion.path d="M142 183c0-45-7-84 3-140" stroke="var(--vx-accent)" strokeWidth="2" strokeLinecap="round" initial={quiet ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={timing} />
        <motion.g style={{ transformOrigin: "142px 143px" }} initial={quiet ? false : { scale: 0, rotate: 15 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...timing, delay: quiet ? 0 : .15 }}>
          <path d="M140 143C77 151 61 95 66 64c45 1 85 23 74 79Z" fill="var(--vx-tint)" stroke="var(--vx-accent)" strokeWidth="1.5" />
          <path d="M140 143 78 79m27 26-27-2m44 19-4-30" stroke="var(--vx-accent)" opacity=".6" />
        </motion.g>
        <motion.g style={{ transformOrigin: "142px 112px" }} initial={quiet ? false : { scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...timing, delay: quiet ? 0 : .3 }}>
          <path d="M142 112c-5-52 34-74 78-77 3 46-19 82-78 77Z" fill="var(--vx-tint)" stroke="var(--vx-accent)" strokeWidth="1.5" />
          <path d="m142 112 65-64m-43 42 29-2m-10-19-1-17" stroke="var(--vx-accent)" opacity=".6" />
        </motion.g>
        <circle cx="143" cy="184" r="4" fill="var(--vx-accent)" />
      </> : family === "gumroad" ? <>
        <path d="m48 43 194 12-10 136-194-12Z" fill="var(--vx-ink)" />
        <path d="m38 33 194 12-10 136-194-12Z" fill="var(--vx-tint)" stroke="var(--vx-ink)" strokeWidth="3" />
        <path d="m163 22 9-14m19 25 16-5M41 189l-11 9" stroke="var(--vx-ink)" strokeWidth="3" strokeLinecap="round" />
        <text x="62" y="124" fontSize="49" fontWeight="900" fontFamily="inherit" fill="var(--vx-ink)" transform="rotate(4 62 124)">DONE.</text>
        <circle cx="220" cy="157" r="31" fill="var(--vx-paper)" stroke="var(--vx-ink)" strokeWidth="3" />
        <path d="m206 157 10 10 18-23" stroke="var(--vx-ink)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </> : family === "studio-dark" ? <>
        <path d="M40 39v-9h20m160 0h20v9M40 171v9h20m160 0h20v-9" stroke="var(--vx-line)" strokeWidth="2" />
        <path d="M62 150h156M62 160h92" stroke="var(--vx-line)" />
        <motion.path d="m86 99 35 35 72-77" stroke="var(--vx-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={quiet ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={timing} />
        <circle cx="220" cy="160" r="3" fill="var(--vx-accent)" />
      </> : <>
        <circle cx="140" cy="105" r="85" fill="var(--vx-paper)" stroke="var(--vx-line)" />
        <circle cx="140" cy="105" r="72" stroke="var(--vx-accent)" opacity=".35" />
        <path d="M91 123h100l-20 23h-57l-23-23Zm50-63v62m-7-51-34 42h34V71Zm15-12v54h37l-37-54Z" fill="var(--vx-tint)" stroke="var(--vx-accent)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M99 154c10-5 20 5 30 0s20 5 30 0 20 5 29 0" stroke="var(--vx-accent)" strokeWidth="1.5" />
        <motion.g initial={quiet ? false : { scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ transformOrigin: "208px 161px" }} transition={{ ...timing, delay: quiet ? 0 : .15 }}>
          <circle cx="208" cy="161" r="22" fill="var(--vx-accent)" />
          <path d="m199 161 6 6 13-14" stroke="var(--vx-paper)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      </>}
    </motion.svg>
  );
}

export default function VoteSuccessExperience({ family, user, isUnlocked = false, onOpenForm = () => {}, editorMode = false, children }) {
  const gc = useGlobalConfig() || {};
  const reduce = useReducedMotion();
  const copy = COPY[family] || COPY["fms-official"];
  const when = user?.votedAt ? new Date(user.votedAt) : null;
  const recorded = when && !Number.isNaN(when.getTime()) ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(when) : null;
  return (
    <div className={`vx-success vx-${family}`} data-success-family={family}>
      <div className="vx-edition"><span>{gc.electionNamePrefix || "SAMO"} {gc.electionNumber ?? ""}</span><span><Check size={14} aria-hidden="true" /> บันทึกการลงคะแนนแล้ว</span></div>
      {/* DOM order IS the phone order: confirmation → the one thing left to do →
          artwork → identity. The desktop composition is rebuilt from it by explicit
          grid placement below, so neither reading gets a compromise layout. Putting
          the artwork and the identity block ahead of the actions (as the first cut
          did) cost 300-400px above the CTA, and with a family shell on top of that
          the "เปิดแบบประเมิน" button started below the fold on every phone. */}
      <div className="vx-composition">
        <section className="vx-story">
          <p className="vx-kicker">{copy.kicker}</p>
          <h1>{copy.title}</h1>
          <p className="vx-deck">ขอบคุณที่ร่วมเป็นส่วนหนึ่งของ{gc.organizationName || "สโมสรนักศึกษา คณะวิทยาการจัดการ"}</p>
        </section>
        <section className="vx-next">
          <div className="vx-next-copy"><span className="vx-label">{isUnlocked ? "COMPLETE" : "NEXT STEP"}</span><h2>{isUnlocked ? "ครบทุกขั้นตอนแล้ว" : copy.next}</h2><p>{isUnlocked ? "ส่งแบบประเมินเรียบร้อยแล้ว ไปยังหน้าผลคะแนนได้เมื่อพร้อม" : evaluationPromptText(gc)}</p></div>
          <div className="vx-actions">
            {isUnlocked ? <><div className="vx-done"><Check size={16} aria-hidden="true" /> ทำแบบประเมินแล้ว</div><a className="vx-button vx-primary" href={editorMode ? undefined : getPath("/results")}>ไปหน้าผลคะแนน <ArrowRight size={17} aria-hidden="true" /></a></> : <><button type="button" className="vx-button vx-primary" onClick={() => !editorMode && onOpenForm()}>เปิดแบบประเมิน <ArrowRight size={17} aria-hidden="true" /></button><span className="vx-lock"><Lock size={13} aria-hidden="true" /> ทำแบบประเมินก่อนดูผลคะแนน</span></>}
            <a className="vx-button vx-home" href={editorMode ? undefined : getPath("/")}>กลับหน้าแรก</a>
          </div>
        </section>
        <div className="vx-illustration"><VoteCompletionMark family={family} quiet={Boolean(reduce || editorMode)} /><span className="vx-art-caption">{family === "gumroad" ? "ONE PERSON. ONE VOICE." : family === "verdure" ? "GROWING, TOGETHER" : "YOUR VOICE MATTERS"}</span></div>
        <div className="vx-person">
          <span className="vx-label">ผู้ใช้สิทธิ์</span>
          {user?.name && <strong>{user.name}</strong>}
          {user?.studentId && <span>{user.studentId}</span>}
          {recorded && <span className="vx-date">{recorded}</span>}
        </div>
      </div>
      <div className="vx-privacy"><span className="vx-privacy-mark" aria-hidden="true">✓</span><p>หน้านี้ยืนยันการใช้สิทธิ์เท่านั้น ไม่แสดงพรรคหรือตัวเลือกที่คุณลงคะแนน</p></div>
      {children}
      <style jsx global>{`
        .vx-success { --vx-ink:var(--fo-ink,#34283a); --vx-muted:var(--fo-muted,#6b626e); --vx-paper:var(--fo-surface,#fffdf9); --vx-accent:var(--fo-brand,#8a2680); --vx-tint:var(--fo-tint,#f1e8ef); --vx-line:var(--fo-line,#ded6df); width:100%; max-width:1100px; margin:0 auto; padding:28px clamp(20px,4vw,52px) 40px; color:var(--vx-ink); }
        .vx-success * { box-sizing:border-box; }
        .vx-blossom { --vx-ink:var(--bl-ink); --vx-muted:var(--bl-ink2); --vx-paper:var(--bl-card); --vx-accent:var(--bl-primary-ink); --vx-tint:var(--bl-primary-soft); --vx-line:var(--bl-line); }
        .vx-gumroad { --vx-ink:var(--ink); --vx-muted:var(--ink2); --vx-paper:var(--paper); --vx-accent:var(--ink); --vx-tint:var(--pink); --vx-line:var(--ink); }
        .vx-studio-dark { --vx-ink:var(--sd-ink); --vx-muted:var(--sd-ink-2); --vx-paper:var(--sd-bg-2); --vx-accent:var(--sd-accent); --vx-tint:var(--sd-bg-3); --vx-line:var(--sd-line-strong); }
        .vx-verdure { --vx-ink:var(--cream); --vx-muted:var(--cream); --vx-paper:var(--moss); --vx-accent:var(--terra-soft); --vx-tint:var(--moss-2); --vx-line:var(--rule-moss); }
        .vx-edition { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; border-bottom:1px solid var(--vx-line); padding-bottom:16px; font-size:11px; letter-spacing:.08em; }
        .vx-edition span:last-child { display:flex; align-items:center; gap:7px; letter-spacing:0; }
        /* Desktop is REBUILT from the phone's DOM order, not authored in it: story
           and identity stack down the left column, the artwork spans both on the
           right, the action strip runs full width underneath. Row gap is 0 and the
           spacing lives on each block's own margin so the rebuild lands on the same
           pixels the single-column-plus-footer version did. */
        .vx-composition { display:grid; grid-template-columns:1.2fr .8fr; align-items:start; column-gap:48px; row-gap:0; padding-top:36px; }
        .vx-story { min-width:0; grid-column:1; grid-row:1; }
        .vx-person { grid-column:1; grid-row:2; }
        .vx-illustration { grid-column:2; grid-row:1/span 2; align-self:center; }
        .vx-next { grid-column:1/-1; grid-row:3; margin-top:32px; }
        .vx-kicker { font-size:10px; letter-spacing:.16em; color:var(--vx-accent); margin:0 0 20px; font-weight:600; }
        .vx-story h1 { margin:0; font-size:clamp(30px,4vw,54px); line-height:1.35; font-weight:600; letter-spacing:-.025em; }
        .vx-deck { margin:18px 0 0; max-width:480px; color:var(--vx-muted); font-size:14px; line-height:1.8; }
        .vx-person { display:flex; flex-wrap:wrap; align-items:baseline; gap:6px 12px; margin-top:25px; font-size:13px; overflow-wrap:anywhere; }
        .vx-person strong { font-size:15px; font-weight:600; }
        .vx-label { display:block; font-size:10px; letter-spacing:.1em; color:var(--vx-muted); }
        .vx-person .vx-label,.vx-date { width:100%; }
        .vx-date { color:var(--vx-muted); font-size:12px; }
        .vx-illustration { min-width:0; text-align:center; }
        .vx-art { display:block; width:100%; max-width:330px; height:auto; margin:0 auto; }
        .vx-art-caption { display:block; font-size:9px; letter-spacing:.2em; margin-top:12px; color:var(--vx-muted); }
        .vx-next { border-top:1px solid var(--vx-line); display:grid; grid-template-columns:1fr minmax(240px,.7fr); gap:32px; padding-top:26px; align-items:center; }
        .vx-next h2 { font-size:22px; font-weight:600; line-height:1.5; margin:8px 0; }
        .vx-next p { font-size:13px; line-height:1.8; color:var(--vx-muted); max-width:430px; margin:0; }
        .vx-actions { display:flex; flex-direction:column; gap:10px; }
        .vx-success .vx-button { display:flex; align-items:center; justify-content:center; gap:12px; min-height:48px; padding:12px 16px; font-size:14px; font-weight:600; text-decoration:none; border-radius:6px; line-height:1.6; text-align:center; cursor:pointer; transition:transform .18s,opacity .18s; }
        /* .vx-button.vx-* — TWO classes on the target on purpose. The primary action
           is a <button> when the form is still to do and an <a> once it is done, and
           every family shell carries a blanket link rule; verdure's
           .vd-root a:not(.vd-btn){color:inherit} is (0,2,1) and beat the old
           single-class .vx-verdure .vx-primary (0,2,0), so the <a> inherited
           --vx-ink (= --cream) onto a cream pill and the finished state's button
           read as an empty capsule. Keep both classes in the selector for anything
           that paints the button, family overrides included. */
        .vx-success .vx-button.vx-primary { color:var(--vx-paper); background:var(--vx-ink); border:1px solid var(--vx-ink); }
        .vx-success .vx-button.vx-home { color:var(--vx-ink); border:1px solid var(--vx-line); background:transparent; }
        .vx-button svg { flex:none; }
        .vx-button:hover { opacity:.82; }
        .vx-button:active { transform:translateY(1px); }
        .vx-button:focus-visible { outline:2px solid var(--vx-accent); outline-offset:4px; }
        .vx-lock,.vx-done { display:flex; justify-content:center; align-items:center; gap:6px; font-size:11px; color:var(--vx-muted); line-height:1.7; }
        .vx-privacy { display:flex; align-items:flex-start; gap:10px; border-top:1px solid var(--vx-line); padding-top:18px; margin-top:26px; font-size:11px; color:var(--vx-muted); line-height:1.8; }
        .vx-privacy p { margin:0; }
        .vx-privacy-mark { color:var(--vx-accent); }
        .vx-blossom .vx-illustration { padding:12px; transform:rotate(-3deg); }
        .vx-blossom .vx-next { border:1px solid var(--vx-line); background:var(--vx-paper); padding:24px; border-radius:18px; }
        .vx-blossom .vx-button.vx-primary { border-radius:100px; background:var(--bl-primary-deep); color:var(--bl-on-primary); border-color:transparent; }
        .vx-fms-official .vx-illustration { border-left:1px solid var(--vx-line); }
        .vx-gumroad .vx-edition { border-bottom:2px solid var(--vx-ink); }
        .vx-gumroad .vx-story h1 { font-weight:800; }
        .vx-gumroad .vx-next { border:2px solid var(--vx-ink); background:var(--vx-paper); padding:24px; box-shadow:5px 5px 0 var(--vx-ink); }
        .vx-gumroad .vx-button.vx-primary { border-radius:2px; background:var(--lime); color:var(--ink); border:2px solid var(--ink); box-shadow:3px 3px 0 var(--ink); }
        .vx-studio-dark .vx-story h1 { font-size:clamp(46px,5.8vw,84px); line-height:1.05; font-weight:400; }
        .vx-studio-dark .vx-story h1 em { font-family:var(--sd-serif); color:var(--vx-accent); font-weight:400; }
        .vx-studio-dark .vx-button.vx-primary { background:var(--sd-accent); color:var(--sd-bg); border-color:transparent; border-radius:100px; }
        .vx-verdure { padding-top:110px; padding-bottom:100px; }
        .vx-verdure .vx-illustration { grid-column:1; grid-row:1/span 2; }
        .vx-verdure .vx-story { grid-column:2; grid-row:1; }
        .vx-verdure .vx-person { grid-column:2; grid-row:2; }
        .vx-verdure .vx-composition { grid-template-columns:.9fr 1.1fr; }
        .vx-verdure .vx-story h1 { font-family:var(--fd); font-weight:400; }
        .vx-verdure .vx-next { padding-top:30px; }
        .vx-verdure .vx-button.vx-primary { color:var(--moss); background:var(--cream); border-color:var(--cream); border-radius:100px; }
        /* PHONE — one column, straight down the DOM order, so the action strip lands
           right under the headline. Every family carries its own chrome above this
           component (fms-official 171px, studio-dark 201px measured at 390px wide),
           which is why the strip also gets compacted here: the section label and the
           standalone lock line go away, the heading drops to 19px, and the reason
           moves BELOW the button as fine print. display:contents on the copy
           wrapper lifts its children into this flex column so they can be ordered
           around the buttons without a second DOM shape. */
        @media(max-width:700px) {
          .vx-success { padding-top:20px; }
          .vx-verdure { padding-top:110px; }
          .vx-composition,.vx-verdure .vx-composition { grid-template-columns:1fr; gap:0; padding-top:24px; }
          .vx-composition > *,.vx-verdure .vx-composition > * { grid-column:1; grid-row:auto; }
          .vx-art { max-width:185px; }
          .vx-art-caption { margin-top:0; }
          .vx-fms-official .vx-illustration { border:0; }
          .vx-kicker { margin-bottom:12px; font-size:9px; }
          /* align-items:center is the desktop two-column rule; left as-is it centres
             the heading and shrink-wraps the buttons once this becomes a column. */
          .vx-next { display:flex; flex-direction:column; align-items:stretch; gap:0; margin-top:24px; padding-top:22px; }
          .vx-verdure .vx-next { padding-top:22px; }
          .vx-next-copy { display:contents; }
          .vx-next .vx-next-copy .vx-label { display:none; }
          .vx-next h2 { order:1; margin:0; font-size:19px; line-height:1.6; }
          .vx-actions { order:2; margin-top:14px; }
          .vx-next p { order:3; margin-top:14px; font-size:12px; line-height:1.75; max-width:none; }
          .vx-lock { display:none; }
          .vx-illustration { margin-top:30px; }
          .vx-blossom .vx-next,.vx-gumroad .vx-next { padding:20px; }
          .vx-person { margin-top:26px; }
          /* CENTRED on phones. The two-column desktop composition reads left-aligned
             because the text has a facing column to align against; stacked into one
             narrow column that same ragged-right edge just looks like the layout
             collapsed. The masthead rule keeps its left/right ends — it is a header,
             not body copy. */
          .vx-success { text-align:center; }
          .vx-deck,.vx-next p { margin-left:auto; margin-right:auto; }
          .vx-person { justify-content:center; }
          .vx-privacy { justify-content:center; text-align:center; }
          .vx-privacy p { max-width:34ch; }
        }
        @media(prefers-reduced-motion:reduce) { .vx-success .vx-button { transition:none; } }
      `}</style>
    </div>
  );
}
