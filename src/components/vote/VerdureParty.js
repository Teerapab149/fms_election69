"use client";

// VerdureParty — PUBLIC PARTY DETAIL for the Verdure template. A moss "ribbon"
// header (number disc + name + slogan + tidy stat column), the party logo crest,
// then stacked CHAPTERS — Vision (story + team photo), Mission (its own section,
// separated from Vision), Policies (cards), The team (round-photo roster) — each
// with a roman-numeral watermark, a terra chapter eyebrow + big serif head, and
// generous spacing. Roster tiles open the member modal; the team photo opens a
// lightbox. Pure presentation; party/page.js owns id + data.

import { getPath } from "../../utils/basePath";
import { useMemo, useState } from "react";
import { sortMembersByPosition } from "../../utils/memberSort";
import VerdureShell from "./VerdureShell";
import { VerdureMemberModal, VerdureLightbox } from "./VerdureMemberModal";
import StoryClamp from "./StoryClamp";

const asText = (it) => typeof it === "string" ? it : (it?.text ?? it?.title ?? it?.detail ?? it?.description ?? it?.name ?? "");
const firstImage = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) return val[0] || null;
  if (typeof val === "string") { const s = val.trim(); if (s.startsWith("[")) { try { const a = JSON.parse(s); return Array.isArray(a) ? a[0] : null; } catch { return s; } } return s; }
  return null;
};
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));
const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const ROMAN = ["I", "II", "III", "IV", "V"];

export default function VerdureParty({ party = {}, galleryImages = [], showBackToVote = false, isSingleParty = false }) {
  const [modalMember, setModalMember] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const missions = useMemo(() => (party?.missions || []).map(asText).filter(Boolean), [party?.missions]);
  const policies = useMemo(() => (party?.policies || []).map((it) => (
    typeof it === "string"
      ? { title: it, desc: "" }
      : { title: asText(it), desc: it?.desc ?? it?.description ?? it?.detail ?? "" }
  )).filter((p) => p.title), [party?.policies]);
  const members = useMemo(() => sortMembersByPosition(party?.members || []), [party?.members]);
  const story = (party?.logoMeaning || "").trim();
  const gallery = useMemo(() => (galleryImages || []).map((g) => resolveSrc(g?.imageUrl || g)).filter(Boolean), [galleryImages]);
  const heroImg = gallery[0] || resolveSrc(firstImage(party?.groupImageUrls) || firstImage(party?.officialImageUrl));
  const logoSrc = resolveSrc(party?.logoUrl);
  const no = pad2(party?.number);

  // dynamic chapter numbering — Vision · Mission · Policies · The team
  const chapterKeys = [];
  if (story || heroImg || logoSrc) chapterKeys.push("vision");
  if (missions.length) chapterKeys.push("mission");
  if (policies.length) chapterKeys.push("policies");
  if (members.length) chapterKeys.push("team");
  const roman = (k) => ROMAN[chapterKeys.indexOf(k)] || "";

  return (
    <VerdureShell
      active={showBackToVote ? "vote" : "candidates"} editorMode={false}
      edge={{ num: "03", label: "Profile", th: `พรรคที่ ${no}` }}
      cornermarkSub={`Profile · No. ${no}`}
      // single real party → /candidates just redirects back here (candidates/page.js:92-95), so send it home instead
      backHref={showBackToVote ? "/vote" : (isSingleParty ? "/" : "/candidates")}
      backLabel={showBackToVote ? "BACK TO BALLOT" : (isSingleParty ? "BACK TO HOME" : "BACK TO CANDIDATES")}
    >
      <div className="vd-profile">
        <div className="vd-ribbon">
          <div className={`vd-ribbon__no ${logoSrc ? "has-logo" : ""}`}>
            {logoSrc ? <img src={logoSrc} alt={`โลโก้ ${party?.name || ""}`} /> : party?.number}
          </div>
          <div className="vd-ribbon__main">
            <div className="vd-ribbon__kicker">PARTY No. {no}</div>
            <h1 className="vd-ribbon__name">{party?.name}</h1>
            {party?.slogan && <p className="vd-ribbon__slogan">{party.slogan}</p>}
          </div>
        </div>

        {heroImg && (
          <figure className="vd-groupphoto" onClick={() => setLightboxSrc(heroImg)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setLightboxSrc(heroImg); }}>
            <img src={heroImg} alt={`ภาพหมู่พรรค ${party?.name || ""}`} />
            <figcaption><span className="vd-thai">ภาพหมู่พรรค · คลิกเพื่อขยาย</span></figcaption>
          </figure>
        )}

        {chapterKeys.includes("vision") && (
          <section className="vd-chapter">
            <div className="vd-chapter__wm">{roman("vision")}.</div>
            <div className="vd-chapter__head">
              <span className="vd-chapter__eyebrow"><span className="vd-nw">CHAPTER {roman("vision")}</span> · <span className="vd-thai">วิสัยทัศน์</span></span>
              <h2>Vision &amp; <em>identity.</em></h2>
            </div>
            <div className="vd-vision__body">
              {story
                ? <StoryClamp className="vd-sc"><p>{story}</p></StoryClamp>
                : <p className="vd-muted">พรรค {party?.name} มุ่งมั่นขับเคลื่อนกิจกรรมและพัฒนาสโมสรนักศึกษาคณะวิทยาการจัดการ</p>}
            </div>
          </section>
        )}

        {chapterKeys.includes("mission") && (
          <section className="vd-chapter">
            <div className="vd-chapter__wm">{roman("mission")}.</div>
            <div className="vd-chapter__head">
              <span className="vd-chapter__eyebrow"><span className="vd-nw">CHAPTER {roman("mission")}</span> · <span className="vd-thai">พันธกิจ</span></span>
              <h2>Our <em>mission.</em></h2>
            </div>
            <div className="vd-missions">
              {missions.map((m, i) => (
                <div className="vd-mission" key={i}><span className="no">{pad2(i + 1)}</span><p>{m}</p></div>
              ))}
            </div>
          </section>
        )}

        {chapterKeys.includes("policies") && (
          <section className="vd-chapter">
            <div className="vd-chapter__wm">{roman("policies")}.</div>
            <div className="vd-chapter__head">
              <span className="vd-chapter__eyebrow"><span className="vd-nw">CHAPTER {roman("policies")}</span> · <span className="vd-thai">{policies.length} นโยบาย</span></span>
              <h2>Our <em>policies.</em></h2>
            </div>
            <div className="vd-policies">
              {policies.map((p, i) => (
                <div className="vd-policy" key={i}>
                  <div className="vd-policy__no">{i + 1}</div>
                  <div className="vd-policy__tag">POLICY {pad2(i + 1)}</div>
                  <p className="vd-policy__t">{p.title}</p>
                  {p.desc && <p className="vd-policy__d">{p.desc}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {chapterKeys.includes("team") && (
          <section className="vd-chapter">
            <div className="vd-chapter__wm">{roman("team")}.</div>
            <div className="vd-chapter__head">
              <span className="vd-chapter__eyebrow">CHAPTER {roman("team")} · {members.length} candidates</span>
              <h2>The <em>team.</em></h2>
            </div>
            <div className="vd-roster">
              {members.map((m, i) => {
                const img = resolveSrc(m?.imageUrl);
                return (
                  <button type="button" className="vd-rtile" key={m.id || i} onClick={() => setModalMember(m)} aria-label={`ดูข้อมูล ${m.name || "ผู้สมัคร"}`}>
                    <div className="vd-rtile__photo">{img ? <img src={img} alt={m.name} /> : <span>portrait</span>}</div>
                    <div className="vd-rtile__name">{m.name}</div>
                    {(m.position || m.major) && <div className="vd-rtile__role">{m.position || m.major}</div>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <div className="vd-profile__cta">
          <p className="vd-profile__cta-line">Pick <em>No. {no}.</em> &nbsp;Pick the future.</p>
          <a href={getPath("/vote")} className="vd-btn vd-btn--terra vd-btn--lg">ลงคะแนนให้พรรคนี้ <span className="arr">↗</span></a>
        </div>
      </div>

      <VerdureMemberModal member={modalMember} onClose={() => setModalMember(null)} />
      <VerdureLightbox src={lightboxSrc} caption={`TEAM PHOTO · ${party?.name || ""}`} onClose={() => setLightboxSrc(null)} />

      <style jsx global>{`
        .vd-profile { flex:1; padding:96px 80px 150px; max-width:1280px; margin:0 auto; width:100%; position:relative; z-index:1; }

        /* ribbon — standalone identity card: logo disc · name/slogan */
        .vd-ribbon { display:grid; grid-template-columns:auto 1fr; gap:48px; align-items:center; padding:48px 56px; background:var(--moss); color:var(--cream); border-radius:28px; box-shadow:0 40px 80px -54px rgba(var(--moss-rgb),.4); }

        /* group photo — its own section below the identity card */
        .vd-groupphoto { display:block; margin:18px 0 0; cursor:zoom-in; position:relative; border-radius:24px; overflow:hidden; border:1px solid var(--rule); }
        .vd-groupphoto img { width:100%; height:clamp(240px,34vw,420px); object-fit:cover; display:block; transition:transform .5s; }
        .vd-groupphoto:hover img { transform:scale(1.02); }
        .vd-groupphoto figcaption { position:absolute; left:16px; bottom:16px; font-family:var(--fm); font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--cream); background:rgba(var(--moss-rgb),.78); padding:6px 14px; border-radius:999px; }
        .vd-ribbon__no { width:132px; height:132px; border-radius:50%; background:var(--terra); color:var(--cream); display:grid; place-items:center; font-family:var(--fd); font-style:italic; font-weight:400; font-size:96px; line-height:1; letter-spacing:-.04em; flex-shrink:0; overflow:hidden; }
        .vd-ribbon__no.has-logo { background:var(--cream-2); border:1px solid var(--rule); padding:18px; box-shadow:inset 0 0 0 1px rgba(var(--moss-rgb),.04); }
        .vd-ribbon__no img { width:100%; height:100%; object-fit:contain; display:block; }
        .vd-ribbon__main { min-width:0; }
        .vd-ribbon__kicker { font-family:var(--fm); font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--terra-soft); margin-bottom:12px; }
        .vd-ribbon__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(32px,4.2vw,54px); line-height:1.02; letter-spacing:-.015em; margin:0 0 14px; color:var(--cream); }
        .vd-ribbon__slogan { font-family:var(--ft); font-size:17px; color:rgba(var(--cream-rgb),.78); line-height:1.5; margin:0; max-width:560px; }

        /* chapters — generous spacing + a terra eyebrow above each head */
        .vd-chapter { position:relative; padding:88px 0 24px; overflow:hidden; }
        .vd-chapter + .vd-chapter, .vd-profile__cta { border-top:1px solid var(--rule); }
        .vd-chapter__wm { position:absolute; top:40px; right:-18px; font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(150px,18vw,240px); line-height:.8; letter-spacing:-.05em; color:var(--cream-3); opacity:.55; pointer-events:none; z-index:0; }
        .vd-chapter > *:not(.vd-chapter__wm) { position:relative; z-index:1; }
        .vd-chapter__head { margin-bottom:40px; }
        .vd-chapter__eyebrow { display:inline-block; font-family:var(--fm); font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--terra); margin-bottom:16px; }
        .vd-chapter__head h2 { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(42px,5.2vw,68px); line-height:1; letter-spacing:-.015em; margin:0; color:var(--moss); }
        .vd-chapter__head h2 em { color:var(--terra); }

        /* Vision — logo crest + readable story column, then a photo banner */
        .vd-vision { display:grid; grid-template-columns:auto 1fr; gap:48px; align-items:center; margin-bottom:36px; }
        .vd-crest { width:200px; height:200px; border-radius:50%; background:var(--cream-2); border:1px solid var(--rule); box-shadow:0 24px 50px -24px rgba(var(--moss-rgb),.3); display:grid; place-items:center; padding:26px; flex-shrink:0; }
        .vd-crest img { width:100%; height:100%; object-fit:contain; display:block; }
        .vd-vision__body p { font-family:var(--ft); font-size:19px; line-height:1.75; color:var(--moss); margin:0; max-width:680px; }
        .vd-vision__body .vd-muted { opacity:.7; }
        /* StoryClamp — a long story folds behind a cream fade so the sections
           below stay in reach */
        .vd-sc { --sc-max:9em; --sc-fade:var(--cream); max-width:680px; }
        .vd-sc .sc__hint { color:var(--moss); font-family:var(--ft); font-style:italic; }
        .vd-chapter__photo { margin:0; cursor:zoom-in; position:relative; border-radius:24px; overflow:hidden; border:1px solid var(--rule); }
        .vd-chapter__photo img { width:100%; max-height:420px; object-fit:cover; display:block; transition:transform .4s; }
        .vd-chapter__photo:hover img { transform:scale(1.02); }
        .vd-chapter__photo figcaption { position:absolute; left:14px; bottom:14px; font-family:var(--fm); font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--cream); background:rgba(var(--moss-rgb),.8); padding:6px 14px; border-radius:999px; }

        /* Mission — its own ledger */
        .vd-missions { max-width:880px; }
        .vd-mission { display:grid; grid-template-columns:64px 1fr; gap:28px; align-items:baseline; padding:22px 0; border-top:1px dashed var(--rule); transition:padding-left .25s; }
        .vd-mission:first-child { border-top:0; }
        .vd-mission:hover { padding-left:12px; }
        .vd-mission .no { font-family:var(--fd); font-style:italic; font-size:34px; color:var(--terra); line-height:1; }
        .vd-mission p { font-family:var(--ft); font-size:18px; line-height:1.65; color:var(--moss); margin:0; }

        .vd-policies { display:grid; grid-template-columns:repeat(2,1fr); gap:24px; margin-top:12px; }
        .vd-policy { padding:34px 30px 34px; background:var(--cream-2); border:1px solid var(--rule); border-radius:22px; position:relative; transition:all .25s; }
        .vd-policy:hover { background:var(--cream); transform:translateY(-4px); box-shadow:0 24px 50px -28px rgba(var(--moss-rgb),.3); }
        .vd-policy__no { position:absolute; top:-22px; left:26px; width:52px; height:52px; border-radius:50%; background:var(--terra); color:var(--cream); display:grid; place-items:center; font-family:var(--fd); font-style:italic; font-weight:400; font-size:26px; box-shadow:0 8px 18px -8px rgba(var(--terra-rgb),.6); }
        .vd-policy__tag { display:inline-block; font-family:var(--fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--terra); margin:10px 0 14px; }
        .vd-policy p { font-family:var(--ft); font-size:16px; line-height:1.6; color:var(--moss); margin:0; }
        .vd-policy p.vd-policy__t { font-weight:600; }
        .vd-policy p.vd-policy__d { font-size:14px; line-height:1.65; color:var(--moss); opacity:.72; margin-top:8px; font-weight:400; }

        .vd-roster { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
        .vd-rtile { background:var(--cream-2); border:1px solid var(--rule); border-radius:20px; padding:18px 16px 22px; text-align:center; transition:all .25s; cursor:pointer; font:inherit; color:inherit; display:block; width:100%; }
        .vd-rtile:hover, .vd-rtile:focus-visible { background:var(--cream); transform:translateY(-5px); outline:none; border-color:var(--terra); box-shadow:0 22px 44px -26px rgba(var(--moss-rgb),.34); }
        .vd-rtile__photo { width:100%; aspect-ratio:1; border-radius:50%; background:var(--cream-3); border:1px solid var(--rule); display:grid; place-items:center; margin-bottom:16px; position:relative; overflow:hidden; }
        .vd-rtile__photo img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
        .vd-rtile__photo span { font-family:var(--fm); font-size:10px; letter-spacing:.15em; text-transform:uppercase; color:var(--moss); opacity:.55; }
        .vd-rtile__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:19px; line-height:1.2; margin-bottom:6px; letter-spacing:-.01em; color:var(--moss); }
        .vd-rtile__role { font-family:var(--fs); font-weight:600; font-size:13px; letter-spacing:.02em; color:var(--terra); }

        .vd-profile__cta { margin-top:24px; padding-top:48px; display:flex; justify-content:space-between; align-items:center; gap:24px; flex-wrap:wrap; }
        .vd-profile__cta-line { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(22px,2.4vw,30px); color:var(--moss); margin:0; }
        .vd-profile__cta-line em { color:var(--terra); }

        @media (max-width:1100px) {
          .vd-profile { padding:92px 24px 130px; }
          .vd-ribbon { grid-template-columns:1fr; gap:22px; padding:30px 24px; text-align:center; }
          .vd-ribbon__no { margin:0 auto; }
          .vd-ribbon__slogan { margin:0 auto; }
          .vd-groupphoto img { height:clamp(180px,46vw,260px); }
          .vd-chapter { padding:64px 0 20px; }
          .vd-vision { grid-template-columns:1fr; gap:28px; justify-items:center; text-align:center; }
          .vd-vision__body p { text-align:left; }
          .vd-policies, .vd-roster { grid-template-columns:1fr; }
          .vd-roster { grid-template-columns:repeat(2,1fr); }
        }
      `}</style>
    </VerdureShell>
  );
}
