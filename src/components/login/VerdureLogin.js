"use client";

// VerdureLogin — PSU-Passport login/landing in the Verdure voice (cream paper,
// moss "S" disc, terracotta accent, DM Serif). Pre-auth, so no dock — a centred
// editorial card on the cream canvas. Presentational only; auth lives in
// app/login/page.js and arrives as props (every template login shares one path).

import { getPath } from "../../utils/basePath";
import { Loader2, AlertCircle, LogIn, FlaskConical, ArrowLeft } from "lucide-react";

export default function VerdureLogin({
  error, loading, onLogin, showMock = false, mockStudentId, setMockStudentId, mockLoading, onMockLogin, onBack, onAdmin,
}) {
  return (
    <div className="vdl-root">
      <span className="vdl-corner vdl-corner--tl">FMS ELECTION · SAMO</span>
      <span className="vdl-corner vdl-corner--br">SECURED · PSU PASSPORT</span>

      <div className="vdl-card">
        <div className="vdl-logo"><img src={getPath("/images/logo/09_FMS_Short_EN_V_PNG.png")} alt="FMS PSU" /></div>
        <div className="vdl-eyebrow"><span className="dot" /> PSU AUTHENTICATION</div>
        <h1 className="vdl-title">PSU <em>Passport.</em></h1>
        <p className="vdl-deck">ระบบยืนยันตัวตนสำหรับนักศึกษา<br />มหาวิทยาลัยสงขลานครินทร์</p>

        {error && <div className="vdl-error"><AlertCircle size={15} strokeWidth={2} /> {error}</div>}

        <button type="button" className="vdl-btn vdl-btn--terra" onClick={onLogin} disabled={loading}>
          {loading ? <><Loader2 className="vdl-spin" size={18} /> กำลังเชื่อมต่อระบบ…</> : <><LogIn size={18} strokeWidth={2} /> เข้าสู่ระบบด้วย PSU Passport</>}
        </button>
        <p className="vdl-hint">ระบบจะนำท่านไปยังหน้ายืนยันตัวตนของมหาวิทยาลัย</p>

        {showMock && (
          <div className="vdl-mock">
            <div className="vdl-mock__lbl"><FlaskConical size={13} strokeWidth={2} /> DEV ONLY — MOCK LOGIN</div>
            <input type="text" className="vdl-input" value={mockStudentId} onChange={(e) => setMockStudentId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onMockLogin()} placeholder="e.g. 6610510149" disabled={mockLoading} />
            <button type="button" className="vdl-btn vdl-btn--ghost" onClick={onMockLogin} disabled={mockLoading || !mockStudentId.trim()}>
              {mockLoading ? <><Loader2 className="vdl-spin" size={16} /> กำลังเข้าสู่ระบบ…</> : <><FlaskConical size={15} strokeWidth={2} /> Mock Login</>}
            </button>
          </div>
        )}

        <div className="vdl-foot">
          <button type="button" className="vdl-btn vdl-btn--ghost" onClick={onBack}><ArrowLeft size={15} strokeWidth={2} /> กลับหน้าหลัก</button>
          <button type="button" className="vdl-admin" onClick={onAdmin}>FMS ELECTION SYSTEM</button>
        </div>
      </div>

      <style jsx global>{`
        html, body { background:#F4ECDB; color-scheme:light; }
        .vdl-root {
          --moss:#1F3A2C; --cream:#F4ECDB; --cream-2:#FAF4E4; --cream-3:#E6DCC5; --terra:#BC5E3E; --terra-2:#A24E32; --rule:#D4C9AC;
          --fd:var(--font-dm-serif),'DM Serif Display',Georgia,serif; --fs:var(--font-manrope),system-ui,sans-serif;
          --ft:var(--font-plex-thai),'IBM Plex Sans Thai',sans-serif; --fm:var(--font-space-mono),monospace;
          min-height:100vh; position:relative; display:grid; place-items:center; padding:32px 20px; background:var(--cream); color:var(--moss); font-family:var(--ft);
          background-image:radial-gradient(circle at 14% 16%, rgba(188,94,62,.05) 0, transparent 32%), radial-gradient(circle at 86% 84%, rgba(210,162,72,.05) 0, transparent 32%);
        }
        .vdl-root * { box-sizing:border-box; }
        .vdl-corner { position:absolute; font-family:var(--fm); font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:var(--moss); opacity:.5; }
        .vdl-corner--tl { top:24px; left:28px; }
        .vdl-corner--br { bottom:24px; right:28px; }
        @media (max-width:560px) { .vdl-corner { display:none; } }

        .vdl-card { width:100%; max-width:440px; background:var(--cream-2); border:1px solid var(--rule); border-radius:28px; padding:44px 36px; text-align:center; box-shadow:0 40px 80px -30px rgba(31,58,44,.3); }
        .vdl-logo { display:inline-flex; align-items:center; justify-content:center; padding:14px 20px; border-radius:18px; background:var(--cream); box-shadow:inset 0 0 0 1px rgba(31,58,44,.08); margin:0 auto 20px; }
        .vdl-logo img { height:62px; width:auto; object-fit:contain; display:block; }
        .vdl-eyebrow { font-family:var(--fm); font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--moss); opacity:.6; display:flex; align-items:center; justify-content:center; gap:9px; margin-bottom:14px; }
        .vdl-eyebrow .dot { width:7px; height:7px; border-radius:50%; background:var(--terra); }
        .vdl-title { font-family:var(--fd); font-style:italic; font-weight:400; font-size:40px; letter-spacing:-.02em; line-height:1; margin:0 0 12px; color:var(--moss); }
        .vdl-title em { color:var(--terra); }
        .vdl-deck { font-family:var(--ft); font-size:14px; color:var(--moss); opacity:.7; line-height:1.6; margin:0 0 26px; }

        .vdl-error { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:18px; background:rgba(188,94,62,.1); border:1px solid rgba(188,94,62,.35); color:var(--terra-2); border-radius:14px; padding:11px 14px; font-size:13px; }

        .vdl-btn { width:100%; display:inline-flex; align-items:center; justify-content:center; gap:10px; border-radius:999px; cursor:pointer; font-family:var(--fs); font-weight:600; font-size:15px; padding:16px 22px; border:1px solid transparent; transition:all .25s; }
        .vdl-btn:disabled { opacity:.6; cursor:not-allowed; }
        .vdl-btn--terra { background:var(--terra); color:var(--cream); border-color:var(--terra); }
        .vdl-btn--terra:not(:disabled):hover { background:var(--moss); border-color:var(--moss); transform:translateY(-1px); }
        .vdl-btn--ghost { background:transparent; color:var(--moss); border-color:var(--rule); }
        .vdl-btn--ghost:not(:disabled):hover { background:var(--moss); color:var(--cream); border-color:var(--moss); }
        .vdl-hint { margin:14px 0 0; font-family:var(--fm); font-size:10px; letter-spacing:.06em; color:var(--moss); opacity:.55; }

        .vdl-mock { margin-top:26px; padding-top:22px; border-top:1px dashed var(--rule); display:flex; flex-direction:column; gap:10px; }
        .vdl-mock__lbl { display:flex; align-items:center; justify-content:center; gap:7px; font-family:var(--fm); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--terra); margin-bottom:4px; }
        .vdl-input { width:100%; padding:13px 16px; border-radius:14px; border:1px solid var(--rule); background:var(--cream); color:var(--moss); font-family:var(--fs); font-size:14px; text-align:center; }
        .vdl-input::placeholder { color:var(--moss); opacity:.4; }
        .vdl-input:focus { outline:none; border-color:var(--terra); }

        .vdl-foot { margin-top:28px; padding-top:22px; border-top:1px solid var(--rule); display:flex; flex-direction:column; gap:14px; align-items:center; }
        .vdl-admin { background:none; border:0; cursor:pointer; font-family:var(--fm); font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--moss); opacity:.5; transition:color .2s, opacity .2s; }
        .vdl-admin:hover { color:var(--terra); opacity:1; }
        .vdl-spin { animation:vdlSpin 1s linear infinite; }
        @keyframes vdlSpin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
