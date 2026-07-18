"use client";

// StudioDarkMemberModal + StudioDarkLightbox — shared overlays for the Studio
// Dark v2 template (used by StudioDarkSingleParty and StudioDarkParty), the
// studio-language siblings of gumroad's member modal / lightbox.
//
//   <StudioDarkMemberModal member={m|null} onClose={fn} />
//   <StudioDarkLightbox src={url|null} caption="" onClose={fn} />
//
// Render them unconditionally inside <AnimatePresence>-free parents — both
// gate themselves (null prop = nothing) and animate via framer-motion
// AnimatePresence internally, so call sites stay one-liners.

import { getPath } from "../../utils/basePath";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

// NOTE: entrance animates, close is INSTANT (no AnimatePresence/exit). Exit
// callbacks proved unreliable under forced prefers-reduced-motion (the exit
// reached its final frame but onExitComplete never fired → an invisible
// overlay kept eating every click). Instant close can't hang.

const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

function useEscape(active, onClose) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onClose]);
}

export function StudioDarkMemberModal({ member = null, onClose = () => {} }) {
  useEscape(!!member, onClose);
  const src = member ? resolveSrc(member.modalImageUrl || member.imageUrl) : null;

  if (!member) return null;

  return (
        <motion.div className="sdm-overlay" onClick={onClose} role="dialog" aria-modal="true"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }}>
          <motion.div className="sdm-card" onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
            <button type="button" className="sdm-x" onClick={onClose} aria-label="ปิด"><X size={18} strokeWidth={2.5} /></button>
            <div className={`sdm-photo ${src ? "" : "sd-media-ph"}`}>
              {src ? <img src={src} alt={member.name || ""} /> : <span>portrait</span>}
              <span className="sdm-photo__tag">CANDIDATE</span>
            </div>
            <div className="sdm-info">
              <div className="sdm-eyebrow"><span className="sdm-accent">●</span> CANDIDATE · ผู้สมัคร</div>
              <h3 className="sdm-name">{member.name}</h3>
              <dl className="sdm-rows">
                <div><dt>STUDENT ID · รหัสนักศึกษา</dt><dd>{member.studentId || "—"}</dd></div>
                <div><dt>POSITION · ตำแหน่ง</dt><dd>{member.position || "—"}</dd></div>
                <div><dt>MAJOR · สาขาวิชา</dt><dd>{member.major || "—"}</dd></div>
              </dl>
            </div>
          </motion.div>

          <style jsx global>{`
            .sdm-overlay {
              position:fixed; inset:0; z-index:9100; display:grid; place-items:center;
              background:rgba(10,10,7,.8); backdrop-filter:blur(8px); padding:24px; cursor:pointer;
            }
            .sdm-card {
              position:relative; cursor:auto; width:min(720px, 100%);
              display:grid; grid-template-columns:300px 1fr;
              background:var(--sd-bg-2, #1B1B14); border:1px solid var(--sd-line-strong, #3E3E2D);
              border-radius:24px; overflow:hidden;
            }
            .sdm-x {
              position:absolute; top:14px; right:14px; z-index:2; width:38px; height:38px;
              display:grid; place-items:center; border-radius:999px; cursor:pointer;
              background:rgba(20,20,15,.7); border:1px solid var(--sd-line-strong, #3E3E2D);
              color:var(--sd-ink-2, #B5B0A2); transition:all .2s;
            }
            .sdm-x:hover { background:var(--sd-accent, #D5FF3F); border-color:var(--sd-accent, #D5FF3F); color:var(--sd-bg, #14140F); }
            .sdm-photo { position:relative; aspect-ratio:4/5; background:var(--sd-bg, #14140F); border-right:1px solid var(--sd-line, #2E2E22); }
            .sdm-photo img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
            .sdm-photo__tag {
              position:absolute; left:14px; bottom:12px; font-family:var(--sd-mono, monospace); font-size:9px;
              letter-spacing:.22em; color:var(--sd-bg, #14140F); background:var(--sd-accent, #D5FF3F);
              padding:4px 10px; border-radius:999px; font-weight:600;
            }
            .sdm-info { padding:32px 30px; display:flex; flex-direction:column; justify-content:center; text-align:left; }
            .sdm-accent { color:var(--sd-accent, #D5FF3F); }
            .sdm-eyebrow { font-family:var(--sd-mono, monospace); font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:var(--sd-ink-3, #7F7A6E); margin-bottom:12px; }
            .sdm-name { font-family:var(--sd-sans, sans-serif); font-weight:400; font-size:clamp(24px,3vw,34px); letter-spacing:-.03em; line-height:1.1; margin:0 0 22px; color:var(--sd-ink, #F2EDDF); }
            .sdm-rows { margin:0; display:grid; gap:0; }
            .sdm-rows > div { display:grid; gap:4px; padding:12px 0; border-top:1px solid var(--sd-line, #2E2E22); }
            .sdm-rows dt { font-family:var(--sd-mono, monospace); font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--sd-ink-3, #7F7A6E); }
            .sdm-rows dd { margin:0; font-family:var(--sd-sans, sans-serif); font-size:15px; color:var(--sd-ink, #F2EDDF); font-weight:400; }
            @media (max-width:640px) {
              .sdm-card { grid-template-columns:1fr; max-height:90vh; overflow-y:auto; }
              .sdm-photo { border-right:0; border-bottom:1px solid var(--sd-line, #2E2E22); }
              .sdm-info { padding:24px 22px; }
            }
          `}</style>
        </motion.div>
  );
}

export function StudioDarkLightbox({ src = null, caption = "", onClose = () => {} }) {
  useEscape(!!src, onClose);

  if (!src) return null;

  return (
        <motion.div className="sdl-overlay" onClick={onClose} role="dialog" aria-modal="true"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }}>
          <button type="button" className="sdl-x" onClick={onClose} aria-label="ปิด"><X size={20} strokeWidth={2.5} /></button>
          <motion.img src={src} alt={caption || "image"} className="sdl-img" onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} />
          {caption && <span className="sdl-caption">{caption}</span>}

          <style jsx global>{`
            .sdl-overlay {
              position:fixed; inset:0; z-index:9100; display:grid; place-items:center;
              background:rgba(10,10,7,.88); backdrop-filter:blur(10px); padding:32px; cursor:zoom-out;
            }
            .sdl-img {
              max-width:min(1200px, 94vw); max-height:84vh; object-fit:contain; cursor:auto;
              border:1px solid var(--sd-line-strong, #3E3E2D); border-radius:14px; background:var(--sd-bg-2, #1B1B14);
            }
            .sdl-x {
              position:absolute; top:20px; right:20px; width:42px; height:42px; z-index:2;
              display:grid; place-items:center; border-radius:999px; cursor:pointer;
              background:rgba(20,20,15,.7); border:1px solid var(--sd-line-strong, #3E3E2D);
              color:var(--sd-ink-2, #B5B0A2); transition:all .2s;
            }
            .sdl-x:hover { background:var(--sd-accent, #D5FF3F); border-color:var(--sd-accent, #D5FF3F); color:var(--sd-bg, #14140F); }
            .sdl-caption {
              position:absolute; bottom:22px; left:50%; transform:translateX(-50%);
              font-family:var(--sd-mono, monospace); font-size:10px; letter-spacing:.2em; text-transform:uppercase;
              color:var(--sd-ink-2, #B5B0A2); background:rgba(20,20,15,.8); border:1px solid var(--sd-line, #2E2E22);
              padding:6px 16px; border-radius:999px; white-space:nowrap;
            }
          `}</style>
        </motion.div>
  );
}
