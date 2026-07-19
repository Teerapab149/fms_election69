"use client";

// BlossomMemberModal — the member modal in the BLOSSOM family's candy-editorial
// language, replacing the shared (dark, classic) CandidateModal on BlossomParty. The
// concept is a MAGAZINE PROFILE CARD: a pure-white editorial card (18px radius, 1.5px
// ink border) with a mono bilingual eyebrow, a member-number pill, a large portrait
// (click → its OWN lightbox), a solid display name, and a hairline-ruled record — laid
// on an opaque-ish ink scrim. Calm: candy lives in the accents only (a single diamond
// tick + the number pill), never in eye-straining washes.
//
// Colours flow ONLY through var(--bl-*). The overlay carries the `bl-root` class so the
// global .bl-root custom-property declarations (emitted once by BlossomBaseStyles on the
// page) resolve on it even though BlossomParty portals this to <document.body> — a
// two-class rule (.bl-root.blm) neutralises .bl-root's own canvas background / min-height
// so only the scrim shows. A theme swap re-tints the card in place. Latin/digits wear the
// mono face; Thai in a mono line switches to the display face (Space Mono has no Thai
// glyphs); Thai UI sentences never end with "." .

import { getPath } from "../../utils/basePath";
import React, { useEffect, useRef, useState } from "react";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

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

export default function BlossomMemberModal({ member = null, onClose = () => {} }) {
  const gc = useGlobalConfig() || {};
  const prefix = gc.electionNamePrefix || "SAMO";
  const number = gc.electionNumber ?? "";

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const closeRef = useRef(null);

  useEscape(!!member, () => { lightboxOpen ? setLightboxOpen(false) : onClose(); });

  // focus the close button when the card opens (a11y — focus enters the dialog)
  useEffect(() => {
    if (member && !lightboxOpen) closeRef.current?.focus();
  }, [member, lightboxOpen]);

  if (!member) return null;

  // v2-R13 — CUTOUT MODE when the member has a transparent-PNG portrait
  // (modalImageUrl); otherwise the original framed look on imageUrl.
  const hasCutout = !!member.modalImageUrl;
  const src = resolveSrc(member.modalImageUrl || member.imageUrl);

  const idBlock = (
    <div className="blm__id">
      <span className="blm__kick">{prefix} {number} · CANDIDATE PROFILE</span>
      <h3 className="blm__name">{member.name}</h3>
      {(member.position || member.major) && (
        <p className="blm__role">{[member.position, member.major].filter(Boolean).join(" · ")}</p>
      )}

      <dl className="blm__reg">
        {member.studentId && (
          <div>
            <dt><span className="bl-th">รหัสนักศึกษา</span> · STUDENT ID</dt>
            <dd className="blm__mono">{member.studentId}</dd>
          </div>
        )}
        {member.position && (
          <div>
            <dt><span className="bl-th">ตำแหน่ง</span> · POSITION</dt>
            <dd>{member.position}</dd>
          </div>
        )}
        {member.major && (
          <div>
            <dt><span className="bl-th">สาขาวิชา</span> · MAJOR</dt>
            <dd>{member.major}</dd>
          </div>
        )}
      </dl>
    </div>
  );

  return (
    <div className="bl-root blm" role="dialog" aria-modal="true" aria-label={member.name || "ประวัติผู้สมัคร"} onClick={onClose}>
      <div className={`blm__card${hasCutout ? " is-cutout" : ""}`} onClick={(e) => e.stopPropagation()}>
        {/* eyebrow + member-number pill */}
        <div className="blm__top">
          <span className="blm__eyebrow"><i className="blm__tick" aria-hidden="true" />CANDIDATE FILE · <span className="bl-th">ผู้สมัคร</span></span>
          <span className="blm__no"><span className="blm__no-l bl-th">หมายเลข</span> {pad2(member.number ?? 0)}</span>
        </div>

        {/* close button */}
        <button type="button" ref={closeRef} className="blm__x" onClick={onClose} aria-label="ปิด">✕</button>

        <div className="blm__hair" aria-hidden="true" />

        {hasCutout ? (
          /* CUTOUT MODE — editorial cutout standing on a candy colour block */
          <div className="blm__body blm__body--hero">
            <div className="blm__stage">
              <span className="blm__blob" aria-hidden="true" />
              <span className="blm__ground" aria-hidden="true" />
              <button
                type="button"
                className="blm__hero"
                onClick={() => setLightboxOpen(true)}
                aria-label="ขยายรูป"
              >
                <img src={src} alt={member.name || ""} />
              </button>
            </div>
            {idBlock}
          </div>
        ) : (
          /* FALLBACK MODE — the original framed portrait */
          <div className="blm__body">
            <button
              type="button"
              className={`blm__photo${src ? "" : " is-empty"}`}
              onClick={() => src && setLightboxOpen(true)}
              aria-label={src ? "ขยายรูป" : undefined}
              disabled={!src}
            >
              {src
                ? <img src={src} alt={member.name || ""} />
                : <span className="blm__photo-ph" aria-hidden="true">{(member.name || "?").trim().charAt(0)}</span>}
            </button>

            {idBlock}
          </div>
        )}
      </div>

      {/* the portrait's OWN lightbox */}
      {lightboxOpen && src && (
        <div className="blm-lb" onClick={() => setLightboxOpen(false)} role="dialog" aria-modal="true" aria-label="ภาพขยาย">
          <button type="button" className="blm-lb__x" onClick={() => setLightboxOpen(false)} aria-label="ปิด">✕</button>
          <img src={src} alt={member.name || ""} onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <style jsx global>{`
        /* overlay carries .bl-root for the var declarations; a two-class rule strips
           .bl-root's canvas background / min-height so only the ink scrim shows. */
        .bl-root.blm { position:fixed; inset:0; z-index:9200; min-height:0; display:grid; place-items:center;
          padding:20px; overflow-y:auto; cursor:pointer;
          background:color-mix(in srgb, var(--bl-ink) 72%, transparent);
          -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px);
          animation:blmFade .2s ease both; }
        @keyframes blmFade { from { opacity:0; } }
        .blm .bl-th { font-family:var(--bl-fd) !important; }

        .blm__card { position:relative; cursor:auto; width:min(560px,100%); margin:auto;
          background:var(--bl-card); color:var(--bl-ink);
          border:1.5px solid var(--bl-ink); border-radius:18px; overflow:hidden;
          padding:20px 22px 24px;
          box-shadow:0 40px 80px -34px color-mix(in srgb, var(--bl-ink) 46%, transparent);
          animation:blmRise .3s cubic-bezier(.16,1,.3,1) both; }
        @keyframes blmRise { from { opacity:0; transform:translateY(16px) scale(.98); } }

        .blm__top { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-right:38px; }
        .blm__eyebrow { display:inline-flex; align-items:center; gap:8px; font-family:var(--bl-fm); font-size:10px;
          letter-spacing:.18em; text-transform:uppercase; color:var(--bl-faint);
          /* keep on one line — flex-squeeze against the flex:none number pill was
             wrapping the Thai word "ผู้สมัคร" mid-character with a dangling "·" */
          white-space:nowrap; }
        .blm__tick { width:8px; height:8px; flex:none; background:var(--bl-primary); transform:rotate(45deg); border-radius:1.5px; }
        .blm__no { display:inline-flex; align-items:baseline; gap:6px; flex:none; padding:5px 12px; border-radius:999px;
          background:var(--bl-primary-soft); color:var(--bl-primary-deep);
          font-family:var(--bl-fm); font-size:12px; font-weight:700; letter-spacing:.06em; font-variant-numeric:tabular-nums; }
        .blm__no-l { font-family:var(--bl-fd); font-size:10px; font-weight:600; letter-spacing:.04em; opacity:.85; }

        .blm__x { position:absolute; top:14px; right:14px; z-index:5; width:34px; height:34px; display:grid; place-items:center;
          border-radius:50%; cursor:pointer; font-size:14px; line-height:1; color:var(--bl-ink2);
          background:var(--bl-card); border:1.5px solid var(--bl-ink);
          transition:transform .15s ease, background .2s ease, color .2s ease; }
        .blm__x:hover { color:var(--bl-on-primary, var(--bl-card)); background:var(--bl-primary-deep); border-color:var(--bl-primary-deep); }
        .blm__x:active { transform:scale(.94); }

        .blm__hair { height:1px; margin:15px -22px 0; background:var(--bl-line); }

        .blm__body { display:grid; grid-template-columns:auto 1fr; gap:22px; align-items:start; padding-top:20px; }

        /* ===== v2-R13 CUTOUT MODE — magazine cutout on a candy colour block ===== */
        .blm__card.is-cutout { width:min(760px,100%); }
        .blm__body--hero { grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr); gap:26px; align-items:stretch; }

        .blm__stage { position:relative; min-width:0; display:flex; align-items:flex-end; justify-content:center;
          padding:14px 10px 0; border-radius:20px; overflow:hidden;
          background:color-mix(in srgb, var(--bl-primary-soft) 60%, var(--bl-card)); }
        /* the candy blob the person is cut out against */
        .blm__blob { position:absolute; left:50%; bottom:-12%; transform:translateX(-50%);
          width:104%; aspect-ratio:1; pointer-events:none;
          background:color-mix(in srgb, var(--bl-primary) 26%, var(--bl-card));
          border-radius:52% 48% 60% 40%/55% 60% 40% 45%; }
        /* soft ground shadow so the cutout is standing, not floating */
        .blm__ground { position:absolute; left:50%; bottom:14px; transform:translateX(-50%);
          width:60%; height:16px; border-radius:50%; pointer-events:none;
          background:radial-gradient(closest-side, color-mix(in srgb, var(--bl-ink) 26%, transparent), transparent 78%);
          filter:blur(1px); }

        .blm__hero { position:relative; z-index:2; display:block; width:100%; height:clamp(320px,46vh,470px);
          padding:0; border:none; background:none; cursor:zoom-in;
          transition:transform .25s cubic-bezier(.16,1,.3,1); animation:blmStand .5s cubic-bezier(.16,1,.3,1) both .06s; }
        @keyframes blmStand { from { opacity:0; transform:translateY(14px); } }
        .blm__hero:hover { transform:translateY(-3px); }
        /* width:auto hugs the image — no letterbox for an opaque studio photo, and a
           transparent PNG still stands free on the candy block */
        .blm__hero img { display:block; width:auto; max-width:100%; height:100%; margin:0 auto;
          object-fit:contain; object-position:bottom center; border-radius:12px;
          filter:drop-shadow(0 12px 16px color-mix(in srgb, var(--bl-ink) 22%, transparent)); }

        .blm__body--hero .blm__id { align-self:center; }
        .blm__body--hero .blm__name { font-size:clamp(26px,6vw,38px); }

        /* large editorial portrait */
        .blm__photo { position:relative; width:150px; aspect-ratio:4/5; flex:none; padding:0; cursor:zoom-in; overflow:hidden;
          border-radius:14px; background:color-mix(in srgb, var(--bl-primary-soft) 60%, var(--bl-card));
          border:1.5px solid var(--bl-line); display:grid; place-items:center;
          transition:transform .2s ease, border-color .2s ease; }
        .blm__photo:hover { transform:translateY(-2px); border-color:var(--bl-primary); }
        .blm__photo.is-empty { cursor:default; }
        .blm__photo img { width:100%; height:100%; object-fit:cover; }
        .blm__photo-ph { font-family:var(--bl-fd); font-weight:800; font-size:48px; color:var(--bl-primary-deep); }

        .blm__id { min-width:0; }
        .blm__kick { font-family:var(--bl-fm); font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--bl-faint); }
        .blm__name { margin:8px 0 0; font-family:var(--bl-fd); font-weight:800; line-height:1.08; letter-spacing:-.02em;
          font-size:clamp(24px,5.6vw,32px); color:var(--bl-ink); overflow-wrap:break-word; }
        .blm__role { margin:7px 0 0; font-family:var(--bl-fd); font-weight:500; font-size:14px; line-height:1.5; color:var(--bl-ink2); }

        .blm__reg { margin:18px 0 0; padding:0; display:flex; flex-direction:column; }
        .blm__reg > div { display:flex; flex-direction:column; gap:3px; padding:12px 0; border-top:1px solid var(--bl-line); }
        .blm__reg > div:first-child { border-top:none; padding-top:0; }
        .blm__reg dt { font-family:var(--bl-fm); font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:var(--bl-faint); }
        .blm__reg dd { margin:0; font-family:var(--bl-fd); font-weight:700; font-size:15px; color:var(--bl-ink); overflow-wrap:break-word; }
        .blm__reg dd.blm__mono { font-family:var(--bl-fm); font-weight:600; letter-spacing:.04em; font-variant-numeric:tabular-nums; }

        /* portrait lightbox — its own solid ink scrim */
        .blm-lb { position:absolute; inset:0; z-index:9300; display:grid; place-items:center; padding:24px; cursor:zoom-out;
          background:color-mix(in srgb, var(--bl-ink) 84%, transparent);
          -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); animation:blmFade .2s ease both; }
        .blm-lb img { max-width:100%; max-height:85vh; object-fit:contain; border-radius:12px; cursor:auto;
          box-shadow:0 40px 90px -30px rgba(0,0,0,.6); }
        .blm-lb__x { position:absolute; top:18px; right:18px; width:44px; height:44px; border-radius:50%; display:grid; place-items:center;
          cursor:pointer; font-size:16px; color:var(--bl-canvas);
          background:color-mix(in srgb, var(--bl-ink) 40%, transparent);
          border:1.5px solid color-mix(in srgb, var(--bl-canvas) 40%, transparent); }

        .bl-root.blm a:focus-visible, .bl-root.blm button:focus-visible {
          outline:2px solid var(--bl-primary-deep); outline-offset:3px; }

        /* phones — cutout stacks on top and stays BIG (the person is the point) */
        @media (max-width:560px) {
          .blm__body--hero { grid-template-columns:1fr; gap:16px; }
          .blm__stage { padding:10px 8px 0; }
          .blm__hero { height:min(56vh,420px); }
          .blm__body--hero .blm__name { font-size:clamp(24px,7vw,32px); }
        }

        /* small phones (<=420) — stack the portrait above the record */
        @media (max-width:420px) {
          .blm__card { padding:18px 18px 22px; }
          .blm__body { grid-template-columns:1fr; gap:18px; }
          .blm__photo { width:100%; max-width:220px; margin:0 auto; }
          .blm__hair { margin:15px -18px 0; }
        }

        @media (prefers-reduced-motion:reduce) {
          .bl-root.blm, .bl-root.blm *, .bl-root.blm *::before, .bl-root.blm *::after { animation:none !important; }
        }
      `}</style>
    </div>
  );
}
