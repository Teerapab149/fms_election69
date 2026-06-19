"use client";

// VerdureSingleParty — SINGLE-PARTY VOTE for the Verdure template. Dispatched
// from VerdureVote when one party runs. The full party presentation as one scroll
// (ribbon → Vision / Policies / Team chapters) ending at a 3-choice ballot
// (รับรอง / ไม่รับรอง / งดออกเสียง) + a moss confirm bar + an in-component double-
// check dialog. Mirrors the design's profile + ballot language. Same contract as
// the other SingleParty views (onConfirm IS the submit). All digits Arabic.

import { getPath } from "../../utils/basePath";
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { sortMembersByPosition } from "../../utils/memberSort";
import VerdureShell from "./VerdureShell";
import { VerdureMemberModal, VerdureLightbox } from "./VerdureMemberModal";

// ── unique single-party intro: a moss curtain over the page; the party's wax
// seal stamps in (spring scale + a draw-on dashed ring), the name + slogan
// reveal, then the curtain wipes up to hand the voter into the presentation.
// editorMode skips it. ──
function VerdureBallotIntro({ party, no, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000); // safety: always release the page
    return () => clearTimeout(t);
  }, [onDone]);
  const words = String(party?.name || "").trim().split(/\s+/);
  return (
    <motion.div className="vd-bintro" initial={{ y: 0 }} animate={{ y: "-100%" }}
      transition={{ delay: 2.15, duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
      onClick={onDone} aria-hidden>
      <motion.div className="vd-bintro__inner"
        initial={{ opacity: 1 }} animate={{ opacity: [1, 1, 0] }} transition={{ delay: 1.9, duration: 0.5 }}>
        <motion.div className="vd-bintro__eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
          THE ONLY PARTY · พรรคเดียวที่ลงสมัคร
        </motion.div>
        <motion.div className="vd-bintro__seal"
          initial={{ scale: 0.5, opacity: 0, rotate: -14 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 150, damping: 13 }}>
          <motion.span className="ring" animate={{ rotate: 360 }} transition={{ duration: 9, ease: "linear", repeat: Infinity }} />
          <motion.span className="ring2"
            initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} />
          <span className="no">{party?.number}</span>
        </motion.div>
        <h2 className="vd-bintro__name">
          {words.map((w, i) => (
            <motion.span key={i} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>{w}&nbsp;</motion.span>
          ))}
        </h2>
        {party?.slogan && (
          <motion.p className="vd-bintro__slogan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.05, duration: 0.6 }}>
            “{party.slogan}”
          </motion.p>
        )}
        <motion.div className="vd-bintro__hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.5 }}>
          แตะเพื่อเริ่ม · ENTER
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

const asText = (it) => typeof it === "string" ? it : (it?.text ?? it?.title ?? it?.detail ?? it?.description ?? it?.name ?? "");
const firstImage = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) return val[0] || null;
  if (typeof val === "string") { const s = val.trim(); if (s.startsWith("[")) { try { const a = JSON.parse(s); return Array.isArray(a) ? a[0] : null; } catch { return s; } } return s; }
  return null;
};
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));
const pad2 = (n) => String(n ?? 0).padStart(2, "0");

function Opt({ disc, discSm, kicker, name, slogan, selected, onClick, abstain }) {
  return (
    <article className={`vd-opt ${abstain ? "vd-opt--abstain" : ""} ${selected ? "is-selected" : ""}`}
      onClick={onClick} role="radio" aria-checked={selected} tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}>
      <div className={`vd-opt__disc ${discSm ? "sm" : ""}`}>{disc}</div>
      <div className="vd-opt__main">
        <div className="vd-opt__kicker">{kicker}</div>
        <h3 className="vd-opt__name">{name}</h3>
        {slogan && <p className="vd-opt__slogan">{slogan}</p>}
      </div>
      <div className="vd-opt__check">✓</div>
    </article>
  );
}

export default function VerdureSingleParty({
  party = {}, specialOptions = {}, selectedPartyId = null,
  onSelect = () => {}, onConfirm = () => {}, isSubmitting = false, user = null, editorMode = false,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [modalMember, setModalMember] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [introDone, setIntroDone] = useState(editorMode); // editor/preview skip the cinematic intro

  const missions = useMemo(() => (party?.missions || []).map(asText).filter(Boolean), [party?.missions]);
  const policies = useMemo(() => (party?.policies || []).map(asText).filter(Boolean), [party?.policies]);
  const members = useMemo(() => sortMembersByPosition(party?.members || []), [party?.members]);
  const story = (party?.logoMeaning || "").trim();
  const heroImg = resolveSrc(firstImage(party?.groupImageUrls) || firstImage(party?.officialImageUrl) || firstImage(party?.mobileHeroImage));
  const no = pad2(party?.number);
  const abstain = specialOptions?.abstain;
  const disapprove = specialOptions?.disapprove;
  const userName = (user?.name || "").trim().split(" ")[0];

  const kind = selectedPartyId == null ? null : selectedPartyId === party?.id ? "approve" : selectedPartyId === disapprove?.id ? "disapprove" : selectedPartyId === abstain?.id ? "abstain" : null;
  const selectionLabel = kind === "approve" ? `รับรอง — ${party?.name || ""}` : kind === "disapprove" ? "ไม่รับรอง · Disapprove" : kind === "abstain" ? "งดออกเสียง · Abstain" : null;
  const pick = (id) => () => { if (!editorMode && id != null) onSelect(id); };

  return (
    <VerdureShell active="vote" editorMode={editorMode}
      edge={{ num: "04", label: "Ballot", th: "ลงคะแนนเสียง" }}
      cornermarkTitle="Ballot" cornermarkSub={`Party No. ${no}`}
      statusChip={<div className="vd-chip-live"><span className="dot" /> SINGLE PARTY · <strong>SECURE</strong></div>}>
      {!introDone && <VerdureBallotIntro party={party} no={no} onDone={() => setIntroDone(true)} />}
      <div className="vd-profile vd-sp">
        <div className="vd-ribbon">
          <div className="vd-ribbon__no">{party?.number}</div>
          <div className="vd-ribbon__main">
            <div className="vd-ribbon__kicker"><span className="ac">●</span> THE ONLY PARTY · พรรคเดียวที่ลงสมัคร</div>
            <h1 className="vd-ribbon__name">{party?.name}</h1>
            {party?.slogan && <p className="vd-ribbon__slogan">{party.slogan}</p>}
          </div>
          <div className="vd-ribbon__quick">
            CANDIDATES <strong className="vd-tabular">{members.length || "—"}</strong><br />
            POLICIES <strong className="vd-tabular">{policies.length ? pad2(policies.length) : "—"}</strong><br />
            VOTE <strong>3</strong>
          </div>
        </div>

        <div className="vd-sp__deck">{userName ? <>สวัสดี {userName} — </> : null}อ่านข้อมูลพรรคด้านล่าง แล้วเลือก รับรอง ไม่รับรอง หรืองดออกเสียง ที่ท้ายหน้า. ลงคะแนนได้เพียงครั้งเดียว.</div>

        {(story || heroImg || missions.length > 0) && (
          <section className="vd-chapter">
            <div className="vd-chapter__wm">I.</div>
            <div className="vd-chapter__head"><h2>Chapter <em>I</em> &nbsp;—&nbsp; Vision.</h2><span className="vd-smallcaps vd-ch-sub">วิสัยทัศน์</span></div>
            {heroImg && (
              <figure className="vd-chapter__photo" onClick={() => setLightboxSrc(heroImg)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setLightboxSrc(heroImg); }}>
                <img src={heroImg} alt={party?.name} /><figcaption>TEAM PHOTO · คลิกเพื่อขยาย</figcaption>
              </figure>
            )}
            {story && <p>{story}</p>}
            {missions.length > 0 && <div className="vd-missions">{missions.map((m, i) => <div className="vd-mission" key={i}><span className="no">{pad2(i + 1)}</span><p>{m}</p></div>)}</div>}
          </section>
        )}

        {policies.length > 0 && (
          <section className="vd-chapter">
            <div className="vd-chapter__wm">II.</div>
            <div className="vd-chapter__head"><h2>Chapter <em>II</em> &nbsp;—&nbsp; Policies.</h2><span className="vd-smallcaps vd-ch-sub">{policies.length} นโยบาย</span></div>
            <div className="vd-policies">{policies.map((p, i) => <div className="vd-policy" key={i}><div className="vd-policy__no">{i + 1}</div><div className="vd-policy__tag">POLICY {pad2(i + 1)}</div><p>{p}</p></div>)}</div>
          </section>
        )}

        {members.length > 0 && (
          <section className="vd-chapter">
            <div className="vd-chapter__wm">III.</div>
            <div className="vd-chapter__head"><h2>Chapter <em>III</em> &nbsp;—&nbsp; The team.</h2><span className="vd-smallcaps vd-ch-sub">{members.length} candidates</span></div>
            <div className="vd-roster">{members.map((m, i) => { const img = resolveSrc(m?.imageUrl); return (
              <button type="button" className="vd-rtile" key={m.id || i} onClick={() => setModalMember(m)} aria-label={`ดูข้อมูล ${m.name || "ผู้สมัคร"}`}>
                <div className="vd-rtile__photo">{img ? <img src={img} alt={m.name} /> : <span>portrait</span>}</div>
                <div className="vd-rtile__name">{m.name}</div>
                {(m.position || m.major) && <div className="vd-rtile__role">{m.position || m.major}</div>}
              </button>); })}</div>
          </section>
        )}

        <section className="vd-chapter vd-sp__ballot">
          <div className="vd-chapter__wm">IV.</div>
          <div className="vd-chapter__head"><h2>Chapter <em>IV</em> &nbsp;—&nbsp; Your decision.</h2><span className="vd-smallcaps vd-ch-sub">รับรอง / ไม่รับรอง / งดออกเสียง</span></div>
          <Opt disc="✓" kicker={<>APPROVE · เห็นชอบ · <span className="ac">No. {no}</span></>} name="รับรอง" slogan={`เห็นชอบให้ ${party?.name || ""} ดำรงตำแหน่ง`} selected={kind === "approve"} onClick={pick(party?.id)} />
          {disapprove && <Opt disc="×" discSm abstain kicker="DISAPPROVE · ไม่เห็นชอบ" name="ไม่รับรอง" slogan="ไม่เห็นชอบให้พรรคที่ลงสมัครดำรงตำแหน่ง" selected={kind === "disapprove"} onClick={pick(disapprove.id)} />}
          {abstain && <Opt disc="×" discSm abstain kicker="ABSTAIN · งดออกเสียง" name="งดออกเสียง" slogan="ไม่ประสงค์ลงคะแนนเสียงในการเลือกตั้งครั้งนี้" selected={kind === "abstain"} onClick={pick(abstain.id)} />}

          <div className="vd-confirm">
            <div><div className="vd-confirm__lbl">YOUR SELECTION</div><div className="vd-confirm__val">{selectionLabel || "ยังไม่ได้เลือก · No selection"}</div></div>
            <button type="button" className={`vd-btn vd-btn--terra vd-btn--lg ${kind == null || isSubmitting || editorMode ? "is-disabled" : ""}`}
              disabled={kind == null || isSubmitting || editorMode} onClick={() => !editorMode && kind != null && setConfirmOpen(true)}>
              {isSubmitting ? "กำลังบันทึก…" : "ยืนยันการลงคะแนน"} <span className="arr">↗</span>
            </button>
          </div>
        </section>
      </div>

      {confirmOpen && (
        <motion.div className="vd-cm" onClick={() => !isSubmitting && setConfirmOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <motion.div className="vd-cm__card" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.94, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
            <div className="vd-cm__eyebrow">FINAL CONFIRMATION · ยืนยันครั้งสุดท้าย</div>
            <h3 className="vd-cm__title">ยืนยันการลงคะแนน?</h3>
            <p className="vd-cm__sub">เลือกแล้ว<strong>เปลี่ยนไม่ได้</strong> — กรุณาตรวจสอบตัวเลือกของคุณ</p>
            <div className="vd-cm__pick"><span className="lbl">YOUR SELECTION</span><span className="val">{selectionLabel || "—"}</span></div>
            <div className="vd-cm__actions">
              <button type="button" className="vd-btn vd-btn--ghost vd-btn--lg" onClick={() => setConfirmOpen(false)} disabled={isSubmitting}>ยกเลิก</button>
              <button type="button" className="vd-btn vd-btn--terra vd-btn--lg" onClick={() => onConfirm()} disabled={isSubmitting}>{isSubmitting ? "กำลังบันทึก…" : "ยืนยัน ลงคะแนนเลย"} <span className="arr">↗</span></button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <VerdureMemberModal member={modalMember} onClose={() => setModalMember(null)} />
      <VerdureLightbox src={lightboxSrc} caption={`TEAM PHOTO · ${party?.name || ""}`} onClose={() => setLightboxSrc(null)} />

      <style jsx global>{`
        .vd-sp { position:relative; z-index:1; }
        .vd-sp .vd-ribbon__kicker .ac { color:var(--terra); }

        /* ── cinematic ballot intro (the wax-seal opener) ── */
        .vd-bintro { position:fixed; inset:0; z-index:9000; display:grid; place-items:center; text-align:center; padding:24px; cursor:pointer;
          background:radial-gradient(130% 120% at 50% 30%, #2A4A39 0%, #1F3A2C 60%); color:var(--cream); }
        .vd-bintro__inner { display:flex; flex-direction:column; align-items:center; }
        .vd-bintro__eyebrow { font-family:var(--fm); font-size:11px; letter-spacing:.28em; text-transform:uppercase; color:var(--terra-soft); margin-bottom:32px; }
        .vd-bintro__seal { position:relative; width:clamp(180px,24vw,240px); height:clamp(180px,24vw,240px); border-radius:50%; display:grid; place-items:center; background:radial-gradient(125% 125% at 32% 24%, #305041 0%, #1B3325 60%); box-shadow:0 30px 60px -20px rgba(0,0,0,.5), inset 0 3px 12px rgba(244,236,219,.08); margin-bottom:34px; }
        .vd-bintro__seal .no { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(96px,13vw,140px); line-height:1; color:var(--cream); }
        .vd-bintro__seal .ring { position:absolute; inset:-18px; border-radius:50%; border:1px dashed rgba(188,94,62,.6); }
        .vd-bintro__seal .ring2 { position:absolute; inset:12px; border-radius:50%; border:1px dashed rgba(244,236,219,.25); }
        .vd-bintro__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(34px,5vw,68px); line-height:1.02; letter-spacing:-.02em; margin:0; max-width:14ch; color:var(--cream); }
        .vd-bintro__name span { display:inline-block; }
        .vd-bintro__slogan { font-family:var(--ft); font-size:clamp(15px,1.8vw,19px); color:rgba(244,236,219,.75); margin:18px auto 0; max-width:520px; line-height:1.5; }
        .vd-bintro__hint { margin-top:32px; font-family:var(--fm); font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:rgba(244,236,219,.5); }
        .vd-sp__deck { font-family:var(--ft); font-size:15px; color:var(--moss); opacity:.8; line-height:1.6; max-width:760px; margin:-24px 0 8px; padding:18px 22px; border:1px dashed var(--rule); border-radius:18px; background:var(--cream-2); }

        .vd-chapter { position:relative; padding:60px 0 52px; border-top:1px solid var(--rule); overflow:hidden; }
        .vd-chapter__wm { position:absolute; top:24px; right:-20px; font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(160px,20vw,260px); line-height:.8; letter-spacing:-.05em; color:var(--cream-3); opacity:.5; pointer-events:none; z-index:0; }
        .vd-chapter > * { position:relative; z-index:1; }
        .vd-chapter__head { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:28px; }
        .vd-chapter__head h2 { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(40px,5vw,64px); line-height:1; letter-spacing:-.015em; margin:0; color:var(--moss); }
        .vd-chapter__head h2 em { color:var(--terra); }
        .vd-ch-sub { color:var(--moss); opacity:.55; }
        .vd-chapter > p { font-family:var(--ft); font-size:18px; line-height:1.7; color:var(--moss); margin:0; max-width:760px; }
        .vd-chapter__photo { margin:0 0 28px; cursor:zoom-in; position:relative; border-radius:22px; overflow:hidden; border:1px solid var(--rule); max-width:760px; }
        .vd-chapter__photo img { width:100%; max-height:360px; object-fit:cover; display:block; }
        .vd-chapter__photo figcaption { position:absolute; left:12px; bottom:12px; font-family:var(--fm); font-size:9px; letter-spacing:.16em; text-transform:uppercase; color:var(--cream); background:rgba(31,58,44,.8); padding:5px 12px; border-radius:999px; }
        .vd-missions { margin-top:28px; max-width:820px; }
        .vd-mission { display:grid; grid-template-columns:56px 1fr; gap:24px; align-items:baseline; padding:16px 0; border-top:1px dashed var(--rule); }
        .vd-mission .no { font-family:var(--fd); font-style:italic; font-size:28px; color:var(--terra); line-height:1; }
        .vd-mission p { font-family:var(--ft); font-size:16px; line-height:1.6; color:var(--moss); opacity:.9; margin:0; }
        .vd-policies { display:grid; grid-template-columns:repeat(2,1fr); gap:18px; margin-top:8px; }
        .vd-policy { padding:30px 28px 32px; background:var(--cream-2); border:1px solid var(--rule); border-radius:22px; position:relative; transition:all .25s; }
        .vd-policy:hover { background:var(--cream); transform:translateY(-3px); }
        .vd-policy__no { position:absolute; top:-20px; left:24px; width:48px; height:48px; border-radius:50%; background:var(--terra); color:var(--cream); display:grid; place-items:center; font-family:var(--fd); font-style:italic; font-weight:400; font-size:24px; }
        .vd-policy__tag { display:inline-block; font-family:var(--fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--terra); margin:8px 0 14px; }
        .vd-policy p { font-family:var(--ft); font-size:15px; line-height:1.55; color:var(--moss); opacity:.85; margin:0; }
        .vd-roster { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
        .vd-rtile { background:var(--cream-2); border:1px solid var(--rule); border-radius:18px; padding:16px 14px 18px; text-align:center; transition:all .25s; cursor:pointer; font:inherit; color:inherit; display:block; width:100%; }
        .vd-rtile:hover, .vd-rtile:focus-visible { background:var(--cream); transform:translateY(-4px); outline:none; border-color:var(--terra); }
        .vd-rtile__photo { width:100%; aspect-ratio:1; border-radius:50%; background:var(--cream-3); border:1px solid var(--rule); display:grid; place-items:center; margin-bottom:14px; position:relative; overflow:hidden; }
        .vd-rtile__photo img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
        .vd-rtile__photo span { font-family:var(--fm); font-size:10px; letter-spacing:.15em; text-transform:uppercase; color:var(--moss); opacity:.55; }
        .vd-rtile__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:16px; line-height:1.2; margin-bottom:4px; letter-spacing:-.01em; color:var(--moss); }
        .vd-rtile__role { font-family:var(--fm); font-size:9px; letter-spacing:.15em; text-transform:uppercase; color:var(--terra); }

        .vd-sp__ballot .vd-opt { margin-top:16px; }
        .vd-opt { display:grid; grid-template-columns:96px 1fr auto; align-items:center; gap:24px; padding:24px 28px 24px 24px; background:var(--cream-2); border:1px solid var(--rule); border-radius:28px; cursor:pointer; margin-bottom:12px; transition:all .25s; outline:none; }
        .vd-opt:hover, .vd-opt:focus-visible { background:var(--cream); border-color:var(--moss); }
        .vd-opt.is-selected { background:var(--moss); color:var(--cream); border-color:var(--moss); }
        .vd-opt__disc { width:80px; height:80px; border-radius:50%; background:var(--cream-3); border:1px solid var(--rule); display:grid; place-items:center; font-family:var(--fd); font-style:italic; font-weight:400; font-size:48px; line-height:1; color:var(--moss); transition:all .25s; }
        .vd-opt__disc.sm { font-size:36px; }
        .vd-opt:hover .vd-opt__disc { background:var(--terra-soft); }
        .vd-opt.is-selected .vd-opt__disc { background:var(--terra); color:var(--cream); border-color:var(--terra); }
        .vd-opt__main { min-width:0; }
        .vd-opt__kicker { font-family:var(--fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--moss); opacity:.55; margin-bottom:4px; }
        .vd-opt__kicker .ac { color:var(--terra); opacity:1; }
        .vd-opt.is-selected .vd-opt__kicker { color:rgba(244,236,219,.65); opacity:1; }
        .vd-opt__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:26px; line-height:1.15; margin:0 0 4px; }
        .vd-opt__slogan { font-family:var(--ft); font-size:14px; opacity:.75; margin:0; line-height:1.4; }
        .vd-opt__check { width:44px; height:44px; border-radius:50%; border:1px solid var(--rule); background:var(--cream); display:grid; place-items:center; color:var(--cream); font-size:18px; transition:all .25s; flex-shrink:0; }
        .vd-opt.is-selected .vd-opt__check { background:var(--cream); border-color:var(--cream); color:var(--moss); }
        .vd-opt--abstain { background:transparent; border-style:dashed; }
        .vd-opt--abstain .vd-opt__disc { background:var(--cream); }
        .vd-opt--abstain .vd-opt__name { font-size:20px; }

        .vd-confirm { display:grid; grid-template-columns:1fr auto; gap:24px; align-items:center; margin-top:28px; padding:24px 24px 24px 32px; background:var(--moss); color:var(--cream); border-radius:28px; }
        .vd-confirm__lbl { font-family:var(--fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase; opacity:.55; }
        .vd-confirm__val { font-family:var(--fd); font-style:italic; font-weight:400; font-size:22px; margin-top:4px; }

        .vd-cm { position:fixed; inset:0; z-index:9100; display:grid; place-items:center; background:rgba(31,58,44,.62); -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); padding:24px; }
        .vd-cm__card { width:min(480px,100%); background:var(--cream); border:1px solid var(--rule); border-radius:28px; padding:36px; text-align:center; box-shadow:0 40px 80px -20px rgba(31,58,44,.5); }
        .vd-cm__eyebrow { font-family:var(--fm); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--moss); opacity:.55; margin-bottom:18px; }
        .vd-cm__title { font-family:var(--fd); font-style:italic; font-weight:400; font-size:32px; letter-spacing:-.02em; margin:0 0 10px; color:var(--moss); }
        .vd-cm__sub { font-family:var(--ft); font-size:14px; color:var(--moss); opacity:.75; margin:0 0 22px; }
        .vd-cm__sub strong { color:var(--terra); }
        .vd-cm__pick { border:1px dashed var(--rule); border-radius:14px; padding:14px 18px; margin-bottom:24px; }
        .vd-cm__pick .lbl { display:block; font-family:var(--fm); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--moss); opacity:.55; margin-bottom:6px; }
        .vd-cm__pick .val { font-family:var(--fd); font-style:italic; font-size:18px; color:var(--moss); }
        .vd-cm__actions { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }

        @media (max-width:1100px) {
          .vd-policies, .vd-roster { grid-template-columns:1fr; }
          .vd-roster { grid-template-columns:repeat(2,1fr); }
          .vd-opt { grid-template-columns:56px 1fr auto; padding:18px; gap:16px; }
          .vd-opt__disc { width:56px; height:56px; font-size:32px; }
          .vd-confirm { grid-template-columns:1fr; text-align:center; }
        }
      `}</style>
    </VerdureShell>
  );
}
