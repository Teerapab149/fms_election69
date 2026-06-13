"use client";

// GumroadLogin — the PSU-Passport login in the gumroad "Active Pulse" voice
// (cream canvas, chunky 2.5px ink borders + hard shadows, lime/pink pops,
// Archivo Black / Anuphan / Space Grotesk). Presentational; auth state + actions
// arrive as props from app/login/page.js (shared with the other template logins).

import { Loader2, AlertCircle, LogIn, ShieldCheck, FlaskConical, ArrowLeft } from "lucide-react";

export default function GumroadLogin({
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
    <div className="grl-root">
      <main className="grl-main">
        <div className="grl-card">
          <div className="grl-head">
            <span className="grl-shield"><ShieldCheck size={26} strokeWidth={2} /></span>
            <span className="grl-sticker">★ PSU AUTHENTICATION</span>
            <h1 className="grl-title">PSU PASSPORT</h1>
            <p className="grl-deck">ระบบยืนยันตัวตนสำหรับนักศึกษา<br />มหาวิทยาลัยสงขลานครินทร์</p>
          </div>

          {error && (
            <div className="grl-error"><AlertCircle size={15} strokeWidth={2.5} /> {error}</div>
          )}

          <button type="button" className="grl-btn grl-btn--primary" onClick={onLogin} disabled={loading}>
            {loading
              ? <><Loader2 className="grl-spin" size={18} /> กำลังเชื่อมต่อระบบ…</>
              : <><LogIn size={18} strokeWidth={2.5} /> เข้าสู่ระบบด้วย PSU Passport</>}
          </button>
          <p className="grl-hint">ระบบจะนำท่านไปยังหน้ายืนยันตัวตนของมหาวิทยาลัย</p>

          {showMock && (
            <div className="grl-mock">
              <div className="grl-mock__lbl"><FlaskConical size={14} strokeWidth={2.5} /> DEV ONLY — MOCK LOGIN</div>
              <input
                type="text"
                className="grl-input"
                value={mockStudentId}
                onChange={(e) => setMockStudentId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onMockLogin()}
                placeholder="e.g. 6610510149"
                disabled={mockLoading}
              />
              <button type="button" className="grl-btn grl-btn--mock" onClick={onMockLogin} disabled={mockLoading || !mockStudentId.trim()}>
                {mockLoading
                  ? <><Loader2 className="grl-spin" size={16} /> กำลังเข้าสู่ระบบ…</>
                  : <><FlaskConical size={15} strokeWidth={2.5} /> Mock Login</>}
              </button>
            </div>
          )}

          <div className="grl-foot">
            <button type="button" className="grl-btn grl-btn--ghost" onClick={onBack}>
              <ArrowLeft size={15} strokeWidth={2.5} /> กลับหน้าหลัก
            </button>
            <button type="button" className="grl-admin" onClick={onAdmin}>FMS ELECTION SYSTEM</button>
          </div>
        </div>
      </main>

      <style jsx global>{`
        html, body { background:#FFF6EC; color-scheme:light; }
        .grl-root {
          --ink:#26271c; --ink2:#5c5a4b; --cream:#FFF6EC; --paper:#FFFDFA;
          --pink:#FF9CE9; --lime:#C2F47E; --coral:#FF8A8A;
          --fd:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --fb:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif;
          --fm:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace;
          min-height:100vh; display:grid; place-items:center; padding:32px 20px; color:var(--ink);
          font-family:var(--fb);
          background:var(--cream)
            radial-gradient(circle at 12% 14%, #FFD1F2 0, transparent 38%),
            radial-gradient(circle at 88% 86%, #DCF2FF 0, transparent 40%);
          background-blend-mode:normal;
        }
        .grl-root * { box-sizing:border-box; }
        .grl-main { width:100%; display:flex; justify-content:center; }
        .grl-card {
          width:100%; max-width:420px; background:var(--paper); border:2.5px solid var(--ink);
          border-radius:26px; padding:40px 34px; text-align:center; box-shadow:8px 8px 0 var(--ink);
        }
        .grl-head { margin-bottom:24px; display:flex; flex-direction:column; align-items:center; }
        .grl-shield {
          width:60px; height:60px; display:grid; place-items:center; border-radius:18px;
          border:2.5px solid var(--ink); background:var(--lime); color:var(--ink); box-shadow:4px 4px 0 var(--ink); margin-bottom:18px;
        }
        .grl-sticker {
          display:inline-block; font-family:var(--fb); font-weight:700; font-size:12px; letter-spacing:.06em;
          background:var(--pink); border:2px solid var(--ink); border-radius:999px; padding:5px 14px; box-shadow:2px 2px 0 var(--ink); margin-bottom:14px;
        }
        .grl-title { font-family:var(--fd); font-size:34px; letter-spacing:-.02em; line-height:1; margin:0 0 12px; }
        .grl-deck { font-family:var(--fb); font-size:14px; color:var(--ink2); line-height:1.6; margin:0; }

        .grl-error {
          display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:18px;
          background:#FFE3E3; border:2px solid var(--ink); color:#C0392B; border-radius:14px; padding:11px 14px; font-size:13px; font-weight:600;
        }

        .grl-btn {
          width:100%; display:inline-flex; align-items:center; justify-content:center; gap:10px;
          border-radius:14px; cursor:pointer; font-family:var(--fb); font-weight:700; font-size:15px;
          padding:15px 22px; border:2.5px solid var(--ink); transition:transform .12s, box-shadow .12s;
        }
        .grl-btn:disabled { opacity:.6; cursor:not-allowed; }
        .grl-btn--primary { background:var(--lime); color:var(--ink); box-shadow:5px 5px 0 var(--ink); }
        .grl-btn--primary:not(:disabled):hover { transform:translate(-1px,-1px); box-shadow:6px 6px 0 var(--ink); }
        .grl-btn--primary:not(:disabled):active { transform:translate(2px,2px); box-shadow:2px 2px 0 var(--ink); }
        .grl-hint { margin:14px 0 0; font-family:var(--fm); font-size:10px; letter-spacing:.04em; color:var(--ink2); }

        .grl-mock { margin-top:24px; padding-top:22px; border-top:2.5px dashed var(--coral); display:flex; flex-direction:column; gap:10px; }
        .grl-mock__lbl { display:flex; align-items:center; justify-content:center; gap:7px; font-family:var(--fb); font-weight:800; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:#E8553B; margin-bottom:4px; }
        .grl-input {
          width:100%; padding:12px 16px; border-radius:12px; border:2px solid var(--ink);
          background:#fff; color:var(--ink); font-family:var(--fb); font-size:14px; text-align:center;
        }
        .grl-input::placeholder { color:#bdb6a6; }
        .grl-input:focus { outline:none; box-shadow:3px 3px 0 var(--ink); }
        .grl-btn--mock { background:#FFB877; color:var(--ink); box-shadow:3px 3px 0 var(--ink); font-size:14px; padding:12px 18px; }
        .grl-btn--mock:not(:disabled):hover { transform:translate(-1px,-1px); box-shadow:4px 4px 0 var(--ink); }

        .grl-foot { margin-top:28px; padding-top:22px; border-top:2px solid #efe6d8; display:flex; flex-direction:column; gap:16px; align-items:center; }
        .grl-btn--ghost { background:#fff; color:var(--ink2); box-shadow:3px 3px 0 var(--ink); font-size:13px; padding:11px 18px; }
        .grl-btn--ghost:hover { transform:translate(-1px,-1px); box-shadow:4px 4px 0 var(--ink); }
        .grl-admin { background:none; border:0; cursor:pointer; font-family:var(--fm); font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:#bdb6a6; transition:color .2s; }
        .grl-admin:hover { color:var(--ink); }

        .grl-spin { animation:grlSpin 1s linear infinite; }
        @keyframes grlSpin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
