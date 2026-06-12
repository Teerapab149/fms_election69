"use client";

// StudioDarkSingleParty — the Studio Dark v2 SINGLE-PARTY VOTE view.
//
// Used when exactly one party runs (dispatched from StudioDarkVote, the same
// pattern GumroadVote → GumroadSingleParty uses). Instead of a bare 3-choice
// ballot, this is the full party presentation as ONE scroll journey ending at
// the ballot (owner decision 2026-06-12, direction A):
//
//   StudioDarkPartyIntro overlay (skippable, editor skips it)
//   → profile header (giant numeral + name + slogan + quick stats)
//   → i. Vision & future.  (logoMeaning story + missions + team photo)
//   → ii. Our policies.    (hover-highlight table rows)
//   → iii. The team.       (4-up portrait roster)
//   → iv. Your decision.   (3-choice ballot: รับรอง / ไม่รับรอง / งดออกเสียง)
//   + sticky confirm footer → in-component double-check dialog → onConfirm()
//
// Section styles deliberately mirror StudioDarkParty (sdp-*) so the party page
// and the single-ballot presentation read as the same place; ballot strips
// mirror StudioDarkVote (sdv-*). Classes are namespaced sds-* to avoid
// collisions when both pages' global styled-jsx blocks are mounted.
//
// Election correctness — same contract as GumroadSingleParty: party +
// specialOptions{abstain,disapprove} + selectedPartyId + onSelect(id) +
// onConfirm (parent submits; here onConfirm IS the submit, so the double-check
// dialog lives in this component).

import { getPath } from "../../utils/basePath";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { sortMembersByPosition } from "../../utils/memberSort";
import StudioDarkShell from "./StudioDarkShell";
import StudioDarkPartyIntro from "./StudioDarkPartyIntro";
import { StudioDarkMemberModal, StudioDarkLightbox } from "./StudioDarkMemberModal";

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
const pad2 = (n) => String(n ?? 0).padStart(2, "0");

function ChoiceStrip({ no, noClass = "", kicker, name, slogan, selected, onClick, dashedTop = false, dataElement }) {
  return (
    <article
      className={`sds-strip ${selected ? "is-selected" : ""} ${dashedTop ? "sds-strip--dashed" : ""}`}
      data-element={dataElement}
      onClick={onClick}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
    >
      <div className={`sds-strip__no ${noClass}`}>{no}</div>
      <div className="sds-strip__main">
        <div className="sds-strip__kicker">{kicker}</div>
        <h3 className="sds-strip__name">{name}</h3>
        {slogan && <p className="sds-strip__slogan">{slogan}</p>}
      </div>
      <div className="sds-strip__check"><Check size={15} strokeWidth={3} /></div>
    </article>
  );
}

export default function StudioDarkSingleParty({
  party = {},
  specialOptions = {},
  selectedPartyId = null,
  onSelect = () => {},
  onConfirm = () => {},
  isSubmitting = false,
  user = null,
  editorMode = false,
}) {
  const [introDone, setIntroDone] = useState(editorMode); // editor/preview skips the intro
  const [confirmOpen, setConfirmOpen] = useState(false);  // double-check before the one-shot vote
  const [modalMember, setModalMember] = useState(null);   // click a member → profile modal
  const [lightboxSrc, setLightboxSrc] = useState(null);   // click the team photo → fullscreen

  const missions = useMemo(() => (party?.missions || []).map(asText).filter(Boolean), [party?.missions]);
  const policies = useMemo(() => (party?.policies || []).map(asText).filter(Boolean), [party?.policies]);
  const members = useMemo(() => sortMembersByPosition(party?.members || []), [party?.members]);
  const story = (party?.logoMeaning || "").trim();
  const heroImg = resolveSrc(firstImage(party?.groupImageUrls) || firstImage(party?.officialImageUrl) || firstImage(party?.mobileHeroImage));

  const no = pad2(party?.number);
  const abstain = specialOptions?.abstain;
  const disapprove = specialOptions?.disapprove;

  const kind =
    selectedPartyId == null ? null :
    selectedPartyId === party?.id ? "approve" :
    selectedPartyId === disapprove?.id ? "disapprove" :
    selectedPartyId === abstain?.id ? "abstain" : null;
  const selectionLabel =
    kind === "approve" ? `รับรอง — ${party?.name || ""}` :
    kind === "disapprove" ? "ไม่รับรอง · Disapprove" :
    kind === "abstain" ? "งดออกเสียง · Abstain" : null;

  const pick = (id) => () => { if (!editorMode && id != null) onSelect(id); };
  const userName = user?.name || "";
  let sec = 0;
  const ROMAN = ["i.", "ii.", "iii.", "iv."];

  return (
    <StudioDarkShell
      active="vote"
      num="04"
      label="Vote"
      labelTh="ลงคะแนนเสียง"
      editorMode={editorMode}
    >
      {/* intro drives its own wipe-up via `animate` + delayed onDone, so no
          AnimatePresence/exit needed (exit callbacks hang under forced
          reduced-motion — see StudioDarkMemberModal note) */}
      {!introDone && <StudioDarkPartyIntro party={party} onDone={() => setIntroDone(true)} />}

      {/* PROFILE HEADER — same voice as the party page */}
      <div className="sds-h" data-element="vote-party-card">
        <div className="sds-h__no" aria-hidden="true">{no.slice(0, -1)}<em>{no.slice(-1)}</em></div>
        <div>
          <div className="sds-h__kicker"><span className="sds-accent">●</span> THE ONLY PARTY · พรรคเดียวที่ลงสมัคร</div>
          <h1 className="sds-h__title" data-element="vote-header-title">{party?.name}</h1>
          {party?.slogan && <p className="sds-h__slogan">{party.slogan}</p>}
        </div>
        <div className="sds-h__side">
          {resolveSrc(party?.logoUrl) && (
            <div className="sds-h__logo">
              <img src={resolveSrc(party.logoUrl)} alt={`โลโก้ ${party?.name || ""}`} />
            </div>
          )}
          <div className="sds-h__quick">
            <div className="sds-h__row">CANDIDATES <strong>{members.length || "—"}</strong></div>
            <div className="sds-h__row">POLICIES <strong>{policies.length || "—"}</strong></div>
            <div className="sds-h__row">VOTE <strong><em>3 choices</em></strong></div>
          </div>
        </div>
      </div>

      {/* greeting / rules line */}
      <div className="sds-deck">
        <span><span className="sds-accent">●</span> VOTE OPEN</span>
        <p>
          {userName ? <>สวัสดีคุณ <strong className="sds-uname">{userName}</strong> — </> : null}
          ปีนี้มีพรรคลงสมัครเพียงพรรคเดียว อ่านข้อมูลพรรคด้านล่าง แล้วเลือก
          รับรอง ไม่รับรอง หรืองดออกเสียง ที่ท้ายหน้า — การลงคะแนนทำได้เพียงครั้งเดียวเท่านั้น
        </p>
        <span>ONE VOTE ONLY</span>
      </div>

      {/* VISION */}
      {(story || missions.length > 0) && (
        <section className="sds-section" data-ghost="i.">
          <h2><span className="num">{ROMAN[sec++]}</span>Vision &amp; <em>future.</em></h2>
          <div className="sds-story" data-media={heroImg ? "1" : "0"}>
            <div>
              {/* long manifestos live inside a fixed-height scroll card
                  (owner feedback: the raw column ran too tall) */}
              {story && (
                <>
                  <div className="sds-story__scroll">
                    <p>{story}</p>
                  </div>
                  <span className="sds-story__hint">SCROLL · เลื่อนอ่านต่อในกรอบ ↓</span>
                </>
              )}
            </div>
            {heroImg && (
              <figure
                className="sds-story__media"
                onClick={() => setLightboxSrc(heroImg)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") setLightboxSrc(heroImg); }}
              >
                <img src={heroImg} alt={party?.name} />
                <figcaption className="sds-story__cap">TEAM PHOTO · คลิกเพื่อขยาย ⌕</figcaption>
              </figure>
            )}
          </div>

          {/* MISSIONS — their own always-visible ledger (owner feedback: they
              were buried at the bottom of the story scroll card) */}
          {missions.length > 0 && (
            <div className="sds-missions">
              <div className="sds-missions__lbl"><span className="sds-accent">●</span> MISSIONS · พันธกิจ</div>
              {missions.map((m, i) => (
                <div className="sds-mission" key={i}>
                  <span className="sds-mission__no">{pad2(i + 1)}</span>
                  <p>{m}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* POLICIES */}
      {policies.length > 0 && (
        <section className="sds-section" data-ghost="ii.">
          <h2><span className="num">{ROMAN[sec++]}</span>{policies.length === 4 ? <>Four <em>policies.</em></> : <>Our <em>policies.</em></>}</h2>
          <div className="sds-policies">
            {policies.map((p, i) => (
              <div className="sds-policy" key={i}>
                <div className="sds-policy__no">{pad2(i + 1)}</div>
                <div className="sds-policy__body"><p>{p}</p></div>
                <span className="sds-policy__tag">POLICY {pad2(i + 1)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TEAM */}
      {members.length > 0 && (
        <section className="sds-section" data-ghost="iii.">
          <h2><span className="num">{ROMAN[sec++]}</span>The <em>team.</em></h2>
          <div className="sds-roster">
            {members.map((m, i) => {
              const img = resolveSrc(m?.imageUrl);
              return (
                <button
                  type="button"
                  className="sds-tile"
                  key={m.id || i}
                  onClick={() => setModalMember(m)}
                  aria-label={`ดูข้อมูล ${m.name || "ผู้สมัคร"}`}
                >
                  <div className={`sds-tile__photo ${img ? "" : "sd-media-ph"}`}>
                    {img ? <img src={img} alt={m.name} /> : <span>portrait</span>}
                    <span className="sds-tile__idx">{pad2(i + 1)}</span>
                    <span className="sds-tile__zoom">PROFILE ↗</span>
                  </div>
                  <div className="sds-tile__name">{m.name}</div>
                  {(m.position || m.major) && <div className="sds-tile__role">{m.position || m.major}</div>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* marquee divider — the breath before the decision. framer-motion (JS)
          on purpose: the globals.css reduced-motion rule kills CSS keyframes
          site-wide, which froze this strip on machines with the OS setting on;
          decorative motion here is a product call (same as the intros). */}
      <div className="sds-marquee" aria-hidden="true">
        <motion.div
          className="sds-marquee__track"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 24, ease: "linear", repeat: Infinity }}
        >
          {Array.from({ length: 2 }, (_, k) => (
            <span key={k}>
              CAST YOUR VOTE — ลงคะแนนเสียงของคุณ — № {no} {party?.name} — ONE VOTE ONLY — รับรอง / ไม่รับรอง / งดออกเสียง —&nbsp;
            </span>
          ))}
        </motion.div>
      </div>

      {/* BALLOT */}
      <section className="sds-section sds-section--ballot" data-ghost="iv.">
        <h2><span className="num">{ROMAN[sec++]}</span>Your <em>decision.</em></h2>
        <div className="sds-ballot-intro">
          <span>SINGLE-PARTY VOTE · รับรอง / ไม่รับรอง / งดออกเสียง</span>
          <span>ONE VOTE ONLY</span>
        </div>

        <ChoiceStrip
          no={<span className="sds-yes">✓</span>}
          kicker={<>APPROVE · เห็นชอบ · <span className="sds-accent">№ {no}</span></>}
          name="รับรอง"
          slogan={`เห็นชอบให้ ${party?.name || ""} ดำรงตำแหน่ง`}
          selected={kind === "approve"}
          onClick={pick(party?.id)}
          dataElement="vote-approve-button"
        />
        {disapprove && (
          <ChoiceStrip
            no="×"
            noClass="sds-strip__no--sm"
            kicker="DISAPPROVE · ไม่เห็นชอบ"
            name="ไม่รับรอง"
            slogan="ไม่เห็นชอบให้พรรคที่ลงสมัครดำรงตำแหน่ง"
            selected={kind === "disapprove"}
            onClick={pick(disapprove.id)}
            dashedTop
            dataElement="vote-disapprove-button"
          />
        )}
        {abstain && (
          <ChoiceStrip
            no="×"
            noClass="sds-strip__no--sm"
            kicker="ABSTAIN · งดออกเสียง"
            name="งดออกเสียง"
            slogan="ไม่ประสงค์ลงคะแนนเสียงในการเลือกตั้งครั้งนี้"
            selected={kind === "abstain"}
            onClick={pick(abstain.id)}
            dashedTop
            dataElement="vote-abstain-button"
          />
        )}

        {/* STICKY CONFIRM FOOTER */}
        <div className="sds-footer">
          <div>
            <div className="sds-footer__lbl">YOUR SELECTION</div>
            <div className="sds-footer__val">{selectionLabel || "ยังไม่ได้เลือก · None"}</div>
          </div>
          <button
            type="button"
            className="sd-btn sd-btn--accent sd-btn--lg"
            disabled={kind == null || isSubmitting || editorMode}
            onClick={() => !editorMode && kind != null && setConfirmOpen(true)}
          >
            {isSubmitting ? "กำลังบันทึก…" : "ยืนยันการลงคะแนน →"}
          </button>
        </div>
      </section>

      {/* CONFIRM — double-check (the vote is one-shot). Entrance animates;
          close is INSTANT — exit callbacks hang under forced reduced-motion
          (same fix as StudioDarkMemberModal; a stuck overlay here would block
          the whole vote flow). */}
      {confirmOpen && (
          <motion.div className="sds-cm" onClick={() => !isSubmitting && setConfirmOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <motion.div className="sds-cm__card" onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
              <div className="sds-cm__eyebrow">FINAL CONFIRMATION · ยืนยันครั้งสุดท้าย</div>
              <h3 className="sds-cm__title">ยืนยันการลงคะแนน?</h3>
              <p className="sds-cm__sub">เลือกแล้ว<strong>เปลี่ยนไม่ได้</strong> — กรุณาตรวจสอบตัวเลือกของคุณ</p>
              <div className="sds-cm__pick">
                <span className="sds-cm__pick-lbl">YOUR SELECTION</span>
                <span className="sds-cm__pick-val">{selectionLabel || "—"}</span>
              </div>
              <div className="sds-cm__actions">
                <button type="button" className="sd-btn sd-btn--lg" onClick={() => setConfirmOpen(false)} disabled={isSubmitting}>ยกเลิก</button>
                <button type="button" className="sd-btn sd-btn--accent sd-btn--lg" onClick={() => onConfirm()} disabled={isSubmitting}>
                  {isSubmitting ? "กำลังบันทึก…" : "ยืนยัน ลงคะแนนเลย →"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

      {/* shared studio overlays (self-gating: null prop = nothing) */}
      <StudioDarkMemberModal member={modalMember} onClose={() => setModalMember(null)} />
      <StudioDarkLightbox src={lightboxSrc} caption={`TEAM PHOTO · ${party?.name || ""}`} onClose={() => setLightboxSrc(null)} />

      <style jsx global>{`
        .sds-accent { color:var(--sd-accent); }
        .sds-uname { color:var(--sd-ink); font-weight:500; }

        /* profile header — mirrors .sdp-h on the party page */
        .sds-h {
          display:grid; grid-template-columns:auto 1fr auto; gap:44px; align-items:center;
          padding:36px 48px 32px; border-bottom:1px solid var(--sd-line);
        }
        .sds-h__no { font-family:var(--sd-sans); font-weight:400; font-size:clamp(110px,13vw,200px); line-height:.78; letter-spacing:-.07em; color:var(--sd-ink); }
        .sds-h__no em { font-style:normal; color:var(--sd-accent); }
        .sds-h__kicker { font-family:var(--sd-mono); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--sd-ink-2); margin-bottom:14px; }
        .sds-h__title { font-family:var(--sd-sans); font-weight:400; font-size:clamp(32px,4vw,58px); line-height:1; letter-spacing:-.035em; margin:0; }
        .sds-h__slogan {
          font-family:var(--sd-serif); font-style:italic; font-size:18px; color:var(--sd-ink-2);
          margin:16px 0 0; line-height:1.45; font-weight:300; max-width:540px;
          padding-left:16px; border-left:1px solid var(--sd-accent);
        }
        /* logo + stats laid as a compact row so the side column height ≈ the
           numeral's — stops the tall stack from dumping empty space above "01"
           under align-items:center (owner feedback: header gap too big). */
        .sds-h__side { display:flex; flex-direction:row-reverse; align-items:center; gap:24px; }
        /* cream plate so dark/JPG logos read on the dark page */
        .sds-h__logo {
          width:104px; height:104px; border-radius:18px; overflow:hidden; flex-shrink:0;
          border:1px solid var(--sd-line-strong); background:var(--sd-ink); padding:11px;
        }
        .sds-h__logo img { width:100%; height:100%; object-fit:contain; display:block; border-radius:10px; }
        .sds-h__quick { display:grid; gap:16px; }
        .sds-h__row { font-family:var(--sd-mono); font-size:12px; letter-spacing:.12em; text-transform:uppercase; color:var(--sd-ink-2); text-align:right; }
        .sds-h__row strong { display:block; font-family:var(--sd-sans); font-size:22px; color:var(--sd-ink); margin-top:4px; letter-spacing:-.02em; font-weight:400; }
        .sds-h__row strong em { font-family:var(--sd-serif); font-style:italic; font-size:18px; }

        .sds-deck {
          display:grid; grid-template-columns:auto 1fr auto; gap:24px; align-items:center;
          padding:18px 48px; border-bottom:1px dashed var(--sd-line-strong);
          font-family:var(--sd-mono); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--sd-ink-2);
        }
        .sds-deck p {
          font-family:var(--sd-sans); font-size:14px; letter-spacing:0; text-transform:none;
          color:var(--sd-ink-2); margin:0; line-height:1.6; font-weight:300; text-align:center;
        }

        /* sections — mirror .sdp-section, plus an outlined ghost numeral
           (top-right) so each chapter has a visual anchor, not just text */
        .sds-section { padding:56px 48px; border-bottom:1px solid var(--sd-line); position:relative; overflow:hidden; }
        .sds-section[data-ghost]::before {
          content:attr(data-ghost); position:absolute; top:-24px; right:24px; pointer-events:none;
          font-family:var(--sd-serif); font-style:italic; font-size:220px; line-height:1;
          color:transparent; -webkit-text-stroke:1px var(--sd-line-strong); opacity:.55;
        }
        .sds-section h2 { font-family:var(--sd-sans); font-weight:400; font-size:clamp(32px,4vw,54px); letter-spacing:-.03em; line-height:1; margin:0 0 28px; position:relative; }
        .sds-section h2 .num { font-family:var(--sd-serif); font-style:italic; font-size:.4em; color:var(--sd-ink-4); vertical-align:super; margin-right:14px; }
        .sds-section h2 em { font-family:var(--sd-serif); font-style:italic; font-weight:300; }

        .sds-story { display:grid; grid-template-columns:5fr 7fr; gap:48px; align-items:start; position:relative; }
        .sds-story[data-media="0"] { grid-template-columns:1fr; max-width:760px; }
        .sds-story p { font-size:16px; line-height:1.65; color:var(--sd-ink); font-weight:300; margin:0 0 18px; }
        .sds-story p:last-child { margin-bottom:0; }

        /* missions ledger — always visible under the story/photo grid */
        .sds-missions { margin-top:36px; border-top:1px dashed var(--sd-line-strong); padding-top:8px; }
        .sds-missions__lbl {
          font-family:var(--sd-mono); font-size:12px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--sd-ink-2); padding:14px 0 6px;
        }
        .sds-mission {
          display:grid; grid-template-columns:64px 1fr; gap:28px; align-items:baseline;
          padding:18px 8px; border-bottom:1px solid var(--sd-line);
          transition:background .2s, padding-left .25s;
        }
        .sds-mission:last-child { border-bottom:0; }
        .sds-mission:hover { background:var(--sd-bg-2); padding-left:20px; }
        .sds-mission__no { font-family:var(--sd-serif); font-style:italic; font-size:30px; color:var(--sd-accent); line-height:1; }
        .sds-mission p { font-size:16px; line-height:1.6; color:var(--sd-ink); margin:0; font-weight:300; max-width:820px; }

        /* fixed-height scroll card for long manifestos */
        .sds-story__scroll {
          max-height:300px; overflow-y:auto; padding:24px 22px;
          border:1px solid var(--sd-line); border-radius:18px; background:var(--sd-bg-2);
          scrollbar-width:thin; scrollbar-color:var(--sd-line-strong) transparent;
        }
        .sds-story__scroll::-webkit-scrollbar { width:5px; }
        .sds-story__scroll::-webkit-scrollbar-thumb { background:var(--sd-line-strong); border-radius:999px; }
        .sds-story__hint { display:inline-block; margin-top:12px; font-family:var(--sd-mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--sd-ink-2); }

        .sds-story__media { position:relative; border:1px solid var(--sd-line); border-radius:18px; overflow:hidden; background:var(--sd-bg-2); max-height:420px; margin:0; cursor:zoom-in; }
        .sds-story__media img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .35s; }
        .sds-story__media:hover img { transform:scale(1.025); }
        .sds-story__cap {
          position:absolute; left:12px; bottom:12px; font-family:var(--sd-mono); font-size:11px;
          letter-spacing:.12em; text-transform:uppercase; color:var(--sd-ink);
          background:rgba(20,20,15,.78); border:1px solid var(--sd-line); padding:5px 12px; border-radius:999px;
        }

        .sds-policies { border-top:1px solid var(--sd-line-strong); }
        .sds-policy {
          display:grid; grid-template-columns:80px 1fr auto; gap:40px; align-items:baseline;
          padding:28px 8px; border-bottom:1px solid var(--sd-line);
          transition:background .2s, padding-left .25s;
        }
        .sds-policy:hover { background:var(--sd-bg-2); padding-left:24px; }
        .sds-policy__no { font-family:var(--sd-sans); font-weight:400; font-size:48px; letter-spacing:-.04em; color:var(--sd-ink-4); line-height:.9; transition:color .2s; }
        .sds-policy:hover .sds-policy__no { color:var(--sd-accent); }
        .sds-policy__body p { font-size:16px; line-height:1.6; color:var(--sd-ink); margin:0; font-weight:300; max-width:720px; }
        .sds-policy__tag { font-family:var(--sd-mono); font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--sd-ink-2); opacity:0; transition:opacity .25s; white-space:nowrap; }
        .sds-policy:hover .sds-policy__tag { opacity:1; }

        .sds-roster { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
        .sds-tile {
          background:var(--sd-bg-2); border:1px solid var(--sd-line); border-radius:16px; padding:14px;
          transition:border-color .2s, transform .2s; cursor:pointer; text-align:left;
          font:inherit; color:inherit; display:block; width:100%;
        }
        .sds-tile:hover, .sds-tile:focus-visible { border-color:var(--sd-accent); transform:translateY(-3px); outline:none; }
        .sds-tile__photo { aspect-ratio:4/5; border-radius:10px; margin-bottom:14px; overflow:hidden; position:relative; border:1px solid var(--sd-line); background:var(--sd-bg); }
        .sds-tile__photo img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:transform .35s; }
        .sds-tile:hover .sds-tile__photo img { transform:scale(1.04); }
        .sds-tile__idx {
          position:absolute; top:8px; left:8px; font-family:var(--sd-mono); font-size:10px; letter-spacing:.12em;
          color:var(--sd-ink); background:rgba(20,20,15,.75); border:1px solid var(--sd-line); padding:3px 8px; border-radius:999px;
        }
        .sds-tile__zoom {
          position:absolute; right:8px; bottom:8px; font-family:var(--sd-mono); font-size:10px; letter-spacing:.12em;
          color:var(--sd-bg); background:var(--sd-accent); padding:3px 9px; border-radius:999px; font-weight:600;
          opacity:0; transform:translateY(4px); transition:opacity .2s, transform .2s;
        }
        .sds-tile:hover .sds-tile__zoom, .sds-tile:focus-visible .sds-tile__zoom { opacity:1; transform:translateY(0); }
        .sds-tile__name { font-family:var(--sd-sans); font-weight:500; font-size:14px; line-height:1.25; margin-bottom:4px; color:var(--sd-ink); }
        .sds-tile__role { font-family:var(--sd-mono); font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--sd-ink-2); }

        /* marquee divider (motion driven by framer in JSX) */
        .sds-marquee { overflow:hidden; border-bottom:1px solid var(--sd-line); padding:16px 0; }
        .sds-marquee__track {
          display:flex; white-space:nowrap; width:max-content;
          font-family:var(--sd-mono); font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:var(--sd-ink-2);
        }

        /* ballot — mirrors .sdv-strip on the multi vote page */
        .sds-section--ballot { border-bottom:0; padding-bottom:32px; }
        .sds-ballot-intro {
          display:flex; justify-content:space-between; gap:24px;
          padding-bottom:18px; margin-bottom:8px;
          font-family:var(--sd-mono); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--sd-ink-2);
          border-bottom:1px dashed var(--sd-line-strong);
        }
        .sds-strip {
          display:grid; grid-template-columns:100px 1fr auto; gap:32px; align-items:center;
          padding:28px 28px 28px 0; border-bottom:1px solid var(--sd-line);
          cursor:pointer; position:relative; outline:none;
          transition:background .2s, padding-left .25s;
        }
        .sds-strip:hover, .sds-strip:focus-visible, .sds-strip.is-selected { background:var(--sd-bg-2); padding-left:28px; }
        .sds-strip.is-selected::before { content:""; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--sd-accent); }
        .sds-strip--dashed { border-bottom:0; border-top:1px dashed var(--sd-line-strong); margin-top:12px; padding-top:28px; }
        .sds-strip--dashed + .sds-strip--dashed { margin-top:0; border-top-style:solid; border-top-color:var(--sd-line); }
        .sds-strip__no {
          font-family:var(--sd-sans); font-weight:400; font-size:72px; line-height:.85; letter-spacing:-.06em;
          color:var(--sd-ink-4); transition:color .2s; text-align:left;
        }
        .sds-strip__no--sm { font-size:48px; }
        .sds-strip:hover .sds-strip__no, .sds-strip.is-selected .sds-strip__no { color:var(--sd-accent); }
        .sds-yes { font-size:.85em; }
        .sds-strip__main { min-width:0; }
        .sds-strip__kicker { font-family:var(--sd-mono); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--sd-ink-2); margin-bottom:6px; }
        .sds-strip__name { font-family:var(--sd-sans); font-weight:400; font-size:clamp(20px,2.4vw,28px); letter-spacing:-.025em; line-height:1.05; margin:0 0 6px; color:var(--sd-ink); }
        .sds-strip__slogan { font-family:var(--sd-serif); font-style:italic; color:var(--sd-ink-2); font-size:15px; margin:0; line-height:1.4; }
        .sds-strip__check {
          width:36px; height:36px; border:1px solid var(--sd-line-strong); border-radius:999px;
          display:grid; place-items:center; color:var(--sd-ink-3); flex-shrink:0; transition:all .2s;
        }
        .sds-strip__check svg { opacity:0; transition:opacity .2s; }
        .sds-strip.is-selected .sds-strip__check { background:var(--sd-accent); border-color:var(--sd-accent); color:var(--sd-bg); }
        .sds-strip.is-selected .sds-strip__check svg { opacity:1; }

        .sds-footer {
          position:sticky; bottom:16px; margin:32px 0 8px;
          background:var(--sd-bg-2); border:1px solid var(--sd-line); border-radius:999px;
          padding:12px 12px 12px 28px; display:flex; align-items:center; justify-content:space-between; gap:24px;
          box-shadow:0 16px 48px rgba(0,0,0,.4); z-index:10;
        }
        .sds-footer__lbl { font-family:var(--sd-mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--sd-ink-2); }
        .sds-footer__val { font-family:var(--sd-sans); font-size:15px; color:var(--sd-ink); font-weight:500; margin-top:4px; }

        /* confirm dialog */
        .sds-cm {
          position:fixed; inset:0; z-index:9100; display:grid; place-items:center;
          background:rgba(10,10,7,.78); backdrop-filter:blur(6px); padding:24px;
        }
        .sds-cm__card {
          width:min(480px, 100%); background:var(--sd-bg-2); border:1px solid var(--sd-line-strong);
          border-radius:24px; padding:36px; text-align:center;
        }
        .sds-cm__eyebrow { font-family:var(--sd-mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--sd-ink-2); margin-bottom:18px; }
        .sds-cm__title { font-family:var(--sd-sans); font-weight:400; font-size:30px; letter-spacing:-.03em; margin:0 0 10px; color:var(--sd-ink); }
        .sds-cm__sub { font-size:14px; color:var(--sd-ink-2); margin:0 0 22px; font-weight:300; }
        .sds-cm__sub strong { color:var(--sd-accent); font-weight:500; }
        .sds-cm__pick { border:1px dashed var(--sd-line-strong); border-radius:14px; padding:14px 18px; margin-bottom:24px; }
        .sds-cm__pick-lbl { display:block; font-family:var(--sd-mono); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--sd-ink-2); margin-bottom:6px; }
        .sds-cm__pick-val { font-family:var(--sd-sans); font-size:17px; color:var(--sd-ink); font-weight:500; }
        .sds-cm__actions { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }

        @media (max-width:1100px) {
          .sds-h { grid-template-columns:1fr; gap:20px; padding:36px 24px 24px; }
          .sds-h__side { flex-direction:row-reverse; align-items:center; justify-content:flex-end; gap:24px; }
          .sds-h__logo { width:96px; height:96px; }
          .sds-h__quick { display:flex; gap:24px; }
          .sds-h__row { text-align:left; }
          .sds-section[data-ghost]::before { font-size:120px; top:-12px; right:12px; }
          .sds-deck { grid-template-columns:1fr; gap:10px; padding:16px 24px; text-align:left; }
          .sds-deck p { text-align:left; }
          .sds-section { padding:36px 24px; }
          .sds-story { grid-template-columns:1fr; gap:24px; }
          .sds-policy { grid-template-columns:56px 1fr; }
          .sds-policy__tag { display:none; }
          .sds-roster { grid-template-columns:repeat(3,1fr); }
          .sds-strip { grid-template-columns:60px 1fr auto; gap:20px; padding-right:16px; }
          .sds-strip__no { font-size:52px; }
          .sds-strip__no--sm { font-size:38px; }
        }
        @media (max-width:560px) {
          .sds-roster { grid-template-columns:repeat(2,1fr); }
          .sds-footer { flex-direction:column; align-items:stretch; gap:12px; border-radius:24px; padding:16px; text-align:center; bottom:8px; }
        }
      `}</style>
    </StudioDarkShell>
  );
}
