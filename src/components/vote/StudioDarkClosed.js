"use client";

// StudioDarkClosed — the SYSTEM-CLOSED status page for the Studio Dark v2
// template. Rendered by /closed when activeTemplateId === 'studio-dark'.
//
// The prototype has no closed screen (same situation gumroad hit) — this is
// composed in the template's own language: centered scene on the shared shell,
// variant icon inside the slowly-spinning dashed ring (the success-page mark
// device), mono kicker, giant English headline with the serif-italic accent,
// then the page's real Thai title + desc, and ONE primary action (logout when
// signed in, back-home otherwise).
//
// Variants (decided by closed/page.js from electionStatus/systemMode):
//   waiting → polls not open yet (Clock)
//   ended   → election finished (CheckCheck)
//   closed  → paused / maintenance (Lock)
//
// Pure presentation: page owns status fetch + the PSU SSO logout flow.

import { getPath } from "../../utils/basePath";
import { Lock, Clock, CheckCheck, LogOut } from "lucide-react";
import StudioDarkShell from "./StudioDarkShell";

const VARIANTS = {
  waiting: {
    Icon: Clock,
    kicker: "OPENS SOON · ยังไม่เปิดโหวต",
    headline: (<>Not yet<br /><em>open.</em></>),
    live: false,
  },
  ended: {
    Icon: CheckCheck,
    kicker: "POLLS CLOSED · ปิดโหวตแล้ว",
    headline: (<>That&rsquo;s<br />a <em>wrap.</em></>),
    live: false,
  },
  closed: {
    Icon: Lock,
    kicker: "ON HOLD · ปิดชั่วคราว",
    headline: (<>Ballot<br />on <em>hold.</em></>),
    live: false,
  },
};

export default function StudioDarkClosed({
  title = "",
  desc = "",
  variant = "closed",
  session = null,
  onLogout = () => {},
  editorMode = false,
}) {
  const v = VARIANTS[variant] || VARIANTS.closed;
  const { Icon } = v;

  return (
    <StudioDarkShell
      active="vote"
      num="03"
      label="Status"
      labelTh="สถานะการลงคะแนน"
      editorMode={editorMode}
      right={<span>{v.kicker.split(" · ")[0]}</span>}
    >
      <div className="sdcl-scene">
        <div className="sdcl-card">
          <div className="sdcl-mark"><Icon size={28} strokeWidth={2} /></div>
          <div className="sdcl-kicker">{v.kicker}</div>
          <h1 className="sdcl-headline">{v.headline}</h1>
          <h2 className="sdcl-title">{title}</h2>
          <p className="sdcl-desc">{desc}</p>

          <div className="sdcl-actions">
            {session ? (
              <button type="button" className="sd-btn sd-btn--accent sd-btn--lg" onClick={() => !editorMode && onLogout()}>
                <LogOut size={16} /> ออกจากระบบ
              </button>
            ) : (
              <a href={editorMode ? undefined : getPath("/")} className="sd-btn sd-btn--accent sd-btn--lg">
                ← กลับหน้าหลัก
              </a>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .sdcl-scene {
          flex:1; display:grid; place-items:center;
          padding:64px 24px; position:relative; overflow:hidden;
          min-height:calc(100vh - 64px);
        }
        .sdcl-scene::after {
          content:""; position:absolute; right:-120px; bottom:-120px; width:360px; height:360px;
          background:radial-gradient(circle, rgba(213,255,63,.07) 0, transparent 70%); pointer-events:none;
        }
        .sdcl-card { max-width:640px; width:100%; text-align:center; display:flex; flex-direction:column; align-items:center; position:relative; z-index:1; }

        .sdcl-mark {
          width:80px; height:80px; border:1px solid var(--sd-accent); border-radius:999px;
          display:grid; place-items:center; color:var(--sd-accent); margin-bottom:30px; position:relative;
        }
        .sdcl-mark::before {
          content:""; position:absolute; inset:-8px; border:1px dashed var(--sd-line-strong); border-radius:999px;
          animation:sdclSpin 30s linear infinite;
        }
        @keyframes sdclSpin { to { transform:rotate(360deg); } }

        .sdcl-kicker {
          font-family:var(--sd-mono); font-size:11px; letter-spacing:.25em; text-transform:uppercase;
          color:var(--sd-ink-3); margin-bottom:24px;
        }
        .sdcl-headline {
          font-family:var(--sd-sans); font-weight:400; font-size:clamp(52px,7vw,96px);
          line-height:.92; letter-spacing:-.05em; margin:0 0 28px; color:var(--sd-ink);
        }
        .sdcl-title { font-family:var(--sd-sans); font-weight:500; font-size:clamp(19px,2.2vw,24px); letter-spacing:-.01em; margin:0 0 12px; color:var(--sd-ink); }
        .sdcl-desc { font-size:15px; color:var(--sd-ink-2); line-height:1.65; font-weight:300; max-width:460px; margin:0 0 36px; }
        .sdcl-actions { display:flex; gap:14px; }

        @media (max-width:1100px) {
          .sdcl-scene { min-height:calc(100vh - 110px); padding:48px 24px; }
        }
      `}</style>
    </StudioDarkShell>
  );
}
