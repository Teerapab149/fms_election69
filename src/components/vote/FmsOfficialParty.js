"use client";

// FmsOfficialParty — a single party's page for the FMS Official template.
//
// This is the one inner page that legitimately gets its own opening rather than
// the shared title band: the subject IS the party, so the header carries their
// number, logo, name and slogan, and the faculty chrome frames it rather than
// competing with it. Everything below is a document — vision, policies, team,
// gallery — in a fixed order, identical for every party.
//
// Fixed order matters more than it looks. If party A's page led with a photo
// wall and party B's led with policy, the template would be quietly campaigning.
// Sections render only when the party supplied content, but they never reorder.

import { useMemo, useState } from "react";
import { ArrowLeft, Users, Target, ListChecks, ImageIcon } from "lucide-react";
import { getPath } from "../../utils/basePath";
import { sortMembersByPosition } from "../../utils/memberSort";
import FmsOfficialShell from "./FmsOfficialShell";

const asText = (it) =>
  typeof it === "string" ? it : (it?.text ?? it?.title ?? it?.detail ?? it?.description ?? it?.name ?? "");
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));

export default function FmsOfficialParty({
  party = {}, galleryImages = [], showBackToVote = false, isSingleParty = false, editorMode = false,
}) {
  const [lightbox, setLightbox] = useState(null);

  const missions = useMemo(
    () => (party?.missions || []).map(asText).filter(Boolean),
    [party?.missions]
  );
  const policies = useMemo(
    () => (party?.policies || []).map((it) =>
      typeof it === "string"
        ? { title: it, desc: "" }
        : { title: asText(it), desc: it?.desc ?? it?.description ?? it?.detail ?? "" }
    ).filter((p) => p.title),
    [party?.policies]
  );
  const members = useMemo(() => sortMembersByPosition(party?.members || []), [party?.members]);
  const story = (party?.logoMeaning || "").trim();
  const gallery = useMemo(
    () => (galleryImages || []).map((g) => resolveSrc(g?.imageUrl || g)).filter(Boolean),
    [galleryImages]
  );

  const logo = resolveSrc(party?.logoUrl);
  // A single-party election has no listing worth going back to — the vote page is
  // the only place the reader came from that they would want to return to.
  const backHref = showBackToVote ? "/vote" : isSingleParty ? "/vote" : "/candidates";
  const backLabel = showBackToVote || isSingleParty ? "กลับไปหน้าลงคะแนน" : "กลับไปรายชื่อผู้สมัคร";

  return (
    <FmsOfficialShell active="candidates" plain editorMode={editorMode}>
      <a href={editorMode ? undefined : getPath(backHref)} className="fo-back">
        <ArrowLeft size={16} aria-hidden /> {backLabel}
      </a>

      <header className="fo-party__head">
        <span className="fo-party__num">{party?.number ?? "—"}</span>
        <span className="fo-party__logo">
          {logo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={logo} alt={`ตราสัญลักษณ์พรรค${party?.name || ""}`} />
            : <span className="fo-party__logo-fb" aria-hidden>{String(party?.name || "").trim().charAt(0)}</span>}
        </span>
        <div className="fo-party__id">
          <span className="fo-party__kicker">หมายเลข {party?.number ?? "—"}</span>
          <h1>{party?.name || "—"}</h1>
          {party?.slogan && <p>{party.slogan}</p>}
        </div>
      </header>

      {story && (
        <section className="fo-party__sec">
          <div className="fo-sechead">
            <h2>ความหมายของตราสัญลักษณ์</h2>
          </div>
          <p className="fo-party__prose">{story}</p>
        </section>
      )}

      {missions.length > 0 && (
        <section className="fo-party__sec">
          <div className="fo-sechead">
            <h2>วิสัยทัศน์และพันธกิจ</h2>
          </div>
          <ul className="fo-party__missions">
            {missions.map((m, i) => (
              <li key={i}>
                <span className="fo-party__bullet" aria-hidden><Target size={15} /></span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {policies.length > 0 && (
        <section className="fo-party__sec">
          <div className="fo-sechead">
            <h2>นโยบาย</h2>
            <p>นโยบายที่พรรคเสนอต่อนักศึกษาคณะวิทยาการจัดการ</p>
          </div>
          <ol className="fo-party__policies">
            {policies.map((p, i) => (
              <li key={i} className="fo-card">
                <span className="fo-party__pnum">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <b>{p.title}</b>
                  {p.desc && <p>{p.desc}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {members.length > 0 && (
        <section className="fo-party__sec">
          <div className="fo-sechead">
            <h2>ทีมงาน</h2>
            <p>เรียงตามลำดับตำแหน่ง · ทั้งหมด {members.length} คน</p>
          </div>
          <ul className="fo-party__team">
            {members.map((m) => {
              const img = resolveSrc(m.imageUrl);
              return (
                // Structure lifted from the faculty's คณะผู้บริหาร cards: portrait,
                // a solid plum position plate straddling the photo's lower edge,
                // then the name beneath it. The plate is what makes the grid
                // scannable — you read roles down the page, then names.
                <li key={m.id} className="fo-member">
                  <span className="fo-member__ph">
                    {img
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={img} alt="" aria-hidden />
                      : <span className="fo-member__ph-fb" aria-hidden><Users size={26} /></span>}
                  </span>
                  {m.position && <span className="fo-member__plate">{m.position}</span>}
                  <b className="fo-member__name">{m.name}</b>
                  {m.major && <span className="fo-member__major">{m.major}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="fo-party__sec">
          <div className="fo-sechead">
            <h2>ภาพกิจกรรม</h2>
          </div>
          <ul className="fo-party__gallery">
            {gallery.map((src, i) => (
              <li key={i}>
                <button type="button" onClick={editorMode ? undefined : () => setLightbox(src)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`ภาพกิจกรรมพรรค${party?.name || ""} ลำดับที่ ${i + 1}`} loading="lazy" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lightbox && (
        <div className="fo-lightbox" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" />
          <button type="button" className="fo-lightbox__x" onClick={() => setLightbox(null)} aria-label="ปิด">✕</button>
        </div>
      )}

      <style jsx global>{`
        .fo-party__head {
          display: grid; grid-template-columns: 66px 96px 1fr; align-items: center; gap: 20px;
          padding: 24px 26px; border-radius: 14px; margin-bottom: 12px;
          background: var(--fo-tint); border: 1px solid var(--fo-line);
        }
        .fo-party__num {
          width: 66px; height: 66px; border-radius: 14px;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--fo-brand); color: #fff; font-size: 30px; font-weight: 600;
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
        }
        .fo-party__logo {
          width: 96px; height: 96px; border-radius: 12px; overflow: hidden;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--fo-surface); border: 1px solid var(--fo-line);
        }
        .fo-party__logo img { width: 100%; height: 100%; object-fit: contain; }
        .fo-party__logo-fb { font-size: 34px; font-weight: 600; color: var(--fo-brand-soft); }
        .fo-party__id { min-width: 0; }
        .fo-party__kicker { font-size: 12px; font-weight: 500; letter-spacing: .04em; color: var(--fo-brand-soft); }
        .fo-party__id h1 { margin: 4px 0 0; font-size: clamp(24px, 3.2vw, 36px); font-weight: 600; line-height: 1.2; color: var(--fo-ink); }
        .fo-party__id p { margin: 8px 0 0; font-size: 15px; font-weight: 300; color: var(--fo-muted); }

        .fo-party__sec { margin-top: 42px; }
        .fo-party__prose { margin: 0; font-size: 15px; font-weight: 300; line-height: 1.75; color: var(--fo-ink); max-width: 760px; }

        .fo-party__missions { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; max-width: 820px; }
        .fo-party__missions li { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; font-size: 15px; font-weight: 300; line-height: 1.7; color: var(--fo-ink); }
        .fo-party__bullet {
          width: 28px; height: 28px; border-radius: 8px; margin-top: 1px;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--fo-tint); color: var(--fo-brand); border: 1px solid var(--fo-line);
        }

        .fo-party__policies { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
        .fo-party__policies li { display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: start; }
        .fo-party__pnum {
          font-size: 20px; font-weight: 600; color: var(--fo-brand-soft); line-height: 1.3;
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
        }
        .fo-party__policies b { display: block; font-size: 16.5px; font-weight: 500; color: var(--fo-ink); }
        .fo-party__policies p { margin: 6px 0 0; font-size: 14px; font-weight: 300; line-height: 1.7; color: var(--fo-muted); }

        .fo-party__team { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 28px 18px; }
        .fo-member { display: flex; flex-direction: column; align-items: center; text-align: center; }
        /* Portrait, not a circle avatar: the faculty uses a 3:4 plate on a pale
           field, and a portrait crop is also what a student ID photo actually is —
           circles cut the top of the head off every time. */
        .fo-member__ph {
          width: 100%; aspect-ratio: 3 / 4; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          background: var(--fo-bg); border: 1px solid var(--fo-line); color: var(--fo-brand-soft);
        }
        .fo-member__ph img { width: 100%; height: 100%; object-fit: cover; }
        /* straddles the photo's bottom edge — the overlap is the whole motif */
        .fo-member__plate {
          margin-top: -20px; position: relative; z-index: 1; max-width: 92%;
          padding: 9px 16px; border-radius: 7px;
          background: var(--fo-plum); color: #fff;
          font-size: 13px; font-weight: 500; line-height: 1.35;
          box-shadow: 0 8px 18px -12px rgba(36, 30, 40, .8);
        }
        .fo-member__name { margin-top: 12px; font-size: 15.5px; font-weight: 500; color: var(--fo-ink); }
        .fo-member__major { margin-top: 3px; font-size: 12.5px; font-weight: 300; color: var(--fo-muted); }

        .fo-party__gallery { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .fo-party__gallery button { display: block; width: 100%; padding: 0; border: 1px solid var(--fo-line); border-radius: 12px; overflow: hidden; background: var(--fo-bg); cursor: pointer; transition: border-color .18s; }
        .fo-party__gallery button:hover { border-color: var(--fo-brand); }
        .fo-party__gallery img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }

        .fo-lightbox { position: fixed; inset: 0; z-index: 100; background: rgba(36, 30, 40, .88); display: grid; place-items: center; padding: 24px; cursor: zoom-out; }
        .fo-lightbox img { max-width: min(1100px, 94vw); max-height: 88vh; object-fit: contain; border-radius: 8px; }
        .fo-lightbox__x { position: absolute; top: 18px; right: 20px; width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.1); color: #fff; font-size: 17px; cursor: pointer; }

        @media (max-width: 760px) {
          /* the number badge moves onto the logo row rather than stacking three
             deep — at 375 a three-row header pushed the party's own name below
             the fold, which is the one thing this page exists to show */
          .fo-party__head { grid-template-columns: 52px 68px 1fr; gap: 14px; padding: 18px; }
          .fo-party__num { width: 52px; height: 52px; font-size: 24px; border-radius: 12px; }
          .fo-party__logo { width: 68px; height: 68px; }
          .fo-party__id h1 { font-size: 22px; }
          .fo-party__sec { margin-top: 34px; }
          .fo-party__team { grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 22px 12px; }
          .fo-member__plate { font-size: 12px; padding: 8px 12px; margin-top: -18px; }
          .fo-member__name { font-size: 14.5px; }
        }
      `}</style>
    </FmsOfficialShell>
  );
}
