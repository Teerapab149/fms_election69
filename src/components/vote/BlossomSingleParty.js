"use client";

// BlossomSingleParty — SINGLE-PARTY VOTE (booth) for the "Blossom Civic" template
// family, in the calm "Candy Editorial" language (same family as BlossomHome /
// BlossomCandidates / BlossomVote / BlossomResults / BlossomSuccess). This is the
// single-candidate ballot: when only ONE party stands, the voter reads a full
// editorial FEATURE of that party (party numeral + logo medallion + name/slogan,
// group cover, about-the-party brief, key policies as index rows, the team as a
// portrait grid) and then makes the 3-choice DECISION:
//   รับรอง (approve) · ไม่รับรอง (disapprove) · งดออกเสียง (abstain)
//
// The three choice colours are the house SEMANTIC system — approve=green,
// disapprove=red, abstain=amber/orange — FIXED per choice and deliberately NOT
// var(--bl-*) candy (they must mean the same thing across every theme). Only the
// SURROUNDING chrome (the paper card, hairlines, the ink confirm band) is calm
// Blossom. This mirrors how VerdureSingleParty tones its rows via vd-tone--*.
//
// Dispatched from BlossomVote when isSingleParty. Pure presentation: vote/page.js
// owns auth + the vote-system hook; onConfirm() IS the submit (single-party has no
// shared VoteConfirmationModal — the confirm dialog here calls onConfirm directly,
// the same contract as GumroadSingleParty / VerdureSingleParty). Colours flow ONLY
// through var(--bl-*) emitted by BlossomBaseStyles on .bl-root; the chrome (topbar +
// footer + blobs + dot-grid) mirrors the rest of the family. Calm rules match the
// ballot page: dots 8%/28px, faded blobs, solid two-tone display word, and every
// base state is visible (entrance CSS only supplies the hidden from-frame, so
// reduced-motion / no-JS lands everything visible — no JS-gated content).

import { useState } from "react";
import { getPath } from "../../utils/basePath";
import { BlossomTopBar } from "../home/BlossomHome";
import { BlossomBaseStyles } from "../home/BlossomTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { sortMembersByPosition } from "../../utils/memberSort";
import StoryClamp from "./StoryClamp";

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
// tone ∈ approve | disapprove | abstain sets the FIXED semantic colour.
function ChoiceRow({ tone, kick, name, note, selected, onSelect }) {
  return (
    <li className={`bl-sopt bl-sopt--${tone}${selected ? " is-selected" : ""}`}>
      <div
        className="bl-sopt__hit"
        role="radio"
        aria-checked={selected}
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(); } }}
      >
        <span className="bl-sopt__mark" aria-hidden="true">
          <svg className="bl-sopt__tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4.2 4.2L19 7" /></svg>
        </span>
        <span className="bl-sopt__body">
          <span className="bl-sopt__kick">{kick}</span>
          <span className="bl-sopt__name">{name}</span>
          {note && <span className="bl-sopt__note">{note}</span>}
        </span>
      </div>
    </li>
  );
}

export default function BlossomSingleParty({
  party = {}, specialOptions = {}, selectedPartyId = null,
  onSelect = () => {}, onConfirm = () => {}, isSubmitting = false,
  user = null, editorMode = false,
}) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";
  const copyrightYear = gc.copyrightYear ?? "";

  const [confirmOpen, setConfirmOpen] = useState(false);

  const abstain = specialOptions?.abstain;
  const disapprove = specialOptions?.disapprove;

  const logo = resolveSrc(party?.logoUrl);
  const cover = resolveSrc(firstImage(party?.groupImageUrls) || firstImage(party?.officialImageUrl) || firstImage(party?.mobileHeroImage));
  const story = (party?.logoMeaning || "").trim();
  const showStory = story && !story.startsWith("ยังไม่มีข้อมูล");
  // keep the placeholder defaults preparePartyData injects out of the printed pages
  const missions = (party?.missions || []).map(asText).filter((t) => t && !t.startsWith("ยังไม่มีข้อมูล"));
  const policies = (party?.policies || []).filter((p) => {
    const t = asText(p);
    return t && !t.startsWith("ยังไม่มีข้อมูล");
  });
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

  return (
    <div className="fms-app bl-root bl-single-root">
      <BlossomBaseStyles />

      {/* organic candy blobs (faded toward canvas — calm) */}
      <span className="bl-blob bl-blob-1" aria-hidden="true" />
      <span className="bl-blob bl-blob-2" aria-hidden="true" />

      <BlossomTopBar editorMode={editorMode} active="/vote" />

      <div className="bl-page">
        {/* ===== issue line (masthead — single-ballot variant) ===== */}
        <div className="bl-issue-line">
          <span>ลงคะแนน <b>·</b> SINGLE BALLOT</span>
          <span>{prefix} {number}</span>
        </div>

        {/* ===== party feature masthead ===== */}
        <header className="bl-sp-head">
          <span className="bl-sp-kick"><span className="bl-sp-dot" aria-hidden="true" />พรรคเดียวที่ลงสมัคร · THE ONLY PARTY</span>
          <div className="bl-sp-hero">
            <span className="bl-sp-logo">
              {logo ? (
                <img src={logo} alt={party?.name || "โลโก้พรรค"} />
              ) : (
                <span className="bl-sp-logo-ph" aria-hidden="true">{pad2(no)}</span>
              )}
            </span>
            <div className="bl-sp-title">
              <span className="bl-sp-num">พรรคหมายเลข <b>{no}</b></span>
              <h1 className="bl-sp-word"><span className="bl-sp-word__in">{party?.name || "พรรค"}</span></h1>
              {party?.slogan && <p className="bl-sp-slogan">“{party.slogan}”</p>}
            </div>
          </div>
        </header>

        {/* voter receipt — mono, editorial (mirrors BlossomVote / BlossomSuccess) */}
        <div className="bl-sp-voter">
          <span className="bl-sp-voter__row"><b>VOTER</b>{name || "ผู้มีสิทธิ์เลือกตั้ง"}</span>
          <span className="bl-sp-voter__row"><b>ID</b>{sid}</span>
          <span className="bl-sp-voter__row"><b>BALLOT</b>1 PARTY</span>
        </div>

        {/* group cover (poster grammar — never cropped) */}
        {cover && (
          <figure className="bl-sp-cover">
            <img src={cover} alt={`ภาพหมู่พรรค ${party?.name || ""}`} />
            <figcaption>ภาพหมู่พรรค · GROUP PHOTO</figcaption>
          </figure>
        )}

        {/* logo meaning — the story explains the party mark (logo chip ties them) */}
        {showStory && (
          <section className="bl-sp-sec">
            <div className="bl-sp-sec__head">
              {logo && <span className="bl-sp-sec__logo"><img src={logo} alt={party?.name || "โลโก้พรรค"} /></span>}
              <span className="bl-sp-sec__kick">LOGO MEANING</span>
              <h2 className="bl-sp-sec__title">ความหมายสัญลักษณ์</h2>
            </div>
            <StoryClamp className="bl-sc"><p className="bl-sp-story">{story}</p></StoryClamp>
          </section>
        )}

        {/* พันธกิจ — missions, mono numerals + list */}
        {missions.length > 0 && (
          <section className="bl-sp-sec">
            <div className="bl-sp-sec__head">
              <span className="bl-sp-sec__kick">MISSION</span>
              <h2 className="bl-sp-sec__title">พันธกิจ</h2>
              <span className="bl-sp-sec__count">{pad2(missions.length)} ข้อ</span>
            </div>
            <ol className="bl-sp-mlist">
              {missions.map((m, i) => (
                <li key={i}><span className="bl-sp-mlist__n">{pad2(i + 1)}</span><span className="bl-sp-mlist__t">{m}</span></li>
              ))}
            </ol>
          </section>
        )}

        {/* key policies — editorial index rows */}
        {policies.length > 0 && (
          <section className="bl-sp-sec">
            <div className="bl-sp-sec__head">
              <span className="bl-sp-sec__kick">KEY POLICIES</span>
              <h2 className="bl-sp-sec__title">นโยบายเด่น</h2>
              <span className="bl-sp-sec__count">{pad2(policies.length)} ข้อ</span>
            </div>
            <ol className="bl-sp-plist">
              {policies.map((p, i) => {
                const title = typeof p === "object" ? (p.title || p.text || p.name || "") : p;
                const desc = typeof p === "object" ? (p.desc || p.description || p.detail || "") : "";
                return (
                  <li key={i}><span className="n">{pad2(i + 1)}</span><span className="bl-sp-pbody"><span className="t">{title}</span>{desc && <span className="d">{desc}</span>}</span></li>
                );
              })}
            </ol>
          </section>
        )}

        {/* the team — portrait grid */}
        {members.length > 0 && (
          <section className="bl-sp-sec">
            <div className="bl-sp-sec__head">
              <span className="bl-sp-sec__kick">THE TEAM</span>
              <h2 className="bl-sp-sec__title">ทีมผู้สมัคร</h2>
              <span className="bl-sp-sec__count">{pad2(members.length)} คน</span>
            </div>
            <div className="bl-sp-team">
              {members.map((m, i) => {
                const img = resolveSrc(m?.imageUrl);
                return (
                  <figure className="bl-sp-cand" key={m.id || i}>
                    <span className="bl-sp-cand__photo">
                      {img ? <img src={img} alt={m.name} /> : <span className="bl-sp-cand__ph" aria-hidden="true">{(m.name || "?").trim().charAt(0)}</span>}
                    </span>
                    <figcaption className="bl-sp-cand__body">
                      <span className="bl-sp-cand__name">{m.name}</span>
                      {(m.position || m.major) && <span className="bl-sp-cand__role">{m.position || m.major}</span>}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== the decision — ballot paper card (semantic 3-choice) ===== */}
        <section className="bl-vpaper" id="bl-sp-decision" aria-label="การตัดสินใจของคุณ">
          <div className="bl-vpaper__cap"><span>การตัดสินใจ · YOUR DECISION</span><em>1 คน · 1 เสียง</em></div>
          <ul className="bl-sballot">
            <ChoiceRow
              tone="approve"
              kick="เห็นชอบ · APPROVE"
              name="รับรอง"
              note={`เห็นชอบให้ ${party?.name || "พรรคนี้"} ดำรงตำแหน่ง`}
              selected={kind === "approve"}
              onSelect={pick(party?.id)}
            />
            {disapprove && (
              <ChoiceRow
                tone="disapprove"
                kick="ไม่เห็นชอบ · DISAPPROVE"
                name="ไม่รับรอง"
                note="ไม่เห็นชอบให้พรรคที่ลงสมัครดำรงตำแหน่ง"
                selected={kind === "disapprove"}
                onSelect={pick(disapprove.id)}
              />
            )}
            {abstain && (
              <ChoiceRow
                tone="abstain"
                kick="งดออกเสียง · ABSTAIN"
                name="งดออกเสียง"
                note="ไม่ประสงค์ลงคะแนนเสียงในการเลือกตั้งครั้งนี้"
                selected={kind === "abstain"}
                onSelect={pick(abstain.id)}
              />
            )}
          </ul>
        </section>
      </div>

      {/* ===== fixed confirm bar (ink band — same climax grammar as the ballot) ===== */}
      <div className={`bl-vconfirm${canConfirm ? " is-ready" : ""}`}>
        <div className="bl-vconfirm__in">
          <div className="bl-vconfirm__sel">
            <span className="bl-vconfirm__lab">การเลือกของคุณ · YOUR SELECTION</span>
            {selectionLabel ? (
              <span className={`bl-vconfirm__val bl-vconfirm__val--${kind}`}>
                <span className="bl-vconfirm__dia" aria-hidden="true" />{selectionLabel}
              </span>
            ) : (
              <span className="bl-vconfirm__val bl-vconfirm__val--empty">ยังไม่ได้เลือก · No selection</span>
            )}
          </div>
          <button
            type="button"
            className="bl-vconfirm__btn"
            disabled={!canConfirm}
            onClick={() => canConfirm && setConfirmOpen(true)}
          >
            {isSubmitting ? "กำลังบันทึก…" : "ยืนยันการลงคะแนน"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* ===== confirm dialog (Blossom paper card) ===== */}
      {confirmOpen && (
        <div className="bl-scm" onClick={() => !isSubmitting && setConfirmOpen(false)} role="dialog" aria-modal="true">
          <div className="bl-scm__card" onClick={(e) => e.stopPropagation()}>
            <span className="bl-scm__eyebrow">ยืนยันครั้งสุดท้าย · FINAL CONFIRMATION</span>
            <h3 className="bl-scm__title">ยืนยันการลงคะแนน</h3>
            <p className="bl-scm__sub">เมื่อยืนยันแล้ว<b>จะไม่สามารถแก้ไขได้</b> กรุณาตรวจสอบตัวเลือกของคุณ</p>
            <div className={`bl-scm__pick bl-scm__pick--${kind}`}>
              <span className="bl-scm__pick-lab">การเลือกของคุณ</span>
              <span className="bl-scm__pick-val">{selectionLabel || "—"}</span>
            </div>
            <div className="bl-scm__actions">
              <button type="button" className="bl-scm__cancel" onClick={() => setConfirmOpen(false)} disabled={isSubmitting}>ยกเลิก</button>
              <button type="button" className="bl-scm__go" onClick={() => onConfirm()} disabled={isSubmitting}>
                {isSubmitting ? "กำลังบันทึก…" : "ยืนยัน ลงคะแนนเลย"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== footer — plain classic line (mirrors bl-footer on home) ===== */}
      <footer className="bl-footer">
        <p>© FMS@PSU{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
      </footer>

      <style jsx global>{`
        /* ================= SHARED CHROME (mirrors BlossomVote) ================= */
        .bl-single-root { overflow-x:hidden; }
        /* dot-grid paper texture — calm 8%/28px (owner 2026-07-12) */
        .bl-single-root::after { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:radial-gradient(color-mix(in srgb, var(--bl-ink) 8%, transparent) 1px, transparent 1.4px);
          background-size:28px 28px; }
        :where(.bl-single-root) a { color:var(--bl-primary-deep); text-decoration:none; }
        :where(.bl-single-root) a:hover { color:var(--bl-ink); }

        /* blobs — faded toward the canvas (calm) */
        .bl-single-root .bl-blob { position:absolute; pointer-events:none; z-index:0; }
        .bl-single-root .bl-blob-1 { top:-16vw; right:-22vw; width:64vw; height:64vw; min-width:380px; min-height:380px;
          background:color-mix(in srgb, var(--bl-primary-soft) 45%, var(--bl-canvas)); border-radius:52% 48% 60% 40%/55% 60% 40% 45%;
          animation:blMorph 14s ease-in-out infinite alternate; }
        .bl-single-root .bl-blob-2 { bottom:4%; left:-18vw; width:46vw; height:46vw; min-width:280px; min-height:280px;
          background:color-mix(in srgb, var(--bl-sup3) 45%, var(--bl-canvas)); border-radius:60% 40% 45% 55%/45% 55% 60% 40%;
          animation:blMorph 18s ease-in-out infinite alternate-reverse; }
        @keyframes blMorph {
          0%   { border-radius:52% 48% 60% 40%/55% 60% 40% 45%; }
          50%  { border-radius:44% 56% 42% 58%/60% 42% 58% 40%; }
          100% { border-radius:58% 42% 55% 45%/42% 58% 45% 55%; }
        }

        .bl-single-root .bl-page { position:relative; z-index:1; max-width:1200px; margin:0 auto; padding:0 22px 180px; }

        /* ---- topbar (editorial hairline skin) ---- */
        .bl-single-root .bl-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--bl-canvas) 88%, transparent);
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
          border-bottom:1.5px solid var(--bl-ink); }
        .bl-single-root .bl-topbar__in { max-width:1200px; margin:0 auto; padding:14px 22px;
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .bl-single-root .bl-logo { display:inline-flex; align-items:center; flex-shrink:0; border-radius:8px; }
        .bl-single-root .bl-logo__img { height:30px; width:auto; object-fit:contain; display:block; }
        .bl-single-root .bl-nav { display:none; gap:20px; margin-left:auto; align-items:center; }
        .bl-single-root .bl-nav__link { font-family:var(--bl-fm); font-size:11.5px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--bl-ink2); position:relative; padding-bottom:2px; border-radius:4px; transition:color .2s ease; }
        .bl-single-root .bl-nav__link.on, .bl-single-root .bl-nav__link:hover { color:var(--bl-ink); }
        .bl-single-root .bl-nav__link::after { content:""; position:absolute; left:0; right:0; bottom:-3px; height:3px;
          background:var(--bl-primary); border-radius:2px; transform:scaleX(0); transform-origin:left;
          transition:transform .28s cubic-bezier(.22,1,.36,1); }
        .bl-single-root .bl-nav__link:hover::after { transform:scaleX(1); }
        .bl-single-root .bl-nav__link.on::after { transform:scaleX(1); }

        .bl-single-root .bl-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .bl-single-root .bl-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--bl-fd); font-weight:600;
          font-size:13px; color:var(--bl-canvas); background:var(--bl-ink); border:none; cursor:pointer;
          padding:9px 20px; border-radius:999px; transition:background .2s ease, transform .15s ease; }
        .bl-single-root .bl-loginbtn:hover { background:var(--bl-primary-deep); transform:translateY(-1px); }
        .bl-single-root .bl-loginbtn:active { transform:scale(.96); }
        .bl-single-root .bl-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--bl-line) 70%, var(--bl-card)); }
        .bl-single-root .bl-skelbar { display:block; width:58px; height:12px; border-radius:6px;
          background:color-mix(in srgb, var(--bl-ink2) 30%, var(--bl-card)); animation:blPulse 1.3s ease-in-out infinite; }
        @keyframes blPulse { 0%,100%{opacity:.45} 50%{opacity:1} }

        .bl-single-root .bl-userchip { position:relative; }
        .bl-single-root .bl-userchip__btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:999px; padding:5px 12px 5px 5px; cursor:pointer;
          font-family:inherit; transition:transform .15s ease, background .2s ease; }
        .bl-single-root .bl-userchip__btn:hover { background:color-mix(in srgb, var(--bl-primary) 7%, var(--bl-card)); }
        .bl-single-root .bl-userchip__btn:active { transform:scale(.97); }
        .bl-single-root .bl-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:linear-gradient(135deg, var(--bl-primary), var(--bl-primary-deep)); color:var(--bl-on-primary, var(--bl-card));
          font-family:var(--bl-fd); font-weight:700; font-size:14px; line-height:1; }
        .bl-single-root .bl-userchip__name { font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-single-root .bl-userchip__caret { color:var(--bl-ink2); font-size:11px; }
        .bl-single-root .bl-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:16px; overflow:hidden; z-index:50;
          box-shadow:0 18px 40px -18px color-mix(in srgb, var(--bl-ink) 12%, transparent); }
        .bl-single-root .bl-usermenu__head { padding:14px 16px; border-bottom:1px solid var(--bl-line); }
        .bl-single-root .bl-usermenu__name { font-family:var(--bl-fd); font-weight:700; font-size:14px; color:var(--bl-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-single-root .bl-usermenu__id { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.04em; color:var(--bl-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-single-root .bl-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-primary-deep); }
        .bl-single-root .bl-usermenu__out:hover { background:color-mix(in srgb, var(--bl-primary) 10%, var(--bl-card)); }

        .bl-single-root .bl-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:12px; background:var(--bl-card); border:1.5px solid var(--bl-ink); cursor:pointer;
          transition:transform .15s ease, background .2s ease; }
        .bl-single-root .bl-burger:hover { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }
        .bl-single-root .bl-burger:active { transform:scale(.95); }
        .bl-single-root .bl-burger span { display:block; height:2.5px; border-radius:2px; background:var(--bl-ink); }

        .bl-single-root .bl-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .bl-single-root .bl-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .bl-single-root .bl-sheet__link { display:flex; align-items:center; min-height:44px; padding:11px 16px; border-radius:12px;
          font-family:var(--bl-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--bl-ink);
          background:var(--bl-card); border:1px solid var(--bl-line); transition:border-color .2s ease, background .2s ease; }
        .bl-single-root .bl-sheet__link:hover { border-color:var(--bl-primary); }
        .bl-single-root .bl-sheet__link:active { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }

        /* focus-visible (keyboard) — 2px primary-deep outline on every interactive element */
        .bl-single-root a:focus-visible, .bl-single-root button:focus-visible,
        .bl-single-root [role="radio"]:focus-visible {
          outline:2px solid var(--bl-primary-deep); outline-offset:2px; }

        /* ---- issue line (masthead) ---- */
        .bl-single-root .bl-issue-line { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:12px 0;
          border-bottom:1px solid var(--bl-line); font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--bl-ink2); }
        .bl-single-root .bl-issue-line b { color:var(--bl-primary-deep); font-weight:700; }

        /* ---- footer: plain classic single line, centered ---- */
        .bl-single-root .bl-footer { margin-top:0; padding:24px 0; border-top:1px solid var(--bl-line); text-align:center;
          position:relative; z-index:1; }
        .bl-single-root .bl-footer p { margin:0; font-size:10px; letter-spacing:.12em; text-transform:uppercase;
          font-weight:500; color:var(--bl-ink2); }

        /* ================= SINGLE-PARTY BOOTH (unique layout) ================= */
        /* ---- party feature masthead ---- */
        .bl-single-root .bl-sp-head { margin-top:44px; padding-bottom:26px; border-bottom:1.5px solid var(--bl-ink);
          animation:blSRise .6s ease both .05s; }
        .bl-single-root .bl-sp-kick { display:inline-flex; align-items:center; gap:9px; font-family:var(--bl-fm); font-size:10.5px;
          letter-spacing:.2em; text-transform:uppercase; color:var(--bl-ink2); }
        .bl-single-root .bl-sp-dot { width:7px; height:7px; border-radius:50%; background:var(--bl-primary);
          animation:blSBlip 1.6s infinite; }
        @keyframes blSBlip { 50%{opacity:.3} }
        .bl-single-root .bl-sp-hero { display:flex; align-items:center; gap:26px; margin-top:22px; }
        .bl-single-root .bl-sp-logo { width:112px; height:112px; flex:none; border-radius:26px; overflow:hidden;
          background:var(--bl-card); border:1.5px solid var(--bl-ink); display:grid; place-items:center;
          box-shadow:0 20px 44px -30px color-mix(in srgb, var(--bl-ink) 30%, transparent); }
        .bl-single-root .bl-sp-logo img { width:100%; height:100%; object-fit:cover; }
        .bl-single-root .bl-sp-logo-ph { font-family:var(--bl-fd); font-weight:800; font-size:40px;
          font-variant-numeric:tabular-nums; color:var(--bl-primary-deep); }
        .bl-single-root .bl-sp-title { min-width:0; }
        .bl-single-root .bl-sp-num { font-family:var(--bl-fm); font-size:11px; letter-spacing:.16em; text-transform:uppercase;
          color:var(--bl-ink2); }
        .bl-single-root .bl-sp-num b { color:var(--bl-primary-deep); font-weight:700; }
        /* display word — SOLID (the party name), calm ink; not hollow (action page). */
        /* party name wraps up to ~3 lines (masthead grows with content); ellipsis only
           caps an extreme name at line 3. line-clamp:2 clipped long names to "…" at 390 */
        .bl-single-root .bl-sp-word { margin:6px 0 0; overflow:hidden; }
        /* the name text lives in an inner block that slides up out of the .bl-sp-word
           window (blSuccUp — same idiom as BlossomSuccess). line-clamp lives here so
           the reveal survives 1–3 line names. base state (no anim) = translateY(0). */
        .bl-single-root .bl-sp-word__in { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical;
          overflow:hidden; font-family:var(--bl-fd); font-weight:800; line-height:.98;
          font-size:clamp(34px,8vw,66px); letter-spacing:-.02em; color:var(--bl-ink); overflow-wrap:break-word;
          text-overflow:ellipsis; animation:blSuccUp .62s cubic-bezier(.22,1,.36,1) both .18s; }
        @keyframes blSuccUp { from { transform:translateY(108%); } }
        .bl-single-root .bl-sp-slogan { margin:12px 0 0; font-family:var(--bl-fd); font-weight:500; font-style:italic;
          font-size:clamp(15px,3.6vw,18px); line-height:1.6; color:var(--bl-ink2); }

        /* voter receipt — mono chips (mirrors ballot receipt) */
        .bl-single-root .bl-sp-voter { margin-top:22px; display:flex; flex-wrap:wrap; gap:10px 26px;
          padding:16px 0 4px; border-bottom:1px solid var(--bl-line);
          animation:blSRise .6s ease both .14s; }
        .bl-single-root .bl-sp-voter__row { display:inline-flex; align-items:baseline; gap:9px;
          font-family:var(--bl-fm); font-size:12px; letter-spacing:.04em; color:var(--bl-ink); min-width:0; }
        .bl-single-root .bl-sp-voter__row b { font-weight:400; letter-spacing:.16em; text-transform:uppercase; color:var(--bl-faint); }

        /* group cover (poster grammar — full artwork, never cropped) */
        .bl-single-root .bl-sp-cover { margin:36px 0 0; position:relative; border:1.5px solid var(--bl-ink); border-radius:22px;
          overflow:hidden; background:var(--bl-card); animation:blSRise .6s ease both .2s;
          box-shadow:0 26px 54px -34px color-mix(in srgb, var(--bl-ink) 26%, transparent); }
        .bl-single-root .bl-sp-cover img { width:100%; height:clamp(240px,40vw,440px); object-fit:cover; display:block; }
        .bl-single-root .bl-sp-cover figcaption { position:absolute; left:14px; bottom:14px; font-family:var(--bl-fm); font-size:10px;
          letter-spacing:.16em; text-transform:uppercase; color:var(--bl-canvas);
          background:color-mix(in srgb, var(--bl-ink) 82%, transparent); padding:6px 13px; border-radius:999px; }

        /* ---- generic section (about / policies / team) ---- */
        .bl-single-root .bl-sp-sec { margin-top:52px; }
        .bl-single-root .bl-sp-sec__head { display:flex; align-items:flex-end; gap:14px; padding-bottom:16px;
          border-bottom:1.5px solid var(--bl-ink); }
        .bl-single-root .bl-sp-sec__kick { font-family:var(--bl-fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase;
          color:var(--bl-faint); }
        .bl-single-root .bl-sp-sec__title { margin:0; font-family:var(--bl-fd); font-weight:800; font-size:clamp(24px,6vw,40px);
          line-height:.95; letter-spacing:-.02em; color:var(--bl-ink); }
        .bl-single-root .bl-sp-sec__count { margin-left:auto; font-family:var(--bl-fm); font-size:11px; letter-spacing:.16em;
          text-transform:uppercase; color:var(--bl-ink2); white-space:nowrap; padding-bottom:3px; }
        .bl-single-root .bl-sp-story { margin:22px 0 0; font-family:var(--bl-fd); font-weight:500; font-size:clamp(15px,3.6vw,17px);
        /* StoryClamp — the booth keeps the decision zone close: a long story folds */
        .bl-single-root .bl-sc { --sc-max:8em; --sc-fade:var(--bl-card); }
        .bl-single-root .bl-sc .sc__hint { color:var(--bl-primary-deep); font-family:var(--bl-fm); text-transform:uppercase; }
          line-height:1.85; color:var(--bl-ink2); }
        /* small logo chip on the LOGO MEANING head — ties the story to the mark */
        .bl-single-root .bl-sp-sec__logo { width:40px; height:40px; flex:none; border-radius:12px; overflow:hidden; align-self:center;
          background:var(--bl-card); border:1.5px solid var(--bl-ink); display:grid; place-items:center; }
        .bl-single-root .bl-sp-sec__logo img { width:100%; height:100%; object-fit:cover; }
        /* missions — mono numerals + list (mirrors the ballot family voice) */
        .bl-single-root .bl-sp-mlist { list-style:none; margin:20px 0 0; padding:0; }
        .bl-single-root .bl-sp-mlist li { display:grid; grid-template-columns:auto 1fr; gap:20px; align-items:baseline;
          padding:18px 6px; border-bottom:1px solid var(--bl-line); }
        .bl-single-root .bl-sp-mlist li:last-child { border-bottom:none; }
        .bl-single-root .bl-sp-mlist__n { font-family:var(--bl-fm); font-weight:700; font-size:clamp(15px,3.4vw,18px); line-height:1.4;
          font-variant-numeric:tabular-nums; letter-spacing:.02em; color:var(--bl-primary-deep); }
        .bl-single-root .bl-sp-mlist__t { font-family:var(--bl-fd); font-weight:500; font-size:clamp(15px,3.6vw,17px); line-height:1.7;
          color:var(--bl-ink); }

        /* policies — index rows */
        .bl-single-root .bl-sp-plist { list-style:none; margin:14px 0 0; padding:0; }
        .bl-single-root .bl-sp-plist li { display:grid; grid-template-columns:auto 1fr; gap:20px; align-items:start;
          padding:18px 6px; border-bottom:1px solid var(--bl-line); }
        .bl-single-root .bl-sp-plist li:last-child { border-bottom:none; }
        .bl-single-root .bl-sp-plist .n { font-family:var(--bl-fd); font-weight:800; font-size:clamp(22px,5vw,34px); line-height:1;
          font-variant-numeric:tabular-nums; letter-spacing:-.02em; color:var(--bl-primary-deep); }
        .bl-single-root .bl-sp-plist .bl-sp-pbody { display:block; }
        .bl-single-root .bl-sp-plist .t { display:block; font-family:var(--bl-fd); font-weight:500; font-size:clamp(15px,3.6vw,17px); line-height:1.6;
          color:var(--bl-ink); }
        .bl-single-root .bl-sp-plist .d { display:block; font-family:var(--bl-fb, var(--bl-fd)); font-weight:400; font-size:clamp(13px,3.2vw,14.5px); line-height:1.62;
          color:var(--bl-ink-soft, var(--bl-ink)); opacity:.75; margin-top:5px; }

        /* team — portrait grid */
        .bl-single-root .bl-sp-team { margin-top:22px; display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
        .bl-single-root .bl-sp-cand { margin:0; background:var(--bl-card); border:1.5px solid var(--bl-line); border-radius:18px;
          overflow:hidden; transition:transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
        .bl-single-root .bl-sp-cand:hover { transform:translateY(-4px); border-color:var(--bl-primary);
          box-shadow:0 24px 44px -28px color-mix(in srgb, var(--bl-ink) 30%, transparent); }
        .bl-single-root .bl-sp-cand__photo { display:block; width:100%; aspect-ratio:4/5; overflow:hidden;
          background:color-mix(in srgb, var(--bl-primary-soft) 60%, var(--bl-card)); position:relative; }
        .bl-single-root .bl-sp-cand__photo img { width:100%; height:100%; object-fit:cover; display:block; }
        .bl-single-root .bl-sp-cand__ph { position:absolute; inset:0; display:grid; place-items:center;
          font-family:var(--bl-fd); font-weight:800; font-size:44px; color:var(--bl-primary-deep); }
        .bl-single-root .bl-sp-cand__body { display:flex; flex-direction:column; gap:3px; padding:13px 15px 15px; }
        .bl-single-root .bl-sp-cand__name { font-family:var(--bl-fd); font-weight:800; font-size:15px; line-height:1.2; color:var(--bl-ink); }
        .bl-single-root .bl-sp-cand__role { font-family:var(--bl-fm); font-size:9.5px; letter-spacing:.1em; text-transform:uppercase;
          color:var(--bl-ink2); }

        /* ---- the decision — ballot paper card (mirrors ballot bl-vpaper) ---- */
        .bl-single-root .bl-vpaper { margin-top:56px; background:var(--bl-card); border:1.5px solid var(--bl-ink);
          border-radius:24px; overflow:hidden; scroll-margin-top:90px; animation:blSRise .55s ease both .24s;
          box-shadow:0 24px 50px -30px color-mix(in srgb, var(--bl-ink) 22%, transparent); }
        .bl-single-root .bl-vpaper__cap { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
          padding:15px 22px; border-bottom:1.5px solid var(--bl-ink);
          background:color-mix(in srgb, var(--bl-primary) 6%, var(--bl-card)); }
        .bl-single-root .bl-vpaper__cap span { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.2em;
          text-transform:uppercase; color:var(--bl-ink); font-weight:700; }
        .bl-single-root .bl-vpaper__cap em { font-family:var(--bl-fm); font-style:normal; font-size:10.5px;
          letter-spacing:.14em; color:var(--bl-primary-deep); white-space:nowrap; }

        /* ---- decision rows (SEMANTIC colours — FIXED per choice, never candy) ---- */
        .bl-single-root .bl-sballot { list-style:none; margin:0; padding:0; }
        .bl-single-root .bl-sopt { border-bottom:1px solid var(--bl-line); }
        .bl-single-root .bl-sopt:last-child { border-bottom:none; }
        /* house semantic system: approve=green · disapprove=red · abstain=amber/orange.
           --bl-tone / --bl-tone-deep are the ONLY non-var(--bl-*) colours here and are
           deliberately fixed so a choice means the same thing in every Blossom theme. */
        .bl-single-root .bl-sopt--approve { --bl-tone:#16A34A; --bl-tone-deep:#15803D; }
        .bl-single-root .bl-sopt--disapprove { --bl-tone:#DC2626; --bl-tone-deep:#B91C1C; }
        .bl-single-root .bl-sopt--abstain { --bl-tone:#EA580C; --bl-tone-deep:#C2410C; }
        .bl-single-root .bl-sopt__hit { position:relative; display:grid; grid-template-columns:auto 1fr; align-items:center;
          gap:18px; padding:22px 20px; cursor:pointer; color:var(--bl-ink);
          border-left:4px solid transparent; transition:background .25s ease, border-color .25s ease; }
        .bl-single-root .bl-sopt__hit:hover { background:color-mix(in srgb, var(--bl-tone) 6%, var(--bl-card)); }
        .bl-single-root .bl-sopt.is-selected .bl-sopt__hit { background:color-mix(in srgb, var(--bl-tone) 10%, var(--bl-card));
          border-left-color:var(--bl-tone-deep); }
        /* round marker fills the semantic tone with a white tick when selected */
        .bl-single-root .bl-sopt__mark { width:28px; height:28px; flex:none; border-radius:50%;
          border:2px solid color-mix(in srgb, var(--bl-ink2) 40%, var(--bl-line)); display:grid; place-items:center;
          background:var(--bl-card); transition:border-color .2s ease, background .2s ease; }
        .bl-single-root .bl-sopt__hit:hover .bl-sopt__mark { border-color:var(--bl-tone); }
        .bl-single-root .bl-sopt__tick { width:15px; height:15px; color:#fff; transform:scale(0);
          transition:transform .22s cubic-bezier(.22,1,.36,1); }
        .bl-single-root .bl-sopt.is-selected .bl-sopt__mark { border-color:var(--bl-tone-deep); background:var(--bl-tone-deep); }
        .bl-single-root .bl-sopt.is-selected .bl-sopt__tick { transform:scale(1); }
        .bl-single-root .bl-sopt__body { min-width:0; display:flex; flex-direction:column; gap:3px; }
        .bl-single-root .bl-sopt__kick { font-family:var(--bl-fm); font-size:10px; letter-spacing:.16em; text-transform:uppercase;
          color:var(--bl-tone-deep); }
        .bl-single-root .bl-sopt__name { font-family:var(--bl-fd); font-weight:800; font-size:clamp(20px,5vw,28px); line-height:1.14;
          letter-spacing:-.01em; color:var(--bl-ink); }
        .bl-single-root .bl-sopt.is-selected .bl-sopt__name { color:var(--bl-tone-deep); }
        .bl-single-root .bl-sopt__note { margin-top:2px; font-family:var(--bl-fd); font-weight:500; font-size:13.5px; line-height:1.5;
          color:var(--bl-ink2); }

        /* ---- fixed confirm bar — INK BAND (mirrors the ballot climax grammar) ---- */
        .bl-single-root .bl-vconfirm { position:fixed; left:0; right:0; bottom:0; z-index:38;
          background:var(--bl-ink); border-top:3px solid var(--bl-primary); }
        .bl-single-root .bl-vconfirm__in { max-width:1200px; margin:0 auto; padding:14px 22px;
          display:flex; align-items:center; gap:18px; }
        .bl-single-root .bl-vconfirm__sel { min-width:0; flex:1; display:flex; flex-direction:column; gap:3px; }
        .bl-single-root .bl-vconfirm__lab { font-family:var(--bl-fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase;
          color:color-mix(in srgb, var(--bl-canvas) 55%, transparent); }
        .bl-single-root .bl-vconfirm__val { display:inline-flex; align-items:center; gap:10px; min-width:0;
          font-family:var(--bl-fd); font-weight:800; font-size:clamp(17px,4.4vw,24px); line-height:1.1; letter-spacing:-.01em;
          color:var(--bl-canvas); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-single-root .bl-vconfirm__val--empty { color:color-mix(in srgb, var(--bl-canvas) 55%, transparent); font-weight:600; }
        .bl-single-root .bl-vconfirm__dia { width:12px; height:12px; flex:none; background:var(--bl-primary); transform:rotate(45deg); }
        /* semantic choice colours LIGHTENED for contrast on the dark ink band */
        .bl-single-root .bl-vconfirm__val--approve { color:#4ADE80; }
        .bl-single-root .bl-vconfirm__val--approve .bl-vconfirm__dia { background:#22C55E; }
        .bl-single-root .bl-vconfirm__val--disapprove { color:#FCA5A5; }
        .bl-single-root .bl-vconfirm__val--disapprove .bl-vconfirm__dia { background:#EF4444; }
        .bl-single-root .bl-vconfirm__val--abstain { color:#FDBA74; }
        .bl-single-root .bl-vconfirm__val--abstain .bl-vconfirm__dia { background:#F97316; }
        .bl-single-root .bl-vconfirm__btn { flex:none; display:inline-flex; align-items:center; justify-content:center; gap:9px;
          min-height:52px; padding:14px 26px; border-radius:999px; border:none; cursor:pointer;
          font-family:var(--bl-fd); font-weight:700; font-size:16px;
          color:var(--bl-on-primary, var(--bl-card)); background:var(--bl-primary);
          transition:transform .2s ease, background .25s ease, filter .25s ease; }
        .bl-single-root .bl-vconfirm__btn svg { flex:none; transition:transform .25s ease; }
        .bl-single-root .bl-vconfirm.is-ready .bl-vconfirm__btn:hover { transform:translateY(-2px); filter:brightness(1.06); }
        .bl-single-root .bl-vconfirm.is-ready .bl-vconfirm__btn:hover svg { transform:translateX(3px); }
        .bl-single-root .bl-vconfirm__btn:active { transform:scale(.97); }
        .bl-single-root .bl-vconfirm__btn:disabled { cursor:not-allowed;
          color:color-mix(in srgb, var(--bl-canvas) 45%, transparent);
          background:color-mix(in srgb, var(--bl-canvas) 14%, transparent); }

        /* ---- confirm dialog (paper card) ---- */
        .bl-single-root .bl-scm { position:fixed; inset:0; z-index:60; display:grid; place-items:center; padding:24px;
          background:color-mix(in srgb, var(--bl-ink) 46%, transparent); -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px);
          animation:blSFade .2s ease both; }
        .bl-single-root .bl-scm__card { width:min(460px,100%); background:var(--bl-card); border:1.5px solid var(--bl-ink);
          border-radius:24px; padding:32px; text-align:center; animation:blSPop .28s cubic-bezier(.16,1,.3,1) both;
          box-shadow:0 44px 80px -30px color-mix(in srgb, var(--bl-ink) 40%, transparent); }
        .bl-single-root .bl-scm__eyebrow { font-family:var(--bl-fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase;
          color:var(--bl-faint); }
        .bl-single-root .bl-scm__title { margin:12px 0 8px; font-family:var(--bl-fd); font-weight:800; font-size:clamp(24px,6vw,32px);
          letter-spacing:-.02em; color:var(--bl-ink); }
        .bl-single-root .bl-scm__sub { margin:0 0 22px; font-family:var(--bl-fd); font-weight:500; font-size:14px; line-height:1.6;
          color:var(--bl-ink2); }
        .bl-single-root .bl-scm__sub b { color:var(--bl-ink); font-weight:700; }
        .bl-single-root .bl-scm__pick { display:flex; flex-direction:column; gap:6px; padding:16px 18px; margin-bottom:24px;
          border:1.5px solid var(--bl-line); border-radius:16px; text-align:left; }
        .bl-single-root .bl-scm__pick--approve { border-color:#16A34A; background:color-mix(in srgb, #16A34A 7%, var(--bl-card)); }
        .bl-single-root .bl-scm__pick--disapprove { border-color:#DC2626; background:color-mix(in srgb, #DC2626 7%, var(--bl-card)); }
        .bl-single-root .bl-scm__pick--abstain { border-color:#EA580C; background:color-mix(in srgb, #EA580C 7%, var(--bl-card)); }
        .bl-single-root .bl-scm__pick-lab { font-family:var(--bl-fm); font-size:10px; letter-spacing:.16em; text-transform:uppercase;
          color:var(--bl-ink2); }
        .bl-single-root .bl-scm__pick-val { font-family:var(--bl-fd); font-weight:800; font-size:18px; color:var(--bl-ink); }
        .bl-single-root .bl-scm__actions { display:flex; gap:12px; }
        .bl-single-root .bl-scm__cancel { flex:1; min-height:50px; padding:13px 18px; border-radius:999px; cursor:pointer;
          font-family:var(--bl-fd); font-weight:700; font-size:15px; color:var(--bl-ink);
          background:var(--bl-card); border:1.5px solid var(--bl-ink); transition:background .2s ease; }
        .bl-single-root .bl-scm__cancel:hover { background:color-mix(in srgb, var(--bl-ink) 6%, var(--bl-card)); }
        .bl-single-root .bl-scm__go { flex:2; display:inline-flex; align-items:center; justify-content:center; gap:9px;
          min-height:50px; padding:13px 22px; border-radius:999px; border:none; cursor:pointer;
          font-family:var(--bl-fd); font-weight:700; font-size:15px;
          color:var(--bl-on-primary, var(--bl-card)); background:var(--bl-primary-deep);
          transition:transform .2s ease, filter .25s ease; }
        .bl-single-root .bl-scm__go:hover { filter:brightness(1.06); transform:translateY(-1px); }
        .bl-single-root .bl-scm__go svg { transition:transform .25s ease; }
        .bl-single-root .bl-scm__go:hover svg { transform:translateX(3px); }
        .bl-single-root .bl-scm__go:disabled, .bl-single-root .bl-scm__cancel:disabled { opacity:.6; cursor:not-allowed; }

        @keyframes blSRise { from { opacity:0; transform:translateY(16px); } }
        @keyframes blSFade { from { opacity:0; } }
        @keyframes blSPop { from { opacity:0; transform:translateY(18px) scale(.96); } }

        /* ===== v2-R12 booth enrichment =====
           slogan pull-quote settles a beat AFTER the name reveal (transform-only, so
           it never re-flickers the opacity the header container already brought up). */
        .bl-single-root .bl-sp-slogan { animation:blSSloganUp .6s cubic-bezier(.16,1,.3,1) both .34s; }
        @keyframes blSSloganUp { from { transform:translateY(10px); } }
        /* group cover — a slow editorial pan (ambient; object-fit:cover, never crops
           past the frame). Frozen by the scoped reduced-motion guard below. */
        .bl-single-root .bl-sp-cover img { animation:blCoverPan 26s ease-in-out infinite alternate; }
        @keyframes blCoverPan { from { transform:scale(1.03) translate(0,0); } to { transform:scale(1.07) translate(-1.6%,-1.1%); } }
        /* the confirm diamond gives a soft heartbeat once a choice is locked in */
        .bl-single-root .bl-vconfirm.is-ready .bl-vconfirm__dia { animation:blDiaPulse 1.9s ease-in-out infinite; }
        @keyframes blDiaPulse { 0%,100% { transform:rotate(45deg) scale(1); } 50% { transform:rotate(45deg) scale(1.22); } }

        /* ================= TABLET+ : inline nav + roomier layout ================= */
        @media (min-width:768px) {
          .bl-single-root .bl-topbar__in { gap:22px; }
          .bl-single-root .bl-nav { display:flex; }
          .bl-single-root .bl-userwrap { margin-left:0; }
          .bl-single-root .bl-burger, .bl-single-root .bl-sheet { display:none; }
          .bl-single-root .bl-footer p { font-size:12px; }
          .bl-single-root .bl-sp-team { grid-template-columns:repeat(4,1fr); }
          .bl-single-root .bl-sopt__hit { gap:22px; padding:26px 26px; }
        }

        /* ================= MOBILE (<=560): tighten, tap targets >=44px ================= */
        @media (max-width:560px) {
          .bl-single-root .bl-page { padding-bottom:196px; }
          .bl-single-root .bl-sp-hero { gap:18px; }
          .bl-single-root .bl-sp-logo { width:84px; height:84px; border-radius:20px; }
          .bl-single-root .bl-sp-team { grid-template-columns:repeat(2,1fr); }
          .bl-single-root .bl-vpaper { border-radius:20px; }
          .bl-single-root .bl-vpaper__cap { padding:13px 16px; }
          .bl-single-root .bl-sopt__hit { padding:18px 16px; gap:14px; }
          .bl-single-root .bl-vconfirm__in { flex-direction:column; align-items:stretch; gap:12px; padding:12px 18px; }
          .bl-single-root .bl-vconfirm__btn { width:100%; }
          .bl-single-root .bl-scm__actions { flex-direction:column-reverse; }
          .bl-single-root .bl-scm__cancel, .bl-single-root .bl-scm__go { width:100%; flex:none; }
        }

        /* reduced motion — scope to .bl-single-root, keep transitions */
        @media (prefers-reduced-motion:reduce) {
          .bl-single-root *, .bl-single-root *::before, .bl-single-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
