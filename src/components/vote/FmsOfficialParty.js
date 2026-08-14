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
import { ArrowLeft, ArrowRight, Users, Target } from "lucide-react";
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
  // The field holds real paragraphs — the party wrote nine, separated by CRLF —
  // and rendering the raw string collapsed all of them into one 1,580-character
  // block. Half of "this section is a wall" was the page throwing away structure
  // the author had already put in.
  const story = useMemo(
    () => (party?.logoMeaning || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    [party?.logoMeaning]
  );
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

      {/* The header used to be a flat tinted bar — the same "no object, nothing
          for the eye to hold" problem the home page had. It becomes the family's
          notice, and the party's NUMBER takes the ghost slot that the edition
          numeral occupies on the home page. Identical mechanism, and the number
          is exactly the right thing to enlarge here: it is what a voter carries
          to the ballot. */}
      <header className="fo-notice fo-party__head">
        {party?.number != null && (
          <span className="fo-notice__ghost" aria-hidden>{party.number}</span>
        )}
        <div className="fo-notice__body fo-party__head-body">
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
        </div>
      </header>

      {story.length > 0 && (
        <section className="fo-party__sec">
          <div className="fo-sechead">
            <h2>ความหมายของตราสัญลักษณ์</h2>
          </div>
          {/* The longest prose in the template, and the least load-bearing: a
              voter deciding between parties does not need the full reading of a
              crest to cast a ballot. Bounded into its own panel it stops setting
              the length of the page, and the reader chooses to go into it.
              tabIndex on the viewport is not decoration — a scroll region that
              only a mouse wheel can move is unreachable by keyboard. */}
          {/* Every other block on this page runs the full 1092 measure; this
              panel sat at 652 and read as arbitrarily narrow against the section
              rule above it. Widening the TEXT was not the fix — 1092 at 15px is
              about 124 Thai characters a line. The crest goes in the space
              instead, which is the one thing this section is actually about and
              had never shown. */}
          <div className={`fo-party__story ${logo ? "has-crest" : ""}`}>
            {logo && (
              <div className="fo-party__story-crest">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt={`ตราสัญลักษณ์พรรค${party?.name || ""}`} />
              </div>
            )}
            <div
              className="fo-party__story-vp"
              tabIndex={0}
              role="region"
              aria-label="ความหมายของตราสัญลักษณ์"
            >
              {story.map((para, i) => (
                <p key={i} className="fo-party__prose">{para}</p>
              ))}
              {/* Inside the scroller and sticky, not absolutely placed over it:
                  a sticky element resolves against the SCROLLPORT, which already
                  excludes the scrollbar. Positioning it from outside meant
                  guessing that width — and it is 2px in headless Chromium against
                  roughly 15 in a real one, so any inset I picked was wrong in one
                  of them. */}
              <span className="fo-party__story-fade" aria-hidden />
            </div>
          </div>
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

      {/* The page runs ~3,800px on desktop and used to simply stop. A voter who
          reaches the bottom of a party's dossier has one obvious next move, so
          the family's plum panel closes it — the same device the home page uses
          to send readers to the candidate list. */}
      <section className="fo-party__sec">
        <a href={editorMode ? undefined : getPath(backHref)} className="fo-meet fo-party__next">
          <div className="fo-meet__txt">
            <b>{showBackToVote || isSingleParty ? "กลับไปลงคะแนน" : "ดูผู้สมัครรายอื่น"}</b>
            <span className="fo-meet__sub">
              {showBackToVote || isSingleParty
                ? "เมื่อศึกษาข้อมูลครบแล้ว กลับไปที่บัตรลงคะแนนเพื่อตัดสินใจ"
                : "เปรียบเทียบนโยบายและทีมงานของพรรคอื่นก่อนตัดสินใจ"}
            </span>
            <span className="fo-meet__rule" aria-hidden />
            <span className="fo-meet__go">{backLabel} <ArrowRight size={16} aria-hidden /></span>
          </div>
        </a>
      </section>

      {lightbox && (
        <div className="fo-lightbox" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" />
          <button type="button" className="fo-lightbox__x" onClick={() => setLightbox(null)} aria-label="ปิด">✕</button>
        </div>
      )}

      <style jsx global>{`
        .fo-party__head { margin-bottom: 12px; }
        .fo-party__head-body {
          display: grid; grid-template-columns: 96px 1fr; align-items: center; gap: 22px;
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
        /* 600px at 15px is about 68 Thai characters a line — the panel below
           holds the measure, so the paragraph itself no longer needs to. It was
           760, which measured 97: a third past the point where the eye reliably
           finds the start of the next line. */
        .fo-party__prose { margin: 0; font-size: 15px; font-weight: 300; line-height: 1.8; color: var(--fo-ink); }
        .fo-party__prose + .fo-party__prose { margin-top: 15px; }

        /* ── the crest reading ──
           One panel at the page's own measure, two fields divided by a hairline
           — the crest, and the reading of it. Document corners (4px), not a
           control's radius, same as the notice.
           The crest takes a fixed 400 and the reading gets the rest, so the text
           measure falls out of the page width rather than being set: 638 at
           1440, about 72 Thai characters a line. The paragraph no longer caps
           itself — the column is the cap. */
        .fo-party__story {
          position: relative; border-radius: 4px; overflow: hidden;
          background: var(--fo-surface); border: 1px solid var(--fo-line);
        }
        .fo-party__story.has-crest { display: grid; grid-template-columns: 400px minmax(0, 1fr); }
        .fo-party__story-crest {
          display: grid; place-items: center; padding: 28px;
          background: var(--fo-tint); border-right: 1px solid var(--fo-line);
        }
        .fo-party__story-crest img { max-width: 100%; max-height: 274px; object-fit: contain; }
        .fo-party__story-vp {
          max-height: 330px; overflow-y: auto; overscroll-behavior: contain;
          /* 44 at the bottom, not 34: the fade is 40 tall and sits flush to the
             scrollport's foot, so anything less than 40 leaves the last
             paragraph's box under the gradient. Measured 6px of overlap at 34. */
          padding: 22px 26px 44px;
          /* The scrollbar IS the affordance, so it is tinted and left at full
             width. Standard properties only: setting either of them makes
             Chromium ignore ::-webkit-scrollbar entirely, so the two cannot be
             combined — and scrollbar-width:thin gave a 2px gutter here, measured,
             which is not an affordance anyone sees. */
          scrollbar-color: var(--fo-brand-soft) var(--fo-tint);
        }
        .fo-party__story-vp:focus-visible { outline: 2px solid var(--fo-brand); outline-offset: 2px; }
        /* The 44px of bottom padding above is what this sits over: at the end of
           the scroll the fade covers blank space, so it signals "more below"
           without ever greying out a line the reader still has to read. */
        .fo-party__story-fade {
          position: sticky; bottom: -44px; z-index: 1;
          display: block; height: 40px; pointer-events: none;
          /* Bleed back over the viewport's own padding so the gradient reaches
             all three edges, and pull the same amount off the bottom so the
             element adds no height to the scroll content. No radius of its own —
             the panel clips its corners now. */
          margin: 0 -26px -40px;
          /* the keyword transparent, never rgba(255,255,255,0) — the surface is a
             token and the colour variants are free to make it something other
             than white, at which point a hardcoded white start fades through a
             grey haze on its way to the panel's own colour. */
          background: linear-gradient(to bottom, transparent, var(--fo-surface) 82%);
        }

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

        /* shorter than the home page panel: this one closes a long document
           rather than opening a section */
        .fo-party__next { min-height: 190px; padding: 34px 38px; }

        .fo-party__gallery { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .fo-party__gallery button { display: block; width: 100%; padding: 0; border: 1px solid var(--fo-line); border-radius: 12px; overflow: hidden; background: var(--fo-bg); cursor: pointer; transition: border-color .18s; }
        .fo-party__gallery button:hover { border-color: var(--fo-brand); }
        .fo-party__gallery img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }

        .fo-lightbox { position: fixed; inset: 0; z-index: 100; background: rgba(36, 30, 40, .88); display: grid; place-items: center; padding: 24px; cursor: zoom-out; }
        .fo-lightbox img { max-width: min(1100px, 94vw); max-height: 88vh; object-fit: contain; border-radius: 8px; }
        .fo-lightbox__x { position: absolute; top: 18px; right: 20px; width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.1); color: #fff; font-size: 17px; cursor: pointer; }

        /* The crest gives way first, and it has to: the text column is whatever
           is left over, so holding the crest at 400 would have squeezed the
           reading to a 320px measure by 820 — narrower than the phone gets. */
        @media (max-width: 1000px) {
          .fo-party__story.has-crest { grid-template-columns: 280px minmax(0, 1fr); }
          .fo-party__story-crest { padding: 22px; }
        }

        @media (max-width: 760px) {
          /* stacked, not side-by-side: at 360 a 96px logo left the party name
             about 200px and pushed the header to 353px tall. Centred stack keeps
             the name on full width and the header near its old height. */
          .fo-party__head-body { grid-template-columns: 1fr; justify-items: center; text-align: center; gap: 14px; padding: 26px 18px 22px; }
          .fo-party__next { min-height: 0; padding: 26px 20px; }
          .fo-party__logo { width: 72px; height: 72px; }
          .fo-party__id h1 { font-size: 22px; }
          .fo-party__sec { margin-top: 34px; }
          /* Shorter, but still well under the viewport on purpose: a scroll box
             that fills the screen steals the page's own scroll on a phone, and a
             reader who wants out of it has nothing left to grab. */
          /* The crest drops rather than stacking above the reading. It is already
             on this screen — the header carries it a few hundred pixels up — and
             a second copy would cost a phone ~200px of scroll to repeat itself. */
          .fo-party__story.has-crest { display: block; }
          .fo-party__story-crest { display: none; }
          .fo-party__story-vp { max-height: 270px; padding: 18px 18px 44px; }
          .fo-party__story-fade { margin-left: -18px; margin-right: -18px; }
          .fo-party__team { grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 22px 12px; }
          .fo-member__plate { font-size: 12px; padding: 8px 12px; margin-top: -18px; }
          .fo-member__name { font-size: 14.5px; }
        }
      `}</style>
    </FmsOfficialShell>
  );
}
