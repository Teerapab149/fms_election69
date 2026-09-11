"use client";

// VoteConfirm — the last screen before a ballot is cast, in each family's own hand.
//
// Until now every family except receipt shared one white rounded modal built from
// slate greys. On studio-dark it dropped a bright white card onto a near-black
// editorial page; on gumroad it dropped a soft card into a world of 3px black
// borders. The moment the vote becomes irreversible is the worst place in the flow
// to look like a different product.
//
// One dispatcher, one behaviour core, one skin per family. Behaviour is shared on
// purpose: Escape, the scrim, the focus move and the submitting lock are safety
// properties of a confirm step, not decoration, and they must not drift per family.
// Receipt keeps its existing paper slip (it already had its own); the classic skin
// below replaces the old shared modal, which had no dialog role, no Escape and no
// focus move — on the DEFAULT template.
//
// Semantic tones (abstain amber / disapprove red) are FIXED, deliberately not
// family tokens: "งดออกเสียง" and "ไม่รับรอง" must not read as a brand accent in one
// template and a warning in another. Same rule ReceiptConfirmSlip already follows.

import { useEffect, useRef } from "react";
import { Check, X, Ban, UserX, Loader2 } from "lucide-react";
import { getPath } from "../../utils/basePath";
import { ReceiptConfirmSlip } from "./ReceiptVote";
import { gumroadTheme } from "../../utils/gumroadPalettes";
import { blossomTheme } from "../../utils/blossomPalettes";
import { verdureTheme } from "../../utils/verdurePalettes";
import { studioDarkTheme } from "../../utils/studioDarkPalettes";
import { fmsOfficialTheme } from "../../utils/fmsOfficialPalette";

// en = ป้ายอังกฤษกำกับตัวเลือก สำหรับนักศึกษาต่างชาติในคณะ
//
// กติกา: ไทยคือภาษาหลัก อังกฤษเป็นป้ายเล็ก ๆ จาง ๆ ต่อท้ายเท่านั้น ห้ามแทนที่ ห้ามใหญ่เท่า
// ห้ามมาก่อนไทย — คนที่อ่านอังกฤษไม่ออกต้องอ่านหน้านี้รู้เรื่องเท่าเดิมเป๊ะ ๆ
// ใส่เฉพาะ "ชั้น 1" คือสิ่งที่ไม่เข้าใจแล้วลงคะแนนผิด (ตัวเลือก/ปุ่มยืนยัน/สถานะบัตร)
// ไม่แตะเนื้อหาที่สโมสรฯ กรอกเอง (ชื่อพรรค นโยบาย พันธกิจ) — ระบบแปลให้ไม่ได้อยู่แล้ว
const TONES = {
  party: { accent: null, soft: null, line: null },
  abstain: { accent: "#c2410c", soft: "#fff7ed", line: "#fdba74", label: "งดออกเสียง", en: "ABSTAIN", sub: "ไม่ประสงค์ลงคะแนนเสียง" },
  disapprove: { accent: "#b91c1c", soft: "#fef2f2", line: "#fca5a5", label: "ไม่รับรอง", en: "DISAPPROVE", sub: "ไม่ประสงค์ให้ผู้สมัครได้รับเลือก" },
};

function toneOf(isVoteNo, isDisapprove) {
  return isVoteNo ? "abstain" : isDisapprove ? "disapprove" : "party";
}

// The choice, as text. Never rendered anywhere but this sheet — once confirmed the
// selection lives only in the encrypted ballot.
function choiceOf(party, tone) {
  if (tone !== "party") return { label: TONES[tone].label, en: TONES[tone].en, sub: TONES[tone].sub, number: null };
  // ชื่อพรรคไม่มีป้ายอังกฤษ — เป็นข้อความที่สโมสรฯ กรอกเอง ไม่ใช่ศัพท์ของระบบ
  return { label: party?.name || "—", en: null, sub: party?.number != null ? `เบอร์ ${party.number}` : null, number: party?.number ?? null };
}

// Shared behaviour: dialog semantics, Escape, scrim, focus, submitting lock. Every
// skin below renders inside this — none of them re-implement any of it.
function ConfirmShell({ isOpen, onClose, isSubmitting, rootClass, scrim, vars, children }) {
  const panel = useRef(null);
  useEffect(() => {
    if (!isOpen) return undefined;
    const first = panel.current?.querySelector("[data-confirm-focus]");
    first?.focus();
    const onKey = (e) => { if (e.key === "Escape" && !isSubmitting) onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [isOpen, isSubmitting, onClose]);
  if (!isOpen) return null;
  return (
    <div className={`vc-root ${rootClass}`} style={vars} role="dialog" aria-modal="true" aria-label="ยืนยันการลงคะแนน">
      <div className="vc-scrim" style={scrim ? { background: scrim } : undefined} onClick={!isSubmitting ? onClose : undefined} />
      <div className="vc-panel" ref={panel}>{children}</div>
      <style jsx global>{`
        .vc-root { position:fixed; inset:0; z-index:100000; display:flex; align-items:center; justify-content:center; padding:20px; }
        .vc-root * { box-sizing:border-box; }
        .vc-scrim { position:absolute; inset:0; background:rgba(12,8,14,.62); -webkit-backdrop-filter:blur(3px); backdrop-filter:blur(3px); }
        .vc-panel { position:relative; width:100%; max-width:430px; max-height:calc(100vh - 40px); overflow-y:auto;
          animation:vcIn .26s cubic-bezier(.22,1,.36,1) both; }
        .vc-root button { font-family:inherit; cursor:pointer; }
        .vc-root button:disabled { cursor:not-allowed; }
        .vc-act { display:flex; align-items:center; justify-content:center; gap:9px; min-height:50px; padding:13px 18px;
          font-size:15px; font-weight:700; line-height:1.5; width:100%; white-space:nowrap; }
        .vc-act svg { flex:none; }
        .vc-btns { display:flex; flex-direction:column-reverse; gap:10px; }
        .vc-logo { width:100%; height:100%; object-fit:contain; }
        /* ป้ายอังกฤษกำกับ — เล็กและจางกว่าไทยเสมอ อยู่ต่อท้ายบรรทัดเดียวกัน */
        .vc-en { font-size:.6em; font-weight:600; letter-spacing:.14em; opacity:.5; margin-left:7px; white-space:nowrap; }
        @media(min-width:480px) { .vc-btns { flex-direction:row; } .vc-btns > * { flex:1; } }
        .vc-spin { animation:vcSpin 1s linear infinite; }
        @keyframes vcIn { from { opacity:0; transform:translateY(14px) scale(.97); } to { opacity:1; transform:none; } }
        @keyframes vcSpin { to { transform:rotate(360deg); } }
        @media(prefers-reduced-motion:reduce) { .vc-panel { animation:none; } }
      `}</style>
    </div>
  );
}

// Submit label — one place, so no skin invents its own wording for the busy state.
const ConfirmLabel = ({ busy, text = "ยืนยันคะแนน" }) => busy
  ? <><Loader2 size={19} className="vc-spin" aria-hidden /> กำลังบันทึก…</>
  : <><Check size={19} strokeWidth={3} aria-hidden /> {text}</>;

const ToneMark = ({ tone, size = 30 }) => tone === "abstain"
  ? <Ban size={size} strokeWidth={2.2} aria-hidden />
  : <UserX size={size} strokeWidth={2.2} aria-hidden />;

// What goes in each skin's badge: the party logo when there is one, the party
// number when there is not, the semantic icon for abstain / disapprove. A plain
// img on purpose — these are arbitrary DB upload paths for a 54px badge, which
// next/image cannot help with and would need per-path remote config for.
/* eslint-disable-next-line @next/next/no-img-element */
const PartyLogo = ({ party }) => <img className="vc-logo" src={getPath(party.logoUrl)} alt="" />;

function ChoiceMark({ tone, party, number, size = 24 }) {
  if (tone !== "party") return <ToneMark tone={tone} size={size} />;
  if (party?.logoUrl) return <PartyLogo party={party} />;
  return <span>{number ?? "—"}</span>;
}

// ─────────────────────────────────────────────────────────────── BLOSSOM ──
// Candy editorial: a hand-written note. Ink hairline, generous radius, pill
// buttons, and the choice pinned like a stamp on stationery.
// Each skin resolves its OWN palette from the slug and hands it to the shell as
// inline vars. The sheet is a fixed overlay rendered by the PAGE, not by the family
// component, so it sits outside .gum-root / .bl-root / .sd-root / .vd-root and the
// family vars simply do not reach it — gumroad's rendered as an unstyled transparent
// card the first time round. Same reason VoteCastScene resolves its palette in JS.
// The family root classes cannot just be added here either: .sd-root and .bl-root
// paint a full-height background, which on a fixed overlay would cover the page.
function BlossomConfirm(props) {
  const { onClose, onConfirm, party, isSubmitting } = props;
  const b = blossomTheme(props.family);
  const vars = { "--bl-card": b.card, "--bl-ink": b.ink, "--bl-ink2": b.ink2, "--bl-line": b.line, "--bl-primary": b.primary, "--bl-primary-deep": b.primaryDeep, "--bl-primary-ink": b.primaryInk, "--bl-primary-soft": b.primarySoft, "--bl-on-primary": b.onPrimary };
  const tone = toneOf(props.isVoteNo, props.isDisapprove);
  const c = choiceOf(party, tone);
  const t = TONES[tone];
  return (
    <ConfirmShell {...props} vars={vars} rootClass="vc-bl" scrim="color-mix(in srgb, var(--bl-ink) 58%, transparent)">
      <div className="vc-bl__card">
        <button type="button" className="vc-bl__x" onClick={onClose} disabled={isSubmitting} aria-label="ปิด"><X size={18} /></button>
        <span className="vc-bl__kicker">ONE LAST LOOK</span>
        <h2 className="vc-bl__title">ยืนยันการลงคะแนน</h2>
        <p className="vc-bl__deck">ตรวจดูอีกครั้งนะ เมื่อยืนยันแล้วจะแก้ไขไม่ได้</p>
        <div className="vc-bl__pick" style={tone !== "party" ? { background: t.soft, borderColor: t.line } : undefined}>
          <div className="vc-bl__badge" style={tone !== "party" ? { color: t.accent } : undefined}>
            {tone === "party" && !party?.logoUrl ? <span className="vc-bl__num">{c.number ?? "—"}</span> : <ChoiceMark tone={tone} party={party} number={c.number} size={26} />}
          </div>
          <div className="vc-bl__meta">
            <span className="vc-bl__lead" style={tone !== "party" ? { color: t.accent } : undefined}>ท่านเลือก</span>
            <strong style={tone !== "party" ? { color: t.accent } : undefined}>{c.label}{c.en && <span className="vc-en">{c.en}</span>}</strong>
            {c.sub && <span className="vc-bl__sub">{c.sub}</span>}
          </div>
        </div>
        <div className="vc-btns">
          <button type="button" className="vc-act vc-bl__ghost" onClick={onClose} disabled={isSubmitting}>ยกเลิก</button>
          <button type="button" data-confirm-focus className="vc-act vc-bl__go" onClick={onConfirm} disabled={isSubmitting}
            style={tone !== "party" ? { background: t.accent, borderColor: t.accent } : undefined}><ConfirmLabel busy={isSubmitting} /></button>
        </div>
      </div>
      <style jsx global>{`
        .vc-bl .vc-bl__card { position:relative; background:var(--bl-card); border:1.5px solid var(--bl-ink); border-radius:28px;
          padding:30px 26px 26px; color:var(--bl-ink); box-shadow:0 26px 60px -24px color-mix(in srgb, var(--bl-ink) 45%, transparent); }
        .vc-bl .vc-bl__x { position:absolute; top:14px; right:14px; display:grid; place-items:center; width:36px; height:36px;
          border-radius:50%; border:0; background:transparent; color:var(--bl-ink2); }
        .vc-bl .vc-bl__x:hover { background:color-mix(in srgb, var(--bl-primary) 12%, var(--bl-card)); }
        .vc-bl .vc-bl__kicker { display:block; font-family:var(--bl-fm); font-size:11px; letter-spacing:.16em; color:var(--bl-primary-ink); }
        .vc-bl .vc-bl__title { margin:10px 0 0; font-family:var(--bl-fd); font-size:26px; font-weight:700; line-height:1.4; }
        .vc-bl .vc-bl__deck { margin:8px 0 0; font-size:13.5px; line-height:1.8; color:var(--bl-ink2); }
        .vc-bl .vc-bl__pick { display:flex; align-items:center; gap:14px; margin:20px 0 22px; padding:14px;
          border:1.5px solid var(--bl-line); border-radius:20px; background:var(--bl-primary-soft); }
        .vc-bl .vc-bl__badge { display:grid; place-items:center; flex:none; width:54px; height:54px; overflow:hidden;
          border-radius:50%; background:var(--bl-card); border:1.5px solid var(--bl-ink); color:var(--bl-primary-ink); }
        .vc-bl .vc-bl__num { font-family:var(--bl-fd); font-size:20px; font-weight:800; }
        .vc-bl .vc-bl__meta { min-width:0; display:flex; flex-direction:column; gap:2px; }
        .vc-bl .vc-bl__lead { font-family:var(--bl-fm); font-size:10px; letter-spacing:.12em; color:var(--bl-primary-ink); }
        .vc-bl .vc-bl__meta strong { font-family:var(--bl-fd); font-size:17px; font-weight:700; line-height:1.4; overflow-wrap:anywhere; }
        .vc-bl .vc-bl__sub { font-size:12.5px; color:var(--bl-ink2); }
        .vc-bl .vc-act { border-radius:999px; }
        .vc-bl .vc-bl__go { background:var(--bl-primary-deep); color:var(--bl-on-primary,#fff); border:1.5px solid var(--bl-primary-deep); }
        .vc-bl .vc-bl__ghost { background:transparent; color:var(--bl-ink); border:1.5px solid var(--bl-ink); }
        .vc-bl .vc-bl__ghost:hover:not(:disabled) { background:color-mix(in srgb, var(--bl-primary) 10%, var(--bl-card)); }
        .vc-bl button:disabled { opacity:.62; }
      `}</style>
    </ConfirmShell>
  );
}

// ─────────────────────────────────────────────────────────────── GUMROAD ──
// Chunky stamp: 3px ink border, hard offset shadow, nothing soft anywhere. The
// choice is a punched ticket; the confirm is a lime slab.
function GumroadConfirm(props) {
  const { onClose, onConfirm, party, isSubmitting } = props;
  const g = gumroadTheme(props.family);
  const vars = { "--ink": g.ink, "--ink2": g.ink2, "--cream": g.cream, "--paper": g.paper, "--pink": g.pink, "--lime": g.lime };
  const tone = toneOf(props.isVoteNo, props.isDisapprove);
  const c = choiceOf(party, tone);
  const t = TONES[tone];
  return (
    <ConfirmShell {...props} vars={vars} rootClass="vc-gm" scrim="color-mix(in srgb, var(--ink) 72%, transparent)">
      <div className="vc-gm__card">
        <div className="vc-gm__bar">
          <span>CONFIRM · ยืนยัน</span>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="ปิด"><X size={17} strokeWidth={3} /></button>
        </div>
        <div className="vc-gm__body">
          <h2 className="vc-gm__title">ยืนยันคะแนนนี้?</h2>
          <p className="vc-gm__deck">กดยืนยันแล้วเปลี่ยนไม่ได้นะ เช็กอีกรอบ!</p>
          <div className="vc-gm__ticket" style={tone !== "party" ? { background: t.soft } : undefined}>
            <div className="vc-gm__stub" style={tone !== "party" ? { color: t.accent } : undefined}>
              <ChoiceMark tone={tone} party={party} number={c.number} />
            </div>
            <div className="vc-gm__meta">
              <span className="vc-gm__lead">YOUR PICK</span>
              <strong style={tone !== "party" ? { color: t.accent } : undefined}>{c.label}{c.en && <span className="vc-en">{c.en}</span>}</strong>
              {c.sub && <span className="vc-gm__sub">{c.sub}</span>}
            </div>
          </div>
          <div className="vc-btns">
            <button type="button" className="vc-act vc-gm__ghost" onClick={onClose} disabled={isSubmitting}>ยกเลิก</button>
            <button type="button" data-confirm-focus className="vc-act vc-gm__go" onClick={onConfirm} disabled={isSubmitting}
              style={tone !== "party" ? { background: t.accent, color: "#fff" } : undefined}><ConfirmLabel busy={isSubmitting} text="ยืนยัน!" /></button>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .vc-gm .vc-gm__card { background:var(--paper); border:3px solid var(--ink); box-shadow:8px 8px 0 var(--ink); color:var(--ink); }
        .vc-gm .vc-gm__bar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 14px;
          background:var(--ink); color:var(--cream); font-size:11px; font-weight:800; letter-spacing:.14em; }
        .vc-gm .vc-gm__bar button { display:grid; place-items:center; width:30px; height:30px; border:0; background:transparent; color:var(--cream); }
        .vc-gm .vc-gm__body { padding:24px 22px 22px; }
        .vc-gm .vc-gm__title { margin:0; font-size:27px; font-weight:900; line-height:1.35; letter-spacing:-.02em; }
        .vc-gm .vc-gm__deck { margin:8px 0 0; font-size:13.5px; line-height:1.75; color:var(--ink2,var(--ink)); }
        .vc-gm .vc-gm__ticket { display:flex; align-items:center; gap:14px; margin:20px 0 22px; padding:13px;
          background:var(--pink); border:3px solid var(--ink); box-shadow:4px 4px 0 var(--ink); }
        .vc-gm .vc-gm__stub { display:grid; place-items:center; flex:none; width:54px; height:54px; overflow:hidden;
          background:var(--paper); border:3px solid var(--ink); font-size:20px; font-weight:900; }
        .vc-gm .vc-gm__meta { min-width:0; display:flex; flex-direction:column; gap:1px; }
        .vc-gm .vc-gm__lead { font-size:9.5px; font-weight:800; letter-spacing:.16em; }
        .vc-gm .vc-gm__meta strong { font-size:18px; font-weight:900; line-height:1.35; overflow-wrap:anywhere; }
        .vc-gm .vc-gm__sub { font-size:12.5px; font-weight:700; }
        .vc-gm .vc-act { border-radius:2px; border:3px solid var(--ink); font-weight:800; }
        .vc-gm .vc-gm__go { background:var(--lime); color:var(--ink); box-shadow:4px 4px 0 var(--ink); }
        .vc-gm .vc-gm__go:active:not(:disabled) { transform:translate(3px,3px); box-shadow:1px 1px 0 var(--ink); }
        .vc-gm .vc-gm__ghost { background:var(--paper); color:var(--ink); }
        .vc-gm button:disabled { opacity:.6; }
      `}</style>
    </ConfirmShell>
  );
}

// ───────────────────────────────────────────────────────── STUDIO DARK ──
// Editorial dark: numbered chapter mark, mono rules, a serif italic line, and a
// single lime pill. Nothing rounded except that pill.
function StudioDarkConfirm(props) {
  const { onClose, onConfirm, party, isSubmitting } = props;
  const d = studioDarkTheme(props.family);
  const vars = { "--sd-bg": d.bg, "--sd-bg-2": d.bg2, "--sd-ink": d.ink, "--sd-ink-2": d.ink2, "--sd-accent": d.accent, "--sd-line-strong": d.lineStrong };
  const tone = toneOf(props.isVoteNo, props.isDisapprove);
  const c = choiceOf(party, tone);
  const t = TONES[tone];
  return (
    <ConfirmShell {...props} vars={vars} rootClass="vc-sd" scrim="rgba(6,7,4,.82)">
      <div className="vc-sd__card">
        <div className="vc-sd__rail">
          <span className="vc-sd__num">04</span>
          <span className="vc-sd__slash">/</span>
          <span className="vc-sd__step">CONFIRM</span>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="ปิด"><X size={17} /></button>
        </div>
        <h2 className="vc-sd__title">Cast this<br /><em>vote.</em></h2>
        <p className="vc-sd__deck">ยืนยันแล้วแก้ไขไม่ได้ ตรวจสอบอีกครั้งก่อนส่ง</p>
        <div className="vc-sd__pick">
          <span className="vc-sd__lead">ท่านเลือก</span>
          <div className="vc-sd__row">
            <span className="vc-sd__mark" style={tone !== "party" ? { color: t.accent, borderColor: t.accent } : undefined}>
              <ChoiceMark tone={tone} party={party} number={c.number} size={20} />
            </span>
            <span className="vc-sd__meta">
              <strong style={tone !== "party" ? { color: t.accent } : undefined}>{c.label}{c.en && <span className="vc-en">{c.en}</span>}</strong>
              {c.sub && <span>{c.sub}</span>}
            </span>
          </div>
        </div>
        <div className="vc-btns">
          <button type="button" className="vc-act vc-sd__ghost" onClick={onClose} disabled={isSubmitting}>ยกเลิก</button>
          <button type="button" data-confirm-focus className="vc-act vc-sd__go" onClick={onConfirm} disabled={isSubmitting}
            style={tone !== "party" ? { background: t.accent, color: "#fff" } : undefined}><ConfirmLabel busy={isSubmitting} /></button>
        </div>
      </div>
      <style jsx global>{`
        .vc-sd .vc-sd__card { background:var(--sd-bg-2); border:1px solid var(--sd-line-strong); border-radius:4px;
          padding:22px 24px 24px; color:var(--sd-ink); }
        .vc-sd .vc-sd__rail { display:flex; align-items:center; gap:10px; padding-bottom:16px; border-bottom:1px solid var(--sd-line-strong);
          font-family:var(--sd-mono,ui-monospace,monospace); font-size:11px; letter-spacing:.18em; }
        .vc-sd .vc-sd__num { color:var(--sd-accent); }
        .vc-sd .vc-sd__slash,.vc-sd .vc-sd__step { color:var(--sd-ink-2); }
        .vc-sd .vc-sd__rail button { margin-left:auto; display:grid; place-items:center; width:30px; height:30px;
          border:0; background:transparent; color:var(--sd-ink-2); }
        .vc-sd .vc-sd__rail button:hover:not(:disabled) { color:var(--sd-ink); }
        .vc-sd .vc-sd__title { margin:22px 0 0; font-size:38px; font-weight:400; line-height:1.08; letter-spacing:-.02em; }
        .vc-sd .vc-sd__title em { font-family:var(--sd-serif); font-style:italic; color:var(--sd-accent); }
        .vc-sd .vc-sd__deck { margin:14px 0 0; font-size:13px; line-height:1.85; color:var(--sd-ink-2); }
        .vc-sd .vc-sd__pick { margin:20px 0 24px; padding:16px 0; border-top:1px solid var(--sd-line-strong); border-bottom:1px solid var(--sd-line-strong); }
        .vc-sd .vc-sd__lead { display:block; font-family:var(--sd-mono,ui-monospace,monospace); font-size:10px; letter-spacing:.18em; color:var(--sd-ink-2); }
        .vc-sd .vc-sd__row { display:flex; align-items:center; gap:14px; margin-top:12px; }
        .vc-sd .vc-sd__mark { display:grid; place-items:center; flex:none; width:46px; height:46px; overflow:hidden; border-radius:50%;
          border:1px solid var(--sd-accent); color:var(--sd-accent); font-size:17px; font-weight:600; }
        .vc-sd .vc-sd__meta { min-width:0; display:flex; flex-direction:column; gap:2px; }
        .vc-sd .vc-sd__meta strong { font-size:18px; font-weight:600; line-height:1.4; overflow-wrap:anywhere; }
        .vc-sd .vc-sd__meta span { font-size:12.5px; color:var(--sd-ink-2); }
        .vc-sd .vc-act { border-radius:999px; }
        .vc-sd .vc-sd__go { background:var(--sd-accent); color:var(--sd-bg); border:1px solid var(--sd-accent); }
        .vc-sd .vc-sd__ghost { background:transparent; color:var(--sd-ink); border:1px solid var(--sd-line-strong); }
        .vc-sd .vc-sd__ghost:hover:not(:disabled) { border-color:var(--sd-ink-2); }
        .vc-sd button:disabled { opacity:.55; }
      `}</style>
    </ConfirmShell>
  );
}

// ─────────────────────────────────────────────────────────────── VERDURE ──
// Terrarium glass on moss, cream type, everything rounded, the choice held in a
// pressed-leaf plate.
function VerdureConfirm(props) {
  const { onClose, onConfirm, party, isSubmitting } = props;
  const v = verdureTheme(props.family);
  const vars = { "--moss": v.moss, "--moss-2": v.moss2, "--cream": v.cream, "--terra-soft": v.soft, "--rule-moss": v.moss3 };
  const tone = toneOf(props.isVoteNo, props.isDisapprove);
  const c = choiceOf(party, tone);
  const t = TONES[tone];
  return (
    <ConfirmShell {...props} vars={vars} rootClass="vc-vd" scrim="color-mix(in srgb, var(--moss) 78%, transparent)">
      <div className="vc-vd__card">
        <button type="button" className="vc-vd__x" onClick={onClose} disabled={isSubmitting} aria-label="ปิด"><X size={18} /></button>
        <span className="vc-vd__kicker">BEFORE IT GROWS</span>
        <h2 className="vc-vd__title">ยืนยันการลงคะแนน</h2>
        <p className="vc-vd__deck">เมื่อยืนยันแล้วจะแก้ไขไม่ได้ ตรวจสอบอีกครั้งก่อนหย่อนบัตร</p>
        <div className="vc-vd__plate">
          <div className="vc-vd__seed" style={tone !== "party" ? { color: t.accent, background: t.soft } : undefined}>
            <ChoiceMark tone={tone} party={party} number={c.number} />
          </div>
          <div className="vc-vd__meta">
            <span className="vc-vd__lead">ท่านเลือก</span>
            <strong>{c.label}{c.en && <span className="vc-en">{c.en}</span>}</strong>
            {c.sub && <span className="vc-vd__sub">{c.sub}</span>}
          </div>
        </div>
        <div className="vc-btns">
          <button type="button" className="vc-act vc-vd__ghost" onClick={onClose} disabled={isSubmitting}>ยกเลิก</button>
          <button type="button" data-confirm-focus className="vc-act vc-vd__go" onClick={onConfirm} disabled={isSubmitting}
            style={tone !== "party" ? { background: t.accent, color: "#fff", borderColor: t.accent } : undefined}><ConfirmLabel busy={isSubmitting} /></button>
        </div>
      </div>
      <style jsx global>{`
        .vc-vd .vc-vd__card { position:relative; border-radius:26px; padding:30px 26px 26px; color:var(--cream);
          background:color-mix(in srgb, var(--moss-2) 88%, transparent); border:1px solid var(--rule-moss);
          -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); box-shadow:0 30px 70px -30px rgba(0,0,0,.6); }
        .vc-vd .vc-vd__x { position:absolute; top:15px; right:15px; display:grid; place-items:center; width:36px; height:36px;
          border-radius:50%; border:1px solid var(--rule-moss); background:transparent; color:var(--cream); }
        .vc-vd .vc-vd__kicker { display:block; font-size:10px; letter-spacing:.2em; color:var(--terra-soft); }
        .vc-vd .vc-vd__title { margin:12px 0 0; font-family:var(--fd); font-size:26px; font-weight:400; line-height:1.42; }
        .vc-vd .vc-vd__deck { margin:10px 0 0; font-size:13px; line-height:1.85; opacity:.82; }
        .vc-vd .vc-vd__plate { display:flex; align-items:center; gap:14px; margin:22px 0; padding:14px; border-radius:20px;
          background:color-mix(in srgb, var(--cream) 8%, transparent); border:1px solid var(--rule-moss); }
        .vc-vd .vc-vd__seed { display:grid; place-items:center; flex:none; width:54px; height:54px; overflow:hidden; border-radius:50%;
          background:color-mix(in srgb, var(--cream) 92%, transparent); color:var(--moss); font-size:19px; font-weight:700; }
        .vc-vd .vc-vd__meta { min-width:0; display:flex; flex-direction:column; gap:2px; }
        .vc-vd .vc-vd__lead { font-size:10px; letter-spacing:.14em; color:var(--terra-soft); }
        .vc-vd .vc-vd__meta strong { font-size:17px; font-weight:600; line-height:1.4; overflow-wrap:anywhere; }
        .vc-vd .vc-vd__sub { font-size:12.5px; opacity:.78; }
        .vc-vd .vc-act { border-radius:999px; }
        .vc-vd .vc-vd__go { background:var(--cream); color:var(--moss); border:1px solid var(--cream); }
        .vc-vd .vc-vd__ghost { background:transparent; color:var(--cream); border:1px solid var(--rule-moss); }
        .vc-vd .vc-vd__ghost:hover:not(:disabled) { background:color-mix(in srgb, var(--cream) 10%, transparent); }
        .vc-vd button:disabled { opacity:.6; }
      `}</style>
    </ConfirmShell>
  );
}

// ────────────────────────────────────────────────────────── FMS OFFICIAL ──
// The faculty's own register: a plum masthead over a paper sheet, the choice set
// as a ruled record line. Formal in structure, current in weight — no engraving,
// no Thai numerals, per the family's brief.
function FmsOfficialConfirm(props) {
  const { onClose, onConfirm, party, isSubmitting } = props;
  const o = fmsOfficialTheme(props.family);
  const vars = { "--fo-surface": o.surface, "--fo-ink": o.ink, "--fo-muted": o.muted, "--fo-line": o.line, "--fo-tint": o.tint, "--fo-brand": o.brand, "--fo-plum-deep": o.plumDeep };
  const tone = toneOf(props.isVoteNo, props.isDisapprove);
  const c = choiceOf(party, tone);
  const t = TONES[tone];
  return (
    <ConfirmShell {...props} vars={vars} rootClass="vc-fo" scrim="rgba(28,20,32,.68)">
      <div className="vc-fo__card">
        <div className="vc-fo__head">
          <span>ยืนยันการลงคะแนน</span>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="ปิด"><X size={17} /></button>
        </div>
        <div className="vc-fo__body">
          <p className="vc-fo__deck">โปรดตรวจสอบตัวเลือกของท่านอีกครั้ง เมื่อยืนยันแล้วระบบจะบันทึกคะแนนทันทีและไม่สามารถแก้ไขได้</p>
          <div className="vc-fo__record" style={tone !== "party" ? { background: t.soft, borderColor: t.line } : undefined}>
            <div className="vc-fo__seal" style={tone !== "party" ? { color: t.accent, borderColor: t.line } : undefined}>
              <ChoiceMark tone={tone} party={party} number={c.number} />
            </div>
            <div className="vc-fo__meta">
              <span className="vc-fo__lead">ตัวเลือกของท่าน</span>
              <strong style={tone !== "party" ? { color: t.accent } : undefined}>{c.label}{c.en && <span className="vc-en">{c.en}</span>}</strong>
              {c.sub && <span className="vc-fo__sub">{c.sub}</span>}
            </div>
          </div>
          <div className="vc-btns">
            <button type="button" className="vc-act vc-fo__ghost" onClick={onClose} disabled={isSubmitting}>ยกเลิก</button>
            <button type="button" data-confirm-focus className="vc-act vc-fo__go" onClick={onConfirm} disabled={isSubmitting}
              style={tone !== "party" ? { background: t.accent, borderColor: t.accent } : undefined}><ConfirmLabel busy={isSubmitting} /></button>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .vc-fo .vc-fo__card { background:var(--fo-surface); border-radius:14px; overflow:hidden; color:var(--fo-ink);
          box-shadow:0 30px 64px -28px rgba(20,12,24,.6); }
        .vc-fo .vc-fo__head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 18px;
          background:var(--fo-plum-deep,var(--fo-brand-deep)); color:#fff; font-size:15px; font-weight:700; }
        .vc-fo .vc-fo__head button { display:grid; place-items:center; width:30px; height:30px; border:0; background:transparent; color:#fff; }
        .vc-fo .vc-fo__body { padding:20px 20px 22px; }
        .vc-fo .vc-fo__deck { margin:0; font-size:13.5px; line-height:1.85; color:var(--fo-muted); }
        .vc-fo .vc-fo__record { display:flex; align-items:center; gap:14px; margin:18px 0 22px; padding:14px;
          border:1px solid var(--fo-line); border-left:4px solid var(--fo-brand); border-radius:10px; background:var(--fo-tint); }
        .vc-fo .vc-fo__seal { display:grid; place-items:center; flex:none; width:54px; height:54px; overflow:hidden; border-radius:50%;
          background:var(--fo-surface); border:1px solid var(--fo-line); color:var(--fo-brand); font-size:19px; font-weight:700; }
        .vc-fo .vc-fo__meta { min-width:0; display:flex; flex-direction:column; gap:2px; }
        .vc-fo .vc-fo__lead { font-size:10.5px; letter-spacing:.1em; color:var(--fo-muted); }
        .vc-fo .vc-fo__meta strong { font-size:17px; font-weight:700; line-height:1.4; overflow-wrap:anywhere; }
        .vc-fo .vc-fo__sub { font-size:12.5px; color:var(--fo-muted); }
        .vc-fo .vc-act { border-radius:9px; }
        .vc-fo .vc-fo__go { background:var(--fo-brand); color:#fff; border:1px solid var(--fo-brand); }
        .vc-fo .vc-fo__ghost { background:var(--fo-surface); color:var(--fo-ink); border:1px solid var(--fo-line); }
        .vc-fo .vc-fo__ghost:hover:not(:disabled) { background:var(--fo-tint); }
        .vc-fo button:disabled { opacity:.6; }
      `}</style>
    </ConfirmShell>
  );
}

// ───────────────────────────────────────────────────── CLASSIC / ORIGINAL ──
// The default template, and the one the old shared modal was really designed for.
// Kept close to what it looked like — white sheet, soft brand card, gradient
// confirm — but rebuilt on the shell so it finally gets what the old one never
// had: dialog semantics, Escape, a focus move and a scroll lock. It is the
// template a fresh install boots into, so it should not be the least accessible.
function ClassicConfirm(props) {
  const { onClose, onConfirm, party, isSubmitting } = props;
  const tone = toneOf(props.isVoteNo, props.isDisapprove);
  const c = choiceOf(party, tone);
  const t = TONES[tone];
  return (
    <ConfirmShell {...props} rootClass="vc-os">
      <div className="vc-os__card">
        <button type="button" className="vc-os__x" onClick={onClose} disabled={isSubmitting} aria-label="ปิด"><X size={18} /></button>
        <span className="vc-os__kicker">ขั้นตอนสุดท้าย</span>
        <h2 className="vc-os__title">ยืนยันการลงคะแนน</h2>
        <p className="vc-os__deck">โปรดตรวจสอบความถูกต้อง เมื่อยืนยันแล้วจะไม่สามารถแก้ไขได้</p>
        <div className="vc-os__pick" style={tone !== "party" ? { background: t.soft, borderColor: t.line } : undefined}>
          <div className="vc-os__badge" style={tone !== "party" ? { color: t.accent, borderColor: t.line } : undefined}>
            <ChoiceMark tone={tone} party={party} number={c.number} />
          </div>
          <div className="vc-os__meta">
            <span className="vc-os__lead" style={tone !== "party" ? { color: t.accent } : undefined}>ท่านเลือก</span>
            <strong style={tone !== "party" ? { color: t.accent } : undefined}>{c.label}{c.en && <span className="vc-en">{c.en}</span>}</strong>
            {c.sub && <span className="vc-os__sub">{c.sub}</span>}
          </div>
        </div>
        <div className="vc-btns">
          <button type="button" className="vc-act vc-os__ghost" onClick={onClose} disabled={isSubmitting}>ยกเลิก</button>
          <button type="button" data-confirm-focus className="vc-act vc-os__go" onClick={onConfirm} disabled={isSubmitting}
            style={tone !== "party" ? { background: t.accent, backgroundImage: "none" } : undefined}><ConfirmLabel busy={isSubmitting} /></button>
        </div>
      </div>
      <style jsx global>{`
        .vc-os { --c-brand:var(--color-primary,#8a2680); --c-accent:var(--color-accent,#c026d3);
          --c-deep:color-mix(in srgb, var(--color-primary,#8a2680) 74%, #120a13);
          --c-soft:color-mix(in srgb, var(--color-primary,#8a2680) 7%, var(--color-surface,#fff));
          --c-line:color-mix(in srgb, var(--color-primary,#8a2680) 20%, var(--color-surface,#fff)); }
        .vc-os .vc-os__card { position:relative; background:var(--color-surface,#fff); border-radius:24px; padding:30px 26px 26px;
          color:var(--color-text,#29232e); box-shadow:0 30px 64px -28px rgba(20,12,24,.55); }
        .vc-os .vc-os__x { position:absolute; top:14px; right:14px; display:grid; place-items:center; width:36px; height:36px;
          border-radius:50%; border:0; background:transparent; color:var(--color-text-muted,#655e6c); }
        .vc-os .vc-os__x:hover:not(:disabled) { background:var(--c-soft); color:var(--color-text,#29232e); }
        .vc-os .vc-os__kicker { display:block; font-size:10.5px; font-weight:700; letter-spacing:.14em; color:var(--c-brand); }
        .vc-os .vc-os__title { margin:10px 0 0; font-size:25px; font-weight:800; line-height:1.4; letter-spacing:-.015em; }
        .vc-os .vc-os__deck { margin:8px 0 0; font-size:13.5px; line-height:1.8; color:var(--color-text-muted,#655e6c); }
        .vc-os .vc-os__pick { display:flex; align-items:center; gap:14px; margin:20px 0 22px; padding:14px;
          border:1px solid var(--c-line); border-left:4px solid var(--c-brand); border-radius:16px; background:var(--c-soft); }
        .vc-os .vc-os__badge { display:grid; place-items:center; flex:none; width:54px; height:54px; overflow:hidden; border-radius:50%;
          background:var(--color-surface,#fff); border:1px solid var(--c-line); color:var(--c-brand); font-size:19px; font-weight:800; }
        .vc-os .vc-os__meta { min-width:0; display:flex; flex-direction:column; gap:2px; }
        .vc-os .vc-os__lead { font-size:10px; font-weight:700; letter-spacing:.12em; color:var(--c-brand); }
        .vc-os .vc-os__meta strong { font-size:17px; font-weight:700; line-height:1.4; overflow-wrap:anywhere; }
        .vc-os .vc-os__sub { font-size:12.5px; color:var(--color-text-muted,#655e6c); }
        .vc-os .vc-act { border-radius:12px; }
        .vc-os .vc-os__go { color:#fff; border:1px solid transparent; background-color:var(--c-brand);
          background-image:linear-gradient(120deg, var(--c-deep), var(--c-brand) 55%, var(--c-accent));
          box-shadow:0 10px 22px -12px color-mix(in srgb, var(--c-deep) 70%, transparent); }
        .vc-os .vc-os__ghost { background:var(--color-bg,#f8f9fd); color:var(--color-text,#29232e); border:1px solid var(--c-line); }
        .vc-os .vc-os__ghost:hover:not(:disabled) { background:var(--c-soft); }
        .vc-os button:disabled { opacity:.62; }
      `}</style>
    </ConfirmShell>
  );
}

const SKINS = {
  classic: ClassicConfirm,
  blossom: BlossomConfirm,
  gumroad: GumroadConfirm,
  "studio-dark": StudioDarkConfirm,
  verdure: VerdureConfirm,
  "fms-official": FmsOfficialConfirm,
};

// Accepts a full slug (gumroad-cyber) or a bare family — the colour variants all
// read the same family vars, so only the prefix matters. "original", "classic" and
// the token-only legacy templates (modern-dark / playful / minimal) all render the
// classic layout, so they all land on the classic skin, which is token-driven.
export function confirmFamilyOf(templateId) {
  const id = String(templateId || "");
  if (id.startsWith("receipt")) return "receipt";
  return Object.keys(SKINS).find((f) => f !== "classic" && id.startsWith(f)) || "classic";
}

export default function VoteConfirm({ family, ...rest }) {
  const key = confirmFamilyOf(family);
  if (key === "receipt") return <ReceiptConfirmSlip {...rest} />;
  const Skin = SKINS[key] || SKINS.classic;
  // family stays on the props: each skin resolves its own colour variant from the
  // full slug (gumroad-cyber, verdure-honey, …), not just the family prefix.
  return <Skin family={family} {...rest} />;
}
