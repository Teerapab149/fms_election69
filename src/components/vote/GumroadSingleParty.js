"use client";

// GumroadSingleParty — the "Active Pulse" SINGLE-PARTY VOTE view.
//
// Used when exactly one party runs. Unlike multi-party (a grid of choices), this
// is a full PARTY PRESENTATION (ported from docs/design-refs index.html #05
// "Party Detail", gumroad theme): cinematic intro → hero (group photo, logo, name,
// number) → optional story (logoMeaning) → missions → policies → committee members
// (system-ordered by position) → a 3-CHOICE vote (รับรอง / ไม่รับรอง / งดออกเสียง).
//
// Multi-party stays a 2-choice grid (pick a party / abstain) in GumroadVote.
// No back button — the topbar/navbar covers navigation.

import { getPath } from "../../utils/basePath";
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Check, X, Ban } from "lucide-react";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { sortMembersByPosition } from "../../utils/memberSort";
import GumroadPartyIntro from "./GumroadPartyIntro";

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

export default function GumroadSingleParty({
  party = {},
  specialOptions = {},
  selectedPartyId = null,
  onSelect = () => {},
  onConfirm = () => {},
  isSubmitting = false,
  user = null,
  editorMode = false,
}) {
  const globalConfig = useGlobalConfig();
  const [introDone, setIntroDone] = useState(editorMode); // editor skips the intro
  const [modalMember, setModalMember] = useState(null);   // click a member → profile modal
  const [confirmOpen, setConfirmOpen] = useState(false);  // double-check before submitting the vote

  const missions = useMemo(() => (party?.missions || []).map(asText).filter(Boolean), [party?.missions]);
  const policies = useMemo(() => (party?.policies || []).map(asText).filter(Boolean), [party?.policies]);
  const members = useMemo(() => sortMembersByPosition(party?.members || []), [party?.members]);
  const story = (party?.logoMeaning || "").trim(); // optional — not every year has one

  // Hero wants a LANDSCAPE banner — groupImageUrls is the wide team photo;
  // officialImageUrl is usually a portrait poster (would crop badly here).
  const heroImg = resolveSrc(firstImage(party?.groupImageUrls) || firstImage(party?.officialImageUrl) || firstImage(party?.mobileHeroImage));
  const logoImg = resolveSrc(party?.logoUrl);

  const disapproveId = specialOptions?.disapprove?.id;
  const abstainId = specialOptions?.abstain?.id;
  const kind =
    selectedPartyId == null ? null :
    selectedPartyId === party?.id ? "approve" :
    selectedPartyId === disapproveId ? "disapprove" :
    selectedPartyId === abstainId ? "abstain" : null;
  const selectionLabel =
    kind === "approve" ? `รับรอง · ${party?.name || ""}` :
    kind === "disapprove" ? "ไม่รับรอง" :
    kind === "abstain" ? "งดออกเสียง" : null;

  const pick = (id) => () => { if (!editorMode && id != null) onSelect(id); };
  const greeting = user?.name ? `สวัสดีคุณ ${user.name}` : "";

  return (
    <div className="fms-app gsp-root">
      <AnimatePresence>
        {!introDone && <GumroadPartyIntro key="intro" party={party} onDone={() => setIntroDone(true)} />}
      </AnimatePresence>

      {/* TOPBAR (navbar handles navigation — no back button) */}
      <header className="gsp-topbar">
        <a href={getPath("/")} className="gsp-brand">
          <Image src={getPath("/images/logo/fms_logo50_color.png")} alt="FMS 50th" width={480} height={480} className="gsp-badge" />
          <span className="gsp-div" />
          <Image src={getPath("/images/logo/FMS_Standard_Logo_PNG.png")} alt="FMS PSU" width={1200} height={384} className="gsp-word" />
        </a>
        <nav className="gsp-nav">
          <a href={getPath("/")} className="gsp-navlink">หน้าแรก</a>
          <a href={getPath("/candidates")} className="gsp-navlink">Meet Candidates</a>
          <a href={getPath("/results")} className="gsp-navlink">ผลการลงคะแนนเสียง</a>
        </nav>
      </header>

      <main className="gsp-page">
        {/* eyebrow */}
        <div className="gsp-eyebrow">
          <span className="gsp-sticker gsp-sticker--lime">★ OFFICIAL PARTY</span>
          <span className="gsp-sticker gsp-sticker--rotate"><span className="gsp-dot" /> พรรคเดียวที่ลงสมัคร</span>
        </div>

        {/* HERO */}
        <section className="gsp-hero" data-element="vote-party-card">
          <div className="gsp-hero__media">
            {heroImg ? <img src={heroImg} alt={party?.name || "party"} /> :
              <span className="gsp-hero__ph">★ TEAM · {members.length} MEMBERS ★</span>}
          </div>
          <div className="gsp-hero__body">
            <div className="gsp-hero__logo">
              {logoImg ? <img src={logoImg} alt="logo" /> : <span>{(party?.name || "P").slice(0, 2).toUpperCase()}</span>}
            </div>
            <div className="gsp-hero__txt">
              <h1 className="gsp-hero__title" data-element="vote-header-title">{party?.name}</h1>
              {party?.slogan ? <p className="gsp-hero__slogan">&ldquo;{party.slogan}&rdquo;</p> : null}
            </div>
            {party?.number != null && <div className="gsp-hero__no">{party.number}</div>}
          </div>
        </section>

        {/* STORY (optional) + MISSIONS */}
        {(story || missions.length > 0) && (
          <section className="gsp-section" data-cols={story && missions.length ? "2" : "1"}>
            {story ? (
              <article className="gsp-card">
                <span className="gsp-sticker gsp-sticker--pink">💡 เรื่องราวของพรรค</span>
                <h2 className="gsp-card__h">แนวคิด & ที่มา</h2>
                <div className="gsp-story">
                  <p className="gsp-card__p">{story}</p>
                </div>
                <span className="gsp-story__hint">เลื่อนเพื่ออ่านต่อ ↓</span>
              </article>
            ) : null}
            {missions.length > 0 && (
              <article className="gsp-card gsp-card--ink">
                <span className="gsp-sticker gsp-sticker--pink">🚩 พันธกิจ</span>
                <h2 className="gsp-card__h">เป้าหมายของเรา</h2>
                <div className="gsp-mlist">
                  {missions.map((m, i) => (
                    <div className="gsp-m" key={i}>
                      <span className="gsp-m__no">{String(i + 1).padStart(2, "0")}</span>
                      <p className="gsp-m__tx">{m}</p>
                    </div>
                  ))}
                </div>
              </article>
            )}
          </section>
        )}

        {/* POLICIES */}
        {policies.length > 0 && (
          <section className="gsp-card gsp-block">
            <span className="gsp-sticker gsp-sticker--lime">📋 นโยบายของพรรค</span>
            <div className="gsp-policies">
              {policies.map((p, i) => (
                <div className="gsp-policy" key={i}>
                  <span className="gsp-policy__no">{String(i + 1).padStart(2, "0")}</span>
                  <p>{p}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MEMBERS */}
        {members.length > 0 && (
          <section className="gsp-card gsp-card--cream gsp-block">
            <div className="gsp-members__head">
              <span className="gsp-sticker gsp-sticker--ink">★ ทีมผู้สมัคร</span>
              <span className="gsp-members__count">{members.length} CANDIDATES</span>
            </div>
            <div className="gsp-members">
              {members.map((m, i) => {
                const ph = resolveSrc(m?.imageUrl);
                return (
                  <button type="button" className="gsp-tile" key={m?.id ?? i} onClick={() => setModalMember(m)}>
                    <div className="gsp-tile__photo">
                      {ph ? <img src={ph} alt={m?.name || ""} /> : <span>#{String(i + 1).padStart(2, "0")}</span>}
                    </div>
                    <div className="gsp-tile__name">{m?.name}</div>
                    {m?.position ? <div className="gsp-tile__role">{m.position}</div> : null}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* VOTE — 3 choices */}
        <section className="gsp-vote">
          <div className="gsp-vote__head">
            <span className="gsp-sticker gsp-sticker--lime">★ ตัดสินใจของคุณ</span>
            <h2 className="gsp-card__h">{greeting ? `${greeting} · ` : ""}ลงคะแนนเสียง</h2>
          </div>
          <div className="gsp-choices">
            <button type="button" data-element="vote-approve-button"
              className={`gsp-choice gsp-choice--approve ${kind === "approve" ? "is-on" : ""}`} onClick={pick(party?.id)}>
              <span className="gsp-choice__ic"><Check size={24} strokeWidth={3} /></span>
              <span className="gsp-choice__lb">รับรอง</span>
              <span className="gsp-choice__sub">เห็นชอบให้ {party?.name} ดำรงตำแหน่ง</span>
            </button>
            <button type="button" data-element="vote-disapprove-button"
              className={`gsp-choice gsp-choice--no ${kind === "disapprove" ? "is-on" : ""}`} onClick={pick(disapproveId)}>
              <span className="gsp-choice__ic"><X size={24} strokeWidth={3} /></span>
              <span className="gsp-choice__lb">ไม่รับรอง</span>
              <span className="gsp-choice__sub">ไม่เห็นชอบให้พรรคนี้ดำรงตำแหน่ง</span>
            </button>
            <button type="button" data-element="vote-abstain-button"
              className={`gsp-choice gsp-choice--abstain ${kind === "abstain" ? "is-on" : ""}`} onClick={pick(abstainId)}>
              <span className="gsp-choice__ic"><Ban size={24} strokeWidth={2.5} /></span>
              <span className="gsp-choice__lb">งดออกเสียง</span>
              <span className="gsp-choice__sub">ไม่ประสงค์ลงคะแนนในครั้งนี้</span>
            </button>
          </div>
        </section>
      </main>

      {/* STICKY FOOTER */}
      <div className="gsp-footer">
        <div className="gsp-footer__info">
          <div className="gsp-footer__lbl">YOUR SELECTION</div>
          <div className="gsp-footer__sel">{selectionLabel || "ยังไม่ได้เลือก · No selection yet"}</div>
        </div>
        <button type="button" className="gsp-confirm" disabled={kind == null || isSubmitting || editorMode}
          onClick={() => !editorMode && kind != null && setConfirmOpen(true)}>
          <Check size={20} strokeWidth={3} /> {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการลงคะแนน"}
        </button>
      </div>

      {/* MEMBER PROFILE MODAL */}
      <AnimatePresence>
        {modalMember && (() => {
          const src = resolveSrc(modalMember.modalImageUrl || modalMember.imageUrl);
          return (
            <motion.div className="gsp-modal" onClick={() => setModalMember(null)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <motion.div className="gsp-modal__card" onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}>
                <button type="button" className="gsp-modal__x" onClick={() => setModalMember(null)} aria-label="ปิด"><X size={20} strokeWidth={2.5} /></button>
                <div className="gsp-modal__photo">
                  {src ? <img src={src} alt={modalMember.name || ""} /> : <span>{(modalMember.name || "?").slice(0, 1)}</span>}
                </div>
                <div className="gsp-modal__info">
                  <span className="gsp-modal__eyebrow">★ ผู้สมัคร · CANDIDATE</span>
                  <h3 className="gsp-modal__name">{modalMember.name}</h3>
                  <dl className="gsp-modal__rows">
                    <div><dt>รหัสนักศึกษา</dt><dd>{modalMember.studentId || "—"}</dd></div>
                    <div><dt>ตำแหน่ง</dt><dd>{modalMember.position || "—"}</dd></div>
                    <div><dt>สาขาวิชา</dt><dd>{modalMember.major || "—"}</dd></div>
                  </dl>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* CONFIRM VOTE — double-check (selection can't be changed after) */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div className="gsp-confirm-modal" onClick={() => !isSubmitting && setConfirmOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <motion.div className="gsp-cm__card" onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
              <div className="gsp-cm__icon">!</div>
              <h3 className="gsp-cm__title">ยืนยันการลงคะแนน?</h3>
              <p className="gsp-cm__sub">เลือกแล้ว <strong>เปลี่ยนไม่ได้</strong> — ตรวจสอบให้แน่ใจก่อนนะ</p>
              <div className="gsp-cm__pick">
                <span className="gsp-cm__pick-lbl">ตัวเลือกของคุณ</span>
                <span className="gsp-cm__pick-val">{selectionLabel || "—"}</span>
              </div>
              <div className="gsp-cm__actions">
                <button type="button" className="gsp-cm__cancel" onClick={() => setConfirmOpen(false)} disabled={isSubmitting}>ยกเลิก</button>
                <button type="button" className="gsp-cm__go" onClick={() => onConfirm()} disabled={isSubmitting}>
                  <Check size={18} strokeWidth={3} /> {isSubmitting ? "กำลังบันทึก..." : "ยืนยัน, ลงคะแนนเลย"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .gsp-root{
          --ink:#1A1A1A; --ink2:#4A4A4A; --cream:#FFF1E5; --cream2:#FFE4CE; --paper:#FFF;
          --pink:#FF90E8; --lime:#B6FF6E; --yellow:#FFC900; --sky:#A8E1FF; --coral:#FF6E6E;
          --bw:2.5px; --sh:5px 5px 0 var(--ink); --sh-sm:3px 3px 0 var(--ink); --sh-lg:8px 8px 0 var(--ink);
          --fd:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --fm:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace;
          --fb:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif;
          min-height:100vh; display:flex; flex-direction:column; color:var(--ink); background:var(--cream);
          font-family:var(--fb); container-type:inline-size; container-name:gsp; padding-bottom:96px;
          background-image:radial-gradient(circle at 10% 8%, #FFD1F2 0,transparent 34%),radial-gradient(circle at 92% 96%, #DCF2FF 0,transparent 38%);
          background-attachment:fixed;
        }
        .gsp-root *{ box-sizing:border-box; } .gsp-root a{ text-decoration:none; color:inherit; } .gsp-root img{ display:block; max-width:100%; }

        .gsp-topbar{ position:sticky; top:0; z-index:40; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 32px; background:var(--cream); border-bottom:var(--bw) solid var(--ink); }
        .gsp-brand{ display:flex; align-items:center; gap:14px; } .gsp-badge{ width:auto; height:46px; object-fit:contain; } .gsp-div{ width:2px; height:34px; background:var(--ink); } .gsp-word{ width:auto; height:32px; object-fit:contain; }
        .gsp-nav{ display:flex; gap:4px; } .gsp-navlink{ padding:8px 16px; border-radius:999px; font-weight:600; font-size:14px; border:2px solid transparent; } .gsp-navlink:hover{ background:var(--paper); border-color:var(--ink); }

        .gsp-page{ flex:1; width:100%; max-width:1040px; margin:0 auto; padding:32px 28px 40px; }
        .gsp-eyebrow{ display:flex; gap:10px; margin-bottom:22px; flex-wrap:wrap; }
        .gsp-sticker{ display:inline-flex; align-items:center; gap:8px; padding:6px 15px; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:999px; font-weight:700; font-size:13px; box-shadow:var(--sh-sm); }
        .gsp-sticker--lime{ background:var(--lime); } .gsp-sticker--pink{ background:var(--pink); } .gsp-sticker--ink{ background:var(--ink); color:var(--cream); }
        .gsp-sticker--rotate{ transform:rotate(-3deg); }
        .gsp-dot{ width:9px; height:9px; border-radius:999px; background:var(--coral); box-shadow:0 0 0 0 rgba(255,110,110,.7); animation:gspPulse 1.6s ease-out infinite; }
        @keyframes gspPulse{ 0%{box-shadow:0 0 0 0 rgba(255,110,110,.7)} 70%{box-shadow:0 0 0 12px rgba(255,110,110,0)} 100%{box-shadow:0 0 0 0 rgba(255,110,110,0)} }

        /* HERO */
        .gsp-hero{ background:var(--paper); border:var(--bw) solid var(--ink); border-radius:28px; box-shadow:var(--sh-lg); overflow:hidden; margin-bottom:28px; }
        .gsp-hero__media{ height:clamp(220px,38cqw,360px); display:grid; place-items:center; border-bottom:var(--bw) solid var(--ink); overflow:hidden;
          background-image:repeating-linear-gradient(45deg,transparent 0 16px,rgba(0,0,0,.04) 16px 18px),linear-gradient(135deg,#FFD1F2,#E9D5FF); }
        .gsp-hero__media img{ width:100%; height:100%; object-fit:cover; }
        .gsp-hero__ph{ background:var(--paper); border:2px solid var(--ink); padding:12px 18px; border-radius:999px; font-family:var(--fm); font-weight:600; font-size:13px; }
        .gsp-hero__body{ padding:28px 32px; display:flex; gap:24px; align-items:center; flex-wrap:wrap; }
        .gsp-hero__logo{ width:110px; height:110px; border-radius:24px; border:var(--bw) solid var(--ink); background:var(--cream); flex-shrink:0; display:grid; place-items:center; box-shadow:var(--sh); overflow:hidden; }
        .gsp-hero__logo img{ width:100%; height:100%; object-fit:contain; } .gsp-hero__logo span{ font-family:var(--fd); font-size:34px; }
        .gsp-hero__txt{ min-width:0; flex:1; }
        .gsp-hero__title{ font-family:var(--fd); font-size:clamp(30px,5cqw,52px); margin:0; letter-spacing:-.02em; line-height:1.02; text-transform:uppercase; text-wrap:balance; }
        .gsp-hero__slogan{ font-style:italic; color:var(--ink2); margin:8px 0 0; font-size:clamp(14px,1.8cqw,17px); }
        .gsp-hero__no{ margin-left:auto; font-family:var(--fd); font-size:clamp(48px,8cqw,84px); line-height:1; background:var(--pink); border:var(--bw) solid var(--ink); border-radius:22px; padding:10px 24px; box-shadow:var(--sh); transform:rotate(-3deg); }

        /* SECTION cards */
        .gsp-section{ display:grid; grid-template-columns:1fr; gap:22px; margin-bottom:24px; align-items:start; }
        .gsp-section[data-cols="2"]{ grid-template-columns:1.4fr 1fr; }
        .gsp-card{ background:var(--paper); border:var(--bw) solid var(--ink); border-radius:22px; padding:24px 26px; box-shadow:var(--sh); }
        .gsp-card--ink{ background:var(--ink); color:var(--cream); }
        .gsp-card--cream{ background:var(--cream2); }
        .gsp-block{ margin-bottom:24px; }
        .gsp-card__h{ font-family:var(--fd); font-size:22px; margin:12px 0 12px; letter-spacing:-.01em; text-transform:uppercase; }
        .gsp-card__p{ font-size:15px; line-height:1.65; color:var(--ink2); margin:0; }
        /* story — capped + scrollable so a long write-up never bloats the row */
        .gsp-story{ max-height:190px; overflow-y:auto; margin-top:2px; padding-right:10px;
          -webkit-mask-image:linear-gradient(180deg,#000 80%,transparent); mask-image:linear-gradient(180deg,#000 80%,transparent); }
        .gsp-story::-webkit-scrollbar{ width:8px; } .gsp-story::-webkit-scrollbar-thumb{ background:var(--ink); border-radius:999px; } .gsp-story::-webkit-scrollbar-track{ background:transparent; }
        .gsp-story__hint{ display:block; margin-top:10px; font-family:var(--fm); font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink2); }
        /* missions — numbered, clearly divided */
        .gsp-mlist{ margin-top:14px; display:flex; flex-direction:column; }
        .gsp-m{ display:flex; gap:14px; align-items:flex-start; padding:13px 0; border-top:1.5px solid rgba(255,241,229,.16); }
        .gsp-m:first-child{ border-top:0; padding-top:4px; }
        .gsp-m__no{ flex-shrink:0; width:30px; height:30px; border-radius:999px; background:var(--lime); color:var(--ink); font-family:var(--fd); font-size:13px; display:grid; place-items:center; box-shadow:2px 2px 0 rgba(0,0,0,.45); }
        .gsp-m__tx{ margin:0; font-size:14.5px; line-height:1.55; padding-top:3px; }

        .gsp-policies{ display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-top:18px; }
        .gsp-policy{ position:relative; background:var(--cream); border:var(--bw) solid var(--ink); border-radius:18px; padding:18px; box-shadow:var(--sh-sm); }
        .gsp-policy__no{ position:absolute; top:-14px; left:14px; background:var(--ink); color:var(--cream); font-family:var(--fd); font-size:14px; padding:4px 12px; border-radius:999px; letter-spacing:.1em; }
        .gsp-policy p{ font-size:14px; line-height:1.5; margin:4px 0 0; }

        .gsp-members__head{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .gsp-members__count{ font-family:var(--fm); font-size:13px; color:var(--ink2); }
        .gsp-members{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-top:18px; }
        .gsp-tile{ display:flex; flex-direction:column; width:100%; padding:0; font-family:inherit; color:inherit; cursor:pointer; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:18px; box-shadow:var(--sh-sm); overflow:hidden; text-align:center; transition:transform .15s ease-out, box-shadow .15s ease-out; }
        .gsp-tile:hover{ transform:translate(-2px,-2px); box-shadow:var(--sh); }
        .gsp-tile__photo{ position:relative; aspect-ratio:1; background:var(--cream2); display:grid; place-items:center; border-bottom:2px solid var(--ink); overflow:hidden;
          background-image:repeating-linear-gradient(45deg,transparent 0 12px,rgba(0,0,0,.04) 12px 14px); }
        .gsp-tile__photo img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
        .gsp-tile__photo span{ font-family:var(--fd); font-size:20px; background:var(--paper); padding:4px 10px; border:2px solid var(--ink); border-radius:999px; }
        .gsp-tile__name{ padding:10px 8px 4px; font-weight:700; font-size:13px; line-height:1.25; }
        .gsp-tile__role{ padding:0 8px 12px; font-size:11px; color:var(--ink2); font-family:var(--fm); text-transform:uppercase; letter-spacing:.08em; }

        /* VOTE */
        .gsp-vote{ margin-top:8px; }
        .gsp-vote__head{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
        .gsp-choices{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .gsp-choice{ display:flex; flex-direction:column; align-items:flex-start; gap:8px; text-align:left; padding:22px 22px; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:22px; box-shadow:var(--sh); cursor:pointer; transition:transform .12s ease-out, box-shadow .12s ease-out; font-family:inherit; }
        .gsp-choice:hover{ transform:translate(-3px,-3px); box-shadow:var(--sh-lg); }
        .gsp-choice__ic{ width:48px; height:48px; border-radius:999px; display:grid; place-items:center; border:var(--bw) solid var(--ink); background:var(--cream); }
        .gsp-choice__lb{ font-family:var(--fd); font-size:22px; text-transform:uppercase; letter-spacing:-.01em; }
        .gsp-choice__sub{ font-size:13px; color:var(--ink2); line-height:1.45; }
        .gsp-choice--approve.is-on{ background:var(--lime); transform:rotate(-1deg); } .gsp-choice--approve.is-on .gsp-choice__ic{ background:#fff; }
        .gsp-choice--no.is-on{ background:var(--coral); transform:rotate(1deg); } .gsp-choice--no.is-on .gsp-choice__ic{ background:#fff; }
        .gsp-choice--abstain.is-on{ background:var(--yellow); transform:rotate(-1deg); } .gsp-choice--abstain.is-on .gsp-choice__ic{ background:#fff; }
        .gsp-choice.is-on .gsp-choice__sub{ color:var(--ink); }

        /* FOOTER */
        .gsp-footer{ position:fixed; bottom:0; left:0; right:0; z-index:45; display:flex; align-items:center; justify-content:space-between; gap:20px; padding:16px 28px; background:var(--ink); color:var(--cream); border-top:var(--bw) solid var(--ink); }
        .gsp-footer__lbl{ font-family:var(--fm); font-size:11px; color:var(--lime); text-transform:uppercase; letter-spacing:.15em; }
        .gsp-footer__sel{ font-size:17px; font-weight:700; }
        .gsp-confirm{ display:inline-flex; align-items:center; gap:8px; padding:14px 26px; border:var(--bw) solid var(--ink); border-radius:16px; background:var(--lime); color:var(--ink); font-family:var(--fb); font-weight:800; font-size:16px; box-shadow:5px 5px 0 rgba(255,241,229,.35); cursor:pointer; transition:transform .12s ease-out; white-space:nowrap; }
        .gsp-confirm:not(:disabled):hover{ transform:translate(-2px,-2px); } .gsp-confirm:disabled{ opacity:.45; cursor:not-allowed; }

        /* MEMBER PROFILE MODAL */
        .gsp-modal{ position:fixed; inset:0; z-index:9500; display:grid; place-items:center; padding:20px; background:rgba(26,26,26,.62); backdrop-filter:blur(4px); }
        .gsp-modal__card{ position:relative; width:100%; max-width:860px; max-height:92vh; overflow:hidden; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:26px; box-shadow:10px 10px 0 var(--ink); display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,1fr); }
        .gsp-modal__x{ position:absolute; top:14px; right:14px; z-index:3; width:40px; height:40px; border-radius:999px; background:var(--paper); border:var(--bw) solid var(--ink); display:grid; place-items:center; cursor:pointer; box-shadow:var(--sh-sm); }
        .gsp-modal__x:hover{ background:var(--coral); }
        .gsp-modal__photo{ position:relative; background:var(--cream2); border-right:var(--bw) solid var(--ink); min-height:460px; display:grid; place-items:center; overflow:hidden; background-image:repeating-linear-gradient(45deg,transparent 0 14px,rgba(0,0,0,.04) 14px 16px); }
        .gsp-modal__photo img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center 16%; }
        .gsp-modal__photo span{ font-family:var(--fd); font-size:72px; }
        .gsp-modal__info{ position:relative; padding:36px 34px 40px; display:flex; flex-direction:column; justify-content:center; min-width:0; }
        .gsp-modal__eyebrow{ font-family:var(--fm); font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:var(--ink2); }
        .gsp-modal__name{ font-family:var(--fd); font-size:clamp(28px,4cqw,40px); line-height:1.05; margin:10px 0 22px; text-transform:uppercase; letter-spacing:-.01em; text-wrap:balance; }
        .gsp-modal__rows{ margin:0; display:flex; flex-direction:column; gap:16px; }
        .gsp-modal__rows dt{ font-family:var(--fm); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink2); margin-bottom:3px; }
        .gsp-modal__rows dd{ margin:0; font-size:18px; font-weight:700; word-break:break-word; }

        /* CONFIRM VOTE modal */
        .gsp-confirm-modal{ position:fixed; inset:0; z-index:9600; display:grid; place-items:center; padding:20px; background:rgba(26,26,26,.62); backdrop-filter:blur(4px); }
        .gsp-cm__card{ width:100%; max-width:440px; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:24px; box-shadow:10px 10px 0 var(--ink); padding:30px 28px; text-align:center; }
        .gsp-cm__icon{ width:64px; height:64px; margin:0 auto 16px; display:grid; place-items:center; background:var(--yellow); border:var(--bw) solid var(--ink); border-radius:18px; box-shadow:var(--sh); transform:rotate(-4deg); font-family:var(--fd); font-size:36px; line-height:1; }
        .gsp-cm__title{ font-family:var(--fd); font-size:26px; text-transform:uppercase; margin:0 0 8px; }
        .gsp-cm__sub{ font-size:15px; color:var(--ink2); margin:0 0 18px; line-height:1.5; }
        .gsp-cm__pick{ display:flex; flex-direction:column; gap:3px; background:var(--lime); border:var(--bw) solid var(--ink); border-radius:16px; box-shadow:var(--sh-sm); padding:14px 16px; margin-bottom:22px; }
        .gsp-cm__pick-lbl{ font-family:var(--fm); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink2); }
        .gsp-cm__pick-val{ font-family:var(--fd); font-size:18px; }
        .gsp-cm__actions{ display:flex; gap:12px; }
        .gsp-cm__cancel,.gsp-cm__go{ flex:1; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:15px 18px; border:var(--bw) solid var(--ink); border-radius:14px; font-family:var(--fb); font-weight:800; font-size:15px; cursor:pointer; box-shadow:var(--sh-sm); transition:transform .12s ease-out; }
        .gsp-cm__cancel{ background:var(--paper); color:var(--ink); flex:0 0 38%; }
        .gsp-cm__go{ background:var(--lime); color:var(--ink); }
        .gsp-cm__cancel:not(:disabled):hover,.gsp-cm__go:not(:disabled):hover{ transform:translate(-2px,-2px); box-shadow:var(--sh); }
        .gsp-cm__go:disabled,.gsp-cm__cancel:disabled{ opacity:.5; cursor:not-allowed; }

        /* RESPONSIVE */
        @container gsp (max-width:880px){
          .gsp-nav{ display:none; } .gsp-topbar{ padding:12px 18px; } .gsp-word,.gsp-div{ display:none; }
          .gsp-section[data-cols="2"]{ grid-template-columns:1fr; }
          .gsp-policies{ grid-template-columns:1fr; } .gsp-members{ grid-template-columns:repeat(3,1fr); }
          .gsp-choices{ grid-template-columns:1fr; }
        }
        /* tablet / phone — stack the hero so the long title isn't cramped beside the number */
        @container gsp (max-width:640px){
          .gsp-hero__media{ height:clamp(160px,46cqw,230px); }
          .gsp-hero__body{ flex-direction:column; align-items:flex-start; gap:14px; padding:22px; }
          .gsp-hero__no{ order:-1; align-self:flex-end; margin:0; font-size:clamp(40px,12cqw,56px); padding:6px 18px; }
          .gsp-hero__logo{ width:84px; height:84px; }
          .gsp-hero__title{ font-size:clamp(24px,7cqw,40px); line-height:1.06; }
        }
        /* Modal stacks on phones — use @media (the modal is position:fixed, so a
           viewport query is reliable where container queries can be flaky). DEFINITE
           photo height (not aspect-ratio) so the absolute <img> can't collapse and
           overflow onto the text on iOS Safari. */
        @media (max-width:640px){
          .gsp-modal{ padding:14px; }
          .gsp-modal__card{ grid-template-columns:1fr; max-height:90vh; overflow-y:auto; }
          .gsp-modal__photo{ border-right:0; border-bottom:var(--bw) solid var(--ink); min-height:0; aspect-ratio:auto; height:clamp(280px,72vw,360px); }
          .gsp-modal__photo img{ object-position:center 14%; }
          .gsp-modal__info{ padding:24px 22px 28px; }
          .gsp-modal__name{ font-size:26px; }
        }
        @container gsp (max-width:520px){
          .gsp-page{ padding:24px 14px; } .gsp-members{ grid-template-columns:repeat(2,1fr); }
          .gsp-footer{ flex-direction:column; align-items:stretch; gap:10px; padding:12px 16px; } .gsp-confirm{ justify-content:center; }
        }
      `}</style>
    </div>
  );
}
