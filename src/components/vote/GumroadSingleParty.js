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
import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Check, X, Ban, ArrowRight } from "lucide-react";
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

  const missions = useMemo(() => (party?.missions || []).map(asText).filter(Boolean), [party?.missions]);
  const policies = useMemo(() => (party?.policies || []).map(asText).filter(Boolean), [party?.policies]);
  const members = useMemo(() => sortMembersByPosition(party?.members || []), [party?.members]);
  const story = (party?.logoMeaning || "").trim(); // optional — not every year has one

  const heroImg = resolveSrc(firstImage(party?.officialImageUrl) || firstImage(party?.groupImageUrls) || firstImage(party?.mobileHeroImage));
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
                <p className="gsp-card__p">{story}</p>
              </article>
            ) : null}
            {missions.length > 0 && (
              <article className="gsp-card gsp-card--ink">
                <span className="gsp-sticker gsp-sticker--pink">🚩 พันธกิจ</span>
                <ol className="gsp-missions">{missions.map((m, i) => <li key={i}>{m}</li>)}</ol>
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
                  <div className="gsp-tile" key={m?.id ?? i}>
                    <div className="gsp-tile__photo">
                      {ph ? <img src={ph} alt={m?.name || ""} /> : <span>#{String(i + 1).padStart(2, "0")}</span>}
                    </div>
                    <div className="gsp-tile__name">{m?.name}</div>
                    {m?.position ? <div className="gsp-tile__role">{m.position}</div> : null}
                  </div>
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
          onClick={() => !editorMode && onConfirm()}>
          <Check size={20} strokeWidth={3} /> {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการลงคะแนน"}
        </button>
      </div>

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
        .gsp-section{ display:grid; grid-template-columns:1fr; gap:22px; margin-bottom:24px; }
        .gsp-section[data-cols="2"]{ grid-template-columns:1.4fr 1fr; }
        .gsp-card{ background:var(--paper); border:var(--bw) solid var(--ink); border-radius:22px; padding:24px 26px; box-shadow:var(--sh); }
        .gsp-card--ink{ background:var(--ink); color:var(--cream); }
        .gsp-card--cream{ background:var(--cream2); }
        .gsp-block{ margin-bottom:24px; }
        .gsp-card__h{ font-family:var(--fd); font-size:22px; margin:12px 0 12px; letter-spacing:-.01em; text-transform:uppercase; }
        .gsp-card__p{ font-size:15px; line-height:1.65; color:var(--ink2); margin:0; }
        .gsp-missions{ padding-left:22px; margin:14px 0 0; font-size:15px; line-height:1.7; }
        .gsp-missions li{ margin-bottom:6px; }

        .gsp-policies{ display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-top:18px; }
        .gsp-policy{ position:relative; background:var(--cream); border:var(--bw) solid var(--ink); border-radius:18px; padding:18px; box-shadow:var(--sh-sm); }
        .gsp-policy__no{ position:absolute; top:-14px; left:14px; background:var(--ink); color:var(--cream); font-family:var(--fd); font-size:14px; padding:4px 12px; border-radius:999px; letter-spacing:.1em; }
        .gsp-policy p{ font-size:14px; line-height:1.5; margin:4px 0 0; }

        .gsp-members__head{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .gsp-members__count{ font-family:var(--fm); font-size:13px; color:var(--ink2); }
        .gsp-members{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-top:18px; }
        .gsp-tile{ background:var(--paper); border:var(--bw) solid var(--ink); border-radius:18px; box-shadow:var(--sh-sm); overflow:hidden; text-align:center; transition:transform .15s ease-out, box-shadow .15s ease-out; }
        .gsp-tile:hover{ transform:translate(-2px,-2px); box-shadow:var(--sh); }
        .gsp-tile__photo{ aspect-ratio:1; background:var(--cream2); display:grid; place-items:center; border-bottom:2px solid var(--ink); overflow:hidden;
          background-image:repeating-linear-gradient(45deg,transparent 0 12px,rgba(0,0,0,.04) 12px 14px); }
        .gsp-tile__photo img{ width:100%; height:100%; object-fit:cover; }
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

        /* RESPONSIVE */
        @container gsp (max-width:880px){
          .gsp-nav{ display:none; } .gsp-topbar{ padding:12px 18px; } .gsp-word,.gsp-div{ display:none; }
          .gsp-section[data-cols="2"]{ grid-template-columns:1fr; }
          .gsp-policies{ grid-template-columns:1fr; } .gsp-members{ grid-template-columns:repeat(3,1fr); }
          .gsp-choices{ grid-template-columns:1fr; }
          .gsp-hero__no{ margin-left:0; }
        }
        @container gsp (max-width:520px){
          .gsp-page{ padding:24px 14px; } .gsp-members{ grid-template-columns:repeat(2,1fr); }
          .gsp-hero__body{ padding:22px; } .gsp-footer{ flex-direction:column; align-items:stretch; gap:10px; padding:12px 16px; } .gsp-confirm{ justify-content:center; }
        }
      `}</style>
    </div>
  );
}
