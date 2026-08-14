"use client";

// FmsOfficialVote — the ballot for the FMS Official template. Two modes, both
// driven by the props the shared vote page already computes:
//
//   MULTI  (regularParties.length > 1) — every party as an equal option, plus
//          งดออกเสียง as an explicitly offered choice rather than a way out.
//   SINGLE (isSingleParty)             — one party standing, so the ballot
//          becomes รับรอง / ไม่รับรอง / งดออกเสียง (CLAUDE.md: number -1 is the
//          disapprove option, number 0 is abstain).
//
// Design rules this screen holds itself to, in order of importance:
//   1. Selection must be unmistakable at a glance — a filled brand band, a solid
//      ring and a check mark, not a 1px border change. A voter must never submit
//      while unsure which row is armed.
//   2. Nothing that carries meaning may be hidden behind an animation. The
//      project has shipped invisible ballots before by gating them on framer
//      reveals; every option here is painted by CSS at rest.
//   3. Options are visually equal. Abstain and disapprove get the same footprint
//      as a party — a ballot that makes one choice easier to click than another
//      is not neutral.

import { useMemo } from "react";
import { Check, Info, Loader2, ShieldCheck, Users } from "lucide-react";
import { getPath } from "../../utils/basePath";
import FmsOfficialShell from "./FmsOfficialShell";
import FmsOfficialSingleParty from "./FmsOfficialSingleParty";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { fmsMeta } from "../home/FmsOfficialChrome";

const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

// One option row. `kind` only changes the leading glyph — never the size, the
// padding or the hit area (rule 3 above).
function Option({ opt, selected, onSelect, onViewDetails, editorMode }) {
  const logo = resolveSrc(opt.logoUrl);
  const teamSize = (opt.members || []).length;

  return (
    <li role="presentation">
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        className={`fo-opt ${selected ? "is-selected" : ""}`}
        onClick={editorMode ? undefined : () => onSelect(opt.id)}
      >
        <span className="fo-opt__mark" aria-hidden>
          {selected ? <Check size={18} strokeWidth={3} /> : null}
        </span>

        <span className={`fo-opt__badge fo-opt__badge--${opt.kind}`}>
          {opt.kind === "party"
            ? opt.number
            : opt.kind === "disapprove" ? "✕" : "—"}
        </span>

        {opt.kind === "party" && (
          <span className="fo-opt__logo">
            {logo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={logo} alt="" aria-hidden />
              : <span className="fo-opt__logo-fb" aria-hidden>{String(opt.name || "").trim().charAt(0)}</span>}
          </span>
        )}

        <span className="fo-opt__body">
          <b className="fo-opt__name">{opt.label}</b>
          {opt.sub && <span className="fo-opt__sub">{opt.sub}</span>}
          {opt.kind === "party" && teamSize > 0 && (
            <span className="fo-opt__team"><Users size={13} aria-hidden /> ทีมงาน {teamSize} คน</span>
          )}
        </span>

        {opt.kind === "party" && (
          // A span, not a nested button: a <button> inside a <button> is invalid
          // and browsers resolve it by dropping the inner one, which silently
          // kills the details affordance.
          <span
            role="link"
            tabIndex={0}
            className="fo-opt__details"
            onClick={(e) => { e.stopPropagation(); if (!editorMode) onViewDetails(opt.id); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault(); e.stopPropagation();
                if (!editorMode) onViewDetails(opt.id);
              }
            }}
          >
            <Info size={15} aria-hidden /> รายละเอียด
          </span>
        )}
      </button>
    </li>
  );
}

export default function FmsOfficialVote({
  regularParties = [], specialOptions = {}, selectedPartyId = null,
  onSelect = () => {}, onViewDetails = () => {}, isSingleParty = false,
  user = null, onConfirm = () => {}, isSubmitting = false, editorMode = false,
}) {
  const globalConfig = useGlobalConfig();
  const meta = fmsMeta(globalConfig);

  const options = useMemo(() => {
    const abstain = specialOptions?.abstain;
    const out = [];
    regularParties.forEach((p) => out.push({ ...p, kind: "party", label: p.name, sub: p.slogan || "" }));
    if (abstain) out.push({ ...abstain, kind: "abstain", label: "งดออกเสียง", sub: "ใช้สิทธิ์โดยไม่เลือกผู้สมัครรายใด" });
    return out;
  }, [regularParties, specialOptions]);

  // A one-party election asks a different question — endorse or reject, rather
  // than pick — and it cannot be asked honestly with a party the voter has been
  // shown nothing about. That screen is its own component: the dossier first,
  // the three choices at the foot of it.
  if (isSingleParty) {
    return (
      <FmsOfficialSingleParty
        party={regularParties[0] || {}}
        specialOptions={specialOptions}
        selectedPartyId={selectedPartyId}
        onSelect={onSelect}
        user={user}
        onConfirm={onConfirm}
        isSubmitting={isSubmitting}
        editorMode={editorMode}
      />
    );
  }

  const chosen = options.find((o) => o.id === selectedPartyId) || null;

  return (
    <FmsOfficialShell
      active="vote"
      kicker={`${meta.campaign} · ปีการศึกษา ${meta.ay}`}
      title={isSingleParty ? "ลงคะแนนรับรองผู้สมัคร" : "ลงคะแนนเลือกตั้ง"}
      desc={
        isSingleParty
          ? "ปีนี้มีผู้สมัครเพียงพรรคเดียว โปรดเลือกว่าจะรับรอง ไม่รับรอง หรืองดออกเสียง เลือกได้หนึ่งข้อ"
          : "เลือกได้หนึ่งข้อเท่านั้น เมื่อยืนยันแล้วจะไม่สามารถแก้ไขได้"
      }
      editorMode={editorMode}
    >
      {user?.name && (
        <p className="fo-voter">
          กำลังลงคะแนนในนาม <b>{user.name}</b>
        </p>
      )}

      {/* radiogroup, not a row of buttons. With `aria-pressed` a screen reader
          announced three independent toggles; the one fact a voter must be told
          here is that these are mutually exclusive and exactly one applies. */}
      <ul className="fo-opts" role="radiogroup" aria-label={isSingleParty ? "ตัวเลือกการรับรอง" : "รายชื่อผู้สมัคร"}>
        {options.map((o) => (
          <Option
            key={o.id}
            opt={o}
            selected={o.id === selectedPartyId}
            onSelect={onSelect}
            onViewDetails={onViewDetails}
            editorMode={editorMode}
          />
        ))}
      </ul>

      {/* The submit bar is sticky so the action is reachable without scrolling
          back up on a long ballot, and it states the current selection in words —
          the last chance to catch a mis-tap before an irreversible submit. */}
      <div className="fo-submit">
        <div className="fo-submit__in">
          <span className="fo-submit__state">
            {chosen
              ? <>เลือกไว้: <b>{chosen.label}</b></>
              : <span className="fo-note">ยังไม่ได้เลือก</span>}
          </span>
          <button
            type="button"
            className="fo-btn fo-btn--primary"
            disabled={!chosen || isSubmitting || editorMode}
            onClick={editorMode ? undefined : onConfirm}
          >
            {isSubmitting
              ? <><Loader2 size={17} className="fo-spin" aria-hidden /> กำลังบันทึก…</>
              : <>ยืนยันการลงคะแนน</>}
          </button>
        </div>
      </div>

      <p className="fo-privacy">
        <ShieldCheck size={15} aria-hidden />
        ระบบบันทึกเฉพาะตัวเลือกในรูปแบบเข้ารหัส ไม่ผูกกับบัญชีของคุณ ไม่มีใครย้อนดูได้ว่าคุณเลือกอะไร
      </p>

      <style jsx global>{`
        .fo-voter { margin: 0 0 18px; font-size: 14px; font-weight: 300; color: var(--fo-muted); }
        .fo-voter b { font-weight: 500; color: var(--fo-ink); }

        .fo-opts { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }

        .fo-opt {
          width: 100%; text-align: left; cursor: pointer; font-family: inherit;
          display: grid; grid-template-columns: 28px 58px auto 1fr auto; align-items: center; gap: 16px;
          padding: 18px 22px; border-radius: 12px;
          background: var(--fo-surface); border: 1px solid var(--fo-line);
          transition: border-color .16s, background .16s, box-shadow .16s;
        }
        /* Abstain / disapprove have no logo cell, so they carry one column fewer.
           Declared rather than left to auto-placement so their badge and text line
           up with the party rows above them. */
        .fo-opt:has(.fo-opt__badge--abstain),
        .fo-opt:has(.fo-opt__badge--disapprove) { grid-template-columns: 28px 58px 1fr auto; }

        .fo-opt:hover { border-color: var(--fo-brand-soft); background: var(--fo-tint); }
        /* Selection: 2px brand ring + tinted field + a filled check. Three signals,
           because one is not enough on a screen someone reads once and commits to. */
        .fo-opt.is-selected {
          border-color: var(--fo-brand); box-shadow: inset 0 0 0 1px var(--fo-brand);
          background: var(--fo-tint);
        }

        .fo-opt__mark {
          width: 28px; height: 28px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          border: 2px solid var(--fo-line); color: #fff; background: transparent;
        }
        .fo-opt.is-selected .fo-opt__mark { background: var(--fo-brand); border-color: var(--fo-brand); }

        .fo-opt__badge {
          width: 58px; height: 58px; border-radius: 12px;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 26px; font-weight: 600; line-height: 1;
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
        }
        .fo-opt__badge--party { background: var(--fo-brand); color: #fff; }
        /* The non-party options are neutral, not alarming: a red "ไม่รับรอง" would
           editorialise a choice the ballot is supposed to present evenly. */
        .fo-opt__badge--disapprove,
        .fo-opt__badge--abstain { background: var(--fo-bg); color: var(--fo-muted); border: 1px solid var(--fo-line); font-size: 22px; }

        .fo-opt__logo {
          width: 58px; height: 58px; border-radius: 10px; overflow: hidden;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--fo-bg); border: 1px solid var(--fo-line);
        }
        .fo-opt__logo img { width: 100%; height: 100%; object-fit: contain; }
        .fo-opt__logo-fb { font-size: 22px; font-weight: 600; color: var(--fo-brand-soft); }

        .fo-opt__body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .fo-opt__name { font-size: 18px; font-weight: 500; color: var(--fo-ink); }
        .fo-opt__sub { font-size: 13.5px; font-weight: 300; color: var(--fo-muted); }
        .fo-opt__team { display: inline-flex; align-items: center; gap: 6px; margin-top: 2px; font-size: 12.5px; font-weight: 300; color: var(--fo-brand-soft); }

        .fo-opt__details {
          display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; cursor: pointer;
          padding: 8px 14px; border-radius: 8px;
          font-size: 13.5px; font-weight: 400; color: var(--fo-muted);
          background: var(--fo-surface); border: 1px solid var(--fo-line);
          transition: color .16s, border-color .16s;
        }
        .fo-opt__details:hover { color: var(--fo-brand); border-color: var(--fo-brand); }

        /* The safe-area pad is not cosmetic: pinned to bottom:0 on iOS the bar sits
           under the home indicator, so the confirm button — the one control this
           page exists for — is the exact strip the gesture bar eats. Zero on every
           device without an inset. */
        .fo-submit {
          position: sticky; bottom: 0; z-index: 20; margin-top: 22px;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .fo-submit__in {
          display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
          padding: 16px 20px; border-radius: 12px;
          background: var(--fo-surface); border: 1px solid var(--fo-line);
          box-shadow: 0 -6px 24px -18px rgba(36, 30, 40, .5);
        }
        .fo-submit__state { font-size: 14.5px; font-weight: 300; color: var(--fo-muted); }
        .fo-submit__state b { font-weight: 500; color: var(--fo-ink); }
        .fo-spin { animation: fo-spin 1s linear infinite; }
        @keyframes fo-spin { to { transform: rotate(360deg); } }

        .fo-privacy {
          display: flex; align-items: flex-start; gap: 8px; margin: 20px 0 0;
          font-size: 13px; font-weight: 300; line-height: 1.6; color: var(--fo-muted);
        }
        .fo-privacy svg { flex: 0 0 auto; margin-top: 2px; color: var(--fo-brand-soft); }

        @media (max-width: 760px) {
          .fo-opt { grid-template-columns: 24px 46px auto 1fr; gap: 12px; padding: 15px 16px; }
          .fo-opt:has(.fo-opt__badge--abstain),
          .fo-opt:has(.fo-opt__badge--disapprove) { grid-template-columns: 24px 46px 1fr; }
          .fo-opt__mark { width: 24px; height: 24px; }
          .fo-opt__badge { width: 46px; height: 46px; font-size: 21px; border-radius: 10px; }
          .fo-opt__logo { width: 46px; height: 46px; }
          .fo-opt__name { font-size: 16px; }
          /* the details chip would take a fourth column the phone has no room for;
             it moves under the text as a full-width row instead of disappearing,
             because on a ballot "read more before you commit" must stay reachable */
          .fo-opt__details { grid-column: 1 / -1; justify-content: center; margin-top: 4px; }
          .fo-submit__in { flex-direction: column; align-items: stretch; }
          .fo-submit .fo-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </FmsOfficialShell>
  );
}
