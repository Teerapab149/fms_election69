"use client";

// ReceiptSingleParty — SINGLE-PARTY VOTE (booth) for the "Receipt · Paper
// Materiality" template family (Template #6), in the print/desk language established
// by ReceiptHome / ReceiptVote / ReceiptSuccess. When only ONE party stands, the
// voter reads a full PRINTED feature of that party (party numeral + logo tile +
// name/slogan, group cover framed like a print, about-the-party brief, key policies
// as index rows, the team as a portrait grid) and then makes the 3-choice DECISION
// by pressing an INK STAMP onto the ballot:
//   รับรอง (approve) · ไม่รับรอง (disapprove) · งดออกเสียง (abstain)
//
// The three choice colours are the house SEMANTIC system — approve=green,
// disapprove=red, abstain=orange — FIXED per choice and deliberately NOT var(--rc-*)
// (they must mean the same thing across every Receipt theme). Only the SURROUNDING
// chrome (the desk, laid paper, receipt-stock ballot sheet, the fixed confirm tray,
// the foil-rim button) is Receipt. This mirrors how BlossomSingleParty tones its
// rows via bl-sopt--* and how VerdureSingleParty uses vd-tone--*. Accent/holo NEVER
// touch the semantic tones.
//
// Dispatched from ReceiptVote when isSingleParty. Pure presentation: vote/page.js
// owns auth + the vote-system hook; onConfirm() IS the submit (single-party has no
// shared VoteConfirmationModal — the confirm dialog here calls onConfirm directly,
// the same contract as GumroadSingleParty / VerdureSingleParty / BlossomSingleParty).
// Colours flow ONLY through var(--rc-*) emitted by ReceiptBaseStyles on .rc-root
// (the one exception is the three semantic stamp tones). The desk language
// (laid-paper texture, vignette, blind-emboss seals, foil) comes from the SHARED
// .rc-desk classes (T1). Base state is fully visible: the stamp-press is a selection
// indicator using transform/opacity only, so JS-off / reduced-motion / editorMode
// render the full booth instantly (no JS-gated content).

import { useState, useEffect, useRef } from "react";
import { getPath } from "../../utils/basePath";
import { ReceiptTopBar } from "../home/ReceiptHome";
import { ReceiptBaseStyles, ReceiptShipMark } from "../home/ReceiptTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { sortMembersByPosition } from "../../utils/memberSort";
import StoryClamp from "./StoryClamp";

// stamp imprint glyph + Thai label per semantic choice (kind)
const STAMP_GLYPH = { approve: "✓", disapprove: "✕", abstain: "—" };
const STAMP_LABEL = { approve: "รับรอง", disapprove: "ไม่รับรอง", abstain: "งดออกเสียง" };

const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));
const asText = (it) => typeof it === "string" ? it : (it?.text ?? it?.title ?? it?.detail ?? it?.description ?? it?.name ?? "");
const firstImage = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) return val[0] || null;
  if (typeof val === "string") { const s = val.trim(); if (s.startsWith("[")) { try { const a = JSON.parse(s); return Array.isArray(a) ? a[0] : null; } catch { return s; } } return s; }
  return null;
};

// one decision row (approve / disapprove / abstain). role=radio, keyboard-operable.
// tone ∈ approve | disapprove | abstain sets the FIXED semantic colour + glyph.
// Selecting presses an INK STAMP in (transform/opacity only — base-visible).
function StampRow({ tone, glyph, kick, name, note, selected, onSelect }) {
  return (
    <li className={`rc-sopt rc-sopt--${tone}${selected ? " is-selected" : ""}`}>
      <div
        className="rc-sopt__hit"
        role="radio"
        aria-checked={selected}
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(); } }}
      >
        <span className="rc-sopt__pad" aria-hidden="true">
          <span className="rc-sopt__ink">{glyph}</span>
        </span>
        <span className="rc-sopt__body">
          <span className="rc-sopt__kick">{kick}</span>
          <span className="rc-sopt__name">{name}</span>
          {note && <span className="rc-sopt__note">{note}</span>}
        </span>
      </div>
    </li>
  );
}

export default function ReceiptSingleParty({
  party = {}, specialOptions = {}, selectedPartyId = null,
  onSelect = () => {}, onConfirm = () => {}, isSubmitting = false,
  user = null, editorMode = false,
}) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";
  const copyrightYear = gc.copyrightYear ?? "";

  const [confirmOpen, setConfirmOpen] = useState(false);
  // stamping-desk enhancement state (JS-only; the 3 rows below stay the base path)
  const [ghostKind, setGhostKind] = useState(null);   // the previous imprint, fading out
  const prevKindRef = useRef(null);
  const [showJump, setShowJump] = useState(false);      // sticky "jump to decision" shortcut
  const jumpSentinelRef = useRef(null);

  const abstain = specialOptions?.abstain;
  const disapprove = specialOptions?.disapprove;

  const logo = resolveSrc(party?.logoUrl);
  const cover = resolveSrc(firstImage(party?.groupImageUrls) || firstImage(party?.officialImageUrl) || firstImage(party?.mobileHeroImage));
  const story = (party?.logoMeaning || "").trim();
  const showStory = story && !story.startsWith("ยังไม่มีข้อมูล");
  // keep the placeholder defaults preparePartyData injects out of the printed pages
  const missions = (party?.missions || []).map(asText).filter((t) => t && !t.startsWith("ยังไม่มีข้อมูล"));
  const policies = (party?.policies || []).map(asText).filter(Boolean);
  const members = sortMembersByPosition(party?.members || []);
  const no = party?.number;

  const name = (user?.name || (editorMode ? "นักศึกษาตัวอย่าง" : "")).trim();
  const sid = user?.studentId || (editorMode ? "6610510149" : "—");

  // which of the three choices is picked (fixed semantic mapping)
  const kind = selectedPartyId == null ? null
    : selectedPartyId === party?.id ? "approve"
    : (disapprove && selectedPartyId === disapprove.id) ? "disapprove"
    : (abstain && selectedPartyId === abstain.id) ? "abstain"
    : null;

  const selectionLabel = kind === "approve" ? `รับรอง — ${party?.name || ""}`
    : kind === "disapprove" ? "ไม่รับรอง · Disapprove"
    : kind === "abstain" ? "งดออกเสียง · Abstain"
    : null;

  const pick = (id) => () => { if (!editorMode && id != null) onSelect(id); };
  const canConfirm = kind != null && !isSubmitting && !editorMode;

  // over-stamp: when the choice CHANGES, flash the previous imprint as a fading ghost
  // (transform/opacity only). Never gates content — the slot is aria-hidden decoration.
  useEffect(() => {
    const prev = prevKindRef.current;
    prevKindRef.current = kind;
    if (prev && prev !== kind) {
      setGhostKind(prev);
      const t = setTimeout(() => setGhostKind(null), 650);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [kind]);

  // sticky "ไปที่การตัดสินใจ ↓" shortcut — appears once the top masthead scrolls out of
  // view AND hides again while the decision zone itself is on screen. TWO
  // IntersectionObservers, no scroll listener (A7.1); both disconnect on unmount.
  // editorMode never arms it (static slide).
  useEffect(() => {
    if (editorMode || typeof window === "undefined" || !("IntersectionObserver" in window)) return undefined;
    const headEl = jumpSentinelRef.current;
    const decisionEl = document.getElementById("rc-sp-decision");
    if (!headEl) return undefined;
    let pastHead = false;
    let atDecision = false;
    const apply = () => setShowJump(pastHead && !atDecision);
    const ioHead = new IntersectionObserver(
      (entries) => { pastHead = !entries[0].isIntersecting; apply(); },
      { rootMargin: "-40px 0px 0px 0px", threshold: 0 }
    );
    ioHead.observe(headEl);
    let ioDec = null;
    if (decisionEl) {
      ioDec = new IntersectionObserver(
        (entries) => { atDecision = entries[0].isIntersecting; apply(); },
        { rootMargin: "0px 0px -20% 0px", threshold: 0.05 }
      );
      ioDec.observe(decisionEl);
    }
    return () => { ioHead.disconnect(); if (ioDec) ioDec.disconnect(); };
  }, [editorMode]);

  return (
    <div className="fms-app rc-root rc-single-root rc-desk">
      <ReceiptBaseStyles />

      <ReceiptTopBar editorMode={editorMode} active="/vote" />

      {/* blind-emboss seals — fewer than home (the ballot is the focus), shared
          .rc-desk-seals language, pure decoration (aria-hidden) */}
      <div className="rc-desk-seals" aria-hidden="true">
        <span className="rc-seal rc-seal--a"><i /><b /></span>
        <span className="rc-seal rc-seal--b"><i /><b /></span>
      </div>

      <div className="rc-single-wrap">
        {/* ===== issue / eyebrow line ===== */}
        <div className="rc-issue">
          <span><span className="rc-th">ลงคะแนน</span> · SINGLE BALLOT</span>
          <span>{prefix} {number}</span>
        </div>

        {/* ===== party feature masthead ===== */}
        <header className="rc-sp-head">
          <span className="rc-sp-kick">✶ <span className="rc-th">พรรคเดียวที่ลงสมัคร</span> · THE ONLY PARTY ✶</span>
          <div className="rc-sp-hero">
            <span className="rc-sp-logo">
              {logo ? (
                <img src={logo} alt={party?.name || "โลโก้พรรค"} />
              ) : (
                <span className="rc-sp-logo-ph" aria-hidden="true">{pad2(no)}</span>
              )}
            </span>
            <div className="rc-sp-title">
              <span className="rc-sp-num"><span className="rc-th">พรรคหมายเลข</span> <b>{no}</b></span>
              <h1 className="rc-sp-word">{party?.name || "พรรค"}</h1>
              {party?.slogan && <p className="rc-sp-slogan">“{party.slogan}”</p>}
            </div>
          </div>
        </header>
        {/* IO sentinel — once this scrolls above the fold, the sticky decision
            shortcut appears (no scroll listener) */}
        <div ref={jumpSentinelRef} aria-hidden="true" className="rc-jump-sentinel" />

        {/* voter register strip — mono, register-tape voice (mirrors ReceiptVote) */}
        <div className="rc-vvoter">
          <span className="rc-vvoter__row"><b><span className="rc-th">ผู้มีสิทธิ์</span></b><span className="rc-th">{name || "ผู้มีสิทธิ์เลือกตั้ง"}</span></span>
          <span className="rc-vvoter__row"><b><span className="rc-th">รหัส</span></b>{sid}</span>
          <span className="rc-vvoter__row"><b><span className="rc-th">บัตร</span></b>1 <span className="rc-th">พรรค</span></span>
        </div>

        {/* group cover — framed like a print taped to the desk (never cropped hard) */}
        {cover && (
          <figure className="rc-sp-cover">
            <img src={cover} alt={`ภาพหมู่พรรค ${party?.name || ""}`} />
            <figcaption><span className="rc-th">ภาพหมู่พรรค</span> · GROUP PHOTO</figcaption>
          </figure>
        )}

        {/* logo meaning — the story explains the party mark (logo chip ties them) */}
        {showStory && (
          <section className="rc-sp-sec">
            <div className="rc-sp-sec__head">
              {logo && <span className="rc-sp-sec__logo"><img src={logo} alt={party?.name || "โลโก้พรรค"} /></span>}
              <span className="rc-sp-sec__kick">LOGO MEANING</span>
              <h2 className="rc-sp-sec__title"><span className="rc-th">ความหมายสัญลักษณ์</span></h2>
            </div>
            <StoryClamp className="rc-sc"><p className="rc-sp-story">{story}</p></StoryClamp>
          </section>
        )}

        {/* พันธกิจ — missions, numbered in the receipt voice (mono 01/02…) */}
        {missions.length > 0 && (
          <section className="rc-sp-sec">
            <div className="rc-sp-sec__head">
              <span className="rc-sp-sec__kick">MISSION</span>
              <h2 className="rc-sp-sec__title"><span className="rc-th">พันธกิจ</span></h2>
              <span className="rc-sp-sec__count">{pad2(missions.length)} <span className="rc-th">ข้อ</span></span>
            </div>
            <ol className="rc-sp-mlist">
              {missions.map((m, i) => (
                <li key={i}><span className="rc-sp-mlist__n rc-mono">{pad2(i + 1)}</span><span className="rc-sp-mlist__t">{m}</span></li>
              ))}
            </ol>
          </section>
        )}

        {/* key policies — print index rows */}
        {policies.length > 0 && (
          <section className="rc-sp-sec">
            <div className="rc-sp-sec__head">
              <span className="rc-sp-sec__kick">KEY POLICIES</span>
              <h2 className="rc-sp-sec__title">นโยบายเด่น</h2>
              <span className="rc-sp-sec__count">{pad2(policies.length)} <span className="rc-th">ข้อ</span></span>
            </div>
            <ol className="rc-sp-plist">
              {policies.map((p, i) => (
                <li key={i}><span className="n">{pad2(i + 1)}</span><span className="t">{p}</span></li>
              ))}
            </ol>
          </section>
        )}

        {/* the team — portrait grid */}
        {members.length > 0 && (
          <section className="rc-sp-sec">
            <div className="rc-sp-sec__head">
              <span className="rc-sp-sec__kick">THE TEAM</span>
              <h2 className="rc-sp-sec__title">ทีมผู้สมัคร</h2>
              <span className="rc-sp-sec__count">{pad2(members.length)} <span className="rc-th">คน</span></span>
            </div>
            <div className="rc-sp-team">
              {members.map((m, i) => {
                const img = resolveSrc(m?.imageUrl);
                return (
                  <figure className="rc-sp-cand" key={m.id || i}>
                    <span className="rc-sp-cand__photo">
                      {img ? <img src={img} alt={m.name} /> : <span className="rc-sp-cand__ph" aria-hidden="true">{(m.name || "?").trim().charAt(0)}</span>}
                    </span>
                    <figcaption className="rc-sp-cand__body">
                      <span className="rc-sp-cand__name">{m.name}</span>
                      {(m.position || m.major) && <span className="rc-sp-cand__role">{m.position || m.major}</span>}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== the decision — a receipt-stock ballot sheet with 3 ink stamps ===== */}
        <section className="rc-ballot" id="rc-sp-decision" aria-label="การตัดสินใจของคุณ">
          <div className="rc-ballot-ghost" aria-hidden="true"><span>{prefix} {number} ✓</span></div>
          <div className="rc-ballot-sheet">
            <div className="rc-ballot-head">
              <span className="rc-ballot-head__l"><span className="rc-th">การตัดสินใจ</span> · YOUR DECISION</span>
              <span className="rc-ballot-head__r"><span className="rc-th">หนึ่งคน</span> · <span className="rc-th">หนึ่งเสียง</span></span>
            </div>
            <div className="rc-perf" aria-hidden="true" />

            {/* the empty stamping SLOT — the pressed imprint of the CURRENT choice
                appears here (ink-soak scale + tilt); a changed choice over-stamps with
                the old one ghosted out. Enhancement layer only (aria-hidden): the three
                role=radio stamps below are the base path — keyboard + no-JS + reduced-
                motion all read the plain rows with no imprint gate. */}
            <div className="rc-stampslot" aria-hidden="true">
              {/* faint blind ring-impression — a previous stamp's ghost with the
                  faculty เรือสำเภา at its centre (v2-R6). A soft ink watermark the
                  live semantic imprint presses over. */}
              <span className="rc-stampslot__impress">
                <ReceiptShipMark className="rc-stampslot__ship" strokeWidth={3} />
              </span>
              {/* 3-colour ink pad — one well per semantic tone, resting in the corner */}
              <span className="rc-inkwells">
                <i className="rc-inkwell rc-inkwell--a" /><i className="rc-inkwell rc-inkwell--d" /><i className="rc-inkwell rc-inkwell--x" />
              </span>
              <span className="rc-stampslot__hint"><span className="rc-mono">STAMP HERE ·</span> <span>ประทับตราของคุณที่นี่</span></span>
              {ghostKind && (
                <span key={`g-${ghostKind}`} className={`rc-imprint rc-imprint--ghost rc-sopt--${ghostKind}`}>
                  <span className="rc-imprint__glyph">{STAMP_GLYPH[ghostKind]}</span>
                  <span className="rc-imprint__txt">{STAMP_LABEL[ghostKind]}</span>
                </span>
              )}
              {kind && (
                <span key={`c-${kind}`} className={`rc-imprint rc-sopt--${kind}`}>
                  <span className="rc-imprint__glyph">{STAMP_GLYPH[kind]}</span>
                  <span className="rc-imprint__txt">{STAMP_LABEL[kind]}</span>
                </span>
              )}
            </div>

            <ul className="rc-sballot">
              <StampRow
                tone="approve"
                glyph="✓"
                kick={<><span className="rc-th">เห็นชอบ</span> · APPROVE</>}
                name="รับรอง"
                note={`เห็นชอบให้ ${party?.name || "พรรคนี้"} ดำรงตำแหน่ง`}
                selected={kind === "approve"}
                onSelect={pick(party?.id)}
              />
              {disapprove && (
                <StampRow
                  tone="disapprove"
                  glyph="✕"
                  kick={<><span className="rc-th">ไม่เห็นชอบ</span> · DISAPPROVE</>}
                  name="ไม่รับรอง"
                  note="ไม่เห็นชอบให้พรรคที่ลงสมัครดำรงตำแหน่ง"
                  selected={kind === "disapprove"}
                  onSelect={pick(disapprove.id)}
                />
              )}
              {abstain && (
                <StampRow
                  tone="abstain"
                  glyph="—"
                  kick={<><span className="rc-th">งดออกเสียง</span> · ABSTAIN</>}
                  name="งดออกเสียง"
                  note="ไม่ประสงค์ลงคะแนนเสียงในการเลือกตั้งครั้งนี้"
                  selected={kind === "abstain"}
                  onSelect={pick(abstain.id)}
                />
              )}
            </ul>

            <div className="rc-ballot-foot" aria-hidden="true">✶ ✶ ✶ <span className="rc-th">กดตราปั๊มเพื่อเลือก</span> ✶ ✶ ✶</div>
          </div>
        </section>
      </div>

      {/* sticky shortcut to the decision zone — a tiny ticket STUB that slides in once
          the party masthead scrolls out of view (IO-driven). Fades on mobile so it
          never fights the tray. */}
      <button
        type="button"
        className={`rc-jump${showJump ? " is-in" : ""}`}
        onClick={() => { const el = document.getElementById("rc-sp-decision"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}
        tabIndex={showJump ? 0 : -1}
        aria-hidden={showJump ? undefined : "true"}
      >
        ไปที่การตัดสินใจ<span className="rc-jump__arrow" aria-hidden="true"> ↓</span>
      </button>

      {/* ===== fixed confirm tray — paper strip (torn perforation top) + foil button ===== */}
      <div className={`rc-vbar${canConfirm ? " is-ready" : ""}`}>
        <div className="rc-vbar__perf" aria-hidden="true" />
        <div className="rc-vbar__in">
          <div className="rc-vbar__sel">
            <span className="rc-vbar__lab"><span className="rc-th">การเลือกของคุณ</span> · YOUR SELECTION</span>
            {selectionLabel ? (
              <span className={`rc-vbar__val rc-vbar__val--${kind}`}>
                <span className="rc-vbar__dot" aria-hidden="true" />{selectionLabel}
              </span>
            ) : (
              <span className="rc-vbar__val rc-vbar__val--empty">ยังไม่ได้เลือก · No selection</span>
            )}
          </div>
          <button
            type="button"
            className="rc-vbar__btn"
            disabled={!canConfirm}
            onClick={() => canConfirm && setConfirmOpen(true)}
          >
            {canConfirm && <span className="rc-foil" aria-hidden="true" />}
            <span className="rc-vbar__btn-in">
              {isSubmitting ? "กำลังบันทึก…" : "ยืนยันการลงคะแนน"}<span className="rc-vbar__arrow" aria-hidden="true">→</span>
            </span>
          </button>
        </div>
      </div>

      {/* ===== confirm dialog — the booth's own paper slip, surface-sibling of the
          multi ballot's ReceiptConfirmSlip (v2-R4a T4): die-cut corner + top
          perforation + grain, mono CONFIRM header, quiet stub cancel, foil-rim
          "หย่อนบัตร →" confirm (F5 wording). Semantics unchanged: onConfirm() IS
          the submit — single-party has no shared modal. ===== */}
      {confirmOpen && (
        <div className="rc-scm" onClick={() => !isSubmitting && setConfirmOpen(false)} role="dialog" aria-modal="true">
          <div className="rc-scm__card rc-grain" onClick={(e) => e.stopPropagation()}>
            <span className="rc-scm__perf" aria-hidden="true" />
            <span className="rc-scm__eyebrow">CONFIRM · <span className="rc-th">ยืนยันครั้งสุดท้าย</span></span>
            <h3 className="rc-scm__title">ยืนยันการลงคะแนน</h3>
            <p className="rc-scm__sub">เมื่อยืนยันแล้ว<b>จะไม่สามารถแก้ไขได้</b> กรุณาตรวจสอบตัวเลือกของคุณ</p>
            <div className={`rc-scm__pick rc-scm__pick--${kind}`}>
              <span className="rc-scm__pick-lab">การเลือกของคุณ</span>
              <span className="rc-scm__pick-val">{selectionLabel || "—"}</span>
            </div>
            <div className="rc-scm__actions">
              <button type="button" className="rc-scm__cancel" onClick={() => setConfirmOpen(false)} disabled={isSubmitting}>ยกเลิก</button>
              <button type="button" className="rc-scm__go" onClick={() => onConfirm()} disabled={isSubmitting}>
                {!isSubmitting && <span className="rc-foil" aria-hidden="true" />}
                <span className="rc-scm__go-in">
                  {isSubmitting ? "กำลังบันทึก…" : "หย่อนบัตร"}<span className="rc-scm__arrow" aria-hidden="true">→</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== footer — classic single centered line ===== */}
      <footer className="rc-single-footer">
        <p>© FMS@PSU{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
      </footer>

      <style jsx global>{`
        /* ================= BASE (the polling desk) ================= */
        /* laid-paper ::after + desk vignette ::before + blind-emboss seals come from
           the SHARED .rc-desk classes in ReceiptBaseStyles (T1) — this root opts in
           via the rc-desk class, matching the home reference language. */
        .rc-single-root { --rc-stamp-red:#B91C1C; overflow-x:hidden; }

        :where(.rc-single-root) a { text-decoration:none; color:var(--rc-ink); }
        .rc-single-root a:focus-visible, .rc-single-root button:focus-visible,
        .rc-single-root [role="radio"]:focus-visible { outline:2px solid var(--rc-accent-deep); outline-offset:3px; }
        /* mono utility — ONLY Latin / digits / symbols ever wear it (A10.3) */
        .rc-single-root .rc-mono { font-family:var(--rc-fm); }
        /* Thai-in-a-mono-line utility — the Thai half of a bilingual mono label wears
           Chakra Petch so it never falls back (Space Mono has no Thai glyphs, C4) */
        .rc-single-root .rc-th { font-family:var(--rc-fr) !important; }

        /* ---- topbar "head of the desk" (A3 / ruling #4: NO backdrop-filter — opaque
           desk fill + a perforated hairline; stub-nav skin ported from ReceiptHome) ---- */
        .rc-single-root .rc-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--rc-desk) 96%, var(--rc-receipt)); }
        .rc-single-root .rc-topbar::after { content:""; position:absolute; left:0; right:0; bottom:0; height:1.5px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-single-root .rc-topbar__in { max-width:1120px; margin:0 auto; padding:10px 20px;
          display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
        .rc-single-root .rc-logo { position:relative; display:inline-flex; align-items:center; flex-shrink:0;
          padding:6px 12px 6px 14px; background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px);
          box-shadow:1px 3px 8px -5px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-single-root .rc-logo::before { content:""; position:absolute; left:-3px; top:8px; width:10px; height:18px;
          border:2px solid var(--rc-faint); border-right:none; border-radius:6px 0 0 6px; background:transparent; transform:rotate(-4deg); }
        .rc-single-root .rc-logo__img { height:28px; width:auto; object-fit:contain; display:block; }
        .rc-single-root .rc-nav { display:none; gap:8px; margin-left:auto; align-items:center; }
        .rc-single-root .rc-nav__link { position:relative; display:inline-flex; align-items:center; min-height:40px;
          font-family:var(--rc-fr); font-weight:600; font-size:12.5px; letter-spacing:.01em; color:var(--rc-ink2);
          padding:0 13px 0 16px; background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px);
          transition:transform .15s ease, color .2s ease, background .2s ease, border-color .2s ease; }
        .rc-single-root .rc-nav__link::before { content:""; position:absolute; left:4px; top:7px; bottom:7px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 2px, transparent 2px 5px); }
        .rc-single-root .rc-nav__link:hover { transform:translateY(-1px); color:var(--rc-ink); border-color:var(--rc-accent); }
        .rc-single-root .rc-nav__link.on { color:var(--rc-accent-deep); border-color:var(--rc-accent);
          background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); }
        .rc-single-root .rc-nav__link.on::before { left:1px;
          background:repeating-linear-gradient(180deg, var(--rc-accent) 0 2px, transparent 2px 5px); }
        .rc-single-root .rc-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .rc-single-root .rc-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--rc-fh);
          font-weight:600; font-size:13px; color:var(--rc-on-accent); background:var(--rc-accent); border:none; cursor:pointer;
          padding:9px 20px; border-radius:var(--rc-radius-button, 8px); transition:background .2s ease, transform .15s ease; }
        .rc-single-root .rc-loginbtn:hover { background:var(--rc-accent-deep); transform:translateY(-1px); }
        .rc-single-root .rc-loginbtn:active { transform:scale(.96); }
        .rc-single-root .rc-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--rc-line) 70%, var(--rc-receipt)); }
        .rc-single-root .rc-skelbar { display:block; width:58px; height:12px; border-radius:3px;
          background:color-mix(in srgb, var(--rc-ink2) 30%, var(--rc-receipt)); animation:rcPulse 1.3s ease-in-out infinite; }
        @keyframes rcPulse { 0%,100%{opacity:.45} 50%{opacity:1} }
        /* user chip = a LANYARD CARD (cut corner + a punched grommet hole on top) */
        .rc-single-root .rc-userchip { position:relative; }
        .rc-single-root .rc-userchip__btn { position:relative; display:inline-flex; align-items:center; gap:9px; min-height:44px;
          background:var(--rc-receipt); border:1.5px solid var(--rc-stamp-line); padding:5px 14px 5px 5px; cursor:pointer;
          font-family:inherit; clip-path:polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
          transition:transform .15s ease, border-color .2s ease; }
        .rc-single-root .rc-userchip__btn::after { content:""; position:absolute; top:5px; right:12px; width:9px; height:9px;
          border-radius:50%; background:var(--rc-desk);
          box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--rc-faint) 62%, var(--rc-ink2)); }
        .rc-single-root .rc-userchip__btn:hover { border-color:var(--rc-accent); }
        .rc-single-root .rc-userchip__btn:active { transform:scale(.97); }
        .rc-single-root .rc-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:var(--rc-accent); color:var(--rc-on-accent); font-family:var(--rc-fh); font-weight:700; font-size:14px; line-height:1; }
        .rc-single-root .rc-userchip__name { font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-single-root .rc-userchip__caret { color:var(--rc-ink2); font-size:11px; }
        .rc-single-root .rc-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--rc-receipt);
          border:1.5px solid var(--rc-stamp-line); border-radius:10px; overflow:hidden; z-index:50;
          box-shadow:2px 20px 42px -20px color-mix(in srgb, var(--rc-ink) 22%, transparent); }
        .rc-single-root .rc-usermenu__head { padding:14px 16px; border-bottom:1px dotted var(--rc-line); }
        .rc-single-root .rc-usermenu__name { font-family:var(--rc-fh); font-weight:700; font-size:14px; color:var(--rc-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-single-root .rc-usermenu__id { font-family:var(--rc-fm); font-size:10.5px; letter-spacing:.04em; color:var(--rc-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-single-root .rc-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-accent-deep); }
        .rc-single-root .rc-usermenu__out:hover { background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); }
        .rc-single-root .rc-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:8px; background:var(--rc-receipt); border:1.5px solid var(--rc-stamp-line); cursor:pointer;
          transition:transform .15s ease, border-color .2s ease; }
        .rc-single-root .rc-burger:hover { border-color:var(--rc-accent); }
        .rc-single-root .rc-burger:active { transform:scale(.95); }
        .rc-single-root .rc-burger span { display:block; height:2.5px; border-radius:2px; background:var(--rc-ink); }
        .rc-single-root .rc-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .rc-single-root .rc-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .rc-single-root .rc-sheet__link { position:relative; display:flex; align-items:center; min-height:48px; padding:0 16px 0 20px;
          font-family:var(--rc-fr); font-weight:600; font-size:14px; color:var(--rc-ink);
          background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px); transition:border-color .2s ease; }
        .rc-single-root .rc-sheet__link::before { content:""; position:absolute; left:5px; top:9px; bottom:9px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 2px, transparent 2px 5px); }
        .rc-single-root .rc-sheet__link:hover { border-color:var(--rc-accent); }

        /* ---- page container ---- */
        .rc-single-root .rc-single-wrap { position:relative; z-index:1; max-width:900px; margin:0 auto; padding:0 20px 210px; }
        .rc-single-root .rc-issue { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:14px 0;
          border-bottom:1px dotted var(--rc-line); font-family:var(--rc-fm); font-size:10px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--rc-faint);
          /* the serial line prints out left→right like a thermal head (stepped clip) */
          animation:rcThermal .85s steps(28) both .02s; }

        /* ---- party feature masthead ---- */
        .rc-single-root .rc-sp-head { margin-top:32px; padding-bottom:24px; border-bottom:1.5px solid var(--rc-stamp-line);
          animation:rcVRise .55s ease both .04s; }
        .rc-single-root .rc-sp-kick { font-family:var(--rc-fm); font-size:10px; letter-spacing:.24em; text-transform:uppercase;
          color:var(--rc-ink2); }
        .rc-single-root .rc-sp-hero { display:flex; align-items:center; gap:22px; margin-top:20px; }
        .rc-single-root .rc-sp-logo { width:104px; height:104px; flex:none; border-radius:8px; overflow:hidden;
          background:var(--rc-receipt); border:1px solid var(--rc-line); display:grid; place-items:center;
          box-shadow:2px 14px 30px -18px color-mix(in srgb, var(--rc-ink) 32%, transparent); }
        .rc-single-root .rc-sp-logo img { width:100%; height:100%; object-fit:cover; }
        .rc-single-root .rc-sp-logo-ph { font-family:var(--rc-fh); font-weight:700; font-size:40px;
          font-variant-numeric:tabular-nums; color:var(--rc-accent-deep); }
        .rc-single-root .rc-sp-title { min-width:0; }
        .rc-single-root .rc-sp-num { font-family:var(--rc-fm); font-size:11px; letter-spacing:.16em; text-transform:uppercase;
          color:var(--rc-ink2); }
        /* the party numeral presses down like an ink stamp (over-scale + tilt settle) */
        .rc-single-root .rc-sp-num b { color:var(--rc-accent-deep); font-weight:700;
          display:inline-block; animation:rcInkStamp .5s cubic-bezier(.34,1.56,.64,1) both .3s; }
        .rc-single-root .rc-sp-word { margin:6px 0 0; font-family:var(--rc-fh); font-weight:700; line-height:1.04;
          font-size:clamp(30px,7vw,52px); letter-spacing:-.01em; color:var(--rc-ink); overflow-wrap:break-word;
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; }
        .rc-single-root .rc-sp-slogan { margin:12px 0 0; font-family:var(--rc-fr); font-size:15px; line-height:1.6; color:var(--rc-ink2); }

        /* voter register strip (mirrors ReceiptVote rc-vvoter) */
        .rc-single-root .rc-vvoter { margin-top:20px; display:flex; flex-wrap:wrap; gap:10px 26px; padding:14px 0 2px;
          animation:rcVRise .55s ease both .1s; }
        .rc-single-root .rc-vvoter__row { display:inline-flex; align-items:baseline; gap:9px; font-family:var(--rc-fm);
          font-size:12px; letter-spacing:.04em; color:var(--rc-ink); min-width:0; font-variant-numeric:tabular-nums; }
        .rc-single-root .rc-vvoter__row b { font-weight:400; letter-spacing:.14em; text-transform:uppercase; color:var(--rc-faint); }

        /* group cover — a print framed on the desk (soft down-right lift) */
        .rc-single-root .rc-sp-cover { margin:32px 0 0; position:relative; background:var(--rc-receipt);
          border:1px solid var(--rc-line); border-radius:4px; padding:10px 10px 12px; overflow:hidden;
          /* the group print is LAID onto the desk — drops from a hair above with a
             slight tilt, then settles flat (transform/opacity only) */
          animation:rcDrop .6s cubic-bezier(.22,1,.36,1) both .16s;
          box-shadow:3px 20px 44px -24px color-mix(in srgb, var(--rc-ink) 30%, transparent); }
        .rc-single-root .rc-sp-cover img { width:100%; height:clamp(220px,40vw,420px); object-fit:cover; display:block; border-radius:3px; }
        .rc-single-root .rc-sp-cover figcaption { position:absolute; left:16px; bottom:16px; font-family:var(--rc-fm); font-size:10px;
          letter-spacing:.16em; text-transform:uppercase; color:var(--rc-receipt);
          background:color-mix(in srgb, var(--rc-ink) 82%, transparent); padding:6px 13px; border-radius:3px;
          /* the caption chip is pressed on right after the print lands (tape follows) */
          transform-origin:left bottom; animation:rcPress .42s cubic-bezier(.34,1.56,.64,1) both .54s; }

        /* ---- generic section (about / policies / team) ---- */
        .rc-single-root .rc-sp-sec { margin-top:48px; }
        .rc-single-root .rc-sp-sec__head { display:flex; align-items:flex-end; gap:14px; padding-bottom:14px;
          border-bottom:1.5px solid var(--rc-stamp-line); }
        .rc-single-root .rc-sp-sec__kick { font-family:var(--rc-fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase;
          color:var(--rc-faint); }
        .rc-single-root .rc-sp-sec__title { margin:0; font-family:var(--rc-fh); font-weight:700; font-size:clamp(24px,6vw,40px);
          line-height:1; letter-spacing:-.01em; color:var(--rc-ink); }
        .rc-single-root .rc-sp-sec__count { margin-left:auto; font-family:var(--rc-fm); font-size:10px; letter-spacing:.16em;
          text-transform:uppercase; color:var(--rc-ink2); white-space:nowrap; padding-bottom:3px; font-variant-numeric:tabular-nums; }
        .rc-single-root .rc-sp-story { margin:20px 0 0; font-family:var(--rc-fr); font-size:15.5px; line-height:1.85; color:var(--rc-ink2); }
        /* StoryClamp — the booth keeps the stamping desk close: a long story folds */
        .rc-single-root .rc-sc { --sc-max:9em; --sc-fade:var(--rc-receipt); }
        .rc-single-root .rc-sc .sc__hint { color:var(--rc-accent-deep); font-family:var(--rc-fm); text-transform:uppercase; }
        /* small logo chip on the LOGO MEANING head — ties the story to the mark */
        .rc-single-root .rc-sp-sec__logo { width:40px; height:40px; flex:none; border-radius:6px; overflow:hidden; align-self:center;
          background:var(--rc-receipt); border:1px solid var(--rc-line); display:grid; place-items:center; }
        .rc-single-root .rc-sp-sec__logo img { width:100%; height:100%; object-fit:cover; }
        /* missions — numbered lines in the receipt voice (mono numeral, Chakra text) */
        .rc-single-root .rc-sp-mlist { list-style:none; margin:20px 0 0; padding:0; display:flex; flex-direction:column; gap:14px; }
        .rc-single-root .rc-sp-mlist li { display:grid; grid-template-columns:auto 1fr; gap:16px; align-items:start;
          padding-top:14px; border-top:1px dotted var(--rc-line); }
        .rc-single-root .rc-sp-mlist li:first-child { border-top:none; padding-top:0; }
        .rc-single-root .rc-sp-mlist__n { font-family:var(--rc-fm); font-weight:700; font-size:16px; line-height:1.3;
          font-variant-numeric:tabular-nums; color:var(--rc-accent-deep); }
        .rc-single-root .rc-sp-mlist__t { font-family:var(--rc-fr); font-size:15px; line-height:1.6; color:var(--rc-ink); }

        /* policies — perforated COUPONS, one per row (die-cut left edge; hover lifts) */
        .rc-single-root .rc-sp-plist { list-style:none; margin:16px 0 0; padding:0; display:flex; flex-direction:column; gap:12px; }
        .rc-single-root .rc-sp-plist li { position:relative; display:grid; grid-template-columns:auto 1fr; gap:18px; align-items:center;
          padding:16px 18px 16px 26px; background:var(--rc-receipt); border:1px solid var(--rc-line); border-radius:4px;
          box-shadow:1px 8px 20px -16px color-mix(in srgb, var(--rc-ink) 40%, transparent);
          transition:transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
        .rc-single-root .rc-sp-plist li::before { content:""; position:absolute; left:9px; top:12px; bottom:12px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 3px, transparent 3px 7px); }
        .rc-single-root .rc-sp-plist li:hover { transform:translateY(-3px); border-color:var(--rc-accent);
          box-shadow:2px 16px 28px -20px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-single-root .rc-sp-plist .n { display:grid; place-items:center; width:40px; height:40px; flex:none; border-radius:50%;
          border:2px solid var(--rc-accent-deep); font-family:var(--rc-fh); font-weight:800; font-size:18px; line-height:1;
          font-variant-numeric:tabular-nums; color:var(--rc-accent-deep); }
        .rc-single-root .rc-sp-plist .t { font-family:var(--rc-fr); font-size:15px; line-height:1.55; color:var(--rc-ink); }

        /* team — a horizontal PHOTO-STRIP off the print machine (scrolls x) */
        .rc-single-root .rc-sp-team { margin-top:20px; display:flex; gap:14px; overflow-x:auto; padding:2px 2px 10px;
          scroll-snap-type:x proximity; -webkit-overflow-scrolling:touch; }
        .rc-single-root .rc-sp-cand { margin:0; flex:0 0 clamp(150px, 44vw, 188px); scroll-snap-align:start;
          background:var(--rc-receipt); border:1px solid var(--rc-line); border-radius:4px;
          overflow:hidden; transition:transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
        .rc-single-root .rc-sp-cand:hover { transform:translateY(-4px); border-color:var(--rc-accent);
          box-shadow:2px 22px 40px -26px color-mix(in srgb, var(--rc-ink) 32%, transparent); }
        .rc-single-root .rc-sp-cand__photo { display:block; width:100%; aspect-ratio:4/5; overflow:hidden;
          background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); position:relative; }
        .rc-single-root .rc-sp-cand__photo img { width:100%; height:100%; object-fit:cover; display:block; }
        .rc-single-root .rc-sp-cand__ph { position:absolute; inset:0; display:grid; place-items:center;
          font-family:var(--rc-fh); font-weight:700; font-size:44px; color:var(--rc-accent-deep); }
        .rc-single-root .rc-sp-cand__body { display:flex; flex-direction:column; gap:3px; padding:13px 15px 15px; }
        .rc-single-root .rc-sp-cand__name { font-family:var(--rc-fh); font-weight:700; font-size:15px; line-height:1.2; color:var(--rc-ink); }
        .rc-single-root .rc-sp-cand__role { font-family:var(--rc-fm); font-size:9.5px; letter-spacing:.1em; text-transform:uppercase;
          color:var(--rc-ink2); }

        /* ---- the decision: receipt-stock ballot sheet (mirrors ReceiptVote) ---- */
        .rc-single-root .rc-ballot { position:relative; margin-top:52px; animation:rcVRise .55s ease both .2s; }
        .rc-single-root .rc-ballot-ghost { position:absolute; z-index:0; right:-16px; top:-24px; width:104px; height:104px;
          border-radius:50%; border:2px solid var(--rc-ink); opacity:.08; transform:rotate(-12deg); display:grid; place-items:center; }
        .rc-single-root .rc-ballot-ghost span { font-family:var(--rc-fm); font-size:11px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--rc-ink); text-align:center; }
        .rc-single-root .rc-ballot-sheet { position:relative; z-index:1; background:var(--rc-receipt); padding:22px 22px 30px;
          border:1px solid var(--rc-line); border-bottom:none; border-radius:4px 4px 0 0;
          box-shadow:2px 16px 38px -20px color-mix(in srgb, var(--rc-ink) 32%, transparent);
          background-image:repeating-linear-gradient(180deg, transparent 0 27px, color-mix(in srgb, var(--rc-ink) 3%, transparent) 27px 28px);
          -webkit-mask:radial-gradient(7px 9px at 9px 100%, transparent 96%, #000) bottom left/18px 9px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 9px) no-repeat;
                  mask:radial-gradient(7px 9px at 9px 100%, transparent 96%, #000) bottom left/18px 9px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 9px) no-repeat; }
        .rc-single-root .rc-ballot-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
        .rc-single-root .rc-ballot-head__l { font-family:var(--rc-fm); font-size:10.5px; letter-spacing:.2em; text-transform:uppercase;
          color:var(--rc-ink); font-weight:700; }
        .rc-single-root .rc-ballot-head__r { font-family:var(--rc-fm); font-size:10.5px; letter-spacing:.12em; color:var(--rc-accent-deep);
          white-space:nowrap; }
        .rc-single-root .rc-perf { margin:16px -22px; height:1px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }

        /* ---- decision rows — 3 INK STAMPS (SEMANTIC tones, FIXED, never accent/holo) ---- */
        .rc-single-root .rc-sballot { list-style:none; margin:0; padding:0; }
        /* house semantic system: approve=green · disapprove=red · abstain=orange.
           --rc-tone / --rc-tone-deep are the ONLY non-var(--rc-*) colours here and are
           deliberately fixed so a choice means the same thing in every Receipt theme. */
        .rc-single-root .rc-sopt--approve { --rc-tone:#16A34A; --rc-tone-deep:#15803D; }
        .rc-single-root .rc-sopt--disapprove { --rc-tone:#DC2626; --rc-tone-deep:#B91C1C; }
        .rc-single-root .rc-sopt--abstain { --rc-tone:#EA580C; --rc-tone-deep:#C2410C; }
        .rc-single-root .rc-sopt { border-bottom:1px dotted var(--rc-line); }
        .rc-single-root .rc-sopt:last-child { border-bottom:none; }
        .rc-single-root .rc-sopt__hit { position:relative; display:grid; grid-template-columns:auto 1fr; align-items:center;
          gap:18px; padding:20px 6px; cursor:pointer; color:var(--rc-ink); transition:background .2s ease; }
        .rc-single-root .rc-sopt__hit:hover { background:color-mix(in srgb, var(--rc-tone) 5%, transparent); }
        .rc-single-root .rc-sopt.is-selected .rc-sopt__hit { background:color-mix(in srgb, var(--rc-tone) 8%, transparent); }

        /* the STAMP PAD — a square ink pad; selecting presses a rotated semantic ink
           stamp in (transform/opacity only → base-visible; reduced-motion = instant) */
        .rc-single-root .rc-sopt__pad { position:relative; width:60px; height:60px; flex:none; border:2px solid var(--rc-stamp-line);
          border-radius:6px; background:var(--rc-receipt); display:grid; place-items:center; transition:border-color .2s ease; }
        .rc-single-root .rc-sopt__hit:hover .rc-sopt__pad { border-color:var(--rc-tone); }
        .rc-single-root .rc-sopt.is-selected .rc-sopt__pad { border-color:var(--rc-tone-deep); }
        /* the rubber FACE — each stamp head wears its semantic tone at rest (a rubber
           strip along the bottom of the head), so the three stamps read green/red/orange
           before any interaction */
        .rc-single-root .rc-sopt__pad { box-shadow:inset 0 -8px 0 color-mix(in srgb, var(--rc-tone) 55%, var(--rc-receipt)); }
        /* rubber-stamp HANDLE — a dark grip rising above the rubber head; hover lifts
           it, selecting presses it down (transform-only). Reads the row as a real stamp. */
        .rc-single-root .rc-sopt__pad::after { content:""; position:absolute; left:50%; top:-15px; transform:translateX(-50%);
          width:15px; height:17px; border-radius:5px 5px 3px 3px;
          background:linear-gradient(180deg, color-mix(in srgb, var(--rc-ink) 68%, var(--rc-faint)), var(--rc-ink));
          box-shadow:0 2px 4px -1px color-mix(in srgb, var(--rc-ink) 45%, transparent); transition:transform .2s ease; }
        .rc-single-root .rc-sopt__hit:hover .rc-sopt__pad::after { transform:translateX(-50%) translateY(-2px); }
        .rc-single-root .rc-sopt.is-selected .rc-sopt__pad::after { transform:translateX(-50%) translateY(1px); }
        .rc-single-root .rc-sopt__ink { position:absolute; inset:7px; border:3px solid var(--rc-tone-deep); border-radius:5px;
          display:grid; place-items:center; font-family:var(--rc-fh); font-weight:800; font-size:22px; line-height:1;
          color:var(--rc-tone-deep); transform:scale(0) rotate(-16deg); opacity:0;
          transition:transform .26s cubic-bezier(.34,1.56,.64,1), opacity .18s ease; }
        .rc-single-root .rc-sopt.is-selected .rc-sopt__ink { transform:scale(1) rotate(-8deg); opacity:.92; }

        .rc-single-root .rc-sopt__body { min-width:0; display:flex; flex-direction:column; gap:2px; }
        .rc-single-root .rc-sopt__kick { font-family:var(--rc-fm); font-size:10px; letter-spacing:.16em; text-transform:uppercase;
          color:var(--rc-tone-deep); }
        .rc-single-root .rc-sopt__name { font-family:var(--rc-fh); font-weight:700; font-size:clamp(20px,5vw,28px); line-height:1.14;
          letter-spacing:-.01em; color:var(--rc-ink); }
        .rc-single-root .rc-sopt.is-selected .rc-sopt__name { color:var(--rc-tone-deep); }
        .rc-single-root .rc-sopt__note { margin-top:2px; font-family:var(--rc-fr); font-size:13.5px; line-height:1.5; color:var(--rc-ink2); }

        /* ---- the empty stamping SLOT + pressed imprint (enhancement layer) ---- */
        .rc-single-root .rc-stampslot { position:relative; margin:4px 0 8px; min-height:90px; display:grid; place-items:center;
          border:1.5px dashed var(--rc-stamp-line); border-radius:8px; overflow:hidden;
          background:color-mix(in srgb, var(--rc-ink) 2%, var(--rc-receipt)); }
        /* faint blind ring-impression watermark centred in the empty slot — a ring in
           --rc-ink at low opacity with the faculty ship at its centre (v2-R6), an ink
           impression under the hint. z:0 so the hint (z:1) + semantic imprints stamp
           over it. Rotated a touch so it reads as a pressed mark, not a reticle. */
        .rc-single-root .rc-stampslot__impress { position:absolute; left:50%; top:50%; z-index:0;
          width:64px; height:64px; transform:translate(-50%,-50%) rotate(-7deg); border-radius:50%;
          border:2px solid var(--rc-ink); opacity:.07; display:grid; place-items:center; pointer-events:none; }
        .rc-single-root .rc-stampslot__ship { width:58%; height:58%; color:var(--rc-ink); }
        /* hint: mono LATIN lead-in + Chakra Thai (A10.3 — Thai never wears mono) */
        .rc-single-root .rc-stampslot__hint { position:relative; z-index:1; font-family:var(--rc-fr); font-size:12px; letter-spacing:.06em;
          color:var(--rc-faint); display:inline-flex; align-items:baseline; gap:6px; }
        .rc-single-root .rc-stampslot__hint .rc-mono { font-size:10px; letter-spacing:.18em; text-transform:uppercase; }
        /* 3-colour ink pad in the slot corner — SEMANTIC wells (fixed, never accent) */
        .rc-single-root .rc-inkwells { position:absolute; right:10px; bottom:8px; display:inline-flex; gap:4px; }
        .rc-single-root .rc-inkwell { width:20px; height:9px; border-radius:2px;
          border:1px solid color-mix(in srgb, var(--rc-ink) 22%, transparent);
          box-shadow:inset 0 1.5px 2px color-mix(in srgb, var(--rc-ink) 32%, transparent); }
        .rc-single-root .rc-inkwell--a { background:color-mix(in srgb, #16A34A 72%, var(--rc-receipt)); }
        .rc-single-root .rc-inkwell--d { background:color-mix(in srgb, #DC2626 72%, var(--rc-receipt)); }
        .rc-single-root .rc-inkwell--x { background:color-mix(in srgb, #EA580C 72%, var(--rc-receipt)); }
        /* the imprint — a rotated ring stamp in the choice's SEMANTIC tone. Base state
           is the FINAL (visible) frame; rcSoak only supplies the entrance from-state, so
           reduced-motion / JS-nuked-animation shows the pressed stamp instantly and the
           row radios remain the true fallback. --rc-tone comes from the rc-sopt--* class. */
        .rc-single-root .rc-imprint { position:absolute; display:inline-flex; align-items:center; gap:10px; padding:8px 18px;
          border:3px solid var(--rc-tone-deep); border-radius:8px; background:color-mix(in srgb, var(--rc-tone) 8%, var(--rc-receipt));
          transform:rotate(-7deg) scale(1); opacity:.94; animation:rcSoak .34s cubic-bezier(.34,1.56,.64,1) both; }
        .rc-single-root .rc-imprint__glyph { font-family:var(--rc-fh); font-weight:800; font-size:26px; line-height:1; color:var(--rc-tone-deep); }
        .rc-single-root .rc-imprint__txt { font-family:var(--rc-fh); font-weight:800; font-size:20px; letter-spacing:.02em; color:var(--rc-tone-deep); }
        .rc-single-root .rc-imprint--ghost { opacity:0; animation:rcGhostOut .65s ease forwards; }
        @keyframes rcSoak { from { transform:rotate(-7deg) scale(.9); opacity:0; } }
        @keyframes rcGhostOut { 0% { transform:rotate(-7deg) scale(1); opacity:.5; } 100% { transform:rotate(-11deg) scale(1.06); opacity:0; } }

        /* ---- sticky "ไปที่การตัดสินใจ ↓" shortcut (IO-driven, transform/opacity) ---- */
        .rc-single-root .rc-jump-sentinel { height:1px; width:1px; }
        .rc-single-root .rc-jump { position:fixed; right:16px; bottom:98px; z-index:39; display:inline-flex; align-items:center;
          min-height:44px; padding:0 16px 0 20px; cursor:pointer; font-family:var(--rc-fh); font-weight:700; font-size:13.5px;
          color:var(--rc-on-accent); background:var(--rc-accent-deep); border:none;
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px);
          box-shadow:2px 12px 26px -12px color-mix(in srgb, var(--rc-ink) 55%, transparent);
          transform:translateY(16px); opacity:0; pointer-events:none;
          transition:transform .28s cubic-bezier(.22,1,.36,1), opacity .28s ease; }
        .rc-single-root .rc-jump.is-in { transform:translateY(0); opacity:1; pointer-events:auto; }
        .rc-single-root .rc-jump__arrow { margin-left:2px; }

        .rc-single-root .rc-ballot-foot { margin-top:8px; text-align:center; font-family:var(--rc-fm); font-size:9px;
          letter-spacing:.24em; color:var(--rc-faint); }

        /* ---- fixed confirm tray (paper strip + foil-rim button) — mirrors ReceiptVote ---- */
        .rc-single-root .rc-vbar { position:fixed; left:0; right:0; bottom:0; z-index:38; background:var(--rc-receipt);
          box-shadow:0 -12px 30px -18px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-single-root .rc-vbar__perf { height:4px; background:repeating-linear-gradient(90deg,
          var(--rc-stamp-line) 0 6px, transparent 6px 12px); border-top:1.5px solid var(--rc-stamp-line); }
        .rc-single-root .rc-vbar__in { max-width:900px; margin:0 auto; padding:14px 20px; display:flex; align-items:center; gap:16px; }
        .rc-single-root .rc-vbar__sel { min-width:0; flex:1; display:flex; flex-direction:column; gap:3px; }
        .rc-single-root .rc-vbar__lab { font-family:var(--rc-fm); font-size:9.5px; letter-spacing:.18em; text-transform:uppercase;
          color:var(--rc-faint); }
        .rc-single-root .rc-vbar__val { display:inline-flex; align-items:center; gap:9px; min-width:0; font-family:var(--rc-fh);
          font-weight:700; font-size:clamp(16px,4.2vw,22px); line-height:1.15; color:var(--rc-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-single-root .rc-vbar__val--empty { color:var(--rc-faint); font-weight:600; }
        .rc-single-root .rc-vbar__dot { width:10px; height:10px; flex:none; background:var(--rc-accent); border-radius:50%; }
        /* selection tint follows the SEMANTIC tone of the chosen stamp (fixed colours) */
        .rc-single-root .rc-vbar__val--approve { color:#15803D; }
        .rc-single-root .rc-vbar__val--approve .rc-vbar__dot { background:#16A34A; }
        .rc-single-root .rc-vbar__val--disapprove { color:#B91C1C; }
        .rc-single-root .rc-vbar__val--disapprove .rc-vbar__dot { background:#DC2626; }
        .rc-single-root .rc-vbar__val--abstain { color:#C2410C; }
        .rc-single-root .rc-vbar__val--abstain .rc-vbar__dot { background:#EA580C; }
        /* foil-rim confirm button (rc-cta idiom) */
        .rc-single-root .rc-vbar__btn { position:relative; isolation:isolate; flex:none; border:none; cursor:pointer;
          padding:15px 26px; border-radius:var(--rc-radius-button, 8px); background:transparent; transition:transform .18s ease; }
        .rc-single-root .rc-vbar__btn .rc-foil { position:absolute; inset:-2px; z-index:0; border-radius:calc(var(--rc-radius-button, 8px) + 2px); }
        .rc-single-root .rc-vbar__btn::before { content:""; position:absolute; inset:0; z-index:1; border-radius:inherit;
          background:var(--rc-accent); transition:background .2s ease; }
        .rc-single-root .rc-vbar__btn-in { position:relative; z-index:2; display:inline-flex; align-items:center; justify-content:center;
          gap:9px; font-family:var(--rc-fh); font-weight:700; font-size:16px; color:var(--rc-on-accent); }
        .rc-single-root .rc-vbar__arrow { transition:transform .2s ease; }
        .rc-single-root .rc-vbar.is-ready .rc-vbar__btn:hover { transform:translateY(-2px); }
        .rc-single-root .rc-vbar.is-ready .rc-vbar__btn:hover::before { background:var(--rc-accent-deep); }
        .rc-single-root .rc-vbar.is-ready .rc-vbar__btn:hover .rc-vbar__arrow { transform:translateX(3px); }
        .rc-single-root .rc-vbar__btn:active { transform:scale(.98); }
        .rc-single-root .rc-vbar__btn:disabled { cursor:not-allowed; }
        .rc-single-root .rc-vbar__btn:disabled::before { background:color-mix(in srgb, var(--rc-ink2) 22%, var(--rc-line)); }
        .rc-single-root .rc-vbar__btn:disabled .rc-vbar__btn-in { color:color-mix(in srgb, var(--rc-receipt) 88%, var(--rc-ink)); }

        /* ---- confirm dialog (Receipt paper card) — NO backdrop-filter (A7.1): a solid
           ink scrim instead of a blur ---- */
        .rc-single-root .rc-scm { position:fixed; inset:0; z-index:60; display:grid; place-items:center; padding:24px;
          background:color-mix(in srgb, var(--rc-ink) 56%, transparent);
          animation:rcScmFade .2s ease both; }
        /* card = a paper slip torn off a pad (sibling of ReceiptConfirmSlip): die-cut
           corner + top perforation strip + grain (.rc-grain supplies stock+tile). */
        .rc-single-root .rc-scm__card { position:relative; width:min(460px,100%); border:1px solid var(--rc-line);
          clip-path:polygon(14px 0, 100% 0, 100% 100%, 0 100%, 0 14px);
          padding:32px; text-align:center; animation:rcScmPop .28s cubic-bezier(.16,1,.3,1) both;
          box-shadow:3px 44px 80px -30px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-single-root .rc-scm__perf { position:absolute; left:10px; right:10px; top:7px; height:2px; pointer-events:none;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-single-root .rc-scm__eyebrow { font-family:var(--rc-fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase;
          color:var(--rc-faint); }
        .rc-single-root .rc-scm__title { margin:12px 0 8px; font-family:var(--rc-fh); font-weight:700; font-size:clamp(24px,6vw,32px);
          letter-spacing:-.01em; color:var(--rc-ink); }
        .rc-single-root .rc-scm__sub { margin:0 0 22px; font-family:var(--rc-fr); font-size:14px; line-height:1.6; color:var(--rc-ink2); }
        .rc-single-root .rc-scm__sub b { color:var(--rc-ink); font-weight:700; }
        .rc-single-root .rc-scm__pick { display:flex; flex-direction:column; gap:6px; padding:16px 18px; margin-bottom:24px;
          border:1.5px dashed var(--rc-stamp-line); border-radius:6px; text-align:left; }
        .rc-single-root .rc-scm__pick--approve { border-color:#16A34A; background:color-mix(in srgb, #16A34A 7%, var(--rc-receipt)); }
        .rc-single-root .rc-scm__pick--disapprove { border-color:#DC2626; background:color-mix(in srgb, #DC2626 7%, var(--rc-receipt)); }
        .rc-single-root .rc-scm__pick--abstain { border-color:#EA580C; background:color-mix(in srgb, #EA580C 7%, var(--rc-receipt)); }
        .rc-single-root .rc-scm__pick-lab { font-family:var(--rc-fm); font-size:10px; letter-spacing:.16em; text-transform:uppercase;
          color:var(--rc-ink2); }
        .rc-single-root .rc-scm__pick-val { font-family:var(--rc-fh); font-weight:700; font-size:18px; color:var(--rc-ink); }
        .rc-single-root .rc-scm__actions { display:flex; gap:12px; }
        .rc-single-root .rc-scm__cancel { flex:1; min-height:50px; padding:13px 18px; border-radius:var(--rc-radius-button, 8px); cursor:pointer;
          font-family:var(--rc-fh); font-weight:700; font-size:15px; color:var(--rc-ink);
          background:var(--rc-receipt); border:1.5px solid var(--rc-ink); transition:background .2s ease; }
        .rc-single-root .rc-scm__cancel:hover { background:color-mix(in srgb, var(--rc-ink) 6%, var(--rc-receipt)); }
        /* confirm = foil RIM behind an accent fill, text on top (rc-cta idiom) —
           sibling of ReceiptConfirmSlip's confirm */
        .rc-single-root .rc-scm__go { position:relative; isolation:isolate; flex:2; border:none; cursor:pointer;
          min-height:50px; padding:13px 22px; border-radius:var(--rc-radius-button, 8px); background:transparent;
          transition:transform .2s ease; }
        .rc-single-root .rc-scm__go .rc-foil { position:absolute; inset:-2px; z-index:0;
          border-radius:calc(var(--rc-radius-button, 8px) + 2px); }
        .rc-single-root .rc-scm__go::before { content:""; position:absolute; inset:0; z-index:1; border-radius:inherit;
          background:var(--rc-accent); transition:background .2s ease; }
        .rc-single-root .rc-scm__go-in { position:relative; z-index:2; display:inline-flex; align-items:center;
          justify-content:center; gap:9px; font-family:var(--rc-fh); font-weight:700; font-size:15px; color:var(--rc-on-accent); }
        .rc-single-root .rc-scm__go:hover { transform:translateY(-1px); }
        .rc-single-root .rc-scm__go:hover::before { background:var(--rc-accent-deep); }
        .rc-single-root .rc-scm__go .rc-scm__arrow { transition:transform .25s ease; }
        .rc-single-root .rc-scm__go:hover .rc-scm__arrow { transform:translateX(3px); }
        .rc-single-root .rc-scm__go:disabled, .rc-single-root .rc-scm__cancel:disabled { opacity:.6; cursor:not-allowed; }
        .rc-single-root .rc-scm__go:disabled::before { background:color-mix(in srgb, var(--rc-ink2) 40%, var(--rc-receipt)); }

        @keyframes rcVRise { from { opacity:0; transform:translateY(14px); } }
        @keyframes rcScmFade { from { opacity:0; } }
        @keyframes rcScmPop { from { opacity:0; transform:translateY(18px) scale(.96); } }
        /* v2-R12 desk choreography — "things laid on the table" */
        @keyframes rcDrop { from { opacity:0; transform:translateY(-12px) rotate(-1.4deg); } 55% { opacity:1; } to { transform:translateY(0) rotate(0); } }
        @keyframes rcPress { from { opacity:0; transform:scale(.82); } }
        @keyframes rcInkStamp { 0% { opacity:0; transform:scale(1.45) rotate(-9deg); } 55% { opacity:1; } to { transform:scale(1) rotate(0); } }
        @keyframes rcThermal { from { clip-path:inset(0 100% 0 0); } }

        /* ---- footer ---- */
        .rc-single-root .rc-single-footer { position:relative; z-index:1; margin-top:8px; padding:22px 0; border-top:1px dotted var(--rc-line);
          text-align:center; }
        .rc-single-root .rc-single-footer p { margin:0; font-family:var(--rc-fm); font-size:10px; letter-spacing:.12em;
          text-transform:uppercase; color:var(--rc-ink2); }

        /* ================= TABLET+ : inline nav + roomier layout ================= */
        @media (min-width:768px) {
          .rc-single-root .rc-topbar__in { gap:22px; }
          .rc-single-root .rc-nav { display:flex; }
          .rc-single-root .rc-userwrap { margin-left:0; }
          .rc-single-root .rc-burger, .rc-single-root .rc-sheet { display:none; }
          .rc-single-root .rc-sp-team { grid-template-columns:repeat(4,1fr); }
          .rc-single-root .rc-sopt__hit { gap:22px; padding:22px 10px; }
        }

        /* ================= MOBILE (<=560): tighten, tap targets >=44px ================= */
        @media (max-width:560px) {
          .rc-single-root .rc-single-wrap { padding-bottom:220px; }
          .rc-single-root .rc-sp-hero { gap:16px; }
          .rc-single-root .rc-sp-logo { width:82px; height:82px; }
          .rc-single-root .rc-sp-team { grid-template-columns:repeat(2,1fr); }
          .rc-single-root .rc-sopt__hit { padding:16px 4px; gap:14px; }
          .rc-single-root .rc-vbar__in { flex-direction:column; align-items:stretch; gap:10px; padding:12px 18px; }
          .rc-single-root .rc-vbar__btn { width:100%; }
          .rc-single-root .rc-scm__actions { flex-direction:column-reverse; }
          .rc-single-root .rc-scm__cancel, .rc-single-root .rc-scm__go { width:100%; flex:none; }
          /* shortcut clears the taller mobile tray + reads quieter (spec: จางบนมือถือ) */
          .rc-single-root .rc-jump { right:12px; bottom:172px; font-size:12.5px; }
          .rc-single-root .rc-jump.is-in { opacity:.82; }
        }

        /* reduced motion — freeze every animation (foil stays statically iridescent),
           full booth visible. Scoped to .rc-single-root. */
        @media (prefers-reduced-motion:reduce) {
          .rc-single-root *, .rc-single-root *::before, .rc-single-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
