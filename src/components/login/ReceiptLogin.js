"use client";

// ReceiptLogin — PSU-Passport login in the Receipt voice (paper materiality: the
// desk canvas, a receipt-paper slip with a die-cut top edge and a perforated rule,
// Chakra Petch + Space Mono, the family's accent as the primary fill). Pre-auth,
// so no topbar — the slip sits alone on the desk, same shape as VerdureLogin.
//
// Colours come from <ReceiptBaseStyles> on a .rc-root wrapper rather than being
// hardcoded, so this page follows whichever receipt colour theme is active (and
// re-tints on /template-preview?slug=receipt-*). Presentational only — auth lives
// in app/login/page.js and arrives as props, shared by every template login.

import { getPath } from "../../utils/basePath";
import { ReceiptBaseStyles } from "../home/ReceiptTheme";
import { Loader2, AlertCircle, LogIn, FlaskConical, ArrowLeft } from "lucide-react";

export default function ReceiptLogin({
  error, loading, onLogin, showMock = false, mockStudentId, setMockStudentId, mockLoading, onMockLogin, onBack, onAdmin,
}) {
  return (
    <div className="rc-root rcl-root rc-desk">
      <ReceiptBaseStyles />

      <span className="rcl-corner rcl-corner--tl">FMS ELECTION · SAMO</span>
      <span className="rcl-corner rcl-corner--br">SECURED · PSU PASSPORT</span>

      <div className="rcl-slip">
        <div className="rcl-logo"><img src={getPath("/images/logo/09_FMS_Short_EN_V_PNG.png")} alt="FMS PSU" /></div>
        <div className="rcl-eyebrow">✶ PSU AUTHENTICATION ✶</div>
        <h1 className="rcl-title">PSU PASSPORT</h1>
        <div className="rcl-rule" aria-hidden="true" />
        <p className="rcl-deck">ระบบยืนยันตัวตนสำหรับนักศึกษา<br />มหาวิทยาลัยสงขลานครินทร์</p>

        {error && <div className="rcl-error"><AlertCircle size={15} strokeWidth={2} /> {error}</div>}

        <button type="button" className="rcl-btn rcl-btn--primary" onClick={onLogin} disabled={loading}>
          {loading ? <><Loader2 className="rcl-spin" size={18} /> กำลังเชื่อมต่อระบบ…</> : <><LogIn size={18} strokeWidth={2} /> เข้าสู่ระบบด้วย PSU Passport</>}
        </button>
        <p className="rcl-hint">ระบบจะนำท่านไปยังหน้ายืนยันตัวตนของมหาวิทยาลัย</p>

        {showMock && (
          <div className="rcl-mock">
            <div className="rcl-mock__lbl"><FlaskConical size={13} strokeWidth={2} /> DEV ONLY — MOCK LOGIN</div>
            <input type="text" className="rcl-input" value={mockStudentId} onChange={(e) => setMockStudentId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onMockLogin()} placeholder="e.g. 6610510149" disabled={mockLoading} />
            <button type="button" className="rcl-btn rcl-btn--ghost" onClick={onMockLogin} disabled={mockLoading || !mockStudentId.trim()}>
              {mockLoading ? <><Loader2 className="rcl-spin" size={16} /> กำลังเข้าสู่ระบบ…</> : <><FlaskConical size={15} strokeWidth={2} /> Mock Login</>}
            </button>
          </div>
        )}

        <div className="rcl-foot">
          <button type="button" className="rcl-btn rcl-btn--ghost" onClick={onBack}><ArrowLeft size={15} strokeWidth={2} /> กลับหน้าหลัก</button>
          <button type="button" className="rcl-admin" onClick={onAdmin}>FMS ELECTION SYSTEM</button>
        </div>
      </div>

      <style jsx global>{`
        html, body { color-scheme:light; }
        .rcl-root { min-height:100vh; position:relative; display:grid; place-items:center;
          padding:32px 20px; background:var(--rc-desk); color:var(--rc-ink); font-family:var(--rc-fh); }
        .rcl-root * { box-sizing:border-box; }

        .rcl-corner { position:absolute; font-family:var(--rc-fm); font-size:10px; letter-spacing:.22em;
          text-transform:uppercase; color:var(--rc-faint); }
        .rcl-corner--tl { top:24px; left:28px; }
        .rcl-corner--br { bottom:24px; right:28px; }

        /* the slip: receipt paper with the family's die-cut top edge */
        .rcl-slip { position:relative; width:100%; max-width:420px; background:var(--rc-receipt);
          border:1px solid var(--rc-stamp-line); padding:46px 34px 38px; text-align:center;
          box-shadow:2px 26px 54px -28px color-mix(in srgb, var(--rc-ink) 45%, transparent); }
        .rcl-slip::before { content:""; position:absolute; left:0; right:0; top:-8px; height:8px;
          background:repeating-linear-gradient(90deg, var(--rc-receipt) 0 9px, transparent 9px 18px);
          -webkit-mask:radial-gradient(circle 5px at 9px 0, transparent 98%, #000) repeat-x 0 0/18px 8px;
          mask:radial-gradient(circle 5px at 9px 0, transparent 98%, #000) repeat-x 0 0/18px 8px; }
        .rcl-logo { display:inline-flex; align-items:center; justify-content:center; padding:12px 18px;
          background:var(--rc-desk); box-shadow:inset 0 0 0 1px var(--rc-line); margin:0 auto 18px; }
        .rcl-logo img { height:58px; width:auto; object-fit:contain; display:block; }
        .rcl-eyebrow { font-family:var(--rc-fm); font-size:10px; letter-spacing:.24em; text-transform:uppercase;
          color:var(--rc-ink2); margin-bottom:10px; }
        .rcl-title { font-family:var(--rc-fm); font-weight:700; font-size:26px; letter-spacing:.14em;
          line-height:1.1; margin:0; color:var(--rc-ink); }
        .rcl-rule { margin:16px 0 14px; height:2px;
          background:repeating-linear-gradient(90deg, var(--rc-stamp-line) 0 5px, transparent 5px 10px); }
        .rcl-deck { font-size:14px; color:var(--rc-ink2); line-height:1.6; margin:0 0 24px; }

        .rcl-error { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:18px;
          background:color-mix(in srgb, var(--rc-accent) 10%, var(--rc-receipt));
          border:1px solid var(--rc-accent); color:var(--rc-accent-deep); padding:11px 14px; font-size:13px; }

        /* buttons are ticket stubs — cut corner + a left perforation, the family's
           own control language (same as the results/home CTAs) */
        .rcl-btn { position:relative; width:100%; display:inline-flex; align-items:center; justify-content:center;
          gap:10px; min-height:50px; padding:13px 20px 13px 28px; cursor:pointer; font-family:var(--rc-fh);
          font-weight:600; font-size:15px; border:1.5px solid transparent;
          clip-path:polygon(9px 0, 100% 0, 100% 100%, 0 100%, 0 9px);
          transition:transform .18s ease, background .2s ease, color .2s ease, border-color .2s ease; }
        .rcl-btn::before { content:""; position:absolute; left:7px; top:10px; bottom:10px; width:2px;
          background:repeating-linear-gradient(180deg, currentColor 0 2px, transparent 2px 5px); opacity:.5; }
        .rcl-btn:disabled { opacity:.5; cursor:not-allowed; }
        .rcl-btn--primary { background:var(--rc-accent); color:var(--rc-on-accent); border-color:var(--rc-accent); }
        .rcl-btn--primary:not(:disabled):hover { background:var(--rc-accent-deep); border-color:var(--rc-accent-deep); transform:translateY(-2px); }
        .rcl-btn--ghost { background:var(--rc-receipt); color:var(--rc-ink); border-color:var(--rc-ink); }
        .rcl-btn--ghost:not(:disabled):hover { color:var(--rc-accent-deep); border-color:var(--rc-accent-deep); transform:translateY(-2px); }
        .rcl-hint { margin:13px 0 0; font-family:var(--rc-fm); font-size:10px; letter-spacing:.06em; color:var(--rc-ink2); }

        .rcl-mock { margin-top:24px; padding-top:20px; border-top:1px dashed var(--rc-stamp-line);
          display:flex; flex-direction:column; gap:10px; }
        .rcl-mock__lbl { display:flex; align-items:center; justify-content:center; gap:7px; font-family:var(--rc-fm);
          font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--rc-accent-deep); margin-bottom:4px; }
        .rcl-input { width:100%; padding:13px 16px; border:1px solid var(--rc-stamp-line); background:var(--rc-desk);
          color:var(--rc-ink); font-family:var(--rc-fm); font-size:14px; text-align:center; letter-spacing:.08em; }
        .rcl-input::placeholder { color:var(--rc-faint); letter-spacing:.04em; }
        .rcl-input:focus { outline:none; border-color:var(--rc-accent); }

        .rcl-foot { margin-top:26px; padding-top:20px; border-top:1px solid var(--rc-line);
          display:flex; flex-direction:column; gap:13px; align-items:center; }
        .rcl-admin { background:none; border:0; cursor:pointer; font-family:var(--rc-fm); font-size:10px;
          letter-spacing:.16em; text-transform:uppercase; color:var(--rc-ink2); transition:color .2s; }
        .rcl-admin:hover { color:var(--rc-accent-deep); }
        .rcl-spin { animation:rclSpin 1s linear infinite; }
        @keyframes rclSpin { to { transform:rotate(360deg); } }

        /* phones — after the base rules so equal-specificity overrides win */
        @media (max-width:560px) {
          .rcl-corner { display:none; }
          .rcl-root { padding:24px 16px; }
          .rcl-slip { padding:36px 22px 30px; }
          .rcl-logo img { height:50px; }
          .rcl-title { font-size:22px; letter-spacing:.1em; }
        }
      `}</style>
    </div>
  );
}
