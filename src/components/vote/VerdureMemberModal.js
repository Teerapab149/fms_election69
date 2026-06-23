"use client";

// VerdureMemberModal + VerdureLightbox — shared overlays for the Verdure template
// (used by VerdureParty / VerdureSingleParty). Cream editorial cards on a moss
// scrim. Entrance animates (framer-motion); close is INSTANT (exit callbacks hang
// under forced reduce-motion — an invisible overlay would eat clicks).

import { getPath } from "../../utils/basePath";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

function useEscape(active, onClose) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onClose]);
}

export function VerdureMemberModal({ member = null, onClose = () => {} }) {
  useEscape(!!member, onClose);
  const src = member ? resolveSrc(member.modalImageUrl || member.imageUrl) : null;
  if (!member) return null;

  return (
    <motion.div className="vd-mm" onClick={onClose} role="dialog" aria-modal="true"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }}>
      <motion.div className="vd-mm__card" onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
        <button type="button" className="vd-mm__x" onClick={onClose} aria-label="ปิด"><X size={18} strokeWidth={2.5} /></button>
        <div className="vd-mm__photo">{src ? <img src={src} alt={member.name || ""} /> : <span>portrait</span>}<span className="tag">CANDIDATE</span></div>
        <div className="vd-mm__info">
          <div className="vd-mm__eyebrow"><span className="ac">●</span> CANDIDATE · ผู้สมัคร</div>
          <h3 className="vd-mm__name">{member.name}</h3>
          <dl className="vd-mm__rows">
            <div><dt>STUDENT ID · รหัสนักศึกษา</dt><dd>{member.studentId || "—"}</dd></div>
            <div><dt>POSITION · ตำแหน่ง</dt><dd>{member.position || "—"}</dd></div>
            <div><dt>MAJOR · สาขาวิชา</dt><dd>{member.major || "—"}</dd></div>
          </dl>
        </div>
      </motion.div>
      <style jsx global>{`
        .vd-mm { position:fixed; inset:0; z-index:9100; display:grid; place-items:center; background:rgba(31,58,44,.6); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); padding:24px; cursor:pointer; --moss:#1F3A2C; --cream:#F4ECDB; --cream-2:#FAF4E4; --cream-3:#E6DCC5; --terra:#BC5E3E; --rule:#D4C9AC; --fd:var(--font-dm-serif),Georgia,serif; --fm:var(--font-space-mono),monospace; --ft:var(--font-plex-thai),sans-serif; }
        .vd-mm__card { position:relative; cursor:auto; width:min(720px,100%); display:grid; grid-template-columns:300px 1fr; background:var(--cream); border:1px solid var(--rule); border-radius:28px; overflow:hidden; box-shadow:0 40px 80px -20px rgba(31,58,44,.5); }
        .vd-mm__x { position:absolute; top:14px; right:14px; z-index:2; width:38px; height:38px; display:grid; place-items:center; border-radius:50%; cursor:pointer; background:var(--cream-2); border:1px solid var(--rule); color:var(--moss); }
        .vd-mm__x:hover { background:var(--terra); border-color:var(--terra); color:var(--cream); }
        .vd-mm__photo { position:relative; aspect-ratio:4/5; background:var(--cream-3); display:grid; place-items:center; border-right:1px solid var(--rule); }
        .vd-mm__photo img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
        .vd-mm__photo span { font-family:var(--fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--moss); opacity:.55; }
        .vd-mm__photo .tag { position:absolute; left:14px; bottom:12px; font-family:var(--fm); font-size:9px; letter-spacing:.2em; color:var(--cream); background:var(--terra); padding:4px 10px; border-radius:999px; font-weight:700; }
        .vd-mm__info { padding:34px 32px; display:flex; flex-direction:column; justify-content:center; }
        .vd-mm__eyebrow { font-family:var(--fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--moss); opacity:.55; margin-bottom:12px; }
        .vd-mm__eyebrow .ac { color:var(--terra); opacity:1; }
        .vd-mm__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(26px,3vw,36px); letter-spacing:-.02em; line-height:1.1; margin:0 0 20px; color:var(--moss); }
        .vd-mm__rows { margin:0; display:grid; }
        .vd-mm__rows > div { display:grid; gap:4px; padding:13px 0; border-top:1px dashed var(--rule); }
        .vd-mm__rows dt { font-family:var(--fm); font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:var(--moss); opacity:.55; }
        .vd-mm__rows dd { margin:0; font-family:var(--ft); font-size:15px; color:var(--moss); }
        @media (max-width:640px) { .vd-mm__card { grid-template-columns:1fr; max-height:90vh; overflow-y:auto; } .vd-mm__photo { border-right:0; border-bottom:1px solid var(--rule); } }
      `}</style>
    </motion.div>
  );
}

export function VerdureLightbox({ src = null, caption = "", onClose = () => {} }) {
  useEscape(!!src, onClose);
  if (!src) return null;
  return (
    <motion.div className="vd-lb" onClick={onClose} role="dialog" aria-modal="true"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }}>
      <button type="button" className="vd-lb__x" onClick={onClose} aria-label="ปิด"><X size={20} strokeWidth={2.5} /></button>
      <motion.img src={src} alt={caption || "image"} className="vd-lb__img" onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} />
      {caption && <span className="vd-lb__cap">{caption}</span>}
      <style jsx global>{`
        .vd-lb { position:fixed; inset:0; z-index:9100; display:grid; place-items:center; background:rgba(31,58,44,.82); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); padding:32px; cursor:zoom-out; }
        .vd-lb__img { max-width:min(1200px,94vw); max-height:84vh; object-fit:contain; cursor:auto; border:1px solid rgba(212,201,172,.5); border-radius:18px; background:#FAF4E4; }
        .vd-lb__x { position:absolute; top:20px; right:20px; width:42px; height:42px; z-index:2; display:grid; place-items:center; border-radius:50%; cursor:pointer; background:rgba(244,236,219,.85); border:1px solid #D4C9AC; color:#1F3A2C; }
        .vd-lb__x:hover { background:#BC5E3E; border-color:#BC5E3E; color:#F4ECDB; }
        .vd-lb__cap { position:absolute; bottom:22px; left:50%; transform:translateX(-50%); font-family:var(--font-space-mono),monospace; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:#F4ECDB; background:rgba(31,58,44,.7); border:1px solid rgba(244,236,219,.3); padding:6px 16px; border-radius:999px; white-space:nowrap; }
        @media (max-width:640px) {
          .vd-lb { padding:14px; }
          .vd-lb__img { max-width:96vw; max-height:80vh; border-radius:14px; }
          .vd-lb__x { top:14px; right:14px; width:38px; height:38px; }
          .vd-lb__cap { bottom:14px; max-width:90vw; white-space:normal; text-align:center; line-height:1.5; border-radius:14px; }
        }
      `}</style>
    </motion.div>
  );
}
