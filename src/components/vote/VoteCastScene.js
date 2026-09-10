"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Flower2, Sailboat, ShieldCheck } from "lucide-react";
import { gumroadTheme } from "../../utils/gumroadPalettes";
import { blossomTheme } from "../../utils/blossomPalettes";
import { verdureTheme } from "../../utils/verdurePalettes";
import { studioDarkTheme } from "../../utils/studioDarkPalettes";
import { fmsOfficialTheme } from "../../utils/fmsOfficialPalette";

const THEMES = {
  original: { bg: "#f5f2f8", ink: "#422a46", accent: "#8a2680", surface: "#fffdfb", label: "YOUR VOICE MATTERS" },
  blossom: { bg: "#faf2f1", ink: "#693c53", accent: "#a94c75", surface: "#f4dfdf", label: "A VOICE, WITH CARE" },
  "fms-official": { bg: "#f5f4f1", ink: "#332e43", accent: "#782b74", surface: "#fdfbf6", label: "FACULTY OF MANAGEMENT SCIENCES" },
  gumroad: { bg: "#f4e9dd", ink: "#29241f", accent: "#8a2680", surface: "#f7c7df", label: "MAKE YOUR MARK." },
  "studio-dark": { bg: "#12130e", ink: "#ecebdd", accent: "#d3fc50", surface: "#24271b", label: "YOUR VOICE. IN MOTION." },
  verdure: { bg: "#eff2e7", ink: "#304834", accent: "#526d3b", surface: "#dbe3ce", label: "SMALL VOICES. SHARED GROWTH." },
};

export function getVoteCastFamily(templateId) {
  return Object.keys(THEMES).find((id) => String(templateId || "").startsWith(id)) || "original";
}

function castTheme(slug, id) {
  const base = THEMES[id];
  if (id === "gumroad") { const t = gumroadTheme(slug); return { ...base, bg:t.cream, ink:t.ink, accent:t.lime, surface:t.pink }; }
  if (id === "blossom") { const t = blossomTheme(slug); return { ...base, bg:t.canvas, ink:t.ink, accent:t.primaryInk, surface:t.primarySoft }; }
  if (id === "verdure") { const t = verdureTheme(slug); return { ...base, bg:t.moss, ink:t.cream, accent:t.soft, surface:t.moss2 }; }
  if (id === "studio-dark") { const t = studioDarkTheme(slug); return { ...base, bg:t.bg, ink:t.ink, accent:t.accent, surface:t.bg2 }; }
  if (id === "fms-official") { const t = fmsOfficialTheme(slug); return { ...base, bg:t.bg, ink:t.ink, accent:t.brand, surface:t.surface }; }
  return { ...base, bg:"var(--color-bg,#f5f2f8)", ink:"var(--color-text,#422a46)", accent:"var(--color-primary,#8a2680)", surface:"var(--color-surface,#fffdfb)" };
}

// No voter or choice props. All illustrated ballots are intentionally blank.
export default function VoteCastScene({ family = "original", phase = "pending", reduced = false }) {
  const preferReduced = useReducedMotion();
  const quiet = reduced || preferReduced;
  const id = getVoteCastFamily(family);
  const theme = castTheme(family, id);
  const overlay = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    overlay.current?.focus({ preventScroll:true });
    return () => { if (previous?.isConnected) previous.focus({ preventScroll:true }); };
  }, []);
  const blossom = id === "blossom";
  const verdure = id === "verdure";
  const studio = id === "studio-dark";
  const chunky = id === "gumroad";
  const official = id === "fms-official";
  const ease = [0.22, 1, 0.36, 1];
  const paperMotion = quiet ? { y: 120, scale: verdure ? 0.1 : 1, scaleY: 0.5, opacity: 0 } : verdure
    ? { y: [-32, -32, 16, 110], scale: [1, 1, 0.09, 0.09], rotate: [0, 0, 35, 35], opacity: [0, 1, 1, 1] }
    : { y: [-32, -22, 0, 120], scaleY: [1, 1, 0.48, 0.48], rotate: [chunky ? -7 : 0, 0, 0, 0], opacity: [0, 1, 1, 1] };

  return (
    <motion.div ref={overlay} role="dialog" aria-modal="true" aria-label="กำลังส่งบัตรลงคะแนน" tabIndex={-1} onKeyDown={event => { if (event.key === "Tab") event.preventDefault(); }} data-vote-cast={id} data-phase={phase} className="fms-app fixed inset-0 z-[200000] flex flex-col items-center justify-center overflow-hidden px-5 py-8 outline-none"
      style={{ background: theme.bg, color: theme.ink }} initial={{ opacity: quiet ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: quiet ? 0 : 0.15 }}>
      <div className="mb-7 text-center text-[9px] font-semibold tracking-[.2em] sm:text-[10px]">{theme.label}</div>
      <div aria-hidden="true" className="relative isolate h-[290px] w-[260px] max-w-full">
        <motion.div className="absolute bottom-[130px] left-1/2 z-10 -ml-[63px] h-[100px] w-[126px] overflow-hidden rounded-sm border p-4"
          style={{ background: verdure ? "#b49c70" : "#fffdf7", borderColor: verdure ? "#796445" : "#d8d0cd", color: "#6b5a6d", transformOrigin: "bottom center" }}
          initial={false} animate={paperMotion} transition={{ duration: quiet ? 0 : 0.96, times: [0, 0.2, 0.46, 1], ease }}>
          <span className="text-[8px] tracking-[.2em]">BALLOT</span>
          <span className="mt-3 block h-px w-full bg-current opacity-20" />
          <span className="mt-3 block h-px w-3/4 bg-current opacity-20" />
        </motion.div>

        {/* Entire receiving object is above the paper in this shared stacking
            context. Its opaque face physically hides the descending ballot. */}
        <motion.div className="absolute bottom-0 left-0 z-20 h-[130px] w-full"
          style={{ transformOrigin: "bottom center" }}
          initial={false} animate={quiet || !chunky ? { scaleY: 1 } : { scaleY: [1, 1, 0.96, 1] }}
          transition={{ duration: 1, times: [0, 0.7, 0.85, 1], ease }}>
          {blossom && <div className="absolute -top-14 left-0 h-16 w-full" style={{ background: theme.surface, clipPath: "polygon(0 100%,50% 0,100% 100%)" }} />}
          {!blossom && !verdure && <div className="absolute -top-1 left-[20%] z-30 h-[6px] w-[60%] rounded-full" style={{ background: studio ? theme.accent : theme.ink }} />}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden"
            style={{ background: theme.surface, border: `${chunky ? 3 : 1}px solid color-mix(in srgb, ${theme.ink} 30%, transparent)`, borderRadius: verdure ? "50% 50% 4px 4px / 16% 16% 4px 4px" : chunky ? 3 : 7, boxShadow: chunky ? "7px 7px 0 #29241f" : "0 12px 28px -22px #29241f66" }}>
            {blossom ? <><span className="absolute inset-0" style={{ background: theme.surface, clipPath: "polygon(0 0,50% 60%,100% 0,100% 100%,0 100%)" }} /><Flower2 size={29} className="relative" strokeWidth={1.3} /></> : official ? <Sailboat size={35} strokeWidth={1.2} /> : verdure ? <div className="h-px w-20" style={{ background: theme.accent }} /> : <ShieldCheck size={25} strokeWidth={1.3} />}
            <span className="relative text-[9px] tracking-[.16em]">{verdure ? "A SHARED FUTURE" : blossom ? "WITH CARE" : "BALLOT BOX"}</span>
          </div>
          {blossom && <motion.div className="absolute inset-x-0 top-0 z-30 h-16" style={{ background:theme.surface, clipPath:"polygon(0 0,100% 0,50% 100%)", transformOrigin:"top center", borderTop:`1px solid ${theme.accent}` }} initial={quiet ? false : { scaleY:0 }} animate={{ scaleY:1 }} transition={{ duration:quiet ? 0 : .22, delay:quiet ? 0 : .78 }} />}
          {studio && <motion.div className="absolute inset-x-0 top-0 z-30 h-px" style={{ background:theme.accent }} initial={quiet ? false : { scaleX:0 }} animate={{ scaleX:1 }} transition={{ duration:quiet ? 0 : .25, delay:quiet ? 0 : .75 }} />}
          {blossom && [0, 1, 2].map((petal) => <motion.span key={petal} className="absolute left-1/2 top-12 z-30 h-3 w-5 rounded-[100%_0_100%_0]" style={{ background: theme.accent, transformOrigin: "left center" }}
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: quiet ? 0 : [0, 0.65, 0], scale: quiet ? 0 : [0.3, 1, 0.8], x: [0, (petal - 1) * 46], y: [0, -32 - petal * 7], rotate: petal * 65 }} transition={{ duration: quiet ? 0 : 0.35, delay: 0.65, ease }} />)}
        </motion.div>
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="mt-10 max-w-xs text-center">
        <p className="text-lg font-semibold">{phase === "confirmed" ? "บันทึกแล้ว กำลังเปิดหน้ายืนยัน" : "กำลังส่งบัตรลงคะแนน"}</p>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: theme.ink, opacity: 0.76 }}>กรุณารอสักครู่ อย่าปิดหน้านี้</p>
      </div>
    </motion.div>
  );
}
