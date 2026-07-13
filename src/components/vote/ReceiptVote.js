"use client";

// ReceiptVote — VOTE (multi-party ballot) page for the "Receipt · Paper
// Materiality" template family (Template #6), in the print language established by
// ReceiptHome / ReceiptSuccess. This is Receipt's BALLOT moment — a real PAPER
// BALLOT SHEET resting on the polling desk:
//   • a receipt-stock sheet with die-cut/perforation edges + a mono ballot-number
//     header ("บัตรลงคะแนน · BALLOT PAPER · No. …")
//   • one ROW per party: a square INK MARK-BOX ☐ (checking it presses an ink ✓
//     stamp in — transform/opacity only), the party number, a logo tile, name +
//     slogan + team count, and "ดูรายละเอียด" (→ the parent-owned PartyDetailModal,
//     exactly as Blossom multi does)
//   • งดออกเสียง (abstain) is a quieter row that KEEPS its semantic ORANGE coding
//     (the same ส้ม family as MultiPartyView / the shared VoteConfirmationModal) —
//     deliberately NOT var(--rc-*). ไม่รับรอง (disapprove, number = -1) is a
//     single-party-only choice and is NEVER rendered in the multi ballot (mirrors
//     MultiPartyView / BlossomVote).
//   • a fixed confirm bar in Receipt chrome — a paper TRAY strip (torn perforation
//     top edge) carrying the current selection + a foil-rim confirm button →
//     onConfirm() (opens the SHARED VoteConfirmationModal owned by vote/page.js —
//     its markup/semantics are untouched here)
//
// SINGLE-PARTY: when only one party stands, ReceiptVote dispatches to
// ReceiptSingleParty (the 3-ink-stamp booth) — the same internal-dispatch recipe
// the other families use (BlossomVote -> BlossomSingleParty). vote/page.js routes
// ALL receipt /vote here and passes onConfirm = the direct submit for single, or
// the shared-modal opener for multi.
//
// Pure presentation: vote/page.js owns auth, the vote-system hook, PartyDetailModal
// + VoteConfirmationModal + the submit/redirect flow. Colours flow ONLY through
// var(--rc-*) emitted by ReceiptBaseStyles on .rc-root (the one exception is the
// abstain row's semantic orange). Decoration is print-language only (die-cut /
// perforation / stamps / foil — no icons, no lucide). Base state is fully visible:
// every animation supplies only its hidden `from`, so JS-off / reduced-motion /
// editorMode render the complete ballot instantly (the ink mark is a selection
// indicator, not gated content).

import { getPath } from "../../utils/basePath";
import { ReceiptTopBar } from "../home/ReceiptHome";
import { ReceiptBaseStyles } from "../home/ReceiptTheme";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import ReceiptSingleParty from "./ReceiptSingleParty";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const pad4 = (n) => String(n ?? 0).padStart(4, "0");
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

// one ballot row (party or abstain). role=radio, keyboard-operable. The mark-box is
// an ink square; selecting presses an ink ✓ stamp in (transform/opacity only).
function VoteRow({
  index, number, logoUrl, kick, name, slogan, stat, selected, abstain = false,
  onSelect, onDetails,
}) {
  const logo = resolveSrc(logoUrl);
  return (
    <li className={`rc-vrow${abstain ? " rc-vrow--abstain" : ""}${selected ? " is-selected" : ""}`}>
      <div
        className="rc-vrow__hit"
        role="radio"
        aria-checked={selected}
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(); } }}
      >
        <span className="rc-vrow__box" aria-hidden="true">
          <span className="rc-vrow__mark">✓</span>
        </span>
        {index != null && <span className="rc-vrow__idx">{index}</span>}
        <span className="rc-vrow__logo">
          {logo ? (
            <img src={logo} alt={name} />
          ) : (
            <span className="rc-vrow__logo-ph" aria-hidden="true">{abstain ? "×" : pad2(number)}</span>
          )}
        </span>
        <span className="rc-vrow__body">
          <span className="rc-vrow__kick">{kick}</span>
          <span className="rc-vrow__name">{name}</span>
          {slogan && <span className="rc-vrow__slogan">{slogan}</span>}
          {stat && <span className="rc-vrow__stat">{stat}</span>}
        </span>
        {onDetails && (
          <button
            type="button"
            className="rc-vrow__more"
            onClick={(e) => { e.stopPropagation(); onDetails(); }}
          >
            ดูรายละเอียด<span aria-hidden="true"> →</span>
          </button>
        )}
      </div>
    </li>
  );
}

export default function ReceiptVote({
  regularParties = [], specialOptions = {}, selectedPartyId = null,
  onSelect = () => {}, onViewDetails = () => {}, isSingleParty = false,
  user = null, onConfirm = () => {}, isSubmitting = false, editorMode = false,
}) {
  // hook must run before any early return (Rules of Hooks) — the single booth reads
  // its own config, so gc is only consumed by the multi branch below.
  const gc = useGlobalConfig() || {};

  // SINGLE-PARTY booth — dispatch the 3-ink-stamp booth, the same recipe as
  // BlossomVote -> BlossomSingleParty. onConfirm is the direct submit.
  if (isSingleParty) {
    return (
      <ReceiptSingleParty
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
    <div className="fms-app rc-root rc-vote-root rc-desk">
      <ReceiptBaseStyles />

      <ReceiptTopBar editorMode={editorMode} active="/vote" />

      {/* blind-emboss seals — fewer than home (the ballot is the focus), shared
          .rc-desk-seals language, pure decoration (aria-hidden) */}
      <div className="rc-desk-seals" aria-hidden="true">
        <span className="rc-seal rc-seal--a"><i /><b /></span>
        <span className="rc-seal rc-seal--b"><i /><b /></span>
      </div>

      <div className="rc-vote-wrap">
        {/* ===== issue / eyebrow line ===== */}
        <div className="rc-issue">
          <span>ลงคะแนน · CAST YOUR VOTE</span>
          <span>{prefix} {number}</span>
        </div>

        {/* ===== masthead ===== */}
        <header className="rc-vhead">
          <span className="rc-vhead__eyebrow">◆ ลงคะแนนเสียง · ONE VOTE ONLY ◆</span>
          <h1 className="rc-vhead__title">เลือกพรรคที่คุณไว้วางใจ</h1>
          <p className="rc-vhead__deck">เลือกได้เพียงหนึ่งตัวเลือก แตะที่พรรคเพื่อทำเครื่องหมาย หรือกด “ดูรายละเอียด” เพื่ออ่านนโยบายก่อนตัดสินใจ เมื่อยืนยันแล้วจะไม่สามารถแก้ไขได้</p>
        </header>

        {/* voter register strip — mono, register-tape voice */}
        <div className="rc-vvoter">
          <span className="rc-vvoter__row"><b>ผู้มีสิทธิ์</b>{name || "ผู้มีสิทธิ์เลือกตั้ง"}</span>
          <span className="rc-vvoter__row"><b>รหัส</b>{sid}</span>
          <span className="rc-vvoter__row"><b>บัตร</b>{count} {count === 1 ? "พรรค" : "พรรค"}</span>
        </div>

        {/* ===== the ballot sheet — the hero object, resting on the desk ===== */}
        <section className="rc-ballot" aria-label="บัตรลงคะแนน">
          {/* ghost of a previous ink stamp on the desk behind the sheet */}
          <div className="rc-ballot-ghost" aria-hidden="true"><span>{prefix} {number} ✓</span></div>

          <div className="rc-ballot-sheet">
            <div className="rc-ballot-head">
              <span className="rc-ballot-head__l">บัตรลงคะแนน · BALLOT PAPER</span>
              <span className="rc-ballot-head__r">No. {prefix}{number} · {pad4(count)}</span>
            </div>
            <div className="rc-perf" aria-hidden="true" />

            <ul className="rc-ballot-rows">
              {parties.map((p, i) => (
                <VoteRow
                  key={p.id || i}
                  index={pad2(p.number)}
                  number={p.number}
                  logoUrl={p.logoUrl}
                  kick={<>พรรคหมายเลข <b>{p.number}</b></>}
                  name={p.name}
                  slogan={p.slogan || null}
                  stat={p.members?.length ? `ทีมงาน ${p.members.length} คน` : null}
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
                  kick="งดออกเสียง · ABSTAIN"
                  name="ไม่ประสงค์ลงคะแนน"
                  slogan="ไม่ประสงค์ลงคะแนนเสียงในการเลือกตั้งครั้งนี้"
                  selected={abstain.id === selectedPartyId}
                  onSelect={() => onSelect(abstain.id)}
                />
              )}
            </ul>

            <div className="rc-ballot-foot" aria-hidden="true">◆ ◆ ◆ หนึ่งคน หนึ่งเสียง ◆ ◆ ◆</div>
          </div>
        </section>
      </div>

      {/* ===== fixed confirm bar — paper TRAY strip with a foil-rim confirm button ===== */}
      <div className={`rc-vbar${canConfirm ? " is-ready" : ""}`}>
        <div className="rc-vbar__perf" aria-hidden="true" />
        <div className="rc-vbar__in">
          <div className="rc-vbar__sel">
            <span className="rc-vbar__lab">การเลือกของคุณ · YOUR SELECTION</span>
            {selection ? (
              <span className={`rc-vbar__val${selection.abstain ? " is-abstain" : ""}`}>
                <span className="rc-vbar__dot" aria-hidden="true" />{selection.name}
              </span>
            ) : (
              <span className="rc-vbar__val rc-vbar__val--empty">ยังไม่ได้เลือก · No selection</span>
            )}
          </div>
          <button
            type="button"
            className="rc-vbar__btn"
            disabled={!canConfirm}
            onClick={() => canConfirm && onConfirm()}
          >
            {canConfirm && <span className="rc-foil" aria-hidden="true" />}
            <span className="rc-vbar__btn-in">
              {isSubmitting ? "กำลังบันทึก…" : "ยืนยันการลงคะแนน"}<span className="rc-vbar__arrow" aria-hidden="true">→</span>
            </span>
          </button>
        </div>
      </div>

      {/* ===== footer — classic single centered line ===== */}
      <footer className="rc-vote-footer">
        <p>© FMS@PSU{copyrightYear !== "" ? ` ${copyrightYear}` : ""}. All Rights Reserved.</p>
      </footer>

      <style jsx global>{`
        /* ================= BASE (the polling desk) ================= */
        /* laid-paper ::after + desk vignette ::before + blind-emboss seals come from
           the SHARED .rc-desk classes in ReceiptBaseStyles (T1) — this root opts in
           via the rc-desk class, matching the home reference language. */
        .rc-vote-root { --rc-stamp-red:#B91C1C; overflow-x:hidden; }

        :where(.rc-vote-root) a { text-decoration:none; color:var(--rc-ink); }
        .rc-vote-root a:focus-visible, .rc-vote-root button:focus-visible,
        .rc-vote-root [role="radio"]:focus-visible { outline:2px solid var(--rc-accent-deep); outline-offset:3px; }

        /* ---- topbar (ported 1:1 from ReceiptHome, scoped to .rc-vote-root) ---- */
        .rc-vote-root .rc-topbar { position:sticky; top:0; z-index:40;
          background:color-mix(in srgb, var(--rc-desk) 88%, transparent);
          -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
          border-bottom:1.5px solid var(--rc-stamp-line); }
        .rc-vote-root .rc-topbar__in { max-width:1120px; margin:0 auto; padding:12px 20px;
          display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
        .rc-vote-root .rc-logo { display:inline-flex; align-items:center; flex-shrink:0; }
        .rc-vote-root .rc-logo__img { height:30px; width:auto; object-fit:contain; display:block; }
        .rc-vote-root .rc-nav { display:none; gap:20px; margin-left:auto; align-items:center; }
        .rc-vote-root .rc-nav__link { font-family:var(--rc-fm); font-size:11px; letter-spacing:.16em;
          text-transform:uppercase; color:var(--rc-ink2); position:relative; padding-bottom:2px; transition:color .2s ease; }
        .rc-vote-root .rc-nav__link.on, .rc-vote-root .rc-nav__link:hover { color:var(--rc-ink); }
        .rc-vote-root .rc-nav__link::after { content:""; position:absolute; left:0; right:0; bottom:-3px; height:2px;
          background:var(--rc-accent); transform:scaleX(0); transform-origin:left; transition:transform .28s cubic-bezier(.22,1,.36,1); }
        .rc-vote-root .rc-nav__link:hover::after, .rc-vote-root .rc-nav__link.on::after { transform:scaleX(1); }
        .rc-vote-root .rc-userwrap { position:relative; margin-left:auto; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .rc-vote-root .rc-loginbtn { display:inline-flex; align-items:center; min-height:44px; font-family:var(--rc-fh);
          font-weight:600; font-size:13px; color:var(--rc-on-accent); background:var(--rc-accent); border:none; cursor:pointer;
          padding:9px 20px; border-radius:var(--rc-radius-button, 8px); transition:background .2s ease, transform .15s ease; }
        .rc-vote-root .rc-loginbtn:hover { background:var(--rc-accent-deep); transform:translateY(-1px); }
        .rc-vote-root .rc-loginbtn:active { transform:scale(.96); }
        .rc-vote-root .rc-loginbtn--skel { pointer-events:none; background:color-mix(in srgb, var(--rc-line) 70%, var(--rc-receipt)); }
        .rc-vote-root .rc-skelbar { display:block; width:58px; height:12px; border-radius:3px;
          background:color-mix(in srgb, var(--rc-ink2) 30%, var(--rc-receipt)); animation:rcPulse 1.3s ease-in-out infinite; }
        @keyframes rcPulse { 0%,100%{opacity:.45} 50%{opacity:1} }
        .rc-vote-root .rc-userchip { position:relative; }
        .rc-vote-root .rc-userchip__btn { display:inline-flex; align-items:center; gap:9px; min-height:44px; background:var(--rc-receipt);
          border:1.5px solid var(--rc-stamp-line); border-radius:var(--rc-radius-button, 8px); padding:5px 12px 5px 5px; cursor:pointer;
          font-family:inherit; transition:transform .15s ease, border-color .2s ease; }
        .rc-vote-root .rc-userchip__btn:hover { border-color:var(--rc-accent); }
        .rc-vote-root .rc-userchip__btn:active { transform:scale(.97); }
        .rc-vote-root .rc-userchip__av { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:grid; place-items:center;
          background:var(--rc-accent); color:var(--rc-on-accent); font-family:var(--rc-fh); font-weight:700; font-size:14px; line-height:1; }
        .rc-vote-root .rc-userchip__name { font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-ink);
          max-width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-vote-root .rc-userchip__caret { color:var(--rc-ink2); font-size:11px; }
        .rc-vote-root .rc-usermenu { position:absolute; top:calc(100% + 8px); right:0; width:220px; background:var(--rc-receipt);
          border:1.5px solid var(--rc-stamp-line); border-radius:10px; overflow:hidden; z-index:50;
          box-shadow:2px 20px 42px -20px color-mix(in srgb, var(--rc-ink) 22%, transparent); }
        .rc-vote-root .rc-usermenu__head { padding:14px 16px; border-bottom:1px dotted var(--rc-line); }
        .rc-vote-root .rc-usermenu__name { font-family:var(--rc-fh); font-weight:700; font-size:14px; color:var(--rc-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-vote-root .rc-usermenu__id { font-family:var(--rc-fm); font-size:10.5px; letter-spacing:.04em; color:var(--rc-ink2);
          margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-vote-root .rc-usermenu__out { display:block; width:100%; text-align:left; padding:12px 16px; background:none; border:0;
          cursor:pointer; font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-accent-deep); }
        .rc-vote-root .rc-usermenu__out:hover { background:color-mix(in srgb, var(--rc-accent) 8%, var(--rc-receipt)); }
        .rc-vote-root .rc-burger { display:inline-flex; flex-direction:column; justify-content:center; gap:4px; width:44px; height:44px;
          padding:0 11px; border-radius:8px; background:var(--rc-receipt); border:1.5px solid var(--rc-stamp-line); cursor:pointer;
          transition:transform .15s ease, border-color .2s ease; }
        .rc-vote-root .rc-burger:hover { border-color:var(--rc-accent); }
        .rc-vote-root .rc-burger:active { transform:scale(.95); }
        .rc-vote-root .rc-burger span { display:block; height:2.5px; border-radius:2px; background:var(--rc-ink); }
        .rc-vote-root .rc-sheet { flex:0 0 100%; display:flex; flex-direction:column; gap:6px; overflow:hidden; max-height:0; opacity:0;
          transition:max-height .28s ease, opacity .28s ease, padding .28s ease; }
        .rc-vote-root .rc-sheet.is-open { max-height:280px; opacity:1; padding:12px 0 4px; }
        .rc-vote-root .rc-sheet__link { display:flex; align-items:center; min-height:44px; padding:11px 16px; border-radius:8px;
          font-family:var(--rc-fm); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--rc-ink);
          background:var(--rc-receipt); border:1px solid var(--rc-line); transition:border-color .2s ease; }
        .rc-vote-root .rc-sheet__link:hover { border-color:var(--rc-accent); }

        /* ---- page container ---- */
        .rc-vote-root .rc-vote-wrap { position:relative; z-index:1; max-width:900px; margin:0 auto; padding:0 20px 200px; }
        .rc-vote-root .rc-issue { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:14px 0;
          border-bottom:1px dotted var(--rc-line); font-family:var(--rc-fm); font-size:10px; letter-spacing:.18em;
          text-transform:uppercase; color:var(--rc-faint); }

        /* ---- masthead ---- */
        .rc-vote-root .rc-vhead { margin-top:32px; padding-bottom:22px; border-bottom:1.5px solid var(--rc-stamp-line);
          animation:rcVRise .55s ease both .04s; }
        .rc-vote-root .rc-vhead__eyebrow { font-family:var(--rc-fm); font-size:10px; letter-spacing:.24em; text-transform:uppercase;
          color:var(--rc-ink2); }
        .rc-vote-root .rc-vhead__title { margin:12px 0 0; font-family:var(--rc-fh); font-weight:700; line-height:1.08;
          letter-spacing:-.01em; font-size:clamp(30px, 7vw, 52px); color:var(--rc-ink); }
        .rc-vote-root .rc-vhead__deck { margin:16px 0 0; max-width:56ch; font-family:var(--rc-fr); font-size:15px;
          line-height:1.7; color:var(--rc-ink2); }

        /* ---- voter register strip ---- */
        .rc-vote-root .rc-vvoter { margin-top:20px; display:flex; flex-wrap:wrap; gap:10px 26px; padding:14px 0 2px;
          animation:rcVRise .55s ease both .1s; }
        .rc-vote-root .rc-vvoter__row { display:inline-flex; align-items:baseline; gap:9px; font-family:var(--rc-fm);
          font-size:12px; letter-spacing:.04em; color:var(--rc-ink); min-width:0; font-variant-numeric:tabular-nums; }
        .rc-vote-root .rc-vvoter__row b { font-weight:400; letter-spacing:.14em; text-transform:uppercase; color:var(--rc-faint); }

        /* ---- the ballot sheet ---- */
        .rc-vote-root .rc-ballot { position:relative; margin-top:30px; animation:rcVRise .55s ease both .16s; }
        .rc-vote-root .rc-ballot-ghost { position:absolute; z-index:0; right:-16px; top:-24px; width:104px; height:104px;
          border-radius:50%; border:2px solid var(--rc-ink); opacity:.08; transform:rotate(-12deg); display:grid; place-items:center; }
        .rc-vote-root .rc-ballot-ghost span { font-family:var(--rc-fm); font-size:11px; letter-spacing:.14em; text-transform:uppercase;
          color:var(--rc-ink); text-align:center; }
        /* receipt-stock sheet: banding + die-cut jagged bottom edge (mask trick) */
        .rc-vote-root .rc-ballot-sheet { position:relative; z-index:1; background:var(--rc-receipt); padding:22px 22px 30px;
          border:1px solid var(--rc-line); border-bottom:none; border-radius:4px 4px 0 0;
          box-shadow:2px 16px 38px -20px color-mix(in srgb, var(--rc-ink) 32%, transparent);
          background-image:repeating-linear-gradient(180deg, transparent 0 27px, color-mix(in srgb, var(--rc-ink) 3%, transparent) 27px 28px);
          -webkit-mask:radial-gradient(7px 9px at 9px 100%, transparent 96%, #000) bottom left/18px 9px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 9px) no-repeat;
                  mask:radial-gradient(7px 9px at 9px 100%, transparent 96%, #000) bottom left/18px 9px repeat-x, linear-gradient(#000 0 0) top/100% calc(100% - 9px) no-repeat; }
        .rc-vote-root .rc-ballot-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
        .rc-vote-root .rc-ballot-head__l { font-family:var(--rc-fm); font-size:10.5px; letter-spacing:.2em; text-transform:uppercase;
          color:var(--rc-ink); font-weight:700; }
        .rc-vote-root .rc-ballot-head__r { font-family:var(--rc-fm); font-size:10.5px; letter-spacing:.12em; color:var(--rc-accent-deep);
          white-space:nowrap; font-variant-numeric:tabular-nums; }
        .rc-vote-root .rc-perf { margin:16px -22px; height:1px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }

        .rc-vote-root .rc-ballot-rows { list-style:none; margin:0; padding:0; }
        .rc-vote-root .rc-vrow { border-bottom:1px dotted var(--rc-line); animation:rcVRise .5s ease both; }
        .rc-vote-root .rc-vrow:last-child { border-bottom:none; }
        .rc-vote-root .rc-vrow:nth-child(1){animation-delay:.06s}
        .rc-vote-root .rc-vrow:nth-child(2){animation-delay:.12s}
        .rc-vote-root .rc-vrow:nth-child(3){animation-delay:.18s}
        .rc-vote-root .rc-vrow:nth-child(n+4){animation-delay:.24s}
        .rc-vote-root .rc-vrow__hit { position:relative; display:grid; grid-template-columns:auto auto auto 1fr auto; align-items:center;
          gap:16px; padding:20px 6px; cursor:pointer; color:var(--rc-ink); transition:background .2s ease; }
        .rc-vote-root .rc-vrow__hit:hover { background:color-mix(in srgb, var(--rc-accent) 5%, transparent); }
        .rc-vote-root .rc-vrow.is-selected .rc-vrow__hit { background:color-mix(in srgb, var(--rc-accent) 8%, transparent); }

        /* ink MARK-BOX — square with a heavy ink tooth; select presses an ink ✓ stamp in */
        .rc-vote-root .rc-vrow__box { width:30px; height:30px; flex:none; border:2px solid var(--rc-stamp-line); border-radius:4px;
          background:var(--rc-receipt); display:grid; place-items:center; transition:border-color .2s ease; }
        .rc-vote-root .rc-vrow__hit:hover .rc-vrow__box { border-color:var(--rc-accent); }
        .rc-vote-root .rc-vrow.is-selected .rc-vrow__box { border-color:var(--rc-accent-deep); }
        .rc-vote-root .rc-vrow__mark { font-family:var(--rc-fh); font-weight:800; font-size:22px; line-height:1; color:var(--rc-accent-deep);
          transform:scale(0) rotate(-14deg); opacity:0; transition:transform .24s cubic-bezier(.34,1.56,.64,1), opacity .18s ease; }
        .rc-vote-root .rc-vrow.is-selected .rc-vrow__mark { transform:scale(1) rotate(-8deg); opacity:1; }

        .rc-vote-root .rc-vrow__idx { font-family:var(--rc-fh); font-weight:700; font-size:clamp(22px,5.4vw,36px);
          font-variant-numeric:tabular-nums; letter-spacing:-.01em; color:var(--rc-accent-deep); flex:none; }
        .rc-vote-root .rc-vrow__logo { width:56px; height:56px; flex:none; border-radius:8px; overflow:hidden;
          background:var(--rc-receipt); border:1px solid var(--rc-line); display:grid; place-items:center; }
        .rc-vote-root .rc-vrow__logo img { width:100%; height:100%; object-fit:cover; }
        .rc-vote-root .rc-vrow__logo-ph { font-family:var(--rc-fh); font-weight:700; font-size:18px; font-variant-numeric:tabular-nums;
          color:var(--rc-accent-deep); }
        .rc-vote-root .rc-vrow__body { min-width:0; display:flex; flex-direction:column; gap:2px; }
        .rc-vote-root .rc-vrow__kick { font-family:var(--rc-fm); font-size:10px; letter-spacing:.16em; text-transform:uppercase;
          color:var(--rc-ink2); }
        .rc-vote-root .rc-vrow__kick b { color:var(--rc-accent-deep); font-weight:700; }
        .rc-vote-root .rc-vrow__name { font-family:var(--rc-fh); font-weight:700; font-size:clamp(19px,4.6vw,26px); line-height:1.16;
          letter-spacing:-.01em; color:var(--rc-ink);
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .rc-vote-root .rc-vrow__slogan { margin-top:2px; font-family:var(--rc-fr); font-size:13.5px; line-height:1.5; color:var(--rc-ink2);
          overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
        .rc-vote-root .rc-vrow__stat { margin-top:5px; font-family:var(--rc-fm); font-size:9.5px; letter-spacing:.14em;
          text-transform:uppercase; color:var(--rc-faint); }
        .rc-vote-root .rc-vrow__more { display:inline-flex; align-items:center; flex:none; min-height:44px; padding:10px 16px;
          border-radius:var(--rc-radius-button, 8px); background:none; border:1.5px solid var(--rc-ink); cursor:pointer;
          font-family:var(--rc-fh); font-weight:600; font-size:13px; color:var(--rc-ink);
          transition:border-color .2s ease, color .2s ease, transform .18s ease; }
        .rc-vote-root .rc-vrow__more:hover { border-color:var(--rc-accent-deep); color:var(--rc-accent-deep); transform:translateY(-1px); }

        /* งดออกเสียง — quieter row, KEEPS semantic ORANGE (ส้ม family; NOT var(--rc-*)) */
        .rc-vote-root .rc-vrow--abstain .rc-vrow__idx,
        .rc-vote-root .rc-vrow--abstain .rc-vrow__logo-ph,
        .rc-vote-root .rc-vrow--abstain .rc-vrow__mark { color:#ea580c; }
        .rc-vote-root .rc-vrow--abstain .rc-vrow__kick { color:#c2410c; }
        .rc-vote-root .rc-vrow--abstain .rc-vrow__hit:hover { background:color-mix(in srgb, #ea580c 5%, transparent); }
        .rc-vote-root .rc-vrow--abstain .rc-vrow__hit:hover .rc-vrow__box { border-color:#ea580c; }
        .rc-vote-root .rc-vrow--abstain.is-selected .rc-vrow__hit { background:color-mix(in srgb, #ea580c 8%, transparent); }
        .rc-vote-root .rc-vrow--abstain.is-selected .rc-vrow__box { border-color:#c2410c; }
        .rc-vote-root .rc-vrow--abstain .rc-vrow__name { font-size:clamp(17px,4vw,22px); }

        .rc-vote-root .rc-ballot-foot { margin-top:8px; text-align:center; font-family:var(--rc-fm); font-size:9px;
          letter-spacing:.24em; color:var(--rc-faint); }

        /* ---- fixed confirm bar — paper TRAY strip + foil-rim button ---- */
        .rc-vote-root .rc-vbar { position:fixed; left:0; right:0; bottom:0; z-index:38; background:var(--rc-receipt);
          box-shadow:0 -12px 30px -18px color-mix(in srgb, var(--rc-ink) 40%, transparent); }
        .rc-vote-root .rc-vbar__perf { height:4px; background:repeating-linear-gradient(90deg,
          var(--rc-stamp-line) 0 6px, transparent 6px 12px); border-top:1.5px solid var(--rc-stamp-line); }
        .rc-vote-root .rc-vbar__in { max-width:900px; margin:0 auto; padding:14px 20px; display:flex; align-items:center; gap:16px; }
        .rc-vote-root .rc-vbar__sel { min-width:0; flex:1; display:flex; flex-direction:column; gap:3px; }
        .rc-vote-root .rc-vbar__lab { font-family:var(--rc-fm); font-size:9.5px; letter-spacing:.18em; text-transform:uppercase;
          color:var(--rc-faint); }
        .rc-vote-root .rc-vbar__val { display:inline-flex; align-items:center; gap:9px; min-width:0; font-family:var(--rc-fh);
          font-weight:700; font-size:clamp(16px,4.2vw,22px); line-height:1.15; color:var(--rc-ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rc-vote-root .rc-vbar__val--empty { color:var(--rc-faint); font-weight:600; }
        .rc-vote-root .rc-vbar__dot { width:10px; height:10px; flex:none; background:var(--rc-accent); transform:rotate(45deg); }
        /* abstain keeps its semantic orange */
        .rc-vote-root .rc-vbar__val.is-abstain { color:#c2410c; }
        .rc-vote-root .rc-vbar__val.is-abstain .rc-vbar__dot { background:#ea580c; }
        /* foil-rim confirm button — foil RIM behind an accent fill, text on top (rc-cta idiom) */
        .rc-vote-root .rc-vbar__btn { position:relative; isolation:isolate; flex:none; border:none; cursor:pointer;
          padding:15px 26px; border-radius:var(--rc-radius-button, 8px); background:transparent; transition:transform .18s ease; }
        .rc-vote-root .rc-vbar__btn .rc-foil { position:absolute; inset:-2px; z-index:0; border-radius:calc(var(--rc-radius-button, 8px) + 2px); }
        .rc-vote-root .rc-vbar__btn::before { content:""; position:absolute; inset:0; z-index:1; border-radius:inherit;
          background:var(--rc-accent); transition:background .2s ease; }
        .rc-vote-root .rc-vbar__btn-in { position:relative; z-index:2; display:inline-flex; align-items:center; justify-content:center;
          gap:9px; font-family:var(--rc-fh); font-weight:700; font-size:16px; color:var(--rc-on-accent); }
        .rc-vote-root .rc-vbar__arrow { transition:transform .2s ease; }
        .rc-vote-root .rc-vbar.is-ready .rc-vbar__btn:hover { transform:translateY(-2px); }
        .rc-vote-root .rc-vbar.is-ready .rc-vbar__btn:hover::before { background:var(--rc-accent-deep); }
        .rc-vote-root .rc-vbar.is-ready .rc-vbar__btn:hover .rc-vbar__arrow { transform:translateX(3px); }
        .rc-vote-root .rc-vbar__btn:active { transform:scale(.98); }
        .rc-vote-root .rc-vbar__btn:disabled { cursor:not-allowed; }
        .rc-vote-root .rc-vbar__btn:disabled::before { background:color-mix(in srgb, var(--rc-ink2) 22%, var(--rc-line)); }
        .rc-vote-root .rc-vbar__btn:disabled .rc-vbar__btn-in { color:color-mix(in srgb, var(--rc-receipt) 88%, var(--rc-ink)); }

        /* ---- footer ---- */
        .rc-vote-root .rc-vote-footer { position:relative; z-index:1; margin-top:8px; padding:22px 0; border-top:1px dotted var(--rc-line);
          text-align:center; }
        .rc-vote-root .rc-vote-footer p { margin:0; font-family:var(--rc-fm); font-size:10px; letter-spacing:.12em;
          text-transform:uppercase; color:var(--rc-ink2); }

        /* holographic foil (.rc-foil + rcFoilDrift keyframe) shared via .rc-desk (T1). */

        @keyframes rcVRise { from { opacity:0; transform:translateY(14px); } }

        /* ================= TABLET+ : inline nav replaces burger/sheet ================= */
        @media (min-width:768px) {
          .rc-vote-root .rc-topbar__in { gap:22px; }
          .rc-vote-root .rc-nav { display:flex; }
          .rc-vote-root .rc-userwrap { margin-left:0; }
          .rc-vote-root .rc-burger, .rc-vote-root .rc-sheet { display:none; }
          .rc-vote-root .rc-vrow__hit { gap:20px; padding:22px 10px; }
        }

        /* ================= MOBILE (<=560): rows reflow, tap targets >=44px ================= */
        @media (max-width:560px) {
          .rc-vote-root .rc-vote-wrap { padding-bottom:210px; }
          .rc-vote-root .rc-vrow__hit { grid-template-columns:auto auto 1fr; grid-template-areas:"box idx body" "more more more";
            gap:12px 12px; padding:16px 4px; }
          .rc-vote-root .rc-vrow__box { grid-area:box; align-self:center; }
          .rc-vote-root .rc-vrow__idx { grid-area:idx; align-self:center; }
          .rc-vote-root .rc-vrow__logo { display:none; }
          .rc-vote-root .rc-vrow__body { grid-area:body; }
          .rc-vote-root .rc-vrow__more { grid-area:more; justify-content:center; width:100%; }
          .rc-vote-root .rc-vbar__in { flex-direction:column; align-items:stretch; gap:10px; padding:12px 18px; }
          .rc-vote-root .rc-vbar__btn { width:100%; }
        }

        /* reduced motion — freeze every animation (foil stays statically iridescent),
           full ballot visible. Scoped to .rc-vote-root. */
        @media (prefers-reduced-motion:reduce) {
          .rc-vote-root *, .rc-vote-root *::before, .rc-vote-root *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
