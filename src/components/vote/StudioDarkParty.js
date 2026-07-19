"use client";

// StudioDarkParty — the PUBLIC PARTY DETAIL page for the Studio Dark v2
// template. Rendered by /party when activeTemplateId === 'studio-dark'.
//
// Faithful to docs/design-refs/Studio Dark v2.html §03: profile header (giant
// numeral + italic-accent title + slogan w/ lime left rule + quick stats) →
// STICKY TAB NAV (i. Vision / ii. Policies / iii. The Team + ลงคะแนน action)
// swapping sections inline → policy "table rows" that highlight + reveal a tag
// on hover → 4-up portrait roster → closing profile CTA.
//
// Pure presentation: party/page.js owns id resolution + data. Data fields are
// loose admin JSON → same asText/firstImage tolerance as GumroadParty.
// Vision tab = logoMeaning story + missions list; media slot = team photo.

import { getPath } from "../../utils/basePath";
import { useMemo, useState } from "react";
import { sortMembersByPosition } from "../../utils/memberSort";
import StudioDarkShell from "./StudioDarkShell";
import { StudioDarkMemberModal, StudioDarkLightbox } from "./StudioDarkMemberModal";
import StoryClamp from "./StoryClamp";

const asText = (it) =>
  typeof it === "string" ? it : (it?.text ?? it?.title ?? it?.detail ?? it?.description ?? it?.name ?? "");
const firstImage = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) return val[0] || null;
  if (typeof val === "string") {
    const s = val.trim();
    if (s.startsWith("[")) { try { const a = JSON.parse(s); return Array.isArray(a) ? a[0] : null; } catch { return s; } }
    return s;
  }
  return null;
};
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));
const pad2 = (n) => String(n ?? 0).padStart(2, "0");
const ROMAN = ["i.", "ii.", "iii."];

export default function StudioDarkParty({ party = {}, galleryImages = [], showBackToVote = false }) {
  const [tab, setTab] = useState("vision");
  const [modalMember, setModalMember] = useState(null); // click a member → profile modal
  const [lightboxSrc, setLightboxSrc] = useState(null); // click the team photo → fullscreen

  const missions = useMemo(() => (party?.missions || []).map(asText).filter(Boolean), [party?.missions]);
  const policies = useMemo(() => (party?.policies || []).map((it) => (
    typeof it === "string"
      ? { title: it, desc: "" }
      : { title: asText(it), desc: it?.desc ?? it?.description ?? it?.detail ?? "" }
  )).filter((p) => p.title), [party?.policies]);
  const members = useMemo(() => sortMembersByPosition(party?.members || []), [party?.members]);
  const story = (party?.logoMeaning || "").trim();

  const gallery = useMemo(
    () => (galleryImages || []).map((g) => resolveSrc(g?.imageUrl || g)).filter(Boolean),
    [galleryImages]
  );
  const heroImg = gallery[0] || resolveSrc(firstImage(party?.groupImageUrls) || firstImage(party?.officialImageUrl));

  const no = pad2(party?.number);
  const hasVision = !!story || missions.length > 0;
  const TABS = [
    ...(hasVision ? [{ id: "vision", label: "Vision" }] : []),
    ...(policies.length ? [{ id: "policies", label: "Policies" }] : []),
    ...(members.length ? [{ id: "team", label: "The Team" }] : []),
  ];
  const activeTab = TABS.find((t) => t.id === tab)?.id || TABS[0]?.id || null;

  return (
    <StudioDarkShell
      active={showBackToVote ? "vote" : "candidates"}
      backHref={showBackToVote ? "/vote" : "/candidates"}
      backLabel={showBackToVote ? "Vote" : "Candidates"}
      label="Profile"
      labelTh={`Party № ${no}`}
      right={<span>{members.length > 0 && <>{members.length} CANDIDATES&nbsp;·&nbsp;</>}{policies.length} POLICIES</span>}
    >
      {/* PROFILE HEADER */}
      <div className="sdp-h">
        <div className="sdp-h__no">{no.slice(0, -1)}<em>{no.slice(-1)}</em></div>
        <div>
          <h1 className="sdp-h__title">{party?.name}</h1>
          {party?.slogan && <p className="sdp-h__slogan">{party.slogan}</p>}
        </div>
        <div className="sdp-h__quick">
          <div className="sdp-h__row">CANDIDATES <strong>{members.length || "—"}</strong></div>
          <div className="sdp-h__row">POLICIES <strong>{policies.length || "—"}</strong></div>
          <div className="sdp-h__row">STATUS <strong><em>Active</em></strong></div>
        </div>
      </div>

      {/* STICKY TABS */}
      {TABS.length > 0 && (
        <nav className="sdp-tabs">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className={`sdp-tab ${activeTab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="sdp-tab__num">{ROMAN[i] || ""}</span> {t.label}
            </button>
          ))}
          <div className="sdp-tabs__spacer" />
          <a href={getPath("/vote")} className="sdp-tabs__action">ลงคะแนน · Vote →</a>
        </nav>
      )}

      {/* VISION */}
      {activeTab === "vision" && hasVision && (
        <section className="sdp-section">
          <h2><span className="num">i.</span>Vision &amp; <em>future.</em></h2>
          {/* Stacked, not side-by-side: the team photo is a wide/panoramic group
              shot that can't fill a tall column, so it reads as a full-width
              banner on top; the story sits below at a comfortable reading width
              (wider line = fewer lines = no tall narrow wall). Balanced + readable. */}
          {heroImg && (
            <figure
              className="sdp-vision__photo"
              onClick={() => setLightboxSrc(heroImg)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") setLightboxSrc(heroImg); }}
            >
              <img src={heroImg} alt={party?.name} />
              <figcaption className="sdp-story__cap">TEAM PHOTO · คลิกเพื่อขยาย ⌕</figcaption>
            </figure>
          )}
          {story && <div className="sdp-vision__story"><StoryClamp className="sdp-sc"><p>{story}</p></StoryClamp></div>}

          {/* missions — their own always-visible ledger below the story/photo */}
          {missions.length > 0 && (
            <div className="sdp-missions">
              <div className="sdp-missions__lbl"><span className="sdp-accent">●</span> MISSIONS · พันธกิจ</div>
              {missions.map((m, i) => (
                <div className="sdp-mission" key={i}>
                  <span className="sdp-mission__no">{pad2(i + 1)}</span>
                  <p>{m}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* POLICIES */}
      {activeTab === "policies" && policies.length > 0 && (
        <section className="sdp-section">
          <h2><span className="num">ii.</span>{policies.length === 4 ? <>Four <em>policies.</em></> : <>Our <em>policies.</em></>}</h2>
          <div className="sdp-policies">
            {policies.map((p, i) => (
              <div className="sdp-policy" key={i}>
                <div className="sdp-policy__no">{pad2(i + 1)}</div>
                <div className="sdp-policy__body"><p>{p.title}</p>{p.desc && <p className="sdp-policy__desc">{p.desc}</p>}</div>
                <span className="sdp-policy__tag">POLICY {pad2(i + 1)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TEAM */}
      {activeTab === "team" && members.length > 0 && (
        <section className="sdp-section">
          <h2><span className="num">iii.</span>The <em>team.</em></h2>
          <div className="sdp-roster">
            {members.map((m, i) => {
              const img = resolveSrc(m?.imageUrl);
              return (
                <button
                  type="button"
                  className="sdp-tile"
                  key={m.id || i}
                  onClick={() => setModalMember(m)}
                  aria-label={`ดูข้อมูล ${m.name || "ผู้สมัคร"}`}
                >
                  <div className={`sdp-tile__photo ${img ? "" : "sd-media-ph"}`}>
                    {img ? <img src={img} alt={m.name} /> : <span>portrait</span>}
                  </div>
                  <div className="sdp-tile__name">{m.name}</div>
                  {(m.position || m.major) && <div className="sdp-tile__role">{m.position || m.major}</div>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* CLOSING CTA */}
      <div className="sdp-cta">
        <p className="sdp-cta__line">Pick <em>№ {no}.</em>&nbsp; Pick the future.</p>
        <a href={getPath("/vote")} className="sd-btn sd-btn--accent sd-btn--lg">ลงคะแนนให้พรรคนี้ →</a>
      </div>

      {/* shared studio overlays */}
      <StudioDarkMemberModal member={modalMember} onClose={() => setModalMember(null)} />
      <StudioDarkLightbox src={lightboxSrc} caption={`TEAM PHOTO · ${party?.name || ""}`} onClose={() => setLightboxSrc(null)} />

      <style jsx global>{`
        /* profile header */
        .sdp-h {
          display:grid; grid-template-columns:auto 1fr auto; gap:48px; align-items:end;
          padding:56px 48px 32px; border-bottom:1px solid var(--sd-line);
        }
        .sdp-h__no { font-family:var(--sd-sans); font-weight:400; font-size:clamp(110px,13vw,200px); line-height:.78; letter-spacing:-.07em; color:var(--sd-ink); }
        .sdp-h__title { font-family:var(--sd-sans); font-weight:400; font-size:clamp(32px,4vw,58px); line-height:1; letter-spacing:-.035em; margin:0; }
        .sdp-h__slogan {
          font-family:var(--sd-serif); font-style:italic; font-size:18px; color:var(--sd-ink-2);
          margin:16px 0 0; line-height:1.45; font-weight:300; max-width:540px;
          padding-left:16px; border-left:1px solid var(--sd-accent);
        }
        .sdp-h__quick { display:grid; gap:16px; }
        .sdp-h__row { font-family:var(--sd-mono); font-size:11px; letter-spacing:.15em; text-transform:uppercase; color:var(--sd-ink-3); text-align:right; }
        .sdp-h__row strong { display:block; font-family:var(--sd-sans); font-size:22px; color:var(--sd-ink); margin-top:4px; letter-spacing:-.02em; font-weight:400; }

        /* sticky tabs — top must equal the scene-bar height so they butt
           flush (was 63 vs a 59px bar → a 4px band of scrolling content + the
           translucent bar showed photos through; owner feedback). 58 = 1px
           tuck under the bar (z-index 30 > 20) so no sub-pixel sliver. */
        .sdp-tabs {
          position:sticky; top:58px; z-index:20; background:var(--sd-bg);
          border-bottom:1px solid var(--sd-line); padding:0 48px;
          display:flex; align-items:center; overflow-x:auto;
        }
        .sdp-tab {
          padding:18px 0; margin-right:32px; font-family:var(--sd-sans); font-size:15px; font-weight:500;
          color:var(--sd-ink-3); background:none; border:0; border-bottom:2px solid transparent;
          display:flex; align-items:baseline; gap:10px; cursor:pointer; white-space:nowrap;
          transition:color .2s, border-color .2s;
        }
        .sdp-tab:hover { color:var(--sd-ink); }
        .sdp-tab.is-active { color:var(--sd-ink); border-bottom-color:var(--sd-accent); }
        .sdp-tab__num { font-family:var(--sd-serif); font-style:italic; font-size:14px; color:var(--sd-ink-4); }
        .sdp-tab.is-active .sdp-tab__num { color:var(--sd-accent); }
        .sdp-tabs__spacer { flex:1; }
        .sdp-tabs__action {
          display:flex; align-items:center; gap:8px; font-family:var(--sd-mono); font-size:11px;
          letter-spacing:.15em; text-transform:uppercase; color:var(--sd-ink-3);
          padding:8px 16px; border:1px solid var(--sd-line-strong); border-radius:999px; margin-left:24px;
          transition:all .2s; white-space:nowrap;
        }
        .sdp-tabs__action:hover { background:var(--sd-accent); border-color:var(--sd-accent); color:var(--sd-bg); }

        /* sections */
        .sdp-section { padding:56px 48px; border-bottom:1px solid var(--sd-line); }
        .sdp-section h2 { font-family:var(--sd-sans); font-weight:400; font-size:clamp(32px,4vw,54px); letter-spacing:-.03em; line-height:1; margin:0 0 28px; }
        .sdp-section h2 .num { font-family:var(--sd-serif); font-style:italic; font-size:.4em; color:var(--sd-ink-4); vertical-align:super; margin-right:14px; }

        /* Vision: full-width team-photo banner + readable story column below */
        .sdp-vision__photo {
          position:relative; display:block; width:100%; margin:0 0 36px; cursor:zoom-in;
          border:1px solid var(--sd-line); border-radius:18px; overflow:hidden; background:var(--sd-bg-2);
        }
        .sdp-vision__photo img { width:100%; max-height:400px; object-fit:cover; display:block; transition:transform .4s; }
        .sdp-vision__photo:hover img { transform:scale(1.015); }
        .sdp-vision__story { max-width:840px; }
        .sdp-vision__story p { font-size:16px; line-height:1.75; color:var(--sd-ink); font-weight:300; margin:0; }
        /* StoryClamp — long manifesto folds behind a panel fade */
        .sdp-sc { --sc-max:9em; --sc-fade:var(--sd-bg); }
        .sdp-sc .sc__hint { color:var(--sd-accent); font-family:var(--sd-mono); text-transform:uppercase; }
        .sdp-story__cap {
          position:absolute; left:12px; bottom:12px; font-family:var(--sd-mono); font-size:9px;
          letter-spacing:.18em; text-transform:uppercase; color:var(--sd-ink-2);
          background:rgba(20,20,15,.78); border:1px solid var(--sd-line); padding:5px 12px; border-radius:999px;
        }

        /* missions ledger (below the story/photo grid) */
        .sdp-accent { color:var(--sd-accent); }
        .sdp-missions { margin-top:40px; border-top:1px dashed var(--sd-line-strong); padding-top:8px; }
        .sdp-missions__lbl { font-family:var(--sd-mono); font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--sd-ink-2); padding:16px 0 6px; }
        .sdp-mission {
          display:grid; grid-template-columns:64px 1fr; gap:28px; align-items:baseline;
          padding:18px 8px; border-bottom:1px solid var(--sd-line);
          transition:background .2s, padding-left .25s;
        }
        .sdp-mission:last-child { border-bottom:0; }
        .sdp-mission:hover { background:var(--sd-bg-2); padding-left:20px; }
        .sdp-mission__no { font-family:var(--sd-serif); font-style:italic; font-size:30px; color:var(--sd-accent); line-height:1; }
        .sdp-mission p { font-size:16px; line-height:1.6; color:var(--sd-ink); margin:0; font-weight:300; max-width:820px; }

        .sdp-policies { border-top:1px solid var(--sd-line-strong); }
        .sdp-policy {
          display:grid; grid-template-columns:80px 1fr auto; gap:40px; align-items:baseline;
          padding:28px 8px; border-bottom:1px solid var(--sd-line);
          transition:background .2s, padding-left .25s;
        }
        .sdp-policy:hover { background:var(--sd-bg-2); padding-left:24px; }
        .sdp-policy__no { font-family:var(--sd-sans); font-weight:400; font-size:48px; letter-spacing:-.04em; color:var(--sd-ink-4); line-height:.9; transition:color .2s; }
        .sdp-policy:hover .sdp-policy__no { color:var(--sd-accent); }
        .sdp-policy__body p { font-size:16px; line-height:1.6; color:var(--sd-ink); margin:0; font-weight:300; max-width:720px; }
        .sdp-policy__body p.sdp-policy__desc { font-size:14px; line-height:1.65; color:var(--sd-ink-3); margin-top:6px; font-weight:300; max-width:720px; }
        .sdp-policy__tag { font-family:var(--sd-mono); font-size:10px; letter-spacing:.15em; text-transform:uppercase; color:var(--sd-ink-3); opacity:0; transition:opacity .25s; white-space:nowrap; }
        .sdp-policy:hover .sdp-policy__tag { opacity:1; }

        .sdp-roster { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
        .sdp-tile {
          background:var(--sd-bg-2); border:1px solid var(--sd-line); border-radius:16px; padding:14px;
          transition:border-color .2s, transform .2s; cursor:pointer; text-align:left;
          font:inherit; color:inherit; display:block; width:100%;
        }
        .sdp-tile:hover, .sdp-tile:focus-visible { border-color:var(--sd-accent); transform:translateY(-3px); outline:none; }
        .sdp-tile__photo { aspect-ratio:4/5; border-radius:10px; margin-bottom:14px; overflow:hidden; position:relative; border:1px solid var(--sd-line); background:var(--sd-bg); }
        .sdp-tile__photo img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
        .sdp-tile__name { font-family:var(--sd-sans); font-weight:500; font-size:14px; line-height:1.25; margin-bottom:4px; color:var(--sd-ink); }
        .sdp-tile__role { font-family:var(--sd-mono); font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--sd-ink-3); }

        .sdp-cta { padding:56px 48px 80px; display:flex; justify-content:space-between; align-items:center; gap:24px; flex-wrap:wrap; }
        .sdp-cta__line { font-family:var(--sd-serif); font-style:italic; font-size:clamp(20px,2.4vw,28px); color:var(--sd-ink-2); font-weight:400; margin:0; }

        @media (max-width:1100px) {
          .sdp-h { grid-template-columns:1fr; gap:20px; padding:36px 24px 24px; }
          .sdp-h__quick { display:flex; gap:24px; }
          .sdp-h__row { text-align:left; }
          .sdp-tabs { top:0; padding:0 24px; }
          .sdp-section { padding:36px 24px; }
          .sdp-story { grid-template-columns:1fr; gap:24px; }
          .sdp-policy { grid-template-columns:56px 1fr; }
          .sdp-policy__tag { display:none; }
          .sdp-roster { grid-template-columns:repeat(3,1fr); }
          .sdp-cta { padding:36px 24px 56px; }
        }
        @media (max-width:560px) {
          .sdp-roster { grid-template-columns:repeat(2,1fr); }
        }
      `}</style>
    </StudioDarkShell>
  );
}
