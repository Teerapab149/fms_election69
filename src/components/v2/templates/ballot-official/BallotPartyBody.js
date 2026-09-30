"use client";

// BallotPartyBody — a party's own material, in the ballot-official family's
// voice: group photo, what the symbol means, vision and missions, policies, and
// the team. Used by the single-party ballot page (beside the ballot) and by the
// party page — one source, so the two can never tell a different story.
//
// Every section appears only when the party filled it in; an empty section is
// dropped entirely rather than shown with placeholder text.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion"; // Motion for React
import { Maximize2, X } from "lucide-react";
import PartySocials from "../../../vote/PartySocials";
import { ballotOfficialTemplate } from "../../../admin/editor/templates/builtIn/ballot-official";
// what a party may show and in what order is shared by every v2 template;
// this file only decides how it looks
import { usePartyContent, mediaSrc as src } from "../../shared/party/usePartyContent";
import { useDialog } from "../../shared/interaction/useDialog";

const EASE = [0.16, 1, 0.3, 1];

function MemberCard({ member, onClose, k }) {
  const ref = useDialog(!!member, onClose);
  const photo = member ? src(member.modalImageUrl || member.imageUrl) : null;
  return (
    <AnimatePresence>
      {member && (
        <motion.div className="bp-dlg" role="dialog" aria-modal="true" aria-label={member.name} ref={ref}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          onClick={onClose}>
          <motion.div className="bp-member" onClick={(e) => e.stopPropagation()}
            initial={{ y: 16, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 10, scale: 0.98 }} transition={{ duration: 0.3, ease: EASE }}>
            <button type="button" className="bp-x" onClick={onClose} aria-label={k.close} data-dialog-focus><X size={18} /></button>
            <span className="bp-member__photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photo && <img src={photo} alt={member.name || ""} />}
            </span>
            <div className="bp-member__txt">
              <b>{member.name}</b>
              <dl>
                {member.position && <div><dt>{k.memberPosition}</dt><dd>{member.position}</dd></div>}
                {member.major && <div><dt>{k.memberMajor}</dt><dd>{member.major}</dd></div>}
                {member.studentId && <div><dt>{k.memberId}</dt><dd>{member.studentId}</dd></div>}
              </dl>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PhotoViewer({ photo, alt, onClose, k = ballotOfficialTemplate.copy.party }) {
  const ref = useDialog(!!photo, onClose);
  return (
    <AnimatePresence>
      {photo && (
        <motion.div className="bp-dlg bp-dlg--photo" role="dialog" aria-modal="true" aria-label={alt} ref={ref}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose}>
          <button type="button" className="bp-x bp-x--light" onClick={onClose} aria-label={k.close} data-dialog-focus><X size={20} /></button>
          <motion.img src={photo} alt={alt} className="bp-photo" onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.96 }} animate={{ scale: 1 }} transition={{ duration: 0.3, ease: EASE }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// `cover`: show the group photo here (the vote page shows it in its own hero).
// `wide`: full-width layout — short sections pair up, policies run in two
// columns, the team fills the row — for pages where the party has the width.
export default function BallotPartyBody({ party, cover = true, wide = false }) {
  const k = ballotOfficialTemplate.copy.party;
  const [member, setMember] = useState(null);
  const [viewing, setViewing] = useState(null); // src of the photo open full-screen

  // cover = first group photo; gallery = the rest (only when there is more than
  // one); sections empty or placeholder are dropped; team tiered by positionRank
  const { cover: photo, gallery, hasSocials, story, missions, policies, members, tiers } = usePartyContent(party);
  // wide pages set the two short sections side by side when both exist
  const pair = wide && story.length > 0 && missions.length > 0;

  return (
    <div className={`bp ${wide ? "bp--wide" : ""}`}>
      {cover && photo && (
        <button type="button" className="bp-cover" onClick={() => setViewing(photo)} aria-label={`${k.enlarge} ${party?.name || ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" />
          <span className="bp-cover__hint" aria-hidden><Maximize2 size={14} /> {k.enlarge}</span>
        </button>
      )}

      {story.length > 0 && (
        <section className={`bp-sec ${pair ? "bp-sec--half" : ""}`}>
          <h2 className="bp-h">{k.story}</h2>
          <div className="bp-story">
            {party?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="bp-story__logo" src={src(party.logoUrl)} alt="" />
            )}
            <div>{story.map((line) => <p key={line}>{line}</p>)}</div>
          </div>
        </section>
      )}

      {missions.length > 0 && (
        <section className={`bp-sec ${pair ? "bp-sec--half" : ""}`}>
          <h2 className="bp-h">{k.missions} <span className="bp-count">{missions.length} {k.items}</span></h2>
          <ul className="bp-list">
            {missions.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </section>
      )}

      {policies.length > 0 && (
        <section className="bp-sec">
          <h2 className="bp-h">{k.policies} <span className="bp-count">{policies.length} {k.items}</span></h2>
          {/* policies are a real list the voter reads in order, so they are numbered */}
          <ol className="bp-pol">
            {policies.map((p, i) => (
              <li key={`${i}-${p.title}`}>
                <span className="bp-pol__no">{i + 1}</span>
                <span className="bp-pol__txt"><b>{p.title}</b>{p.desc && <span>{p.desc}</span>}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {members.length > 0 && (
        <section className="bp-sec">
          <h2 className="bp-h">{k.team} <span className="bp-count">{members.length} {k.people}</span></h2>

          {/* the team has a hierarchy, so the page shows one: the president on
              their own, the vice presidents in a pair, then everyone else —
              ranked by positionRank, the same order every template uses */}
          {tiers.lead.map((m, i) => (
            <button key={m.id || m.studentId || `l${i}`} type="button" className="bp-lead" onClick={() => setMember(m)}>
              <span className="bp-lead__photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {src(m.modalImageUrl || m.imageUrl) && <img src={src(m.modalImageUrl || m.imageUrl)} alt="" />}
              </span>
              <span className="bp-lead__txt">
                {m.position && <span className="bp-lead__pos">{m.position}</span>}
                <b>{m.name}</b>
                {m.major && <span className="bp-lead__major">{m.major}</span>}
              </span>
            </button>
          ))}

          {tiers.vice.length > 0 && (
            <ul className="bp-vice">
              {tiers.vice.map((m, i) => (
                <li key={m.id || m.studentId || `v${i}`}>
                  <button type="button" className="bp-vice__card" onClick={() => setMember(m)}>
                    <span className="bp-vice__photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {src(m.imageUrl) && <img src={src(m.imageUrl)} alt="" loading="lazy" />}
                    </span>
                    <span className="bp-vice__txt">
                      <b>{m.name}</b>
                      {m.position && <span>{m.position}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {tiers.rest.length > 0 && (
            <ul className="bp-team">
              {tiers.rest.map((m, i) => (
                <li key={m.id || m.studentId || `r${i}`}>
                  <button type="button" className="bp-person" onClick={() => setMember(m)}>
                    <span className="bp-person__photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {src(m.imageUrl) && <img src={src(m.imageUrl)} alt="" loading="lazy" />}
                    </span>
                    <b>{m.name}</b>
                    {m.position && <span>{m.position}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* activity photos — only when the party uploaded more than one group photo */}
      {gallery.length > 0 && (
        <section className="bp-sec">
          <h2 className="bp-h">{k.gallery} <span className="bp-count">{gallery.length}</span></h2>
          <ul className={`bp-gallery bp-gallery--${Math.min(gallery.length, 4)}`}>
            {gallery.map((g, i) => (
              <li key={g}>
                <button type="button" className="bp-gallery__item" onClick={() => setViewing(g)} aria-label={`${k.enlarge} ${k.gallery} ${i + 1}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt="" loading="lazy" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* contact — only when the party filled any of it in; PartySocials drops
          anything that is not a safe http(s) link */}
      {hasSocials && (
        <section className="bp-sec">
          <h2 className="bp-h">{k.socials}</h2>
          <PartySocials socials={party?.socials} prefix="bp" heading="" />
        </section>
      )}

      <MemberCard member={member} onClose={() => setMember(null)} k={k} />
      <PhotoViewer photo={viewing} alt={party?.name || ""} onClose={() => setViewing(null)} k={k} />

      <style jsx global>{`
        .bp { display: grid; gap: 44px; }
        .bp-cover { position: relative; display: block; width: 100%; padding: 0; border: 0; border-radius: 10px; overflow: hidden; aspect-ratio: 16 / 9; background: var(--bo-rule); cursor: zoom-in; }
        .bp-cover img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .6s cubic-bezier(.16,1,.3,1); }
        .bp-cover:hover img { transform: scale(1.02); }
        .bp-cover__hint {
          position: absolute; right: 12px; bottom: 12px; display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 10px; border-radius: 8px; background: rgba(var(--bo-ink-rgb),.66); color: #fff; font-size: 13px;
        }
        .bp-h { margin: 0 0 16px; font-size: 22px; font-weight: 800; line-height: 1.3; display: flex; align-items: baseline; gap: 10px; }
        .bp-count { font-size: 14px; font-weight: 500; color: var(--bo-muted); }

        .bp-story { display: flex; gap: 20px; align-items: flex-start; }
        .bp-story__logo { width: 72px; height: 72px; object-fit: contain; flex-shrink: 0; border-radius: 10px; background: #fff; padding: 8px; box-shadow: 0 0 0 1px var(--bo-rule); }
        .bp-story p { margin: 0 0 8px; font-family: var(--bo-font-read); font-size: 16px; line-height: 1.8; }

        .bp-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; }
        .bp-list li { position: relative; padding-left: 20px; font-family: var(--bo-font-read); font-size: 16px; line-height: 1.75; }
        .bp-list li::before { content: ""; position: absolute; left: 2px; top: .72em; width: 8px; height: 8px; border-radius: 2px; background: var(--bo-plum); }

        .bp-pol { margin: 0; padding: 0; list-style: none; display: grid; gap: 0; }
        .bp-pol li { display: flex; gap: 16px; padding: 16px 0; border-top: 1px solid var(--bo-rule); }
        .bp-pol li:last-child { border-bottom: 1px solid var(--bo-rule); }
        .bp-pol__no {
          flex-shrink: 0; display: grid; place-items: center; width: 32px; height: 32px; border: 2px solid var(--bo-ink);
          border-radius: 3px; font-weight: 800; font-size: 15px; font-variant-numeric: tabular-nums;
        }
        .bp-pol__txt b { display: block; font-size: 17px; font-weight: 700; line-height: 1.45; }
        .bp-pol__txt span { display: block; margin-top: 4px; font-family: var(--bo-font-read); font-size: 15px; line-height: 1.75; color: var(--bo-muted); }

        .bp-team { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px 16px; }
        .bp-person { display: block; width: 100%; padding: 0; border: 0; background: none; text-align: left; color: var(--bo-ink); }
        .bp-person__photo { display: block; aspect-ratio: 4 / 5; border-radius: 8px; overflow: hidden; background: var(--bo-rule); }
        .bp-person__photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .5s cubic-bezier(.16,1,.3,1); }
        .bp-person:hover .bp-person__photo img { transform: scale(1.04); }
        .bp-person b { display: block; margin-top: 10px; font-size: 15px; font-weight: 700; line-height: 1.35; }
        .bp-person span { display: block; font-size: 13px; color: var(--bo-muted); line-height: 1.45; }

        /* activity gallery: the first photo leads, the rest follow smaller */
        .bp-gallery { margin: 0; padding: 0; list-style: none; display: grid; gap: 12px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .bp-gallery--1 { grid-template-columns: minmax(0, 1fr); }
        .bp-gallery--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .bp-gallery--3 > li:first-child, .bp-gallery--4 > li:first-child { grid-column: span 2; grid-row: span 2; }
        .bp-gallery__item { display: block; width: 100%; height: 100%; padding: 0; border: 0; border-radius: 10px; overflow: hidden; background: var(--bo-rule); cursor: zoom-in; }
        .bp-gallery__item img { display: block; width: 100%; height: 100%; min-height: 100%; aspect-ratio: 4 / 3; object-fit: cover; transition: transform .6s cubic-bezier(.16,1,.3,1); }
        .bp-gallery__item:hover img { transform: scale(1.03); }

        /* party contact links (PartySocials markup, this family's look) */
        .bp-social__row { display: flex; flex-wrap: wrap; gap: 12px; }
        .bp-social__link {
          display: inline-flex; flex-direction: column; gap: 2px; min-width: 180px; padding: 14px 18px; border-radius: 10px;
          background: rgba(255,255,255,.75); box-shadow: 0 0 0 1px rgba(var(--bo-shade-rgb),.08); color: var(--bo-ink); text-decoration: none;
          transition: box-shadow .2s, background-color .2s;
        }
        .bp-social__link:hover { background: #fff; box-shadow: 0 0 0 1px var(--bo-plum); }
        .bp-social__name { font-weight: 700; font-size: 16px; }
        .bp-social__handle { font-size: 14px; color: var(--bo-plum); }

        /* team tiers: president on their own, vice presidents as a pair */
        .bp-lead {
          display: grid; grid-template-columns: minmax(0, 260px) minmax(0, 1fr); gap: 32px; align-items: center;
          width: 100%; padding: 0; margin: 0 0 32px; border: 0; background: none; text-align: left; color: var(--bo-ink); cursor: pointer;
        }
        .bp-lead__photo { display: block; aspect-ratio: 4 / 5; border-radius: 12px; overflow: hidden; background: var(--bo-rule); box-shadow: 0 24px 48px -32px rgba(var(--bo-shade-rgb),.55); }
        .bp-lead__photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .6s cubic-bezier(.16,1,.3,1); }
        .bp-lead:hover .bp-lead__photo img { transform: scale(1.03); }
        .bp-lead__pos { display: block; font-size: 16px; font-weight: 700; color: var(--bo-plum); }
        .bp-lead__txt b { display: block; margin-top: 4px; font-size: clamp(26px, 3vw, 36px); font-weight: 800; line-height: 1.2; }
        .bp-lead__major { display: block; margin-top: 6px; font-size: 16px; color: var(--bo-muted); }

        .bp-vice { margin: 0 0 36px; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .bp-vice__card {
          display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 18px; align-items: center; width: 100%;
          padding: 10px 16px 10px 10px; border: 0; border-radius: 12px; text-align: left; color: var(--bo-ink); cursor: pointer;
          background: rgba(255,255,255,.7); box-shadow: 0 0 0 1px rgba(var(--bo-shade-rgb),.07); transition: box-shadow .2s, background-color .2s;
        }
        .bp-vice__card:hover { background: #fff; box-shadow: 0 0 0 1px rgba(var(--bo-shade-rgb),.12), 0 12px 24px -18px rgba(var(--bo-shade-rgb),.45); }
        .bp-vice__photo { display: block; aspect-ratio: 4 / 5; border-radius: 8px; overflow: hidden; background: var(--bo-rule); }
        .bp-vice__photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .bp-vice__txt b { display: block; font-size: 18px; font-weight: 800; line-height: 1.3; }
        .bp-vice__txt span { display: block; margin-top: 2px; font-size: 14px; color: var(--bo-muted); line-height: 1.45; }

        /* wide pages: a 12-column page grid. Short sections pair up, policies run in
           two columns (read across, then down), the team fills the full row. */
        .bp--wide { grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 48px; row-gap: 64px; }
        .bp--wide > * { grid-column: 1 / -1; }
        .bp--wide > .bp-sec--half { grid-column: span 6; }
        .bp--wide .bp-h { font-size: 26px; margin-bottom: 20px; }
        .bp--wide .bp-pol { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 48px; }
        .bp--wide .bp-pol li:last-child { border-bottom: 0; }
        .bp--wide .bp-pol { border-bottom: 1px solid var(--bo-rule); }
        .bp--wide .bp-team { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 32px 24px; }
        @media (max-width: 900px) {
          /* one column: (.bp.bp--wide outranks the phone block's .bp { gap } below,
             which otherwise put 11 × 36px of column gaps into a 343px phone) */
          .bp.bp--wide { grid-template-columns: minmax(0, 1fr); column-gap: 0; row-gap: 44px; }
          .bp--wide > .bp-sec--half { grid-column: 1 / -1; }
          .bp--wide .bp-pol { grid-template-columns: 1fr; }
          .bp--wide .bp-h { font-size: 21px; }
        }

        /* dialogs */
        .bp-dlg { position: fixed; inset: 0; z-index: 9500; display: grid; place-items: center; padding: 20px; background: rgba(var(--bo-ink-rgb),.62); }
        .bp-dlg--photo { background: rgba(var(--bo-ink-rgb),.9); }
        .bp-member {
          position: relative; width: min(640px, 100%); display: grid; grid-template-columns: 240px 1fr; overflow: hidden;
          background: #fff; border-radius: 12px; box-shadow: inset 0 5px 0 var(--bo-plum), 0 30px 64px -28px rgba(var(--bo-ink-rgb),.6);
          font-family: var(--bo-font);
        }
        .bp-member__photo { display: block; aspect-ratio: 4 / 5; background: var(--bo-rule); }
        .bp-member__photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .bp-member__txt { padding: 28px 24px; }
        .bp-member__txt > b { display: block; font-size: 22px; font-weight: 800; line-height: 1.3; padding-right: 36px; }
        .bp-member dl { margin: 16px 0 0; display: grid; gap: 10px; }
        .bp-member dt { font-size: 13px; color: var(--bo-muted); }
        .bp-member dd { margin: 0; font-size: 16px; font-weight: 600; }
        .bp-x { position: absolute; top: 12px; right: 12px; z-index: 1; display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 8px; background: rgba(255,255,255,.9); color: var(--bo-ink); cursor: pointer; }
        .bp-x--light { position: fixed; top: 16px; right: 16px; }
        .bp-photo { max-width: min(1100px, 100%); max-height: 86vh; border-radius: 8px; }

        @media (max-width: 640px) {
          .bp { gap: 36px; }
          .bp-h { font-size: 19px; }
          .bp-story { flex-direction: column; gap: 12px; }
          .bp-story__logo { width: 56px; height: 56px; }
          .bp-story p, .bp-list li { font-size: 15px; }
          .bp-pol__txt b { font-size: 15.5px; }
          .bp-pol__txt span { font-size: 14px; }
          .bp-team { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 12px; }
          .bp-member { grid-template-columns: 1fr; max-height: calc(100vh - 40px); overflow-y: auto; }
          .bp-gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
          .bp-gallery--1 { grid-template-columns: minmax(0, 1fr); }
          .bp-gallery--3 > li:first-child, .bp-gallery--4 > li:first-child { grid-column: span 2; grid-row: auto; }
          .bp-social__link { min-width: 0; flex: 1 1 calc(50% - 6px); padding: 12px 14px; }
          /* phones: the president beside their name, vice presidents stacked,
             everyone else two to a row — faces big enough to recognise */
          .bp-lead { grid-template-columns: 132px minmax(0, 1fr); gap: 16px; margin-bottom: 20px; }
          .bp-lead__pos { font-size: 13.5px; }
          .bp-lead__txt b { font-size: 21px; }
          .bp-lead__major { font-size: 13.5px; }
          .bp-vice { grid-template-columns: 1fr; gap: 10px; margin-bottom: 24px; }
          .bp-vice__card { grid-template-columns: 84px minmax(0, 1fr); gap: 14px; }
          .bp-vice__txt b { font-size: 16px; }
          .bp-vice__txt span { font-size: 13px; }
          .bp.bp--wide .bp-team { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 12px; }
          .bp.bp--wide .bp-person b { font-size: 14.5px; margin-top: 8px; }
          .bp.bp--wide .bp-person span { font-size: 12.5px; }
          .bp-member__photo { aspect-ratio: 1; }
          .bp-member__txt { padding: 20px; }
        }
      `}</style>
    </div>
  );
}
