'use client';

// ศูนย์ควบคุม: the first page of the console and the only place that commands
// a running election. Status, turnout, the four mode buttons and the closing
// steps (close the box, publish, certify) sit together on purpose, so on
// election day nobody has to hunt through another tab to pause the system.
//
// Moved here unchanged from SettingsTab: every confirm dialog, every call to
// POST /api/admin/dashboard (SET_MODE, SET_SHOW_RESULT, ANONYMIZE_BALLOTS) and
// the rules for which button may be pressed when (adminGuards.checkSetMode).
// Only the layout and wording changed.
import { useState } from "react";
import {
  AlertTriangle, Check, CheckCircle2, ChevronRight, Loader2, PieChart as PieIcon,
  Power, ShieldCheck, Users, WifiOff, XCircle,
} from "lucide-react";
import { getPath } from "../../../utils/basePath";
import { formatThaiDate, formatThaiTime } from "../../../utils/electionConfig";
import { checkSetMode, describeModeChange, MODE_LABEL } from "../../../lib/election/adminGuards.mjs";
import CompletedActionModal from "../../CompletedActionModal";
import ErrorActionModal from "../../ErrorActionModal";
import ConfirmModal from "../../ConfirmModal";
import { useElectionState } from "./ElectionStateContext";
import { SYSTEM_MODES } from "./modes";
import { TONES, MODE_SHORT, MODE_THAI, describeElection, formatClock, splitDuration } from "./electionStatus";
import TurnoutBreakdown from "./TurnoutBreakdown";

const card = "bg-white rounded-xl border border-slate-200";

// ── status ──────────────────────────────────────────────────────────────────
function Countdown({ ms }) {
  const { days, hours, minutes, seconds } = splitDuration(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <p className="text-3xl sm:text-4xl font-semibold text-slate-900 tabular-nums tracking-tight">
      {days > 0 && <span className="mr-2">{days} วัน</span>}
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </p>
  );
}

function StatusCard() {
  const { stats, now, lastUpdated, failed } = useElectionState();
  const view = describeElection(stats, now);
  const tone = TONES[view.tone];
  const start = stats?.electionStart ? new Date(stats.electionStart) : null;
  const end = stats?.electionEnd ? new Date(stats.electionEnd) : null;
  const voted = stats?.votedCount ?? 0;
  const total = stats?.totalVoters ?? 0;
  const pct = total > 0 ? (voted / total) * 100 : 0;

  return (
    <section className={`${card} overflow-hidden`} aria-label="สถานะการเลือกตั้งตอนนี้">
      <div className="grid grid-cols-1 lg:grid-cols-5">
        <div className="lg:col-span-3 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-semibold ${tone.pill}`}>
              <span className={`w-2 h-2 rounded-full ${tone.dot}`} aria-hidden />
              {view.label}
            </span>
            {view.mode && (
              <span className="text-xs font-medium text-slate-600 px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50">
                โหมด {MODE_SHORT[view.mode]} ({MODE_THAI[view.mode]})
              </span>
            )}
          </div>

          <div className="mt-5 min-h-[3.5rem]">
            {view.countdown ? (
              <>
                <p className="text-xs font-medium text-slate-500 mb-1">{view.countdown.label}</p>
                <Countdown ms={view.countdown.ms} />
              </>
            ) : (
              <p className={`text-2xl sm:text-3xl font-semibold tracking-tight ${view.key === "loading" ? "text-slate-400" : tone.text}`}>
                {view.headline || view.label}
              </p>
            )}
          </div>

          {view.detail && <p className="mt-3 text-sm text-slate-600 leading-relaxed">{view.detail}</p>}
          {view.next && (
            <p className="mt-3 text-sm text-slate-800 flex items-start gap-1.5 leading-relaxed">
              <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-[#8A2680]" aria-hidden />
              <span><span className="font-semibold">ขั้นต่อไป</span> {view.next}</span>
            </p>
          )}

          {start && end && (
            <dl className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div>
                <dt className="text-slate-500">เปิดหีบ</dt>
                <dd className="text-slate-800 font-medium tabular-nums">{formatThaiDate(start)} เวลา {formatThaiTime(start)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">ปิดหีบ</dt>
                <dd className="text-slate-800 font-medium tabular-nums">{formatThaiDate(end)} เวลา {formatThaiTime(end)}</dd>
              </div>
            </dl>
          )}
        </div>

        <div className="lg:col-span-2 p-5 sm:p-6 bg-slate-50/70 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Users className="w-4 h-4" aria-hidden />
            ผู้ใช้สิทธิ์แล้ว
          </div>
          <p className="mt-2 text-3xl sm:text-4xl font-semibold text-slate-900 tabular-nums tracking-tight">
            {voted.toLocaleString()}
            <span className="text-lg font-medium text-slate-400"> / {total.toLocaleString()} คน</span>
          </p>
          <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="สัดส่วนผู้ใช้สิทธิ์">
            <div className="h-full rounded-full bg-[#8A2680] transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-600 tabular-nums">{pct.toFixed(2)}% ของผู้มีสิทธิ์ทั้งหมด</p>

          <div className="mt-auto pt-5 text-xs tabular-nums" aria-live="polite">
            {failed ? (
              <span className="inline-flex items-start gap-1.5 font-medium text-red-600">
                <WifiOff className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
                <span>เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตัวเลขนี้อาจไม่ใช่ล่าสุด{lastUpdated ? ` (อ่านได้ล่าสุด ${formatClock(lastUpdated)})` : ""}</span>
              </span>
            ) : lastUpdated ? (
              <span className="text-slate-500">อัปเดตล่าสุด {formatClock(lastUpdated)}</span>
            ) : (
              <span className="text-slate-400">กำลังโหลด</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── readiness summary (one fetch per console open, held in the context) ─────
function ReadinessStrip({ onGoTab }) {
  const { readiness, readinessError, readinessRunning, readinessAt } = useElectionState();
  let body;
  let cls = "bg-white border-slate-200 text-slate-700";
  let Icon = Loader2;
  let iconCls = "text-slate-400 animate-spin";

  if (readinessError && !readiness) {
    cls = "bg-red-50 border-red-200 text-red-700";
    Icon = XCircle;
    iconCls = "text-red-600";
    body = <span>ตรวจความพร้อมระบบไม่สำเร็จ ลองกดตรวจซ้ำที่เมนูความพร้อมและระบบ</span>;
  } else if (!readiness) {
    body = <span>กำลังตรวจความพร้อมระบบ</span>;
  } else {
    const fail = readiness.summary?.fail ?? 0;
    const warn = readiness.summary?.warn ?? 0;
    const pass = readiness.summary?.pass ?? 0;
    Icon = fail > 0 ? XCircle : warn > 0 ? AlertTriangle : CheckCircle2;
    iconCls = "";
    if (fail > 0) {
      cls = "bg-red-50 border-red-200 text-red-800";
      iconCls = "text-red-600";
      body = <span><span className="font-semibold">ความพร้อมระบบ ไม่ผ่าน {fail} ข้อ</span>{warn > 0 ? ` เตือน ${warn} ข้อ` : ""} ผ่าน {pass} ข้อ</span>;
    } else if (warn > 0) {
      cls = "bg-amber-50 border-amber-200 text-amber-800";
      iconCls = "text-amber-600";
      body = <span><span className="font-semibold">ความพร้อมระบบ มีเตือน {warn} ข้อ</span> ผ่าน {pass} ข้อ</span>;
    } else {
      cls = "bg-emerald-50 border-emerald-200 text-emerald-800";
      iconCls = "text-emerald-600";
      body = <span><span className="font-semibold">ความพร้อมระบบ ผ่านทุกข้อ</span> ({pass} ข้อ)</span>;
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 rounded-xl border text-sm ${cls}`}>
      <Icon className={`w-4 h-4 shrink-0 ${iconCls}`} aria-hidden />
      <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-1.75rem)]">{body}</div>
      <div className="flex items-center gap-3 max-sm:basis-full max-sm:pl-7 sm:contents">
        {readinessAt && !readinessRunning && (
          <span className="text-xs opacity-70 tabular-nums">ตรวจเมื่อ {formatClock(readinessAt)}</span>
        )}
        {readinessRunning && readiness && <span className="text-xs opacity-70">กำลังตรวจซ้ำ</span>}
        <button
          type="button"
          onClick={() => onGoTab && onGoTab("settings")}
          className="text-xs font-semibold underline underline-offset-2 hover:no-underline max-md:py-1.5"
        >
          ดูรายละเอียด
        </button>
      </div>
    </div>
  );
}

// ── closing steps ───────────────────────────────────────────────────────────
// What happens after voting, in the only order that is safe: close the box,
// publish, then (optionally) staff certify. Each step's button opens only when
// the one before is done; the server enforces the same order (lib/election/
// adminGuards plus the certify guard), this screen only shows it. No IT-check
// step: the committee publishes straight after closing (owner 2026-10-01).
const STEP_STYLE = {
  done:    { badge: "bg-emerald-600 text-white border-emerald-600", row: "bg-white border-emerald-200", label: "เสร็จแล้ว", labelCls: "text-emerald-700" },
  current: { badge: "bg-[#8A2680] text-white border-[#8A2680]", row: "bg-white border-[#8A2680]/40 shadow-sm", label: "ขั้นนี้", labelCls: "text-[#8A2680]" },
  locked:  { badge: "bg-white text-slate-400 border-slate-300", row: "bg-slate-50 border-slate-200", label: "รอขั้นก่อนหน้า", labelCls: "text-slate-500" },
};

const ClosingSteps = ({ systemMode, boxClosed, isShowResult, certified, schedule, processing, onCloseBox, onPublish, onHide, onCertify }) => {
  const endText = schedule.end ? formatThaiDate(schedule.end) + " เวลา " + formatThaiTime(schedule.end) : "";
  const closedHow = systemMode === "ENDED" ? "ปิดด้วยโหมด ENDED" : "ปิดตามเวลา" + (endText ? " " + endText : "");
  const done = [boxClosed, isShowResult || certified, certified];
  const current = done.findIndex((d) => !d);
  const state = (i) => (done[i] ? "done" : i === current ? "current" : "locked");
  const btn = "shrink-0 inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  const steps = [
    {
      title: "ปิดหีบ",
      desc: "หยุดรับคะแนน โหมด AUTO ปิดเองเมื่อถึงเวลาปิดหีบ ถ้าใช้ OPEN อยู่ ต้องกด ENDED เอง",
      status: boxClosed ? closedHow : "หีบยังเปิดรับคะแนนอยู่",
      action: !boxClosed && !certified && (
        <button type="button" onClick={onCloseBox} disabled={processing} className={btn + " bg-red-600 text-white hover:bg-red-700"}>
          <Power className="w-4 h-4" aria-hidden /> ปิดหีบตอนนี้ (ENDED)
        </button>
      ),
    },
    {
      title: "ประกาศผล",
      desc: "เปิดให้ทุกคนเห็นคะแนนรายพรรคและสถิติผู้ใช้สิทธิ์ที่หน้าผลคะแนน เมื่อประกาศแล้ว เปิดหีบอีกไม่ได้จนกว่าจะซ่อนผล",
      status: isShowResult ? "ประกาศแล้ว ทุกคนเห็นผลคะแนน" : (boxClosed ? "พร้อมประกาศ" : "ประกาศได้หลังปิดหีบ"),
      action: isShowResult
        ? (!certified && (
          <button type="button" onClick={onHide} disabled={processing} className={btn + " bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"}>
            ซ่อนผล
          </button>))
        : (
          <button type="button" onClick={onPublish} disabled={processing || !boxClosed}
            title={!boxClosed ? "ประกาศได้หลังปิดหีบแล้วเท่านั้น" : undefined}
            className={btn + " bg-[#8A2680] text-white hover:bg-[#7a2270]"}>
            <PieIcon className="w-4 h-4" aria-hidden /> ประกาศผล
          </button>
        ),
    },
    {
      title: "รับรองผลอย่างเป็นทางการ",
      optional: true,
      desc: "บัญชีเจ้าหน้าที่คณะเท่านั้น (กรรมการสโมฯ กดไม่ได้) บันทึกชื่อผู้รับรองกับวันเวลา ขึ้นเป็นแถบรับรองบนหน้าผลคะแนน ไม่มีการลบข้อมูลใด ๆ กดแล้วย้อนกลับไม่ได้ เปิดหีบใหม่ไม่ได้อีกในการเลือกตั้งครั้งนี้",
      status: certified ? "รับรองแล้ว" : (isShowResult && boxClosed ? "พร้อมรับรอง" : "รับรองได้หลังประกาศผล"),
      action: !certified && (
        <button type="button" onClick={onCertify} disabled={processing || !isShowResult || !boxClosed}
          title={!isShowResult ? "ต้องประกาศผลก่อน" : undefined}
          className={btn + " bg-white border border-slate-300 text-slate-800 hover:bg-slate-900 hover:text-white hover:border-slate-900"}>
          <ShieldCheck className="w-4 h-4" aria-hidden /> รับรองผล
        </button>
      ),
    },
  ];

  return (
    <section className={`${card} p-5 sm:p-6`} aria-labelledby="closing-steps-title">
      <h3 id="closing-steps-title" className="text-base font-semibold text-slate-900">ขั้นตอนปิดการเลือกตั้ง</h3>
      <p className="text-sm text-slate-500 mt-1">ทำตามลำดับ ปุ่มของขั้นถัดไปจะกดได้เมื่อขั้นก่อนหน้าเสร็จแล้ว</p>
      <ol className="mt-4 space-y-3">
        {steps.map((st, i) => {
          const k = state(i); const sty = STEP_STYLE[k];
          return (
            <li key={st.title} className={"flex gap-4 p-4 rounded-xl border " + sty.row + " max-sm:flex-col max-sm:gap-3 max-sm:p-3"}>
              <div className="flex gap-4 max-sm:gap-3 min-w-0 flex-1">
                <span className={"shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold tabular-nums " + sty.badge} aria-hidden>
                  {k === "done" ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-slate-900">{st.title}</h4>
                    <span className={"text-[11px] font-semibold " + sty.labelCls}>{sty.label}</span>
                    {st.optional && <span className="text-[11px] font-medium text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">ไม่บังคับ</span>}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">{st.desc}</p>
                  <p className={"text-xs font-semibold mt-1.5 break-words " + (k === "done" ? "text-emerald-700" : "text-slate-700")}>{st.status}</p>
                </div>
              </div>
              {st.action && <div className="sm:self-center max-sm:pl-12">{st.action}</div>}
            </li>
          );
        })}
      </ol>
    </section>
  );
};

// ── the control center ──────────────────────────────────────────────────────
export default function ElectionControl({ onGoTab }) {
  const { stats, refresh } = useElectionState();
  const systemMode = stats?.systemMode || "AUTO";
  const isShowResult = !!stats?.showResult;
  const boxClosed = !!stats?.boxClosed;
  const certified = !!stats?.certified;
  const schedule = {
    start: stats?.electionStart ? new Date(stats.electionStart) : null,
    end: stats?.electionEnd ? new Date(stats.electionEnd) : null,
  };
  const loading = !stats;

  const [processing, setProcessing] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [pendingMode, setPendingMode] = useState(null);

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: "", msg: "" });

  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: "", msg: "" });

  // re-read after every action instead of flipping local state: another admin
  // may have changed something in the meantime, and the screen must show what
  // the server now holds
  const handleConfirmAction = async () => {
    if (!activeModal) return;

    setProcessing(true);
    try {
      const action = activeModal;
      const body = { action };

      if (action === "SET_MODE") {
        body.mode = pendingMode;
      }
      if (action === "SET_SHOW_RESULT") {
        body.value = !isShowResult; // the value the admin saw the switch offer
      }

      const res = await fetch(getPath("/api/admin/dashboard"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setActiveModal(null);

      if (res.ok) {
        if (action === "SET_MODE") {
          setSuccessMessage({ title: "บันทึกสำเร็จ!", msg: `เปลี่ยนโหมดระบบเป็น ${MODE_LABEL[pendingMode] || pendingMode} เรียบร้อยแล้ว` });
        } else if (action === "SET_SHOW_RESULT") {
          setSuccessMessage({ title: "บันทึกสำเร็จ!", msg: isShowResult ? "ซ่อนผลคะแนนแล้ว" : "เปิดแสดงผลคะแนนแล้ว ทุกคนดูผลได้ที่หน้าผลคะแนน" });
        } else if (action === "ANONYMIZE_BALLOTS") {
          // AUD-COPY, v2-SEC: this action deletes nothing. It sets the flag
          // globalConfig.ballotsAnonymized = true (the certification flag) and
          // that is all (dashboard/route.js POST). No voter-to-party link was
          // ever stored (Ballot has no userId, User has no candidateId).
          setSuccessMessage({ title: "รับรองผลเรียบร้อย!", msg: "ปักธงรับรองผลแล้ว คะแนนรวมของทุกพรรคถูกล็อกไว้ครบ บัตรทุกใบไม่มีลิงก์ถึงผู้ลงคะแนนอยู่แล้วตั้งแต่ตอนบันทึก จึงไม่มีข้อมูลรายบุคคลเหลือให้ลบ" });
        }
        setIsSuccessOpen(true);
        refresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage({ title: `ดำเนินการไม่สำเร็จ (${res.status})`, msg: errData.error || res.statusText });
        setIsErrorOpen(true);
        refresh();
      }
    } catch (error) {
      console.error("Action failed!", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleModeChange = (newMode) => {
    if (newMode === systemMode) return; // prevent redundant actions
    setPendingMode(newMode);
    setActiveModal("SET_MODE");
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <StatusCard />
      <ReadinessStrip onGoTab={onGoTab} />

      <section className={`${card} p-5 sm:p-6`} aria-labelledby="mode-title">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 id="mode-title" className="text-base font-semibold text-slate-900">โหมดการทำงานของระบบ</h3>
          <p className="text-xs text-slate-500">กดเพื่อเปลี่ยนโหมด จะมีหน้าต่างให้ยืนยันก่อนเสมอ</p>
        </div>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3" role="group" aria-label="เลือกโหมดระบบ">
          {SYSTEM_MODES.map((m) => {
            const isCurrent = systemMode === m.id;
            const blocked = !isCurrent && !loading && checkSetMode({ mode: m.id, showResult: isShowResult, certified, end: schedule.end });
            const Icon = m.Icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModeChange(m.id)}
                title={blocked ? blocked : undefined}
                aria-pressed={isCurrent}
                disabled={isCurrent || processing || loading || !!blocked}
                className={`relative text-left p-4 rounded-xl border transition-colors disabled:cursor-not-allowed
                  ${isCurrent
                    ? "border-[#8A2680] bg-purple-50 ring-1 ring-[#8A2680] disabled:opacity-100"
                    : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-slate-200"}`}
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? "text-[#8A2680]" : "text-slate-500"}`} aria-hidden />
                  <span className={`text-sm font-semibold ${isCurrent ? "text-[#8A2680]" : "text-slate-900"}`}>{m.short}</span>
                </span>
                <span className="block mt-0.5 text-xs font-medium text-slate-700 whitespace-nowrap">{m.thai}</span>
                <span className="block mt-1.5 text-xs text-slate-600 leading-relaxed">{m.hint}</span>
                {isCurrent && (
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#8A2680]">
                    <Check className="w-3 h-3" aria-hidden /> ใช้อยู่ตอนนี้
                  </span>
                )}
                {blocked && (
                  <span className="mt-2 block text-[11px] font-medium text-amber-700">กดไม่ได้ตอนนี้ (ดูเหตุผลด้านล่าง)</span>
                )}
              </button>
            );
          })}
        </div>

        {isShowResult && !certified && (
          <p className="mt-4 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-1.5 leading-relaxed break-words">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
            ผลคะแนนกำลังแสดงอยู่ จึงเปิดหีบหรือพักระบบไม่ได้ ถ้าต้องเปิดหีบอีกครั้ง ให้ซ่อนผลในขั้นตอนปิดการเลือกตั้งด้านล่างก่อน
          </p>
        )}
        {certified && (
          <p className="mt-4 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-start gap-1.5 leading-relaxed break-words">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
            ผลถูกรับรองแล้ว การเลือกตั้งครั้งนี้ปิดอย่างเป็นทางการ เปลี่ยนโหมดอื่นไม่ได้
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          คำอธิบายว่าแต่ละโหมดใช้ตอนไหน อยู่ที่เมนู
          {onGoTab ? (
            <button type="button" onClick={() => onGoTab("settings")} className="mx-1 font-semibold text-[#8A2680] underline underline-offset-2 hover:no-underline">
              ความพร้อมและระบบ
            </button>
          ) : " ความพร้อมและระบบ"}
        </p>
      </section>

      <ClosingSteps
        systemMode={systemMode} boxClosed={boxClosed} isShowResult={isShowResult} certified={certified}
        schedule={schedule} processing={processing || loading}
        onCloseBox={() => handleModeChange("ENDED")}
        onPublish={() => setActiveModal("SET_SHOW_RESULT")}
        onHide={() => setActiveModal("SET_SHOW_RESULT")}
        onCertify={() => setActiveModal("ANONYMIZE_BALLOTS")}
      />

      <TurnoutBreakdown />

      <CompletedActionModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        title={successMessage.title}
        message={successMessage.msg}
      />

      <ErrorActionModal
        isOpen={isErrorOpen}
        onClose={() => setIsErrorOpen(false)}
        title={errorMessage.title}
        message={errorMessage.msg}
      />

      <ConfirmModal
        isOpen={activeModal === "SET_MODE"}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        title={`เปลี่ยนเป็น ${MODE_LABEL[pendingMode] || pendingMode}?`}
        message={describeModeChange({ from: systemMode, to: pendingMode, start: schedule.start, end: schedule.end })}
        variant="primary"
        isLoading={processing}
      />

      <ConfirmModal
        isOpen={activeModal === "SET_SHOW_RESULT"}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        title={isShowResult ? "ซ่อนผลคะแนน?" : "ประกาศผลคะแนน?"}
        /* AUD-COPY, results/route.js: hideTally = !showResult hides the per-party
           tally from everyone including admins (no bypass), while showBreakdown =
           isAdmin || showResult keeps turnout progress on the admin overview. */
        message={isShowResult
          ? "เมื่อซ่อนผลคะแนน คะแนนของแต่ละพรรคจะถูกปิดจากทุกคนรวมถึงแอดมินเอง ความคืบหน้าการใช้สิทธิ์ในศูนย์ควบคุมยังดูได้ตามปกติ"
          : "ทุกคนจะเห็นคะแนนรายพรรคและสถิติผู้ใช้สิทธิ์ที่หน้าผลคะแนนทันที เมื่อประกาศแล้ว จะเปิดหีบอีกไม่ได้จนกว่าจะซ่อนผลก่อน"}
        variant="primary"
        isLoading={processing}
      />

      <ConfirmModal
        isOpen={activeModal === "ANONYMIZE_BALLOTS"}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        /* AUD-COPY: must agree with dashboard/route.js. ANONYMIZE_BALLOTS only sets
           the ballotsAnonymized flag (certification); it deletes nothing, because the
           voter-to-party link was never stored (v2-SEC). */
        title="รับรองผลอย่างเป็นทางการ?"
        message={"นี่คือการปักธงรับรองผลครั้งสุดท้าย คะแนนรวมของทุกพรรคถูกล็อก เครื่องมือตรวจสอบจะไม่แก้ไขฐานข้อมูลอีก ระบบไม่เคยเก็บว่าใครเลือกพรรคใด บัตรทุกใบถูกบันทึกแบบไม่มีชื่อผู้ลงคะแนนอยู่แล้ว จึงไม่มีข้อมูลรายบุคคลเหลือให้ลบ กดแล้วย้อนกลับไม่ได้"}
        variant="danger"
        isLoading={processing}
      />
    </div>
  );
}
