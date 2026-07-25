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

import { useEffect, useMemo, useState } from "react";
import VerdureShell from "./VerdureShell";
import VerdureSingleParty from "./VerdureSingleParty";
import { getPath } from "../../utils/basePath";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { resolveElectionDates } from "../../utils/electionConfig";
import { verdureMeta } from "../home/VerdureChrome";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

// "ปิดใน 3 วัน 08:47:07" — remaining time to ELECTION_END for the meta strip.
// Day segment only when d > 0; null when the end has passed (the ballot page is
// only reachable while polls are open — no closed state is invented here).
const fmtCloseIn = (end) => {
  const ms = (end instanceof Date ? end.getTime() : NaN) - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  return `${d > 0 ? `${d} วัน ` : ""}${pad2(Math.floor((s / 3600) % 24))}:${pad2(Math.floor((s / 60) % 60))}:${pad2(s % 60)}`;
};

function Opt({ disc, discSm = false, logoUrl = null, num = null, kicker, name, slogan, more = null, selected, onClick, abstain = false }) {
  const logo = resolveSrc(logoUrl);
  return (
    <article className={`vd-opt ${abstain ? "vd-opt--abstain" : ""} ${selected ? "is-selected" : ""}`}
      onClick={onClick} role="radio" aria-checked={selected} tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}>
      <div className={`vd-opt__disc ${discSm ? "sm" : ""} ${logo ? "has-logo" : ""}`}>
        {logo ? (<><span className="vd-opt__logo"><img src={logo} alt="" /></span><span className="vd-opt__num">{num}</span></>) : disc}
      </div>
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
  const gc = useGlobalConfig();
  const meta = verdureMeta(gc);

  // live close-clock (vd-B1B) — hooks sit ABOVE the single-party dispatch so the
  // hook order is stable. editorMode: compute once, no interval (the editor
  // preview must not tick); single-party: the interval is skipped (unused there).
  const { ELECTION_END } = useMemo(
    () => resolveElectionDates(gc),
    [gc?.campaignStartAt, gc?.electionStartAt, gc?.electionEndAt]
  );
  const [closeIn, setCloseIn] = useState(() => fmtCloseIn(ELECTION_END));
  useEffect(() => {
    if (editorMode || isSingleParty) return undefined;
    setCloseIn(fmtCloseIn(ELECTION_END));
    const id = setInterval(() => setCloseIn(fmtCloseIn(ELECTION_END)), 1000);
    return () => clearInterval(id);
  }, [editorMode, isSingleParty, ELECTION_END]);

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
          <div className="vd-ballot__kicker"><span className="rule" /> {meta.wordmark} · เลือกตั้งประจำปี {meta.ay} <span className="rule" /></div>
          <h1 className="vd-ballot__title">Choose <em>one.</em></h1>
          <div className="vd-ballot__accent" aria-hidden />
          <p className="vd-ballot__deck">{userName ? <>สวัสดี {userName} — </> : null}กรุณาเลือกหนึ่งตัวเลือกด้านล่าง การลงคะแนนสามารถทำได้เพียงครั้งเดียว</p>
        </div>

        <div className="vd-ballot__meta">
          <span><span className="ac">●</span> BALLOT OPEN</span>
          {/* suppressHydrationWarning on the element that OWNS the ticking text
              node — SSR + client render the clock a second apart by nature */}
          {closeIn && <span className="vd-ballot__cd">ปิดใน <strong className="vd-tabular" suppressHydrationWarning>{closeIn}</strong></span>}
          <span>{regularParties.length} {regularParties.length === 1 ? "PARTY" : "PARTIES"}</span>
          <span>ONE VOTE ONLY</span>
        </div>

        <div className="vd-parties">
        {regularParties.map((p) => (
          <Opt key={p.id}
            disc={p.number}
            logoUrl={p.logoUrl}
            num={p.number}
            kicker={<>PARTY No. {pad2(p.number)}</>}
            name={p.name}
            slogan={p.slogan ? `"${p.slogan}"` : null}
            more={<a className="vd-opt__more" href={getPath(`/party?id=${p.number}`)} onClick={(e) => e.stopPropagation()}>VIEW PROFILE →</a>}
            selected={selectedPartyId === p.id}
            onClick={() => onSelect(p.id)}
          />
        ))}
        </div>

        {abstain && (
          <Opt disc="×" discSm abstain kicker="ABSTAIN" name="งดออกเสียง"
            slogan="ไม่ประสงค์ลงคะแนนเสียงในการเลือกตั้งครั้งนี้"
            selected={selectedPartyId === abstain.id} onClick={() => onSelect(abstain.id)} />
        )}

        <div className="vd-confirm">
          <div>
            <div className="vd-confirm__lbl">YOUR SELECTION</div>
            {/* key remount on selection change → one-shot settle animation (CSS,
                visible throughout — from-state is translated, never opacity-0) */}
            <div className="vd-confirm__val" key={selectedName || "none"}>{selectedName || "ยังไม่ได้เลือก · No selection"}</div>
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
            radial-gradient(72% 46% at 50% 0%, rgba(var(--gold-rgb),.16) 0%, transparent 56%),
            radial-gradient(60% 44% at 100% 8%, rgba(var(--terra-rgb),.09) 0%, transparent 50%),
            radial-gradient(66% 52% at 0% 100%, rgba(var(--terra-soft-rgb),.30) 0%, transparent 56%),
            linear-gradient(168deg, var(--cream-2) 0%, var(--cream) 46%, var(--cream-3) 100%); }

        .vd-ballot { flex:1; padding:96px 80px 150px; max-width:980px; margin:0 auto; width:100%; position:relative; z-index:1; }
        .vd-ballot__h { text-align:center; margin-bottom:44px; }
        .vd-ballot__kicker { display:inline-flex; align-items:center; gap:14px; font-family:var(--fm); font-size:11px; letter-spacing:.25em; text-transform:uppercase; color:var(--terra-2); margin-bottom:18px; }
        .vd-ballot__kicker .rule { width:36px; height:1px; background:var(--rule); }
        .vd-ballot__title { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(48px,6vw,80px); line-height:.96; letter-spacing:-.015em; margin:0; color:var(--moss); }
        .vd-ballot__title em { color:var(--terra); }
        .vd-ballot__accent { width:84px; height:2px; background:var(--terra); margin:22px auto 0; }
        .vd-ballot__deck { font-family:var(--ft); font-size:16px; color:rgba(var(--moss-rgb),.82); line-height:1.55; margin:18px auto 0; max-width:540px; }

        .vd-ballot__meta { display:flex; justify-content:space-between; align-items:center; padding:14px 24px; background:var(--cream-2); border:1px dashed var(--rule); border-radius:999px; margin-bottom:22px; font-family:var(--fm); font-size:11px; letter-spacing:.15em; text-transform:uppercase; color:var(--moss); opacity:.85; }
        .vd-ballot__meta .ac { color:var(--terra); font-weight:700; }
        /* live close-clock segment — same mono voice as the strip, terra accent
           on the ticking digits (vd-tabular keeps them from jittering) */
        .vd-ballot__cd { white-space:nowrap; }
        .vd-ballot__cd strong { font-weight:700; color:var(--terra); letter-spacing:.08em; margin-left:2px; }

        .vd-opt { display:grid; grid-template-columns:88px 1fr auto; align-items:center; gap:24px; padding:20px 28px 20px 20px; background:var(--cream-2); border:1px solid var(--rule); border-radius:28px; cursor:pointer; margin-bottom:12px; transition:all .25s; position:relative; outline:none; box-shadow:0 10px 26px -22px rgba(var(--moss-rgb),.3); }
        .vd-opt:hover, .vd-opt:focus-visible { background:var(--cream); border-color:var(--terra-soft); transform:translateY(-2px); box-shadow:0 20px 40px -26px rgba(var(--moss-rgb),.4); }
        .vd-opt.is-selected { background:var(--moss); color:var(--cream); border-color:var(--moss); box-shadow:0 26px 50px -28px rgba(var(--moss-rgb),.55); }
        /* each party reads as a warm, inviting card (mirrors the booth's primary option) */
        .vd-opt:not(.vd-opt--abstain):not(.is-selected) { border-color:var(--terra-soft); background:linear-gradient(180deg, var(--cream-2) 0%, var(--cream-2) 100%); }
        .vd-opt:not(.vd-opt--abstain):not(.is-selected) .vd-opt__disc { background:var(--terra-soft); border-color:var(--terra-soft); }

        /* GRID of party tiles — every party visible at once, equal weight (no top-bias) */
        .vd-parties { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:14px; margin-bottom:14px; }
        .vd-parties .vd-opt { display:flex; flex-direction:column; gap:8px; padding:22px 20px; margin-bottom:0; height:100%; }
        .vd-parties .vd-opt__check { position:absolute; top:16px; right:16px; }
        .vd-parties .vd-opt__kicker { display:none; }
        /* slogan restored on desktop tiles (vd-B1B) — clamped to 2 lines so tile
           heights stay balanced; VIEW PROFILE keeps its margin-top:auto anchor so
           a party without a slogan still bottom-aligns with its neighbours */
        /* the clamp forces overflow:hidden, which cuts at the PADDING box, and the
           Thai face (IBM Plex Sans Thai via --ft) draws its tone marks ABOVE the
           1.45 content box: measured needEm .044 for the worst admin-typed string
           (ปื๋ ฟื๊ ที่ ชี้ เพื่อ) and the live slogan already lost .1px off the top at
           1440/1024/768. .1em = .044 worst + .05 cushion; the equal negative margin
           keeps the margin box — and therefore the tile's flow — byte-identical.
           No padding-BOTTOM: the clamp cuts at that edge, so a bottom gutter would
           let the clamped-away third line back in. */
        .vd-parties .vd-opt__slogan { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; font-size:13px; line-height:1.45; margin:0 0 4px; padding-top:.1em; margin-top:-.1em; }
        .vd-parties .vd-opt__main { display:flex; flex-direction:column; flex:1; min-width:0; }
        .vd-parties .vd-opt__name { font-size:22px; margin-bottom:6px; }
        .vd-parties .vd-opt__more { margin-top:auto; align-self:flex-start; }
        @media (max-width:560px){
          .vd-parties { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
          /* phones keep the pre-vd-B1B decluttered tile — 2-col centred tiles are
             too tight for a 2-line slogan */
          .vd-parties .vd-opt__slogan { display:none; }
          .vd-parties .vd-opt { padding:16px 14px; align-items:center; text-align:center; }
          .vd-parties .vd-opt__main { align-items:center; text-align:center; }
          .vd-parties .vd-opt__more { align-self:center; }
          .vd-parties .vd-opt__name { font-size:19px; }
          .vd-parties .vd-opt__check { top:12px; right:12px; width:34px; height:34px; }
        }
        .vd-opt__disc { width:78px; height:78px; border-radius:50%; background:var(--cream-3); border:1px solid var(--rule); display:grid; place-items:center; font-family:var(--fd); font-style:italic; font-weight:400; font-size:48px; line-height:1; letter-spacing:-.04em; color:var(--moss); transition:all .25s; }
        .vd-opt__disc.sm { font-size:36px; }
        .vd-opt:hover .vd-opt__disc { background:var(--terra); color:var(--cream); border-color:var(--terra); }
        .vd-opt.is-selected .vd-opt__disc { background:var(--terra); color:var(--cream); border-color:var(--terra); }
        /* party LOGO disc — the recognisable identity gets the face; the ballot
           number moves to a bold terra badge on the corner (still prominent). The
           disc keeps a clean cream face at every state so the logo never sits on
           terra/moss. */
        /* party logos here are TALL artwork posters, not square marks — so the disc
           becomes a portrait rounded-rect (poster thumbnail) and the logo is shown
           in FULL via contain (never cropped/skewed). Aspect ~matches the posters
           so it fills cleanly; odd-shaped logos just letterbox on the cream. Inner
           clip wrapper keeps the number badge outside on the corner. */
        .vd-opt__disc.has-logo { width:78px; height:98px; border-radius:18px; background:var(--cream-2); border:1px solid var(--rule); overflow:visible; position:relative; }
        .vd-opt__logo { position:absolute; inset:0; border-radius:18px; overflow:hidden; background:var(--cream-2); display:grid; place-items:center; }
        .vd-opt__logo img { width:100%; height:100%; object-fit:contain; object-position:center; display:block; }
        .vd-opt:hover .vd-opt__disc.has-logo,
        .vd-opt.is-selected .vd-opt__disc.has-logo,
        .vd-opt:not(.vd-opt--abstain):not(.is-selected) .vd-opt__disc.has-logo { background:var(--cream-2); border-color:var(--rule); }
        .vd-opt__num { position:absolute; right:-4px; bottom:-4px; min-width:30px; height:30px; padding:0 7px; border-radius:999px; background:var(--terra); color:var(--cream); display:grid; place-items:center; font-family:var(--fd); font-style:italic; font-weight:400; font-size:18px; line-height:1; border:2px solid var(--cream-2); box-shadow:0 5px 12px -4px rgba(var(--moss-rgb),.55); }
        .vd-opt.is-selected .vd-opt__num { border-color:var(--moss); }
        .vd-opt__main { min-width:0; }
        .vd-opt__kicker { font-family:var(--fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--terra-2); margin-bottom:4px; }
        .vd-opt.is-selected .vd-opt__kicker { color:rgba(var(--cream-rgb),.7); opacity:1; }
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
        /* selection acknowledgement — the serif line settles in with a small
           spring on every change (key remount). From-state stays visible
           (opacity .35 + rise, never 0); reduced-motion / no-JS = instant text */
        .vd-confirm__val { font-family:var(--fd); font-style:italic; font-weight:400; font-size:22px; margin-top:4px; letter-spacing:-.005em; animation:vdValIn .38s cubic-bezier(.34,1.56,.64,1); }
        @keyframes vdValIn { from { opacity:.35; transform:translateY(7px); } }
        @media (prefers-reduced-motion: reduce) { .vd-confirm__val { animation:none; } }
        /* the confirm bar itself is moss — the global cta->moss hover would make
           the button vanish into the bar. Darken within the CTA family so the
           hover stays clearly distinct from the dark bar. */
        .vd-confirm .vd-btn--terra:hover { background:var(--cta-2); border-color:var(--cta-2); color:var(--cream); }

        @media (max-width:1100px) {
          .vd-ballot { padding:88px 22px 130px; }
          .vd-opt { grid-template-columns:74px 1fr auto; padding:18px; gap:18px; }
          .vd-opt__disc { width:64px; height:64px; font-size:38px; }
          .vd-opt__disc.has-logo { width:64px; height:80px; border-radius:15px; }
          .vd-opt__num { min-width:26px; height:26px; font-size:15px; right:-3px; bottom:-3px; }
          /* stacked + centred: full-width button so it balances the moss bar
             instead of sitting content-width to one side */
          .vd-confirm { grid-template-columns:1fr; text-align:center; gap:16px; padding:22px; justify-items:center; }
          .vd-confirm .vd-btn { width:100%; justify-content:center; }
        }
        /* phones — open up the cramped ballot: wrap the meta pill, drop the
           redundant check (the whole row turns moss when selected), and give the
           rows + text more breathing room */
        @media (max-width:600px) {
          .vd-ballot { padding:80px 16px 128px; }
          .vd-ballot__h { margin-bottom:30px; }
          .vd-ballot__deck { font-size:15px; }
          .vd-ballot__meta { flex-wrap:wrap; justify-content:center; gap:5px 14px; padding:12px 18px; font-size:10px; letter-spacing:.08em; margin-bottom:18px; }
          .vd-opt { grid-template-columns:60px 1fr; gap:15px; padding:15px; margin-bottom:14px; }
          /* declutter unselected rows, but make the SELECTED row unmistakable —
             a cream ✓ badge in the top-right corner (the moss fill alone read as
             "not selected" to the owner) */
          .vd-opt__check { display:none; }
          .vd-opt.is-selected .vd-opt__check { display:grid; position:absolute; top:12px; right:12px; width:28px; height:28px; font-size:14px; }
          .vd-opt__disc { width:60px; height:60px; font-size:34px; }
          .vd-opt__disc.has-logo { width:60px; height:76px; }
          .vd-opt__name { font-size:20px; line-height:1.2; }
          .vd-opt__slogan { font-size:13px; }
          .vd-opt__num { min-width:23px; height:23px; font-size:13px; }
        }
      `}</style>
    </VerdureShell>
  );
}
