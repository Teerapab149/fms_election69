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
  const d = new Date();
  const recordedAt = `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`; // Arabic digits
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
            <text><textPath href="#vdArchTop" startOffset="50%" textAnchor="middle">★ BALLOT RECORDED · บันทึกแล้ว ★</textPath></text>
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
          <div className="vd-receipt__h"><span>RECEIPT · ใบรับรอง</span><span><span className="ac">●</span> CONFIRMED</span></div>
          <div className="vd-receipt__row"><span className="lbl">BALLOT No.</span><span className="val"><span className="ac">{ballotNo}</span></span></div>
          <div className="vd-receipt__row"><span className="lbl">RECORDED AT</span><span className="val">{recordedAt}</span></div>
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
        .vd-orn__disc { width:220px; height:220px; border-radius:50%; background:var(--terra); color:var(--cream); display:grid; place-items:center; position:relative; z-index:2; box-shadow:0 0 0 1px var(--terra-soft); }
        .vd-orn__ring { position:absolute; inset:0; border-radius:50%; border:1px dashed rgba(244,236,219,.4); }
        .vd-orn__ring--2 { inset:30px; border-style:solid; border-color:var(--rule-moss); }
        .vd-orn__arch { position:absolute; inset:0; pointer-events:none; font-family:var(--fm); font-size:11px; letter-spacing:.3em; text-transform:uppercase; fill:var(--cream); opacity:.65; }
        .vd-success__head { text-align:center; max-width:720px; margin:0 auto 44px; }
        .vd-success__head .kicker { font-family:var(--fm); font-size:11px; letter-spacing:.3em; text-transform:uppercase; color:var(--terra-soft); margin-bottom:16px; }
        .vd-success__head h1 { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(52px,7vw,92px); line-height:.96; letter-spacing:-.02em; margin:0 0 6px; color:var(--cream); }
        .vd-success__head h1 em { color:var(--terra); }
        .vd-success__accent { width:72px; height:2px; background:var(--terra); margin:6px auto 20px; }
        .vd-success__head p { font-family:var(--ft); font-size:17px; color:rgba(244,236,219,.82); line-height:1.55; margin:0 auto; max-width:480px; }

        .vd-receipt { max-width:480px; width:100%; margin:0 auto; background:var(--moss-2); border:1px solid var(--rule-moss); border-radius:24px; overflow:hidden; }
        .vd-receipt__h { padding:14px 26px; border-bottom:1px dashed var(--rule-moss); display:flex; justify-content:space-between; align-items:center; font-family:var(--fm); font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:rgba(244,236,219,.65); }
        .vd-receipt__h .ac { color:var(--terra-soft); font-weight:700; }
        .vd-receipt__row { display:grid; grid-template-columns:auto 1fr; gap:24px; padding:13px 26px; align-items:center; font-family:var(--fm); font-size:12px; }
        .vd-receipt__row + .vd-receipt__row { border-top:1px dashed var(--rule-moss); }
        .vd-receipt__row .lbl { letter-spacing:.18em; text-transform:uppercase; color:rgba(244,236,219,.72); }
        .vd-receipt__row .val { color:var(--cream); text-align:right; letter-spacing:.02em; }
        .vd-receipt__row .val .ac { color:var(--terra-soft); }
        .vd-receipt__cta { padding:20px 24px; border-top:1px dashed var(--rule-moss); display:grid; gap:10px; }
        .vd-receipt__done { display:flex; align-items:center; justify-content:center; gap:10px; padding:16px; border:1px solid rgba(188,94,62,.4); border-radius:999px; background:rgba(188,94,62,.12); color:var(--terra-soft); font-family:var(--fs); font-size:14px; font-weight:600; }

        @media (max-width:1100px) { .vd-success { padding:96px 20px 130px; } }
        @media (max-width:560px) {
          .vd-success { padding:84px 16px 128px; }
          .vd-orn { width:min(300px,82vw); height:min(300px,82vw); margin-bottom:30px; }
          .vd-orn__disc { width:64%; height:64%; }
          .vd-orn__ring--2 { inset:22px; }
          .vd-success__head { margin-bottom:30px; }
          .vd-success__head p { font-size:15px; }
          .vd-receipt__h { padding:13px 18px; }
          .vd-receipt__row { gap:14px; padding:12px 18px; }
          .vd-receipt__cta { padding:18px; }
        }
      `}</style>
    </VerdureShell>
  );
}
