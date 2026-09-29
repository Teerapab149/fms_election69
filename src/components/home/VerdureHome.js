"use client";

// VerdureHome — HOME for the Verdure template (cream paper, moss ink, DM Serif
// display, edge rails, the floating dock).
//
// The first screen answers the three questions a student arrives with — which
// election, which cohort, which year — in one centred title block:
//   "SAMO 50" / "โครงการเลือกตั้งคณะกรรมการบริหาร สโมสรนักศึกษาคณะวิทยาการจัดการ
//   ประจำปีการศึกษา 2570" / the date and polling hours
// then the two things to do: sign in / vote, or read the candidates first.
// Below: the turnout ledger, the parties standing (compact rows, linked to their
// pages), and how to vote in 3 steps — the student club teaches these on
// Instagram every year; the site now explains them itself.
//
// (Previously a moss medallion with the edition number — it said nothing a
// voter needed. The magazine-cover attempt that followed read as too formal.)
//
// ALL year/number/edition text derives from globalConfig via verdureMeta (Arabic
// digits only). Status, countdown and the CTA come from ONE useElectionStatus.

import { getPath } from "../../utils/basePath";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useSession } from "next-auth/react";
import VerdureChrome, { verdureSignIn, verdureMeta, verdureTheme, VerdureFooter } from "./VerdureChrome";
import EditorElement from "../admin/editor/EditorElement";
import { getBinding } from "../admin/editor/elementCatalog";
import { buildTemplateStyles } from "../../lib/templateTokens";
import { useGlobalConfig, useActiveTemplateId } from "../../contexts/GlobalConfigContext";
import { useVoteStatus } from "../../hooks/useVoteStatus";
import { useElectionStatus } from "../../hooks/useElectionStatus";

// useElectionStatus action → the voteCTA-button state vocabulary
const CTA_STATE = { signin: "login", vote: "notVoted", voted: "voted", wait: "closed", paused: "paused", results: "ended" };

// how a vote is cast, in the order a voter does it
const STEPS = [
  { t: "เข้าสู่ระบบด้วย PSU Passport", d: "ใช้บัญชีของมหาวิทยาลัย ระบบตรวจว่าคุณมีสิทธิ์ และบันทึกว่าคุณมาใช้สิทธิ์แล้ว" },
  { t: "อ่านนโยบาย แล้วเลือกหนึ่งช่อง", d: "เลือกพรรคที่สนับสนุน ไม่รับรอง หรืองดออกเสียง ได้ช่องเดียว แล้วกดยืนยัน" },
  { t: "บัตรถูกเก็บแบบไม่มีชื่อ", d: "บัตรถูกเข้ารหัสและเก็บแยกจากชื่อคุณ ไม่มีใครย้อนดูได้ว่าใครเลือกอะไร ผลคะแนนเปิดหลังปิดหีบ" },
];

const EASE = [0.16, 1, 0.3, 1];
const src = (p) => (!p ? null : String(p).startsWith("http") ? p : getPath(p));

// Spot illustrations for the three steps — the kind a magazine runs beside a
// how-to: thin moss ink, one terracotta accent, drawn in once as they scroll
// into view. 1 sign in on a phone · 2 one box marked on the ballot · 3 the
// ballot folded into a sealed envelope, no name on it.
function StepArt({ k, still }) {
  const draw = (d = 0) => (still
    ? { initial: false }
    : { initial: { pathLength: 0, opacity: 0 }, whileInView: { pathLength: 1, opacity: 1 }, viewport: { once: true, margin: "-60px" },
        transition: { pathLength: { duration: 0.9, ease: EASE, delay: d }, opacity: { duration: 0.2, delay: d } } });
  const pop = (d = 0) => (still
    ? { initial: false }
    : { initial: { scale: 0, opacity: 0 }, whileInView: { scale: 1, opacity: 1 }, viewport: { once: true, margin: "-60px" },
        transition: { duration: 0.45, ease: EASE, delay: d } });
  return (
    <svg className="vd-art" viewBox="0 0 140 100" aria-hidden>
      {k === 0 && (
        <>
          <motion.rect x="46" y="8" width="48" height="84" rx="9" {...draw(0)} />
          <motion.path d="M63 16 H77" {...draw(0.2)} />
          <motion.circle cx="70" cy="40" r="9" {...draw(0.3)} />
          <motion.path d="M56 63 Q70 49 84 63" {...draw(0.4)} />
          <motion.rect x="55" y="70" width="30" height="10" rx="5" className="acc" {...draw(0.55)} />
          <motion.g style={{ transformOrigin: "100px 20px", transformBox: "view-box" }} {...pop(0.8)}>
            <circle cx="100" cy="20" r="10" className="fill" />
            <path d="M95 20 L99 24 L106 16" className="on-fill" />
          </motion.g>
        </>
      )}
      {k === 1 && (
        <>
          <motion.rect x="32" y="10" width="76" height="82" rx="4" {...draw(0)} />
          {[24, 46, 68].map((y, i) => (
            <g key={y}>
              <motion.rect x="42" y={y} width="13" height="13" rx="2" {...draw(0.2 + i * 0.1)} />
              <motion.path d={`M63 ${y + 6.5} H${i === 1 ? 96 : 90}`} {...draw(0.3 + i * 0.1)} />
            </g>
          ))}
          <motion.path d="M44 48 L53 57 M53 48 L44 57" className="mark" {...draw(0.8)} />
        </>
      )}
      {k === 2 && (
        <>
          <motion.path d="M50 40 V14 H90 V40" {...draw(0)} />
          <motion.path d="M58 22 H82 M58 30 H76" {...draw(0.15)} />
          <motion.rect x="26" y="38" width="88" height="54" rx="4" {...draw(0.3)} />
          <motion.path d="M26 38 L70 70 L114 38" {...draw(0.45)} />
          <motion.g style={{ transformOrigin: "70px 70px", transformBox: "view-box" }} {...pop(0.9)}>
            <circle cx="70" cy="70" r="10" className="fill" />
            <path d="M66 70 V67 A4 4 0 0 1 74 67 V70 M64.5 70 H75.5 V77 H64.5 Z" className="on-fill" />
          </motion.g>
        </>
      )}
    </svg>
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
  const reduce = useReducedMotion();

  useEffect(() => { setMounted(true); }, []);

  // ONE status for the whole page — the corner chip, the ledger and the CTA
  // (rule 6: the same source every v2 template uses).
  const signedIn = !editorMode && status === "authenticated" && !!session?.user;
  const election = useElectionStatus({
    globalConfig,
    systemMode: initialData?.systemMode || initialData?.systemConfig?.systemMode || "AUTO",
    isSystemOpen: editorMode ? true
      : initialData?.isSystemOpen ?? initialData?.systemConfig?.isSystemOpen ?? initialData?.electionStatus === "ONGOING",
    electionStatus: editorMode ? "ONGOING" : initialData?.electionStatus,
    signedIn,
    isVoted: !!(isVotedReal ?? initialData?.userData?.isVoted),
    tick: !editorMode,
  });

  // The ledger's countdown, from that status. `days` stays OUT of `value`: as
  // one string the ledger rendered "26 วัน10:32:34" (the Thai "น" and the clock's
  // "1" leave no ink gap); separate spans let CSS own the separation.
  const p2 = (n) => String(n).padStart(2, "0");
  const rem = election.remaining;
  const cd = election.target && rem
    ? {
        labelEn: election.target.kind === "opens" ? "OPENS IN" : "CLOSES IN",
        labelTh: election.target.kind === "opens" ? "เปิดใน" : "ปิดใน",
        days: rem.d, value: `${p2(rem.h)}:${p2(rem.m)}:${p2(rem.s)}`,
      }
    : election.phase === "paused" ? { labelEn: "STATUS", labelTh: "สถานะ", days: 0, value: "หยุดชั่วคราว" }
    : election.phase === "open" ? { labelEn: "STATUS", labelTh: "สถานะ", days: 0, value: "เปิดอยู่" }
    : election.phase === "before" ? { labelEn: "STATUS", labelTh: "สถานะ", days: 0, value: "ยังไม่เปิด" }
    : { labelEn: "CLOSES IN", labelTh: "ปิดใน", days: 0, value: "ปิดแล้ว" };

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

  // the CTA follows the same status as the chip and the ledger
  const voteState = editorMode ? "login" : (CTA_STATE[election.action] || "login");
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

  const parties = (initialData?.candidates || []).filter((c) => c.number > 0).sort((a, b) => a.number - b.number);
  const partyCount = parties.length || (editorMode ? 2 : 0);
  const deckText = String(getText("hero-subtitle", meta.campaign) ?? meta.campaign);
  const href = (h) => (editorMode ? undefined : getPath(h));
  // "9 FEB 2027" — the same register as "VOL. 50 / 2027" on the other side
  // (months spelled out here: en-GB's "short" month is "Sept", not "SEP")
  const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const votingDay = election.start instanceof Date && !isNaN(election.start.getTime())
    ? (() => {
        const parts = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "numeric", year: "numeric", timeZone: "Asia/Bangkok" }).formatToParts(election.start);
        const get = (t) => parts.find((x) => x.type === t)?.value;
        return `${Number(get("day"))} ${MON[Number(get("month")) - 1]} ${get("year")}`;
      })()
    : "";

  const onCta = (e) => {
    if (editorMode || CTA.disabled) { e.preventDefault(); return; }
    if (CTA.action === "signin") { e.preventDefault(); onSignIn ? onSignIn() : verdureSignIn(); }
  };

  // one orchestrated entrance for the title block; still in the editor and for
  // people who asked for less motion
  const still = editorMode || !!reduce;
  const rise = (d) => (still ? { initial: false } : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: EASE, delay: d } });

  return (
    <div className="fms-app vd-root">
      {tokenStylesCss && <style dangerouslySetInnerHTML={{ __html: tokenStylesCss }} />}
      {!editorMode && <style>{`html,body{background:${themeT.cream};color-scheme:light}`}</style>}

      <VerdureChrome active="home" editorMode={editorMode} systemMode={sysMode} election={election}
        edge={{ num: "01", label: "Home", th: "หน้าหลัก" }} />

      <div className="vd-home">
        <div className="vd-home__above">
          {/* the polling day, from the configured schedule — it used to read
              "EST. 1978", a founding year computed as (year − edition + 1) that
              no one had set and no voter needed */}
          <span className="side side--l">VOTING · {votingDay}</span>
          <span className="mid">{meta.tagline}</span>
          <span className="side side--r">VOL. {numberPart} / {meta.cy}</span>
        </div>

        {/* which election, which cohort, which year — the first thing anyone sees */}
        <section className="vd-hero">
          <Wrap id="hero-title">
            <motion.h1 className="vd-hero__title" {...rise(0.05)}>
              {meta.prefix} <em>{numberPart}</em>
            </motion.h1>
          </Wrap>
          <motion.span className="vd-hero__rule" aria-hidden {...rise(0.12)}>❦</motion.span>
          <Wrap id="hero-subtitle">
            <motion.p className="vd-hero__deck" {...rise(0.18)}>
              {deckText} <span className="org">{meta.org}</span> <span className="vd-nowrap">ประจำปีการศึกษา {meta.ay}</span>
            </motion.p>
          </Wrap>
          <motion.p className="vd-hero__date" {...rise(0.26)}>{election.dateLine}</motion.p>

          <motion.div className="vd-hero__acts" {...rise(0.34)}>
            <Wrap id="voteCTA-button">
              <a href={editorMode || CTA.action === "signin" ? undefined : getPath(CTA.href || "/login")}
                onClick={onCta} className={`vd-home__cta ${CTA.disabled ? "is-disabled" : ""}`} role="button">
                <span className="vd-home__cta-label">{CTA.label}</span>
                <span className="vd-home__cta-sub">{CTA.sub}</span>
              </a>
            </Wrap>
            <a href={href("/candidates")} className="vd-hero__alt">
              <span className="vd-hero__alt-label">ดูผู้สมัครและนโยบาย</span>
              <span className="vd-hero__alt-sub">CANDIDATES · {partyCount} {partyCount === 1 ? "PARTY" : "PARTIES"}</span>
            </a>
          </motion.div>
        </section>

        <Wrap id="stats-progress-card">
          <div className="vd-home__ledger">
            <div className="vd-home__stat"><div className="lbl"><span className="vd-nw">VOTED</span> · <span className="vd-thai">ใช้สิทธิ์</span></div><div className="val vd-tabular"><em>{fmtInt(rawStats.totalVoted)}</em><small>/ {fmtInt(rawStats.totalEligible)}</small></div></div>
            <span className="vd-home__ledger-sep" />
            <div className="vd-home__stat"><div className="lbl"><span className="vd-nw">TURNOUT</span> · <span className="vd-thai">สัดส่วน</span></div><div className="val vd-tabular">{pct}<small>%</small></div></div>
            <span className="vd-home__ledger-sep" />
            <div className="vd-home__stat vd-home__stat--cd"><div className="lbl"><span className="vd-nw">{cd.labelEn}</span> · <span className="vd-thai">{cd.labelTh}</span></div><div className="val vd-tabular">{cd.days > 0 && <span className="d">{cd.days} วัน</span>}{cd.value}</div></div>
            <span className="vd-home__ledger-sep" />
            <div className="vd-home__stat"><div className="lbl"><span className="vd-nw">PARTIES</span> · <span className="vd-thai">พรรค</span></div><div className="val vd-tabular">{partyCount}</div></div>
          </div>
        </Wrap>

        {/* the parties standing — an index, one line per party, so two, three or
            four parties read the same way (a two-up grid ran down the page) */}
        {parties.length > 0 && (
          <section className="vd-sec" aria-labelledby="vd-parties-h">
            <div className="vd-sec__head">
              <h2 id="vd-parties-h">ผู้สมัคร <em>{parties.length} พรรค</em></h2>
              <a href={href("/candidates")} className="vd-sec__more">ดูนโยบายทั้งหมด <span aria-hidden>→</span></a>
            </div>
            <ul className="vd-parties">
              {parties.map((p) => (
                <li key={p.id ?? p.number}>
                  <a href={href(`/party?id=${p.number}`)} className="vd-party">
                    <span className="vd-party__logo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.logoUrl ? <img src={src(p.logoUrl)} alt="" /> : <b>{p.number}</b>}
                    </span>
                    <span className="vd-party__id">
                      <span className="vd-party__no">เบอร์ {p.number}</span>
                      <span className="vd-party__name">{p.name}</span>
                    </span>
                    {p.slogan && <span className="vd-party__slogan">“{p.slogan}”</span>}
                    <span className="vd-party__go" aria-hidden>→</span>
                  </a>
                </li>
              ))}
            </ul>
            {/* one party standing is a different vote: approve it or not */}
            {parties.length === 1 && (
              <p className="vd-parties__note">มีพรรคเดียวที่ลงสมัคร ในบัตรเลือกได้ว่าจะ <b>รับรอง</b> <b>ไม่รับรอง</b> หรือ <b>งดออกเสียง</b></p>
            )}
          </section>
        )}

        {/* how to vote — what the club otherwise posts on Instagram */}
        <section className="vd-sec" aria-labelledby="vd-steps-h">
          <div className="vd-sec__head">
            <h2 id="vd-steps-h">ลงคะแนนใน <em>3 ขั้นตอนง่ายๆ</em></h2>
          </div>
          <ol className="vd-steps">
            {STEPS.map((s, i) => (
              <li key={s.t}>
                <StepArt k={i} still={still} />
                <span className="vd-steps__no">{p2(i + 1)}</span>
                <b>{s.t}</b>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <VerdureFooter />

      <style jsx global>{`
        /* padding-top 82 is NOT slack: the cornermark chip and the status pill are
           fixed at the top corners and end at y70, and this row's side labels sit
           just inside their horizontal span. */
        .vd-home { flex:1; display:flex; flex-direction:column; align-items:center; padding:82px 40px 128px; max-width:1100px; margin:0 auto; width:100%; position:relative; z-index:1; }
        .vd-nowrap { white-space:nowrap; }

        /* above-line — 3 equal columns so the centre line is DEAD centre regardless of side widths */
        .vd-home__above { width:100%; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; margin-bottom:16px; padding:0 8px; }
        .vd-home__above .side { font-family:var(--fm); font-size:11px; letter-spacing:.25em; text-transform:uppercase; color:var(--moss); opacity:.6; white-space:nowrap; }
        .vd-home__above .side--l { justify-self:start; }
        .vd-home__above .side--r { justify-self:end; }
        .vd-home__above .mid { justify-self:center; font-family:var(--fd); font-style:italic; font-size:18px; color:var(--terra); text-align:center; white-space:nowrap; }

        /* ── the title block ── */
        .vd-hero { display:flex; flex-direction:column; align-items:center; text-align:center; padding:clamp(28px,6vh,64px) 0 0; }
        .vd-hero__title { margin:0; font-family:var(--fd); font-weight:400; font-size:clamp(84px,12vw,168px); line-height:.9; letter-spacing:-.03em; color:var(--moss); white-space:nowrap; }
        .vd-hero__title em { font-style:italic; color:var(--terra); }
        .vd-hero__rule { margin:14px 0 10px; font-size:22px; color:var(--terra); opacity:.7; }
        .vd-hero__deck { margin:0; max-width:820px; font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(22px,2.4vw,30px); line-height:1.35; color:var(--moss); text-wrap:balance; }
        .vd-hero__deck .org { color:var(--terra); }
        .vd-hero__date { margin:14px 0 0; font-family:var(--ft); font-size:16px; color:var(--moss); opacity:.75; }

        .vd-hero__acts { display:flex; flex-wrap:wrap; justify-content:center; align-items:stretch; gap:14px; margin-top:30px; }
        /* PRIMARY ACTION — readable on hover (darker terracotta, never moss) */
        .vd-home__cta { display:inline-flex; flex-direction:column; justify-content:center; align-items:center; gap:2px; height:100%; min-height:66px; position:relative; z-index:3; padding:14px 40px; border-radius:999px; background:var(--cta); color:var(--cta-text); border:1px solid var(--cta); box-shadow:0 16px 34px -14px rgba(var(--terra-rgb),.55); cursor:pointer; transition:transform .2s, background .2s, border-color .2s, box-shadow .2s; }
        .vd-home__cta:hover { background:var(--cta-2); border-color:var(--cta-2); transform:translateY(-2px); box-shadow:0 20px 40px -14px rgba(var(--terra-rgb),.6); }
        .vd-home__cta-label { font-family:var(--fs); font-weight:700; font-size:18px; letter-spacing:.01em; color:var(--cta-text); display:inline-flex; align-items:center; gap:11px; }
        .vd-home__cta-label::after { content:"→"; font-size:18px; }
        .vd-home__cta.is-disabled { background:var(--cream-3); color:var(--moss); border-color:var(--rule); box-shadow:none; cursor:not-allowed; }
        .vd-home__cta.is-disabled .vd-home__cta-label { color:var(--moss); }
        .vd-home__cta.is-disabled .vd-home__cta-label::after { content:"●"; opacity:.5; }
        .vd-home__cta-sub { font-family:var(--fm); font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--cta-text); opacity:.8; }
        .vd-home__cta.is-disabled .vd-home__cta-sub { color:var(--moss); opacity:.6; }
        /* the second action: read the candidates first — a real button, not a footnote */
        /* "a." prefixes: Verdure's base rule .vd-root a:not(.vd-btn){color:inherit}
           is (0,2,1) — a bare class loses to it, which left the hover state moss
           text on a moss fill (unreadable). */
        .vd-root a.vd-hero__alt { display:inline-flex; flex-direction:column; justify-content:center; align-items:center; gap:2px; min-height:66px; padding:14px 34px; border-radius:999px; border:1.5px solid var(--moss); color:var(--moss); transition:background .2s, color .2s; }
        .vd-root a.vd-hero__alt:hover { background:var(--moss); color:var(--cream); }
        .vd-hero__alt-label { font-family:var(--fs); font-weight:700; font-size:18px; }
        .vd-hero__alt-sub { font-family:var(--fm); font-size:9px; letter-spacing:.2em; text-transform:uppercase; opacity:.7; }

        .vd-home__ledger { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:0 8px; margin-top:clamp(44px,8vh,80px); padding-top:26px; border-top:1px solid var(--rule); width:100%; }
        .vd-home__stat { text-align:center; padding:0 22px; }
        .vd-home__stat .lbl { font-family:var(--fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--moss); opacity:.6; margin-bottom:6px; }
        .vd-home__stat .val { font-family:var(--fd); font-style:italic; font-weight:400; font-size:34px; line-height:1; letter-spacing:-.02em; color:var(--moss); }
        .vd-home__stat .val em { color:var(--terra); font-style:italic; }
        .vd-home__stat .val small { font-family:var(--fs); font-style:normal; font-size:13px; font-weight:500; color:var(--moss); opacity:.55; margin-left:5px; letter-spacing:0; }
        .vd-home__stat .val .d { margin-right:.36em; }
        .vd-home__ledger-sep { width:1px; height:38px; background:var(--rule); }

        /* ── sections: parties, steps ── */
        .vd-sec { width:100%; margin-top:80px; }
        .vd-sec__head { display:flex; align-items:baseline; justify-content:space-between; gap:10px 24px; flex-wrap:wrap; padding-bottom:12px; border-bottom:2px solid var(--moss); }
        .vd-sec__head h2 { margin:0; font-family:var(--fd); font-weight:400; font-size:clamp(30px,3.4vw,42px); line-height:1.1; color:var(--moss); letter-spacing:-.015em; }
        .vd-sec__head h2 em { font-style:italic; color:var(--terra); }
        .vd-root a.vd-sec__more { font-family:var(--fs); font-weight:700; font-size:15px; color:var(--terra); border-bottom:1.5px solid currentColor; padding-bottom:1px; }
        .vd-root a.vd-sec__more:hover { color:var(--moss); }

        /* the parties as an index: one line each — logo, number + name, slogan, arrow */
        .vd-parties { list-style:none; margin:0; padding:0; }
        .vd-parties li { border-bottom:1px solid var(--rule); }
        .vd-root a.vd-party { display:grid; grid-template-columns:52px minmax(0,1.1fr) minmax(0,1fr) 28px; align-items:center; gap:20px; padding:16px 0; color:var(--moss); transition:background .2s; }
        .vd-root a.vd-party:hover { background:rgba(var(--moss-rgb),.04); }
        .vd-party__logo { width:52px; height:52px; border-radius:50%; overflow:hidden; background:var(--cream-2); border:1px solid var(--rule); display:grid; place-items:center; }
        .vd-party__logo img { width:100%; height:100%; object-fit:contain; }
        .vd-party__logo b { font-family:var(--fd); font-style:italic; font-size:24px; color:var(--terra); }
        .vd-party__id { display:flex; flex-direction:column; min-width:0; }
        .vd-party__no { font-family:var(--ft); font-size:13px; font-weight:600; color:var(--terra); }
        .vd-party__name { font-family:var(--fd); font-size:24px; line-height:1.25; }
        .vd-party__slogan { font-family:var(--fd); font-style:italic; font-size:17px; line-height:1.45; opacity:.72; }
        .vd-party__go { font-size:20px; color:var(--terra); transition:transform .2s; justify-self:end; }
        .vd-root a.vd-party:hover .vd-party__name { color:var(--terra); }
        .vd-root a.vd-party:hover .vd-party__go { transform:translateX(4px); }
        .vd-parties__note { margin:14px 0 0; font-family:var(--ft); font-size:15px; color:var(--moss); opacity:.8; }
        .vd-parties__note b { color:var(--terra); font-weight:600; }

        .vd-steps { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0 36px; }
        .vd-steps li { padding:26px 0 8px; }
        /* spot illustrations: moss ink, one terracotta accent */
        .vd-art { display:block; width:140px; height:100px; margin:0 0 10px -6px; overflow:visible; }
        .vd-art rect, .vd-art path, .vd-art circle { fill:none; stroke:var(--moss); stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
        .vd-art .acc { stroke:var(--terra); fill:rgba(var(--terra-rgb),.12); }
        .vd-art .mark { stroke:var(--terra); stroke-width:3; }
        .vd-art .fill { fill:var(--terra); stroke:none; }
        .vd-art .on-fill { stroke:var(--cream); stroke-width:1.8; fill:none; }
        /* the steps really are a sequence, so they carry their numbers */
        .vd-steps__no { display:block; font-family:var(--fd); font-style:italic; font-size:52px; line-height:1; color:var(--terra); letter-spacing:-.03em; }
        .vd-steps b { display:block; margin-top:10px; font-family:var(--fd); font-weight:400; font-size:23px; line-height:1.3; color:var(--moss); }
        .vd-steps p { margin:8px 0 0; font-family:var(--ft); font-size:15.5px; line-height:1.7; color:var(--moss); opacity:.78; }

        @media (max-width:1100px) {
          .vd-home { padding:76px 20px 116px; }
          .vd-home__above { grid-template-columns:1fr; justify-items:center; gap:4px; margin-bottom:16px; }
          .vd-home__above .side--l, .vd-home__above .side--r { justify-self:center; }
        }
        @media (max-width:860px) {
          /* the slogan drops under the name — the index stays one row per party */
          .vd-root a.vd-party { grid-template-columns:48px minmax(0,1fr) 22px; gap:14px; }
          .vd-party__logo { width:48px; height:48px; grid-row:1 / span 2; }
          .vd-party__slogan { grid-column:2; grid-row:2; font-size:15px; margin-top:-6px; }
          .vd-party__go { grid-column:3; grid-row:1 / span 2; }
          .vd-steps { grid-template-columns:minmax(0,1fr); }
          .vd-steps li { display:grid; grid-template-columns:96px minmax(0,1fr); column-gap:16px; align-items:start; padding:18px 0; border-bottom:1px solid var(--rule); }
          .vd-art { grid-row:span 3; width:96px; height:70px; margin:0; }
          .vd-steps__no { font-size:30px; }
          .vd-steps b { margin-top:2px; }
        }
        @media (max-width:640px) {
          .vd-hero { padding-top:12px; }
          .vd-hero__title { font-size:clamp(68px,22vw,96px); }
          .vd-hero__deck { font-size:20px; }
          .vd-hero__date { font-size:14.5px; }
          .vd-hero__acts { flex-direction:column; width:100%; gap:10px; margin-top:24px; }
          .vd-home__cta, .vd-hero__alt { width:100%; min-height:58px; padding:12px 24px; }
          .vd-home__cta-label, .vd-hero__alt-label { font-size:16px; }
          .vd-home__ledger { gap:18px 0; margin-top:36px; }
          .vd-home__stat { flex:0 0 50%; padding:0 8px; }
          /* the countdown cannot live in a half-width cell: "22 วัน 18:33:10" is
             ~280px at 34px, so it gets its own row and never wraps mid-value */
          .vd-home__stat--cd { flex:0 0 100%; }
          .vd-home__stat--cd .val { white-space:nowrap; }
          .vd-home__ledger-sep { display:none; }
          .vd-sec { margin-top:56px; }
          .vd-party__name { font-size:20px; }
          .vd-steps b { font-size:20px; }
          .vd-steps p { font-size:14.5px; }
        }
      `}</style>
    </div>
  );
}
