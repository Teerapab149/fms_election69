"use client";

// VerdureVote — VOTE (ballot) page for the Verdure template. Faithful to
// docs/design-refs/verdure.css §ballot: cream screen, centred "Choose one."
// header, a dashed meta strip, then tactile rounded option rows (a round italic
// number disc, kicker/name/slogan/view-profile, and a round check that fills on
// select → the whole row turns moss), a dashed abstain row, and a moss confirm
// bar with the terracotta confirm button (disabled until a choice is made).
//
// Same vote-system contract as the other templates. SINGLE-PARTY dispatches to
// VerdureSingleParty.

import VerdureShell from "./VerdureShell";
import VerdureSingleParty from "./VerdureSingleParty";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");

function Opt({ disc, discSm = false, kicker, name, slogan, more = null, selected, onClick, abstain = false }) {
  return (
    <article className={`vd-opt ${abstain ? "vd-opt--abstain" : ""} ${selected ? "is-selected" : ""}`}
      onClick={onClick} role="radio" aria-checked={selected} tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}>
      <div className={`vd-opt__disc ${discSm ? "sm" : ""}`}>{disc}</div>
      <div className="vd-opt__main">
        <div className="vd-opt__kicker">{kicker}</div>
        <h3 className="vd-opt__name">{name}</h3>
        {slogan && <p className="vd-opt__slogan">{slogan}</p>}
        {more}
      </div>
      <div className="vd-opt__check">✓</div>
    </article>
  );
}

export default function VerdureVote({
  regularParties = [], specialOptions = {}, selectedPartyId = null,
  onSelect = () => {}, onViewDetails = () => {}, isSingleParty = false,
  user = null, onConfirm = () => {}, isSubmitting = false, editorMode = false,
}) {
  if (isSingleParty) {
    return (
      <VerdureSingleParty party={regularParties[0] || {}} specialOptions={specialOptions}
        selectedPartyId={selectedPartyId} onSelect={onSelect} onConfirm={onConfirm}
        isSubmitting={isSubmitting} user={user} editorMode={editorMode} />
    );
  }

  const abstain = specialOptions?.abstain;
  const disapprove = specialOptions?.disapprove;
  const userName = (user?.name || "").trim().split(" ")[0];

  const selectedName = (() => {
    if (selectedPartyId == null) return null;
    const p = regularParties.find((x) => x.id === selectedPartyId);
    if (p) return `No. ${pad2(p.number)} — ${p.name}`;
    if (disapprove?.id === selectedPartyId) return "ไม่รับรอง · Disapprove";
    if (abstain?.id === selectedPartyId) return "งดออกเสียง · Abstain";
    return null;
  })();

  return (
    <VerdureShell active="vote" editorMode={editorMode}
      edge={{ num: "04", label: "Ballot", th: "ลงคะแนนเสียง" }}
      cornermarkTitle="Ballot" cornermarkSub="Secure session"
      statusChip={<div className="vd-chip-live"><span className="dot" /> BALLOT · <strong>SECURE</strong></div>}>
      <div className="vd-warm-bg" aria-hidden />
      <div className="vd-ballot">
        <div className="vd-ballot__h">
          <div className="vd-ballot__kicker"><span className="rule" /> NO. 04 · BALLOT · ลงคะแนน <span className="rule" /></div>
          <h1 className="vd-ballot__title">Choose <em>one.</em></h1>
          <div className="vd-ballot__accent" aria-hidden />
          <p className="vd-ballot__deck">{userName ? <>สวัสดี {userName} — </> : null}กรุณาเลือกหนึ่งตัวเลือกด้านล่าง การลงคะแนนสามารถทำได้เพียงครั้งเดียว</p>
        </div>

        <div className="vd-ballot__meta">
          <span><span className="ac">●</span> BALLOT OPEN</span>
          <span>{regularParties.length} PARTIES + ABSTAIN</span>
          <span>ONE VOTE ONLY</span>
        </div>

        {regularParties.map((p) => (
          <Opt key={p.id}
            disc={p.number}
            kicker={<>PARTY No. {pad2(p.number)}</>}
            name={p.name}
            slogan={p.slogan ? `"${p.slogan}"` : null}
            more={<button type="button" className="vd-opt__more" onClick={(e) => { e.stopPropagation(); onViewDetails(p); }}>VIEW PROFILE →</button>}
            selected={selectedPartyId === p.id}
            onClick={() => onSelect(p.id)}
          />
        ))}

        {abstain && (
          <Opt disc="×" discSm abstain kicker="ABSTAIN" name="งดออกเสียง"
            slogan="ไม่ประสงค์ลงคะแนนเสียงในการเลือกตั้งครั้งนี้"
            selected={selectedPartyId === abstain.id} onClick={() => onSelect(abstain.id)} />
        )}

        <div className="vd-confirm">
          <div>
            <div className="vd-confirm__lbl">YOUR SELECTION</div>
            <div className="vd-confirm__val">{selectedName || "ยังไม่ได้เลือก · No selection"}</div>
          </div>
          <button type="button" className={`vd-btn vd-btn--terra vd-btn--lg ${selectedPartyId == null || isSubmitting ? "is-disabled" : ""}`}
            disabled={selectedPartyId == null || isSubmitting} onClick={() => onConfirm()}>
            {isSubmitting ? "กำลังบันทึก…" : "ยืนยันการลงคะแนน"} <span className="arr">↗</span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        /* golden-hour warm wash on the browser frame — matches the single-vote
           "ballot booth" so the multi ballot feels just as warm, not flat cream */
        .vd-warm-bg { position:fixed; inset:0; z-index:0; pointer-events:none;
          background:
            radial-gradient(72% 46% at 50% 0%, rgba(210,162,72,.16) 0%, transparent 56%),
            radial-gradient(60% 44% at 100% 8%, rgba(188,94,62,.09) 0%, transparent 50%),
            radial-gradient(66% 52% at 0% 100%, rgba(227,191,169,.30) 0%, transparent 56%),
            linear-gradient(168deg, #FBF3E3 0%, #F4ECDB 46%, #EFE2CB 100%); }

        .vd-ballot { flex:1; padding:96px 80px 150px; max-width:980px; margin:0 auto; width:100%; position:relative; z-index:1; }
        .vd-ballot__h { text-align:center; margin-bottom:44px; }
        .vd-ballot__kicker { display:inline-flex; align-items:center; gap:14px; font-family:var(--fm); font-size:11px; letter-spacing:.25em; text-transform:uppercase; color:var(--terra-2); margin-bottom:18px; }
        .vd-ballot__kicker .rule { width:36px; height:1px; background:var(--rule); }
        .vd-ballot__title { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(48px,6vw,80px); line-height:.96; letter-spacing:-.015em; margin:0; color:var(--moss); }
        .vd-ballot__title em { color:var(--terra); }
        .vd-ballot__accent { width:84px; height:2px; background:var(--terra); margin:22px auto 0; }
        .vd-ballot__deck { font-family:var(--ft); font-size:16px; color:rgba(31,58,44,.82); line-height:1.55; margin:18px auto 0; max-width:540px; }

        .vd-ballot__meta { display:flex; justify-content:space-between; align-items:center; padding:14px 24px; background:var(--cream-2); border:1px dashed var(--rule); border-radius:999px; margin-bottom:22px; font-family:var(--fm); font-size:11px; letter-spacing:.15em; text-transform:uppercase; color:var(--moss); opacity:.85; }
        .vd-ballot__meta .ac { color:var(--terra); font-weight:700; }

        .vd-opt { display:grid; grid-template-columns:96px 1fr auto; align-items:center; gap:24px; padding:24px 28px 24px 24px; background:var(--cream-2); border:1px solid var(--rule); border-radius:28px; cursor:pointer; margin-bottom:12px; transition:all .25s; position:relative; outline:none; box-shadow:0 10px 26px -22px rgba(31,58,44,.3); }
        .vd-opt:hover, .vd-opt:focus-visible { background:var(--cream); border-color:var(--terra-soft); transform:translateY(-2px); box-shadow:0 20px 40px -26px rgba(31,58,44,.4); }
        .vd-opt.is-selected { background:var(--moss); color:var(--cream); border-color:var(--moss); box-shadow:0 26px 50px -28px rgba(31,58,44,.55); }
        /* each party reads as a warm, inviting card (mirrors the booth's primary option) */
        .vd-opt:not(.vd-opt--abstain):not(.is-selected) { border-color:var(--terra-soft); background:linear-gradient(180deg, #FCF5E6 0%, var(--cream-2) 100%); }
        .vd-opt:not(.vd-opt--abstain):not(.is-selected) .vd-opt__disc { background:var(--terra-soft); border-color:var(--terra-soft); }
        .vd-opt__disc { width:80px; height:80px; border-radius:50%; background:var(--cream-3); border:1px solid var(--rule); display:grid; place-items:center; font-family:var(--fd); font-style:italic; font-weight:400; font-size:56px; line-height:1; letter-spacing:-.04em; color:var(--moss); transition:all .25s; }
        .vd-opt__disc.sm { font-size:36px; }
        .vd-opt:hover .vd-opt__disc { background:var(--terra); color:var(--cream); border-color:var(--terra); }
        .vd-opt.is-selected .vd-opt__disc { background:var(--terra); color:var(--cream); border-color:var(--terra); }
        .vd-opt__main { min-width:0; }
        .vd-opt__kicker { font-family:var(--fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--terra-2); margin-bottom:4px; }
        .vd-opt.is-selected .vd-opt__kicker { color:rgba(244,236,219,.7); opacity:1; }
        .vd-opt__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:26px; line-height:1.15; letter-spacing:-.015em; margin:0 0 4px; }
        .vd-opt__slogan { font-family:var(--ft); font-size:14px; opacity:.82; margin:0; line-height:1.4; }
        .vd-opt__more { display:inline-flex; align-items:center; gap:6px; margin-top:8px; font-family:var(--fm); font-size:10px; letter-spacing:.15em; text-transform:uppercase; color:var(--terra); border:0; border-bottom:1px solid currentColor; background:none; padding:0 0 1px; cursor:pointer; }
        .vd-opt.is-selected .vd-opt__more { color:var(--terra-soft); }
        .vd-opt__check { width:44px; height:44px; border-radius:50%; border:1px solid var(--rule); background:var(--cream); display:grid; place-items:center; color:var(--cream); font-size:18px; transition:all .25s; flex-shrink:0; }
        .vd-opt.is-selected .vd-opt__check { background:var(--cream); border-color:var(--cream); color:var(--moss); }
        .vd-opt--abstain { background:transparent; border-style:dashed; }
        .vd-opt--abstain .vd-opt__disc { background:var(--cream); }
        .vd-opt--abstain .vd-opt__name { font-size:20px; }

        .vd-confirm { display:grid; grid-template-columns:1fr auto; gap:24px; align-items:center; margin-top:36px; padding:24px 24px 24px 32px; background:var(--moss); color:var(--cream); border-radius:28px; }
        .vd-confirm__lbl { font-family:var(--fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase; opacity:.55; }
        .vd-confirm__val { font-family:var(--fd); font-style:italic; font-weight:400; font-size:22px; margin-top:4px; letter-spacing:-.005em; }

        @media (max-width:1100px) {
          .vd-ballot { padding:92px 24px 130px; }
          .vd-opt { grid-template-columns:64px 1fr auto; padding:18px; gap:16px; }
          .vd-opt__disc { width:56px; height:56px; font-size:36px; }
          .vd-confirm { grid-template-columns:1fr; text-align:center; }
        }
      `}</style>
    </VerdureShell>
  );
}
