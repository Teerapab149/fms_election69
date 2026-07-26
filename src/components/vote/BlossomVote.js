"use client";

// BlossomVote — VOTE (multi-party ballot) page for the "Blossom Civic" template
// family, in the "Candy Editorial" language (same family as BlossomHome /
// BlossomCandidates / BlossomResults / BlossomSuccess, a UNIQUE page). This is
// Blossom's BALLOT moment — an editorial "ballot paper":
//   • masthead: mono issue-line + a hollow display word ("เลือกพรรค"), then a mono
//     "one vote only" meta strip and a mono voter receipt (VOTER ID / NAME — the
//     same receipt grammar as BlossomSuccess)
//   • party choices as editorial INDEX ROWS (big pad2 party number · logo ·
//     name/kicker/slogan/member count · "ดูรายละเอียด →" → onViewDetails). The
//     SELECTED row is unmistakable ink+candy: ink border, primary-soft wash, and a
//     SOLID diamond marker (geometry only — no check icons)
//   • งดออกเสียง (abstain) renders as a quieter row that KEEPS its semantic ORANGE
//     coding (the same ส้ม family as the classic MultiPartyView / the shared
//     VoteConfirmationModal) — this is a semantic vote colour, deliberately NOT
//     repainted into candy. ไม่รับรอง (disapprove, number = -1) is a single-party-
//     only choice (project convention) and is never rendered in the multi ballot,
//     matching MultiPartyView / VerdureVote.
//   • a fixed confirm bar in Blossom chrome shows the current selection + a confirm
//     button → onConfirm() (opens the SHARED VoteConfirmationModal owned by
//     vote/page.js — its markup/semantics are untouched here)
//
// SINGLE-PARTY (T3.3): when only one party stands, BlossomVote dispatches to
// BlossomSingleParty (the calm Candy Editorial booth) — the same internal-dispatch
// recipe the other families use (VerdureVote -> VerdureSingleParty). vote/page.js
// routes ALL blossom /vote here (single + multi) and passes onConfirm = the direct
// submit for single, or the shared-modal opener for multi.
//
// Pure presentation: vote/page.js owns auth, the vote-system hook, PartyDetailModal
// + VoteConfirmationModal + the submit/redirect flow. Colours flow ONLY through
// var(--bl-*) emitted by BlossomBaseStyles on .bl-root (the one exception is the
// abstain row's semantic orange, above). The chrome (topbar + footer + blobs +
// dot-grid) mirrors BlossomHome byte-for-byte (only one Blossom page renders at a
// time, so the CSS is carried locally).

import { useEffect, useMemo, useState } from "react";
import { getPath } from "../../utils/basePath";
import { BlossomTopBar } from "../home/BlossomHome";
import { BlossomBaseStyles } from "../home/BlossomTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { resolveElectionDates } from "../../utils/electionConfig";
import BlossomSingleParty from "./BlossomSingleParty";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

// remaining time to ELECTION_END for the ballot meta strip — { d, hms } so the
// Thai "วัน" segment renders in the body font (--bl-fb) while HH:MM:SS stays in
// mono tabular. null once the end has passed (the ballot page is only reachable
// while polls are open — no closed state is invented here).
const fmtCloseIn = (end) => {
  const ms = (end instanceof Date ? end.getTime() : NaN) - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), hms: `${pad2(Math.floor((s / 3600) % 24))}:${pad2(Math.floor((s / 60) % 60))}:${pad2(s % 60)}` };
};

// one editorial ballot row (party or abstain). role=radio, keyboard-operable.
function VoteRow({
  index, number, logoUrl, kick, name, slogan, stat, selected, abstain = false,
  onSelect, onDetails,
}) {
  const logo = resolveSrc(logoUrl);
  return (
    <li className={`bl-vopt${abstain ? " bl-vopt--abstain" : ""}${selected ? " is-selected" : ""}`}>
      <div
        className="bl-vopt__hit"
        role="radio"
        aria-checked={selected}
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(); } }}
      >
        <span className="bl-vopt__mark" aria-hidden="true">
          <svg className="bl-vopt__tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4.2 4.2L19 7" /></svg>
        </span>
        {index != null && <span className="bl-vopt__idx">{index}</span>}
        <span className="bl-vopt__logo">
          {logo ? (
            <img src={logo} alt={name} />
          ) : (
            <span className="bl-vopt__logo-ph" aria-hidden="true">{abstain ? "×" : pad2(number)}</span>
          )}
        </span>
        <span className="bl-vopt__body">
          <span className="bl-vopt__kick">{kick}</span>
          <span className="bl-vopt__name">{name}</span>
          {slogan && <span className="bl-vopt__slogan">{slogan}</span>}
          {stat && <span className="bl-vopt__stat">{stat}</span>}
        </span>
        {onDetails && (
          <button
            type="button"
            className="bl-vopt__more"
            onClick={(e) => { e.stopPropagation(); onDetails(); }}
          >
            ดูรายละเอียด
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>
    </li>
  );
}

export default function BlossomVote({
  regularParties = [], specialOptions = {}, selectedPartyId = null,
  onSelect = () => {}, onViewDetails = () => {}, isSingleParty = false,
  user = null, onConfirm = () => {}, isSubmitting = false, editorMode = false,
}) {
  // hook must run before any early return (Rules of Hooks) — the single booth reads
  // its own config, so gc is only consumed by the multi branch below.
  const gc = useGlobalConfig() || {};

  // live close-clock — hooks sit ABOVE the single-party dispatch so the hook order
  // is stable. editorMode: compute once, no interval (the editor preview must not
  // tick); single-party: the interval is skipped (the booth owns its own chrome).
  const { ELECTION_END } = useMemo(
    () => resolveElectionDates(gc),
    [gc?.campaignStartAt, gc?.electionStartAt, gc?.electionEndAt]
  );
  const [closeIn, setCloseIn] = useState(() => fmtCloseIn(ELECTION_END));
  useEffect(() => {
    if (editorMode || isSingleParty) { setCloseIn(fmtCloseIn(ELECTION_END)); return undefined; }
    setCloseIn(fmtCloseIn(ELECTION_END));
    const id = setInterval(() => setCloseIn(fmtCloseIn(ELECTION_END)), 1000);
    return () => clearInterval(id);
  }, [editorMode, isSingleParty, ELECTION_END]);

  // SINGLE-PARTY booth (T3.3) — dispatch the calm Candy Editorial booth, the same
  // recipe as VerdureVote -> VerdureSingleParty. onConfirm is the direct submit.
  if (isSingleParty) {
    return (
      <BlossomSingleParty
        party={regularParties?.[0] || {}}
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

  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";
  const copyrightYear = gc.copyrightYear ?? "";

  const abstain = specialOptions?.abstain;
  const parties = (regularParties || []).filter((p) => p && parseInt(p.number) > 0);
  const count = parties.length;

  const name = (user?.name || (editorMode ? "นักศึกษาตัวอย่าง" : "")).trim();
  const sid = user?.studentId || (editorMode ? "6610510149" : "—");

  // label for the confirm bar (party name, or the abstain choice)
  const selection = (() => {
    if (selectedPartyId == null) return null;
    const p = parties.find((x) => x.id === selectedPartyId);
    if (p) return { kick: `พรรคหมายเลข ${p.number}`, name: p.name };
    if (abstain && abstain.id === selectedPartyId) return { kick: "ABSTAIN · งดออกเสียง", name: "งดออกเสียง", abstain: true };
    return null;
  })();

  const canConfirm = selectedPartyId != null && !isSubmitting;

  return (
    <div className="fms-app bl-root bl-vote-root">
      <BlossomBaseStyles />

      {/* organic candy blobs (morph slowly, absolute within .bl-root) */}
      <span className="bl-blob bl-blob-1" aria-hidden="true" />
      <span className="bl-blob bl-blob-2" aria-hidden="true" />

      <BlossomTopBar editorMode={editorMode} active="/vote" />

      <div className="bl-page">
        {/* ===== issue line (masthead — vote variant) ===== */}
        <div className="bl-issue-line">
          <span><span className="bl-thai bl-thai--nw">ลงคะแนน</span> <b>·</b> CAST YOUR VOTE</span>
          <span>{prefix} {number}</span>
        </div>

        {/* ===== editorial masthead: mono kick + hollow display word ===== */}
        <header className="bl-vote-head">
          <span className="bl-vote-kick"><span className="bl-vote-dot" aria-hidden="true" /><span className="bl-thai bl-thai--nw">ลงคะแนนเสียง</span> · <span className="bl-nw">ONE VOTE ONLY</span></span>
          <h1 className="bl-vote-word">เลือก<span>พรรค</span></h1>
        </header>
        <p className="bl-vote-deck">
          เลือกได้เพียงหนึ่งตัวเลือก แตะที่พรรคเพื่อเลือก หรือกด “ดูรายละเอียด” เพื่ออ่านนโยบายก่อนตัดสินใจ เมื่อยืนยันแล้วจะไม่สามารถแก้ไขได้
        </p>

        {/* voter receipt — mono, editorial (mirrors BlossomSuccess receipt) */}
        <div className="bl-vote-voter">
          <span className="bl-vote-voter__row"><b>VOTER</b><span className="bl-thai">{name || "ผู้มีสิทธิ์เลือกตั้ง"}</span></span>
          <span className="bl-vote-voter__row"><b>ID</b>{sid}</span>
          <span className="bl-vote-voter__row"><b>BALLOT</b>{count} {count === 1 ? "PARTY" : "PARTIES"}</span>
          {/* live close-clock — pushed to the right as a status. The Thai runs use
              --bl-fb (bl-thai); only the HH:MM:SS digits stay mono tabular. Each
              ticking text node's DIRECT owner carries suppressHydrationWarning (SSR
              + first client render land a second apart by nature). */}
          {closeIn && (
            <span className="bl-vote-voter__row bl-vote-cd">
              <span className="bl-vote-cd__dot" aria-hidden="true" />
              <span className="bl-thai bl-thai--nw">ปิดรับใน</span>
              {closeIn.d > 0 && (
                <>
                  <strong className="bl-vote-cd__t" suppressHydrationWarning>{closeIn.d}</strong>
                  <span className="bl-thai bl-thai--nw">วัน</span>
                </>
              )}
              <strong className="bl-vote-cd__t" suppressHydrationWarning>{closeIn.hms}</strong>
            </span>
          )}
        </div>

        {/* ===== ballot paper — the hero object: choices sit on a clean card so the
               dotted canvas never runs under dense text ===== */}
        <section className="bl-vpaper" aria-label="บัตรลงคะแนน">
        <div className="bl-vpaper__cap"><span><span className="bl-thai bl-thai--nw">บัตรลงคะแนน</span> · <span className="bl-nw">BALLOT PAPER</span></span><em>1 <span className="bl-thai bl-thai--nw">คน</span> · 1 <span className="bl-thai bl-thai--nw">เสียง</span></em></div>
        <ul className="bl-vballot">
          {parties.map((p, i) => (
            <VoteRow
              key={p.id || i}
              index={pad2(p.number)}
              number={p.number}
              logoUrl={p.logoUrl}
              kick={<><span className="bl-thai bl-thai--nw">พรรคหมายเลข</span> <b>{p.number}</b></>}
              name={p.name}
              slogan={p.slogan || null}
              stat={p.members?.length ? <><span className="bl-thai bl-thai--nw">ทีมงาน</span> {p.members.length} <span className="bl-thai bl-thai--nw">คน</span></> : null}
              selected={selectedPartyId === p.id}
              onSelect={() => onSelect(p.id)}
              onDetails={() => onViewDetails(p)}
            />
          ))}

          {abstain && (
            <VoteRow
              index={null}
              number={0}
              abstain
              kick={<><span className="bl-thai bl-thai--nw">งดออกเสียง</span> · <span className="bl-nw">ABSTAIN</span></>}
              name="ไม่ประสงค์ลงคะแนน"
              slogan="ไม่ประสงค์ลงคะแนนเสียงในการเลือกตั้งครั้งนี้"
              selected={abstain.id === selectedPartyId}
              onSelect={() => onSelect(abstain.id)}
            />
          )}
        </ul>
        </section>
      </div>

      {/* ===== fixed confirm bar (Blossom chrome) ===== */}
      <div className={`bl-vconfirm${canConfirm ? " is-ready" : ""}`}>
        <div className="bl-vconfirm__in">
          <div className="bl-vconfirm__sel">
            <span className="bl-vconfirm__lab"><span className="bl-thai bl-thai--nw">การเลือกของคุณ</span> · <span className="bl-nw">YOUR SELECTION</span></span>
            {selection ? (
              <span className={`bl-vconfirm__val${selection.abstain ? " is-abstain" : ""}`}>
                <span className="bl-vconfirm__dia" aria-hidden="true" />
                <span className="bl-vconfirm__nm">{selection.name}</span>
              </span>
            ) : (
              <span className="bl-vconfirm__val bl-vconfirm__val--empty">ยังไม่ได้เลือก · No selection</span>
            )}
          </div>
          <button
            type="button"
            className="bl-vconfirm__btn"
            disabled={!canConfirm}
            onClick={() => canConfirm && onConfirm()}
          >
            {isSubmitting ? "กำลังบันทึก…" : "ยืนยันการลงคะแนน"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* ===== footer — plain classic line (mirrors bl-footer on home) ===== */}
      <footer className="bl-footer">
        <p>© {gc.facultyShortEn || "FMS"}@{gc.university || "PSU"}{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
      </footer>

      <style jsx global>{`
        /* ================= SHARED CHROME (mirrors BlossomHome) ================= */
        /* clip not hidden — hidden makes overflow-y compute to auto, this root becomes the
           scroll container, and .bl-topbar's sticky pins to it instead of the viewport
           (measured: bar y 0 → -400 at scrollY 400). xo=0, and the fixed .bl-vconfirm
           bottom bar is unaffected — clip does not create a containing block for fixed. */
        .bl-vote-root { overflow-x:clip; }
        /* dot-grid paper texture — softened on the ballot page (owner: 15%/24px reads
           as visual noise under dense selectable rows); the ballot itself sits on a
           solid paper card so text never runs over the dots */
        .bl-vote-root::after { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:radial-gradient(color-mix(in srgb, var(--bl-ink) 8%, transparent) 1px, transparent 1.4px);
          background-size:28px 28px; }
        :where(.bl-vote-root) a { color:var(--bl-primary-ink); text-decoration:none; }
        :where(.bl-vote-root) a:hover { color:var(--bl-ink); }

        /* blobs — faded toward the canvas on this page (owner: full-strength candy
           shapes behind a dense ballot read as eye strain) */
        .bl-vote-root .bl-blob { position:absolute; pointer-events:none; z-index:0; }
        .bl-vote-root .bl-blob-1 { top:-16vw; right:-22vw; width:64vw; height:64vw; min-width:380px; min-height:380px;
          background:color-mix(in srgb, var(--bl-primary-soft) 45%, var(--bl-canvas)); border-radius:52% 48% 60% 40%/55% 60% 40% 45%;
          animation:blMorph 14s ease-in-out infinite alternate; }
        .bl-vote-root .bl-blob-2 { bottom:4%; left:-18vw; width:46vw; height:46vw; min-width:280px; min-height:280px;
          background:color-mix(in srgb, var(--bl-sup3) 45%, var(--bl-canvas)); border-radius:60% 40% 45% 55%/45% 55% 60% 40%;
          animation:blMorph 18s ease-in-out infinite alternate-reverse; }
        @keyframes blMorph {
          0%   { border-radius:52% 48% 60% 40%/55% 60% 40% 45%; }
          50%  { border-radius:44% 56% 42% 58%/60% 42% 58% 40%; }
          100% { border-radius:58% 42% 55% 45%/42% 58% 45% 55%; }
        }

        .bl-vote-root .bl-page { position:relative; z-index:1; max-width:1200px; margin:0 auto; padding:0 22px 90px; }

        /* ---- topbar (editorial hairline skin) ---- */
        .bl-vote-root .bl-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--bl-canvas) 88%, transparent);
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
          border-bottom:1.5px solid var(--bl-ink); }
        .bl-vote-root .bl-topbar__in { max-width:1200px; margin:0 auto; padding:14px 22px;
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .bl-vote-root .bl-logo { display:inline-flex; align-items:center; flex-shrink:0; border-radius:8px; }
        .bl-vote-root .bl-logo__img { height:30px; width:auto; object-fit:contain; display:block; }
        .bl-vote-root .bl-nav { display:none; gap:20px; margin-left:auto; align-items:center; }
        .bl-vote-root .bl-nav__link { font-family:var(--bl-fm); font-size:11.5px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--bl-ink2); position:relative; padding-bottom:2px; border-radius:4px; transition:color .2s ease; }
        .bl-vote-root .bl-nav__link.on, .bl-vote-root .bl-nav__link:hover { color:var(--bl-ink); }
        .bl-vote-root .bl-nav__link::after { content:""; position:absolute; left:0; right:0; bottom:-3px; height:3px;
          background:var(--bl-primary); border-radius:2px; transform:scaleX(0); transform-origin:left;
          transition:transform .28s cubic-bezier(.22,1,.36,1); }
        .bl-vote-root .bl-nav__link:hover::after { transform:scaleX(1); }
        .bl-vote-root .bl-nav__link.on::after { transform:scaleX(1); }

        .bl-vote-root .bl-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .bl-vote-root .bl-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--bl-fd); font-weight:600;
          font-size:13px; color:var(--bl-canvas); background:var(--bl-ink); border:none; cursor:pointer;
          padding:9px 20px; border-radius:999px; transition:background .2s ease, transform .15s ease; }
        .bl-vote-root .bl-loginbtn:hover { background:var(--bl-primary-deep); transform:translateY(-1px); }
        .bl-vote-root .bl-loginbtn:active { transform:scale(.96); }
        .bl-vote-root .bl-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--bl-line) 70%, var(--bl-card)); }
        .bl-vote-root .bl-skelbar { display:block; width:58px; height:12px; border-radius:6px;
          background:color-mix(in srgb, var(--bl-ink2) 30%, var(--bl-card)); animation:blPulse 1.3s ease-in-out infinite; }
        @keyframes blPulse { 0%,100%{opacity:.45} 50%{opacity:1} }

        .bl-vote-root .bl-userchip { position:relative; }
        .bl-vote-root .bl-userchip__btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:999px; padding:5px 12px 5px 5px; cursor:pointer;
          font-family:inherit; transition:transform .15s ease, background .2s ease; }
        .bl-vote-root .bl-userchip__btn:hover { background:color-mix(in srgb, var(--bl-primary) 7%, var(--bl-card)); }
        .bl-vote-root .bl-userchip__btn:active { transform:scale(.97); }
        .bl-vote-root .bl-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:linear-gradient(135deg, var(--bl-primary), var(--bl-primary-deep)); color:var(--bl-on-primary, var(--bl-card));
          font-family:var(--bl-fd); font-weight:700; font-size:14px; line-height:1; }
        .bl-vote-root .bl-userchip__name { font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-vote-root .bl-userchip__caret { color:var(--bl-ink2); font-size:11px; }
        .bl-vote-root .bl-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--bl-card);
          border:1.5px solid var(--bl-ink); border-radius:16px; overflow:hidden; z-index:50;
          box-shadow:0 18px 40px -18px color-mix(in srgb, var(--bl-ink) 12%, transparent); }
        .bl-vote-root .bl-usermenu__head { padding:14px 16px; border-bottom:1px solid var(--bl-line); }
        .bl-vote-root .bl-usermenu__name { font-family:var(--bl-fd); font-weight:700; font-size:14px; color:var(--bl-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-vote-root .bl-usermenu__id { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.04em; color:var(--bl-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bl-vote-root .bl-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--bl-fd); font-weight:600; font-size:13px; color:var(--bl-primary-ink); }
        .bl-vote-root .bl-usermenu__out:hover { background:color-mix(in srgb, var(--bl-primary) 10%, var(--bl-card)); }

        .bl-vote-root .bl-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:12px; background:var(--bl-card); border:1.5px solid var(--bl-ink); cursor:pointer;
          transition:transform .15s ease, background .2s ease; }
        .bl-vote-root .bl-burger:hover { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }
        .bl-vote-root .bl-burger:active { transform:scale(.95); }
        .bl-vote-root .bl-burger span { display:block; height:2.5px; border-radius:2px; background:var(--bl-ink); }

        .bl-vote-root .bl-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .bl-vote-root .bl-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .bl-vote-root .bl-sheet__link { display:flex; align-items:center; min-height:44px; padding:11px 16px; border-radius:12px;
          font-family:var(--bl-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--bl-ink);
          background:var(--bl-card); border:1px solid var(--bl-line); transition:border-color .2s ease, background .2s ease; }
        .bl-vote-root .bl-sheet__link:hover { border-color:var(--bl-primary); }
        .bl-vote-root .bl-sheet__link:active { background:color-mix(in srgb, var(--bl-primary) 8%, var(--bl-card)); }

        /* focus-visible (keyboard) — 2px primary-deep outline on every interactive element */
        .bl-vote-root a:focus-visible, .bl-vote-root button:focus-visible,
        .bl-vote-root [role="radio"]:focus-visible {
          outline:2px solid var(--bl-primary-deep); outline-offset:2px; }

        /* ---- issue line (masthead) ---- */
        .bl-vote-root .bl-issue-line { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:12px 0;
          border-bottom:1px solid var(--bl-line); font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--bl-ink2); }
        .bl-vote-root .bl-issue-line b { color:var(--bl-primary-ink); font-weight:700; }

        /* ---- footer: plain classic single line, centered ---- */
        .bl-vote-root .bl-footer { margin-top:0; padding:24px 0; border-top:1px solid var(--bl-line); text-align:center;
          position:relative; z-index:1; }
        .bl-vote-root .bl-footer p { margin:0; font-size:10px; letter-spacing:.12em; text-transform:uppercase;
          font-weight:500; color:var(--bl-ink2); }

        /* ================= VOTE PAGE (unique layout) ================= */
        /* reserve room for the fixed confirm bar (overrides the chrome .bl-page pad) */
        .bl-vote-root .bl-page { padding-bottom:180px; }

        /* ---- masthead: mono kick + hollow display word ---- */
        .bl-vote-root .bl-vote-head { margin-top:44px; padding-bottom:22px; border-bottom:1.5px solid var(--bl-ink);
          animation:blVRise .6s ease both .05s; }
        .bl-vote-root .bl-vote-kick { display:inline-flex; align-items:center; gap:9px; font-family:var(--bl-fm); font-size:10.5px;
          letter-spacing:.2em; text-transform:uppercase; color:var(--bl-ink2); }
        .bl-vote-root .bl-vote-dot { width:7px; height:7px; border-radius:50%; background:var(--bl-primary);
          animation:blVBlip 1.6s infinite; }
        @keyframes blVBlip { 50%{opacity:.3} }
        /* display word — SOLID two-tone (ink + candy). The family's hollow outline
           reads too faint at this size on the dotted canvas (owner feedback: จาง/แสบตา)
           and this is the action page, so legibility wins here. */
        .bl-vote-root .bl-vote-word { margin:12px 0 0; font-family:var(--bl-fd); font-weight:800; line-height:.9;
          font-size:clamp(52px,13.5vw,120px); letter-spacing:-.02em; color:var(--bl-ink); }
        .bl-vote-root .bl-vote-word span { color:var(--bl-primary-ink); }
        .bl-vote-root .bl-vote-deck { margin:20px 0 0; max-width:620px; font-family:var(--bl-fd); font-weight:500;
          font-size:clamp(15px,3.6vw,18px); line-height:1.7; color:var(--bl-ink2);
          animation:blVRise .6s ease both .14s; }

        /* voter receipt — mono chips (mirrors success receipt grammar, on canvas) */
        .bl-vote-root .bl-vote-voter { margin-top:24px; display:flex; flex-wrap:wrap; gap:10px 26px;
          padding:16px 0 4px; border-top:1px solid var(--bl-line);
          animation:blVRise .6s ease both .2s; }
        .bl-vote-root .bl-vote-voter__row { display:inline-flex; align-items:baseline; gap:9px;
          font-family:var(--bl-fm); font-size:12px; letter-spacing:.04em; color:var(--bl-ink); min-width:0; }
        .bl-vote-root .bl-vote-voter__row b { font-weight:400; letter-spacing:.16em; text-transform:uppercase; color:var(--bl-faint); }
        /* live close-clock — reads as a status: candy blip dot + a primary-deep
           ticking numeral, pushed to the right of the mono meta strip */
        .bl-vote-root .bl-vote-cd { margin-left:auto; gap:7px; }
        .bl-vote-root .bl-vote-cd__dot { width:6px; height:6px; flex:none; border-radius:50%; background:var(--bl-primary);
          animation:blVBlip 1.6s infinite; }
        .bl-vote-root .bl-vote-cd__t { font-weight:700; color:var(--bl-primary-ink); letter-spacing:.06em;
          font-variant-numeric:tabular-nums; }

        /* ---- ballot paper card (the hero object on the page) ---- */
        .bl-vote-root .bl-vpaper { margin-top:36px; background:var(--bl-card); border:1.5px solid var(--bl-ink);
          border-radius:24px; overflow:hidden; animation:blVRise .55s ease both .24s;
          box-shadow:0 24px 50px -30px color-mix(in srgb, var(--bl-ink) 22%, transparent); }
        .bl-vote-root .bl-vpaper__cap { display:flex; align-items:baseline; justify-content:space-between; gap:12px;
          padding:15px 22px; border-bottom:1.5px solid var(--bl-ink);
          background:color-mix(in srgb, var(--bl-primary) 6%, var(--bl-card)); }
        .bl-vote-root .bl-vpaper__cap span { font-family:var(--bl-fm); font-size:10.5px; letter-spacing:.2em;
          text-transform:uppercase; color:var(--bl-ink); font-weight:700; }
        .bl-vote-root .bl-vpaper__cap em { font-family:var(--bl-fm); font-style:normal; font-size:10.5px;
          letter-spacing:.14em; color:var(--bl-primary-ink); white-space:nowrap; }

        /* ---- ballot rows (candidates index grammar, made selectable) ---- */
        .bl-vote-root .bl-vballot { list-style:none; margin:0; padding:0; }
        .bl-vote-root .bl-vopt { border-bottom:1px solid var(--bl-line); animation:blVRise .55s ease both; }
        .bl-vote-root .bl-vopt:last-child { border-bottom:none; }
        .bl-vote-root .bl-vopt:nth-child(1) { animation-delay:.06s; }
        .bl-vote-root .bl-vopt:nth-child(2) { animation-delay:.12s; }
        .bl-vote-root .bl-vopt:nth-child(3) { animation-delay:.18s; }
        .bl-vote-root .bl-vopt:nth-child(4) { animation-delay:.24s; }
        .bl-vote-root .bl-vopt:nth-child(n+5) { animation-delay:.3s; }
        .bl-vote-root .bl-vopt__hit { position:relative; display:grid; grid-template-columns:auto auto auto 1fr auto; align-items:center;
          gap:18px; padding:22px 20px; cursor:pointer; color:var(--bl-ink);
          border-left:4px solid transparent;
          transition:background .25s ease, border-color .25s ease; }
        .bl-vote-root .bl-vopt__hit:hover { background:color-mix(in srgb, var(--bl-primary) 6%, var(--bl-card)); }
        .bl-vote-root .bl-vopt.is-selected .bl-vopt__hit { background:var(--bl-primary-soft); border-left-color:var(--bl-primary-deep); }

        /* selection marker — round radio that FILLS candy with a white tick
           (owner 2026-07-12: no square boxes — a check reads instantly) */
        .bl-vote-root .bl-vopt__mark { width:28px; height:28px; flex:none; border-radius:50%;
          border:2px solid color-mix(in srgb, var(--bl-ink2) 40%, var(--bl-line)); display:grid; place-items:center;
          background:var(--bl-card); transition:border-color .2s ease, background .2s ease; }
        .bl-vote-root .bl-vopt__hit:hover .bl-vopt__mark { border-color:var(--bl-primary); }
        .bl-vote-root .bl-vopt__tick { width:15px; height:15px; color:var(--bl-on-primary, var(--bl-card));
          transform:scale(0); transition:transform .22s cubic-bezier(.22,1,.36,1); }
        .bl-vote-root .bl-vopt.is-selected .bl-vopt__mark { border-color:var(--bl-primary-deep); background:var(--bl-primary-deep); }
        .bl-vote-root .bl-vopt.is-selected .bl-vopt__tick { transform:scale(1); }

        .bl-vote-root .bl-vopt__idx { font-family:var(--bl-fd); font-weight:800; font-size:clamp(22px,5.4vw,40px);
          font-variant-numeric:tabular-nums; letter-spacing:-.02em; color:var(--bl-primary-ink); width:auto; flex:none; }
        .bl-vote-root .bl-vopt__logo { width:62px; height:62px; flex:none; border-radius:16px; overflow:hidden;
          background:var(--bl-card); border:1.5px solid var(--bl-line); display:flex; align-items:center; justify-content:center; padding:5px; }
        /* contain, not cover — same reason as .bl-crow__logo on the candidates page:
           this is a party MARK, not a photo. cover rendered a real 3375x4219 logo
           75px tall inside the 60px box and clipped 15px off its bottom, on the
           BALLOT of all places. Flex centring because a percentage max-height does
           not resolve on a grid item. */
        .bl-vote-root .bl-vopt__logo img { width:auto; height:auto; max-width:100%; max-height:100%; object-fit:contain; }
        .bl-vote-root .bl-vopt__logo-ph { font-family:var(--bl-fd); font-weight:800; font-size:20px;
          font-variant-numeric:tabular-nums; color:var(--bl-primary-ink); }
        .bl-vote-root .bl-vopt__body { min-width:0; display:flex; flex-direction:column; gap:3px; }
        .bl-vote-root .bl-vopt__kick { font-family:var(--bl-fm); font-size:10px; letter-spacing:.16em; text-transform:uppercase;
          color:var(--bl-ink2); }
        .bl-vote-root .bl-vopt__kick b { color:var(--bl-primary-ink); font-weight:700; }
        /* ink gutter — same Kanit-vs-lh1.12 clipping as .bl-crow__name (measured
           cutTop 2.7px on the real ballot row, 3.06px worst case at 30px). padding-top
           only; padding-bottom would let the clamped 3rd line bleed back in. */
        .bl-vote-root .bl-vopt__name { font-family:var(--bl-fd); font-weight:800; font-size:clamp(20px,5vw,30px); line-height:1.12;
          letter-spacing:-.01em; color:var(--bl-ink); padding-top:.2em; margin-top:-.2em;
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        /* ink gutter: same Kanit-vs-lh clipping as .bl-vopt__name above, just far
           smaller here because lh 1.5 is generous — measured needEm 0.01 constant
           at every breakpoint and every party count (2/3/5/6). cushion .05em -> .06em.
           padding-top opens the clip box, margin-top absorbs the same amount so
           layout is byte-identical. padding-BOTTOM banned: Chrome spills the
           clamped 2nd line back in. */
        .bl-vote-root .bl-vopt__slogan { margin-top:calc(2px - .06em); font-family:var(--bl-fd); font-weight:500; font-size:14px; line-height:1.5;
          color:var(--bl-ink2); font-style:italic; padding-top:.06em;
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
        .bl-vote-root .bl-vopt__stat { margin-top:6px; font-family:var(--bl-fm); font-size:10px; letter-spacing:.14em;
          text-transform:uppercase; color:var(--bl-faint); }
        .bl-vote-root .bl-vopt__more { display:inline-flex; align-items:center; gap:7px; flex:none; min-height:44px;
          padding:11px 18px; border-radius:999px; background:var(--bl-primary-soft); border:none; cursor:pointer;
          font-family:var(--bl-fd); font-weight:600; font-size:13.5px; color:var(--bl-primary-ink);
          transition:background .25s ease; }
        .bl-vote-root .bl-vopt__more:hover { background:color-mix(in srgb, var(--bl-primary) 20%, var(--bl-card)); }
        .bl-vote-root .bl-vopt__more svg { transition:transform .25s ease; }
        .bl-vote-root .bl-vopt__more:hover svg { transform:translateX(3px); }

        /* งดออกเสียง — quieter row, KEEPS its semantic ORANGE coding (ส้ม family,
           mirrors classic MultiPartyView + shared VoteConfirmationModal). These
           oranges are semantic vote colours, deliberately NOT var(--bl-*) candy. */
        .bl-vote-root .bl-vopt--abstain .bl-vopt__idx,
        .bl-vote-root .bl-vopt--abstain .bl-vopt__logo-ph { color:#ea580c; }
        .bl-vote-root .bl-vopt--abstain .bl-vopt__kick { color:#c2410c; }
        .bl-vote-root .bl-vopt--abstain .bl-vopt__hit:hover { background:color-mix(in srgb, #ea580c 6%, var(--bl-card)); }
        .bl-vote-root .bl-vopt--abstain .bl-vopt__hit:hover .bl-vopt__mark { border-color:#ea580c; }
        .bl-vote-root .bl-vopt--abstain.is-selected .bl-vopt__hit { background:color-mix(in srgb, #ea580c 9%, var(--bl-card));
          border-left-color:#ea580c; }
        .bl-vote-root .bl-vopt--abstain.is-selected .bl-vopt__mark { border-color:#ea580c; background:#ea580c; }
        .bl-vote-root .bl-vopt--abstain .bl-vopt__tick { color:#fff; }
        .bl-vote-root .bl-vopt--abstain .bl-vopt__name { font-size:clamp(18px,4.4vw,24px); }

        /* ---- fixed confirm bar — INK BAND (the family's climax grammar: home
           countdown / success / results embargo), not a generic frosted strip ---- */
        .bl-vote-root .bl-vconfirm { position:fixed; left:0; right:0; bottom:0; z-index:38;
          background:var(--bl-ink); border-top:3px solid var(--bl-primary); }
        .bl-vote-root .bl-vconfirm__in { max-width:1200px; margin:0 auto; padding:14px 22px;
          display:flex; align-items:center; gap:18px; }
        .bl-vote-root .bl-vconfirm__sel { min-width:0; flex:1; display:flex; flex-direction:column; gap:3px; }
        .bl-vote-root .bl-vconfirm__lab { font-family:var(--bl-fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase;
          color:color-mix(in srgb, var(--bl-canvas) 55%, transparent); }
        /* ink gutter — lh 1.1 at 24px cut 3.3px off the top of Thai upper marks inside
           the band's overflow:hidden. padding-top + equal negative margin = same layout,
           taller clip box (see .bl-vopt__name above). */
        .bl-vote-root .bl-vconfirm__val { display:inline-flex; align-items:center; gap:10px; min-width:0;
          font-family:var(--bl-fd); font-weight:800; font-size:clamp(17px,4.4vw,24px); line-height:1.1; letter-spacing:-.01em;
          color:var(--bl-canvas); white-space:nowrap; overflow:hidden; padding-top:.2em; margin-top:-.2em; }
        /* the party name is its own flex item so text-overflow has a box to act on —
           on an inline-flex parent the bare text node became an anonymous flex item
           and ellipsis never rendered (a 43-char party name just got cut mid-word) */
        .bl-vote-root .bl-vconfirm__nm { min-width:0; overflow:hidden; text-overflow:ellipsis;
          padding-top:.2em; margin-top:-.2em; }
        .bl-vote-root .bl-vconfirm__val--empty { color:color-mix(in srgb, var(--bl-canvas) 55%, transparent); font-weight:600; }
        .bl-vote-root .bl-vconfirm__dia { width:12px; height:12px; flex:none; background:var(--bl-primary); transform:rotate(45deg); }
        /* abstain on the ink band — lighter semantic orange for contrast on dark */
        .bl-vote-root .bl-vconfirm__val.is-abstain { color:#fdba74; }
        .bl-vote-root .bl-vconfirm__val.is-abstain .bl-vconfirm__dia { background:#f97316; }
        .bl-vote-root .bl-vconfirm__btn { flex:none; display:inline-flex; align-items:center; justify-content:center; gap:9px;
          min-height:52px; padding:14px 26px; border-radius:999px; border:none; cursor:pointer;
          font-family:var(--bl-fd); font-weight:700; font-size:16px;
          color:var(--bl-on-primary, var(--bl-card)); background:var(--bl-primary);
          transition:transform .2s ease, background .25s ease, filter .25s ease; }
        .bl-vote-root .bl-vconfirm__btn svg { flex:none; transition:transform .25s ease; }
        .bl-vote-root .bl-vconfirm.is-ready .bl-vconfirm__btn:hover { transform:translateY(-2px); filter:brightness(1.06); }
        .bl-vote-root .bl-vconfirm.is-ready .bl-vconfirm__btn:hover svg { transform:translateX(3px); }
        .bl-vote-root .bl-vconfirm__btn:active { transform:scale(.97); }
        .bl-vote-root .bl-vconfirm__btn:disabled { cursor:not-allowed;
          color:color-mix(in srgb, var(--bl-canvas) 45%, transparent);
          background:color-mix(in srgb, var(--bl-canvas) 14%, transparent); }

        @keyframes blVRise { from { opacity:0; transform:translateY(16px); } }

        /* ================= TABLET+ : inline nav replaces burger/sheet ================= */
        @media (min-width:768px) {
          .bl-vote-root .bl-topbar__in { gap:22px; }
          .bl-vote-root .bl-nav { display:flex; }
          .bl-vote-root .bl-userwrap { margin-left:0; }
          .bl-vote-root .bl-burger, .bl-vote-root .bl-sheet { display:none; }
          .bl-vote-root .bl-footer p { font-size:12px; }
          .bl-vote-root .bl-vopt__hit { gap:24px; padding:26px 26px; }
        }

        /* ================= MOBILE (<=560): rows reflow, tap targets >=44px ================= */
        @media (max-width:560px) {
          .bl-vote-root .bl-page { padding-bottom:172px; }
          /* v2-R10: tighten the masthead rhythm so the ballot card enters the first
             viewport sooner — same grammar (kick / two-tone word / deck / voter rows),
             just less air on a phone. Nothing is dropped. */
          .bl-vote-root .bl-issue-line { padding:8px 0; }
          .bl-vote-root .bl-vote-head { margin-top:22px; padding-bottom:14px; }
          .bl-vote-root .bl-vote-word { margin-top:8px; font-size:clamp(40px,11vw,52px); }
          .bl-vote-root .bl-vote-deck { margin-top:12px; font-size:14px; line-height:1.55; }
          .bl-vote-root .bl-vote-voter { margin-top:14px; padding:12px 0 2px; gap:6px 18px; }
          .bl-vote-root .bl-vpaper { margin-top:20px; }
          /* v2-R8 T3: the "ดูรายละเอียด" pill rides INLINE in the rightmost column
             (was a full-width second row that doubled each party's height). Row stays
             a single grid line → far shorter cards when N parties stack. The pill keeps
             its candy language + a >=44px hit target. */
          .bl-vote-root .bl-vopt__hit { grid-template-columns:auto auto 1fr; grid-template-areas:"mark idx body" "mark idx more";
            gap:8px 12px; padding:16px 16px; }
          /* slogan + team-count fold away at this width — truncated near-useless here,
             and both live one tap away in the details pill / party page. The NAME gets
             the full column at its 2-line clamp (ballot names must stay readable). */
          .bl-vote-root .bl-vopt__slogan, .bl-vote-root .bl-vopt__stat { display:none; }
          .bl-vote-root .bl-vpaper { border-radius:20px; }
          .bl-vote-root .bl-vpaper__cap { padding:13px 16px; }
          .bl-vote-root .bl-vopt__mark { grid-area:mark; align-self:center; }
          .bl-vote-root .bl-vopt__idx { grid-area:idx; align-self:center; }
          /* logo folds away on the narrowest layout — the index numeral + name carry identity */
          .bl-vote-root .bl-vopt__logo { display:none; }
          .bl-vote-root .bl-vopt__body { grid-area:body; }
          .bl-vote-root .bl-vopt__more { grid-area:more; justify-self:start; align-self:start;
            padding:0 16px; font-size:12.5px; }
          /* the arrow icon is dropped inline to keep the pill narrow beside the name */
          .bl-vote-root .bl-vopt__more svg { display:none; }
          .bl-vote-root .bl-vconfirm__in { flex-direction:column; align-items:stretch; gap:12px; padding:12px 18px; }
          .bl-vote-root .bl-vconfirm__btn { width:100%; }
        }

        /* reduced motion — scope to .bl-vote-root, keep transitions */
        @media (prefers-reduced-motion:reduce) {
          .bl-vote-root *, .bl-vote-root *::before, .bl-vote-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
