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
import VerdureChrome, { verdureSignIn, verdureMeta, verdureTheme, VerdureFooter } from "./VerdureChrome";
import EditorElement from "../admin/editor/EditorElement";
import { resolveElementState, buildRuntimeContext } from "../admin/editor/stateResolver";
import { getBinding } from "../admin/editor/elementCatalog";
import { buildTemplateStyles } from "../../lib/templateTokens";
import { useGlobalConfig, useActiveTemplateId } from "../../contexts/GlobalConfigContext";
import { useVoteStatus } from "../../hooks/useVoteStatus";
import { resolveElectionDates } from "../../utils/electionConfig";

// ── the interactive wax seal ──
function VerdureSeal({ num, ordSuffix, faculty, cy, prefix }) {
  const px = useMotionValue(0), py = useMotionValue(0);
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 16 });
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 16 });
  const sheenX = useTransform(px, [-0.5, 0.5], ["28%", "72%"]);
  const sheenY = useTransform(py, [-0.5, 0.5], ["26%", "74%"]);
  const sheen = useMotionTemplate`radial-gradient(circle at ${sheenX} ${sheenY}, rgba(var(--cream-rgb),.22), rgba(var(--cream-rgb),0) 55%)`;

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
  // Optional sign-in override (playground): the login CTA calls this instead of
  // verdureSignIn() (next-auth). Absent = byte-identical live behaviour.
  onSignIn = null,
}) {
  const { data: session, status } = useSession();
  const globalConfig = useGlobalConfig();
  const [mounted, setMounted] = useState(false);
  const { isVoted: isVotedReal } = useVoteStatus({ enabled: !editorMode && status === "authenticated" });

  useEffect(() => { setMounted(true); }, []);

  // Phase-aware countdown: before open → count to START ("OPENS IN"); during →
  // count to END ("CLOSES IN"); after → "ปิดแล้ว". A day segment prefixes the
  // clock when >0 day remains so a multi-day gap doesn't render as "946:12:33".
  // `days` is kept OUT of `value` on purpose: as one string the ledger rendered
  // "26 วัน10:32:34" — the ink gap between the Thai "น" and the clock's "1"
  // collapsed (the plain space advances only 6.8px at 34px, and the display
  // face's -.02em tracking eats what is left). Separate spans let CSS own the
  // separation instead of a glyph. See `.vd-home__stat .val .d` below.
  const [cd, setCd] = useState({ labelEn: "CLOSES IN", labelTh: "ปิดใน", days: 0, value: "--:--:--" });
  useEffect(() => {
    const { ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);
    const fmt = (diff) => {
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24), m = Math.floor((diff / 60000) % 60), s = Math.floor((diff / 1000) % 60);
      const p = (n) => String(n).padStart(2, "0");
      return { days: d, value: `${p(h)}:${p(m)}:${p(s)}` };
    };
    const tick = () => {
      const now = Date.now();
      const start = ELECTION_START instanceof Date ? ELECTION_START.getTime() : NaN;
      const end = ELECTION_END instanceof Date ? ELECTION_END.getTime() : NaN;
      if (!isNaN(start) && now < start) { setCd({ labelEn: "OPENS IN", labelTh: "เปิดใน", ...fmt(start - now) }); return; }
      if (!isNaN(end) && now < end) { setCd({ labelEn: "CLOSES IN", labelTh: "ปิดใน", ...fmt(end - now) }); return; }
      setCd({ labelEn: "CLOSES IN", labelTh: "ปิดใน", days: 0, value: "ปิดแล้ว" });
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

  // active colour theme — read BEFORE the !mounted guard so the hook order is
  // stable (it's the body-canvas paint; see below)
  const activeTemplateId = useActiveTemplateId();

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
  // body canvas sits outside .vd-root → paint it with the active theme's cream
  const themeT = verdureTheme(activeTemplateId);
  const numberPart = String(meta.num);
  const sysMode = initialData?.systemMode || "AUTO";

  const realParties = (initialData?.candidates || []).filter((c) => c.number > 0);
  const partyCount = realParties.length || (editorMode ? 2 : 0);
  const deckText = String(getText("hero-subtitle", meta.campaign) ?? meta.campaign);

  const onCta = (e) => {
    if (editorMode || CTA.disabled) { e.preventDefault(); return; }
    if (CTA.action === "signin") { e.preventDefault(); onSignIn ? onSignIn() : verdureSignIn(); }
  };

  return (
    <div className="fms-app vd-root">
      {tokenStylesCss && <style dangerouslySetInnerHTML={{ __html: tokenStylesCss }} />}
      {!editorMode && <style>{`html,body{background:${themeT.cream};color-scheme:light}`}</style>}

      <VerdureChrome active="home" editorMode={editorMode} systemMode={sysMode}
        edge={{ num: "01", label: "Home", th: "หน้าหลัก" }} />

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
          <a href={editorMode ? undefined : getPath("/candidates")} className="vd-home__secondary"><span className="vd-thai">ดูรายชื่อผู้สมัคร</span> <span aria-hidden>↗</span></a>
        </div>

        <Wrap id="hero-subtitle">
          <p className="vd-home__deck">{deckText} <em>{meta.org}</em> ประจำปีการศึกษา {meta.ay}</p>
        </Wrap>

        <div className="vd-home__ledger">
          <div className="vd-home__stat"><div className="lbl"><span className="vd-nw">VOTED</span> · <span className="vd-thai">ใช้สิทธิ์</span></div><div className="val vd-tabular"><em>{fmtInt(rawStats.totalVoted)}</em><small>/ {fmtInt(rawStats.totalEligible)}</small></div></div>
          <span className="vd-home__ledger-sep" />
          <div className="vd-home__stat"><div className="lbl"><span className="vd-nw">TURNOUT</span> · <span className="vd-thai">สัดส่วน</span></div><div className="val vd-tabular">{pct}<small>%</small></div></div>
          <span className="vd-home__ledger-sep" />
          <div className="vd-home__stat vd-home__stat--cd"><div className="lbl"><span className="vd-nw">{cd.labelEn}</span> · <span className="vd-thai">{cd.labelTh}</span></div><div className="val vd-tabular">{cd.days > 0 && <span className="d">{cd.days} วัน</span>}{cd.value}</div></div>
          <span className="vd-home__ledger-sep" />
          <div className="vd-home__stat"><div className="lbl"><span className="vd-nw">PARTIES</span> · <span className="vd-thai">พรรค</span></div><div className="val vd-tabular">{partyCount}</div></div>
        </div>
      </div>

      <VerdureFooter />

      <style jsx global>{`
        /* padding-top 82 is NOT slack: the cornermark chip and the status pill are
           fixed at the top corners and end at y70, and this row's side labels sit
           just inside their horizontal span. Trimming it to 64 put "EST. 1978"
           straight through the logo — measured 1px of overlap at 1440 and 17px at
           1366, where the right label hit the status pill too. Take height from the
           seal instead; never from here. */
        .vd-home { flex:1; display:flex; flex-direction:column; align-items:center; padding:82px 40px 128px; max-width:1100px; margin:0 auto; width:100%; position:relative; z-index:1; }

        /* above-line — 3 equal columns so the centre line is DEAD centre regardless of side widths */
        .vd-home__above { width:100%; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; margin-bottom:16px; padding:0 8px; }
        .vd-home__above .side { font-family:var(--fm); font-size:11px; letter-spacing:.25em; text-transform:uppercase; color:var(--moss); opacity:.6; white-space:nowrap; }
        .vd-home__above .side--l { justify-self:start; }
        .vd-home__above .side--r { justify-self:end; }
        .vd-home__above .mid { justify-self:center; font-family:var(--fd); font-style:italic; font-size:18px; color:var(--terra); text-align:center; white-space:nowrap; }

        .vd-home__hero { display:flex; flex-direction:column; align-items:center; text-align:center; perspective:1100px; }
        /* the tracking is what makes this read as a stamped wordmark, but it also
           pushes the whole line right by one full space — nudge it back so the
           optical centre matches the seal's geometric centre below it */
        .vd-home__samo { font-family:var(--fs); font-weight:800; font-size:clamp(24px,2.6vw,38px); letter-spacing:.32em; text-indent:.32em; color:var(--moss); margin-bottom:10px; }

        /* ── the interactive seal ── */
        .vd-seal-wrap { display:grid; place-items:center; }
        /* ONE variable drives the whole medallion. The numeral used to carry its own
           clamp(150px,20vw,230px), so shrinking the seal left it at 230 regardless:
           at a 310px disc it measured 71% of the diameter and at 1366 (248px disc)
           88% — wider than the inner ring, clipped by the disc's own overflow. That
           is the cramped look. Everything inside now scales from --seal, so the
           proportion cannot drift again the next time the seal is resized. */
        .vd-seal { --seal:clamp(290px,35vw,388px);
          position:relative; width:var(--seal); height:var(--seal); display:grid; place-items:center; transform-style:preserve-3d; cursor:pointer; }
        .vd-seal__ring { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
        .vd-seal__ringtext { font-family:var(--fm); font-size:13px; letter-spacing:.3em; fill:var(--terra); opacity:.7; text-transform:uppercase; }
        .vd-seal__dash { position:absolute; inset:9%; border-radius:50%; border:1px dashed rgba(var(--terra-rgb),.45); pointer-events:none; }
        .vd-seal__disc { position:relative; width:80%; height:80%; border-radius:50%; background:radial-gradient(125% 125% at 32% 24%, var(--moss-3) 0%, var(--moss) 58%); color:var(--cream); display:grid; place-items:center; overflow:hidden; box-shadow:0 50px 70px -38px rgba(var(--moss-rgb),.55), inset 0 3px 12px rgba(var(--cream-rgb),.07), inset 0 -10px 30px rgba(0,0,0,.18); }
        .vd-seal__disc::before { content:""; position:absolute; inset:14px; border-radius:50%; border:1px dashed rgba(var(--cream-rgb),.22); pointer-events:none; }
        .vd-seal__sheen { position:absolute; inset:0; border-radius:50%; pointer-events:none; mix-blend-mode:screen; }
        /* .5 of the seal = .625 of the disc, the proportion this medallion shipped
           with (230 inside a 352 disc) and the one the seal was designed around.
           Tied to --seal so it holds at every size. */
        .vd-home__disc-50 { font-family:var(--fd); font-style:italic; font-weight:400; font-size:calc(var(--seal) * .5); line-height:.86; letter-spacing:-.04em; color:var(--cream); position:relative; }
        /* the edition tag rode at right:17%, which put it ON the numeral once the
           numeral filled the disc (measured overlapping at every width). Pushed out
           to the quiet band between the numeral and the inner dashed ring, and
           scaled with the seal so it stays there. */
        .vd-home__disc-ord { position:absolute; top:17%; right:9%; font-family:var(--fm); font-size:calc(var(--seal) * .028); letter-spacing:.22em; color:var(--terra-soft); text-transform:uppercase; transform:rotate(18deg); }

        /* PRIMARY ACTION — readable on hover (darker terracotta, NOT moss, so it never
           merges into the moss seal behind it) */
        .vd-home__cta { display:inline-flex; flex-direction:column; align-items:center; gap:2px; margin-top:-20px; position:relative; z-index:3; padding:17px 44px; border-radius:999px; background:var(--cta); color:var(--cta-text); border:1px solid var(--cta); box-shadow:0 16px 34px -14px rgba(var(--terra-rgb),.55); cursor:pointer; transition:transform .2s, background .2s, border-color .2s, box-shadow .2s; }
        .vd-home__cta:hover { background:var(--cta-2); border-color:var(--cta-2); transform:translateY(-2px); box-shadow:0 20px 40px -14px rgba(var(--terra-rgb),.6); }
        .vd-home__cta-label { font-family:var(--fs); font-weight:700; font-size:18px; letter-spacing:.01em; color:var(--cta-text); display:inline-flex; align-items:center; gap:11px; }
        .vd-home__cta-label::after { content:"→"; font-size:18px; }
        .vd-home__cta.is-disabled { background:var(--cream-3); color:var(--moss); border-color:var(--rule); box-shadow:none; cursor:not-allowed; }
        .vd-home__cta.is-disabled .vd-home__cta-label { color:var(--moss); }
        .vd-home__cta.is-disabled .vd-home__cta-label::after { content:"●"; opacity:.5; }
        .vd-home__cta-sub { font-family:var(--fm); font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--cta-text); opacity:.8; }
        .vd-home__cta.is-disabled .vd-home__cta-sub { color:var(--moss); opacity:.6; }
        .vd-home__secondary { margin-top:16px; font-family:var(--fm); font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--moss); opacity:.7; border-bottom:1px solid var(--rule); padding-bottom:2px; transition:opacity .2s, color .2s; }
        .vd-home__secondary:hover { opacity:1; color:var(--terra); }

        /* balanced wrapping at a slightly tighter measure: at the old 680px this
           sentence ran one full line and left a short stub under it, which is what
           made the block read loose. 620 + balance gives two near-equal lines — and
           two lines, not three, is what keeps it clear of the dock. */
        .vd-home__deck { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(19px,2vw,26px); line-height:1.26; color:var(--moss); margin:22px auto 0; max-width:620px; text-align:center; text-wrap:balance; }
        .vd-home__deck em { color:var(--terra); }

        /* The break before the ledger scales with the viewport on purpose. The dock is
           a centred pill, so a ledger that lands in its band loses exactly the two
           middle figures (TURNOUT, OPENS IN) while the outer two stay readable — a
           half-covered row reads like a bug. Pushing the rule below the fold instead
           makes the first screen resolve as the seal alone and turns the ledger into
           something you scroll to, which is what the rest of the page already does. */
        .vd-home__ledger { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:0 8px; margin-top:clamp(34px,11vh,110px); padding-top:26px; border-top:1px solid var(--rule); width:100%; }
        .vd-home__stat { text-align:center; padding:0 22px; }
        .vd-home__stat .lbl { font-family:var(--fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--moss); opacity:.6; margin-bottom:6px; }
        .vd-home__stat .val { font-family:var(--fd); font-style:italic; font-weight:400; font-size:34px; line-height:1; letter-spacing:-.02em; color:var(--moss); }
        .vd-home__stat .val em { color:var(--terra); font-style:italic; }
        .vd-home__stat .val small { font-family:var(--fs); font-style:normal; font-size:13px; font-weight:500; color:var(--moss); opacity:.55; margin-left:5px; letter-spacing:0; }
        /* day segment of the countdown — a plain space between "วัน" and the clock
           advanced 6.8px but left almost no INK gap (Thai bowl ends flush, the
           display "1" starts flush), reading as "26 วัน10:32:34". Own margin. */
        .vd-home__stat .val .d { margin-right:.36em; }
        .vd-home__ledger-sep { width:1px; height:38px; background:var(--rule); }

        /* SHORT viewports — the laptop class (1366x768, 1024x760). Width-only rules
           cannot see these: at 1440x860 the composition already resolves above the
           floating dock, but with ~90px less height the identity line came to rest
           inside the dock's band. The seal gives back the difference; nothing else
           about the composition changes. */
        @media (min-width:901px) and (max-height:820px) {
          .vd-home__above { margin-bottom:12px; }
          .vd-seal { --seal:clamp(280px,28vw,310px); }
          .vd-home__deck { margin-top:18px; }
        }

        @media (max-width:1100px) {
          .vd-home { padding:76px 20px 116px; }
          .vd-home__above { grid-template-columns:1fr; justify-items:center; gap:4px; margin-bottom:16px; }
          .vd-home__above .side--l, .vd-home__above .side--r { justify-self:center; }
          .vd-home__deck { font-size:18px; }
        }
        @media (max-width:640px) {
          /* fixed break again on phones: the dock is nearly full-width here, so a
             viewport-scaled gap pushed the figures INTO its band instead of past it.
             Held tight, the whole ledger sits above the dock at rest. */
          .vd-home__ledger { gap:18px 0; margin-top:28px; }
          /* the base clamp bottoms out at 290px here, which is most of a phone's
             width; 62vw keeps the seal dominant while giving the second stat row
             the ~40px it needs to finish above the dock */
          .vd-seal { --seal:clamp(230px,62vw,290px); }
          .vd-home__stat { flex:0 0 50%; padding:0 8px; }
          /* the countdown is the one figure that cannot live in a half-width cell:
             "22 วัน 18:33:10" runs ~280px at 34px while the cell is ~170, so it
             wrapped mid-value and broke as "22" / "วัน 18:33:10" — the day count
             orphaned from its own unit. Its own full-width row gives it 372px and
             nowrap guarantees it stays one line even at the longest reading. */
          .vd-home__stat--cd { flex:0 0 100%; }
          .vd-home__stat--cd .val { white-space:nowrap; }
          .vd-home__ledger-sep { display:none; }
          .vd-home__cta { padding:15px 30px; }
          .vd-home__cta-label { font-size:16px; }
        }
      `}</style>
    </div>
  );
}
