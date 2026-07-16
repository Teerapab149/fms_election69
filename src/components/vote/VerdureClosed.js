"use client";

// VerdureClosed — SYSTEM-CLOSED status page for the Verdure template (composed in
// the design's language: a moss seal disc with the variant icon + dashed orbit,
// a serif headline, the page's Thai title + desc, and one action). Variants:
// waiting (Clock) · ended (CheckCheck) · closed (Lock). Cream screen.

import { getPath } from "../../utils/basePath";
import { motion } from "framer-motion";
import { Lock, Clock, CheckCheck, LogOut } from "lucide-react";
import VerdureShell from "./VerdureShell";

const VARIANTS = {
  waiting: { Icon: Clock,      kicker: "OPENS SOON · ยังไม่เปิดโหวต", head: (<>Not yet<br /><em>open.</em></>), edge: "Status" },
  ended:   { Icon: CheckCheck, kicker: "POLLS CLOSED · ปิดโหวตแล้ว",  head: (<>That&rsquo;s<br />a <em>wrap.</em></>), edge: "Status" },
  closed:  { Icon: Lock,       kicker: "ON HOLD · ปิดชั่วคราว",      head: (<>Ballot<br />on <em>hold.</em></>),  edge: "Status" },
};

export default function VerdureClosed({ title = "", desc = "", variant = "closed", session = null, onLogout = () => {}, editorMode = false }) {
  const v = VARIANTS[variant] || VARIANTS.closed;
  const { Icon } = v;
  return (
    <VerdureShell active="vote" editorMode={editorMode}
      edge={{ num: "✕", label: "Status", th: "สถานะการลงคะแนน" }}
      cornermarkTitle="Status" cornermarkSub="ระบบการลงคะแนน"
      statusChip={<div className="vd-chip-live"><span className="dot" /> {v.kicker.split(" · ")[0]}</div>}>
      <div className="vd-warm-bg" aria-hidden />
      <div className="vd-closed">
        <div className="vd-closed__disc">
          <motion.span className="ring" animate={{ rotate: 360 }} transition={{ duration: 40, ease: "linear", repeat: Infinity }} />
          <Icon size={48} strokeWidth={1.8} />
        </div>
        <div className="vd-closed__kicker">{v.kicker}</div>
        <h1 className="vd-closed__head">{v.head}</h1>
        <div className="vd-closed__accent" aria-hidden />
        <h2 className="vd-closed__title">{title}</h2>
        <p className="vd-closed__desc">{desc}</p>
        {session ? (
          <button type="button" className="vd-btn vd-btn--terra vd-btn--lg" onClick={() => !editorMode && onLogout()}><LogOut size={16} /> ออกจากระบบ</button>
        ) : (
          <a href={editorMode ? undefined : getPath("/")} className="vd-btn vd-btn--terra vd-btn--lg">← กลับหน้าหลัก</a>
        )}
      </div>

      <style jsx global>{`
        /* golden-hour warm wash — same recipe as the single-vote booth so the
           status page carries the template's warmth, not flat cream */
        .vd-warm-bg { position:fixed; inset:0; z-index:0; pointer-events:none;
          background:
            radial-gradient(72% 46% at 50% 0%, rgba(var(--gold-rgb),.16) 0%, transparent 56%),
            radial-gradient(60% 44% at 100% 8%, rgba(var(--terra-rgb),.09) 0%, transparent 50%),
            radial-gradient(66% 52% at 0% 100%, rgba(var(--terra-soft-rgb),.30) 0%, transparent 56%),
            linear-gradient(168deg, var(--cream-2) 0%, var(--cream) 46%, var(--cream-3) 100%); }

        .vd-closed { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:120px 24px 150px; position:relative; z-index:1; }
        .vd-closed__disc { width:180px; height:180px; border-radius:50%; background:var(--moss); color:var(--cream); display:grid; place-items:center; position:relative; margin-bottom:36px; box-shadow:0 40px 60px -30px rgba(var(--moss-rgb),.4); }
        .vd-closed__disc .ring { position:absolute; inset:-14px; border-radius:50%; border:1px dashed var(--terra); opacity:.4; }
        .vd-closed__kicker { font-family:var(--fm); font-size:11px; letter-spacing:.28em; text-transform:uppercase; color:var(--terra-2); margin-bottom:22px; }
        .vd-closed__head { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(56px,8vw,108px); line-height:.92; letter-spacing:-.02em; margin:0 0 10px; color:var(--moss); }
        .vd-closed__head em { color:var(--terra); }
        .vd-closed__accent { width:72px; height:2px; background:var(--terra); margin:4px auto 26px; }
        .vd-closed__title { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(20px,2.4vw,26px); margin:0 0 12px; color:var(--moss); }
        .vd-closed__desc { font-family:var(--ft); font-size:16px; color:rgba(var(--moss-rgb),.85); line-height:1.6; max-width:460px; margin:0 0 36px; }
        @media (max-width:1100px) { .vd-closed { padding:96px 20px 130px; } }
        @media (max-width:560px) {
          .vd-closed { padding:84px 18px 128px; }
          .vd-closed__disc { width:150px; height:150px; margin-bottom:28px; }
        }
      `}</style>
    </VerdureShell>
  );
}
