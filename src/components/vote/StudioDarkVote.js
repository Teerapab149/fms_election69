"use client";

// StudioDarkVote — the VOTE (ballot) page layout for the Studio Dark v2
// template. Rendered by /vote when activeTemplateId === 'studio-dark'.
//
// Faithful to docs/design-refs/Studio Dark v2.html §04: scene header ("Choose
// one, then confirm." + personal greeting) → ballot intro rule → horizontal
// COMPARE STRIPS (oversized number, kicker, name, slogan, meta column with
// candidates/policies + view-profile chip, check circle that fills lime on
// select) → dashed-rule special option → sticky pill confirm footer that stays
// disabled until a choice is made.
//
// Election correctness — same vote-system contract as GumroadVote /
// MultiPartyView: regularParties + specialOptions{abstain,disapprove} +
// selectedPartyId + onSelect(id) + onViewDetails(party) + onConfirm (parent owns
// submit + the confirmation modal).
//
// SINGLE-PARTY MODE (1 real party): dispatches to StudioDarkSingleParty — the
// full party presentation (intro overlay → vision/policies/team → official
// 3-choice ballot รับรอง / ไม่รับรอง / งดออกเสียง), same dispatch pattern as
// GumroadVote → GumroadSingleParty. This file renders the MULTI ballot only.

import { Check } from "lucide-react";
import StudioDarkShell from "./StudioDarkShell";
import StudioDarkSingleParty from "./StudioDarkSingleParty";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");

function Strip({ no, noClass = "", kicker, name, slogan, meta = null, selected, onClick, dashedTop = false }) {
  return (
    <article
      className={`sdv-strip ${selected ? "is-selected" : ""} ${dashedTop ? "sdv-strip--dashed" : ""}`}
      onClick={onClick}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
    >
      <div className={`sdv-strip__no ${noClass}`}>{no}</div>
      <div className="sdv-strip__main">
        <div className="sdv-strip__kicker">{kicker}</div>
        <h3 className="sdv-strip__name">{name}</h3>
        {slogan && <p className="sdv-strip__slogan">{slogan}</p>}
      </div>
      <div className="sdv-strip__meta">{meta}</div>
      <div className="sdv-strip__check"><Check size={15} strokeWidth={3} /></div>
    </article>
  );
}

export default function StudioDarkVote({
  regularParties = [],
  specialOptions = {},
  selectedPartyId = null,
  onSelect = () => {},
  onViewDetails = () => {},
  isSingleParty = false,
  user = null,
  onConfirm = () => {},
  isSubmitting = false,
  editorMode = false,
}) {
  // Single party → full party-presentation view (intro + sections + 3-choice).
  if (isSingleParty) {
    return (
      <StudioDarkSingleParty
        party={regularParties[0] || {}}
        specialOptions={specialOptions}
        selectedPartyId={selectedPartyId}
        onSelect={onSelect}
        onConfirm={onConfirm}
        isSubmitting={isSubmitting}
        user={user}
        editorMode={editorMode}
      />
    );
  }

  const abstain = specialOptions?.abstain;
  const disapprove = specialOptions?.disapprove;

  // selection label for the footer
  const selectedName = (() => {
    if (selectedPartyId == null) return null;
    const p = regularParties.find((x) => x.id === selectedPartyId);
    if (p) return `№ ${pad2(p.number)} — ${p.name}`;
    if (disapprove?.id === selectedPartyId) return "ไม่รับรอง · Disapprove";
    if (abstain?.id === selectedPartyId) return "งดออกเสียง · Abstain";
    return null;
  })();

  const userName = user?.name || "";
  const viewMeta = (party) => (
    <>
      <div className="sdv-strip__mrow"><span>Candidates</span><strong>{party.members?.length || "—"}</strong></div>
      <div className="sdv-strip__mrow"><span>Policies</span><strong>{Array.isArray(party.policies) ? party.policies.length : "—"}</strong></div>
      <button
        type="button"
        className="sdv-strip__view"
        onClick={(e) => { e.stopPropagation(); onViewDetails(party); }}
      >
        View profile →
      </button>
    </>
  );

  return (
    <StudioDarkShell
      active="vote"
      num="04"
      label="Vote"
      labelTh="ลงคะแนนเสียง"
      editorMode={editorMode}
      right={<span>SECURED BY PSU PASSPORT</span>}
    >
      <div className="sd-scene-h">
        <div>
          <span className="sd-scene-h__num"><span className="accent">№ 04</span> &nbsp;/&nbsp; THE VOTE</span>
          <h1 className="sd-scene-h__title">Choose <em>one,</em><br />then confirm.</h1>
        </div>
        <p className="sd-scene-h__deck">
          {userName ? <>สวัสดีคุณ <strong className="sdv-uname">{userName}</strong> — </> : null}
          กรุณาเลือกหนึ่งตัวเลือกจากด้านล่าง การลงคะแนนทำได้เพียงครั้งเดียวเท่านั้น
        </p>
      </div>

      <div className="sdv-ballot">
        <div className="sdv-intro">
          <span><span className="sdv-accent">●</span> VOTE OPEN</span>
          <span className="sdv-intro__mid">{`${regularParties.length} PARTIES + ABSTAIN`}</span>
          <span>ONE VOTE ONLY</span>
        </div>

        {/* PARTY STRIPS */}
        {regularParties.map((p) => {
          const no = pad2(p.number);
          return (
            <Strip
              key={p.id}
              no={<>{no.slice(0, -1)}<em>{no.slice(-1)}</em></>}
              kicker={<>PARTY <span className="sdv-accent">№ {no}</span></>}
              name={p.name}
              slogan={p.slogan ? `"${p.slogan}"` : null}
              meta={viewMeta(p)}
              selected={selectedPartyId === p.id}
              onClick={() => onSelect(p.id)}
            />
          );
        })}

        {/* SPECIAL OPTION */}
        {abstain && (
          <Strip
            no="×"
            noClass="sdv-strip__no--sm"
            kicker="ABSTAIN"
            name="งดออกเสียง"
            slogan="ไม่ประสงค์ลงคะแนนเสียงในการเลือกตั้งครั้งนี้"
            selected={selectedPartyId === abstain.id}
            onClick={() => onSelect(abstain.id)}
            dashedTop
          />
        )}

        {/* STICKY CONFIRM FOOTER */}
        <div className="sdv-footer">
          <div className="sdv-footer__sel">
            <div className="sdv-footer__lbl">YOUR SELECTION</div>
            <div className="sdv-footer__val">{selectedName || "ยังไม่ได้เลือก · None"}</div>
          </div>
          <button
            type="button"
            className="sd-btn sd-btn--accent sd-btn--lg"
            disabled={selectedPartyId == null || isSubmitting}
            onClick={() => onConfirm()}
          >
            {isSubmitting ? "กำลังบันทึก…" : "ยืนยันการลงคะแนน →"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .sdv-accent { color:var(--sd-accent); }
        .sdv-uname { color:var(--sd-ink); font-weight:500; }

        .sdv-ballot { padding:40px 48px 32px; flex:1; display:flex; flex-direction:column; }
        .sdv-intro {
          display:grid; grid-template-columns:auto 1fr auto; gap:24px; align-items:center;
          padding-bottom:18px; margin-bottom:8px;
          font-family:var(--sd-mono); font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--sd-ink-3);
          border-bottom:1px dashed var(--sd-line-strong);
        }
        .sdv-intro__mid { text-align:center; }

        /* strips */
        .sdv-strip {
          display:grid; grid-template-columns:100px 1fr 1.2fr auto; gap:32px; align-items:center;
          padding:28px 28px 28px 0; border-bottom:1px solid var(--sd-line);
          cursor:pointer; position:relative; outline:none;
          transition:background .2s, padding-left .25s;
        }
        .sdv-strip:hover, .sdv-strip:focus-visible, .sdv-strip.is-selected { background:var(--sd-bg-2); padding-left:28px; }
        .sdv-strip.is-selected::before { content:""; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--sd-accent); }
        .sdv-strip--dashed { border-bottom:0; border-top:1px dashed var(--sd-line-strong); margin-top:12px; padding-top:28px; }
        .sdv-strip--dashed + .sdv-strip--dashed { margin-top:0; border-top-style:solid; border-top-color:var(--sd-line); }

        .sdv-strip__no {
          font-family:var(--sd-sans); font-weight:400; font-size:72px; line-height:.85; letter-spacing:-.06em;
          color:var(--sd-ink-4); transition:color .2s; text-align:left;
        }
        .sdv-strip__no--sm { font-size:48px; }
        .sdv-strip:hover .sdv-strip__no, .sdv-strip.is-selected .sdv-strip__no { color:var(--sd-accent); }

        .sdv-strip__main { min-width:0; }
        .sdv-strip__kicker { font-family:var(--sd-mono); font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:var(--sd-ink-3); margin-bottom:6px; }
        .sdv-strip__name { font-family:var(--sd-sans); font-weight:400; font-size:clamp(20px,2.4vw,28px); letter-spacing:-.025em; line-height:1.05; margin:0 0 6px; color:var(--sd-ink); }
        .sdv-strip__slogan { font-family:var(--sd-serif); font-style:italic; color:var(--sd-ink-2); font-size:15px; margin:0; line-height:1.4; }

        .sdv-strip__meta { font-family:var(--sd-mono); font-size:11px; letter-spacing:.15em; text-transform:uppercase; color:var(--sd-ink-3); line-height:1.6; min-width:0; }
        .sdv-strip__mrow { display:flex; justify-content:space-between; gap:24px; }
        .sdv-strip__mrow strong { color:var(--sd-ink); font-weight:400; font-family:var(--sd-sans); }
        .sdv-strip__view {
          display:inline-flex; align-items:center; gap:8px; margin-top:12px; padding:6px 14px;
          border:1px solid var(--sd-line-strong); border-radius:999px; background:none; cursor:pointer;
          font-family:var(--sd-mono); font-size:10px; letter-spacing:.15em; color:var(--sd-ink-2); text-transform:uppercase;
          transition:all .2s;
        }
        .sdv-strip__view:hover { background:var(--sd-accent); border-color:var(--sd-accent); color:var(--sd-bg); }

        .sdv-strip__check {
          width:36px; height:36px; border:1px solid var(--sd-line-strong); border-radius:999px;
          display:grid; place-items:center; color:var(--sd-ink-3); flex-shrink:0; transition:all .2s;
        }
        .sdv-strip__check svg { opacity:0; transition:opacity .2s; }
        .sdv-strip.is-selected .sdv-strip__check { background:var(--sd-accent); border-color:var(--sd-accent); color:var(--sd-bg); }
        .sdv-strip.is-selected .sdv-strip__check svg { opacity:1; }

        /* sticky confirm footer */
        .sdv-footer {
          position:sticky; bottom:16px; margin:32px 0 8px;
          background:var(--sd-bg-2); border:1px solid var(--sd-line); border-radius:999px;
          padding:12px 12px 12px 28px; display:flex; align-items:center; justify-content:space-between; gap:24px;
          box-shadow:0 16px 48px rgba(0,0,0,.4); z-index:10;
        }
        .sdv-footer__lbl { font-family:var(--sd-mono); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--sd-ink-3); }
        .sdv-footer__val { font-family:var(--sd-sans); font-size:15px; color:var(--sd-ink); font-weight:500; margin-top:4px; }

        @media (max-width:1100px) {
          .sdv-ballot { padding:28px 24px; }
          .sdv-strip { grid-template-columns:60px 1fr auto; gap:20px; padding-right:16px; }
          .sdv-strip__meta { display:none; }
          .sdv-strip__no { font-size:52px; }
          .sdv-strip__no--sm { font-size:38px; }
        }
        @media (max-width:560px) {
          .sdv-intro { grid-template-columns:1fr; gap:6px; text-align:left; }
          .sdv-intro__mid { text-align:left; }
          .sdv-footer { flex-direction:column; align-items:stretch; gap:12px; border-radius:24px; padding:16px; text-align:center; bottom:8px; }
        }
      `}</style>
    </StudioDarkShell>
  );
}
