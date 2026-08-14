"use client";

// FmsOfficialHome — HOME for the "FMS Official" template.
//
// Formal, faculty-branded, single-purpose. The page resolves top to bottom as
// one argument: this is the faculty's election → here is when it closes → here
// is how many have voted → vote. No carousel, no news grid, no tab stacks —
// those belong to fms.psu.ac.th because a portal has many jobs; a ballot has one.
//
// Section order deliberately mirrors the sections the classic home already ships
// (CLAUDE.md "Current Home Page Sections") so nothing an admin configures today
// disappears when they switch to this template:
//   header → hero+countdown → stats → announcement banner → candidates CTA → footer
//
// ALL year/number/name text derives from globalConfig via fmsMeta. The
// voteCTA-button STATE drives the primary button's label, route and enabled-ness,
// and the same state feeds the status pill in the header strip.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ArrowRight, Users, CheckCircle2, Clock } from "lucide-react";

import { getPath } from "../../utils/basePath";
import EditorElement from "../admin/editor/EditorElement";
import { resolveElementState, buildRuntimeContext } from "../admin/editor/stateResolver";
import { getBinding } from "../admin/editor/elementCatalog";
import { buildTemplateStyles } from "../../lib/templateTokens";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { useVoteStatus } from "../../hooks/useVoteStatus";
import { resolveElectionDates } from "../../utils/electionConfig";
import {
  fmsMeta,
  fmsOfficialSignIn,
  FmsOfficialHeader,
  FmsOfficialFooter,
  FmsOfficialBaseStyles,
} from "./FmsOfficialChrome";

export default function FmsOfficialHome({
  initialData, editorMode = false, editorData = null, elementConfigs = null,
  selectedElement = null, hoveredElement = null, onSelectElement = null,
  onHoverElement = null, onHoverEnd = null, pageLayout = null,
  resolvedTemplate = null, editorTokenStyles = null,
  // Optional sign-in override (playground): the login CTA calls this instead of
  // fmsOfficialSignIn() (next-auth). Absent = live behaviour.
  onSignIn = null,
}) {
  const { data: session, status } = useSession();
  const globalConfig = useGlobalConfig();
  const [mounted, setMounted] = useState(false);
  const { isVoted: isVotedReal } = useVoteStatus({ enabled: !editorMode && status === "authenticated" });

  useEffect(() => { setMounted(true); }, []);

  // Phase-aware countdown: before open → count to START; during → count to END;
  // after → "ปิดแล้ว". Segments are kept as separate numbers (not one string) so
  // each can sit in its own bordered cell — the formal treatment this template
  // wants, and it sidesteps the Thai-space kerning trap the verdure ledger hit.
  const [cd, setCd] = useState({ label: "เหลือเวลาลงคะแนน", d: 0, h: 0, m: 0, s: 0, over: false });
  useEffect(() => {
    const { ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);
    const split = (diff) => ({
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff / 3600000) % 24),
      m: Math.floor((diff / 60000) % 60),
      s: Math.floor((diff / 1000) % 60),
    });
    const tick = () => {
      const now = Date.now();
      const start = ELECTION_START instanceof Date ? ELECTION_START.getTime() : NaN;
      const end = ELECTION_END instanceof Date ? ELECTION_END.getTime() : NaN;
      if (!isNaN(start) && now < start) { setCd({ label: "เปิดลงคะแนนในอีก", over: false, ...split(start - now) }); return; }
      if (!isNaN(end) && now < end) { setCd({ label: "เหลือเวลาลงคะแนน", over: false, ...split(end - now) }); return; }
      setCd({ label: "ปิดการลงคะแนนแล้ว", d: 0, h: 0, m: 0, s: 0, over: true });
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
  const getText = (id, def) => {
    const b = getBinding(id);
    if (b) return globalConfig[b] ?? def;
    return effectiveConfigs?.[id]?.config?.text ?? def;
  };

  const rawStats = editorMode
    ? { totalVoted: editorData?.totalVoted ?? 412, totalEligible: editorData?.totalEligible ?? 2001 }
    : { totalVoted: initialData?.stats?.totalVoted ?? 0, totalEligible: initialData?.stats?.totalEligible ?? 0 };
  const pct = rawStats.totalEligible > 0 ? (rawStats.totalVoted / rawStats.totalEligible) * 100 : 0;
  const fmtInt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n);

  const tokenStylesCss = editorMode ? (editorTokenStyles || "") : buildTemplateStyles(resolvedTemplate, ".fms-app");

  const runtimeCtx = buildRuntimeContext({
    session,
    systemConfig: initialData?.systemConfig,
    electionStatus: initialData?.electionStatus,
    userData: session?.user ? { ...(initialData?.userData || {}), isVoted: isVotedReal } : initialData?.userData,
  });
  const voteState = editorMode ? "notVoted" : (resolveElementState("voteCTA-button", runtimeCtx) || "login");

  const CTA = {
    login:    { label: "เข้าสู่ระบบเพื่อลงคะแนน", note: "ยืนยันตัวตนด้วยบัญชี PSU Passport", action: "signin", disabled: false },
    notVoted: { label: "เข้าสู่หน้าลงคะแนน",      note: "ใช้เวลาไม่เกิน 1 นาที",              href: "/vote",    disabled: false },
    voted:    { label: "ดูผลคะแนน",              note: "ระบบบันทึกการลงคะแนนของคุณแล้ว",    href: "/results", disabled: false },
    closed:   { label: "ยังไม่เปิดรับลงคะแนน",    note: "โปรดกลับมาอีกครั้งเมื่อถึงกำหนด",     href: "/closed",  disabled: true  },
    paused:   { label: "ระบบหยุดให้บริการชั่วคราว", note: "อยู่ระหว่างปรับปรุงระบบ",           href: "/closed",  disabled: true  },
    ended:    { label: "ดูผลคะแนนอย่างเป็นทางการ", note: "ปิดการลงคะแนนเรียบร้อยแล้ว",        href: "/results", disabled: false },
  }[voteState] || { label: "เข้าสู่ระบบเพื่อลงคะแนน", note: "ยืนยันตัวตนด้วยบัญชี PSU Passport", action: "signin", disabled: false };

  const meta = fmsMeta(globalConfig);
  const realParties = (initialData?.candidates || []).filter((c) => c.number > 0);
  const partyCount = realParties.length || (editorMode ? 2 : 0);

  const heroTitle = String(getText("hero-title", meta.wordmark) ?? meta.wordmark);
  const heroSub = String(getText("hero-subtitle", meta.campaign) ?? meta.campaign);
  // The ghost behind the notice repeats whatever numeral the heading actually
  // carries, so an admin who renames the election cannot leave the two out of
  // step. No digits in the title → no ghost, rather than a stale hardcoded 50.
  const heroNum = heroTitle.split(/\s+/).find((w) => /^\d+$/.test(w)) || "";

  const onCta = (e) => {
    if (editorMode || CTA.disabled) { e.preventDefault(); return; }
    if (CTA.action === "signin") { e.preventDefault(); onSignIn ? onSignIn() : fmsOfficialSignIn(); }
  };

  const cdCells = [
    { n: cd.d, l: "วัน" },
    { n: cd.h, l: "ชั่วโมง" },
    { n: cd.m, l: "นาที" },
    { n: cd.s, l: "วินาที" },
  ];

  return (
    <div className="fms-app fo-root">
      {tokenStylesCss && <style dangerouslySetInnerHTML={{ __html: tokenStylesCss }} />}
      <FmsOfficialBaseStyles paintBody={!editorMode} />

      {/* Chrome is NOT wrapped: `site-navbar` / `site-footer` are element-LIBRARY
          folder names, not elementInstances IDs, so a Wrap around them would bind
          selection to an element the editor cannot resolve. Every other family
          home leaves its chrome unwrapped for the same reason. */}
      <FmsOfficialHeader active="home" meta={meta} voteState={voteState} editorMode={editorMode} />

      {/* ── HERO: the posted notice ──
          Two earlier attempts treated "flat" as a colour problem — first a
          full-plum hero (measured: 86% of the first screen dark), then a plum/white
          split whose boundary had no reason to be where it was. Neither was the
          real gap. Every other family in this repo owns a physical device —
          gumroad a poster mosaic, verdure a wax seal, receipt a paper desk,
          studio-dark a chapter rail — and this one owned nothing but type on flat
          fields, which is why no amount of repainting fixed it.
          So: no dark field anywhere. The hero is a bordered PANEL on the light
          band — a notice posted on a faculty board. Depth comes from figure and
          ground plus one oversized ghosted numeral clipped by the frame, not from
          a heavy background. The plum survives as the document's head rule, the
          ghost, and the button: three small doses instead of one large field. */}
      <section className="fo-hero">
        <div className="fo-hero__in">
          <div className="fo-notice">
            {/* the object this family never had. Purely decorative — the same
                numeral is present as real text in the heading above it. */}
            <span className="fo-notice__ghost" aria-hidden>{heroNum}</span>

            {/* A TAB hanging off the head rule, not a pill floating in space.
                The pill had no structural reason to be where it was; a tab does —
                it is how a filed document announces which drawer it belongs to,
                which is exactly the metaphor this notice is built on. Set in
                tracked caps so it reads as a label rather than a sentence.
                The label used to repeat the campaign title verbatim from the
                subtitle two lines below; it now carries a short standing name and
                the year moved down to finish that subtitle — one fact, one place.
                "FMS" comes from facultyShortEn, so a renamed faculty carries here.
                (Element id stays hero-year-badge: that is the editor's selection
                key and renaming it would orphan saved layouts.) */}
            <div className="fo-notice__tab">
              <Wrap id="hero-year-badge">
                <span className="fo-eyebrow">{meta.facultyShort} Election</span>
              </Wrap>
            </div>

            <div className="fo-notice__body">

              {/* One lockup, one size. The earlier version set the letters small
                  and the numeral 3.7× larger; owner's call is that SAMO and the
                  number read as equals, so the wordmark is now a single unit and
                  the job of being the page's anchor moves to the ghost behind it. */}
              <Wrap id="hero-title">
                <h1 className="fo-hero__h1">
                  {/* the separator has to sit OUTSIDE the styled span, on every
                      branch: emitting it only on the text branch rendered
                      "SAMO50" the moment the numeral was the second word */}
                  {heroTitle.split(/\s+/).map((w, i) => (
                    <React.Fragment key={i}>
                      {i > 0 ? " " : ""}
                      {/^\d+$/.test(w)
                        ? <em className="fo-hero__num">{w}</em>
                        : <span className="fo-hero__word">{w}</span>}
                    </React.Fragment>
                  ))}
                </h1>
              </Wrap>

              <span className="fo-rule" aria-hidden />

              <Wrap id="hero-subtitle">
                <p className="fo-hero__sub">
                  {heroSub} {meta.org} ประจำปีการศึกษา {meta.ay}
                </p>
              </Wrap>
            </div>

            {/* The countdown is a footer strip INSIDE the frame, divided by a
                hairline. That is what removes the odd seam: it is one object with
                two compartments, not two sections that happen to touch. */}
            <Wrap id="hero-countdown">
              <div className="fo-notice__cd">
                <div className="fo-cd" role="timer" aria-live="off">
                  <span className="fo-cd__label"><Clock size={14} aria-hidden /> {cd.label}</span>
                  {!cd.over && (
                    <div className="fo-cd__cells">
                      {cdCells.map((c) => (
                        <div key={c.l} className="fo-cd__cell">
                          <b>{String(c.n).padStart(2, "0")}</b>
                          <span>{c.l}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Wrap>
          </div>

          {/* Actions sit OUTSIDE the frame. What you read and what you act on are
              different jobs, and the frame is the line between them. */}
          <Wrap id="voteCTA-button">
            <div className="fo-actions">
              <a
                href={editorMode || CTA.action === "signin" ? undefined : getPath(CTA.href || "/vote")}
                onClick={onCta}
                className={`fo-btn fo-btn--primary ${CTA.disabled ? "is-disabled" : ""}`}
                role="button"
                aria-disabled={CTA.disabled}
              >
                {CTA.label}
                <ArrowRight size={18} aria-hidden />
              </a>
              <a
                href={editorMode ? undefined : getPath("/candidates")}
                className="fo-btn fo-btn--ghost"
              >
                ดูรายชื่อผู้สมัคร
              </a>
            </div>
          </Wrap>
          <p className="fo-hero__note">{CTA.note}</p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="fo-band">
        <div className="fo-band__in">
          <div className="fo-sechead">
            <h2>สถิติการใช้สิทธิ์</h2>
            <p>ข้อมูลตามเวลาจริง นับเฉพาะผู้มีสิทธิ์ลงคะแนนของคณะ</p>
          </div>

          <div className="fo-stats">
            <Wrap id="stats-voted-card">
              <div className="fo-stat">
                <span className="fo-stat__ico"><CheckCircle2 size={18} aria-hidden /></span>
                <span className="fo-stat__lbl">ผู้ใช้สิทธิ์แล้ว</span>
                <b className="fo-stat__val">{fmtInt(rawStats.totalVoted)}</b>
                <span className="fo-stat__unit">คน</span>
              </div>
            </Wrap>

            <div className="fo-stat fo-stat--pct">
              <span className="fo-stat__ico"><Users size={18} aria-hidden /></span>
              <span className="fo-stat__lbl">คิดเป็นร้อยละ</span>
              <b className="fo-stat__val">{pct.toFixed(2)}</b>
              <span className="fo-stat__unit">%</span>
              {/* The fill is a plain inline width with a CSS transition, NOT a
                  framer animate. Measured at 0px on first paint when it was
                  `initial={{width:0}} animate={{...}}` — same class of failure as
                  the ballot reveals that shipped invisible: a figure the page
                  exists to communicate must never depend on an animation running. */}
              <div className="fo-meter" role="presentation">
                <i style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </div>

            <Wrap id="stats-eligible-card">
              <div className="fo-stat">
                <span className="fo-stat__ico"><Users size={18} aria-hidden /></span>
                <span className="fo-stat__lbl">ผู้มีสิทธิ์ทั้งหมด</span>
                <b className="fo-stat__val">{fmtInt(rawStats.totalEligible)}</b>
                <span className="fo-stat__unit">คน</span>
              </div>
            </Wrap>
          </div>
        </div>
      </section>

      {/* ── ANNOUNCEMENT BANNER ──
          Renders ONLY when staff have uploaded a poster for this year
          (globalConfig.electionBannerUrl, set from the admin general-settings
          tab). The section used to point at a checked-in file whose artwork read
          "วันศุกร์ที่ 6 กุมภาพันธ์ 2569" — a previous year's polling date, on the
          faculty's own site, unfixable from admin. An absent section is honest;
          a confidently wrong date is not. */}
      {meta.bannerUrl && (
        <Wrap id="banner-section">
          <section className="fo-sec">
            <div className="fo-sec__in">
              <div className="fo-sechead">
                <h2>ประชาสัมพันธ์</h2>
                <p>ภาพประกาศการเลือกตั้งประจำปีการศึกษา {meta.ay}</p>
              </div>
              <figure className="fo-banner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getPath(meta.bannerUrl)} alt={`ประกาศ${meta.campaign} ประจำปีการศึกษา ${meta.ay}`} />
              </figure>
            </div>
          </section>
        </Wrap>
      )}

      {/* ── CANDIDATES CTA ── */}
      <Wrap id="meet-section">
        <section className="fo-sec fo-sec--last">
          <div className="fo-sec__in">
            <div className="fo-sechead">
              <h2>ผู้สมัครรับเลือกตั้ง</h2>
              <p>
                {partyCount > 0
                  ? `ปีนี้มีผู้สมัคร ${partyCount} พรรค ศึกษานโยบายและทีมงานก่อนตัดสินใจลงคะแนน`
                  : "ศึกษานโยบายและทีมงานของผู้สมัครก่อนตัดสินใจลงคะแนน"}
              </p>
            </div>
            {/* The faculty's signature layout device: a solid plum panel whose
                text is set against the far edge, with a short rule and a plain
                underlined "เพิ่มเติม" link rather than a button. Their version
                pairs each panel with a photo in a checkerboard; there is no
                photography to pair with here, so this takes the panel alone —
                the recognisable half — instead of faking a photo slot. */}
            <a href={editorMode ? undefined : getPath("/candidates")} className="fo-meet">
              <div className="fo-meet__txt">
                <b>ทำความรู้จักผู้สมัคร</b>
                <span className="fo-meet__sub">นโยบาย รายชื่อทีมงาน และประวัติของแต่ละพรรค</span>
                <span className="fo-meet__rule" aria-hidden />
                <span className="fo-meet__go">
                  เปิดดู <ArrowRight size={16} aria-hidden />
                </span>
              </div>
            </a>
          </div>
        </section>
      </Wrap>

      <FmsOfficialFooter meta={meta} />

      <style jsx global>{`
        /* ── hero ──
           A full-bleed plum plate, the same device every inner page opens with.
           The home page used to be the ONLY page without one — white from the
           header to the footer, with plum surviving only as a chip border, a
           numeral and a button. That is precisely why it read flat: no field, no
           contrast, everything at one weight. Putting the hero on the plate costs
           no new colour, ties the home to the rest of the template, and matches
           the faculty's own site, whose hero is likewise a full-width dark field
           with white type across it. */
        /* The light band is the BOARD; the white panel below is the notice pinned
           to it. That figure/ground pair is the whole trick — it is what stops the
           page reading flat without a single dark field. */
        /* THE BOARD IS PLUM.
           An earlier attempt made the hero plum and the owner rightly called it
           heavy — but that version had white text sitting directly on 668px of
           colour. This is a different composition: the white notice now carries
           the content, so the plum is only what shows AROUND it. Same colour,
           a fraction of the visible area, and it finally matches the metaphor —
           a notice pinned to the faculty's board.
           The dot field it replaces read fine up close but became noise at
           full-section scale, which is the owner's call and matches what the
           faculty do: they use dots on narrow bands, not on whole screens. */
        .fo-hero { background-color: var(--fo-plum); }
        .fo-hero__in {
          max-width: 960px; margin: 0 auto;
          /* the generous top/bottom is what keeps this reading as a BOARD with a
             notice on it rather than a plum stripe behind a card */
          padding: 56px 24px 60px; text-align: center;
          display: flex; flex-direction: column; align-items: center;
        }

        /* ONE lockup, ONE size — owner's call. The letters and the number are
           equals, tracked slightly open so the pair reads as a stamped wordmark
           rather than a sentence. */
        .fo-hero__h1 {
          margin: 24px 0 0; line-height: 1.02;
          font-size: clamp(42px, 6.6vw, 82px); font-weight: 700;
          letter-spacing: .015em; color: var(--fo-ink);
          display: flex; align-items: baseline; justify-content: center;
          flex-wrap: wrap; gap: 0 .2em;
        }
        .fo-hero__word, .fo-hero__num {
          font-size: inherit; font-weight: inherit; letter-spacing: inherit; color: inherit;
        }
        .fo-hero__num { font-style: normal; font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }

        .fo-hero__sub {
          margin: 16px auto 0; max-width: 620px;
          font-size: clamp(15px, 1.5vw, 18px); font-weight: 300; line-height: 1.65;
          color: var(--fo-muted); text-wrap: balance;
        }

        /* .fo-cd* and .fo-btn* now live in FmsOfficialChrome's base styles, NOT
           here. They were declared in this file and the six inner pages use the
           same class names — so the ballot's submit button and the closed page's
           countdown rendered completely unstyled, because this style block only
           mounts on the home page. Anything two pages share belongs in the chrome. */
        /* Inside the notice the countdown lies flat as ONE row — label then
           figures — so the strip reads as a compartment of the document rather
           than a second stacked block. No inverted overrides anywhere: the shared
           .fo-btn / .fo-cd__cell rules from the chrome now apply unchanged on
           every page, which is one less exception to maintain. */
        .fo-cd {
          display: flex; flex-direction: row; align-items: center;
          justify-content: center; flex-wrap: wrap; gap: 8px 18px;
        }
        .fo-cd__cells { display: flex; gap: 8px; }

        /* The actions sit on the board, not on the notice — so they invert. This
           is the ONLY inverted block left in the template, and it is four
           declarations rather than the full set the all-plum hero needed (label,
           cells, cell numerals, both buttons, disabled, note). Everything inside
           the notice keeps the shared chrome styling untouched. */
        .fo-actions { margin-top: 26px; display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
        .fo-hero .fo-btn--primary {
          background: #fff; color: var(--fo-plum); border-color: #fff;
          box-shadow: 0 16px 34px -18px rgba(0,0,0,.45);
        }
        .fo-hero .fo-btn--primary:hover:not(.is-disabled) { background: #fff; border-color: #fff; transform: translateY(-1px); }
        .fo-hero .fo-btn--primary.is-disabled {
          background: rgba(255,255,255,.14); color: rgba(255,255,255,.62);
          border-color: rgba(255,255,255,.24); box-shadow: none;
        }
        .fo-hero .fo-btn--ghost { background: transparent; color: #fff; border-color: rgba(255,255,255,.4); }
        .fo-hero .fo-btn--ghost:hover { background: rgba(255,255,255,.1); color: #fff; border-color: rgba(255,255,255,.65); }
        .fo-hero__note { margin: 14px 0 0; font-size: 13px; font-weight: 300; color: rgba(255,255,255,.7); }

        /* ── bands ── */
        /* The hero board is already the grey tone, so a grey stats band directly
           under it merged the two into one unbroken field and the page went
           limp again below the notice. Alternating from here gives the rest of
           the page a beat: board (grey) → stats (white) → poster (grey) → CTA
           (white) → footer. */
        .fo-band { background: var(--fo-surface); border-top: 1px solid var(--fo-line); border-bottom: 1px solid var(--fo-line); }
        .fo-sec { background: var(--fo-bg); }
        .fo-sec--last { background: var(--fo-surface); }
        .fo-band__in, .fo-sec__in { max-width: var(--fo-max); margin: 0 auto; padding: 56px 24px; }
        .fo-sec--last .fo-sec__in { padding-bottom: 76px; }

        /* ── stats ── */
        .fo-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .fo-stat {
          background: var(--fo-surface); border: 1px solid var(--fo-line); border-radius: 12px;
          padding: 22px 22px 20px; display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
        }
        .fo-stat__ico {
          width: 34px; height: 34px; border-radius: 8px; margin-bottom: 10px;
          background: var(--fo-tint); color: var(--fo-brand);
          display: inline-flex; align-items: center; justify-content: center;
        }
        .fo-stat__lbl { font-size: 13px; font-weight: 300; color: var(--fo-muted); }
        .fo-stat__val {
          font-size: 38px; font-weight: 600; line-height: 1.1; color: var(--fo-ink);
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
        }
        .fo-stat__unit { font-size: 13px; font-weight: 300; color: var(--fo-muted); }
        .fo-meter { margin-top: 14px; width: 100%; height: 6px; border-radius: 999px; background: var(--fo-tint-2); overflow: hidden; }
        .fo-meter i { display: block; height: 100%; border-radius: 999px; background: var(--fo-brand); transition: width .8s ease-out; }

        /* ── banner ── */
        .fo-banner { margin: 0; border: 1px solid var(--fo-line); border-radius: 12px; overflow: hidden; background: var(--fo-bg); }
        .fo-banner img { display: block; width: 100%; height: auto; }

        /* ── candidates CTA ── */
        /* Their panel proportions: tall, text pushed to one side, plenty of empty
           plum. The emptiness is the point — it is what makes the panel read as a
           designed field rather than a coloured box with a sentence in it. */
        .fo-meet {
          display: flex; align-items: flex-end; justify-content: flex-end;
          min-height: 260px; padding: 40px 44px; border-radius: 4px;
          background: var(--fo-plum); color: #fff;
          transition: background .2s;
        }
        .fo-meet:hover { background: var(--fo-plum-deep); }
        .fo-meet__txt { display: flex; flex-direction: column; align-items: flex-end; text-align: right; max-width: 460px; }
        .fo-meet__txt b { font-size: clamp(24px, 3vw, 34px); font-weight: 600; color: #fff; line-height: 1.25; }
        .fo-meet__sub { margin-top: 8px; font-size: 15px; font-weight: 300; color: rgba(255,255,255,.82); }
        /* short rule, right-aligned to match the text block */
        .fo-meet__rule { width: 46px; height: 2px; background: rgba(255,255,255,.55); margin: 18px 0 0; }
        /* an underlined link, not a button — the faculty's "เพิ่มเติม" treatment */
        .fo-meet__go {
          display: inline-flex; align-items: center; gap: 7px; margin-top: 16px;
          font-size: 15px; font-weight: 400; color: #fff;
          border-bottom: 1px solid rgba(255,255,255,.6); padding-bottom: 3px;
          transition: border-color .18s;
        }
        .fo-meet:hover .fo-meet__go { border-bottom-color: #fff; }

        /* responsive blocks come AFTER the base rules on purpose — equal
           specificity means source order decides, and a @media block placed
           above its base rule silently loses (project rule) */
        @media (max-width: 900px) {
          .fo-stats { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .fo-hero__in { padding: 22px 14px 26px; }
          .fo-notice__body { padding: 18px 18px 18px; }
          .fo-notice__cd { padding: 13px 12px 15px; }
          .fo-rule { margin-top: 12px; }
          .fo-actions { margin-top: 20px; }
          .fo-notice__ghost { font-size: clamp(180px, 62vw, 260px); bottom: -.24em; }
          .fo-hero__sub { font-size: 15px; }
          .fo-eyebrow { font-size: 10.5px; padding: 6px 16px 7px; letter-spacing: .15em; white-space: nowrap; }
          /* The countdown strip measured 118px on a phone — the single largest
             item in the notice after the heading, for four two-digit numbers.
             Trimmed to ~78 here: shorter cells, smaller figures, tighter label.
             That, not the eyebrow chip, was what pushed the first screen past the
             fold on a 360×640 handset (util 32 + header 115 + hero 552 = 699). */
          /* These MUST carry the .fo-notice__cd prefix. The base rules that size
             the cells are two-class selectors (0,2,0), and a bare .fo-cd__cell
             (0,1,0) loses to them no matter what media query it sits in — the
             first attempt at this trim changed nothing at all and the strip
             stayed at 115px. */
          .fo-cd { gap: 6px 12px; }
          .fo-cd__label { font-size: 12px; }
          .fo-cd__cells { gap: 7px; width: 100%; }
          .fo-notice__cd .fo-cd__cell { min-width: 0; flex: 1 1 0; padding: 7px 4px 5px; border-radius: 7px; }
          .fo-notice__cd .fo-cd__cell b { font-size: 21px; }
          .fo-notice__cd .fo-cd__cell span { font-size: 10.5px; }
          .fo-actions { width: 100%; flex-direction: column; gap: 10px; }
          /* 12px vertical keeps the control at ~46px tall — still above the 44px
             minimum touch target, so the height comes out of padding, not reach */
          .fo-btn { width: 100%; justify-content: center; padding: 12px 22px; font-size: 15px; }
          .fo-band__in, .fo-sec__in { padding: 40px 16px; }
          .fo-sec--last .fo-sec__in { padding-bottom: 56px; }
          .fo-stat__val { font-size: 32px; }
          .fo-meet { min-height: 0; padding: 28px 20px; align-items: flex-start; justify-content: flex-start; }
          .fo-meet__txt { align-items: flex-start; text-align: left; }
        }
        @media (max-width: 380px) {
          .fo-hero__in { padding: 20px 12px 24px; }
          /* the CTA's helper line is the least load-bearing text in the hero —
             the only thing dropped at this width, and only here */
          .fo-hero__note { display: none; }
          .fo-notice__body { padding: 22px 14px 18px; }
          .fo-hero__sub { font-size: 14px; }
          .fo-cd__cell b { font-size: 23px; }
          .fo-band__in, .fo-sec__in { padding: 32px 12px; }
        }
      `}</style>
    </div>
  );
}
