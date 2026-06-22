"use client";

// VerdureCandidates — CANDIDATES page for the Verdure template. Faithful to
// docs/design-refs/verdure.css §candidates: a MOSS (dark green) screen, centred
// header, then one big rounded panel per party — a round hatched media disc, the
// party kicker/name/slogan/quick-stats, and a giant italic number disc (alt party
// = terracotta-soft panel + terra number). Pure presentation; data from the page.

import { getPath } from "../../utils/basePath";
import VerdureShell from "./VerdureShell";

const firstImage = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) return val[0] || null;
  if (typeof val === "string") { const s = val.trim(); if (s.startsWith("[")) { try { const a = JSON.parse(s); return Array.isArray(a) ? a[0] : null; } catch { return s; } } return s; }
  return null;
};
const resolveSrc = (p) => (!p ? null : (String(p).startsWith("http") ? p : getPath(p)));
const pad2 = (n) => String(n ?? 0).padStart(2, "0");

export default function VerdureCandidates({ candidates = [], editorMode = false }) {
  const parties = (candidates || []).filter((p) => p && parseInt(p.number) > 0);
  const memberTotal = parties.reduce((a, p) => a + (p.members?.length || 0), 0);

  return (
    <VerdureShell
      active="candidates" moss editorMode={editorMode}
      edge={{ num: "02", label: "Candidates", th: "ผู้สมัคร", right: true }}
      statusChip={<div className="vd-chip-live"><span className="dot" /> {parties.length} PARTIES{memberTotal > 0 ? <> · <strong>{memberTotal} CANDIDATES</strong></> : null}</div>}
    >
      <div className="vd-cand">
        <div className="vd-cand__h">
          <div className="vd-cand__kicker"><span className="rule" /> NO. 02 · CANDIDATES <span className="rule" /></div>
          <h1 className="vd-cand__title">Meet the parties<br /><em>running this year.</em></h1>
          <p className="vd-cand__deck">เลือกพรรคใดพรรคหนึ่งเพื่อดูวิสัยทัศน์ นโยบาย และรายชื่อสมาชิกทีมทั้งหมด ก่อนตัดสินใจลงคะแนน</p>
        </div>

        {parties.length > 0 ? parties.map((p, i) => {
          // prefer the party LOGO (the brand mark reads cleaner in the disc); fall
          // back to a team/official photo, then a placeholder.
          const logo = resolveSrc(p.logoUrl);
          const photo = resolveSrc(firstImage(p.groupImageUrls) || firstImage(p.officialImageUrl));
          return (
            <a key={p.id || i} href={editorMode ? undefined : getPath(`/party?id=${p.number}`)}
              className={`vd-ppanel ${i % 2 === 1 ? "vd-ppanel--alt" : ""}`}>
              <div className="vd-ppanel__media">
                {logo ? <img src={logo} alt={p.name} className="logo" /> : photo ? <img src={photo} alt={p.name} /> : (
                  <div className="vd-ppanel__media-tag">★ Logo<br />placeholder ★</div>
                )}
              </div>
              <div className="vd-ppanel__main">
                <div className="vd-ppanel__kicker">PARTY · <span className="ac">No. {pad2(p.number)}</span></div>
                <h2 className="vd-ppanel__name">{p.name}</h2>
                {p.slogan && <p className="vd-ppanel__slogan">{p.slogan}</p>}
                <div className="vd-ppanel__quick">
                  <div><div className="lbl">CANDIDATES</div><div className="val vd-tabular">{p.members?.length || "—"}</div></div>
                  <div><div className="lbl">POLICIES</div><div className="val vd-tabular">{Array.isArray(p.policies) ? pad2(p.policies.length) : "—"}</div></div>
                  <div><div className="lbl">STATUS</div><div className="val">Active</div></div>
                </div>
              </div>
              <div className="vd-ppanel__no">{p.number}</div>
            </a>
          );
        }) : (
          <div className="vd-cand__empty">ยังไม่มีข้อมูลผู้สมัครในขณะนี้</div>
        )}
      </div>

      <style jsx global>{`
        .vd-cand { flex:1; padding:104px 80px 150px; max-width:1440px; margin:0 auto; width:100%; position:relative; z-index:1; }
        .vd-cand__h { text-align:center; margin-bottom:52px; }
        .vd-cand__kicker { display:inline-flex; align-items:center; gap:14px; font-family:var(--fm); font-size:11px; letter-spacing:.25em; text-transform:uppercase; color:var(--cream); opacity:.65; margin-bottom:20px; }
        .vd-cand__kicker .rule { width:48px; height:1px; background:currentColor; }
        .vd-cand__title { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(52px,7vw,96px); line-height:.96; letter-spacing:-.015em; margin:0; color:var(--cream); }
        .vd-cand__title em { color:var(--terra-soft); }
        .vd-cand__deck { font-family:var(--ft); font-size:17px; color:rgba(244,236,219,.7); line-height:1.55; max-width:580px; margin:20px auto 0; }

        .vd-ppanel { display:grid; grid-template-columns:auto 1fr auto; gap:48px; align-items:center; padding:48px 56px; background:var(--cream); color:var(--moss); border-radius:32px; margin-bottom:24px; cursor:pointer; transition:transform .3s, box-shadow .3s; position:relative; overflow:hidden; }
        .vd-ppanel:hover { transform:translateY(-4px); box-shadow:0 30px 60px -20px rgba(31,58,44,.35); }
        .vd-ppanel--alt { background:var(--terra-soft); }
        .vd-ppanel__media { width:260px; height:260px; border-radius:50%; background:var(--cream-2); border:1px solid var(--rule); display:grid; place-items:center; position:relative; overflow:hidden; flex-shrink:0; }
        .vd-ppanel--alt .vd-ppanel__media { background:var(--cream-2); }
        .vd-ppanel__media img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
        /* logos: contain inside the disc with a touch of breathing room (was over-
           padded so the mark floated small in the frame) + a clean light disc so a
           white logo background blends instead of showing a square */
        .vd-ppanel__media img.logo { object-fit:contain; padding:22px; border-radius:0; }
        .vd-ppanel__media-tag { position:relative; font-family:var(--fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--moss); opacity:.65; text-align:center; padding:6px 14px; background:var(--cream-2); border:1px solid var(--rule); border-radius:999px; }
        .vd-ppanel__main { min-width:0; }
        .vd-ppanel__kicker { font-family:var(--fm); font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--moss); opacity:.55; margin-bottom:14px; }
        .vd-ppanel__kicker .ac { color:var(--terra); opacity:1; font-weight:700; }
        .vd-ppanel__name { font-family:var(--fd); font-style:italic; font-weight:400; font-size:clamp(34px,4.5vw,58px); line-height:1; letter-spacing:-.015em; margin:0 0 14px; color:var(--moss); }
        .vd-ppanel__slogan { font-family:var(--ft); font-size:17px; line-height:1.5; color:var(--moss); opacity:.75; margin:0 0 24px; max-width:480px; }
        .vd-ppanel__quick { display:flex; gap:32px; padding-top:18px; border-top:1px solid var(--rule); }
        .vd-ppanel__quick .lbl { font-family:var(--fm); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--moss); opacity:.55; }
        .vd-ppanel__quick .val { font-family:var(--fd); font-style:italic; font-weight:400; font-size:24px; letter-spacing:-.01em; margin-top:4px; color:var(--moss); }
        .vd-ppanel__no { width:200px; height:200px; border-radius:50%; background:var(--moss); color:var(--cream); display:grid; place-items:center; font-family:var(--fd); font-style:italic; font-weight:400; font-size:150px; line-height:1; letter-spacing:-.04em; flex-shrink:0; position:relative; }
        .vd-ppanel--alt .vd-ppanel__no { background:var(--terra); }
        .vd-ppanel__no::before { content:""; position:absolute; inset:-10px; border:1px dashed currentColor; border-radius:50%; opacity:.25; }
        .vd-cand__empty { text-align:center; color:rgba(244,236,219,.7); font-size:16px; padding:80px 0; }

        @media (max-width:1100px) {
          .vd-cand { padding:92px 24px 130px; }
          .vd-ppanel { grid-template-columns:1fr; gap:24px; padding:32px; text-align:center; }
          .vd-ppanel__media { margin:0 auto; width:200px; height:200px; }
          .vd-ppanel__quick { justify-content:center; }
          .vd-ppanel__no { margin:0 auto; width:140px; height:140px; font-size:104px; }
        }
      `}</style>
    </VerdureShell>
  );
}
