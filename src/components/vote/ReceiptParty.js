"use client";

// ReceiptParty — PARTY DETAIL page for the "Receipt · Paper Materiality" template
// family (Template #6), in the print/desk language of ReceiptHome / ReceiptCandidates
// / ReceiptSingleParty. This closes the last classic-fallthrough hole for the receipt
// family (v2-R4b / spec B8). The concept is a DOSSIER: an open party FILE laid OVER a
// printed REGISTER TAPE that peeks out to the LEFT (the tape-spine constitution). The
// tape carries the party's registration index (name · number · team size · slogan);
// the folder cover carries the accent index tab, an ink-ring number stamp, the logo,
// name/slogan and a faint "OFFICIAL PARTY FILE" ghost ring + a rubber band across the
// corner. Inside the file, printed pages in order:
//   1. a LOGO MEANING letter on the party letterhead — logoMeaning explains the mark
//      (enlarged letterhead logo); then a MISSION section — missions (mono 01/02…)
//   2. POLICIES as perforated COUPONS, one per item (same coupon idiom as B3
//      ReceiptSingleParty — hover lifts ≤2 at a time; a policy may be a string OR a
//      { title, desc } object)
//   3. the TEAM as a grid of LANYARD CARDS (punched grommet + clip + photo + name +
//      position + mono number). A card opens the receipt family's own ReceiptMemberModal.
//      Members are ordered by position priority via the shared memberSort util.
//   4. a GALLERY photo-strip (horizontal) — hidden silently when there are no images;
//      a tap opens this component's OWN lightbox (no shared lightbox).
// showBackToVote → a sticky ticket-STUB "กลับไปลงคะแนน" (its own, in the family's
// voice — NOT the shared BackToVoteBar, which would clash).
//
// Colours flow ONLY through var(--rc-*) emitted by ReceiptBaseStyles on .rc-root — a
// theme swap re-tints the whole page in place. PartyTheme.js is NEVER touched or read
// (a party's identity here is its LOGO / PHOTOS / CONTENT, not a colour); the accent
// tab wears the family accent. The desk language (laid paper / vignette / emboss
// seals / holo foil) comes from the shared .rc-desk classes; the topbar mirrors the
// ReceiptHome/ReceiptCandidates ticket-stub chrome. Mono lines are Latin/digits only
// (A10.3). Pure presentation + editor-safe: in editorMode every link is stripped and
// no interaction fires (P-LOG-002). Base state is fully visible — nothing is gated on
// JS/animation, so JS-off / reduced-motion render the full file instantly.

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getPath } from "../../utils/basePath";
import { ReceiptTopBar } from "../home/ReceiptHome";
import { ReceiptBaseStyles } from "../home/ReceiptTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { sortMembersByPosition } from "../../utils/memberSort";
import ReceiptMemberModal from "./ReceiptMemberModal";
import StoryClamp from "./StoryClamp";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));
const firstImage = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) return val[0] || null;
  if (typeof val === "string") { const s = val.trim(); if (s.startsWith("[")) { try { const a = JSON.parse(s); return Array.isArray(a) ? a[0] : null; } catch { return s; } } return s; }
  return null;
};
// a mission / policy item may be a plain string or a shaped object — normalise to text
const asText = (it) => typeof it === "string" ? it : (it?.text ?? it?.title ?? it?.detail ?? it?.description ?? it?.name ?? "");
// keep the placeholder defaults preparePartyData injects out of the printed pages
const REAL = (arr) => (arr || []).map(asText).filter((t) => t && !t.startsWith("ยังไม่มีข้อมูล"));

export default function ReceiptParty({ party = {}, galleryImages = [], showBackToVote = false, editorMode = false }) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";
  const faculty = gc.facultyShortEn || "FMS";
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
  const missions = REAL(party?.missions);
  const policiesRaw = (party?.policies || []).filter((p) => {
    const t = asText(p);
    return t && !t.startsWith("ยังไม่มีข้อมูล");
  });
  const members = sortMembersByPosition(party?.members || []);
  const gallery = (galleryImages || []).map((g) => resolveSrc(g?.imageUrl || g)).filter(Boolean);

  const showStory = story && !story.startsWith("ยังไม่มีข้อมูล");
  const teamCount = members.length;

  const openMember = (m) => { if (!editorMode) setSelectedMember(m); };
  const openLightbox = (src) => { if (!editorMode) setLightboxSrc(src); };

  return (
    <div className="fms-app rc-root rc-party-root rc-desk">
      <ReceiptBaseStyles />

      <ReceiptTopBar editorMode={editorMode} active="/candidates" />

      {/* blind-emboss seals pressed into the desk paper (shared .rc-desk-seals) */}
      <div className="rc-desk-seals" aria-hidden="true">
        <span className="rc-seal rc-seal--a"><i /><b /></span>
        <span className="rc-seal rc-seal--b"><i /><b /></span>
        <span className="rc-seal rc-seal--c"><i /><b /></span>
      </div>

      <div className="rc-party-wrap">
        {/* ===== issue / eyebrow line ===== */}
        <div className="rc-issue">
          <span><span className="rc-th">แฟ้มพรรค</span> · PARTY FILE</span>
          <span>{prefix} {number}</span>
        </div>

        {/* ===== the DOSSIER — register tape (offset left, peeking) + folder cover on top ===== */}
        <div className="rc-dossier">
          {/* register tape under the folder: the party's printed index */}
          <aside className="rc-file-tape" aria-label="ทะเบียนพรรค">
            <span className="rc-file-tape__mast rc-mono">✶ PARTY REGISTER · {faculty} ✶</span>
            <dl className="rc-file-reg">
              <div><dt className="rc-mono"><span className="rc-th">ชื่อพรรค</span> · NAME</dt><dd>{party?.name || "—"}</dd></div>
              <div><dt className="rc-mono"><span className="rc-th">หมายเลข</span> · NO.</dt><dd>{pad2(no)}</dd></div>
              <div><dt className="rc-mono"><span className="rc-th">จำนวนทีม</span> · TEAM</dt><dd>{teamCount > 0 ? <>{pad2(teamCount)} <span className="rc-th">คน</span></> : <span className="rc-th">รอข้อมูล</span>}</dd></div>
              {party?.slogan && <div className="rc-file-reg__slogan"><dt className="rc-mono"><span className="rc-th">คำขวัญ</span> · SLOGAN</dt><dd>“{party.slogan}”</dd></div>}
            </dl>
            <div className="rc-file-tape__foot" aria-hidden="true">✶ ✶ ✶ <span className="rc-th">ปลายทะเบียน</span> ✶ ✶ ✶</div>
          </aside>

          {/* folder cover laid over the tape */}
          <div className="rc-folder">
            <span className="rc-folder__tab rc-mono" aria-hidden="true"><span className="rc-th">แฟ้ม</span> {pad2(no)}</span>
            <span className="rc-folder__band" aria-hidden="true" />
            <span className="rc-folder__ghost" aria-hidden="true"><span>OFFICIAL PARTY FILE</span></span>

            <div className="rc-folder__head">
              <span className="rc-folder__stamp" aria-hidden="true"><b>{no}</b><span className="rc-mono">No.</span></span>
              <span className="rc-folder__logo">
                {logo ? (
                  <img src={logo} alt={party?.name || "โลโก้พรรค"} width="76" height="76" loading="lazy" />
                ) : (
                  <span className="rc-folder__logo-ph" aria-hidden="true">{pad2(no)}</span>
                )}
              </span>
            </div>

            <div className="rc-folder__title">
              <span className="rc-folder__kick rc-mono"><span className="rc-th">แฟ้มประวัติพรรค</span> · OFFICIAL PARTY FILE</span>
              <h1 className="rc-folder__name">{party?.name || "พรรค"}</h1>
              {party?.slogan && <p className="rc-folder__slogan">“{party.slogan}”</p>}
            </div>
          </div>
        </div>

        {/* ===== 1. LOGO MEANING — printed on the party letterhead; the enlarged
             letterhead logo ties the text to the mark it explains ===== */}
        {showStory && (
          <section className="rc-letter" aria-label="ความหมายสัญลักษณ์">
            <div className="rc-letter__head">
              <span className="rc-letter__logo rc-letter__logo--lg">
                {logo ? <img src={logo} alt={party?.name || "โลโก้พรรค"} width="56" height="56" loading="lazy" /> : <span aria-hidden="true">{pad2(no)}</span>}
              </span>
              <span className="rc-letter__id">
                <span className="rc-letter__org">{party?.name || "พรรค"}</span>
                <span className="rc-letter__sub rc-mono">LOGO MEANING · {prefix} {number}</span>
              </span>
            </div>
            <div className="rc-letter__rule" aria-hidden="true" />
            <h2 className="rc-letter__title"><span className="rc-th">ความหมายสัญลักษณ์</span></h2>
            <StoryClamp className="rc-sc"><p className="rc-letter__body">{story}</p></StoryClamp>
          </section>
        )}

        {/* ===== 2. MISSION — พันธกิจ, numbered in the receipt voice ===== */}
        {missions.length > 0 && (
          <section className="rc-sec" aria-label="พันธกิจพรรค">
            <div className="rc-sec__head">
              <span className="rc-sec__kick rc-mono">MISSION</span>
              <h2 className="rc-sec__title"><span className="rc-th">พันธกิจ</span></h2>
              <span className="rc-sec__count rc-mono">{pad2(missions.length)} <span className="rc-th">ข้อ</span></span>
            </div>
            <ol className="rc-mlist">
              {missions.map((m, i) => (
                <li key={i}><span className="rc-mlist__n rc-mono">{pad2(i + 1)}</span><span className="rc-mlist__t">{m}</span></li>
              ))}
            </ol>
          </section>
        )}

        {/* ===== 3. POLICIES — perforated coupons, one per item ===== */}
        {policiesRaw.length > 0 && (
          <section className="rc-sec" aria-label="นโยบายพรรค">
            <div className="rc-sec__head">
              <span className="rc-sec__kick rc-mono">POLICIES</span>
              <h2 className="rc-sec__title"><span className="rc-th">นโยบายเด่น</span></h2>
              <span className="rc-sec__count rc-mono">{pad2(policiesRaw.length)} <span className="rc-th">ข้อ</span></span>
            </div>
            <ol className="rc-plist">
              {policiesRaw.map((p, i) => {
                const title = typeof p === "object" ? (p.title || p.text || p.name || "") : p;
                const desc = typeof p === "object" ? (p.desc || p.description || p.detail || "") : "";
                return (
                  <li className="rc-coupon" key={i}>
                    <span className="rc-coupon__n">{pad2(i + 1)}</span>
                    <span className="rc-coupon__body">
                      <span className="rc-coupon__title">{title}</span>
                      {desc && <span className="rc-coupon__desc">{desc}</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* ===== 4. THE TEAM — lanyard-card grid (opens ReceiptMemberModal) ===== */}
        {members.length > 0 && (
          <section className="rc-sec" aria-label="ทีมผู้สมัคร">
            <div className="rc-sec__head">
              <span className="rc-sec__kick rc-mono">THE TEAM</span>
              <h2 className="rc-sec__title"><span className="rc-th">ทีมผู้สมัคร</span></h2>
              <span className="rc-sec__count rc-mono">{pad2(members.length)} <span className="rc-th">คน</span></span>
            </div>
            <ul className="rc-team">
              {members.map((m, i) => {
                const img = resolveSrc(m?.imageUrl || m?.modalImageUrl);
                return (
                  <li className="rc-lany" key={m.id || i}>
                    <button type="button" className="rc-lany__btn" onClick={() => openMember(m)} aria-label={m.name}>
                      <span className="rc-lany__grommet" aria-hidden="true" />
                      <span className="rc-lany__clip" aria-hidden="true" />
                      <span className="rc-lany__no rc-mono" aria-hidden="true">{pad2(m.number ?? i + 1)}</span>
                      <span className="rc-lany__photo">
                        {img ? <img src={img} alt={m.name} loading="lazy" /> : <span className="rc-lany__ph" aria-hidden="true">{(m.name || "?").trim().charAt(0)}</span>}
                      </span>
                      <span className="rc-lany__body">
                        <span className="rc-lany__name">{m.name}</span>
                        {(m.position || m.major) && <span className="rc-lany__role">{m.position || m.major}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ===== 5. GALLERY — a horizontal photo-strip (hidden when empty) ===== */}
        {gallery.length > 0 && (
          <section className="rc-sec rc-gal" aria-label="ภาพกิจกรรมพรรค">
            <div className="rc-sec__head">
              <span className="rc-sec__kick rc-mono">GALLERY</span>
              <h2 className="rc-sec__title"><span className="rc-th">ภาพกิจกรรม</span></h2>
              <span className="rc-sec__count rc-mono">{pad2(gallery.length)} <span className="rc-th">ภาพ</span></span>
            </div>
            <div className="rc-strip">
              {gallery.map((src, i) => (
                <button type="button" className="rc-strip__cell" key={i} onClick={() => openLightbox(src)} aria-label={`เปิดภาพที่ ${i + 1}`}>
                  <img src={src} alt={`ภาพกิจกรรม ${i + 1}`} loading="lazy" />
                  <span className="rc-strip__no rc-mono" aria-hidden="true">{pad2(i + 1)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ===== foot band — ticket-stub CTAs ===== */}
        <div className="rc-party-foot">
          <div className="rc-party-stubs">
            <a href={editorMode ? undefined : getPath("/candidates")} className="rc-stubcta">
              <span aria-hidden="true">← </span><span className="rc-th">กลับสารบบผู้สมัคร</span>
            </a>
            <a href={editorMode ? undefined : getPath("/vote")} className="rc-stubcta rc-stubcta--go">
              <span className="rc-th">ไปลงคะแนน</span><span className="rc-stubcta__arrow" aria-hidden="true"> →</span>
            </a>
          </div>
          <span className="rc-party-ref rc-mono" aria-hidden="true">{prefix} {number} · FILE · {pad2(no)}</span>
        </div>

        {/* ===== footer — classic single centered line ===== */}
        <footer className="rc-party-footer">
          <p>© FMS@PSU{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
        </footer>
      </div>

      {/* sticky "กลับไปลงคะแนน" ticket stub — the family's own, only when arriving from vote */}
      {showBackToVote && (
        <a
          href={editorMode ? undefined : getPath("/vote")}
          className="rc-backvote"
        >
          <span className="rc-backvote__perf" aria-hidden="true" />
          <span className="rc-backvote__in"><span aria-hidden="true">← </span><span className="rc-th">กลับไปลงคะแนน</span></span>
        </a>
      )}

      {/* member modal — the receipt family's own dossier card (its own lightbox);
          portalled to <body> so its fixed positioning can never be clipped by an ancestor. */}
      {mounted && selectedMember && createPortal(
        <ReceiptMemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />,
        document.body
      )}

      {/* gallery lightbox — this component's OWN (no shared lightbox) */}
      {lightboxSrc && (
        <div className="rc-lightbox" onClick={() => setLightboxSrc(null)} role="dialog" aria-modal="true" aria-label="ภาพขยาย">
          <button type="button" className="rc-lightbox__close" onClick={() => setLightboxSrc(null)} aria-label="ปิด">✕</button>
          <img src={lightboxSrc} alt="ภาพกิจกรรมพรรค" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <style jsx global>{`
        /* ================= BASE (the polling desk) ================= */
        /* laid-paper ::after + desk vignette ::before + emboss seals + holo foil come
           from the SHARED .rc-desk classes in ReceiptBaseStyles — this root opts in via
           the rc-desk class, matching the home/candidates reference language. */
        .rc-party-root { --rc-stamp-red:#B91C1C; overflow-x:hidden; }

        :where(.rc-party-root) a { text-decoration:none; color:var(--rc-ink); }
        .rc-party-root a:focus-visible, .rc-party-root button:focus-visible {
          outline:2px solid var(--rc-accent-deep); outline-offset:3px; }
        /* mono utility — ONLY Latin / digits / symbols ever wear it (A10.3) */
        .rc-party-root .rc-mono { font-family:var(--rc-fm); }
        /* Thai-in-a-mono-line utility — the Thai half of a bilingual mono label wears
           Chakra Petch so it never falls back (Space Mono has no Thai glyphs, C4) */
        .rc-party-root .rc-th { font-family:var(--rc-fr) !important; }

        /* ---- topbar "head of the desk" (A3 / ruling #4: NO backdrop-filter — opaque
           desk fill + a perforated hairline; ticket-stub nav ported from ReceiptHome) ---- */
        .rc-party-root .rc-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--rc-desk) 96%, var(--rc-receipt)); }
        .rc-party-root .rc-topbar::after { content:""; position:absolute; left:0; right:0; bottom:0; height:1.5px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }
        .rc-party-root .rc-topbar__in { max-width:1120px; margin:0 auto; padding:10px 20px;
          display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
        .rc-party-root .rc-logo { position:relative; display:inline-flex; align-items:center; flex-shrink:0;
          padding:6px 12px 6px 14px; background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px);
          box-shadow:1px 3px 8px -5px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-party-root .rc-logo::before { content:""; position:absolute; left:-3px; top:8px; width:10px; height:18px;
          border:2px solid var(--rc-faint); border-right:none; border-radius:6px 0 0 6px; background:transparent; transform:rotate(-4deg); }
        .rc-party-root .rc-logo__img { height:28px; width:auto; object-fit:contain; display:block; }
        .rc-party-root .rc-nav { display:none; gap:8px; margin-left:auto; align-items:center; }
        .rc-party-root .rc-nav__link { position:relative; display:inline-flex; align-items:center; min-height:40px;
          font-family:var(--rc-fr); font-weight:600; font-size:12.5px; letter-spacing:.01em; color:var(--rc-ink2);
          padding:0 13px 0 16px; background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px);
          transition:transform .15s ease, color .2s ease, background .2s ease, border-color .2s ease; }
        .rc-party-root .rc-nav__link::before { content:""; position:absolute; left:4px; top:7px; bottom:7px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 2px, transparent 2px 5px); }
        .rc-party-root .rc-nav__link:hover { transform:translateY(-1px); color:var(--rc-ink); border-color:var(--rc-accent); }
        .rc-party-root .rc-nav__link.on { color:var(--rc-accent-deep); border-color:var(--rc-accent);
          background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); }
        .rc-party-root .rc-nav__link.on::before { left:1px;
          background:repeating-linear-gradient(180deg, var(--rc-accent) 0 2px, transparent 2px 5px); }
        .rc-party-root .rc-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .rc-party-root .rc-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--rc-fh);
          font-weight:600; font-size:13px; color:var(--rc-on-accent); background:var(--rc-accent); border:none; cursor:pointer;
          padding:9px 20px; border-radius:var(--rc-radius-button, 8px); transition:background .2s ease, transform .15s ease; }
        .rc-party-root .rc-loginbtn:hover { background:var(--rc-accent-deep); transform:translateY(-1px); }
        .rc-party-root .rc-loginbtn:active { transform:scale(.96); }
        .rc-party-root .rc-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--rc-line) 70%, var(--rc-receipt)); }
        .rc-party-root .rc-skelbar { display:block; width:58px; height:12px; border-radius:3px;
          background:color-mix(in srgb, var(--rc-ink2) 30%, var(--rc-receipt)); animation:rcPulse 1.3s ease-in-out infinite; }
        @keyframes rcPulse { 0%,100%{opacity:.45} 50%{opacity:1} }
        .rc-party-root .rc-userchip { position:relative; }
        .rc-party-root .rc-userchip__btn { position:relative; display:inline-flex; align-items:center; gap:9px; min-height:44px;
          background:var(--rc-receipt); border:1.5px solid var(--rc-stamp-line); padding:5px 14px 5px 5px; cursor:pointer;
          font-family:inherit; clip-path:polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
          transition:transform .15s ease, border-color .2s ease; }
        .rc-party-root .rc-userchip__btn::after { content:""; position:absolute; top:5px; right:12px; width:9px; height:9px;
          border-radius:50%; background:var(--rc-desk);
          box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--rc-faint) 62%, var(--rc-ink2)); }
        .rc-party-root .rc-userchip__btn:hover { border-color:var(--rc-accent); }
        .rc-party-root .rc-userchip__btn:active { transform:scale(.97); }
        .rc-party-root .rc-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:var(--rc-accent); color:var(--rc-on-accent); font-family:var(--rc-fh); font-weight:700; font-size:14px; line-height:1; }
        .rc-party-root .rc-userchip__name { font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-party-root .rc-userchip__caret { color:var(--rc-ink2); font-size:11px; }
        .rc-party-root .rc-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--rc-receipt);
          border:1.5px solid var(--rc-stamp-line); border-radius:10px; overflow:hidden; z-index:50;
          box-shadow:2px 20px 42px -20px color-mix(in srgb, var(--rc-ink) 22%, transparent); }
        .rc-party-root .rc-usermenu__head { padding:14px 16px; border-bottom:1px dotted var(--rc-line); }
        .rc-party-root .rc-usermenu__name { font-family:var(--rc-fh); font-weight:700; font-size:14px; color:var(--rc-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-party-root .rc-usermenu__id { font-family:var(--rc-fm); font-size:10.5px; letter-spacing:.04em; color:var(--rc-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-party-root .rc-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-accent-deep); }
        .rc-party-root .rc-usermenu__out:hover { background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); }
        .rc-party-root .rc-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:8px; background:var(--rc-receipt); border:1.5px solid var(--rc-stamp-line); cursor:pointer;
          transition:transform .15s ease, border-color .2s ease; }
        .rc-party-root .rc-burger:hover { border-color:var(--rc-accent); }
        .rc-party-root .rc-burger:active { transform:scale(.95); }
        .rc-party-root .rc-burger span { display:block; height:2.5px; border-radius:2px; background:var(--rc-ink); }
        .rc-party-root .rc-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .rc-party-root .rc-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .rc-party-root .rc-sheet__link { position:relative; display:flex; align-items:center; min-height:48px; padding:0 16px 0 20px;
          font-family:var(--rc-fr); font-weight:600; font-size:14px; color:var(--rc-ink);
          background:var(--rc-receipt); border:1px solid var(--rc-stamp-line);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px); transition:border-color .2s ease; }
        .rc-party-root .rc-sheet__link::before { content:""; position:absolute; left:5px; top:9px; bottom:9px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 2px, transparent 2px 5px); }
        .rc-party-root .rc-sheet__link:hover { border-color:var(--rc-accent); }

        /* ---- page container ---- */
        .rc-party-root .rc-party-wrap { position:relative; z-index:1; max-width:1040px; margin:0 auto; padding:0 20px 40px; }
        .rc-party-root .rc-issue { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:14px 0;
          border-bottom:1px dotted var(--rc-line); font-family:var(--rc-fm); font-size:10px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--rc-faint); }

        /* ================= DOSSIER — register tape (offset left) + folder cover ================= */
        /* mobile-first: the tape is a full-width printed strip; the folder is laid over
           it, pulled UP and inset from the LEFT so the tape peeks along the top + left
           edge (P-LOG-089: real clearance, the folder never covers the tape header). */
        .rc-party-root .rc-dossier { position:relative; margin-top:26px; padding-bottom:6px; }
        .rc-party-root .rc-file-tape { position:relative; z-index:0; background:var(--rc-receipt);
          border:1px solid var(--rc-line); border-radius:4px; padding:16px 18px 10px;
          background-image:repeating-linear-gradient(180deg, transparent 0 28px, color-mix(in srgb, var(--rc-ink) 3%, transparent) 28px 29px);
          box-shadow:2px 12px 26px -18px color-mix(in srgb, var(--rc-ink) 32%, transparent);
          -webkit-mask:radial-gradient(6px 8px at 8px 100%, transparent 96%, #000) bottom left/16px 8px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat;
                  mask:radial-gradient(6px 8px at 8px 100%, transparent 96%, #000) bottom left/16px 8px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat; }
        .rc-party-root .rc-file-tape__mast { display:block; font-size:9.5px; letter-spacing:.2em; color:var(--rc-faint); }
        .rc-party-root .rc-file-reg { margin:12px 0 0; padding:0; display:flex; flex-wrap:wrap; gap:12px 30px; }
        .rc-party-root .rc-file-reg > div { min-width:0; display:flex; flex-direction:column; gap:3px; }
        .rc-party-root .rc-file-reg__slogan { flex-basis:100%; }
        .rc-party-root .rc-file-reg dt { font-family:var(--rc-fm); font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:var(--rc-faint); }
        .rc-party-root .rc-file-reg dd { margin:0; font-family:var(--rc-fr); font-weight:700; font-size:14px; color:var(--rc-ink);
          overflow:hidden; text-overflow:ellipsis; }
        .rc-party-root .rc-file-reg__slogan dd { font-weight:400; font-style:italic; color:var(--rc-ink2); }
        .rc-party-root .rc-file-tape__foot { margin-top:12px; text-align:center; font-family:var(--rc-fm); font-size:8.5px;
          letter-spacing:.22em; color:var(--rc-faint); }

        /* folder cover — cardstock in the family tone, laid over the tape */
        .rc-party-root .rc-folder { position:relative; z-index:2; margin:-14px 0 0 20px; overflow:hidden;
          background:linear-gradient(178deg, color-mix(in srgb, var(--rc-accent) 6%, var(--rc-receipt)), var(--rc-receipt) 46%);
          border:1px solid var(--rc-stamp-line); border-radius:5px 5px 6px 6px; padding:34px 26px 28px;
          box-shadow:3px 22px 46px -26px color-mix(in srgb, var(--rc-ink) 42%, transparent); }
        /* accent index TAB protruding from the top edge */
        .rc-party-root .rc-folder__tab { position:absolute; top:-1px; right:26px; display:inline-flex; align-items:center;
          min-height:26px; padding:4px 16px 6px; font-size:10px; letter-spacing:.12em; color:var(--rc-on-accent);
          background:var(--rc-accent); border-radius:0 0 8px 8px;
          box-shadow:1px 4px 10px -6px color-mix(in srgb, var(--rc-ink) 60%, transparent); }
        .rc-party-root .rc-folder__tab .rc-th { color:var(--rc-on-accent); }
        /* rubber band strapped diagonally across the top-left corner (single sheet) */
        .rc-party-root .rc-folder__band { position:absolute; z-index:3; left:-40px; top:36px; width:150px; height:12px;
          transform:rotate(-45deg); pointer-events:none;
          background:linear-gradient(180deg, color-mix(in srgb, var(--rc-accent-deep) 70%, var(--rc-ink)), var(--rc-accent-deep));
          box-shadow:0 2px 5px -1px color-mix(in srgb, var(--rc-ink) 45%, transparent),
            inset 0 1px 0 color-mix(in srgb, var(--rc-receipt) 40%, transparent); opacity:.9; }
        /* faint "OFFICIAL PARTY FILE" ghost ring stamp on the cover */
        .rc-party-root .rc-folder__ghost { position:absolute; z-index:0; right:-30px; bottom:-38px; width:180px; height:180px;
          border-radius:50%; border:2.5px solid var(--rc-ink); opacity:.06; transform:rotate(-14deg); display:grid; place-items:center;
          pointer-events:none; }
        .rc-party-root .rc-folder__ghost::before { content:""; position:absolute; inset:12px; border-radius:50%; border:1.5px solid var(--rc-ink); }
        .rc-party-root .rc-folder__ghost span { max-width:74%; text-align:center; font-family:var(--rc-fm); font-size:12px;
          letter-spacing:.22em; text-transform:uppercase; color:var(--rc-ink); line-height:1.3; }

        .rc-party-root .rc-folder__head { position:relative; z-index:1; display:flex; align-items:center; gap:18px; }
        /* ink-ring number STAMP */
        .rc-party-root .rc-folder__stamp { position:relative; width:78px; height:78px; flex:none; border-radius:50%;
          border:3px solid var(--rc-accent-deep); display:grid; place-items:center; transform:rotate(-7deg);
          color:var(--rc-accent-deep); background:color-mix(in srgb, var(--rc-accent) 6%, var(--rc-receipt)); }
        .rc-party-root .rc-folder__stamp::before { content:""; position:absolute; inset:6px; border-radius:50%;
          border:1.5px solid color-mix(in srgb, var(--rc-accent-deep) 60%, transparent); }
        .rc-party-root .rc-folder__stamp b { font-family:var(--rc-fr); font-weight:700; font-size:32px; line-height:.9;
          font-variant-numeric:tabular-nums; }
        .rc-party-root .rc-folder__stamp .rc-mono { font-size:7.5px; letter-spacing:.18em; text-transform:uppercase; opacity:.8; }
        /* logo tile in an ink-stamp frame (double ring) */
        .rc-party-root .rc-folder__logo { position:relative; width:86px; height:86px; flex:none; border-radius:6px; overflow:hidden;
          background:var(--rc-desk); border:2px solid var(--rc-stamp-line); display:grid; place-items:center;
          box-shadow:inset 0 0 0 4px var(--rc-receipt), inset 0 0 0 5px color-mix(in srgb, var(--rc-stamp-line) 55%, transparent); }
        .rc-party-root .rc-folder__logo img { width:100%; height:100%; object-fit:cover; border-radius:2px; }
        .rc-party-root .rc-folder__logo-ph { font-family:var(--rc-fr); font-weight:700; font-size:30px; font-variant-numeric:tabular-nums;
          color:var(--rc-accent-deep); }

        .rc-party-root .rc-folder__title { position:relative; z-index:1; margin-top:18px; }
        .rc-party-root .rc-folder__kick { font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--rc-ink2); }
        .rc-party-root .rc-folder__name { margin:8px 0 0; font-family:var(--rc-fh); font-weight:700; line-height:1.04;
          letter-spacing:-.01em; font-size:clamp(30px,7vw,52px); color:var(--rc-ink); overflow-wrap:break-word; }
        .rc-party-root .rc-folder__slogan { margin:12px 0 0; max-width:52ch; font-family:var(--rc-fr); font-size:15px; line-height:1.6;
          color:var(--rc-ink2); }

        /* ================= LOGO MEANING LETTER ================= */
        .rc-party-root .rc-letter { position:relative; margin-top:44px; background:var(--rc-receipt);
          border:1px solid var(--rc-line); border-radius:4px; padding:26px clamp(20px,4vw,34px) 30px;
          box-shadow:2px 16px 34px -22px color-mix(in srgb, var(--rc-ink) 30%, transparent); }
        .rc-party-root .rc-letter__head { display:flex; align-items:center; gap:14px; }
        .rc-party-root .rc-letter__logo { width:44px; height:44px; flex:none; border-radius:6px; overflow:hidden; display:grid; place-items:center;
          background:var(--rc-desk); border:1px solid var(--rc-stamp-line); font-family:var(--rc-fr); font-weight:700; font-size:15px;
          color:var(--rc-accent-deep); }
        .rc-party-root .rc-letter__logo img { width:100%; height:100%; object-fit:cover; }
        /* enlarged letterhead logo — the LOGO MEANING letter shows the mark it explains */
        .rc-party-root .rc-letter__logo--lg { width:56px; height:56px; font-size:19px; }
        .rc-party-root .rc-letter__id { display:flex; flex-direction:column; gap:2px; min-width:0; }
        .rc-party-root .rc-letter__org { font-family:var(--rc-fh); font-weight:700; font-size:16px; color:var(--rc-ink);
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .rc-party-root .rc-letter__sub { font-size:9.5px; letter-spacing:.16em; color:var(--rc-faint); }
        /* double rule under the letterhead */
        .rc-party-root .rc-letter__rule { margin:16px 0 0; height:3px;
          border-top:1.5px solid var(--rc-stamp-line); border-bottom:1px solid var(--rc-line); }
        .rc-party-root .rc-letter__title { margin:22px 0 0; font-family:var(--rc-fh); font-weight:700; font-size:clamp(20px,4.5vw,28px);
          letter-spacing:-.01em; color:var(--rc-ink); }
        .rc-party-root .rc-letter__body { margin:14px 0 0; font-family:var(--rc-fr); font-size:15.5px; line-height:1.85; color:var(--rc-ink2);
        /* StoryClamp — a long letter folds behind a paper fade so the sections
           below (missions / policies / team) stay within reach */
        .rc-party-root .rc-sc { --sc-max:9.5em; --sc-fade:var(--rc-receipt); }
        .rc-party-root .rc-sc .sc__hint { color:var(--rc-accent-deep); font-family:var(--rc-fm); text-transform:uppercase; }
          white-space:pre-line; }
        /* missions — numbered lines in the receipt voice (mono numeral, Chakra text) */
        .rc-party-root .rc-mlist { list-style:none; margin:24px 0 0; padding:0; display:flex; flex-direction:column; gap:14px; }
        .rc-party-root .rc-mlist li { display:grid; grid-template-columns:auto 1fr; gap:16px; align-items:start;
          padding-top:14px; border-top:1px dotted var(--rc-line); }
        .rc-party-root .rc-mlist li:first-child { border-top:none; padding-top:0; }
        .rc-party-root .rc-mlist__n { font-family:var(--rc-fm); font-weight:700; font-size:16px; line-height:1.3;
          font-variant-numeric:tabular-nums; color:var(--rc-accent-deep); }
        .rc-party-root .rc-mlist__t { font-family:var(--rc-fr); font-size:15px; line-height:1.6; color:var(--rc-ink); }

        /* ================= generic section head ================= */
        .rc-party-root .rc-sec { margin-top:48px; }
        .rc-party-root .rc-sec__head { display:flex; align-items:flex-end; gap:14px; padding-bottom:14px;
          border-bottom:1.5px solid var(--rc-stamp-line); }
        .rc-party-root .rc-sec__kick { font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--rc-faint); }
        .rc-party-root .rc-sec__title { margin:0; font-family:var(--rc-fh); font-weight:700; font-size:clamp(24px,6vw,38px);
          line-height:1; letter-spacing:-.01em; color:var(--rc-ink); }
        .rc-party-root .rc-sec__count { margin-left:auto; font-size:10px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--rc-ink2); white-space:nowrap; padding-bottom:3px; font-variant-numeric:tabular-nums; }

        /* ================= POLICIES — perforated coupons ================= */
        .rc-party-root .rc-plist { list-style:none; margin:18px 0 0; padding:0; display:flex; flex-direction:column; gap:12px; }
        .rc-party-root .rc-coupon { position:relative; display:grid; grid-template-columns:auto 1fr; gap:18px; align-items:center;
          padding:16px 18px 16px 26px; background:var(--rc-receipt); border:1px solid var(--rc-line); border-radius:4px;
          box-shadow:1px 8px 20px -16px color-mix(in srgb, var(--rc-ink) 40%, transparent);
          transition:transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
        .rc-party-root .rc-coupon::before { content:""; position:absolute; left:9px; top:12px; bottom:12px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-stamp-line) 0 3px, transparent 3px 7px); }
        .rc-party-root .rc-coupon:hover { transform:translateY(-3px); border-color:var(--rc-accent);
          box-shadow:2px 16px 28px -20px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-party-root .rc-coupon__n { display:grid; place-items:center; width:40px; height:40px; flex:none; border-radius:50%;
          border:2px solid var(--rc-accent-deep); font-family:var(--rc-fr); font-weight:800; font-size:16px; line-height:1;
          font-variant-numeric:tabular-nums; color:var(--rc-accent-deep); }
        .rc-party-root .rc-coupon__body { min-width:0; display:flex; flex-direction:column; gap:4px; }
        .rc-party-root .rc-coupon__title { font-family:var(--rc-fr); font-weight:700; font-size:15.5px; line-height:1.4; color:var(--rc-ink); }
        .rc-party-root .rc-coupon__desc { font-family:var(--rc-fr); font-size:13.5px; line-height:1.55; color:var(--rc-ink2); }

        /* ================= TEAM — lanyard cards ================= */
        .rc-party-root .rc-team { list-style:none; margin:22px 0 0; padding:0; display:grid; grid-template-columns:1fr; gap:14px; }
        .rc-party-root .rc-lany { position:relative; }
        .rc-party-root .rc-lany__btn { position:relative; display:flex; align-items:center; gap:16px; width:100%; text-align:left;
          padding:16px 18px 16px 16px; margin-top:8px; cursor:pointer; color:var(--rc-ink);
          background:var(--rc-receipt); border:1.5px solid var(--rc-stamp-line); border-radius:4px 4px 6px 6px;
          box-shadow:1px 10px 24px -18px color-mix(in srgb, var(--rc-ink) 40%, transparent);
          transition:transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
        .rc-party-root .rc-lany__btn:hover { transform:translateY(-3px); border-color:var(--rc-accent);
          box-shadow:2px 18px 30px -20px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        /* punched grommet hole on the top edge + the clip through it */
        .rc-party-root .rc-lany__grommet { position:absolute; top:-4px; left:50%; transform:translateX(-50%); width:26px; height:9px;
          border-radius:9px; background:var(--rc-desk); border:1.5px solid var(--rc-stamp-line); }
        .rc-party-root .rc-lany__clip { position:absolute; top:-11px; left:50%; transform:translateX(-50%); width:11px; height:16px;
          border:2px solid var(--rc-faint); border-bottom:none; border-radius:6px 6px 0 0; background:transparent; }
        .rc-party-root .rc-lany__no { position:absolute; top:8px; right:10px; font-size:9px; letter-spacing:.08em; color:var(--rc-faint);
          font-variant-numeric:tabular-nums; }
        .rc-party-root .rc-lany__photo { position:relative; width:64px; height:64px; flex:none; border-radius:5px; overflow:hidden;
          background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); border:1px solid var(--rc-line); display:grid; place-items:center; }
        .rc-party-root .rc-lany__photo img { width:100%; height:100%; object-fit:cover; }
        .rc-party-root .rc-lany__ph { font-family:var(--rc-fh); font-weight:700; font-size:26px; color:var(--rc-accent-deep); }
        .rc-party-root .rc-lany__body { min-width:0; display:flex; flex-direction:column; gap:3px; }
        .rc-party-root .rc-lany__name { font-family:var(--rc-fh); font-weight:700; font-size:16px; line-height:1.2; color:var(--rc-ink);
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .rc-party-root .rc-lany__btn:hover .rc-lany__name { color:var(--rc-accent-deep); }
        .rc-party-root .rc-lany__role { font-family:var(--rc-fr); font-size:12.5px; line-height:1.35; color:var(--rc-ink2);
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }

        /* ================= GALLERY — horizontal photo-strip ================= */
        .rc-party-root .rc-strip { margin-top:20px; display:flex; gap:14px; overflow-x:auto; padding:8px 2px 12px;
          scroll-snap-type:x proximity; -webkit-overflow-scrolling:touch; }
        .rc-party-root .rc-strip__cell { position:relative; flex:0 0 clamp(200px, 60vw, 268px); scroll-snap-align:start; cursor:pointer;
          aspect-ratio:4/3; border-radius:4px; overflow:hidden; background:var(--rc-receipt); border:1px solid var(--rc-line); padding:0;
          box-shadow:2px 14px 30px -20px color-mix(in srgb, var(--rc-ink) 32%, transparent);
          transition:transform .25s ease, border-color .25s ease; }
        .rc-party-root .rc-strip__cell:hover { transform:translateY(-3px); border-color:var(--rc-accent); }
        .rc-party-root .rc-strip__cell img { width:100%; height:100%; object-fit:cover; display:block; }
        .rc-party-root .rc-strip__no { position:absolute; left:8px; bottom:8px; padding:3px 8px; font-size:9px; letter-spacing:.1em;
          color:var(--rc-receipt); background:color-mix(in srgb, var(--rc-ink) 78%, transparent); border-radius:3px; font-variant-numeric:tabular-nums; }

        /* ================= foot band — ticket-stub CTAs ================= */
        .rc-party-root .rc-party-foot { margin-top:44px; padding-top:22px; border-top:1px dotted var(--rc-line);
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .rc-party-root .rc-party-stubs { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .rc-party-root .rc-stubcta { position:relative; display:inline-flex; align-items:center; gap:4px; min-height:44px;
          padding:0 16px 0 20px; font-family:var(--rc-fh); font-weight:600; font-size:14px; color:var(--rc-ink);
          background:var(--rc-receipt); border:1.5px solid var(--rc-ink);
          clip-path:polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px);
          transition:transform .18s ease, border-color .2s ease, color .2s ease; }
        .rc-party-root .rc-stubcta::before { content:""; position:absolute; left:5px; top:8px; bottom:8px; width:2px;
          background:repeating-linear-gradient(180deg, var(--rc-ink) 0 2px, transparent 2px 5px); }
        .rc-party-root .rc-stubcta:hover { transform:translateY(-2px); color:var(--rc-accent-deep); border-color:var(--rc-accent-deep); }
        .rc-party-root .rc-stubcta:active { transform:scale(.98); }
        .rc-party-root .rc-stubcta--go { border-color:var(--rc-accent); color:var(--rc-accent-deep);
          background:color-mix(in srgb, var(--rc-accent) 7%, var(--rc-receipt)); }
        .rc-party-root .rc-stubcta__arrow { transition:transform .25s ease; }
        .rc-party-root .rc-stubcta:hover .rc-stubcta__arrow { transform:translateX(3px); }
        .rc-party-root .rc-party-ref { margin-left:auto; font-size:9px; letter-spacing:.2em; color:var(--rc-faint); font-variant-numeric:tabular-nums; }

        /* ---- footer ---- */
        .rc-party-root .rc-party-footer { margin-top:40px; padding:22px 0; border-top:1px dotted var(--rc-line); text-align:center; }
        .rc-party-root .rc-party-footer p { margin:0; font-family:var(--rc-fm); font-size:10px; letter-spacing:.12em;
          text-transform:uppercase; color:var(--rc-ink2); }

        /* ================= sticky "กลับไปลงคะแนน" ticket stub ================= */
        .rc-party-root .rc-backvote { position:fixed; left:50%; bottom:20px; transform:translateX(-50%); z-index:39;
          display:inline-flex; align-items:center; min-height:48px; padding:0 22px 0 26px; cursor:pointer;
          font-family:var(--rc-fh); font-weight:700; font-size:14.5px; color:var(--rc-on-accent); background:var(--rc-accent-deep);
          clip-path:polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px);
          box-shadow:2px 14px 30px -12px color-mix(in srgb, var(--rc-ink) 58%, transparent);
          transition:transform .18s ease, background .2s ease; }
        .rc-party-root .rc-backvote:hover { transform:translateX(-50%) translateY(-2px); background:var(--rc-accent); }
        .rc-party-root .rc-backvote:active { transform:translateX(-50%) scale(.98); }
        .rc-party-root .rc-backvote__perf { position:absolute; left:6px; top:9px; bottom:9px; width:2px;
          background:repeating-linear-gradient(180deg, color-mix(in srgb, var(--rc-on-accent) 70%, transparent) 0 2px, transparent 2px 5px); }
        .rc-party-root .rc-backvote__in .rc-th { color:var(--rc-on-accent); }

        /* ================= gallery lightbox (own — solid ink scrim, NO backdrop-filter) ================= */
        .rc-party-root .rc-lightbox { position:fixed; inset:0; z-index:70; display:grid; place-items:center; padding:24px;
          background:color-mix(in srgb, var(--rc-ink) 82%, transparent); animation:rcLbFade .2s ease both; }
        .rc-party-root .rc-lightbox img { max-width:100%; max-height:85vh; object-fit:contain; border-radius:4px;
          box-shadow:0 40px 90px -30px rgba(0,0,0,.6); }
        .rc-party-root .rc-lightbox__close { position:absolute; top:18px; right:18px; width:44px; height:44px; border-radius:50%;
          display:grid; place-items:center; cursor:pointer; border:1.5px solid color-mix(in srgb, var(--rc-receipt) 40%, transparent);
          background:color-mix(in srgb, var(--rc-ink) 40%, transparent); color:var(--rc-receipt); font-size:16px; }
        @keyframes rcLbFade { from { opacity:0; } }

        /* ================= TABLET+ : inline nav + roomier grids ================= */
        @media (min-width:768px) {
          .rc-party-root .rc-topbar__in { gap:22px; }
          .rc-party-root .rc-nav { display:flex; }
          .rc-party-root .rc-userwrap { margin-left:0; }
          .rc-party-root .rc-burger, .rc-party-root .rc-sheet { display:none; }
          .rc-party-root .rc-team { grid-template-columns:repeat(2, 1fr); gap:16px; }
          .rc-party-root .rc-plist { display:grid; grid-template-columns:repeat(2, 1fr); }
        }

        /* ================= DESKTOP : tape peeks further left under the folder ================= */
        @media (min-width:1024px) {
          .rc-party-root .rc-dossier { padding-left:8px; }
          .rc-party-root .rc-file-tape { width:min(560px, 72%); }
          .rc-party-root .rc-folder { margin:-18px 0 0 34px; }
          .rc-party-root .rc-team { grid-template-columns:repeat(3, 1fr); }
        }

        /* ================= MOBILE (<=420) : tighten ================= */
        @media (max-width:420px) {
          .rc-party-root .rc-folder { padding:30px 18px 24px; margin-left:14px; }
          .rc-party-root .rc-folder__head { gap:12px; }
          .rc-party-root .rc-folder__stamp { width:64px; height:64px; }
          .rc-party-root .rc-folder__stamp b { font-size:26px; }
          .rc-party-root .rc-folder__logo { width:70px; height:70px; }
          .rc-party-root .rc-seal--c { display:none; }
          .rc-party-root .rc-party-ref { display:none; }
        }

        /* reduced motion — freeze every animation (foil stays statically iridescent),
           full page visible. Scoped to .rc-party-root. */
        @media (prefers-reduced-motion:reduce) {
          .rc-party-root *, .rc-party-root *::before, .rc-party-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
