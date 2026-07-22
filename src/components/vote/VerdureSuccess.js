"use client";

// VerdureSuccess — POST-VOTE SUCCESS for the Verdure template. Faithful to
// docs/design-refs/verdure.css §success: a MOSS screen, a centred seal ornament
// (arched SVG text around a terracotta check disc, with spinning dashed rings),
// the serif headline, and a receipt card (BALLOT No. / RECORDED AT / VOTER ID /
// SECURED BY) with the evaluation + results + home actions. Pure presentation;
// success/page.js owns auth + the shared form modal. All digits Arabic.

import { getPath } from "../../utils/basePath";
import { motion } from "framer-motion";
import { Check, Lock, BarChart3 } from "lucide-react";
import VerdureShell from "./VerdureShell";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { verdureMeta } from "../home/VerdureChrome";

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export default function VerdureSuccess({ user = null, isUnlocked = false, onOpenForm = () => {}, editorMode = false }) {
  const gc = useGlobalConfig();
  const meta = verdureMeta(gc);
  const sid = user?.studentId || (editorMode ? "6610510149" : "—");
  // RECORDED AT must be the moment the ballot was cast (User.votedAt), read in
  // Asia/Bangkok per ADM-2 — it used `new Date()`, so re-opening this page the next
  // day stamped the receipt with the day it was viewed. Falls back to now only in
  // the editor preview, where there is no real vote.
  const stampSource = user?.votedAt ? new Date(user.votedAt) : (editorMode ? new Date() : null);
  const recordedAt = (() => {
    if (!stampSource || isNaN(stampSource.getTime())) return null;
    const p = {};
    for (const part of new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(stampSource)) p[part.type] = part.value;
    return `${Number(p.day)} ${TH_MONTHS[Number(p.month) - 1]} ${Number(p.year) + 543}`; // Arabic digits
  })();
  const ballotNo = `${meta.faculty}-${meta.cy}-${String(sid).slice(-4).padStart(4, "0")}`;

  return (
    <VerdureShell active="success" moss editorMode={editorMode}
      edge={{ num: "★", label: "Receipt", th: "บันทึกสำเร็จ", right: true }}
      cornermarkTitle="Receipt" cornermarkSub="Ballot recorded"
      statusChip={<div className="vd-chip-live"><span className="dot" /> <strong>CONFIRMED</strong></div>}>
      <div className="vd-success">
        <div className="vd-orn">
          <motion.span className="vd-orn__ring" animate={{ rotate: 360 }} transition={{ duration: 40, ease: "linear", repeat: Infinity }} />
          <span className="vd-orn__ring vd-orn__ring--2" />
          <svg className="vd-orn__arch" viewBox="0 0 360 360">
            <defs>
              <path id="vdArchTop" d="M 30 180 A 150 150 0 0 1 330 180" />
              <path id="vdArchBot" d="M 30 180 A 150 150 0 0 0 330 180" />
            </defs>
            <text><textPath href="#vdArchTop" startOffset="50%" textAnchor="middle">★ BALLOT RECORDED · <tspan className="vd-thai">บันทึกแล้ว</tspan> ★</textPath></text>
            <text><textPath href="#vdArchBot" startOffset="50%" textAnchor="middle">{meta.faculty} · {meta.prefix} · {meta.num} · {meta.cy} · CONFIRMED</textPath></text>
          </svg>
          <div className="vd-orn__disc"><Check size={52} strokeWidth={2.5} /></div>
        </div>

        <div className="vd-success__head">
          <div className="kicker">★ THANK YOU FOR VOTING ★</div>
          <h1>ขอบคุณที่<br /><em>ลงคะแนน</em></h1>
          <div className="vd-success__accent" aria-hidden />
          <p>บันทึกคะแนนของคุณเรียบร้อยแล้ว — ขอบคุณที่ร่วมเป็นส่วนหนึ่งของการขับเคลื่อนกิจกรรมนักศึกษา {meta.org}</p>
        </div>

        <div className="vd-receipt">
          <div className="vd-receipt__h"><span><span className="vd-nw">RECEIPT</span> · <span className="vd-thai">ใบรับรอง</span></span><span><span className="ac">●</span> CONFIRMED</span></div>
          <div className="vd-receipt__row"><span className="lbl">BALLOT No.</span><span className="val"><span className="ac">{ballotNo}</span></span></div>
          {recordedAt && (
            <div className="vd-receipt__row"><span className="lbl">RECORDED AT</span><span className="val">{recordedAt}</span></div>
          )}
          <div className="vd-receipt__row"><span className="lbl">VOTER ID</span><span className="val">No. {sid}</span></div>
          <div className="vd-receipt__row"><span className="lbl">SECURED BY</span><span className="val">PSU Passport</span></div>
          <div className="vd-receipt__cta">
            {isUnlocked && !editorMode ? (
              <div className="vd-receipt__done"><Check size={16} strokeWidth={3} /> ส่งแบบประเมินเรียบร้อยแล้ว</div>
            ) : (
              <button type="button" className="vd-btn vd-btn--terra vd-btn--block" onClick={() => !editorMode && onOpenForm()}>เปิดแบบประเมิน (รับชั่วโมงกิจกรรม) <span className="arr">↗</span></button>
            )}
            <a href={(isUnlocked || editorMode) ? getPath("/results") : undefined}
              className={`vd-btn vd-btn--ghost vd-btn--block ${(isUnlocked || editorMode) ? "" : "is-disabled"}`} aria-disabled={!isUnlocked && !editorMode}>
              {(isUnlocked || editorMode) ? <>ดูผลคะแนน · Results <BarChart3 size={15} /></> : <><Lock size={14} /> ล็อค — ทำแบบประเมินก่อน</>}
            </a>
            <a href={editorMode ? undefined : getPath("/")} className="vd-btn vd-btn--ghost vd-btn--block">← กลับหน้าหลัก</a>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .vd-success { flex:1; display:grid; place-items:center; padding:110px 24px 150px; position:relative; z-index:1; }
        .vd-orn { position:relative; width:360px; height:360px; margin:0 auto 44px; display:grid; place-items:center; }
        /* the seal is the focal point of the page, but a dark plum disc on dark moss
           separates at 1.4:1 - it read as a dim shape. A 3px light-accent ring plus a
           lift shadow give it an edge without inverting the medallion's colour. */
        .vd-orn__disc { width:220px; height:220px; border-radius:50%; background:var(--terra); color:var(--cream); display:grid; place-items:center; position:relative; z-index:2; box-shadow:0 0 0 3px var(--terra-soft), 0 26px 60px -28px rgba(0,0,0,.55); }
        .vd-orn__ring { position:absolute; inset:0; border-radius:50%; border:1px dashed rgba(var(--cream-rgb),.4); }
        .vd-orn__ring--2 { inset:30px; border-style:solid; border-color:var(--rule-moss); }
        .vd-orn__arch { position:absolute; inset:0; pointer-events:none; font-family:var(--fm); font-size:11px; letter-spacing:.3em; text-transform:uppercase; fill:var(--cream); opacity:.65; }
        .vd-success__head { text-align:center; max-width:720px; margin:0 auto 44px; }
        .vd-success__head .kicker { font-family:var(--fm); font-size:11px; letter-spacing:.3em; text-transform:uppercase; color:var(--terra-soft); margin-bottom:16px; }
        .vd-success__head h1 { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(52px,7vw,92px); line-height:.96; letter-spacing:-.02em; margin:0 0 6px; color:var(--cream); }
        /* light plum, not --terra: this page is a moss surface, and dark plum on dark
           moss measured 1.4:1 - the 90px word "ลงคะแนน" sank into the background.
           Same hue, one step up (the kicker above already uses --terra-soft here). */
        .vd-success__head h1 em { color:var(--terra-soft); }
        .vd-success__accent { width:72px; height:2px; background:var(--terra); margin:6px auto 20px; }
        .vd-success__head p { font-family:var(--ft); font-size:17px; color:rgba(var(--cream-rgb),.82); line-height:1.55; margin:0 auto; max-width:480px; }

        .vd-receipt { max-width:480px; width:100%; margin:0 auto; background:var(--moss-2); border:1px solid var(--rule-moss); border-radius:24px; overflow:hidden; }
        .vd-receipt__h { padding:14px 26px; border-bottom:1px dashed var(--rule-moss); display:flex; justify-content:space-between; align-items:center; font-family:var(--fm); font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:rgba(var(--cream-rgb),.65); }
        .vd-receipt__h .ac { color:var(--terra-soft); font-weight:700; }
        .vd-receipt__row { display:grid; grid-template-columns:auto 1fr; gap:24px; padding:13px 26px; align-items:center; font-family:var(--fm); font-size:12px; }
        .vd-receipt__row + .vd-receipt__row { border-top:1px dashed var(--rule-moss); }
        .vd-receipt__row .lbl { letter-spacing:.18em; text-transform:uppercase; color:rgba(var(--cream-rgb),.72); }
        .vd-receipt__row .val { color:var(--cream); text-align:right; letter-spacing:.02em; }
        .vd-receipt__row .val .ac { color:var(--terra-soft); }
        .vd-receipt__cta { padding:20px 24px; border-top:1px dashed var(--rule-moss); display:grid; gap:10px; }
        .vd-receipt__done { display:flex; align-items:center; justify-content:center; gap:10px; padding:16px; border:1px solid rgba(var(--terra-rgb),.4); border-radius:999px; background:rgba(var(--terra-rgb),.12); color:var(--terra-soft); font-family:var(--fs); font-size:14px; font-weight:600; }

        /* vd-B1E: desktop two-column desk — seal + headline on the left, receipt
           card on the right, both vertically centred, so the evaluate CTA lands in
           the first viewport on wide screens (and the wasted whitespace is dignified
           into a composition). CSS-only recompose of the three existing siblings. */
        @media (min-width:1101px) {
          .vd-success {
            place-items:stretch;
            grid-template-columns:minmax(0,1fr) minmax(0,480px);
            grid-template-areas:"orn receipt" "head receipt";
            column-gap:clamp(64px,6vw,96px);
            align-content:center;
            max-width:1160px;
            margin:0 auto;
            padding:56px 40px 112px;
          }
          .vd-orn { grid-area:orn; width:min(360px,40vh); height:min(360px,40vh); margin:0 0 24px; justify-self:center; align-self:end; }
          .vd-orn__disc { width:61%; height:61%; }
          .vd-orn__ring--2 { inset:8.3%; }
          .vd-success__head { grid-area:head; max-width:none; margin:0; justify-self:stretch; align-self:start; }
          .vd-receipt { grid-area:receipt; margin:0; justify-self:center; align-self:center; }
        }
        /* vd-B1E: tablet 561–1100 keeps the single centred column but squeezes the
           top padding + seal + headline so the evaluate CTA reaches the fold. */
        @media (max-width:1100px) {
          .vd-success { padding:36px 20px 126px; }
          .vd-orn { width:min(200px,26vh); height:min(200px,26vh); margin-bottom:16px; }
          .vd-orn__disc { width:61%; height:61%; }
          .vd-orn__ring--2 { inset:8.3%; }
          .vd-success__head { margin-bottom:18px; }
          .vd-success__head h1 { font-size:clamp(40px,5vw,58px); }
          .vd-success__head p { font-size:15px; }
        }
        @media (max-width:560px) {
          /* v2-R8 T4: squeeze the ornament hero + top padding so the evaluate CTA
             lands in the first viewport (form-first). Lightest touch in the Verdure
             language — the seal shrinks, the moss screen tightens; nothing restyled. */
          .vd-success { padding:44px 16px 120px; }
          .vd-orn { width:min(208px,54vw); height:min(208px,54vw); margin-bottom:20px; }
          .vd-orn__disc { width:64%; height:64%; }
          .vd-orn__ring--2 { inset:18px; }
          .vd-success__head { margin-bottom:22px; }
          .vd-success__head h1 { font-size:clamp(40px,11vw,92px); }
          .vd-success__head p { font-size:15px; }
          .vd-receipt__h { padding:13px 18px; }
          .vd-receipt__row { gap:14px; padding:11px 18px; }
          .vd-receipt__cta { padding:18px; }
        }
      `}</style>
    </VerdureShell>
  );
}
