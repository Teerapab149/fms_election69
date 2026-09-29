"use client";

// BallotLogin — the sign-in page of the ballot-official family. Same props as
// every family's login component (app/login/page.js holds the logic).
//
// A voter who taps "เข้าสู่ระบบ" on this design and lands on a different one has,
// for a moment, no way to tell whether they are still on the faculty's site —
// on an election system that moment is where phishing suspicion lives. So this
// page keeps the family's header (faculty logo) and board, and shows where
// signing in sits in the three steps the home page already told them about.
//
// The mock-login form renders only when the server registered the mock provider
// (`showMock`) — a dev seam, never reachable on a real deployment.

import { MotionConfig } from "framer-motion"; // Motion for React
import { Loader2, AlertCircle } from "lucide-react";
import { useGlobalConfig } from "../../../../contexts/GlobalConfigContext";
import { ballotOfficialTemplate } from "../../../admin/editor/templates/builtIn/ballot-official";
import { ballotMeta, BallotHeader, BallotFooter, BallotBaseStyles } from "./BallotChrome";

export default function BallotLogin({
  error, loading, onLogin, showMock = false, mockStudentId, setMockStudentId,
  mockLoading, onMockLogin, onBack, onAdmin,
}) {
  const meta = ballotMeta(useGlobalConfig() || {});
  const k = ballotOfficialTemplate.copy.login;

  return (
    <MotionConfig reducedMotion="user">
      <div className="fms-app bo-root">
        <BallotBaseStyles />
        <BallotHeader minimal />

        <main className="bl">
          <div className="bl__card">
            <ol className="bl__steps" aria-label={k.stepsLabel}>
              {k.steps.map((s, i) => (
                <li key={s} className={i === 0 ? "is-now" : ""} aria-current={i === 0 ? "step" : undefined}>
                  <span className="bl__n">{i + 1}</span>
                  <span className="bl__s">{s}</span>
                </li>
              ))}
            </ol>

            <p className="bl__ctx">{meta.wordmark} {meta.campaign}</p>
            <h1 className="bl__title">{k.title}</h1>
            <p className="bl__lede">{k.lede}</p>

            {error && (
              <p className="bl__err" role="alert"><AlertCircle size={16} aria-hidden /> {error}</p>
            )}

            <button type="button" className="bo-cta bl__go" onClick={onLogin} disabled={loading}>
              {loading ? <><Loader2 size={18} className="bl__spin" aria-hidden /> {k.going}</> : k.go}
            </button>

            {showMock && (
              <div className="bl__mock">
                <span className="bl__mock-h">{k.mock}</span>
                <div className="bl__mock-row">
                  <input type="text" value={mockStudentId} onChange={(e) => setMockStudentId(e.target.value)}
                    placeholder={k.mockId} aria-label={k.mockId} />
                  <button type="button" onClick={onMockLogin} disabled={mockLoading}>
                    {mockLoading ? <Loader2 size={16} className="bl__spin" aria-hidden /> : k.mockGo}
                  </button>
                </div>
              </div>
            )}

            <div className="bl__links">
              <button type="button" onClick={onBack}>{k.back}</button>
              {onAdmin && <button type="button" onClick={onAdmin}>{k.admin}</button>}
            </div>
          </div>
        </main>

        <BallotFooter meta={meta} />

        <style jsx global>{`
          .bl { display: grid; place-items: center; padding: 40px 20px 72px; }
          .bl__card {
            width: 100%; max-width: 520px; background: var(--bo-paper); border-radius: 8px; padding: 30px 36px 28px;
            box-shadow: 0 1px 0 var(--bo-rule), 0 30px 60px -40px rgba(var(--bo-shade-rgb),.45);
          }
          /* the three steps: this page is the first */
          .bl__steps { list-style: none; margin: 0 0 28px; padding: 0 0 22px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; border-bottom: 2px dashed var(--bo-rule); }
          .bl__steps li { display: flex; flex-direction: column; gap: 6px; color: var(--bo-muted); }
          .bl__n { width: 30px; height: 30px; display: grid; place-items: center; border: 2px solid var(--bo-rule); border-radius: 3px; font-weight: 800; font-size: 15px; }
          .bl__s { font-size: 13.5px; font-weight: 600; line-height: 1.4; }
          .bl__steps li.is-now { color: var(--bo-plum); }
          .bl__steps li.is-now .bl__n { background: var(--bo-plum); border-color: var(--bo-plum); color: #fff; }
          .bl__ctx { margin: 0; font-size: 14px; color: var(--bo-muted); }
          .bl__title { margin: 6px 0 0; font-size: 28px; font-weight: 800; line-height: 1.3; letter-spacing: -.01em; }
          .bl__lede { margin: 10px 0 0; font-size: 16px; line-height: 1.7; color: var(--bo-muted); }
          .bl__err {
            display: flex; align-items: center; gap: 8px; margin: 18px 0 0; padding: 11px 14px; border-radius: 8px;
            background: #FDF2F2; border: 1px solid #F0CFCF; color: #8E2B2B; font-size: 14px;
          }
          .bl__go { margin-top: 24px; gap: 10px; }
          .bl__spin { animation: blSpin 1s linear infinite; }
          @keyframes blSpin { to { transform: rotate(360deg); } }
          .bl__mock { margin-top: 22px; padding-top: 18px; border-top: 1px dashed var(--bo-rule); }
          .bl__mock-h { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: var(--bo-muted); }
          .bl__mock-row { display: flex; gap: 8px; }
          .bl__mock-row input { flex: 1; min-width: 0; padding: 11px 13px; border-radius: 8px; border: 1px solid var(--bo-rule); background: var(--bo-board); font: inherit; font-size: 15px; color: var(--bo-ink); }
          .bl__mock-row button { padding: 0 16px; border-radius: 8px; border: 1.5px solid var(--bo-plum); background: var(--bo-paper); color: var(--bo-plum); font-weight: 700; }
          .bl__links { display: flex; justify-content: center; gap: 22px; margin-top: 24px; }
          .bl__links button { background: none; border: 0; padding: 0; font-size: 14.5px; font-weight: 500; color: var(--bo-muted); }
          .bl__links button:hover { color: var(--bo-plum); }
          @media (max-width: 640px) {
            .bl { padding: 20px 12px 48px; place-items: start center; }
            .bl__card { padding: 22px 20px 22px; }
            .bl__steps { margin-bottom: 22px; padding-bottom: 18px; }
            .bl__s { font-size: 12px; }
            .bl__title { font-size: 23px; }
            .bl__lede { font-size: 14.5px; }
          }
        `}</style>
      </div>
    </MotionConfig>
  );
}
