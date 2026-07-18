"use client";

// StudioDarkLogin — the PSU-Passport login/landing in the Studio Dark v2 voice
// (warm-dark canvas, lime accent, hairlines, Inter/Instrument-Serif/JetBrains).
// Pre-auth, so NO left rail — a centered card on the dark canvas instead.
//
// Presentational only: all auth actions + state live in app/login/page.js and
// arrive as props, so the three template logins share one logic path.

import { Loader2, AlertCircle, LogIn, ShieldCheck, FlaskConical, ArrowLeft } from "lucide-react";
import { StudioDarkBaseStyles } from "../home/StudioDarkTheme";

export default function StudioDarkLogin({
  error,
  loading,
  onLogin,
  showMock = false,
  mockStudentId,
  setMockStudentId,
  mockLoading,
  onMockLogin,
  onBack,
  onAdmin,
}) {
  return (
    <div className="sdl-root">
      <StudioDarkBaseStyles />
      <span className="sdl-corner sdl-corner--tl">FMS ELECTION · SAMO</span>
      <span className="sdl-corner sdl-corner--br">SECURED · PSU PASSPORT</span>

      <main className="sdl-main">
        <div className="sdl-card">
          <div className="sdl-head">
            <span className="sdl-shield"><ShieldCheck size={26} strokeWidth={1.6} /></span>
            <div className="sdl-eyebrow"><span className="sdl-dot" /> PSU AUTHENTICATION</div>
            <h1 className="sdl-title">PSU <em>Passport.</em></h1>
            <p className="sdl-deck">ระบบยืนยันตัวตนสำหรับนักศึกษา<br />มหาวิทยาลัยสงขลานครินทร์</p>
          </div>

          {error && (
            <div className="sdl-error"><AlertCircle size={15} strokeWidth={2} /> {error}</div>
          )}

          <button type="button" className="sdl-btn sdl-btn--accent" onClick={onLogin} disabled={loading}>
            {loading
              ? <><Loader2 className="sdl-spin" size={18} /> กำลังเชื่อมต่อระบบ…</>
              : <><LogIn size={18} strokeWidth={2} /> เข้าสู่ระบบด้วย PSU Passport</>}
          </button>
          <p className="sdl-hint">ระบบจะนำท่านไปยังหน้ายืนยันตัวตนของมหาวิทยาลัย</p>

          {showMock && (
            <div className="sdl-mock">
              <div className="sdl-mock__lbl"><FlaskConical size={13} strokeWidth={2} /> DEV ONLY — MOCK LOGIN</div>
              <input
                type="text"
                className="sdl-input"
                value={mockStudentId}
                onChange={(e) => setMockStudentId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onMockLogin()}
                placeholder="e.g. 6610510149"
                disabled={mockLoading}
              />
              <button type="button" className="sdl-btn sdl-btn--mock" onClick={onMockLogin} disabled={mockLoading || !mockStudentId.trim()}>
                {mockLoading
                  ? <><Loader2 className="sdl-spin" size={16} /> กำลังเข้าสู่ระบบ…</>
                  : <><FlaskConical size={15} strokeWidth={2} /> Mock Login</>}
              </button>
            </div>
          )}

          <div className="sdl-foot">
            <button type="button" className="sdl-btn sdl-btn--ghost" onClick={onBack}>
              <ArrowLeft size={15} strokeWidth={2} /> กลับหน้าหลัก
            </button>
            <button type="button" className="sdl-admin" onClick={onAdmin}>FMS ELECTION SYSTEM</button>
          </div>
        </div>
      </main>

      <style jsx global>{`
        html, body { background:var(--sd-bg, #14140F); color-scheme:dark; }
        .sdl-root {
          --sd-bg:#14140F; --sd-bg-2:#1B1B14; --sd-line:#2E2E22; --sd-line-strong:#3E3E2D;
          --sd-ink:#F2EDDF; --sd-ink-2:#B5B0A2; --sd-ink-3:#7F7A6E; --sd-accent:#D5FF3F;
          --sd-sans:var(--font-studio-sans),'Inter',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --sd-serif:var(--font-instrument-serif),'Instrument Serif','Times New Roman',serif;
          --sd-mono:var(--font-studio-mono),'JetBrains Mono',ui-monospace,monospace;
          min-height:100vh; position:relative; display:grid; place-items:center; padding:32px 20px;
          background:
            radial-gradient(ellipse 70% 45% at 50% 0%, rgba(213,255,63,.05), transparent 60%),
            radial-gradient(circle, rgba(242,237,223,.04) 1px, transparent 1px) 0 0 / 30px 30px,
            var(--sd-bg);
          color:var(--sd-ink); font-family:var(--sd-sans);
        }
        .sdl-root * { box-sizing:border-box; }
        .sdl-corner { position:absolute; font-family:var(--sd-mono); font-size:10px; letter-spacing:.22em; text-transform:uppercase; color:var(--sd-ink-3); }
        .sdl-corner--tl { top:24px; left:28px; }
        .sdl-corner--br { bottom:24px; right:28px; }
        @media (max-width:560px) { .sdl-corner { display:none; } }

        .sdl-main { width:100%; display:flex; justify-content:center; }
        .sdl-card {
          width:100%; max-width:420px; background:var(--sd-bg-2); border:1px solid var(--sd-line-strong);
          border-radius:24px; padding:40px 34px; text-align:center;
        }
        .sdl-head { margin-bottom:26px; display:flex; flex-direction:column; align-items:center; }
        .sdl-shield {
          width:60px; height:60px; display:grid; place-items:center; border-radius:18px;
          border:1px solid var(--sd-line-strong); background:var(--sd-bg); color:var(--sd-accent); margin-bottom:18px;
        }
        .sdl-eyebrow { font-family:var(--sd-mono); font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--sd-ink-2); display:flex; align-items:center; gap:9px; margin-bottom:14px; }
        .sdl-dot { width:7px; height:7px; border-radius:999px; background:var(--sd-accent); }
        .sdl-title { font-family:var(--sd-sans); font-weight:400; font-size:38px; letter-spacing:-.03em; line-height:1; margin:0 0 12px; }
        .sdl-title em { font-family:var(--sd-serif); font-style:italic; color:var(--sd-accent); }
        .sdl-deck { font-size:14px; color:var(--sd-ink-2); line-height:1.6; margin:0; font-weight:300; }

        .sdl-error {
          display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:18px;
          background:rgba(255,90,90,.08); border:1px solid rgba(255,90,90,.3); color:#FF9B9B;
          border-radius:12px; padding:11px 14px; font-size:13px;
        }

        .sdl-btn {
          width:100%; display:inline-flex; align-items:center; justify-content:center; gap:10px;
          border-radius:999px; cursor:pointer; font-family:var(--sd-sans); font-weight:500; font-size:15px;
          padding:15px 22px; border:1px solid transparent; transition:background .2s, color .2s, border-color .2s, transform .2s;
        }
        .sdl-btn:disabled { opacity:.6; cursor:not-allowed; }
        .sdl-btn--accent { background:var(--sd-accent); color:var(--sd-bg); border-color:var(--sd-accent); font-weight:600; }
        .sdl-btn--accent:not(:disabled):hover { background:var(--sd-ink); border-color:var(--sd-ink); transform:translateY(-1px); }
        .sdl-hint { margin:14px 0 0; font-family:var(--sd-mono); font-size:10px; letter-spacing:.06em; color:var(--sd-ink-3); }

        .sdl-mock { margin-top:26px; padding-top:22px; border-top:1px dashed var(--sd-line-strong); display:flex; flex-direction:column; gap:10px; }
        .sdl-mock__lbl { display:flex; align-items:center; justify-content:center; gap:7px; font-family:var(--sd-mono); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--sd-accent); margin-bottom:4px; }
        .sdl-input {
          width:100%; padding:12px 16px; border-radius:12px; border:1px solid var(--sd-line-strong);
          background:var(--sd-bg); color:var(--sd-ink); font-family:var(--sd-sans); font-size:14px; text-align:center;
          transition:border-color .2s;
        }
        .sdl-input::placeholder { color:var(--sd-ink-3); }
        .sdl-input:focus { outline:none; border-color:var(--sd-accent); }
        .sdl-btn--mock { background:transparent; color:var(--sd-ink); border-color:var(--sd-line-strong); font-size:14px; padding:12px 18px; }
        .sdl-btn--mock:not(:disabled):hover { background:var(--sd-accent); color:var(--sd-bg); border-color:var(--sd-accent); }

        .sdl-foot { margin-top:30px; padding-top:24px; border-top:1px solid var(--sd-line); display:flex; flex-direction:column; gap:16px; align-items:center; }
        .sdl-btn--ghost { background:transparent; color:var(--sd-ink-2); border-color:var(--sd-line-strong); font-size:13px; padding:11px 18px; }
        .sdl-btn--ghost:hover { color:var(--sd-ink); border-color:var(--sd-ink-3); }
        .sdl-admin { background:none; border:0; cursor:pointer; font-family:var(--sd-mono); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--sd-ink-4, #555142); transition:color .2s; }
        .sdl-admin:hover { color:var(--sd-accent); }

        .sdl-spin { animation:sdlSpin 1s linear infinite; }
        @keyframes sdlSpin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
