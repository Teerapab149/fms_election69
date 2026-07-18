"use client";

// StudioDarkCandidates — the CANDIDATES page layout for the Studio Dark v2
// template. Rendered by /candidates when activeTemplateId === 'studio-dark'.
//
// Faithful to docs/design-refs/Studio Dark v2.html §02: scene header ("Meet the
// parties running this year.") + full-bleed split panels — each party gets an
// oversized "0X" numeral (last digit serif-italic lime), kicker, media block,
// name, slogan (hairline left rule), and a quick-stats strip (CANDIDATES /
// POLICIES / VIEW Profile →) with a hover arrow that rotates -45°.
//
// Pure presentation: candidates/page.js owns data + the 1-party redirect; this
// receives 2+ real parties. Grid: 2 per row desktop (N parties wrap), 1 per row
// <1100px. Media = first team/official image, else logo, else hatched placeholder.

import { getPath } from "../../utils/basePath";
import StudioDarkShell from "./StudioDarkShell";

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

export default function StudioDarkCandidates({ candidates = [], editorMode = false }) {
  const parties = (candidates || []).filter((p) => p && parseInt(p.number) > 0);
  const memberTotal = parties.reduce((a, p) => a + (p.members?.length || 0), 0);

  return (
    <StudioDarkShell
      active="candidates"
      num="02"
      label="Candidates"
      labelTh="ผู้สมัคร"
      editorMode={editorMode}
      right={<span>{parties.length} PARTIES{memberTotal > 0 ? <>&nbsp;·&nbsp;{memberTotal} CANDIDATES</> : null}</span>}
    >
      <div className="sd-scene-h">
        <div>
          <span className="sd-scene-h__num"><span className="accent">№ 02</span> &nbsp;/&nbsp; THE CANDIDATES</span>
          <h1 className="sd-scene-h__title">Meet the parties<br />running this year.</h1>
        </div>
        <p className="sd-scene-h__deck">เลือกพรรคเพื่อดูวิสัยทัศน์ นโยบาย และรายชื่อสมาชิกทีมทั้งหมด</p>
      </div>

      {parties.length > 0 ? (
        <div className="sdc-split" data-count={parties.length}>
          {parties.map((p, i) => {
            const no = pad2(p.number);
            const media = resolveSrc(firstImage(p.groupImageUrls) || firstImage(p.officialImageUrl)) ;
            const logo = resolveSrc(p.logoUrl);
            return (
              <a
                key={p.id || i}
                href={editorMode ? undefined : getPath(`/party?id=${p.number}`)}
                className="sdc-panel"
              >
                <div className="sdc-panel__head">
                  <h2 className="sdc-panel__no">{no.slice(0, -1)}<em>{no.slice(-1)}</em></h2>
                  <span className="sd-smallcaps">PARTY · <span className="sdc-accent">№ {no}</span></span>
                </div>

                <div className={`sdc-panel__media ${media ? "" : "sd-media-ph"}`}>
                  {media ? (
                    <img src={media} alt={p.name} />
                  ) : logo ? (
                    <img src={logo} alt={p.name} className="sdc-panel__media-logo" />
                  ) : (
                    <span>★ TEAM PHOTO{p.members?.length ? ` · ${p.members.length} MEMBERS` : ""} ★</span>
                  )}
                </div>

                <h3 className="sdc-panel__name">{p.name}</h3>
                {p.slogan && <p className="sdc-panel__slogan">{p.slogan}</p>}

                <div className="sdc-panel__quick">
                  <div className="sdc-panel__cell">
                    <div className="lbl">CANDIDATES</div>
                    <div className="val">{p.members?.length || "—"}</div>
                  </div>
                  <div className="sdc-panel__cell">
                    <div className="lbl">POLICIES</div>
                    <div className="val">{Array.isArray(p.policies) ? p.policies.length : "—"}</div>
                  </div>
                  <div className="sdc-panel__cell">
                    <div className="lbl">VIEW</div>
                    <div className="val"><em>Profile →</em></div>
                  </div>
                </div>
              </a>
            );
          })}
          {parties.length % 2 === 1 && (
            <div className="sdc-panel sdc-filler" aria-hidden="true">
              <span className="sdc-filler__mark">✦</span>
              <span className="sdc-filler__note">ABSTAIN IS A RIGHT · งดออกเสียงคือสิทธิ์</span>
            </div>
          )}
        </div>
      ) : (
        <div className="sdc-empty">
          <div className="sd-media-ph sdc-empty__box"><span>★ NO PARTIES YET ★</span></div>
          <p>ยังไม่มีข้อมูลผู้สมัครในขณะนี้</p>
        </div>
      )}

      <style jsx global>{`
        .sdc-accent { color:var(--sd-accent); }

        .sdc-split { display:grid; grid-template-columns:repeat(2,1fr); flex:1; }
        .sdc-split[data-count="1"] { grid-template-columns:1fr; }

        .sdc-panel {
          padding:48px; border-right:1px solid var(--sd-line); border-bottom:1px solid var(--sd-line);
          display:flex; flex-direction:column; gap:22px; position:relative; cursor:pointer;
          transition:background .25s; overflow:hidden; min-height:620px;
        }
        .sdc-panel:nth-child(2n) { border-right:0; }
        .sdc-panel:hover { background:var(--sd-bg-2); }
        /* hover arrow chip (rotates -45° on hover, fills lime) */
        .sdc-panel::after {
          content:"↗"; position:absolute; right:32px; top:48px;
          width:36px; height:36px; border:1px solid var(--sd-line-strong); border-radius:999px;
          display:grid; place-items:center; color:var(--sd-ink-3); font-size:14px;
          transition:transform .25s, border-color .25s, background-color .25s, color .25s;
        }
        .sdc-panel:hover::after { border-color:var(--sd-accent); background:var(--sd-accent); color:var(--sd-bg); transform:rotate(45deg); }

        .sdc-panel__head { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px; padding-right:56px; }
        .sdc-panel__no {
          font-family:var(--sd-sans); font-weight:400; font-size:clamp(96px,11vw,170px);
          line-height:.82; letter-spacing:-.07em; color:var(--sd-ink); margin:0;
        }

        .sdc-panel__media { height:240px; border-radius:18px; overflow:hidden; position:relative; border:1px solid var(--sd-line); background:var(--sd-bg); }
        .sdc-panel__media img { width:100%; height:100%; object-fit:cover; display:block; }
        .sdc-panel__media img.sdc-panel__media-logo { object-fit:contain; padding:32px; }

        .sdc-panel__name {
          font-family:var(--sd-sans); font-weight:400; font-size:clamp(30px,3.4vw,48px);
          letter-spacing:-.03em; line-height:1.05; margin:6px 0 0;
        }
        .sdc-panel__slogan {
          font-family:var(--sd-serif); font-style:italic; color:var(--sd-ink-2); font-size:18px;
          line-height:1.45; margin:0; border-left:1px solid var(--sd-line-strong); padding-left:16px; max-width:420px;
        }

        .sdc-panel__quick { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid var(--sd-line); margin-top:auto; padding-top:22px; }
        .sdc-panel__cell .lbl { font-family:var(--sd-mono); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--sd-ink-3); }
        .sdc-panel__cell .val { font-family:var(--sd-sans); font-size:24px; margin-top:6px; font-weight:400; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }

        /* odd-N filler — fills the trailing empty cell of the 2-col grid so the
           bottom-right corner isn't left blank. Non-interactive, SD mono language.
           Desktop 2-col only; hidden at ≤1100px (1-col → no empty cell to fill). */
        .sdc-filler { cursor:default; align-items:center; justify-content:center; text-align:center; gap:18px; }
        .sdc-filler:hover { background:transparent; }
        .sdc-filler::after { display:none; }
        .sdc-filler__mark { font-family:var(--sd-serif); font-style:italic; font-size:44px; color:var(--sd-ink-3); line-height:1; }
        .sdc-filler__note { font-family:var(--sd-mono); font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--sd-ink-3); }

        .sdc-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; padding:64px 24px; }
        .sdc-empty__box { width:min(420px,100%); height:180px; }
        .sdc-empty p { color:var(--sd-ink-2); font-size:15px; margin:0; }

        @media (max-width:1100px) {
          .sdc-split { grid-template-columns:1fr; }
          .sdc-panel { border-right:0; min-height:0; padding:32px 24px; }
          .sdc-panel::after { right:24px; top:32px; }
          .sdc-panel__media { height:200px; }
          .sdc-filler { display:none; }
        }
      `}</style>
    </StudioDarkShell>
  );
}
