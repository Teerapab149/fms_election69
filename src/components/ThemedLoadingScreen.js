"use client";

// ThemedLoadingScreen — full-screen loading/auth-check state that matches the
// ACTIVE template instead of flashing a white page (owner feedback 2026-06-12:
// the "กำลังตรวจสอบสิทธิ์" screen was white on the dark studio theme).
//
//   <ThemedLoadingScreen text="กำลังตรวจสอบสิทธิ์..." subtext? />
//
// The slug comes from useActiveTemplateId() — SSR-provided via the layout, so
// the right colors are there on FIRST paint (no fetch, no flash). Unknown /
// forked slugs fall back by prefix match, then to classic.
//
// Spinners are framer-motion (JS) so they keep moving even where the
// globals.css reduced-motion rule kills CSS keyframes — a frozen "loading"
// screen reads as a crash.

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useActiveTemplateId } from "../contexts/GlobalConfigContext";

const spin = { rotate: 360 };
const spinT = { duration: 1, ease: "linear", repeat: Infinity };

function StudioLoading({ text, subtext }) {
  return (
    <div className="fms-app" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 22, background: "#14140F", color: "#F2EDDF",
    }}>
      <motion.span animate={spin} transition={spinT} style={{
        width: 44, height: 44, borderRadius: 999, display: "block",
        border: "1px solid #3E3E2D", borderTopColor: "#D5FF3F",
      }} />
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "var(--font-studio-mono), ui-monospace, monospace", fontSize: 12,
          letterSpacing: ".18em", textTransform: "uppercase", color: "#B5B0A2",
        }}>{text}</div>
        {subtext && <div style={{
          marginTop: 8, fontSize: 13, color: "#7F7A6E",
          fontFamily: "var(--font-studio-sans), var(--font-anuphan), sans-serif",
        }}>{subtext}</div>}
      </div>
    </div>
  );
}

function GumroadLoading({ text, subtext }) {
  return (
    <div className="fms-app" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 20, background: "#FFF6EC", color: "#26271c",
    }}>
      <motion.span animate={spin} transition={spinT} style={{
        width: 46, height: 46, borderRadius: 14, display: "block",
        border: "2.5px solid #26271c", borderTopColor: "#C2F47E",
        boxShadow: "4px 4px 0 #26271c", background: "#FFFDFA",
      }} />
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "var(--font-anuphan), 'Anuphan', sans-serif",
          fontSize: 15, fontWeight: 700,
        }}>{text}</div>
        {subtext && <div style={{ marginTop: 6, fontSize: 13, color: "#5c5a4b" }}>{subtext}</div>}
      </div>
    </div>
  );
}

function ClassicLoading({ text, subtext }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FD]">
      <Loader2 className="w-10 h-10 text-[var(--color-primary,#8A2680)] animate-spin mb-4" />
      <p className="text-slate-500 font-medium">{text}</p>
      {subtext && <p className="text-slate-400 text-sm mt-1">{subtext}</p>}
    </div>
  );
}

export default function ThemedLoadingScreen({ text = "กำลังโหลด...", subtext = null }) {
  const slug = useActiveTemplateId();
  if (slug?.startsWith("studio-dark")) return <StudioLoading text={text} subtext={subtext} />;
  if (slug?.startsWith("gumroad")) return <GumroadLoading text={text} subtext={subtext} />;
  return <ClassicLoading text={text} subtext={subtext} />;
}
