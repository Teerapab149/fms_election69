"use client";

// VerdureSingleParty — SINGLE-PARTY VOTE for the Verdure template. A warm, soft
// ("ละมุน") ceremony — deliberately distinct from the cream MAGAZINE party page:
// a golden-hour warm-cream wash, a soft logo medallion, a tight centred column,
// then the candidates as a LARGE PORTRAIT GALLERY (the showpiece), key policies,
// and the dominant 3-choice DECISION (รับรอง / ไม่รับรอง / งดออกเสียง) + confirm.
// Opens with the cinematic wax-seal intro. Same vote contract (onConfirm IS the
// submit). All digits Arabic.

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getPath } from "../../utils/basePath";
import { sortMembersByPosition } from "../../utils/memberSort";
import VerdureShell from "./VerdureShell";
import { VerdureMemberModal, VerdureLightbox } from "./VerdureMemberModal";

// ── cinematic intro: a warm cream wax-seal curtain that wipes up to reveal the
// party's wax seal stamps in, the name + slogan reveal. editorMode skips it; a 3s
// setTimeout always releases the page (content is never trapped). ──
function VerdureBallotIntro({ party, no, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4600); // safety: always release the page (matches the wipe)
    return () => clearTimeout(t);
  }, [onDone]);
  const words = String(party?.name || "").trim().split(/\s+/);
  const logoSrc = resolveSrc(party?.logoUrl);
  return (
    <motion.div className="vd-bintro" initial={{ y: 0 }} animate={{ y: "-100%" }}
      transition={{ delay: 3.6, duration: 0.95, ease: [0.76, 0, 0.24, 1] }}
      onClick={onDone} aria-hidden>
      <motion.div className="vd-bintro__inner"
        initial={{ opacity: 1 }} animate={{ opacity: [1, 1, 0] }} transition={{ delay: 3.2, duration: 0.5 }}>
        <motion.div className="vd-bintro__eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.5 }}>
          ★ THE ONLY PARTY · พรรคเดียวที่ลงสมัคร ★
        </motion.div>
        <motion.div className="vd-bintro__no" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26, duration: 0.5 }}>
          PARTY No. {no}
        </motion.div>
        <motion.div className="vd-bintro__seal"
          initial={{ scale: 0.45, opacity: 0, rotate: -16 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.42, type: "spring", stiffness: 140, damping: 12 }}>
          <motion.span className="flash" initial={{ scale: 0.6, opacity: 0.85 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ delay: 0.62, duration: 0.95, ease: "easeOut" }} />
          <motion.span className="ring" animate={{ rotate: 360 }} transition={{ duration: 11, ease: "linear", repeat: Infinity }} />
          <motion.span className="ring2"
            initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }} />
          {logoSrc ? <img className="logo" src={logoSrc} alt={party?.name || ""} /> : <span className="no">{party?.number}</span>}
        </motion.div>
        <h2 className="vd-bintro__name">
          {words.map((w, i) => (
            <motion.span key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.98 + i * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>{w}&nbsp;</motion.span>
          ))}
        </h2>
        {party?.slogan && (
          <motion.p className="vd-bintro__slogan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.55, duration: 0.6 }}>
            “{party.slogan}”
          </motion.p>
        )}
        <motion.div className="vd-bintro__div" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
        <motion.div className="vd-bintro__tag" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.1, duration: 0.6 }}>
          การเลือกตั้งคณะกรรมการบริหารสโมสรนักศึกษา
        </motion.div>
        <motion.div className="vd-bintro__hint" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0.45, 1] }} transition={{ delay: 2.5, duration: 1.8, repeat: Infinity, repeatDelay: 0.2 }}>
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
  onSelect = () => {}, onConfirm = () => {}, isSubmitting = false, user = null, editorMode = false, forceIntro = false,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [modalMember, setModalMember] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  // editor/preview skip the cinematic intro — unless forceIntro (the dev-only intro demo)
  const [introDone, setIntroDone] = useState(editorMode && !forceIntro);

  const policies = useMemo(() => (party?.policies || []).map(asText).filter(Boolean), [party?.policies]);
  const members = useMemo(() => sortMembersByPosition(party?.members || []), [party?.members]);
  const story = (party?.logoMeaning || "").trim();
  const heroImg = resolveSrc(firstImage(party?.groupImageUrls) || firstImage(party?.officialImageUrl) || firstImage(party?.mobileHeroImage));
  const logoSrc = resolveSrc(party?.logoUrl);
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
      statusChip={<></>}>
      {!introDone && <VerdureBallotIntro party={party} no={no} onDone={() => setIntroDone(true)} />}

      <div className="vd-booth-bg" aria-hidden />
      <div className="vd-booth">
        <div className="vd-booth__head">
          <div className="vd-booth__eyebrow">★ THE ONLY PARTY · พรรคเดียวที่ลงสมัคร ★</div>
          <div className="vd-seal">
            <span className="vd-seal__glow" />
            <span className="vd-seal__ring" />
            <span className="vd-seal__ring2" />
            <div className="vd-seal__disc">
              {logoSrc ? <img src={logoSrc} alt={`โลโก้ ${party?.name || ""}`} /> : <span className="no">{party?.number}</span>}
            </div>
          </div>
          <h1 className="vd-booth__name">{party?.name}</h1>
          {party?.slogan && <p className="vd-booth__slogan">“{party.slogan}”</p>}
        </div>

        {heroImg && (
          <figure className="vd-booth__cover" onClick={() => setLightboxSrc(heroImg)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setLightboxSrc(heroImg); }}>
            <img src={heroImg} alt={`ภาพหมู่พรรค ${party?.name || ""}`} />
            <figcaption>ภาพหมู่พรรค · คลิกเพื่อขยาย</figcaption>
          </figure>
        )}

        {story && (
          <div className="vd-booth__brief">
            <div className="vd-booth__shead"><div><span className="vd-booth__kicker">About the party</span><h2>เกี่ยวกับพรรค</h2></div>{userName && <span className="vd-booth__count">สวัสดี {userName}</span>}</div>
            <div className="vd-booth__scroll"><p>{story}</p></div>
          </div>
        )}

        {policies.length > 0 && (
          <div className="vd-booth__section">
            <div className="vd-booth__shead"><div><span className="vd-booth__kicker">Key policies</span><h2>นโยบายเด่น</h2></div><span className="vd-booth__count">{policies.length} ข้อ</span></div>
            <ol className="vd-plist">
              {policies.map((p, i) => (
                <li key={i}><span className="n">{pad2(i + 1)}</span><span className="t">{p}</span></li>
              ))}
            </ol>
          </div>
        )}

        {members.length > 0 && (
          <div className="vd-booth__section">
            <div className="vd-booth__shead"><div><span className="vd-booth__kicker">The team</span><h2>ทีมผู้สมัคร</h2></div><span className="vd-booth__count">{members.length} คน</span></div>
            <div className="vd-cands">
              {members.map((m, i) => {
                const img = resolveSrc(m?.imageUrl);
                return (
                  <button type="button" key={m.id || i} className="vd-cand" onClick={() => setModalMember(m)} aria-label={`ดูข้อมูล ${m.name || "ผู้สมัคร"}`}>
                    <div className="vd-cand__photo">{img ? <img src={img} alt={m.name} /> : <span className="ph">{(m.name || "?").trim().charAt(0)}</span>}</div>
                    <div className="vd-cand__body">
                      <div className="vd-cand__name">{m.name}</div>
                      {(m.position || m.major) && <div className="vd-cand__role">{m.position || m.major}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <section className="vd-decision">
          <div className="vd-decision__head">
            <span className="vd-decision__kicker">★ Cast your vote · ลงคะแนน ★</span>
            <h2>การตัดสินใจของคุณ</h2>
            <p>เลือกหนึ่งตัวเลือก แล้วกดยืนยัน · ลงคะแนนได้เพียงครั้งเดียว</p>
          </div>
          <Opt disc="✓" kicker={<>เห็นชอบ · <span className="en">Approve</span></>} name="รับรอง" slogan={`เห็นชอบให้ ${party?.name || ""} ดำรงตำแหน่ง`} selected={kind === "approve"} onClick={pick(party?.id)} />
          {disapprove && <Opt disc="×" discSm abstain kicker={<>ไม่เห็นชอบ · <span className="en">Disapprove</span></>} name="ไม่รับรอง" slogan="ไม่เห็นชอบให้พรรคที่ลงสมัครดำรงตำแหน่ง" selected={kind === "disapprove"} onClick={pick(disapprove.id)} />}
          {abstain && <Opt disc="×" discSm abstain kicker={<>งดออกเสียง · <span className="en">Abstain</span></>} name="งดออกเสียง" slogan="ไม่ประสงค์ลงคะแนนเสียงในการเลือกตั้งครั้งนี้" selected={kind === "abstain"} onClick={pick(abstain.id)} />}

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
      <VerdureLightbox src={lightboxSrc} caption={`ภาพหมู่พรรค · ${party?.name || ""}`} onClose={() => setLightboxSrc(null)} />

      <style jsx global>{`
        /* ── cinematic ballot intro — WARM cream wax-seal curtain that wipes up into
           the warm page (seamless cream→cream, no dark flash) ── */
        .vd-bintro { position:fixed; inset:0; z-index:9000; display:grid; place-items:center; text-align:center; padding:24px; cursor:pointer; color:var(--moss);
          background:
            radial-gradient(80% 50% at 50% 28%, rgba(210,162,72,.22) 0%, transparent 56%),
            radial-gradient(70% 50% at 100% 92%, rgba(188,94,62,.10) 0%, transparent 52%),
            radial-gradient(66% 52% at 0% 100%, rgba(227,191,169,.26) 0%, transparent 56%),
            linear-gradient(168deg, #FBF3E3 0%, #F4ECDB 48%, #EFE2CB 100%); }
        .vd-bintro__inner { display:flex; flex-direction:column; align-items:center; }
        .vd-bintro__eyebrow { font-family:var(--fm); font-size:11px; letter-spacing:.28em; text-transform:uppercase; color:var(--terra-2); margin-bottom:16px; }
        .vd-bintro__no { font-family:var(--fm); font-size:11px; letter-spacing:.32em; text-transform:uppercase; color:var(--moss); opacity:.5; margin-bottom:28px; }
        .vd-bintro__seal { position:relative; width:clamp(180px,24vw,240px); height:clamp(180px,24vw,240px); border-radius:50%; display:grid; place-items:center; background:radial-gradient(125% 125% at 32% 24%, #FFFFFF 0%, #FAF4E4 62%); box-shadow:0 30px 60px -24px rgba(31,58,44,.35), 0 0 72px -6px rgba(210,162,72,.4), inset 0 2px 8px rgba(255,255,255,.6); margin-bottom:34px; }
        .vd-bintro__seal .no { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(96px,13vw,140px); line-height:1; color:var(--moss); }
        .vd-bintro__seal .logo { width:70%; height:70%; object-fit:contain; display:block; }
        .vd-bintro__seal .flash { position:absolute; inset:-18px; border-radius:50%; border:2px solid var(--terra); pointer-events:none; }
        .vd-bintro__seal .ring { position:absolute; inset:-18px; border-radius:50%; border:1px dashed var(--terra-soft); }
        .vd-bintro__seal .ring2 { position:absolute; inset:12px; border-radius:50%; border:1px dashed rgba(210,162,72,.4); }
        .vd-bintro__div { width:64px; height:1.5px; background:var(--terra); margin:26px 0 0; transform-origin:center; }
        .vd-bintro__tag { font-family:var(--ft); font-size:13px; color:rgba(31,58,44,.6); margin-top:14px; letter-spacing:.01em; }
        .vd-bintro__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(34px,5vw,68px); line-height:1.02; letter-spacing:-.02em; margin:0; max-width:14ch; color:var(--moss); }
        .vd-bintro__name span { display:inline-block; }
        .vd-bintro__slogan { font-family:var(--ft); font-size:clamp(15px,1.8vw,19px); color:rgba(31,58,44,.72); margin:18px auto 0; max-width:520px; line-height:1.5; }
        .vd-bintro__hint { margin-top:32px; font-family:var(--fm); font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:var(--terra-2); }

        /* ── warm "ละมุน" ballot — golden-hour cream, soft, candidate-forward ── */
        .vd-booth-bg { position:fixed; inset:0; z-index:0; pointer-events:none;
          background:
            radial-gradient(72% 46% at 50% 0%, rgba(210,162,72,.16) 0%, transparent 56%),
            radial-gradient(60% 44% at 100% 8%, rgba(188,94,62,.09) 0%, transparent 50%),
            radial-gradient(66% 52% at 0% 100%, rgba(227,191,169,.30) 0%, transparent 56%),
            linear-gradient(168deg, #FBF3E3 0%, #F4ECDB 46%, #EFE2CB 100%); }
        .vd-booth { max-width:860px; margin:0 auto; padding:108px 24px 150px; position:relative; z-index:1; }
        .vd-booth__head { text-align:center; }
        .vd-booth__eyebrow { font-family:var(--fm); font-size:11px; letter-spacing:.3em; text-transform:uppercase; color:var(--terra-2); margin-bottom:30px; }

        .vd-seal { position:relative; width:clamp(180px,25vw,226px); aspect-ratio:1; margin:4px auto 30px; display:grid; place-items:center; }
        .vd-seal__glow { position:absolute; inset:-46px; border-radius:50%; background:radial-gradient(circle, rgba(210,162,72,.26) 0%, rgba(227,191,169,.12) 44%, transparent 70%); animation:vdGlow 5s ease-in-out infinite; }
        .vd-seal__ring { position:absolute; inset:-15px; border-radius:50%; border:1px dashed var(--terra-soft); }
        .vd-seal__ring2 { position:absolute; inset:7px; border-radius:50%; border:1px solid rgba(210,162,72,.3); }
        .vd-seal__disc { position:relative; width:100%; height:100%; border-radius:50%; background:var(--cream-2); border:1px solid var(--rule); display:grid; place-items:center; overflow:hidden; box-shadow:0 30px 60px -28px rgba(31,58,44,.4), 0 0 0 7px rgba(250,244,228,.6); }
        /* cover → the logo FILLS the seal (no cream margins) so it reads big even
           in a smaller circle (owner: logo too small but circle too big when grown).
           Portrait posters fill the width and crop a little top/bottom. */
        .vd-seal__disc img { width:100%; height:100%; object-fit:cover; object-position:center; display:block; }
        .vd-seal__disc .no { font-family:var(--fd); font-style:italic; font-weight:400; font-size:84px; line-height:1; color:var(--moss); }
        @keyframes vdGlow { 0%,100%{opacity:.55; transform:scale(.97)} 50%{opacity:.9; transform:scale(1.05)} }

        .vd-booth__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(36px,5.4vw,62px); line-height:1.04; letter-spacing:-.02em; margin:0 0 14px; color:var(--moss); }
        .vd-booth__slogan { font-family:var(--ft); font-size:17px; color:rgba(31,58,44,.8); line-height:1.55; margin:0 auto; max-width:540px; }
        .vd-booth__cover { display:block; margin:40px 0 0; cursor:zoom-in; position:relative; border-radius:26px; overflow:hidden; border:1px solid var(--rule); box-shadow:0 36px 70px -40px rgba(31,58,44,.45); }
        .vd-booth__cover img { width:100%; height:clamp(260px,38vw,440px); object-fit:cover; display:block; transition:transform .6s; }
        .vd-booth__cover:hover img { transform:scale(1.03); }
        .vd-booth__cover figcaption { position:absolute; left:16px; bottom:16px; font-family:var(--fm); font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--cream); background:rgba(31,58,44,.78); padding:6px 14px; border-radius:999px; }

        .vd-booth__brief, .vd-booth__section { margin-top:48px; padding-top:36px; border-top:1px solid var(--rule); }
        .vd-booth__shead { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:28px; padding-bottom:16px; border-bottom:1.5px solid rgba(31,58,44,.16); position:relative; }
        .vd-booth__shead::after { content:""; position:absolute; left:0; bottom:-1.5px; width:58px; height:1.5px; background:var(--terra); }
        .vd-booth__kicker { display:block; font-family:var(--fm); font-size:10px; letter-spacing:.26em; text-transform:uppercase; color:var(--terra-2); margin-bottom:10px; }
        .vd-booth__shead h2 { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(30px,4.2vw,46px); line-height:.98; letter-spacing:-.015em; color:var(--moss); margin:0; }
        .vd-booth__count { font-family:var(--fm); font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--terra-2); white-space:nowrap; padding-bottom:5px; }
        .vd-booth__scroll { max-height:230px; overflow-y:auto; padding:22px 24px; background:var(--cream-2); border:1px solid var(--rule); border-radius:18px; box-shadow:inset 0 2px 12px rgba(31,58,44,.05); }
        .vd-booth__scroll p { font-family:var(--ft); font-size:17px; line-height:1.85; color:rgba(31,58,44,.9); margin:0; }
        .vd-booth__scroll::-webkit-scrollbar { width:6px; }
        .vd-booth__scroll::-webkit-scrollbar-track { background:transparent; }
        .vd-booth__scroll::-webkit-scrollbar-thumb { background:var(--rule); border-radius:99px; }

        /* candidates — the showpiece: full-bleed portrait cards. NO light border
           (it showed a white edge over the dark posters); a faint DARK hairline ring
           + a moss photo backing means no light sliver ever shows at the top/corners. */
        .vd-cands { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
        .vd-cand { background:var(--cream-2); border:0; border-radius:18px; overflow:hidden; padding:0; cursor:pointer; text-align:left; color:inherit; font:inherit; position:relative; transition:transform .25s, box-shadow .25s; box-shadow:0 16px 34px -22px rgba(31,58,44,.42), 0 0 0 1px rgba(31,58,44,.07); }
        .vd-cand:hover, .vd-cand:focus-visible { transform:translateY(-7px); box-shadow:0 32px 56px -24px rgba(31,58,44,.5), 0 0 0 1.5px var(--terra); outline:none; }
        .vd-cand__photo { width:100%; aspect-ratio:4/5; overflow:hidden; background:var(--moss); position:relative; }
        .vd-cand__photo img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .5s; }
        .vd-cand:hover .vd-cand__photo img { transform:scale(1.05); }
        .vd-cand__photo::after { content:""; position:absolute; inset:0; box-shadow:inset 0 -38px 38px -26px rgba(20,32,22,.5); pointer-events:none; }
        .vd-cand__photo .ph { display:grid; place-items:center; width:100%; height:100%; font-family:var(--fd); font-style:italic; font-size:44px; color:var(--cream); opacity:.6; }
        .vd-cand__body { padding:13px 15px 15px; position:relative; }
        .vd-cand__body::before { content:""; position:absolute; left:15px; top:0; width:26px; height:2px; background:var(--terra); }
        .vd-cand__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:16px; line-height:1.2; color:var(--moss); margin:7px 0 4px; }
        .vd-cand__role { font-family:var(--fm); font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:var(--terra-2); }

        .vd-plist { list-style:none; margin:0; padding:0; }
        .vd-plist li { display:grid; grid-template-columns:46px 1fr; gap:20px; align-items:center; padding:18px 8px; border-top:1px solid var(--rule); border-radius:12px; transition:padding-left .22s, background .22s; }
        .vd-plist li:first-child { border-top:0; }
        .vd-plist li:hover { padding-left:16px; background:rgba(250,244,228,.7); }
        .vd-plist .n { font-family:var(--fd); font-style:italic; font-weight:400; font-size:34px; line-height:1; color:var(--terra); }
        .vd-plist .t { font-family:var(--ft); font-size:16px; line-height:1.66; color:rgba(31,58,44,.9); }

        /* THE DECISION — the ballot moment */
        .vd-decision { margin-top:66px; padding-top:46px; border-top:2px solid rgba(31,58,44,.16); position:relative; }
        .vd-decision::before { content:""; position:absolute; left:50%; top:-2px; transform:translateX(-50%); width:84px; height:2px; background:var(--terra); }
        .vd-decision__head { text-align:center; margin-bottom:34px; }
        .vd-decision__kicker { display:block; font-family:var(--fm); font-size:11px; letter-spacing:.3em; text-transform:uppercase; color:var(--terra-2); margin-bottom:14px; }
        .vd-decision__head h2 { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(34px,4.8vw,54px); line-height:1; letter-spacing:-.015em; color:var(--moss); margin:0 0 12px; }
        .vd-decision__head p { font-family:var(--ft); font-size:15px; color:rgba(31,58,44,.72); margin:0; }

        .vd-opt { display:grid; grid-template-columns:88px 1fr auto; align-items:center; gap:22px; padding:22px 26px 22px 22px; background:var(--cream-2); border:1px solid var(--rule); border-radius:26px; cursor:pointer; margin-bottom:12px; transition:all .25s; outline:none; box-shadow:0 10px 26px -22px rgba(31,58,44,.3); }
        .vd-opt:hover, .vd-opt:focus-visible { background:var(--cream); border-color:var(--terra-soft); transform:translateY(-2px); }
        .vd-opt.is-selected { background:var(--moss); border-color:var(--moss); box-shadow:0 26px 50px -28px rgba(31,58,44,.55); }
        .vd-opt__disc { width:72px; height:72px; border-radius:50%; background:var(--cream-3); border:1px solid var(--rule); display:grid; place-items:center; font-family:var(--fd); font-style:italic; font-weight:400; font-size:42px; line-height:1; color:var(--moss); transition:all .25s; }
        .vd-opt__disc.sm { font-size:32px; }
        .vd-opt:hover .vd-opt__disc { background:var(--terra-soft); }
        .vd-opt.is-selected .vd-opt__disc { background:var(--terra); color:var(--cream); border-color:var(--terra); }
        /* primary choice (รับรอง) reads warmer/inviting vs the dashed abstain rows */
        .vd-opt:not(.vd-opt--abstain):not(.is-selected) { border-color:var(--terra-soft); background:linear-gradient(180deg, #FCF5E6 0%, var(--cream-2) 100%); }
        .vd-opt:not(.vd-opt--abstain):not(.is-selected) .vd-opt__disc { background:var(--terra-soft); border-color:var(--terra-soft); color:var(--moss); }
        .vd-opt__main { min-width:0; }
        .vd-opt__kicker { font-family:var(--ft); font-size:11px; letter-spacing:.04em; color:var(--terra-2); margin-bottom:5px; }
        .vd-opt__kicker .en { font-family:var(--fm); font-size:10px; letter-spacing:.1em; text-transform:uppercase; opacity:.8; }
        .vd-opt__kicker .ac { color:var(--terra-2); }
        .vd-opt.is-selected .vd-opt__kicker { color:rgba(244,236,219,.7); }
        .vd-opt.is-selected .vd-opt__kicker .ac { color:var(--terra-soft); }
        .vd-opt__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:26px; line-height:1.15; margin:0 0 4px; color:var(--moss); }
        .vd-opt.is-selected .vd-opt__name { color:var(--cream); }
        .vd-opt__slogan { font-family:var(--ft); font-size:14px; color:rgba(31,58,44,.65); margin:0; line-height:1.4; }
        .vd-opt.is-selected .vd-opt__slogan { color:rgba(244,236,219,.72); }
        .vd-opt__check { width:42px; height:42px; border-radius:50%; border:1px solid var(--rule); background:transparent; display:grid; place-items:center; color:transparent; font-size:18px; transition:all .25s; flex-shrink:0; }
        .vd-opt.is-selected .vd-opt__check { background:var(--cream); border-color:var(--cream); color:var(--moss); }
        .vd-opt--abstain { background:transparent; border-style:dashed; }
        .vd-opt--abstain .vd-opt__name { font-size:21px; }

        .vd-confirm { display:grid; grid-template-columns:1fr auto; gap:24px; align-items:center; margin-top:24px; padding:24px 24px 24px 30px; background:var(--cream-2); border:1px solid var(--rule); border-radius:26px; }
        .vd-confirm__lbl { font-family:var(--fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:rgba(31,58,44,.55); }
        .vd-confirm__val { font-family:var(--fd); font-style:italic; font-weight:400; font-size:22px; margin-top:4px; color:var(--moss); }


        /* confirm dialog — a warm cream card */
        .vd-cm { position:fixed; inset:0; z-index:9100; display:grid; place-items:center; background:rgba(31,58,44,.5); -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); padding:24px; }
        .vd-cm__card { width:min(480px,100%); background:var(--cream-2); border:1px solid var(--rule); border-radius:28px; padding:36px; text-align:center; box-shadow:0 40px 80px -24px rgba(31,58,44,.45); }
        .vd-cm__eyebrow { font-family:var(--fm); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--terra-2); margin-bottom:18px; }
        .vd-cm__title { font-family:var(--fd); font-style:italic; font-weight:400; font-size:32px; letter-spacing:-.02em; margin:0 0 10px; color:var(--moss); }
        .vd-cm__sub { font-family:var(--ft); font-size:14px; color:rgba(31,58,44,.78); margin:0 0 22px; }
        .vd-cm__sub strong { color:var(--terra-2); }
        .vd-cm__pick { border:1px dashed var(--rule); border-radius:14px; padding:14px 18px; margin-bottom:24px; }
        .vd-cm__pick .lbl { display:block; font-family:var(--fm); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:rgba(31,58,44,.55); margin-bottom:6px; }
        .vd-cm__pick .val { font-family:var(--fd); font-style:italic; font-size:18px; color:var(--moss); }
        .vd-cm__actions { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }

        @media (max-width:1100px) {
          .vd-booth { padding:96px 20px 130px; }
          .vd-cands { grid-template-columns:repeat(3,1fr); }
          .vd-opt { grid-template-columns:56px 1fr auto; padding:18px; gap:16px; }
          .vd-opt__disc { width:56px; height:56px; font-size:30px; }
          .vd-confirm { grid-template-columns:1fr; text-align:center; }
        }
        @media (max-width:560px) {
          .vd-booth { padding:84px 16px 128px; }
          /* tighten the long bilingual eyebrow so it stops wrapping with a lone ★
             dangling on a second line */
          .vd-booth__eyebrow { font-size:9.5px; letter-spacing:.1em; margin-bottom:24px; }
          .vd-cands { grid-template-columns:repeat(2,1fr); gap:14px; }
          .vd-plist li { gap:16px; }
        }
      `}</style>
    </VerdureShell>
  );
}
