"use client";

// GumroadSuccess — the "Active Pulse" post-vote SUCCESS layout (template: gumroad).
// Shown after a ballot is cast: confirmation + the activity-transcript evaluation
// form CTA + the (form-gated) results unlock. Same chunky identity as the rest.
//
// Pure presentation — success/page.js owns auth, the form-iframe modal, the alert
// modal, and the unlock state. This renders the page chrome + card and calls back.

import { getPath } from "../../utils/basePath";
import { GumroadBaseStyles } from "../home/GumroadTheme";
import React from "react";
import { Check, Megaphone, CheckCircle2, Tag, ArrowRight, BarChart3, Lock } from "lucide-react";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import SiteNavbar from "../elements/site-navbar/gumroad";
import SiteFooter from "../elements/site-footer/gumroad";
import Chip from "../elements/chip/gumroad";

export default function GumroadSuccess({ user = null, isUnlocked = false, onOpenForm, editorMode = false }) {
  const globalConfig = useGlobalConfig();
  const facultyEn = globalConfig.facultyShortEn || "FMS";
  const uni = globalConfig.university || "PSU";
  const copyrightYear = globalConfig.copyrightYear || globalConfig.electionCalendarYear || "";
  const canResults = isUnlocked || editorMode;

  return (
    <div className="fms-app gsx-root gum-root">
      <GumroadBaseStyles />
      {/* TOPBAR — shared gumroad navbar element */}
      <SiteNavbar />

      <main className="gsx-main">
        <div className="gsx-card">
          <div className="gsx-icon"><Check size={42} strokeWidth={3.5} /></div>
          <span className="gsx-eyebrow">★ VOTE RECORDED</span>
          <h1 className="gsx-title">บันทึกคะแนนสำเร็จ!</h1>
          <p className="gsx-sub">ขอบคุณที่ร่วมเป็นส่วนหนึ่งในการขับเคลื่อนกิจกรรมนักศึกษาคณะวิทยาการจัดการ</p>

          {user && (
            <div className="gsx-user">
              <span className="gsx-user__lbl">ผู้ลงคะแนน</span>
              <strong>{user.name}</strong>
              {/* show id only if the name doesn't already contain it (avoids the
                  "Mock Student 6610510148 · 6610510148" double-id look) */}
              {user.studentId && !String(user.name || "").includes(user.studentId)
                ? <span className="gsx-user__id">{user.studentId}</span> : null}
            </div>
          )}

          {/* Announcement — activity transcript + results unlock */}
          <div className="gsx-note">
            <div className="gsx-note__head">
              <span className="gsx-note__ic"><Megaphone size={22} strokeWidth={2.5} /></span>
              <div>
                <h3>รับทรานสคริปต์กิจกรรม</h3>
                <p>ทำแบบประเมินให้ครบถ้วนเพื่อรับชั่วโมงกิจกรรม และปลดล็อกหน้าผลคะแนน</p>
              </div>
            </div>
            <div className="gsx-chips">
              <Chip tone="lime" icon={<CheckCircle2 size={13} />}>ชั่วโมงกิจกรรม 2 ชม.</Chip>
              <Chip tone="pink" icon={<Tag size={13} />}>ประเภทเลือกเข้าร่วม</Chip>
            </div>
          </div>

          {/* Actions */}
          <div className="gsx-actions">
            <button
              className={`gsx-btn ${isUnlocked && !editorMode ? "gsx-btn--done" : "gsx-btn--ink"}`}
              onClick={() => !editorMode && onOpenForm && onOpenForm()}
              disabled={isUnlocked && !editorMode}
            >
              {isUnlocked && !editorMode
                ? (<><Check size={18} /> ส่งแบบประเมินเรียบร้อยแล้ว</>)
                : (<><span className="gsx-livedot" /> เปิดแบบประเมิน (คลิกที่นี่) <ArrowRight size={18} /></>)}
            </button>

            {canResults ? (
              <a href={editorMode ? undefined : getPath("/results")} className="gsx-btn gsx-btn--pink">
                ไปดูผลคะแนน (Results) <BarChart3 size={18} />
              </a>
            ) : (
              <button className="gsx-btn gsx-btn--locked" disabled>
                <Lock size={16} /> ล็อก: กรุณาทำแบบประเมินก่อน
              </button>
            )}

            <a href={getPath("/")} className="gsx-home">กลับหน้าหลัก</a>
          </div>
        </div>
      </main>

      {/* FOOTER — shared gumroad footer element */}
      <SiteFooter faculty={facultyEn} uni={uni} year={copyrightYear} />

      <style jsx global>{`
        .gsx-root{
          --ink:#26271c; --ink2:#5c5a4b; --cream:#FFF6EC; --paper:#FFFDFA;
          --pink:#FF9CE9; --lime:#C2F47E; --yellow:#FFD24D; --sky:#B6E6FF; --coral:#FF8A8A;
          --bw:2.5px; --sh:5px 5px 0 var(--ink); --sh-sm:3px 3px 0 var(--ink); --sh-lg:8px 8px 0 var(--ink);
          --fd:var(--font-archivo),'Archivo Black',var(--font-anuphan),'Anuphan',system-ui,sans-serif;
          --fm:var(--font-space-grotesk),'Space Grotesk',ui-monospace,monospace;
          --fb:var(--font-anuphan),'Anuphan','Kanit',system-ui,sans-serif;
          min-height:100vh; display:flex; flex-direction:column; color:var(--ink); font-family:var(--fb);
          container-type:inline-size; container-name:gsx;
          background:linear-gradient(135deg, #FFE6F2 0%, #FFF7EE 46%, #EEF7DB 100%) fixed;
        }
        .gsx-root *{ box-sizing:border-box; } .gsx-root a{ text-decoration:none; color:inherit; } .gsx-root img{ display:block; max-width:100%; }

        /* topbar = shared <SiteNavbar> element */

        .gsx-main{ flex:1; display:grid; place-items:center; padding:44px 24px; }
        .gsx-card{ width:100%; max-width:560px; background:var(--paper); border:var(--bw) solid var(--ink); border-radius:26px;
          box-shadow:var(--sh-lg); padding:40px 36px 36px; text-align:center; }
        .gsx-icon{ width:90px; height:90px; margin:0 auto 20px; display:grid; place-items:center; color:var(--ink); background:var(--lime);
          border:var(--bw) solid var(--ink); border-radius:50%; box-shadow:var(--sh); }
        .gsx-eyebrow{ display:inline-block; font-family:var(--fm); font-size:12px; font-weight:700; letter-spacing:.14em; color:var(--ink2); }
        .gsx-title{ font-family:var(--fd); font-size:clamp(28px,6cqw,42px); line-height:1.05; letter-spacing:-.02em; margin:10px 0 0; }
        .gsx-sub{ margin:14px auto 0; font-size:clamp(13px,2.3cqw,15px); font-weight:500; line-height:1.65; color:var(--ink2); max-width:420px; }

        .gsx-user{ display:inline-flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:18px; padding:10px 18px;
          background:var(--cream); border:2px solid var(--ink); border-radius:999px; }
        .gsx-user__lbl{ font-family:var(--fm); font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink2); }
        .gsx-user strong{ font-size:15px; }
        .gsx-user__id{ font-family:var(--fm); font-size:13px; color:var(--ink2); }

        .gsx-note{ margin-top:26px; text-align:left; background:var(--cream); border:var(--bw) solid var(--ink); border-radius:18px; box-shadow:var(--sh-sm); padding:18px 20px; }
        .gsx-note__head{ display:flex; gap:14px; align-items:flex-start; }
        .gsx-note__ic{ flex-shrink:0; width:46px; height:46px; display:grid; place-items:center; background:var(--pink); color:var(--ink); border:2px solid var(--ink); border-radius:12px; box-shadow:var(--sh-sm); }
        .gsx-note__head h3{ margin:0; font-size:16px; font-weight:800; }
        .gsx-note__head p{ margin:4px 0 0; font-size:13px; line-height:1.55; color:var(--ink2); }
        .gsx-chips{ display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
        /* chips = <Chip> atoms (own scoped styles) */

        .gsx-actions{ margin-top:26px; display:flex; flex-direction:column; gap:12px; }
        .gsx-btn{ width:100%; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:15px 22px;
          border:var(--bw) solid var(--ink); border-radius:15px; font-weight:800; font-size:15px; box-shadow:var(--sh);
          cursor:pointer; color:var(--ink); font-family:var(--fb); transition:transform .12s ease-out, box-shadow .12s ease-out; }
        .gsx-btn:not(:disabled):hover{ transform:translate(-2px,-2px); box-shadow:var(--sh-lg); }
        .gsx-btn:not(:disabled):active{ transform:translate(2px,2px); box-shadow:0 0 0 var(--ink); }
        .gsx-btn--ink{ background:var(--ink); color:var(--cream); }
        .gsx-btn--pink{ background:var(--pink); }
        .gsx-btn--done{ background:var(--lime); cursor:default; box-shadow:var(--sh-sm); }
        .gsx-btn--locked{ background:#EDE6DC; color:#9A8F80; border-color:#9A8F80; box-shadow:none; cursor:not-allowed; }
        .gsx-livedot{ width:9px; height:9px; border-radius:999px; background:var(--coral); display:inline-block; box-shadow:0 0 0 0 rgba(255,110,110,.8); animation:gsxPulse 1.6s ease-out infinite; }
        @keyframes gsxPulse{ 0%{box-shadow:0 0 0 0 rgba(255,110,110,.7)} 70%{box-shadow:0 0 0 9px rgba(255,110,110,0)} 100%{box-shadow:0 0 0 0 rgba(255,110,110,0)} }
        .gsx-home{ margin-top:4px; font-size:13px; font-weight:700; color:var(--ink2); padding:6px; }
        .gsx-home:hover{ color:var(--ink); }

        /* footer = <SiteFooter> element (own scoped styles) */
        @container gsx (max-width:560px){
          .gsx-card{ padding:34px 22px 30px; }
        }
      `}</style>
    </div>
  );
}
