"use client";

// FmsOfficialLogin — the sign-in page for the FMS Official template.
//
// Every other family ships its own login because a voter who taps "เข้าสู่ระบบ"
// on one design and lands on another has, for a moment, no way to tell whether
// they are still on the faculty's site. On an election system that moment is
// exactly where phishing suspicion lives, so this page is the most literal
// restatement of the faculty's identity in the whole template: plum plate, PSU
// lockup, one button, nothing else competing.
//
// The mock-login form renders only when the server actually registered the
// mock-login provider (the parent decides via `showMock`) — it is a dev seam and
// must never be reachable on a real deployment.

import { getPath } from "../../utils/basePath";
import { ArrowRight, ArrowLeft, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { fmsMeta, FmsOfficialBaseStyles } from "../home/FmsOfficialChrome";

export default function FmsOfficialLogin({
  error, loading, onLogin, showMock = false, mockStudentId, setMockStudentId,
  mockLoading, onMockLogin, onBack, onAdmin,
}) {
  const globalConfig = useGlobalConfig();
  const meta = fmsMeta(globalConfig);

  return (
    <div className="fms-app fo-root fo-login">
      <FmsOfficialBaseStyles paintBody />

      <div className="fo-utility">
        <div className="fo-utility__in">
          <span className="fo-utility__name fo-utility__name--full">
            {meta.systemName} · {meta.faculty} {meta.university}
          </span>
          <span className="fo-utility__name fo-utility__name--short">
            {meta.systemName} · {meta.faculty}
          </span>
          <span className="fo-utility__right">
            <span className="fo-utility__year">ปีการศึกษา {meta.ay}</span>
          </span>
        </div>
      </div>

      <main className="fo-login__main">
        <div className="fo-login__card">
          <span className="fo-login__logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getPath("/images/logo/FMS_Standard_Logo_PNG.png")} alt="คณะวิทยาการจัดการ มหาวิทยาลัยสงขลานครินทร์" />
          </span>

          <h1 className="fo-login__h1">{meta.systemName}</h1>
          <p className="fo-login__sub">{meta.campaign} ประจำปีการศึกษา {meta.ay}</p>

          {error && (
            <p className="fo-login__err" role="alert">
              <AlertCircle size={16} aria-hidden /> {error}
            </p>
          )}

          <button type="button" className="fo-btn fo-btn--primary fo-login__go" onClick={onLogin} disabled={loading}>
            {loading
              ? <><Loader2 size={18} className="fo-spin" aria-hidden /> กำลังพาไปหน้าเข้าสู่ระบบ…</>
              : <>เข้าสู่ระบบด้วย PSU Passport <ArrowRight size={18} aria-hidden /></>}
          </button>

          <p className="fo-login__note">
            <ShieldCheck size={15} aria-hidden />
            ระบบยืนยันตัวตนผ่านบัญชี PSU Passport ของมหาวิทยาลัย เพื่อตรวจสอบสิทธิ์ลงคะแนนเท่านั้น
          </p>

          {showMock && (
            <div className="fo-login__mock">
              <span className="fo-login__mock-h">โหมดทดสอบ (สำหรับผู้พัฒนา)</span>
              <div className="fo-login__mock-row">
                <input
                  type="text"
                  value={mockStudentId}
                  onChange={(e) => setMockStudentId(e.target.value)}
                  placeholder="รหัสนักศึกษา"
                  aria-label="รหัสนักศึกษาสำหรับโหมดทดสอบ"
                />
                <button type="button" className="fo-btn fo-btn--ghost" onClick={onMockLogin} disabled={mockLoading}>
                  {mockLoading ? <Loader2 size={16} className="fo-spin" aria-hidden /> : "เข้าสู่ระบบ"}
                </button>
              </div>
            </div>
          )}

          <div className="fo-login__links">
            <button type="button" onClick={onBack}><ArrowLeft size={15} aria-hidden /> กลับหน้าแรก</button>
            {onAdmin && <button type="button" onClick={onAdmin}>สำหรับผู้ดูแลระบบ</button>}
          </div>
        </div>
      </main>

      <div className="fo-foot__bar">
        © {meta.facultyShort}@{meta.universityShort} {meta.copyrightYear}. All Rights Reserved.
      </div>

      <style jsx global>{`
        /* The plum field is the whole page here, not a band. A sign-in screen has
           no content to frame, and a full plum plate is the strongest possible
           "you are on the faculty's system" before a password is ever typed. */
        .fo-login { min-height: 100vh; background: var(--fo-plum); }
        .fo-login__main { flex: 1; display: grid; place-items: center; padding: 48px 20px 56px; }
        .fo-login__card {
          width: 100%; max-width: 480px; text-align: center;
          background: var(--fo-surface); border-radius: 16px; padding: 44px 40px 34px;
          box-shadow: 0 30px 70px -40px rgba(0, 0, 0, .6);
        }
        .fo-login__logo { display: block; margin-bottom: 24px; }
        .fo-login__logo img { height: 56px; width: auto; }
        .fo-login__h1 { margin: 0; font-size: 25px; font-weight: 600; color: var(--fo-ink); line-height: 1.3; }
        .fo-login__sub { margin: 8px 0 0; font-size: 14px; font-weight: 300; line-height: 1.6; color: var(--fo-muted); }

        .fo-login__err {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin: 20px 0 0; padding: 11px 14px; border-radius: 8px;
          background: #FDF2F2; border: 1px solid #F0CFCF; color: #8E2B2B;
          font-size: 13.5px; font-weight: 400; text-align: left;
        }

        .fo-login__go { width: 100%; justify-content: center; margin-top: 26px; }
        .fo-login__note {
          display: flex; align-items: flex-start; gap: 8px; margin: 18px 0 0; text-align: left;
          font-size: 12.5px; font-weight: 300; line-height: 1.6; color: var(--fo-muted);
        }
        .fo-login__note svg { flex: 0 0 auto; margin-top: 2px; color: var(--fo-brand-soft); }

        .fo-login__mock { margin-top: 24px; padding-top: 20px; border-top: 1px dashed var(--fo-line); }
        .fo-login__mock-h { display: block; margin-bottom: 10px; font-size: 12px; font-weight: 500; color: var(--fo-brand-soft); }
        .fo-login__mock-row { display: flex; gap: 8px; }
        .fo-login__mock-row input {
          flex: 1; min-width: 0; padding: 12px 14px; border-radius: 8px;
          border: 1px solid var(--fo-line); background: var(--fo-bg);
          font-family: inherit; font-size: 14px; color: var(--fo-ink);
        }
        .fo-login__mock-row input:focus { outline: 2px solid var(--fo-brand); outline-offset: -1px; }
        .fo-login__mock-row .fo-btn { padding: 12px 18px; font-size: 14px; }

        .fo-login__links { display: flex; gap: 18px; justify-content: center; margin-top: 26px; }
        .fo-login__links button {
          display: inline-flex; align-items: center; gap: 6px;
          background: none; border: 0; cursor: pointer; font-family: inherit;
          font-size: 13px; font-weight: 400; color: var(--fo-muted); transition: color .18s;
        }
        .fo-login__links button:hover { color: var(--fo-brand); }

        .fo-spin { animation: fo-spin 1s linear infinite; }
        @keyframes fo-spin { to { transform: rotate(360deg); } }

        @media (max-width: 520px) {
          .fo-login__card { padding: 34px 22px 28px; border-radius: 14px; }
          .fo-login__logo img { height: 46px; }
          .fo-login__h1 { font-size: 21px; }
          .fo-login__mock-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
