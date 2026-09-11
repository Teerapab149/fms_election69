"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Lock, ShieldCheck } from "lucide-react";
import { getPath } from "../../utils/basePath";
import { evaluationPromptText } from "../../utils/activityHours";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

// The completion seal. Original is the family the other six were built next to, and
// it was the only one whose success page had no artwork of its own — a lucide tick
// in a hairline circle, which read as a default component rather than as this
// election. So it gets a piece: the ballot dropping into the box, the box lit by
// the brand ramp, the tick struck over it. Decorative only — it is never told which
// party, and there is nothing here to leak.
function CompletionSeal({ quiet = false }) {
  const ease = [0.22, 1, 0.36, 1];
  const enter = (from) => (quiet ? false : from);
  return (
    <motion.svg className="os-seal" viewBox="0 0 232 186" fill="none" aria-hidden
      initial={enter({ opacity: 0, y: 10 })} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
      <defs>
        <linearGradient id="osSealBrand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--os-deep)" />
          <stop offset="58%" stopColor="var(--os-brand)" />
          <stop offset="100%" stopColor="var(--os-bright)" />
        </linearGradient>
        <linearGradient id="osSealLid" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--os-deep)" />
          <stop offset="100%" stopColor="var(--os-brand)" />
        </linearGradient>
      </defs>

      {/* halo — kept faint; it frames the drop, it should not become the subject */}
      <motion.circle cx="104" cy="92" r="84" fill="var(--os-soft)" opacity=".7"
        initial={enter({ scale: 0.7, opacity: 0 })} animate={{ scale: 1, opacity: .7 }}
        style={{ transformOrigin: "104px 92px" }} transition={{ duration: 0.55, ease }} />

      {/* the ballot, mid-drop — it runs BEHIND the lid below, which is what sells
          "going in" rather than "resting on top of" */}
      <motion.g initial={enter({ y: -30, rotate: -9, opacity: 0 })} animate={{ y: 0, rotate: -5, opacity: 1 }}
        style={{ transformOrigin: "96px 60px" }} transition={{ duration: 0.55, ease, delay: quiet ? 0 : 0.08 }}>
        <rect x="58" y="16" width="84" height="88" rx="7" fill="var(--os-surface)" stroke="var(--os-line)" strokeWidth="1.5" />
        <path d="M72 36h38M72 50h56M72 64h30" stroke="var(--os-line)" strokeWidth="3.5" strokeLinecap="round" />
        <rect x="100" y="62" width="30" height="30" rx="6" fill="var(--os-soft)" />
        <path d="m108 77 6 6 11-13" stroke="var(--os-brand)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>

      {/* the box: lid with the slot cut into it, then the front face */}
      <rect x="18" y="96" width="164" height="20" rx="7" fill="url(#osSealLid)" />
      <rect x="78" y="102" width="44" height="8" rx="4" fill="var(--os-deep)" />
      <path d="M28 116h144a10 10 0 0 1 10 10v34a10 10 0 0 1-10 10H28a10 10 0 0 1-10-10v-34a10 10 0 0 1 10-10Z" fill="url(#osSealBrand)" />
      <path d="M40 150h44" stroke="var(--os-surface)" opacity=".5" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M40 136h70" stroke="var(--os-surface)" opacity=".24" strokeWidth="3.5" strokeLinecap="round" />

      {/* the tick, struck over the corner of the box */}
      <motion.g initial={enter({ scale: 0.5, opacity: 0 })} animate={{ scale: 1, opacity: 1 }}
        style={{ transformOrigin: "184px 140px" }} transition={{ duration: 0.45, ease, delay: quiet ? 0 : 0.3 }}>
        <circle cx="184" cy="140" r="34" fill="var(--os-surface)" />
        <circle cx="184" cy="140" r="27" fill="url(#osSealBrand)" />
        <motion.path d="m172 140 9 9 15-18" stroke="var(--os-surface)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
          initial={enter({ pathLength: 0 })} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease, delay: quiet ? 0 : 0.42 }} />
      </motion.g>
    </motion.svg>
  );
}

// Presentation only: the parent verifies participation and owns form completion.
export default function OriginalSuccess({ user = null, isUnlocked = false, onOpenForm = () => {}, editorMode = false, showMessage = true, showActions = true }) {
  const gc = useGlobalConfig() || {};
  const reduce = useReducedMotion();
  const quiet = Boolean(reduce || editorMode);
  const name = user?.name || (editorMode ? "นักศึกษาตัวอย่าง" : "");
  const sid = user?.studentId || (editorMode ? "DEMO-0001" : "");
  return (
    <main className="fms-app os-success relative isolate overflow-hidden">
      {/* Ambient wash + grid, the same two moves the family's home opens with, so the
          end of the flow is recognisably the same product as the start. */}
      <div className="os-ambient" aria-hidden />
      <div className="os-grid" aria-hidden />

      <div className="relative mx-auto w-full max-w-5xl px-5 py-6 md:px-10 md:py-14">
        <div className="os-edition flex flex-wrap items-center justify-between gap-3">
          <span className="os-chip">{gc.electionNamePrefix || "SAMO"} {gc.electionNumber ?? ""} · PARTICIPATION</span>
          <span className="os-stamp"><Check size={14} aria-hidden /> ใช้สิทธิ์แล้ว</span>
        </div>

        {/* Phone reads straight down the DOM: confirmation → what to do next → who
            voted. The two-column desktop composition is put back by the md: placement
            classes — the message spans both rows on the left, the action card and the
            identity block stack down the right. Authored the other way round, the
            identity block alone pushed "เปิดแบบประเมิน" past the fold on a phone. */}
        <div className="grid gap-7 pt-6 md:grid-cols-[1.06fr_1fr] md:gap-x-14 md:gap-y-0 md:pt-12">
          {showMessage && <section className="min-w-0 md:col-start-1 md:row-start-1 md:row-span-2 md:self-center">
            <CompletionSeal quiet={quiet} />
            <h1 className="os-h1">เสียงของคุณ<br /><span className="os-grad">เป็นส่วนหนึ่งแล้ว</span></h1>
            <p className="os-muted os-deck mt-4 max-w-md">บันทึกการลงคะแนนเรียบร้อย<br />ขอบคุณที่ร่วมกำหนดทิศทางของ{gc.organizationName || "สโมสรนักศึกษา"}</p>
          </section>}

          {showActions && <section className="os-next min-w-0 self-start md:col-start-2 md:row-start-1">
            <span className="os-eyebrow">WHAT’S NEXT</span>
            <h2 className="os-h2">{isUnlocked ? "ครบทุกขั้นตอนแล้ว" : "อีกนิด เพื่อรับชั่วโมงกิจกรรม"}</h2>
            <p className="os-note">{isUnlocked ? "ส่งแบบประเมินเรียบร้อย คุณสามารถไปยังหน้าผลคะแนนได้แล้ว" : evaluationPromptText(gc)}</p>
            <div className="os-stack">
              {isUnlocked ? <><span className="os-done"><Check size={17} aria-hidden /> ส่งแบบประเมินแล้ว</span><a className="os-action os-primary" href={editorMode ? undefined : getPath("/results")}>ดูผลคะแนน <ArrowRight size={18} aria-hidden /></a></> : <><button type="button" className="os-action os-primary" onClick={() => !editorMode && onOpenForm()}>เปิดแบบประเมิน <ArrowRight size={18} aria-hidden /></button><button type="button" disabled className="os-action os-locked"><Lock size={16} aria-hidden /> ทำแบบประเมินก่อนดูผลคะแนน</button></>}
              <a className="os-action os-home" href={editorMode ? undefined : getPath("/")}>กลับหน้าแรก</a>
            </div>
          </section>}

          {showMessage && <section className="os-identity min-w-0 md:col-start-2 md:row-start-2 md:mt-7">
            <p className="os-eyebrow os-eyebrow--ink">ผู้ใช้สิทธิ์</p>
            {name && <p className="m-0 break-words text-lg font-bold">{name}</p>}
            {sid && <p className="os-sid">{sid}</p>}
            <p className="os-privacy"><ShieldCheck size={14} aria-hidden /> <span>หน้านี้ยืนยันการใช้สิทธิ์เท่านั้น ไม่แสดงพรรคหรือตัวเลือกที่คุณลงคะแนน</span></p>
          </section>}
        </div>
      </div>

      <style jsx global>{`
        /* Derived from the Layer-1 tokens, not from the --o-* ramp: this layout is
           also what modern-dark / playful / minimal fall through to, and those carry
           their own --color-* palette. color-mix gives the ramp the family look wants
           (deep / soft / line) from the three tokens every template actually sets. */
        .os-success {
          --os-brand:var(--color-primary,#8a2680);
          --os-bright:var(--color-accent,#c026d3);
          --os-surface:var(--color-surface,#ffffff);
          --os-deep:color-mix(in srgb, var(--color-primary,#8a2680) 74%, #120a13);
          --os-soft:color-mix(in srgb, var(--color-primary,#8a2680) 7%, var(--color-surface,#fff));
          --os-line:color-mix(in srgb, var(--color-primary,#8a2680) 20%, var(--color-surface,#fff));
          color:var(--color-text,#29232e); font-family:inherit;
          /* flex:1 is a no-op unless the parent is the flex column app/success/page.js
             wraps this family in — there it makes the page fill under the navbar and
             centre, instead of ending in a band of empty ground. */
          flex:1 1 auto; display:flex; flex-direction:column; justify-content:center; min-height:520px;
        }
        .os-success * { box-sizing:border-box; }
        .os-success .os-muted { color:var(--color-text-muted,#655e6c); }

        /* Kept deliberately faint. The family's home runs these blobs across a whole
           scrolling page; at the same strength inside one short screen they wash the
           entire surface pink and the near-white ground the family is built on
           disappears. The mask fades the wash out before the element ends so there is
           no hard edge where this main stops and the page background continues. */
        .os-ambient { position:absolute; inset:0; z-index:-1; background:var(--color-bg,#f8f9fd); overflow:hidden;
          -webkit-mask-image:linear-gradient(#000 55%, transparent 100%); mask-image:linear-gradient(#000 55%, transparent 100%); }
        .os-ambient::before, .os-ambient::after { content:""; position:absolute; border-radius:50%; filter:blur(90px); }
        .os-ambient::before { top:-20%; right:-10%; width:38%; height:46%;
          background:linear-gradient(135deg, color-mix(in srgb, var(--os-brand) 13%, transparent), color-mix(in srgb, var(--os-bright) 9%, transparent)); }
        .os-ambient::after { top:24%; left:-12%; width:32%; height:40%;
          background:linear-gradient(45deg, color-mix(in srgb, var(--os-bright) 9%, transparent), color-mix(in srgb, var(--os-brand) 8%, transparent)); }
        .os-grid { position:absolute; inset:0; z-index:-1; pointer-events:none; opacity:.5;
          background-image:linear-gradient(to right, color-mix(in srgb, var(--color-text,#29232e) 6%, transparent) 1px, transparent 1px),
                           linear-gradient(to bottom, color-mix(in srgb, var(--color-text,#29232e) 6%, transparent) 1px, transparent 1px);
          background-size:60px 60px;
          -webkit-mask-image:radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 78%);
          mask-image:radial-gradient(120% 90% at 50% 0%, #000 30%, transparent 78%); }

        .os-edition { border-bottom:1px solid var(--os-line); padding-bottom:16px; }
        .os-chip { display:inline-flex; align-items:center; border-radius:8px; padding:5px 12px; font-size:11px; font-weight:700;
          letter-spacing:.06em; color:var(--os-brand); background:var(--os-soft); border:1px solid var(--os-line); }
        .os-stamp { display:inline-flex; align-items:center; gap:7px; font-size:12px; font-weight:600; color:var(--os-brand); }

        .os-seal { display:block; width:100%; max-width:236px; height:auto; margin:0 0 24px; }
        .os-h1 { margin:0; font-size:clamp(30px,4.4vw,50px); font-weight:800; line-height:1.32; letter-spacing:-.02em; }
        .os-deck { font-size:15px; line-height:1.9; }
        .os-grad { background:linear-gradient(100deg, var(--os-brand), var(--os-bright));
          -webkit-background-clip:text; background-clip:text; color:transparent; }

        /* The action card is the family's gradient hero panel, not a bordered box —
           it is the only thing on this page the voter still has to do, so it is the
           only thing that gets to be loud. */
        .os-success .os-next { position:relative; overflow:hidden; border-radius:24px; padding:26px;
          background-color:var(--os-brand);
          background-image:linear-gradient(140deg, var(--os-deep) 0%, var(--os-brand) 52%, var(--os-bright) 100%);
          color:#fff; box-shadow:0 22px 44px -22px color-mix(in srgb, var(--os-deep) 62%, transparent); }
        .os-success .os-next::after { content:""; position:absolute; top:-46%; right:-22%; width:66%; height:120%;
          border-radius:50%; background:rgba(255,255,255,.09); pointer-events:none; }
        .os-eyebrow { display:block; font-size:10.5px; font-weight:700; letter-spacing:.16em; color:rgba(255,255,255,.72); }
        .os-eyebrow--ink { color:var(--color-text-muted,#655e6c); }
        .os-h2 { margin:12px 0 0; font-size:23px; font-weight:800; line-height:1.5; }
        .os-note { margin:10px 0 0; font-size:13px; line-height:1.85; color:rgba(255,255,255,.8); }
        .os-stack { position:relative; margin-top:22px; display:flex; flex-direction:column; gap:10px; }

        .os-success .os-action { display:flex; align-items:center; justify-content:center; gap:10px; min-height:48px;
          padding:12px 16px; border-radius:12px; font-size:14px; font-weight:700; text-align:center; line-height:1.6;
          transition:transform .18s, background .18s, box-shadow .18s; }
        .os-success .os-action svg { flex:none; }
        .os-success .os-action.os-primary { background:#fff; color:var(--os-deep); box-shadow:0 8px 18px -10px rgba(0,0,0,.55); }
        .os-success .os-action.os-primary:hover { transform:translateY(-1px); box-shadow:0 12px 22px -10px rgba(0,0,0,.55); }
        .os-success .os-action.os-home { border:1px solid rgba(255,255,255,.42); color:#fff; background:rgba(255,255,255,.08); }
        .os-success .os-action.os-home:hover { background:rgba(255,255,255,.18); }
        .os-success .os-action.os-locked { color:rgba(255,255,255,.78); background:rgba(255,255,255,.1);
          border:1px dashed rgba(255,255,255,.3); font-weight:600; cursor:not-allowed; }
        .os-success .os-action:active:not(:disabled) { transform:translateY(1px); }
        .os-success .os-done { display:flex; min-height:44px; align-items:center; gap:8px; font-size:14px; font-weight:600; color:#fff; }

        .os-identity { border-radius:20px; padding:20px 22px; background:var(--color-surface,#fff);
          border:1px solid var(--os-line); box-shadow:0 12px 28px -24px color-mix(in srgb, var(--os-deep) 55%, transparent); }
        .os-sid { margin:4px 0 0; font-size:14px; word-break:break-all; color:var(--color-text-muted,#655e6c); }
        .os-privacy { display:flex; align-items:flex-start; gap:8px; margin:16px 0 0; padding-top:14px;
          border-top:1px solid var(--os-line); font-size:12px; line-height:1.8; color:var(--color-text-muted,#655e6c); }
        .os-privacy svg { flex:none; margin-top:3px; color:var(--os-brand); }

        .os-success a:focus-visible,.os-success button:focus-visible { outline:2px solid var(--os-bright); outline-offset:3px; }

        /* PHONE — the card is the first thing under the headline, so it leads with the
           heading and the button. The eyebrow goes, and the reason drops below the
           button as fine print; ordering the children of the existing card beats a
           second DOM shape. Two classes on the h2/stack selectors so these beat the
           element rules above at the same source order. */
        @media (max-width:767px) {
          .os-success .os-seal { max-width:158px; margin-bottom:14px; }
          .os-success .os-h1 { font-size:27px; line-height:1.34; }
          .os-success .os-deck { margin-top:12px; font-size:13.5px; line-height:1.8; }
          .os-success .os-next { display:flex; flex-direction:column; padding:22px; }
          .os-success .os-next > .os-eyebrow { display:none; }
          .os-success .os-next > .os-h2 { order:1; margin-top:0; font-size:19px; }
          .os-success .os-next > .os-stack { order:2; margin-top:16px; }
          /* the done line is a status, not a control — it does not need tap height */
          .os-success .os-done { min-height:0; margin-bottom:2px; font-size:13px; }
          .os-success .os-next > .os-note { order:3; margin-top:16px; font-size:12px; }
          /* CENTRED on phones — same reason as the shared experience: the ragged
             right edge only works while there is a facing column to align against. */
          .os-success { text-align:center; }
          .os-success .os-seal { margin-left:auto; margin-right:auto; }
          .os-success .os-deck,.os-success .os-next > .os-note { margin-left:auto; margin-right:auto; }
          .os-success .os-privacy { justify-content:center; text-align:center; }
          .os-success .os-next { align-items:center; }
          .os-success .os-next > .os-stack { align-self:stretch; }
          .os-success .os-done { justify-content:center; }
        }
        @media (prefers-reduced-motion:reduce) {
          .os-success .os-action { transition:none; }
          .os-success .os-action.os-primary:hover { transform:none; }
        }
      `}</style>
    </main>
  );
}
