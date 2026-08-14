"use client";

// FmsOfficialMemberModal — one candidate's record, opened from a portrait.
//
// Same contract as the other families' member modals (Verdure, Studio Dark,
// Receipt, Blossom): <Modal member={m} onClose={fn} />, and it reads
// modalImageUrl before imageUrl so a party can supply a full portrait for the
// modal and a cropped one for the grid.
//
// Composed as a personnel record, not a profile card: the portrait on the left,
// the fields as a definition list on the right, under the family's 6px plum
// head rule and document corners. Fields that are empty still print with an
// em dash rather than disappearing — on a record, a blank field is information
// (the party did not supply it) and a vanishing one is just a hole.

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { getPath } from "../../utils/basePath";

const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

export default function FmsOfficialMemberModal({ member = null, onClose = () => {} }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!member) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    // Focus moves into the dialog, or a keyboard user is left tabbing the page
    // behind it with no idea anything opened.
    closeRef.current?.focus();
    // the page must not scroll under an open modal
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [member, onClose]);

  if (!member) return null;

  const src = resolveSrc(member.modalImageUrl || member.imageUrl);
  const fields = [
    ["รหัสนักศึกษา", member.studentId],
    ["ตำแหน่ง", member.position],
    ["สาขาวิชา", member.major],
  ];

  return (
    <div className="fo-mm" role="presentation" onClick={onClose}>
      <div
        className="fo-mm__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fo-mm-name"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} type="button" className="fo-mm__x" onClick={onClose} aria-label="ปิด">
          <X size={18} aria-hidden />
        </button>

        <div className="fo-mm__ph">
          {src
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={src} alt={`ภาพ${member.name || "ผู้สมัคร"}`} />
            : <span className="fo-mm__ph-fb" aria-hidden>{String(member.name || "").trim().charAt(0)}</span>}
        </div>

        <div className="fo-mm__body">
          <span className="fo-mm__kicker">ผู้สมัครรับเลือกตั้ง</span>
          <h3 id="fo-mm-name">{member.name || "—"}</h3>
          <dl className="fo-mm__fields">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <style jsx global>{`
        .fo-mm {
          position: fixed; inset: 0; z-index: 300; display: grid; place-items: center;
          padding: 24px; background: rgba(36, 30, 40, .62); cursor: pointer;
        }
        .fo-mm__card {
          position: relative; cursor: auto; width: min(680px, 100%);
          display: grid; grid-template-columns: 268px minmax(0, 1fr);
          border-radius: 4px; overflow: hidden;
          background: var(--fo-surface); border: 1px solid var(--fo-line);
          border-top: 6px solid var(--fo-brand);
          box-shadow: 0 48px 90px -50px rgba(36, 30, 40, .85);
        }
        .fo-mm__x {
          position: absolute; top: 12px; right: 12px; z-index: 2;
          width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
          display: grid; place-items: center;
          background: var(--fo-surface); border: 1px solid var(--fo-line); color: var(--fo-muted);
          transition: color .16s, border-color .16s;
        }
        .fo-mm__x:hover { color: var(--fo-brand); border-color: var(--fo-brand); }
        .fo-mm__x:focus-visible { outline: 2px solid var(--fo-brand); outline-offset: 2px; }

        /* 3:4, the same portrait ratio the grids use — a student ID photo is a
           portrait, and a square or a circle crops the top of the head off */
        .fo-mm__ph {
          aspect-ratio: 3 / 4; overflow: hidden;
          display: grid; place-items: center;
          background: var(--fo-bg); border-right: 1px solid var(--fo-line);
        }
        .fo-mm__ph img { width: 100%; height: 100%; object-fit: cover; }
        .fo-mm__ph-fb { font-size: 56px; font-weight: 600; color: var(--fo-brand-soft); }

        .fo-mm__body { padding: 28px 30px 30px; }
        .fo-mm__kicker { display: block; font-size: 12px; font-weight: 500; letter-spacing: .1em; color: var(--fo-brand-soft); }
        .fo-mm__body h3 { margin: 8px 0 0; font-size: clamp(21px, 2.4vw, 27px); font-weight: 600; line-height: 1.25; color: var(--fo-ink); }

        .fo-mm__fields { margin: 22px 0 0; display: grid; gap: 0; }
        .fo-mm__fields > div {
          display: grid; grid-template-columns: 116px minmax(0, 1fr); gap: 14px;
          padding: 12px 0; border-top: 1px solid var(--fo-line);
        }
        .fo-mm__fields dt { font-size: 13px; font-weight: 300; color: var(--fo-muted); }
        .fo-mm__fields dd {
          margin: 0; font-size: 14.5px; font-weight: 500; color: var(--fo-ink);
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
        }

        @media (max-width: 620px) {
          .fo-mm { padding: 16px; }
          /* The portrait stops being a column and becomes a band: a 3:4 photo at
             full phone width is 470px tall and pushes every field off screen. */
          .fo-mm__card { grid-template-columns: minmax(0, 1fr); max-height: 88vh; overflow-y: auto; }
          .fo-mm__ph { aspect-ratio: 4 / 3; border-right: 0; border-bottom: 1px solid var(--fo-line); }
          .fo-mm__ph img { object-position: center 22%; }
          .fo-mm__body { padding: 20px 20px 24px; }
          .fo-mm__fields > div { grid-template-columns: 96px minmax(0, 1fr); gap: 10px; }
        }
      `}</style>
    </div>
  );
}
