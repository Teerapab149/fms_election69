"use client";

// VerdureHome — HOME for the Verdure template. Cream paper, a moss "wax-seal"
// medallion as the brand centerpiece, a big STATE-AWARE terracotta action button
// directly beneath it, and a compact serif stat ledger. The seal is an
// Awwwards-grade interactive piece: mouse-parallax 3D tilt + a rotating
// stamp-text ring + a counter-rotating dashed ring + a glossy sheen that follows
// the cursor + a press-in on hover — all framer-motion so the global reduce-motion
// rule can't freeze it (decorative motion = product call, per the project).
//
// ALL year/number/edition text derives from globalConfig via verdureMeta (Arabic
// digits only). voteCTA-button STATE drives the button's label + route.

import { getPath } from "../../utils/basePath";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { useSession } from "next-auth/react";
import VerdureChrome, { verdureSignIn, verdureMeta } from "./VerdureChrome";
import EditorElement from "../admin/editor/EditorElement";
import { resolveElementState, buildRuntimeContext } from "../admin/editor/stateResolver";
import { getBinding } from "../admin/editor/elementCatalog";
import { buildTemplateStyles } from "../../lib/templateTokens";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { useVoteStatus } from "../../hooks/useVoteStatus";
import { resolveElectionDates } from "../../utils/electionConfig";

// ── the interactive wax seal ──
function VerdureSeal({ num, ordSuffix, faculty, cy, prefix }) {
  const px = useMotionValue(0), py = useMotionValue(0);
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 16 });
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 16 });
  const sheenX = useTransform(px, [-0.5, 0.5], ["28%", "72%"]);
  const sheenY = useTransform(py, [-0.5, 0.5], ["26%", "74%"]);
  const sheen = useMotionTemplate`radial-gradient(circle at ${sheenX} ${sheenY}, rgba(244,236,219,.22), rgba(244,236,219,0) 55%)`;

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { px.set(0); py.set(0); };

  const ringText = `★ ${faculty} · ELECTION · ${cy} · ${prefix} · ${num} `.repeat(3);

  return (
    <div className="vd-seal-wrap">
      <motion.div className="vd-seal" onMouseMove={onMove} onMouseLeave={onLeave}
        style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 1100 }}
        whileHover={{ scale: 0.985 }} transition={{ type: "spring", stiffness: 200, damping: 18 }}>

        {/* rotating stamp-text ring */}
        <motion.svg className="vd-seal__ring" viewBox="0 0 400 400" aria-hidden
          animate={{ rotate: 360 }} transition={{ duration: 46, ease: "linear", repeat: Infinity }}>
          <defs><path id="vdSealPath" d="M200,200 m-170,0 a170,170 0 1,1 340,0 a170,170 0 1,1 -340,0" /></defs>
          <text><textPath href="#vdSealPath" startOffset="0" className="vd-seal__ringtext">{ringText}</textPath></text>
        </motion.svg>

        {/* counter-rotating dashed ring */}
        <motion.span className="vd-seal__dash" aria-hidden
          animate={{ rotate: -360 }} transition={{ duration: 80, ease: "linear", repeat: Infinity }} />

        {/* the moss disc */}
        <div className="vd-seal__disc">
          <motion.div className="vd-seal__sheen" style={{ background: sheen }} aria-hidden />
          <div className="vd-home__disc-50">{num}</div>
          <div className="vd-home__disc-ord">{ordSuffix} ED.</div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerdureHome({
  initialData, editorMode = false, editorData = null, elementConfigs = null,
  selectedElement = null, hoveredElement = null, onSelectElement = null,
  onHoverElement = null, onHoverEnd = null, pageLayout = null,
  resolvedTemplate = null, editorTokenStyles = null,
}) {
  const { data: session, status } = useSession();
  const globalConfig = useGlobalConfig();
  const [mounted, setMounted] = useState(false);
  const { isVoted: isVotedReal } = useVoteStatus({ enabled: !editorMode && status === "authenticated" });

  useEffect(() => { setMounted(true); }, []);

  const [cd, setCd] = useState("--:--:--");
  useEffect(() => {
    const { ELECTION_END } = resolveElectionDates(globalConfig);
    const tick = () => {
      const diff = ELECTION_END - Date.now();
      if (diff <= 0) { setCd("ปิดแล้ว"); return; }
      const h = Math.floor(diff / 3600000), m = Math.floor((diff / 60000) % 60), s = Math.floor((diff / 1000) % 60);
      const p = (n) => String(n).padStart(2, "0");
      setCd(`${p(h)}:${p(m)}:${p(s)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [globalConfig?.electionEndAt, globalConfig?.electionStartAt]);

  const editorStateRef = useRef(null);
  editorStateRef.current = { editorMode, elementConfigs, selectedElement, hoveredElement, onSelectElement, onHoverElement, onHoverEnd };
  const Wrap = useCallback(({ id, children, className }) => {
    const s = editorStateRef.current;
    if (!s.editorMode) return children;
    return (
      <EditorElement id={id} className={className} config={s.elementConfigs?.[id]}
        isSelected={s.selectedElement === id} isHovered={s.hoveredElement === id}
        onSelect={s.onSelectElement} onHover={s.onHoverElement} onHoverEnd={s.onHoverEnd}>{children}</EditorElement>
    );
  }, []);

  if (!mounted) return null;

  const effectiveConfigs = editorMode ? elementConfigs : (pageLayout?.elementConfigs?.home || {});
  const getText = (id, def) => { const b = getBinding(id); if (b) return globalConfig[b] ?? def; return effectiveConfigs?.[id]?.config?.text ?? def; };

  const rawStats = editorMode
    ? { totalVoted: editorData?.totalVoted ?? 1, totalEligible: editorData?.totalEligible ?? 2001 }
    : { totalVoted: initialData?.stats?.totalVoted ?? 0, totalEligible: initialData?.stats?.totalEligible ?? 0 };
  const pct = rawStats.totalEligible > 0 ? ((rawStats.totalVoted / rawStats.totalEligible) * 100).toFixed(2) : "0.00";
  const fmtInt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n);

  const tokenStylesCss = editorMode ? (editorTokenStyles || "") : buildTemplateStyles(resolvedTemplate, ".fms-app");

  const runtimeCtx = buildRuntimeContext({
    session, systemConfig: initialData?.systemConfig, electionStatus: initialData?.electionStatus,
    userData: session?.user ? { ...(initialData?.userData || {}), isVoted: isVotedReal } : initialData?.userData,
  });
  const voteState = editorMode ? "login" : (resolveElementState("voteCTA-button", runtimeCtx) || "login");
  const CTA = {
    login:    { label: "เข้าสู่ระบบเพื่อลงคะแนน", sub: "SIGN IN · PSU PASSPORT", action: "signin", disabled: false },
    notVoted: { label: "ไปลงคะแนนเสียง",          sub: "CAST YOUR BALLOT",       href: "/vote",     disabled: false },
    voted:    { label: "ดูผลคะแนน",               sub: "YOU HAVE VOTED · RESULTS", href: "/results", disabled: false },
    closed:   { label: "ยังไม่เปิดรับลงคะแนน",     sub: "POLLS NOT OPEN",         href: "/closed",   disabled: true },
    paused:   { label: "ระบบหยุดชั่วคราว",         sub: "ON HOLD",                href: "/closed",   disabled: true },
    ended:    { label: "ดูผลคะแนนอย่างเป็นทางการ", sub: "FINAL RESULTS",          href: "/results",  disabled: false },
  }[voteState] || { label: "เข้าสู่ระบบเพื่อลงคะแนน", sub: "SIGN IN", action: "signin", disabled: false };

  const meta = verdureMeta(globalConfig);
  const numberPart = String(meta.num);
  const sysMode = initialData?.systemMode || "AUTO";

  const realParties = (initialData?.candidates || []).filter((c) => c.number > 0);
  const partyCount = realParties.length || (editorMode ? 2 : 0);
  const deckText = String(getText("hero-subtitle", meta.campaign) ?? meta.campaign);

  const onCta = (e) => {
    if (editorMode || CTA.disabled) { e.preventDefault(); return; }
    if (CTA.action === "signin") { e.preventDefault(); verdureSignIn(); }
  };

  return (
    <div className="fms-app vd-root">
      {tokenStylesCss && <style dangerouslySetInnerHTML={{ __html: tokenStylesCss }} />}
      {!editorMode && <style>{"html,body{background:#F4ECDB;color-scheme:light}"}</style>}

      <VerdureChrome active="home" editorMode={editorMode} systemMode={sysMode}
        edge={{ num: "01", label: "Index", th: "หน้าหลัก" }} />

      <div className="vd-home">
        <div className="vd-home__above">
          <span className="side side--l">EST. {meta.founded}</span>
          <span className="mid">{meta.tagline}</span>
          <span className="side side--r">VOL. {numberPart} / {meta.cy}</span>
        </div>

        <div className="vd-home__hero">
          <Wrap id="hero-title"><div className="vd-home__samo">{meta.samoSpaced}</div></Wrap>

          <VerdureSeal num={numberPart} ordSuffix={meta.ordSuffix} faculty={meta.faculty} cy={meta.cy} prefix={meta.prefix} />

          <Wrap id="voteCTA-button">
            <a href={editorMode || CTA.action === "signin" ? undefined : getPath(CTA.href || "/login")}
              onClick={onCta} className={`vd-home__cta ${CTA.disabled ? "is-disabled" : ""}`} role="button">
              <span className="vd-home__cta-label">{CTA.label}</span>
              <span className="vd-home__cta-sub">{CTA.sub}</span>
            </a>
          </Wrap>
          <a href={editorMode ? undefined : getPath("/candidates")} className="vd-home__secondary">ดูรายชื่อผู้สมัคร <span aria-hidden>↗</span></a>
        </div>

        <Wrap id="hero-subtitle">
          <p className="vd-home__deck">{deckText} <em>{meta.org}</em> ประจำปีการศึกษา {meta.ay}</p>
        </Wrap>

        <div className="vd-home__ledger">
          <div className="vd-home__stat"><div className="lbl">VOTED · ใช้สิทธิ์</div><div className="val vd-tabular"><em>{fmtInt(rawStats.totalVoted)}</em><small>/ {fmtInt(rawStats.totalEligible)}</small></div></div>
          <span className="vd-home__ledger-sep" />
          <div className="vd-home__stat"><div className="lbl">TURNOUT · สัดส่วน</div><div className="val vd-tabular">{pct}<small>%</small></div></div>
          <span className="vd-home__ledger-sep" />
          <div className="vd-home__stat"><div className="lbl">CLOSES IN · ปิดใน</div><div className="val vd-tabular">{cd}</div></div>
          <span className="vd-home__ledger-sep" />
          <div className="vd-home__stat"><div className="lbl">PARTIES · พรรค</div><div className="val vd-tabular">{partyCount}</div></div>
        </div>
      </div>

      <style jsx global>{`
        .vd-home { flex:1; display:flex; flex-direction:column; align-items:center; padding:82px 40px 128px; max-width:1100px; margin:0 auto; width:100%; position:relative; z-index:1; }

        /* above-line — 3 equal columns so the centre line is DEAD centre regardless of side widths */
        .vd-home__above { width:100%; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; margin-bottom:22px; padding:0 8px; }
        .vd-home__above .side { font-family:var(--fm); font-size:11px; letter-spacing:.25em; text-transform:uppercase; color:var(--moss); opacity:.6; white-space:nowrap; }
        .vd-home__above .side--l { justify-self:start; }
        .vd-home__above .side--r { justify-self:end; }
        .vd-home__above .mid { justify-self:center; font-family:var(--fd); font-style:italic; font-size:18px; color:var(--terra); text-align:center; white-space:nowrap; }

        .vd-home__hero { display:flex; flex-direction:column; align-items:center; text-align:center; perspective:1100px; }
        .vd-home__samo { font-family:var(--fs); font-weight:800; font-size:clamp(24px,2.6vw,38px); letter-spacing:.32em; color:var(--moss); margin-bottom:14px; }

        /* ── the interactive seal ── */
        .vd-seal-wrap { display:grid; place-items:center; }
        .vd-seal { position:relative; width:clamp(290px,40vw,440px); height:clamp(290px,40vw,440px); display:grid; place-items:center; transform-style:preserve-3d; cursor:pointer; }
        .vd-seal__ring { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
        .vd-seal__ringtext { font-family:var(--fm); font-size:13px; letter-spacing:.3em; fill:var(--terra); opacity:.7; text-transform:uppercase; }
        .vd-seal__dash { position:absolute; inset:9%; border-radius:50%; border:1px dashed rgba(188,94,62,.45); pointer-events:none; }
        .vd-seal__disc { position:relative; width:80%; height:80%; border-radius:50%; background:radial-gradient(125% 125% at 32% 24%, #305041 0%, #1F3A2C 58%); color:var(--cream); display:grid; place-items:center; overflow:hidden; box-shadow:0 50px 70px -38px rgba(31,58,44,.55), inset 0 3px 12px rgba(244,236,219,.07), inset 0 -10px 30px rgba(0,0,0,.18); }
        .vd-seal__disc::before { content:""; position:absolute; inset:14px; border-radius:50%; border:1px dashed rgba(244,236,219,.22); pointer-events:none; }
        .vd-seal__sheen { position:absolute; inset:0; border-radius:50%; pointer-events:none; mix-blend-mode:screen; }
        .vd-home__disc-50 { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(150px,20vw,230px); line-height:.86; letter-spacing:-.04em; color:var(--cream); position:relative; }
        .vd-home__disc-ord { position:absolute; top:20%; right:17%; font-family:var(--fm); font-size:11px; letter-spacing:.22em; color:var(--terra-soft); text-transform:uppercase; transform:rotate(18deg); }

        /* PRIMARY ACTION — readable on hover (darker terracotta, NOT moss, so it never
           merges into the moss seal behind it) */
        .vd-home__cta { display:inline-flex; flex-direction:column; align-items:center; gap:2px; margin-top:-20px; position:relative; z-index:3; padding:17px 44px; border-radius:999px; background:var(--terra); color:var(--cream); border:1px solid var(--terra); box-shadow:0 16px 34px -14px rgba(188,94,62,.55); cursor:pointer; transition:transform .2s, background .2s, border-color .2s, box-shadow .2s; }
        .vd-home__cta:hover { background:var(--terra-2); border-color:var(--terra-2); transform:translateY(-2px); box-shadow:0 20px 40px -14px rgba(162,78,50,.6); }
        .vd-home__cta-label { font-family:var(--fs); font-weight:700; font-size:18px; letter-spacing:.01em; color:var(--cream); display:inline-flex; align-items:center; gap:11px; }
        .vd-home__cta-label::after { content:"→"; font-size:18px; }
        .vd-home__cta.is-disabled { background:var(--cream-3); color:var(--moss); border-color:var(--rule); box-shadow:none; cursor:not-allowed; }
        .vd-home__cta.is-disabled .vd-home__cta-label { color:var(--moss); }
        .vd-home__cta.is-disabled .vd-home__cta-label::after { content:"●"; opacity:.5; }
        .vd-home__cta-sub { font-family:var(--fm); font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--cream); opacity:.8; }
        .vd-home__cta.is-disabled .vd-home__cta-sub { color:var(--moss); opacity:.6; }
        .vd-home__secondary { margin-top:16px; font-family:var(--fm); font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--moss); opacity:.7; border-bottom:1px solid var(--rule); padding-bottom:2px; transition:opacity .2s, color .2s; }
        .vd-home__secondary:hover { opacity:1; color:var(--terra); }

        .vd-home__deck { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(19px,2vw,26px); line-height:1.3; color:var(--moss); margin:38px auto 0; max-width:680px; text-align:center; }
        .vd-home__deck em { color:var(--terra); }

        .vd-home__ledger { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:0 8px; margin-top:34px; padding-top:26px; border-top:1px solid var(--rule); width:100%; }
        .vd-home__stat { text-align:center; padding:0 22px; }
        .vd-home__stat .lbl { font-family:var(--fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--moss); opacity:.6; margin-bottom:6px; }
        .vd-home__stat .val { font-family:var(--fd); font-style:italic; font-weight:400; font-size:34px; line-height:1; letter-spacing:-.02em; color:var(--moss); }
        .vd-home__stat .val em { color:var(--terra); font-style:italic; }
        .vd-home__stat .val small { font-family:var(--fs); font-style:normal; font-size:13px; font-weight:500; color:var(--moss); opacity:.55; margin-left:5px; letter-spacing:0; }
        .vd-home__ledger-sep { width:1px; height:38px; background:var(--rule); }

        @media (max-width:1100px) {
          .vd-home { padding:76px 20px 116px; }
          .vd-home__above { grid-template-columns:1fr; justify-items:center; gap:4px; margin-bottom:16px; }
          .vd-home__above .side--l, .vd-home__above .side--r { justify-self:center; }
          .vd-home__deck { font-size:18px; }
        }
        @media (max-width:640px) {
          .vd-home__ledger { gap:18px 0; }
          .vd-home__stat { flex:0 0 50%; padding:0 8px; }
          .vd-home__ledger-sep { display:none; }
          .vd-home__cta { padding:15px 30px; }
          .vd-home__cta-label { font-size:16px; }
        }
      `}</style>
    </div>
  );
}
