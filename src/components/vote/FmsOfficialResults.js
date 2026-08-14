"use client";

// FmsOfficialResults — the count for the FMS Official template.
//
// This is the page the result gets argued over, so it is built as a published
// record rather than a dashboard: every party in one table, sorted by score,
// with the raw count AND the share, plus turnout demographics underneath. No
// pie charts — a pie makes a 2-point gap look decisive and a 20-point gap look
// close, and this is the one screen where the reader must be able to check the
// arithmetic themselves.
//
// Three states, all real:
//   isNotStarted → polls have not opened; nothing to show but the countdown
//   !isRevealed  → votes are in, the count is sealed until the committee opens it
//   revealed     → the record, winner marked

import { useMemo } from "react";
import { BarChart3, Lock, Clock, Trophy } from "lucide-react";
import FmsOfficialShell from "./FmsOfficialShell";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { fmsMeta } from "../home/FmsOfficialChrome";

const fmtInt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n ?? 0);

export default function FmsOfficialResults({
  candidates = [], totalVotes = 0, demographics = {},
  finalStatus = "WAITING", isRevealed = false, isNotStarted = false,
  countdownText = "", editorMode = false,
}) {
  const globalConfig = useGlobalConfig();
  const meta = fmsMeta(globalConfig);

  const totalEligible = demographics?.totalEligible || 0;
  const turnout = totalEligible > 0 ? (totalVotes / totalEligible) * 100 : 0;

  const rows = useMemo(() => {
    const r = [...(candidates || [])];
    if (isRevealed) r.sort((a, b) => (b.score || 0) - (a.score || 0));
    else r.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
    return r;
  }, [candidates, isRevealed]);

  const topScore = isRevealed ? Math.max(0, ...rows.map((c) => c.score || 0)) : 0;
  // A tie has no winner to mark. Marking both rows "ผู้ชนะ" would be a claim the
  // count does not support, so the trophy is withheld until exactly one row leads.
  const leaders = rows.filter((c) => (c.score || 0) === topScore && topScore > 0);
  const winnerId = isRevealed && leaders.length === 1 ? leaders[0].id : null;

  const clean = (arr) => (arr || []).filter((d) => d && d.name != null && String(d.name).trim() !== "");
  const demoGroups = [
    { th: "ชั้นปี", rows: clean(demographics?.byYear) },
    { th: "เพศ", rows: clean(demographics?.byGender) },
    { th: "สาขา", rows: clean(demographics?.byMajor) },
  ].filter((g) => g.rows.length > 0);

  const label = (c) =>
    c.number > 0 ? c.name : c.number === 0 ? "งดออกเสียง" : "ไม่รับรอง";

  return (
    <FmsOfficialShell
      active="results"
      kicker={`${meta.campaign} · ปีการศึกษา ${meta.ay}`}
      title="ผลการลงคะแนน"
      desc={
        isNotStarted ? "ยังไม่เปิดการลงคะแนน ผลจะแสดงที่หน้านี้เมื่อการเลือกตั้งสิ้นสุด"
        : !isRevealed ? "การลงคะแนนดำเนินอยู่ ผลคะแนนจะเปิดเผยเมื่อคณะกรรมการประกาศ"
        : "ผลอย่างเป็นทางการ นับจากบัตรทั้งหมดที่บันทึกในระบบ"
      }
      editorMode={editorMode}
    >
      {isNotStarted ? (
        <div className="fo-notice fo-res__state">
          <div className="fo-notice__body fo-res__state-body">
            <span className="fo-res__ico"><Clock size={22} aria-hidden /></span>
            <b>ยังไม่เปิดการลงคะแนน</b>
            <span className="fo-rule" aria-hidden />
            <p className="fo-note">
              {countdownText ? `เปิดในอีก ${countdownText}` : "ผลจะแสดงที่หน้านี้เมื่อการเลือกตั้งสิ้นสุด"}
            </p>
          </div>
        </div>
      ) : !isRevealed ? (
        /* SEALED — the count is embargoed, the TURNOUT is not.
           This state used to render one sentence in a small card and nothing
           else: 414px of content on a 900px page, with every figure it needed
           already in props. What is actually secret here is the per-party
           tally; how many people voted is public the moment they vote, and the
           home page has been showing it live all along. So the embargo notice
           says what is withheld and why, and the turnout it is safe to publish
           runs underneath as real content. */
        <>
          <div className="fo-notice fo-res__state">
            <div className="fo-notice__body fo-res__state-body">
              <span className="fo-res__ico"><Lock size={22} aria-hidden /></span>
              <b>ผลคะแนนยังไม่เปิดเผย</b>
              <span className="fo-rule" aria-hidden />
              <p className="fo-note">
                คะแนนรายพรรคจะเปิดเผยเมื่อคณะกรรมการประกาศอย่างเป็นทางการ
                ระหว่างนี้แสดงเฉพาะจำนวนผู้ใช้สิทธิ์ ซึ่งไม่บอกว่าใครเลือกอะไร
              </p>
            </div>
          </div>

          <div className="fo-sechead fo-sechead--gap">
            <h2>การใช้สิทธิ์ ณ ขณะนี้</h2>
            <p>ตัวเลขนี้เปิดเผยได้ระหว่างการลงคะแนน — เป็นจำนวนผู้มาใช้สิทธิ์ ไม่ใช่คะแนนของผู้สมัคร</p>
          </div>
          <div className="fo-res__summary">
            <div className="fo-card fo-res__sum">
              <span className="fo-res__sum-lbl">บัตรที่บันทึกแล้ว</span>
              <b className="fo-res__sum-val">{fmtInt(totalVotes)}</b>
              <span className="fo-res__sum-unit">ใบ</span>
            </div>
            <div className="fo-card fo-res__sum">
              <span className="fo-res__sum-lbl">ผู้มีสิทธิ์</span>
              <b className="fo-res__sum-val">{fmtInt(totalEligible)}</b>
              <span className="fo-res__sum-unit">คน</span>
            </div>
            <div className="fo-card fo-res__sum fo-res__sum--pct">
              <span className="fo-res__sum-lbl">สัดส่วนผู้ใช้สิทธิ์</span>
              <b className="fo-res__sum-val">{turnout.toFixed(2)}</b>
              <span className="fo-res__sum-unit">%</span>
              <div className="fo-meter" role="presentation"><i style={{ width: `${Math.min(100, turnout)}%` }} /></div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* REVEALED — the published record. The figures and the tally are one
              document with a tab that says so, because this is the page that
              gets screenshotted and argued over; a dashboard invites doubt where
              a signed notice does not. Demographics stay outside it: they are
              context about who turned up, not part of the result. */}
          <div className="fo-notice fo-res__record">

            <div className="fo-res__summary">
              <div className="fo-res__sum">
                <span className="fo-res__sum-lbl">บัตรทั้งหมด</span>
                <b className="fo-res__sum-val">{fmtInt(totalVotes)}</b>
                <span className="fo-res__sum-unit">ใบ</span>
              </div>
              <div className="fo-res__sum">
                <span className="fo-res__sum-lbl">ผู้มีสิทธิ์</span>
                <b className="fo-res__sum-val">{fmtInt(totalEligible)}</b>
                <span className="fo-res__sum-unit">คน</span>
              </div>
              <div className="fo-res__sum">
                <span className="fo-res__sum-lbl">สัดส่วนผู้ใช้สิทธิ์</span>
                <b className="fo-res__sum-val">{turnout.toFixed(2)}</b>
                <span className="fo-res__sum-unit">%</span>
              </div>
            </div>

            <div className="fo-res__tally">
              <div className="fo-sechead">
                <h2>คะแนนรายพรรค</h2>
                <p>เรียงจากคะแนนมากไปน้อย · สัดส่วนคิดจากบัตรทั้งหมด {fmtInt(totalVotes)} ใบ</p>
              </div>

          <ul className="fo-race">
            {rows.map((c) => {
              const score = c.score || 0;
              const share = totalVotes > 0 ? (score / totalVotes) * 100 : 0;
              return (
                <li key={c.id} className={`fo-race__row ${c.id === winnerId ? "is-winner" : ""}`}>
                  <span className={`fo-race__num ${c.number > 0 ? "" : "is-special"}`}>
                    {c.number > 0 ? c.number : c.number === 0 ? "—" : "✕"}
                  </span>
                  <span className="fo-race__name">
                    {label(c)}
                    {c.id === winnerId && (
                      <span className="fo-race__win"><Trophy size={13} aria-hidden /> ผู้ชนะ</span>
                    )}
                  </span>
                  <span className="fo-race__figs">
                    <b>{fmtInt(score)}</b>
                    <span>{share.toFixed(2)}%</span>
                  </span>
                  {/* the bar is a plain inline width — never an animation; a reader
                      who arrives with motion disabled must still see the shape */}
                  <span className="fo-race__bar"><i style={{ width: `${Math.min(100, share)}%` }} /></span>
                </li>
              );
            })}
              </ul>
            </div>
          </div>

          {demoGroups.length > 0 && (
            <>
              <div className="fo-sechead fo-sechead--gap">
                <h2>ข้อมูลผู้ใช้สิทธิ์</h2>
                <p>สัดส่วนผู้มาใช้สิทธิ์จำแนกตามกลุ่ม ไม่เกี่ยวข้องกับตัวเลือกในบัตร</p>
              </div>
              <div className="fo-demo">
                {demoGroups.map((g) => {
                  const sum = g.rows.reduce((a, r) => a + (r.value || r.count || 0), 0) || 1;
                  return (
                    <div key={g.th} className="fo-card fo-demo__g">
                      <b className="fo-demo__h">{g.th}</b>
                      <ul>
                        {g.rows.map((r) => {
                          const val = r.value || r.count || 0;
                          return (
                            <li key={r.name}>
                              <span className="fo-demo__n">{r.name}</span>
                              <span className="fo-demo__v">{fmtInt(val)}</span>
                              <span className="fo-demo__bar"><i style={{ width: `${(val / sum) * 100}%` }} /></span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      <style jsx global>{`
        .fo-empty { text-align: center; padding: 44px 22px; display: flex; flex-direction: column; align-items: center; }
        .fo-res__ico {
          width: 46px; height: 46px; border-radius: 12px; margin-bottom: 14px;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--fo-tint); color: var(--fo-brand); border: 1px solid var(--fo-line);
        }

        /* the two non-revealed states share the notice; held at reading width so
           a short message does not stretch into a banner */
        .fo-res__state { max-width: 620px; margin: 0 auto; }
        .fo-res__state-body { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .fo-res__state-body b { font-size: clamp(20px, 2.6vw, 26px); font-weight: 600; color: var(--fo-ink); }
        .fo-res__state-body .fo-note { margin: 0; max-width: 440px; line-height: 1.7; }

        .fo-res__summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 34px; }
        .fo-res__sum { display: flex; flex-direction: column; gap: 2px; }
        .fo-res__sum--pct .fo-meter { margin-top: 12px; }

        /* the published record: figures and tally as compartments of one
           document, each divided by the same hairline the rest of the family
           uses. The summary loses its card borders here — inside a document the
           figures are a row, not three floating cards. */
        .fo-res__record .fo-res__summary {
          margin: 0; padding: 24px 26px; gap: 20px;
          border-bottom: 1px solid var(--fo-line);
        }
        .fo-res__record .fo-res__sum { background: none; border: 0; padding: 0; }
        .fo-res__tally { padding: 24px 26px 26px; }
        .fo-res__tally .fo-sechead { margin-bottom: 18px; }
        .fo-res__sum-lbl { font-size: 13px; font-weight: 300; color: var(--fo-muted); }
        .fo-res__sum-val {
          font-size: 34px; font-weight: 600; line-height: 1.15; color: var(--fo-ink);
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
        }
        .fo-res__sum-unit { font-size: 13px; font-weight: 300; color: var(--fo-muted); }

        .fo-sechead--gap { margin-top: 42px; }

        .fo-race { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .fo-race__row {
          display: grid; grid-template-columns: 46px 1fr auto; align-items: center; gap: 16px;
          padding: 16px 20px 18px; border-radius: 12px;
          background: var(--fo-surface); border: 1px solid var(--fo-line);
        }
        .fo-race__row.is-winner { border-color: var(--fo-brand); background: var(--fo-tint); }
        .fo-race__num {
          width: 46px; height: 46px; border-radius: 10px;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--fo-brand); color: #fff; font-size: 21px; font-weight: 600;
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
        }
        .fo-race__num.is-special { background: var(--fo-bg); color: var(--fo-muted); border: 1px solid var(--fo-line); }
        .fo-race__name { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 17px; font-weight: 500; color: var(--fo-ink); }
        .fo-race__win {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: 999px;
          background: var(--fo-brand); color: #fff; font-size: 11.5px; font-weight: 500;
        }
        .fo-race__figs { display: flex; align-items: baseline; gap: 10px; white-space: nowrap; }
        .fo-race__figs b {
          font-size: 24px; font-weight: 600; color: var(--fo-ink);
          font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
        }
        .fo-race__figs span { font-size: 13.5px; font-weight: 300; color: var(--fo-muted); }
        .fo-race__bar { grid-column: 1 / -1; height: 6px; border-radius: 999px; background: var(--fo-tint-2); overflow: hidden; }
        .fo-race__bar i { display: block; height: 100%; border-radius: 999px; background: var(--fo-brand); }

        .fo-demo { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
        .fo-demo__h { display: block; font-size: 15px; font-weight: 500; color: var(--fo-ink); margin-bottom: 14px; }
        .fo-demo__g ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
        .fo-demo__g li { display: grid; grid-template-columns: 1fr auto; gap: 4px 10px; align-items: baseline; }
        .fo-demo__n { font-size: 14px; font-weight: 300; color: var(--fo-ink); }
        .fo-demo__v { font-size: 14px; font-weight: 500; color: var(--fo-ink); font-variant-numeric: tabular-nums; }
        .fo-demo__bar { grid-column: 1 / -1; height: 5px; border-radius: 999px; background: var(--fo-tint-2); overflow: hidden; }
        .fo-demo__bar i { display: block; height: 100%; border-radius: 999px; background: var(--fo-brand-soft); }

        @media (max-width: 760px) {
          .fo-res__summary { grid-template-columns: 1fr; }
          .fo-race__row { grid-template-columns: 40px 1fr; gap: 12px; padding: 14px 16px 16px; }
          .fo-race__num { width: 40px; height: 40px; font-size: 18px; }
          .fo-race__name { font-size: 15.5px; }
          /* the figures move to their own row rather than shrinking: the count is
             the whole point of the page and must never be the thing that truncates */
          .fo-race__figs { grid-column: 1 / -1; }
          .fo-race__figs b { font-size: 21px; }
        }
      `}</style>
    </FmsOfficialShell>
  );
}
