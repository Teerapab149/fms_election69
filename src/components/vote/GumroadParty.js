"use client";

// GumroadParty — the "Active Pulse" PUBLIC PARTY DETAIL page (template: gumroad).
//
// Rendered by /party when activeTemplateId === 'gumroad'. The classic cinematic
// design stays under the !isGumroad branch (selectable via the classic template).
//
// This is a PRESENTATION page (no vote): hero (cover + logo + name + number) →
// story (logoMeaning) + missions → policies → committee members (+ profile modal),
// plus an optional gallery lightbox and a "back to vote" bar.
//
// Identity: same chunky gumroad language (cream base, 2.5px ink borders, hard
// offset shadows) — BUT each party tints the page with its OWN signature colour
// (the same hue the voter saw on the candidates card). The signature drives
// `--pop` (pastel fill) + `--pop-deep` (jewel tone) used across the accents.

import { getPath } from "../../utils/basePath";
import { GumroadBaseStyles } from "../home/GumroadTheme";
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowLeft, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import { sortMembersByPosition } from "../../utils/memberSort";
import { buildPartyTheme, prefersDarkText } from "../../utils/partyColors";
import SiteNavbar from "../elements/site-navbar/gumroad";
import MemberTile from "../composites/member-tile/gumroad";
import StoryClamp from "./StoryClamp";

// --- data helpers (party fields are loose JSON from the admin) ---
const asText = (it) =>
  typeof it === "string" ? it : (it?.text ?? it?.title ?? it?.detail ?? it?.description ?? it?.name ?? "");

const firstImage = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) return val[0] || null;
  if (typeof val === "string") {
    const s = val.trim();
    if (s.startsWith("[")) { try { const a = JSON.parse(s); return Array.isArray(a) ? a[0] : null; } catch { return s; } }
    return s;
  }
  return null;
};
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

export default function GumroadParty({ party = {}, galleryImages = [], showBackToVote = false, isSingleParty = false }) {
  const [modalMember, setModalMember] = useState(null);   // click a member → profile modal
  const [lightbox, setLightbox] = useState(-1);           // gallery lightbox index (-1 = closed)

  // Per-party signature colour — same source/index as the candidates page, so the
  // hue carries through from the card the voter clicked.
  const theme = useMemo(
    () => buildPartyTheme(party, Math.max(0, (parseInt(party?.number) || 1) - 1)),
    [party?.number, party?.color]
  );

  const missions = useMemo(() => (party?.missions || []).map(asText).filter(Boolean), [party?.missions]);
  const policies = useMemo(() => (party?.policies || []).map((it) => (
    typeof it === "string"
      ? { title: it, desc: "" }
      : { title: asText(it), desc: it?.desc ?? it?.description ?? it?.detail ?? "" }
  )).filter((p) => p.title), [party?.policies]);
  const members = useMemo(() => sortMembersByPosition(party?.members || []), [party?.members]);
  const story = (party?.logoMeaning || "").trim();

  // Gallery images come back as objects {imageUrl} or bare strings — normalise.
  const gallery = useMemo(
    () => (galleryImages || []).map((g) => resolveSrc(g?.imageUrl || g)).filter(Boolean),
    [galleryImages]
  );

  // Hero cover: first gallery shot → wide team photo → poster → placeholder.
  const heroImg = gallery[0] || resolveSrc(firstImage(party?.groupImageUrls) || firstImage(party?.officialImageUrl) || firstImage(party?.mobileHeroImage));
  const logoImg = resolveSrc(party?.logoUrl);

  const closeLightbox = () => setLightbox(-1);
  const step = (dir) => setLightbox((i) => (gallery.length ? (i + dir + gallery.length) % gallery.length : -1));

  return (
    <div
      className="fms-app gp-root gum-root"
      style={{
        "--pop": theme.soft, "--pop-deep": theme.main, "--pop-ink": theme.textOnLight,
        // --pop is the party's own colour, so anything printed ON it has to follow it
        // (the pop stickers were fixed --ink and landed at 4.4:1 on the mock colour;
        // a darker signature would go lower)
        "--pop-text": prefersDarkText(theme.soft) ? "var(--ink)" : "var(--cream)",
      }}
    >
      <GumroadBaseStyles />
      {/* TOPBAR — shared gumroad navbar element */}
      <SiteNavbar active="candidates" />

      <main className="gp-page" style={showBackToVote ? { paddingBottom: 96 } : undefined}>
        {/* eyebrow */}
        <div className="gp-eyebrow">
          {/* single real party → /candidates just redirects back here (candidates/page.js:92-95), so send it home instead */}
          <a href={getPath(isSingleParty ? "/" : "/candidates")} className="gp-back"><ArrowLeft size={16} strokeWidth={2.5} /> {isSingleParty ? "กลับหน้าแรก" : "ผู้สมัครทั้งหมด"}</a>
          <span className="gp-sticker gp-sticker--pop">★ OFFICIAL PARTY</span>
        </div>

        {/* HERO */}
        <section className="gp-hero">
          <div className="gp-hero__media">
            {heroImg ? <img src={heroImg} alt={party?.name || "party"} /> :
              <span className="gp-hero__ph">★ TEAM · {members.length} MEMBERS ★</span>}
            {/* ภาพเดียว = ภาพนั้นโชว์เป็น hero อยู่แล้ว ปุ่มแกลเลอรีจะเปิด lightbox
                มาให้ดูรูปเดิมซ้ำ — ขึ้นเมื่อมีรูปที่สองเป็นต้นไปเท่านั้น (2026-07-28) */}
            {gallery.length > 1 && (
              <button type="button" className="gp-hero__gallery" onClick={() => setLightbox(0)}>
                <Maximize2 size={15} strokeWidth={2.5} /> ดูแกลเลอรี · {gallery.length}
              </button>
            )}
          </div>
          <div className="gp-hero__body">
            <div className="gp-hero__logo">
              {logoImg ? <img src={logoImg} alt="logo" /> : <span>{(party?.name || "P").slice(0, 2).toUpperCase()}</span>}
            </div>
            <div className="gp-hero__txt">
              <h1 className="gp-hero__title">{party?.name}</h1>
              {party?.slogan ? <p className="gp-hero__slogan">&ldquo;{party.slogan}&rdquo;</p> : null}
            </div>
            {party?.number != null && <div className="gp-hero__no">{party.number}</div>}
          </div>
        </section>

        {/* STORY (optional) + MISSIONS */}
        {(story || missions.length > 0) && (
          <section className="gp-section" data-cols={story && missions.length ? "2" : "1"}>
            {story ? (
              <article className="gp-card">
                <span className="gp-sticker gp-sticker--pop">💡 เรื่องราวของพรรค</span>
                <h2 className="gp-card__h">แนวคิด & ที่มา</h2>
                <div className="gp-story">
                  <StoryClamp className="gp-sc"><p className="gp-card__p">{story}</p></StoryClamp>
                </div>
                <span className="gp-story__hint"><span className="gm-thai">เลื่อนเพื่ออ่านต่อ</span> ↓</span>
              </article>
            ) : null}
            {missions.length > 0 && (
              <article className="gp-card gp-card--ink">
                <span className="gp-sticker gp-sticker--pop">🚩 พันธกิจ</span>
                <h2 className="gp-card__h">เป้าหมายของเรา</h2>
                <div className="gp-mlist">
                  {missions.map((m, i) => (
                    <div className="gp-m" key={i}>
                      <span className="gp-m__no">{String(i + 1).padStart(2, "0")}</span>
                      <p className="gp-m__tx">{m}</p>
                    </div>
                  ))}
                </div>
              </article>
            )}
          </section>
        )}

        {/* POLICIES */}
        {policies.length > 0 && (
          <section className="gp-card gp-block">
            <span className="gp-sticker gp-sticker--lime">📋 นโยบายของพรรค</span>
            <div className="gp-policies">
              {policies.map((p, i) => (
                <div className="gp-policy" key={i}>
                  <span className="gp-policy__no">{String(i + 1).padStart(2, "0")}</span>
                  <p className="gp-policy__t">{p.title}</p>
                  {p.desc && <p className="gp-policy__d">{p.desc}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MEMBERS */}
        {members.length > 0 && (
          <section className="gp-card gp-card--cream gp-block">
            <div className="gp-members__head">
              <span className="gp-sticker gp-sticker--ink">★ ทีมผู้สมัคร</span>
              <span className="gp-members__count">{members.length} CANDIDATES</span>
            </div>
            <div className="gp-members">
              {members.map((m, i) => (
                <MemberTile key={m?.id ?? i} member={m} photo={resolveSrc(m?.imageUrl)} index={i} onClick={() => setModalMember(m)} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="gp-footer">
        <span className="gp-star">★</span>
        <span>{party?.name}</span>
        <span className="gp-star">★</span>
      </footer>

      {/* BACK TO VOTE BAR (only when arriving from the vote flow) */}
      {showBackToVote && (
        <div className="gp-votebar">
          <span className="gp-votebar__lbl"><span className="gm-thai">มาจากหน้าลงคะแนน</span>?</span>
          <a href={getPath("/vote")} className="gp-votebar__btn"><ArrowLeft size={18} strokeWidth={3} /> กลับไปลงคะแนน</a>
        </div>
      )}

      {/* MEMBER PROFILE MODAL */}
      <AnimatePresence>
        {modalMember && (() => {
          const src = resolveSrc(modalMember.modalImageUrl || modalMember.imageUrl);
          return (
            <motion.div className="gp-modal" onClick={() => setModalMember(null)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <motion.div className="gp-modal__card" onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}>
                <button type="button" className="gp-modal__x" onClick={() => setModalMember(null)} aria-label="ปิด"><X size={20} strokeWidth={2.5} /></button>
                <div className="gp-modal__photo">
                  {src ? <img src={src} alt={modalMember.name || ""} /> : <span>{(modalMember.name || "?").slice(0, 1)}</span>}
                </div>
                <div className="gp-modal__info">
                  <span className="gp-modal__eyebrow">★ <span className="gm-thai">ผู้สมัคร</span> · CANDIDATE</span>
                  <h3 className="gp-modal__name">{modalMember.name}</h3>
                  <dl className="gp-modal__rows">
                    <div><dt><span className="gm-thai">รหัสนักศึกษา</span></dt><dd>{modalMember.studentId || "—"}</dd></div>
                    <div><dt><span className="gm-thai">ตำแหน่ง</span></dt><dd>{modalMember.position || "—"}</dd></div>
                    <div><dt><span className="gm-thai">สาขาวิชา</span></dt><dd>{modalMember.major || "—"}</dd></div>
                  </dl>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* GALLERY LIGHTBOX */}
      <AnimatePresence>
        {lightbox >= 0 && gallery[lightbox] && (
          <motion.div className="gp-lb" onClick={closeLightbox}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
            <button type="button" className="gp-lb__x" onClick={closeLightbox} aria-label="ปิด"><X size={22} strokeWidth={2.5} /></button>
            {gallery.length > 1 && (
              <button type="button" className="gp-lb__nav gp-lb__nav--prev" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="ก่อนหน้า"><ChevronLeft size={26} strokeWidth={2.5} /></button>
            )}
            <img src={gallery[lightbox]} alt="" className="gp-lb__img" onClick={(e) => e.stopPropagation()} />
            {gallery.length > 1 && (
              <button type="button" className="gp-lb__nav gp-lb__nav--next" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="ถัดไป"><ChevronRight size={26} strokeWidth={2.5} /></button>
            )}
            <span className="gp-lb__count">{lightbox + 1} / {gallery.length}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .gp-root{
          --ink:#26271c; --ink2:#5c5a4b; --cream:#FFF6EC; --cream2:#FFE9D6; --paper:#FFFDFA;
          --pink:#FF9CE9; --lime:#C2F47E; --yellow:#FFD24D; --sky:#B6E6FF; --coral:#FF8A8A;
          --pop:var(--sky, #B6E6FF); --pop-deep:#147ac8; --pop-ink:#0e4f80;
          --bw:2.5px; --sh:5px 5px 0 var(--ink); --sh-sm:3px 3px 0 var(--ink); --sh-lg:8px 8px 0 var(--ink);
          --fd:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --fm:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace;
          --fb:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif;
          min-height:100vh; display:flex; flex-direction:column; color:var(--ink);
          font-family:var(--fb); container-type:inline-size; container-name:gp;
          background:linear-gradient(135deg, var(--gw1, #FFE6F2) 0%, var(--gw2, #FFF7EE) 46%, var(--gw3, #EEF7DB) 100%) fixed;
        }
        .gp-root *{ box-sizing:border-box; } .gp-root a{ text-decoration:none; color:inherit; } .gp-root img{ display:block; max-width:100%; }
        /* Thai runs inside mono (--fm/Space Grotesk) kickers/labels — that stack has
           no Thai glyphs so Thai text falls back to a mismatched system font
           (misaligned vowel/tone marks). Pin Thai runs to the family's real Thai
           body font instead. */
        .gm-thai{ font-family:var(--fb) !important; letter-spacing:.04em; white-space:nowrap; }


        .gp-page{ flex:1; width:100%; max-width:1040px; margin:0 auto; padding:32px 28px 56px; }
        .gp-eyebrow{ display:flex; gap:12px; align-items:center; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; }
        .gp-back{ display:inline-flex; align-items:center; gap:7px; padding:8px 16px; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:999px; font-weight:700; font-size:13px; box-shadow:var(--sh-sm); transition:transform .12s ease-out, box-shadow .12s ease-out; }
        .gp-back:hover{ transform:translate(-2px,-2px); box-shadow:var(--sh); }
        .gp-sticker{ display:inline-flex; align-items:center; gap:8px; padding:6px 15px; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:999px; font-weight:700; font-size:13px; box-shadow:var(--sh-sm); }
        .gp-sticker--pop{ background:var(--pop); color:var(--pop-text,var(--ink)); } .gp-sticker--lime{ background:var(--lime); } .gp-sticker--ink{ background:var(--ink); color:var(--cream); }

        /* HERO */
        .gp-hero{ background:var(--paper); border:var(--bw) solid var(--ink); border-radius:28px; box-shadow:var(--sh-lg); overflow:hidden; margin-bottom:28px; }
        .gp-hero__media{ position:relative; height:clamp(220px,40cqw,400px); display:grid; place-items:center; border-bottom:var(--bw) solid var(--ink); overflow:hidden;
          background-image:repeating-linear-gradient(45deg,transparent 0 16px,rgba(0,0,0,.04) 16px 18px),linear-gradient(135deg,var(--pop),var(--cream2)); }
        .gp-hero__media img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:top; }
        .gp-hero__ph{ position:relative; z-index:1; background:var(--paper); border:2px solid var(--ink); padding:12px 18px; border-radius:999px; font-family:var(--fm); font-weight:600; font-size:13px; }
        .gp-hero__gallery{ position:absolute; bottom:14px; right:14px; z-index:2; display:inline-flex; align-items:center; gap:7px; padding:9px 15px; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:999px; font-family:var(--fb); font-weight:800; font-size:13px; box-shadow:var(--sh-sm); cursor:pointer; transition:transform .12s ease-out, box-shadow .12s ease-out; }
        .gp-hero__gallery:hover{ transform:translate(-2px,-2px); box-shadow:var(--sh); }
        .gp-hero__body{ padding:28px 32px; display:flex; gap:24px; align-items:center; flex-wrap:wrap; }
        /* flex, not grid: a percentage max-height on a GRID item does not resolve here
           (Chrome leaves the item at its aspect-ratio height), which is why the
           portrait logo stayed 132px tall inside the 106px box. Flex centring resolves
           it, so the mark scales to fit whatever shape it is. */
        .gp-hero__logo{ width:110px; height:110px; border-radius:24px; border:var(--bw) solid var(--ink); background:var(--cream); flex-shrink:0; display:flex; align-items:center; justify-content:center; padding:6px; box-shadow:var(--sh); overflow:hidden; }
        /* max-* rather than width/height:100% — a portrait logo (the real records are
           3375x4219) was being sized 106px wide by its own aspect ratio, i.e. 132px
           tall inside a 106px box, and the bottom of the artwork was cut off by the
           box's overflow:hidden. Constraining instead of forcing keeps the whole mark
           visible whatever shape the admin uploads. */
        .gp-hero__logo img{ width:auto; height:auto; max-width:100%; max-height:100%; object-fit:contain; } .gp-hero__logo span{ font-family:var(--fd); font-size:34px; }
        .gp-hero__txt{ min-width:0; flex:1; }
        .gp-hero__title{ font-family:var(--fd); font-size:clamp(30px,5cqw,52px); margin:0; letter-spacing:-.02em; line-height:1.02; text-transform:uppercase; text-wrap:balance; }
        .gp-hero__slogan{ font-style:italic; color:var(--ink2); margin:8px 0 0; font-size:clamp(14px,1.8cqw,17px); }
        .gp-hero__no{ margin-left:auto; font-family:var(--fd); font-size:clamp(48px,8cqw,84px); line-height:1; background:var(--pop); border:var(--bw) solid var(--ink); border-radius:22px; padding:10px 24px; box-shadow:var(--sh); }

        /* SECTION cards */
        .gp-section{ display:grid; grid-template-columns:1fr; gap:22px; margin-bottom:24px; align-items:start; }
        .gp-section[data-cols="2"]{ grid-template-columns:1.4fr 1fr; }
        .gp-card{ background:var(--paper); border:var(--bw) solid var(--ink); border-radius:22px; padding:24px 26px; box-shadow:var(--sh); }
        .gp-card--ink{ background:var(--ink); color:var(--cream); }
        .gp-card--cream{ background:var(--cream2); }
        .gp-block{ margin-bottom:24px; }
        .gp-card__h{ font-family:var(--fd); font-size:22px; margin:12px 0 12px; letter-spacing:-.01em; text-transform:uppercase; }
        .gp-card__p{ font-size:15px; line-height:1.65; color:var(--ink2); margin:0; }
        /* StoryClamp — long story folds behind a paper fade */
        .gp-sc{ --sc-max:8.2em; --sc-fade:var(--paper); }
        .gp-sc .sc__hint{ color:var(--ink2); font-family:var(--fm, inherit); text-transform:uppercase; }
        .gp-story{ max-height:190px; overflow-y:auto; margin-top:2px; padding-right:10px;
          -webkit-mask-image:linear-gradient(180deg,#000 80%,transparent); mask-image:linear-gradient(180deg,#000 80%,transparent); }
        .gp-story::-webkit-scrollbar{ width:8px; } .gp-story::-webkit-scrollbar-thumb{ background:var(--ink); border-radius:999px; } .gp-story::-webkit-scrollbar-track{ background:transparent; }
        .gp-story__hint{ display:block; margin-top:10px; font-family:var(--fm); font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink2); }
        .gp-mlist{ margin-top:14px; display:flex; flex-direction:column; }
        .gp-m{ display:flex; gap:14px; align-items:flex-start; padding:13px 0; border-top:1.5px solid rgba(255,241,229,.16); }
        .gp-m:first-child{ border-top:0; padding-top:4px; }
        .gp-m__no{ flex-shrink:0; width:30px; height:30px; border-radius:999px; background:var(--pop); color:var(--ink); font-family:var(--fd); font-size:13px; display:grid; place-items:center; box-shadow:2px 2px 0 rgba(0,0,0,.45); }
        .gp-m__tx{ margin:0; font-size:14.5px; line-height:1.55; padding-top:3px; }

        .gp-policies{ display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-top:18px; }
        .gp-policy{ position:relative; background:var(--cream); border:var(--bw) solid var(--ink); border-radius:18px; padding:18px; box-shadow:var(--sh-sm); }
        .gp-policy__no{ position:absolute; top:-14px; left:14px; background:var(--pop-deep); color:#fff; font-family:var(--fd); font-size:14px; padding:4px 12px; border-radius:999px; letter-spacing:.1em; border:2px solid var(--ink); }
        .gp-policy__t{ font-size:15px; line-height:1.45; margin:8px 0 0; font-weight:800; }
        .gp-policy__d{ font-size:13px; line-height:1.55; margin:6px 0 0; color:var(--ink2); }

        .gp-members__head{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .gp-members__count{ font-family:var(--fm); font-size:13px; color:var(--ink2); }
        .gp-members{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-top:18px; }
        /* member tiles = <MemberTile> composites (own scoped styles) */

        /* FOOTER */
        .gp-footer{ margin-top:auto; border-top:var(--bw) solid var(--ink); padding:22px 32px; background:var(--ink); color:var(--cream);
          display:flex; align-items:center; justify-content:center; gap:14px; font-family:var(--fd); font-size:15px; text-transform:uppercase; letter-spacing:.04em; text-align:center; flex-wrap:wrap; }
        .gp-star{ color:var(--pop); font-size:18px; }

        /* BACK-TO-VOTE BAR */
        .gp-votebar{ position:fixed; bottom:0; left:0; right:0; z-index:45; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 28px; background:var(--ink); color:var(--cream); border-top:var(--bw) solid var(--ink); }
        .gp-votebar__lbl{ font-family:var(--fm); font-size:13px; letter-spacing:.04em; }
        .gp-votebar__btn{ display:inline-flex; align-items:center; gap:8px; padding:12px 22px; border:var(--bw) solid var(--ink); border-radius:14px; background:var(--lime); color:var(--ink); font-family:var(--fb); font-weight:800; font-size:15px; box-shadow:5px 5px 0 rgba(255,241,229,.35); white-space:nowrap; transition:transform .12s ease-out; }
        .gp-votebar__btn:hover{ transform:translate(-2px,-2px); }

        /* MEMBER PROFILE MODAL */
        .gp-modal{ position:fixed; inset:0; z-index:9500; display:grid; place-items:center; padding:20px; background:color-mix(in srgb, var(--ink) 62%, transparent); backdrop-filter:blur(4px); }
        .gp-modal__card{ position:relative; width:100%; max-width:860px; max-height:92vh; overflow:hidden; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:26px; box-shadow:10px 10px 0 var(--ink); display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,1fr); }
        .gp-modal__x{ position:absolute; top:14px; right:14px; z-index:3; width:40px; height:40px; border-radius:999px; background:var(--paper); border:var(--bw) solid var(--ink); display:grid; place-items:center; cursor:pointer; box-shadow:var(--sh-sm); }
        .gp-modal__x:hover{ background:var(--coral); }
        .gp-modal__photo{ position:relative; background:var(--cream2); border-right:var(--bw) solid var(--ink); min-height:460px; display:grid; place-items:center; overflow:hidden; background-image:repeating-linear-gradient(45deg,transparent 0 14px,rgba(0,0,0,.04) 14px 16px); }
        .gp-modal__photo img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center 16%; }
        .gp-modal__photo span{ font-family:var(--fd); font-size:72px; }
        .gp-modal__info{ position:relative; padding:36px 34px 40px; display:flex; flex-direction:column; justify-content:center; min-width:0; }
        .gp-modal__eyebrow{ font-family:var(--fm); font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:var(--ink2); }
        .gp-modal__name{ font-family:var(--fd); font-size:clamp(28px,4cqw,40px); line-height:1.05; margin:10px 0 22px; text-transform:uppercase; letter-spacing:-.01em; text-wrap:balance; }
        .gp-modal__rows{ margin:0; display:flex; flex-direction:column; gap:16px; }
        .gp-modal__rows dt{ font-family:var(--fm); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink2); margin-bottom:3px; }
        .gp-modal__rows dd{ margin:0; font-size:18px; font-weight:700; word-break:break-word; }

        /* GALLERY LIGHTBOX */
        .gp-lb{ position:fixed; inset:0; z-index:9600; display:grid; place-items:center; padding:28px; background:color-mix(in srgb, var(--ink) 82%, transparent); backdrop-filter:blur(4px); }
        .gp-lb__img{ max-width:min(92vw,1100px); max-height:84vh; object-fit:contain; border:var(--bw) solid var(--ink); border-radius:16px; box-shadow:10px 10px 0 rgba(0,0,0,.5); background:var(--paper); }
        .gp-lb__x{ position:absolute; top:18px; right:18px; width:44px; height:44px; border-radius:999px; background:var(--paper); border:var(--bw) solid var(--ink); display:grid; place-items:center; cursor:pointer; box-shadow:var(--sh-sm); }
        .gp-lb__nav{ position:absolute; top:50%; transform:translateY(-50%); width:48px; height:48px; border-radius:999px; background:var(--paper); border:var(--bw) solid var(--ink); display:grid; place-items:center; cursor:pointer; box-shadow:var(--sh-sm); }
        .gp-lb__nav--prev{ left:18px; } .gp-lb__nav--next{ right:18px; }
        .gp-lb__nav:hover,.gp-lb__x:hover{ background:var(--pop); }
        .gp-lb__count{ position:absolute; bottom:20px; left:50%; transform:translateX(-50%); font-family:var(--fm); font-size:13px; color:var(--cream); background:var(--ink); border:2px solid var(--cream); padding:5px 14px; border-radius:999px; }

        /* RESPONSIVE */
        @container gp (max-width:880px){
          .gp-section[data-cols="2"]{ grid-template-columns:1fr; }
          .gp-policies{ grid-template-columns:1fr; } .gp-members{ grid-template-columns:repeat(3,1fr); }
        }
        @container gp (max-width:640px){
          .gp-hero__media{ height:clamp(160px,46cqw,230px); }
          .gp-hero__body{ flex-direction:column; align-items:flex-start; gap:14px; padding:22px; }
          .gp-hero__no{ order:-1; align-self:flex-end; margin:0; font-size:clamp(40px,12cqw,56px); padding:6px 18px; }
          .gp-hero__logo{ width:84px; height:84px; }
          .gp-hero__title{ font-size:clamp(24px,7cqw,40px); line-height:1.06; }
        }
        @media (max-width:640px){
          .gp-modal{ padding:14px; }
          .gp-modal__card{ grid-template-columns:1fr; max-height:90vh; overflow-y:auto; }
          .gp-modal__photo{ border-right:0; border-bottom:var(--bw) solid var(--ink); min-height:0; aspect-ratio:auto; height:clamp(280px,72vw,360px); }
          .gp-modal__photo img{ object-position:center 14%; }
          .gp-modal__info{ padding:24px 22px 28px; }
          .gp-modal__name{ font-size:26px; }
          .gp-lb__nav{ width:40px; height:40px; } .gp-lb__nav--prev{ left:10px; } .gp-lb__nav--next{ right:10px; }
        }
        @container gp (max-width:520px){
          .gp-page{ padding:24px 14px; } .gp-members{ grid-template-columns:repeat(2,1fr); }
          .gp-votebar{ flex-direction:column; align-items:stretch; gap:10px; padding:12px 16px; text-align:center; } .gp-votebar__btn{ justify-content:center; }
        }
      `}</style>
    </div>
  );
}
