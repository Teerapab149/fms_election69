"use client";

// BlossomLogin — PSU-Passport login in the Blossom voice (candy editorial: soft
// canvas, a rounded card with a thick ink rule, Kanit display, the family's accent
// as the primary fill). Pre-auth, so no topbar — a centred card on the canvas,
// same shape as VerdureLogin.
//
// Colours come from <BlossomBaseStyles> on a .bl-root wrapper rather than being
// hardcoded, so this page follows whichever blossom colour theme is active (and
// re-tints on /template-preview?slug=blossom-*) exactly like every other page in
// the family. Presentational only — auth lives in app/login/page.js and arrives
// as props, shared by every template login.

import { getPath } from "../../utils/basePath";
import { BlossomBaseStyles } from "../home/BlossomTheme";
import { Loader2, AlertCircle, LogIn, FlaskConical, ArrowLeft } from "lucide-react";

export default function BlossomLogin({
  error, loading, onLogin, showMock = false, mockStudentId, setMockStudentId, mockLoading, onMockLogin, onBack, onAdmin,
}) {
  return (
    <div className="bl-root bll-root">
      <BlossomBaseStyles />

      <span className="bll-corner bll-corner--tl">FMS ELECTION · SAMO</span>
      <span className="bll-corner bll-corner--br">SECURED · PSU PASSPORT</span>

      <div className="bll-card">
        <div className="bll-logo"><img src={getPath("/images/logo/09_FMS_Short_EN_V_PNG.png")} alt="FMS PSU" /></div>
        <div className="bll-eyebrow"><span className="dot" /> PSU AUTHENTICATION</div>
        <h1 className="bll-title">PSU <em>Passport</em></h1>
        <p className="bll-deck">ระบบยืนยันตัวตนสำหรับนักศึกษา<br />มหาวิทยาลัยสงขลานครินทร์</p>

        {error && <div className="bll-error"><AlertCircle size={15} strokeWidth={2} /> {error}</div>}

        <button type="button" className="bll-btn bll-btn--primary" onClick={onLogin} disabled={loading}>
          {loading ? <><Loader2 className="bll-spin" size={18} /> กำลังเชื่อมต่อระบบ…</> : <><LogIn size={18} strokeWidth={2} /> เข้าสู่ระบบด้วย PSU Passport</>}
        </button>
        <p className="bll-hint">ระบบจะนำท่านไปยังหน้ายืนยันตัวตนของมหาวิทยาลัย</p>

        {showMock && (
          <div className="bll-mock">
            <div className="bll-mock__lbl"><FlaskConical size={13} strokeWidth={2} /> DEV ONLY — MOCK LOGIN</div>
            <input type="text" className="bll-input" value={mockStudentId} onChange={(e) => setMockStudentId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onMockLogin()} placeholder="e.g. 6610510149" disabled={mockLoading} />
            <button type="button" className="bll-btn bll-btn--ghost" onClick={onMockLogin} disabled={mockLoading || !mockStudentId.trim()}>
              {mockLoading ? <><Loader2 className="bll-spin" size={16} /> กำลังเข้าสู่ระบบ…</> : <><FlaskConical size={15} strokeWidth={2} /> Mock Login</>}
            </button>
          </div>
        )}

        <div className="bll-foot">
          <button type="button" className="bll-btn bll-btn--ghost" onClick={onBack}><ArrowLeft size={15} strokeWidth={2} /> กลับหน้าหลัก</button>
          <button type="button" className="bll-admin" onClick={onAdmin}>FMS ELECTION SYSTEM</button>
        </div>
      </div>

      <style jsx global>{`
        html, body { color-scheme:light; }
        .bll-root { min-height:100vh; position:relative; display:grid; place-items:center;
          padding:32px 20px; background:var(--bl-canvas); color:var(--bl-ink); font-family:var(--bl-fb); }
        .bll-root * { box-sizing:border-box; }

        .bll-corner { position:absolute; font-family:var(--bl-fm); font-size:10px; letter-spacing:.22em;
          text-transform:uppercase; color:var(--bl-ink2); opacity:.75; }
        .bll-corner--tl { top:24px; left:28px; }
        .bll-corner--br { bottom:24px; right:28px; }

        /* the family's card: generous radius + a real ink rule (not a hairline) */
        .bll-card { width:100%; max-width:440px; background:var(--bl-card); border:2px solid var(--bl-ink);
          border-radius:30px; padding:44px 36px; text-align:center;
          box-shadow:0 26px 60px -34px color-mix(in srgb, var(--bl-ink) 55%, transparent); }
        .bll-logo { display:inline-flex; align-items:center; justify-content:center; padding:14px 20px;
          border-radius:20px; background:var(--bl-primary-soft); margin:0 auto 20px; }
        .bll-logo img { height:62px; width:auto; object-fit:contain; display:block; }
        .bll-eyebrow { font-family:var(--bl-fm); font-size:11px; letter-spacing:.2em; text-transform:uppercase;
          color:var(--bl-ink2); display:flex; align-items:center; justify-content:center; gap:9px; margin-bottom:14px; }
        .bll-eyebrow .dot { width:7px; height:7px; border-radius:50%; background:var(--bl-primary-deep); }
        .bll-title { font-family:var(--bl-fd); font-weight:700; font-size:38px; letter-spacing:-.02em;
          line-height:1.05; margin:0 0 12px; color:var(--bl-ink); }
        .bll-title em { font-style:normal; color:var(--bl-primary-ink); }
        .bll-deck { font-size:14px; color:var(--bl-ink2); line-height:1.6; margin:0 0 26px; }

        .bll-error { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:18px;
          background:var(--bl-primary-soft); border:1.5px solid var(--bl-primary-deep); color:var(--bl-primary-ink);
          border-radius:16px; padding:11px 14px; font-size:13px; }

        .bll-btn { width:100%; display:inline-flex; align-items:center; justify-content:center; gap:10px;
          min-height:52px; border-radius:999px; cursor:pointer; font-family:var(--bl-fd); font-weight:700;
          font-size:15px; padding:14px 22px; border:2px solid transparent; transition:transform .2s ease, background .25s ease, color .25s ease, border-color .25s ease; }
        .bll-btn:disabled { opacity:.55; cursor:not-allowed; }
        .bll-btn--primary { background:var(--bl-primary-deep); color:var(--bl-on-primary, var(--bl-card)); border-color:var(--bl-primary-deep); }
        .bll-btn--primary:not(:disabled):hover { transform:translateY(-3px); }
        .bll-btn--ghost { background:var(--bl-card); color:var(--bl-ink); border-color:var(--bl-ink); }
        .bll-btn--ghost:not(:disabled):hover { color:var(--bl-primary-ink); border-color:var(--bl-primary-deep); transform:translateY(-2px); }
        .bll-hint { margin:14px 0 0; font-family:var(--bl-fm); font-size:10px; letter-spacing:.06em; color:var(--bl-ink2); }

        .bll-mock { margin-top:26px; padding-top:22px; border-top:2px dashed var(--bl-line);
          display:flex; flex-direction:column; gap:10px; }
        .bll-mock__lbl { display:flex; align-items:center; justify-content:center; gap:7px; font-family:var(--bl-fm);
          font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--bl-primary-ink); margin-bottom:4px; }
        .bll-input { width:100%; padding:13px 16px; border-radius:16px; border:2px solid var(--bl-line);
          background:var(--bl-card); color:var(--bl-ink); font-family:var(--bl-fb); font-size:14px; text-align:center; }
        .bll-input::placeholder { color:var(--bl-faint); }
        .bll-input:focus { outline:none; border-color:var(--bl-primary-deep); }

        .bll-foot { margin-top:28px; padding-top:22px; border-top:2px solid var(--bl-line);
          display:flex; flex-direction:column; gap:14px; align-items:center; }
        .bll-admin { background:none; border:0; cursor:pointer; font-family:var(--bl-fm); font-size:10px;
          letter-spacing:.16em; text-transform:uppercase; color:var(--bl-ink2); transition:color .2s; }
        .bll-admin:hover { color:var(--bl-primary-ink); }
        .bll-spin { animation:bllSpin 1s linear infinite; }
        @keyframes bllSpin { to { transform:rotate(360deg); } }

        /* short laptops — with the dev mock form mounted the card runs 769px, which
           overflows an 800px viewport once the root padding is counted. Production
           never shows that block, but a login page that scrolls on a laptop reads as
           broken either way, so give the card back the difference. */
        @media (max-height:860px) {
          .bll-root { padding:18px 20px; }
          .bll-card { padding:30px 32px; }
          .bll-logo { margin-bottom:14px; padding:10px 16px; }
          .bll-logo img { height:50px; }
          .bll-deck { margin-bottom:20px; }
          .bll-foot { margin-top:20px; padding-top:16px; }
        }

        /* phones — after the base rules so equal-specificity overrides win */
        @media (max-width:560px) {
          .bll-corner { display:none; }
          .bll-root { padding:24px 16px; }
          .bll-card { padding:34px 22px; border-radius:24px; }
          .bll-logo img { height:54px; }
          .bll-title { font-size:32px; }
        }
      `}</style>
    </div>
  );
}
