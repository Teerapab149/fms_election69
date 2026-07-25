"use client";

// BlossomParty — PARTY DETAIL page for the "Blossom Civic" template family
// (Candy Editorial · v2-R4c / T3.6). This closes the last classic-fallthrough hole
// for the blossom family: /party used to fall to the classic cinematic layout.
//
// The concept is a SPECIAL MAGAZINE FEATURE, NOT a paper file (the receipt family's
// language) — the party gets its own editorial spread: a mono issue-line masthead, a
// GIANT hollow-stroke party numeral (same grammar as BlossomCandidates' bl-cand-word)
// sitting beside the logo medallion + party name (solid display) + slogan deck, ruled
// by a hairline. Below, printed "articles" separated by hairlines, each with a Thai-
// leading bilingual head:
//   1. ความหมายสัญลักษณ์ (logoMeaning) — a big editorial PULL-QUOTE
//   2. พันธกิจ (missions) — mono 01 / 02 numerals + list
//   3. นโยบายเด่น (policies — string OR { title, desc }) — a numbered editorial grid
//   4. ทีมผู้สมัคร (members, ordered by committee hierarchy via the shared memberSort
//      util) — editorial portrait cards; a card opens the blossom family's own
//      BlossomMemberModal.
//   5. ภาพกิจกรรม — a horizontal photo-strip (hidden silently when empty); a tap opens
//      this component's OWN lightbox (no shared lightbox).
// showBackToVote → a candy pill "กลับไปลงคะแนน" in the family's voice (NOT the shared
// BackToVoteBar, whose language clashes).
//
// Chrome (topbar + footer + candy blobs + dot-grid) is the SAME editorial skin as the
// rest of the family: BlossomTopBar is a shared named export from BlossomHome; the
// footer mirrors bl-footer. The chrome CSS is carried here (only one Blossom page
// renders at a time) so the bar + footer look byte-identical to home. Colours flow
// ONLY through var(--bl-*), emitted by BlossomBaseStyles on .bl-root — a theme swap
// re-tints the whole page in place. PartyTheme.js is NEVER touched or read (a party's
// identity here is its LOGO / PHOTOS / CONTENT, not a colour). Calm rules match the
// rest of the family (dots 8%/28px, faded blobs). Pure presentation + editor-safe: in
// editorMode every link is stripped and no interaction fires (P-LOG-002). Base state
// is fully visible — nothing is gated on JS/animation, so JS-off / reduced-motion
// render the full spread instantly (entrance keyframes only supply the from-frame).

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getPath } from "../../utils/basePath";
import { BlossomTopBar } from "../home/BlossomHome";
import { BlossomBaseStyles } from "../home/BlossomTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { sortMembersByPosition } from "../../utils/memberSort";
import BlossomMemberModal from "./BlossomMemberModal";
import StoryClamp from "./StoryClamp";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));
// a mission / policy item may be a plain string or a shaped object — normalise to text
const asText = (it) => typeof it === "string" ? it : (it?.text ?? it?.title ?? it?.detail ?? it?.description ?? it?.name ?? "");
// keep the placeholder defaults preparePartyData injects out of the printed articles
const REAL = (arr) => (arr || []).map(asText).filter((t) => t && !t.startsWith("ยังไม่มีข้อมูล"));

export default function BlossomParty({ party = {}, galleryImages = [], showBackToVote = false, editorMode = false }) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";
  const copyrightYear = gc.copyrightYear ?? "";

  const [selectedMember, setSelectedMember] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  // portal-mount guard — the member modal is position:fixed; parenting it to
  // document.body immunises it against any transformed / overflow-clipped ancestor a
  // host surface (playground, preview, future chrome) might introduce. SSR-safe: portal
  // only after mount so `document` is defined.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const no = party?.number;
  const logo = resolveSrc(party?.logoUrl);
  const story = asText(party?.logoMeaning).trim();
  const showStory = story && !story.startsWith("ยังไม่มีข้อมูล");
  const missions = REAL(party?.missions);
  const policies = (party?.policies || []).filter((p) => {
    const t = asText(p);
    return t && !t.startsWith("ยังไม่มีข้อมูล");
  });
  const members = sortMembersByPosition(party?.members || []);
  const gallery = (galleryImages || []).map((g) => resolveSrc(g?.imageUrl || g)).filter(Boolean);

  const openMember = (m) => { if (!editorMode) setSelectedMember(m); };
  const openLightbox = (src) => { if (!editorMode) setLightboxSrc(src); };

  return (
    <div className={`fms-app bl-root bl-party-root${showBackToVote ? " has-backvote" : ""}`}>
      <BlossomBaseStyles />

      {/* organic candy blobs (faded toward canvas — calm) */}
      <span className="bl-blob bl-blob-1" aria-hidden="true" />
      <span className="bl-blob bl-blob-2" aria-hidden="true" />

      <BlossomTopBar editorMode={editorMode} active="/candidates" />

      <div className="bl-page">
        {/* ===== issue line (masthead — party variant) ===== */}
        <div className="bl-issue-line">
          <span><span className="bl-thai bl-thai--nw">พรรค</span> <b>·</b> PARTY FILE</span>
          <span>{prefix} {number}</span>
        </div>

        {/* ===== editorial party masthead — giant hollow numeral + logo + name ===== */}
        <header className="bl-pty-head">
          <span className="bl-pty-kick"><span className="bl-pty-dot" aria-hidden="true" /><span className="bl-thai bl-thai--nw">บทความฉบับพิเศษ</span> · <span className="bl-nw">PARTY FEATURE</span></span>
          <div className="bl-pty-hero">
            <span className="bl-pty-no" aria-hidden="true">{pad2(no)}</span>
            <div className="bl-pty-id">
              <span className="bl-pty-logo">
                {logo ? (
                  <img src={logo} alt={party?.name || "โลโก้พรรค"} loading="lazy" />
                ) : (
                  <span className="bl-pty-logo-ph" aria-hidden="true">{pad2(no)}</span>
                )}
              </span>
              <div className="bl-pty-title">
                <span className="bl-pty-num"><span className="bl-thai bl-thai--nw">พรรคหมายเลข</span> <b>{no}</b></span>
                <h1 className="bl-pty-word">{party?.name || "พรรค"}</h1>
                {party?.slogan && <p className="bl-pty-deck">“{party.slogan}”</p>}
              </div>
            </div>
          </div>
        </header>

        {/* ===== 1. ความหมายสัญลักษณ์ (logoMeaning) — editorial pull-quote; a small
             logo beside the head ties the quote to the mark it explains ===== */}
        {showStory && (
          <section className="bl-psec" aria-label="ความหมายสัญลักษณ์">
            <div className="bl-psec__head">
              {logo && <span className="bl-psec__logo"><img src={logo} alt={party?.name || "โลโก้พรรค"} loading="lazy" /></span>}
              <span className="bl-psec__kick">LOGO MEANING</span>
              <h2 className="bl-psec__title">ความหมายสัญลักษณ์</h2>
            </div>
            <blockquote className="bl-pquote">
              <span className="bl-pquote__mark" aria-hidden="true">“</span>
              <StoryClamp className="bl-sc">
                <p className="bl-pquote__body">{story}</p>
              </StoryClamp>
            </blockquote>
          </section>
        )}

        {/* ===== 2. พันธกิจ — mono numerals + list ===== */}
        {missions.length > 0 && (
          <section className="bl-psec" aria-label="พันธกิจพรรค">
            <div className="bl-psec__head">
              <span className="bl-psec__kick">MISSION</span>
              <h2 className="bl-psec__title">พันธกิจ</h2>
              <span className="bl-psec__count">{pad2(missions.length)} <span className="bl-thai bl-thai--nw">ข้อ</span></span>
            </div>
            <ol className="bl-mlist">
              {missions.map((m, i) => (
                <li key={i}><span className="bl-mlist__n">{pad2(i + 1)}</span><span className="bl-mlist__t">{m}</span></li>
              ))}
            </ol>
          </section>
        )}

        {/* ===== 3. นโยบายเด่น — numbered editorial grid ===== */}
        {policies.length > 0 && (
          <section className="bl-psec" aria-label="นโยบายพรรค">
            <div className="bl-psec__head">
              <span className="bl-psec__kick">POLICIES</span>
              <h2 className="bl-psec__title">นโยบายเด่น</h2>
              <span className="bl-psec__count">{pad2(policies.length)} <span className="bl-thai bl-thai--nw">ข้อ</span></span>
            </div>
            <ol className="bl-plist">
              {policies.map((p, i) => {
                const title = typeof p === "object" ? (p.title || p.text || p.name || "") : p;
                const desc = typeof p === "object" ? (p.desc || p.description || p.detail || "") : "";
                return (
                  <li className="bl-pcard" key={i}>
                    <span className="bl-pcard__n" aria-hidden="true">{pad2(i + 1)}</span>
                    <span className="bl-pcard__body">
                      <span className="bl-pcard__title">{title}</span>
                      {desc && <span className="bl-pcard__desc">{desc}</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* ===== 4. ทีมผู้สมัคร — editorial portrait cards → BlossomMemberModal ===== */}
        {members.length > 0 && (
          <section className="bl-psec" aria-label="ทีมผู้สมัคร">
            <div className="bl-psec__head">
              <span className="bl-psec__kick">THE TEAM</span>
              <h2 className="bl-psec__title">ทีมผู้สมัคร</h2>
              <span className="bl-psec__count">{pad2(members.length)} <span className="bl-thai bl-thai--nw">คน</span></span>
            </div>
            <ul className="bl-team">
              {members.map((m, i) => {
                const img = resolveSrc(m?.imageUrl || m?.modalImageUrl);
                return (
                  <li className="bl-cand" key={m.id || i}>
                    <button type="button" className="bl-cand__btn" onClick={() => openMember(m)} aria-label={m.name}>
                      <span className="bl-cand__photo">
                        {img ? <img src={img} alt={m.name} loading="lazy" /> : <span className="bl-cand__ph" aria-hidden="true">{(m.name || "?").trim().charAt(0)}</span>}
                        <span className="bl-cand__no" aria-hidden="true">{pad2(m.number ?? i + 1)}</span>
                      </span>
                      <span className="bl-cand__body">
                        <span className="bl-cand__name">{m.name}</span>
                        {(m.position || m.major) && <span className="bl-cand__role bl-thai">{m.position || m.major}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ===== 5. ภาพกิจกรรม — horizontal photo-strip (hidden when empty) ===== */}
        {gallery.length > 0 && (
          <section className="bl-psec" aria-label="ภาพกิจกรรมพรรค">
            <div className="bl-psec__head">
              <span className="bl-psec__kick">GALLERY</span>
              <h2 className="bl-psec__title">ภาพกิจกรรม</h2>
              <span className="bl-psec__count">{pad2(gallery.length)} <span className="bl-thai bl-thai--nw">ภาพ</span></span>
            </div>
            <div className="bl-strip">
              {gallery.map((src, i) => (
                <button type="button" className="bl-strip__cell" key={i} onClick={() => openLightbox(src)} aria-label={`เปิดภาพที่ ${i + 1}`}>
                  <img src={src} alt={`ภาพกิจกรรม ${i + 1}`} loading="lazy" />
                  <span className="bl-strip__no" aria-hidden="true">{pad2(i + 1)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ===== foot band — editorial CTAs ===== */}
        <div className="bl-pty-foot">
          <a href={editorMode ? undefined : getPath("/candidates")} className="bl-pty-back">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            กลับหน้าผู้สมัคร
          </a>
          <a href={editorMode ? undefined : getPath("/vote")} className="bl-pty-go">
            ไปลงคะแนน
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
        </div>

        {/* ===== footer — plain classic line (mirrors bl-footer on home) ===== */}
        <footer className="bl-footer">
          <p>© {gc.facultyShortEn || "FMS"}@{gc.university || "PSU"}{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
        </footer>
      </div>

      {/* sticky candy pill "กลับไปลงคะแนน" — the family's own, only when arriving from vote */}
      {showBackToVote && (
        <a href={editorMode ? undefined : getPath("/vote")} className="bl-backvote">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          กลับไปลงคะแนน
        </a>
      )}

      {/* member modal — the blossom family's own candy-editorial card (its own lightbox);
          portalled to <body> so its fixed positioning can never be clipped by an ancestor. */}
      {mounted && selectedMember && createPortal(
        <BlossomMemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />,
        document.body
      )}

      {/* gallery lightbox — this component's OWN (no shared lightbox) */}
      {lightboxSrc && (
        <div className="bl-lightbox" onClick={() => setLightboxSrc(null)} role="dialog" aria-modal="true" aria-label="ภาพขยาย">
          <button type="button" className="bl-lightbox__close" onClick={() => setLightboxSrc(null)} aria-label="ปิด">✕</button>
          <img src={lightboxSrc} alt="ภาพกิจกรรมพรรค" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <style jsx global>{`
        /* ================= SHARED CHROME (mirrors BlossomHome / BlossomCandidates) ================= */
        .bl-party-root { overflow-x:hidden; }
        /* dot-grid paper texture — calm 8%/28px */
        .bl-party-root::after { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:radial-gradient(color-mix(in srgb, var(--bl-ink) 8%, transparent) 1px, transparent 1.4px);
          background-size:28px 28px; }
        :where(.bl-party-root) a { color:var(--bl-primary-ink); text-decoration:none; }
        :where(.bl-party-root) a:hover { color:var(--bl-ink); }

        /* blobs — faded toward the canvas (calm) */
        .bl-party-root .bl-blob { position:absolute; pointer-events:none; z-index:0; }
        .bl-party-root .bl-blob-1 { top:-16vw; right:-22vw; width:64vw; height:64vw; min-width:380px; min-height:380px;
          background:color-mix(in srgb, var(--bl-primary-soft) 45%, var(--bl-canvas)); border-radius:52% 48% 60% 40%/55% 60% 40% 45%;
          animation:blMorph 14s ease-in-out infinite alternate; }
        .bl-party-root .bl-blob-2 { bottom:4%; left:-18vw; width:46vw; height:46vw; min-width:280px; min-height:280px;
          background:color-mix(in srgb, var(--bl-sup3) 45%, var(--bl-canvas)); border-radius:60% 40% 45% 55%/45% 55% 60% 40%;
          animation:blMorph 18s ease-in-out infinite alternate-reverse; }
        @keyframes blMorph {
          0%   { border-radius:52% 48% 60% 40%/55% 60% 40% 45%; }
          50%  { border-radius:44% 56% 42% 58%/60% 42% 58% 40%; }
          100% { border-radius:58% 42% 55% 45%/42% 58% 45% 55%; }
        }

        .bl-party-root .bl-page { position:relative; z-index:1; max-width:1200px; margin:0 auto; padding:0 22px 90px; }
        .bl-party-root.has-backvote .bl-page { padding-bottom:120px; }

        /* ---- topbar (editorial hairline skin) ---- */
        .bl-party-root .bl-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--bl-canvas) 88%, transparent);
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
          border-bottom:1.5px solid var(--bl-ink); }
        .bl-party-root .bl-topbar__in { max-width:1200px; margin:0 auto; padding:14px 22px;
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .bl-party-root .bl-logo { display:inline-flex; align-items:center; flex-shrink:0; border-radius:8px; }
        .bl-party-root .bl-logo__img { height:30px; width:auto; object-fit:contain; display:block; }
        .bl-party-root .bl-nav { display:none; gap:20px; margin-left:auto; align-items:center; }
        .bl-party-root .bl-nav__link { font-family:var(--bl-fm); font-size:11.5px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--bl-ink2); position:relative; padding-bottom:2px; border-radius:4px; transition:color .2s ease; }
        .bl-party-root .bl-nav__link.on, .bl-party-root .bl-nav__link:hover { color:var(--bl-ink); }
        .bl-party-root .bl-nav__link::after { content:""; position:absolute; left:0; right:0; bottom:-3px; height:3px;
          background:var(--bl-primary); border-radius:2px; transform:scaleX(0); transform-origin:left;
          transition:transform .28s cubic-bezier(.22,1,.36,1); }
        .bl-party-root .bl-nav__link:hover::after { transform:scaleX(1); }
        .bl-party-root .bl-nav__link.on::after { transform:scaleX(1); }

        .bl-party-root .bl-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .bl-party-root .bl-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--bl-fd); font-weight:600;
          font-size:13px; color:var(--bl-canvas); background:var(--bl-ink); border:none; cursor:pointer;
          padding:9px 20px; border-radius:999px; transition:background .2s ease, transform .15s ease; }
        .bl-party-root .bl-loginbtn:hover { background:var(--bl-primary-deep); transform:translateY(-1px); }
        .bl-party-root .bl-loginbtn:active { transform:scale(.96); }
        .bl-party-root .bl-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--bl-line) 70%, var(--bl-card)); }
        .bl-party-root .bl-skelbar { display:block; width:58px; height:12px; border-radius:6px;
          background:color-mix(in srgb, var(--bl-ink2) 30%, var(--bl-card)); animation:blPulse 1.3s ease-in-out infinite; }
        @keyframes blPulse { 0%,100%{opacity:.45} 50%{opacity:1} }

        .bl-party-root .bl-userchip { position:relative; }
        .bl-party-root .bl-userchip__btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:999px; padding:5px 12px 5px 5px; cursor:pointer;
          font-family:inherit; transition:transform .15s ease, background .2s ease; }
        .bl-party-root .bl-userchip__btn:hover { background:color-mix(in srgb, var(--bl-primary) 7%, var(--bl-card)); }
        .bl-party-root .bl-userchip__btn:active { transform:scale(.97); }
        .bl-party-root .bl-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:linear-gradient(135deg, var(--bl-primary), var(--bl-primary-deep)); color:var(--bl-on-primary, var(--bl-card));
          font-family:var(--bl-fd); font-weight:700; font-size:14px; line-height:1; }
        .bl-party-root .bl-userchip__name { font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-party-root .bl-userchip__caret { color:var(--bl-ink2); font-size:11px; }
        .bl-party-root .bl-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:16px; overflow:hidden; z-index:50;
          box-shadow:0 18px 40px -18px color-mix(in srgb, var(--bl-ink) 12%, transparent); }
        .bl-party-root .bl-usermenu__head { padding:14px 16px; border-bottom:1px solid var(--bl-line); }
        .bl-party-root .bl-usermenu__name { font-family:var(--bl-fd); font-weight:700; font-size:14px; color:var(--bl-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-party-root .bl-usermenu__id { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.04em; color:var(--bl-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-party-root .bl-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-primary-ink); }
        .bl-party-root .bl-usermenu__out:hover { background:color-mix(in srgb, var(--bl-primary) 10%, var(--bl-card)); }

        .bl-party-root .bl-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:12px; background:var(--bl-card); border:1.5px solid var(--bl-ink); cursor:pointer;
          transition:transform .15s ease, background .2s ease; }
        .bl-party-root .bl-burger:hover { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }
        .bl-party-root .bl-burger:active { transform:scale(.95); }
        .bl-party-root .bl-burger span { display:block; height:2.5px; border-radius:2px; background:var(--bl-ink); }

        .bl-party-root .bl-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .bl-party-root .bl-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .bl-party-root .bl-sheet__link { display:flex; align-items:center; min-height:44px; padding:11px 16px; border-radius:12px;
          font-family:var(--bl-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--bl-ink);
          background:var(--bl-card); border:1px solid var(--bl-line); transition:border-color .2s ease, background .2s ease; }
        .bl-party-root .bl-sheet__link:hover { border-color:var(--bl-primary); }
        .bl-party-root .bl-sheet__link:active { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }

        /* focus-visible (keyboard) — 2px primary-deep outline on every interactive element */
        .bl-party-root a:focus-visible, .bl-party-root button:focus-visible {
          outline:2px solid var(--bl-primary-deep); outline-offset:2px; }

        /* ---- issue line (masthead) ---- */
        .bl-party-root .bl-issue-line { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:12px 0;
          border-bottom:1px solid var(--bl-line); font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--bl-ink2); }
        .bl-party-root .bl-issue-line b { color:var(--bl-primary-ink); font-weight:700; }

        /* ---- footer: plain classic single line, centered ---- */
        .bl-party-root .bl-footer { margin-top:0; padding:24px 0; border-top:1px solid var(--bl-line); text-align:center;
          position:relative; z-index:1; }
        .bl-party-root .bl-footer p { margin:0; font-size:10px; letter-spacing:.12em; text-transform:uppercase;
          font-weight:500; color:var(--bl-ink2); }

        /* ================= PARTY FEATURE (unique layout) ================= */
        /* ---- masthead: giant hollow numeral + logo medallion + name ---- */
        .bl-party-root .bl-pty-head { margin-top:44px; padding-bottom:28px; border-bottom:1.5px solid var(--bl-ink);
          animation:blPRise .6s ease both .05s; }
        .bl-party-root .bl-pty-kick { display:inline-flex; align-items:center; gap:9px; font-family:var(--bl-fm); font-size:10.5px;
          letter-spacing:.2em; text-transform:uppercase; color:var(--bl-ink2); }
        .bl-party-root .bl-pty-dot { width:7px; height:7px; border-radius:50%; background:var(--bl-primary); animation:blPBlip 1.6s infinite; }
        @keyframes blPBlip { 50%{opacity:.3} }
        .bl-party-root .bl-pty-hero { display:flex; align-items:flex-end; gap:20px; margin-top:20px; flex-wrap:wrap; }
        /* giant hollow party numeral — same grammar as BlossomCandidates .bl-cand-word */
        .bl-party-root .bl-pty-no { font-family:var(--bl-fd); font-weight:800; line-height:.82; flex:none;
          font-size:clamp(88px,22vw,208px); letter-spacing:-.03em; font-variant-numeric:tabular-nums; color:transparent;
          -webkit-text-stroke:2.5px var(--bl-primary-deep); text-stroke:2.5px var(--bl-primary-deep); }
        @supports not (-webkit-text-stroke: 1px #000) {
          .bl-party-root .bl-pty-no { color:var(--bl-primary-ink); -webkit-text-stroke:0; text-stroke:0; }
        }
        .bl-party-root .bl-pty-id { display:flex; align-items:flex-end; gap:20px; min-width:0; flex:1; }
        .bl-party-root .bl-pty-logo { width:96px; height:96px; flex:none; border-radius:24px; overflow:hidden;
          background:var(--bl-card); border:1.5px solid var(--bl-ink); display:flex; align-items:center; justify-content:center; padding:8px;
          box-shadow:0 20px 44px -30px color-mix(in srgb, var(--bl-ink) 30%, transparent); }
        /* contain — a logo is a mark with its own margins; cover cropped it */
        .bl-party-root .bl-pty-logo img { width:auto; height:auto; max-width:100%; max-height:100%; object-fit:contain; }
        .bl-party-root .bl-pty-logo-ph { font-family:var(--bl-fd); font-weight:800; font-size:34px;
          font-variant-numeric:tabular-nums; color:var(--bl-primary-ink); }
        .bl-party-root .bl-pty-title { min-width:0; }
        .bl-party-root .bl-pty-num { font-family:var(--bl-fm); font-size:11px; letter-spacing:.16em; text-transform:uppercase;
          color:var(--bl-ink2); }
        .bl-party-root .bl-pty-num b { color:var(--bl-primary-ink); font-weight:700; }
        /* party name — SOLID display, calm ink (the star of the feature) */
        .bl-party-root .bl-pty-word { margin:6px 0 0; font-family:var(--bl-fd); font-weight:800; line-height:1;
          font-size:clamp(30px,7vw,60px); letter-spacing:-.02em; color:var(--bl-ink); overflow-wrap:break-word; }
        .bl-party-root .bl-pty-deck { margin:12px 0 0; max-width:56ch; font-family:var(--bl-fd); font-weight:500; font-style:italic;
          font-size:clamp(15px,3.6vw,18px); line-height:1.6; color:var(--bl-ink2); }

        /* ---- generic section head (Thai title leads · mono EN eyebrow) ---- */
        .bl-party-root .bl-psec { margin-top:52px; }
        .bl-party-root .bl-psec__head { display:flex; align-items:flex-end; gap:14px; padding-bottom:16px;
          border-bottom:1.5px solid var(--bl-ink); }
        .bl-party-root .bl-psec__kick { font-family:var(--bl-fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase;
          color:var(--bl-faint); align-self:center; padding-bottom:2px; }
        /* small logo chip on the LOGO MEANING head — ties the pull-quote to the mark */
        .bl-party-root .bl-psec__logo { width:38px; height:38px; flex:none; border-radius:11px; overflow:hidden; align-self:center;
          background:var(--bl-card); border:1.5px solid var(--bl-ink); display:flex; align-items:center; justify-content:center; padding:3px; }
        .bl-party-root .bl-psec__logo img { width:auto; height:auto; max-width:100%; max-height:100%; object-fit:contain; }
        .bl-party-root .bl-psec__title { margin:0; font-family:var(--bl-fd); font-weight:800; font-size:clamp(24px,6vw,40px);
          line-height:.95; letter-spacing:-.02em; color:var(--bl-ink); }
        .bl-party-root .bl-psec__count { margin-left:auto; font-family:var(--bl-fm); font-size:11px; letter-spacing:.16em;
          text-transform:uppercase; color:var(--bl-ink2); white-space:nowrap; padding-bottom:3px; }

        /* ---- 1. ความหมายสัญลักษณ์ — editorial pull-quote ---- */
        .bl-party-root .bl-pquote { position:relative; margin:26px 0 0; padding:0 0 0 30px;
          border-left:3px solid var(--bl-primary); }
        .bl-party-root .bl-pquote__mark { position:absolute; left:14px; top:-18px; font-family:var(--bl-fd); font-weight:800;
          font-size:76px; line-height:1; color:var(--bl-primary-soft); pointer-events:none; user-select:none; }
        .bl-party-root .bl-pquote__body { position:relative; margin:0; font-family:var(--bl-fd); font-weight:500;
          font-size:clamp(18px,4.4vw,26px); line-height:1.6; letter-spacing:-.01em; color:var(--bl-ink); white-space:pre-line; }
        /* StoryClamp — a long logo-meaning collapses behind a canvas fade so the
           sections below stay reachable; the toggle wears the candy accent */
        .bl-party-root .bl-sc { --sc-max:9.6em; --sc-fade:var(--bl-canvas); }
        .bl-party-root .bl-sc .sc__hint { color:var(--bl-primary-ink); font-family:var(--bl-fm); text-transform:uppercase; }

        /* ---- 2. พันธกิจ — mono numerals + list ---- */
        .bl-party-root .bl-mlist { list-style:none; margin:20px 0 0; padding:0; }
        .bl-party-root .bl-mlist li { display:grid; grid-template-columns:auto 1fr; gap:20px; align-items:baseline;
          padding:18px 6px; border-bottom:1px solid var(--bl-line); }
        .bl-party-root .bl-mlist li:last-child { border-bottom:none; }
        .bl-party-root .bl-mlist__n { font-family:var(--bl-fm); font-weight:700; font-size:clamp(15px,3.4vw,18px); line-height:1.4;
          font-variant-numeric:tabular-nums; letter-spacing:.02em; color:var(--bl-primary-ink); }
        .bl-party-root .bl-mlist__t { font-family:var(--bl-fd); font-weight:500; font-size:clamp(15px,3.6vw,17px); line-height:1.7;
          color:var(--bl-ink); }

        /* ---- 3. นโยบายเด่น — numbered editorial grid ---- */
        .bl-party-root .bl-plist { list-style:none; margin:22px 0 0; padding:0; display:grid; grid-template-columns:1fr; gap:14px; }
        .bl-party-root .bl-pcard { display:flex; flex-direction:column; gap:12px; padding:22px 22px 24px; background:var(--bl-card);
          border:1.5px solid var(--bl-line); border-radius:18px;
          transition:transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
        .bl-party-root .bl-pcard:hover { transform:translateY(-4px); border-color:var(--bl-primary);
          box-shadow:0 24px 44px -28px color-mix(in srgb, var(--bl-ink) 26%, transparent); }
        .bl-party-root .bl-pcard__n { font-family:var(--bl-fd); font-weight:800; font-size:clamp(28px,6vw,40px); line-height:.9;
          font-variant-numeric:tabular-nums; letter-spacing:-.03em; color:var(--bl-primary-soft);
          -webkit-text-stroke:1.5px var(--bl-primary-deep); }
        @supports not (-webkit-text-stroke: 1px #000) {
          .bl-party-root .bl-pcard__n { color:var(--bl-primary-ink); -webkit-text-stroke:0; }
        }
        .bl-party-root .bl-pcard__body { display:flex; flex-direction:column; gap:6px; min-width:0; }
        .bl-party-root .bl-pcard__title { font-family:var(--bl-fd); font-weight:700; font-size:clamp(16px,4vw,19px); line-height:1.45;
          color:var(--bl-ink); }
        .bl-party-root .bl-pcard__desc { font-family:var(--bl-fd); font-weight:500; font-size:14px; line-height:1.65; color:var(--bl-ink2); }

        /* ---- 4. ทีมผู้สมัคร — editorial portrait cards ---- */
        .bl-party-root .bl-team { list-style:none; margin:22px 0 0; padding:0; display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
        .bl-party-root .bl-cand { margin:0; }
        .bl-party-root .bl-cand__btn { display:block; width:100%; text-align:left; padding:0; cursor:pointer; color:var(--bl-ink);
          background:var(--bl-card); border:1.5px solid var(--bl-line); border-radius:18px; overflow:hidden;
          transition:transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
        .bl-party-root .bl-cand__btn:hover { transform:translateY(-4px); border-color:var(--bl-primary);
          box-shadow:0 24px 44px -28px color-mix(in srgb, var(--bl-ink) 30%, transparent); }
        .bl-party-root .bl-cand__photo { position:relative; display:block; width:100%; aspect-ratio:4/5; overflow:hidden;
          background:color-mix(in srgb, var(--bl-primary-soft) 60%, var(--bl-card)); }
        .bl-party-root .bl-cand__photo img { width:100%; height:100%; object-fit:cover; display:block;
          transition:transform .4s ease; }
        .bl-party-root .bl-cand__btn:hover .bl-cand__photo img { transform:scale(1.04); }
        .bl-party-root .bl-cand__ph { position:absolute; inset:0; display:grid; place-items:center;
          font-family:var(--bl-fd); font-weight:800; font-size:44px; color:var(--bl-primary-ink); }
        .bl-party-root .bl-cand__no { position:absolute; left:10px; top:10px; padding:3px 9px; border-radius:999px;
          font-family:var(--bl-fm); font-size:9.5px; letter-spacing:.08em; font-variant-numeric:tabular-nums;
          color:var(--bl-ink); background:color-mix(in srgb, var(--bl-card) 82%, transparent);
          -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px); }
        .bl-party-root .bl-cand__body { display:flex; flex-direction:column; gap:3px; padding:13px 15px 15px; }
        /* ink gutter — lh 1.2 is still under Kanit's font box, so a member name with a
           tone mark over an upper vowel (คนที่, ชี้) lost 1.5px off the top. padding-top
           opens the clamp's clip box; the negative margin keeps the card height identical. */
        .bl-party-root .bl-cand__name { font-family:var(--bl-fd); font-weight:800; font-size:15px; line-height:1.2; color:var(--bl-ink);
          padding-top:.2em; margin-top:-.2em;
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .bl-party-root .bl-cand__btn:hover .bl-cand__name { color:var(--bl-primary-ink); }
        .bl-party-root .bl-cand__role { font-family:var(--bl-fm); font-size:9.5px; letter-spacing:.1em; text-transform:uppercase;
          color:var(--bl-ink2); overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }

        /* ---- 5. ภาพกิจกรรม — horizontal photo-strip ---- */
        .bl-party-root .bl-strip { margin-top:22px; display:flex; gap:14px; overflow-x:auto; padding:6px 2px 12px;
          scroll-snap-type:x proximity; -webkit-overflow-scrolling:touch; }
        .bl-party-root .bl-strip__cell { position:relative; flex:0 0 clamp(200px,60vw,272px); scroll-snap-align:start; cursor:pointer;
          aspect-ratio:4/3; border-radius:16px; overflow:hidden; background:var(--bl-card); border:1.5px solid var(--bl-line); padding:0;
          box-shadow:0 18px 34px -24px color-mix(in srgb, var(--bl-ink) 26%, transparent);
          transition:transform .25s ease, border-color .25s ease; }
        .bl-party-root .bl-strip__cell:hover { transform:translateY(-4px); border-color:var(--bl-primary); }
        .bl-party-root .bl-strip__cell img { width:100%; height:100%; object-fit:cover; display:block; }
        .bl-party-root .bl-strip__no { position:absolute; left:10px; bottom:10px; padding:3px 9px; border-radius:999px;
          font-family:var(--bl-fm); font-size:9.5px; letter-spacing:.1em; font-variant-numeric:tabular-nums; color:var(--bl-canvas);
          background:color-mix(in srgb, var(--bl-ink) 78%, transparent); }

        /* ---- foot band — editorial CTAs ---- */
        .bl-party-root .bl-pty-foot { margin-top:52px; padding-top:24px; border-top:1.5px solid var(--bl-ink);
          display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
        .bl-party-root .bl-pty-back { display:inline-flex; align-items:center; gap:8px; min-height:48px; padding:12px 24px;
          border-radius:999px; border:2px solid var(--bl-ink); background:transparent;
          font-family:var(--bl-fd); font-weight:600; font-size:15px; color:var(--bl-ink);
          transition:color .2s ease, border-color .2s ease, background .2s ease, transform .2s ease; }
        .bl-party-root .bl-pty-back:hover { color:var(--bl-primary-ink); border-color:var(--bl-primary-deep);
          background:var(--bl-card); transform:translateY(-2px); }
        .bl-party-root .bl-pty-back:active { transform:scale(.97); }
        .bl-party-root .bl-pty-back svg { transition:transform .25s ease; }
        .bl-party-root .bl-pty-back:hover svg { transform:translateX(-3px); }
        .bl-party-root .bl-pty-go { display:inline-flex; align-items:center; gap:8px; margin-left:auto; min-height:48px; padding:12px 26px;
          border-radius:999px; border:none; cursor:pointer;
          font-family:var(--bl-fd); font-weight:700; font-size:15px; color:var(--bl-on-primary, var(--bl-card)); background:var(--bl-primary-deep);
          box-shadow:0 12px 26px color-mix(in srgb, var(--bl-primary-deep) 30%, transparent);
          transition:transform .2s ease, filter .25s ease; }
        .bl-party-root .bl-pty-go:hover { transform:translateY(-2px); filter:brightness(1.05); color:var(--bl-on-primary, var(--bl-card)); }
        .bl-party-root .bl-pty-go:active { transform:scale(.97); }
        .bl-party-root .bl-pty-go svg { transition:transform .25s ease; }
        .bl-party-root .bl-pty-go:hover svg { transform:translateX(3px); }

        /* ---- sticky candy pill "กลับไปลงคะแนน" ---- */
        .bl-party-root .bl-backvote { position:fixed; left:50%; bottom:20px; transform:translateX(-50%); z-index:39;
          display:inline-flex; align-items:center; gap:9px; min-height:50px; padding:13px 26px; border-radius:999px; cursor:pointer;
          font-family:var(--bl-fd); font-weight:700; font-size:15px; color:var(--bl-on-primary, var(--bl-card)); background:var(--bl-primary-deep);
          box-shadow:0 18px 40px -14px color-mix(in srgb, var(--bl-primary-deep) 50%, transparent);
          transition:transform .2s ease, filter .25s ease; }
        .bl-party-root .bl-backvote:hover { transform:translateX(-50%) translateY(-2px); filter:brightness(1.05); color:var(--bl-on-primary, var(--bl-card)); }
        .bl-party-root .bl-backvote:active { transform:translateX(-50%) scale(.97); }
        .bl-party-root .bl-backvote svg { transition:transform .25s ease; }
        .bl-party-root .bl-backvote:hover svg { transform:translateX(-3px); }

        /* ---- gallery lightbox (own — solid ink scrim) ---- */
        .bl-party-root .bl-lightbox { position:fixed; inset:0; z-index:70; display:grid; place-items:center; padding:24px;
          background:color-mix(in srgb, var(--bl-ink) 76%, transparent); -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px);
          animation:blLbFade .2s ease both; }
        .bl-party-root .bl-lightbox img { max-width:100%; max-height:85vh; object-fit:contain; border-radius:12px;
          box-shadow:0 40px 90px -30px rgba(0,0,0,.6); }
        .bl-party-root .bl-lightbox__close { position:absolute; top:18px; right:18px; width:44px; height:44px; border-radius:50%;
          display:grid; place-items:center; cursor:pointer; border:1.5px solid color-mix(in srgb, var(--bl-canvas) 40%, transparent);
          background:color-mix(in srgb, var(--bl-ink) 40%, transparent); color:var(--bl-canvas); font-size:16px; }
        @keyframes blLbFade { from { opacity:0; } }

        @keyframes blPRise { from { opacity:0; transform:translateY(16px); } }

        /* ================= TABLET+ : inline nav + roomier grids ================= */
        @media (min-width:768px) {
          .bl-party-root .bl-topbar__in { gap:22px; }
          .bl-party-root .bl-nav { display:flex; }
          .bl-party-root .bl-userwrap { margin-left:0; }
          .bl-party-root .bl-burger, .bl-party-root .bl-sheet { display:none; }
          .bl-party-root .bl-footer p { font-size:12px; }
          .bl-party-root .bl-plist { grid-template-columns:repeat(2,1fr); }
          .bl-party-root .bl-team { grid-template-columns:repeat(4,1fr); }
        }

        /* ================= MOBILE (<=560): tighten ================= */
        @media (max-width:560px) {
          .bl-party-root .bl-pty-hero { gap:14px; }
          .bl-party-root .bl-pty-id { gap:14px; }
          .bl-party-root .bl-pty-logo { width:72px; height:72px; border-radius:18px; }
          .bl-party-root .bl-team { grid-template-columns:repeat(2,1fr); }
          .bl-party-root .bl-pty-go { margin-left:0; width:100%; justify-content:center; }
          .bl-party-root .bl-pty-back { flex:1; justify-content:center; }
        }

        /* reduced motion — scope to .bl-party-root, keep transitions */
        @media (prefers-reduced-motion:reduce) {
          .bl-party-root *, .bl-party-root *::before, .bl-party-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
