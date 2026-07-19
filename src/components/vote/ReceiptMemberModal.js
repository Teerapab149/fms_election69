"use client";

// ReceiptMemberModal — the member modal in the RECEIPT family's dossier language,
// replacing the shared (dark, classic) CandidateModal on ReceiptParty. The concept
// is a CANDIDATE FILE CARD pulled from the party file: receipt-stock cardstock
// (grain + a cut corner + a perforated stub edge + a one-directional press shadow)
// laid on an opaque ink scrim (A3 / ruling #4: NO backdrop-filter). Latin/digits
// ONLY ever wear the mono face (A10.3); Thai UI sentences never end with "." .
//
// v2-R13 — TWO presentation modes, chosen from the data:
//   • CUTOUT MODE (member.modalImageUrl present) — the record becomes a wide (760px)
//     two-column FILE with the person presented BIG: a full-height "desk stage" on
//     the left (faint press-ring + a ghost faculty ship + a mono number stamp) with
//     the portrait standing frameless on it (object-fit:contain, feet on an ellipse
//     contact shadow), and the name / role / record on the right. Built for a clean
//     transparent-PNG cutout (owner's intent) but degrades gracefully for an opaque
//     studio JPG (a portrait ~2:3 nearly fills the stage; letterbox is negligible).
//   • FALLBACK MODE (no modalImageUrl) — the original ink-stamp-framed portrait card
//     (unchanged look/behaviour) using imageUrl.
// Both modes: click the portrait → its OWN lightbox; a faint faculty ship mark seals
// the corner (the system seal).
//
// Colours flow ONLY through var(--rc-*). The overlay carries the `rc-root` class so
// the global .rc-root custom-property declarations (emitted once by ReceiptBaseStyles
// on the page) resolve on it even though ReceiptParty portals this to <document.body>
// (R5d anti-clip) — a two-class rule neutralises .rc-root's own background / height so
// only the scrim shows. A theme swap re-tints the card in place.

import { getPath } from "../../utils/basePath";
import React, { useEffect, useRef, useState } from "react";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { ReceiptShipMark } from "../home/ReceiptTheme";

const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

function useEscape(active, onClose) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onClose]);
}

export default function ReceiptMemberModal({ member = null, onClose = () => {} }) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const closeRef = useRef(null);

  useEscape(!!member, () => { lightboxOpen ? setLightboxOpen(false) : onClose(); });

  // focus the close stub when the card opens (a11y — focus enters the dialog)
  useEffect(() => {
    if (member && !lightboxOpen) closeRef.current?.focus();
  }, [member, lightboxOpen]);

  if (!member) return null;

  const hasCutout = !!member.modalImageUrl;
  const src = resolveSrc(member.modalImageUrl || member.imageUrl);
  const idSuffix = member.studentId ? String(member.studentId).slice(-3) : pad2(member.number ?? 0);

  // the record column — shared by both modes (frame + cutout)
  const idBlock = (
    <div className="rcm__id">
      <span className="rcm__kick rc-mono">CANDIDATE · <span className="rc-th">ผู้สมัคร</span></span>
      <h3 className="rcm__name">{member.name}</h3>
      {(member.position || member.major) && (
        <p className="rcm__role">{[member.position, member.major].filter(Boolean).join(" · ")}</p>
      )}

      <dl className="rcm__reg">
        {member.studentId && (
          <div>
            <dt><span className="rc-mono">STUDENT ID</span> <span className="rc-th">· รหัสนักศึกษา</span></dt>
            <dd className="rc-mono">{member.studentId}</dd>
          </div>
        )}
        {member.position && (
          <div>
            <dt><span className="rc-mono">POSITION</span> <span className="rc-th">· ตำแหน่ง</span></dt>
            <dd>{member.position}</dd>
          </div>
        )}
        {member.major && (
          <div>
            <dt><span className="rc-mono">MAJOR</span> <span className="rc-th">· สาขาวิชา</span></dt>
            <dd>{member.major}</dd>
          </div>
        )}
      </dl>
    </div>
  );

  return (
    <div className="rc-root rcm" role="dialog" aria-modal="true" aria-label={member.name || "แฟ้มผู้สมัคร"} onClick={onClose}>
      <div className={`rcm__card rc-grain${hasCutout ? " is-cutout" : ""}`} onClick={(e) => e.stopPropagation()}>
        {/* faint faculty ship mark pressed into the corner — the system seal */}
        <ReceiptShipMark className="rcm__ship" strokeWidth={3} />

        {/* file header — mono, Latin/digits only */}
        <div className="rcm__head">
          <span className="rcm__head-l rc-mono">CANDIDATE FILE · {prefix} {number}</span>
          <span className="rcm__head-r rc-mono">No. {pad2(member.number ?? 0)}</span>
        </div>
        <div className="rcm__perf" aria-hidden="true" />

        {/* close stub */}
        <button type="button" ref={closeRef} className="rcm__x rc-mono" onClick={onClose} aria-label="ปิด">✕</button>

        {hasCutout ? (
          /* CUTOUT MODE — the person presented big, standing on a desk stage */
          <div className="rcm__body rcm__body--hero">
            <div className="rcm__stage">
              <ReceiptShipMark className="rcm__stage-ship" strokeWidth={3} />
              <span className="rcm__stage-ring" aria-hidden="true" />
              <span className="rcm__contact" aria-hidden="true" />
              <button
                type="button"
                className="rcm__hero"
                onClick={() => setLightboxOpen(true)}
                aria-label="ขยายรูป"
              >
                <img src={src} alt={member.name || ""} />
              </button>
              <span className="rcm__hero-no rc-mono" aria-hidden="true">No.{pad2(member.number ?? 0)} · {idSuffix}</span>
            </div>
            {idBlock}
          </div>
        ) : (
          /* FALLBACK MODE — the original ink-stamp-framed portrait card */
          <div className="rcm__body">
            {/* portrait in an ink-stamp double-ring frame — click opens its own lightbox */}
            <button
              type="button"
              className={`rcm__photo${src ? "" : " is-empty"}`}
              onClick={() => src && setLightboxOpen(true)}
              aria-label={src ? "ขยายรูป" : undefined}
              disabled={!src}
            >
              {src
                ? <img src={src} alt={member.name || ""} />
                : <span className="rcm__photo-ph" aria-hidden="true">{(member.name || "?").trim().charAt(0)}</span>}
              <span className="rcm__photo-no rc-mono" aria-hidden="true">{idSuffix}</span>
            </button>

            {idBlock}
          </div>
        )}
      </div>

      {/* the portrait's OWN lightbox — solid ink scrim, NO backdrop-filter */}
      {lightboxOpen && src && (
        <div className="rcm-lb" onClick={() => setLightboxOpen(false)} role="dialog" aria-modal="true" aria-label="ภาพขยาย">
          <button type="button" className="rcm-lb__x rc-mono" onClick={() => setLightboxOpen(false)} aria-label="ปิด">✕</button>
          <img src={src} alt={member.name || ""} onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <style jsx global>{`
        /* overlay carries .rc-root for the var declarations; a two-class rule strips
           .rc-root's page background / height so only the ink scrim shows (A3: NO
           backdrop-filter — opaque ink wash instead). */
        .rc-root.rcm { position:fixed; inset:0; z-index:9200; min-height:0; display:grid; place-items:center;
          padding:20px; overflow-y:auto; cursor:pointer;
          background:color-mix(in srgb, var(--rc-ink) 82%, transparent);
          animation:rcmFade .2s ease both; }
        @keyframes rcmFade { from { opacity:0; } }
        .rcm .rc-mono { font-family:var(--rc-fm); }
        .rcm .rc-th { font-family:var(--rc-fr) !important; }

        .rcm__card { position:relative; cursor:auto; width:min(560px,100%); margin:auto;
          background:var(--rc-receipt); color:var(--rc-ink);
          border:1px solid var(--rc-stamp-line); border-radius:4px 4px 6px 6px; overflow:hidden;
          padding:0 24px 26px; clip-path:polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%);
          box-shadow:3px 22px 46px -22px color-mix(in srgb, var(--rc-ink) 62%, transparent);
          animation:rcmRise .3s cubic-bezier(.16,1,.3,1) both; }
        @keyframes rcmRise { from { opacity:0; transform:translateY(18px) scale(.97); } }
        /* SVG grain — inherits the shared .rc-grain overlay from ReceiptBaseStyles */

        /* faint faculty ship mark — the system seal in the lower-right corner */
        .rcm__ship { position:absolute; right:-14px; bottom:-16px; width:150px; height:150px;
          color:var(--rc-ink); opacity:.05; transform:rotate(-9deg); pointer-events:none; z-index:0; }

        .rcm__head { position:relative; z-index:2; display:flex; align-items:baseline; justify-content:space-between;
          gap:12px; padding:15px 26px 11px 2px; }
        .rcm__head-l { font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--rc-faint); }
        .rcm__head-r { font-size:10px; letter-spacing:.12em; color:var(--rc-ink2); font-variant-numeric:tabular-nums; }
        .rcm__perf { position:relative; z-index:2; height:2px; margin:0 -24px 0 2px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 6px, transparent 6px 12px); }

        .rcm__x { position:absolute; top:11px; right:12px; z-index:5; width:34px; height:34px; display:grid; place-items:center;
          border-radius:50%; cursor:pointer; font-size:14px; line-height:1; color:var(--rc-ink2);
          background:var(--rc-desk); border:1.5px solid var(--rc-stamp-line);
          transition:transform .15s ease, border-color .2s ease, color .2s ease, background .2s ease; }
        .rcm__x:hover { color:var(--rc-on-accent); background:var(--rc-accent-deep); border-color:var(--rc-accent-deep); }
        .rcm__x:active { transform:scale(.94); }

        .rcm__body { position:relative; z-index:2; display:grid; grid-template-columns:auto 1fr; gap:22px; align-items:start;
          padding-top:20px; }

        /* ===== v2-R13 CUTOUT MODE — the person presented BIG on a desk stage ===== */
        .rcm__card.is-cutout { width:min(760px,100%); }
        .rcm__body--hero { grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr); gap:26px; align-items:stretch; }

        /* the stage: a pressed paper panel the cutout stands on */
        .rcm__stage { position:relative; min-width:0; display:flex; align-items:flex-end; justify-content:center;
          padding:12px 8px 0; border-radius:3px;
          background:linear-gradient(180deg, color-mix(in srgb, var(--rc-desk) 55%, var(--rc-receipt)) 0%, var(--rc-receipt) 100%); }
        /* a faint press-ring behind the person (the file's stamp impression) */
        .rcm__stage-ring { position:absolute; left:50%; top:46%; transform:translate(-50%,-50%);
          width:78%; aspect-ratio:1; border-radius:50%; pointer-events:none;
          border:1.5px dashed color-mix(in srgb, var(--rc-accent-deep) 22%, transparent);
          box-shadow:inset 0 0 0 7px color-mix(in srgb, var(--rc-accent) 6%, transparent); }
        .rcm__stage-ship { position:absolute; left:50%; top:52%; transform:translate(-50%,-50%) rotate(-6deg);
          width:60%; height:auto; color:var(--rc-ink); opacity:.06; pointer-events:none; }
        /* contact shadow — the ellipse under the feet that lands the cutout on paper */
        .rcm__contact { position:absolute; left:50%; bottom:12px; transform:translateX(-50%);
          width:62%; height:16px; border-radius:50%; pointer-events:none;
          background:radial-gradient(closest-side, color-mix(in srgb, var(--rc-ink) 34%, transparent), transparent 78%);
          filter:blur(1px); }

        /* the cutout itself — FRAMELESS, tall, feet on the contact shadow */
        .rcm__hero { position:relative; z-index:2; display:block; width:100%; height:clamp(320px,46vh,470px);
          padding:0; border:none; background:none; cursor:zoom-in;
          transition:transform .25s cubic-bezier(.16,1,.3,1); animation:rcmStand .5s cubic-bezier(.16,1,.3,1) both .06s; }
        @keyframes rcmStand { from { opacity:0; transform:translateY(14px); } }
        .rcm__hero:hover { transform:translateY(-3px); }
        /* width:auto keeps the plate hugging the image — no letterbox gap for an
           opaque studio photo, and a transparent PNG still stands free. The soft
           corner + drop-shadow read as a photo plate on paper for opaque files and
           are invisible on a true cutout. */
        .rcm__hero img { display:block; width:auto; max-width:100%; height:100%; margin:0 auto;
          object-fit:contain; object-position:bottom center; border-radius:3px;
          filter:drop-shadow(2px 10px 12px color-mix(in srgb, var(--rc-ink) 28%, transparent)); }
        /* mono number stamped on the stage, bottom-left */
        .rcm__hero-no { position:absolute; left:10px; bottom:10px; z-index:3; padding:3px 8px; font-size:9.5px;
          letter-spacing:.12em; color:var(--rc-receipt); border-radius:3px; font-variant-numeric:tabular-nums;
          background:color-mix(in srgb, var(--rc-ink) 76%, transparent); }

        /* cutout mode gives the record a bit more air + a bigger name */
        .rcm__body--hero .rcm__id { align-self:center; }
        .rcm__body--hero .rcm__name { font-size:clamp(24px,5.6vw,34px); }

        /* portrait in an ink-stamp double-ring frame (mirrors rc-folder__logo) */
        .rcm__photo { position:relative; width:132px; height:158px; flex:none; padding:0; cursor:zoom-in; overflow:hidden;
          border-radius:6px; background:var(--rc-desk); border:2px solid var(--rc-stamp-line); display:grid; place-items:center;
          box-shadow:inset 0 0 0 4px var(--rc-receipt), inset 0 0 0 5px color-mix(in srgb, var(--rc-stamp-line) 55%, transparent);
          transition:transform .2s ease, border-color .2s ease; }
        .rcm__photo:hover { transform:translateY(-2px); border-color:var(--rc-accent); }
        .rcm__photo.is-empty { cursor:default; }
        .rcm__photo img { width:100%; height:100%; object-fit:cover; border-radius:2px; }
        .rcm__photo-ph { font-family:var(--rc-fh); font-weight:700; font-size:44px; color:var(--rc-accent-deep); }
        .rcm__photo-no { position:absolute; left:6px; bottom:6px; z-index:2; padding:2px 7px; font-size:9px; letter-spacing:.1em;
          color:var(--rc-receipt); background:color-mix(in srgb, var(--rc-ink) 78%, transparent); border-radius:3px;
          font-variant-numeric:tabular-nums; }

        .rcm__id { min-width:0; }
        .rcm__kick { font-size:9.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--rc-faint); }
        .rcm__name { margin:8px 0 0; font-family:var(--rc-fh); font-weight:700; line-height:1.1; letter-spacing:-.01em;
          font-size:clamp(22px,5.4vw,30px); color:var(--rc-ink); overflow-wrap:break-word; }
        .rcm__role { margin:6px 0 0; font-family:var(--rc-fr); font-size:13.5px; line-height:1.45; color:var(--rc-ink2); }

        .rcm__reg { margin:18px 0 0; padding:0; display:flex; flex-direction:column; }
        .rcm__reg > div { display:flex; flex-direction:column; gap:3px; padding:11px 0; border-top:1px dotted var(--rc-line); }
        .rcm__reg > div:first-child { border-top:none; padding-top:0; }
        .rcm__reg dt { font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:var(--rc-faint); }
        .rcm__reg dd { margin:0; font-family:var(--rc-fr); font-weight:700; font-size:15px; color:var(--rc-ink);
          overflow-wrap:break-word; }
        .rcm__reg dd.rc-mono { font-family:var(--rc-fm); font-weight:600; letter-spacing:.04em; font-variant-numeric:tabular-nums; }

        /* portrait lightbox — its own, solid ink scrim (no backdrop-filter) */
        .rcm-lb { position:absolute; inset:0; z-index:9300; display:grid; place-items:center; padding:24px; cursor:zoom-out;
          background:color-mix(in srgb, var(--rc-ink) 88%, transparent); animation:rcmFade .2s ease both; }
        .rcm-lb img { max-width:100%; max-height:85vh; object-fit:contain; border-radius:4px; cursor:auto;
          box-shadow:0 40px 90px -30px rgba(0,0,0,.6); }
        .rcm-lb__x { position:absolute; top:18px; right:18px; width:44px; height:44px; border-radius:50%; display:grid; place-items:center;
          cursor:pointer; font-size:16px; color:var(--rc-receipt);
          background:color-mix(in srgb, var(--rc-ink) 40%, transparent);
          border:1.5px solid color-mix(in srgb, var(--rc-receipt) 40%, transparent); }

        .rc-root.rcm a:focus-visible, .rc-root.rcm button:focus-visible {
          outline:2px solid var(--rc-accent); outline-offset:3px; }

        /* phones — cutout stacks ON TOP and stays BIG (owner: ต้องเห็นตัวคนชัด),
           the record scrolls beneath it inside the card */
        @media (max-width:560px) {
          .rcm__body--hero { grid-template-columns:1fr; gap:16px; }
          .rcm__stage { padding:10px 8px 0; min-height:0; }
          .rcm__hero { height:min(56vh,420px); }
          .rcm__body--hero .rcm__name { font-size:clamp(22px,6.4vw,30px); }
        }

        /* small phones (<=420) — stack the framed portrait above the record */
        @media (max-width:420px) {
          .rcm__card { padding:0 18px 22px; }
          .rcm__body { grid-template-columns:1fr; gap:16px; justify-items:center; text-align:center; }
          .rcm__photo { width:150px; height:180px; }
          .rcm__id { width:100%; text-align:left; }
          .rcm__reg > div { align-items:flex-start; }
          /* cutout mode keeps its own left-aligned record (never centered) */
          .rcm__body--hero { justify-items:stretch; text-align:left; }
        }

        @media (prefers-reduced-motion:reduce) {
          .rc-root.rcm, .rc-root.rcm *, .rc-root.rcm *::before, .rc-root.rcm *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
