'use client';

import { useState } from 'react';
import { getPath } from "../../utils/basePath";
import { AlertTriangle, Trash2, X, Loader2, CheckCircle2, XCircle, ShieldCheck, Wrench, Check, ChevronDown, RefreshCw } from "lucide-react";
import { resolveElectionDates, parseBangkok, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { useElectionState } from "./console/ElectionStateContext";
import { SYSTEM_MODES } from "./console/modes";
import { formatClock } from "./console/electionStatus";

// Commanding a running election (mode buttons, close the box, publish, certify)
// moved to the control center (console/ElectionControl.js), the first tab of
// the console. What stays here is the slow, look-before-the-day material:
// readiness, what each mode means, and the new-academic-year notes.

// ── SEC-MOCK2, mock login status (read-only) ────────────────────────────────
// Shown to the admin without pressing anything. The value comes from GET
// /api/admin/dashboard, read on the server at runtime. Never read
// NEXT_PUBLIC_ENABLE_MOCK_LOGIN here: it is inlined at build time, so it would
// report the machine that built the app, not the server that is running it
// (same family of bug as ade160e). What actually grants access is
// providerRegistered; SEC-MOCK3 dropped buttonVisible because the button on
// the login page reads /api/auth/providers at runtime and is always its shadow.
// No switch or button here: turning it on or off is the system owner's call
// (see DECISIONS.md).
const MockLoginStatusBadge = ({ status }) => {
  const [open, setOpen] = useState(false);

  // Not known yet (before the fetch finishes): must stay neutral, never flash
  // a green "safe" first.
  if (!status) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-slate-50 border-slate-200 text-xs text-slate-500">
        <Loader2 className="w-3.5 h-3.5 shrink-0 text-slate-400 animate-spin" aria-hidden />
        การเข้าสู่ระบบจำลอง กำลังตรวจสอบสถานะ
      </div>
    );
  }

  const danger = status.providerRegistered;
  const title = danger
    ? "การเข้าสู่ระบบจำลอง เส้นทางเปิดอยู่บนเซิร์ฟเวอร์นี้"
    : "การเข้าสู่ระบบจำลอง ปิดสนิท";
  const detail = danger
    ? "mock-login provider ถูกลงทะเบียนอยู่ ใครที่รู้ URL callback ของ NextAuth เข้าระบบเป็นนักศึกษาคนใดก็ได้โดยไม่ต้องใช้รหัสผ่าน เป็นเรื่องปกติของเครื่องนักพัฒนา และปิดเองอัตโนมัติเมื่อรันเป็น production build จึงไม่มีสวิตช์ให้กดตรงนี้"
    : "provider ไม่ถูกลงทะเบียนบนเซิร์ฟเวอร์นี้ และปุ่มบนหน้า login ก็ไม่แสดงตามไปด้วย เข้าระบบได้ทางเดียวคือ PSU SSO จริง";
  const box = danger ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-emerald-50 border-emerald-200 text-emerald-800";
  const Icon = danger ? AlertTriangle : CheckCircle2;

  return (
    <div className={`rounded-lg border text-xs ${box}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3 py-2 text-left max-md:min-h-[40px]"
      >
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
        <span className="font-semibold min-w-0 flex-1">{title}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && <p className="px-3 pb-2.5 leading-relaxed text-slate-700">{detail}</p>}
    </div>
  );
};

// ── ADM-1, election readiness check ─────────────────────────────────────────
// The check the committee runs before the real day to see everything that is
// not ready. Read-only: GET /api/admin/readiness, shown by level (pass, warn,
// fail). It runs once when the console opens (the result lives in the shared
// state, so the control center can show the summary) and again on the button.
const READINESS_LEVEL = {
  pass: { Icon: CheckCircle2, cls: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100",
    label: "ผ่าน", chip: "text-emerald-600", chipOn: "bg-emerald-600 text-white border-emerald-600", rank: 2 },
  warn: { Icon: AlertTriangle, cls: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100",
    label: "เตือน", chip: "text-amber-600", chipOn: "bg-amber-500 text-white border-amber-500", rank: 1 },
  fail: { Icon: XCircle, cls: "text-red-600", bg: "bg-red-50", border: "border-red-100",
    label: "ไม่ผ่าน", chip: "text-red-600", chipOn: "bg-red-600 text-white border-red-600", rank: 0 },
};
// Always fail, then warn, then pass. People run the check to find what is not
// ready, not to read what already passed.
const LEVEL_ORDER = ["fail", "warn", "pass"];

const ReadinessCard = () => {
  const globalConfig = useGlobalConfig();
  const { readiness: result, readinessError, readinessRunning: running, readinessAt, runReadiness } = useElectionState();
  const [localError, setLocalError] = useState(null);
  const [fixing, setFixing] = useState(false);
  const [fixMessage, setFixMessage] = useState(null);
  // null = every level; "fail" | "warn" | "pass" = only that level
  const [levelFilter, setLevelFilter] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const error = localError || readinessError;

  const { CAMPAIGN_START, ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);
  const scheduleRows = [
    { label: "เปิดตัวผู้สมัคร", key: "campaignStartAt", date: CAMPAIGN_START },
    { label: "เปิดหีบ", key: "electionStartAt", date: ELECTION_START },
    { label: "ปิดหีบ", key: "electionEndAt", date: ELECTION_END },
  ];

  // sort first, then filter: the chip counts always come from the full result
  const sortedChecks = result
    ? [...result.checks].sort((a, b) => {
        const ra = READINESS_LEVEL[a.level]?.rank ?? 1;
        const rb = READINESS_LEVEL[b.level]?.rank ?? 1;
        return ra - rb;   // order inside one level is kept (JS sort is stable)
      })
    : [];
  const visibleChecks = levelFilter ? sortedChecks.filter((c) => c.level === levelFilter) : sortedChecks;

  const runCheck = async () => {
    setLocalError(null);
    setLevelFilter(null);
    setCollapsed(false);
    await runReadiness();
  };

  // Rebuild the special ballot options to match the real party count
  // (abstain = number 0, disapprove = number -1). The button only shows when
  // readiness reports the options missing, and it re-checks after the repair.
  const syncBallotOptions = async () => {
    setFixing(true);
    setLocalError(null);
    setFixMessage(null);
    try {
      const res = await fetch(getPath("/api/admin/dashboard"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SYNC_BALLOT_OPTIONS" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `สถานะ ${res.status}`);
      setFixMessage(data.message || "ปรับตัวเลือกในบัตรเรียบร้อย");
      await runReadiness();
    } catch (e) {
      setLocalError("สร้างตัวเลือกไม่สำเร็จ " + e.message);
    } finally {
      setFixing(false);
    }
  };

  return (
    <section className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200" aria-labelledby="readiness-title">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-[#8A2680]/10 text-[#8A2680] p-2.5 rounded-lg"><ShieldCheck className="h-5 w-5" aria-hidden /></div>
          <div>
            <h3 id="readiness-title" className="text-base font-semibold text-slate-900">ตรวจความพร้อมระบบ</h3>
            <p className="text-sm text-slate-500">
              ตรวจให้เองเมื่อเปิดคอนโซล กดตรวจซ้ำได้หลังแก้ปัญหา
              {readinessAt && !running && <span className="tabular-nums"> (ตรวจล่าสุด {formatClock(readinessAt)})</span>}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={runCheck}
          disabled={running}
          className="shrink-0 flex items-center justify-center gap-2 px-4 min-h-[40px] bg-[#8A2680] text-white rounded-lg font-semibold text-sm hover:bg-[#7a2270] transition-colors disabled:opacity-50"
        >
          {running ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden /> กำลังตรวจ</> : <><RefreshCw className="w-4 h-4" aria-hidden /> ตรวจซ้ำ</>}
        </button>
      </div>

      {/* resolved schedule as the system reads it now */}
      <div className="mb-5 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="text-xs font-semibold text-slate-500 mb-3">กำหนดการปัจจุบัน</h4>
        <div className="space-y-2">
          {scheduleRows.map((r) => {
            const fromDb = parseBangkok(globalConfig?.[r.key]) !== null;
            return (
              <div key={r.key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-slate-700">{r.label}</span>
                <span className="flex items-center gap-2">
                  <span className="text-slate-800 tabular-nums">{formatThaiDate(r.date)} {formatThaiTime(r.date)}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${fromDb ? "bg-[#8A2680]/10 text-[#8A2680]" : "bg-slate-200 text-slate-600"}`}>
                    {fromDb ? "ตั้งไว้แล้ว" : "ค่าเริ่มต้น"}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start justify-between gap-3" role="alert">
          <span className="min-w-0">{error}</span>
          <button
            type="button"
            onClick={() => setLocalError(null)}
            title="ปิดข้อความนี้"
            aria-label="ปิดข้อความนี้"
            className="shrink-0 text-red-400 hover:text-red-700 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
      )}

      {fixMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-start justify-between gap-3">
          <span className="min-w-0">{fixMessage}</span>
          <button
            type="button"
            onClick={() => setFixMessage(null)}
            title="ปิดข้อความนี้"
            aria-label="ปิดข้อความนี้"
            className="shrink-0 text-emerald-400 hover:text-emerald-700 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
      )}

      {result && (
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-4 text-sm font-semibold">
            {/* The summary chips double as filters: press to see only that level,
                press again for all. Counts always come from the full result. */}
            {LEVEL_ORDER.map((level) => {
              const lv = READINESS_LEVEL[level];
              const LvIcon = lv.Icon;
              const count = result.summary[level] ?? 0;
              const on = levelFilter === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setLevelFilter(on ? null : level)}
                  aria-pressed={on}
                  disabled={count === 0 && !on}
                  title={count === 0 ? `ไม่มีข้อที่${lv.label}` : on ? "กดอีกครั้งเพื่อดูทั้งหมด" : `ดูเฉพาะข้อที่${lv.label}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors tabular-nums max-md:min-h-[40px]
                    ${on ? lv.chipOn : `bg-white border-slate-200 ${lv.chip} hover:bg-slate-50`}
                    ${count === 0 && !on ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <LvIcon className="w-4 h-4" aria-hidden /> {lv.label} {count}
                </button>
              );
            })}
            {levelFilter && (
              <button
                type="button"
                onClick={() => setLevelFilter(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 transition-colors max-md:min-h-[40px]"
              >
                ดูทั้งหมด
              </button>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-expanded={!collapsed}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 transition-colors max-md:min-h-[40px] max-md:px-4"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${collapsed ? "" : "rotate-180"}`} aria-hidden />
              {collapsed ? "แสดงรายการ" : "ซ่อนรายการ"}
            </button>
          </div>

          {!collapsed && (
            <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
              {visibleChecks.map((c) => {
                const lv = READINESS_LEVEL[c.level] || READINESS_LEVEL.warn;
                const Icon = lv.Icon;
                return (
                  <div key={c.id} className={`flex items-start gap-3 p-3 rounded-lg border ${lv.bg} ${lv.border}`}>
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${lv.cls}`} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{c.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{c.detail}</p>
                      {c.techDetail && (
                        <details className="mt-1.5 group">
                          <summary className="cursor-pointer text-[11px] font-semibold text-slate-500 hover:text-slate-800 select-none">รายละเอียดสำหรับเจ้าหน้าที่ IT</summary>
                          <p className="mt-1 text-[11px] text-slate-500 leading-relaxed break-words font-mono">{c.techDetail}</p>
                        </details>
                      )}
                      {/* The one item a button can repair: the special ballot options
                          went missing from the database (a DB that had parties set up
                          before the sync existed, or imported data). */}
                      {c.id === "candidates.single" && c.level !== "pass" && (
                        <button
                          type="button"
                          onClick={syncBallotOptions}
                          disabled={fixing}
                          className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#8A2680] text-white text-xs font-semibold hover:bg-[#7a2270] transition-colors disabled:opacity-50 max-md:min-h-[40px] max-md:px-4"
                        >
                          {fixing
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> กำลังสร้าง</>
                            : <><Wrench className="w-3.5 h-3.5" aria-hidden /> สร้างตัวเลือกที่ขาดให้อัตโนมัติ</>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {visibleChecks.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">
                  ไม่มีข้อที่{READINESS_LEVEL[levelFilter]?.label ?? ""}ในผลการตรวจครั้งนี้
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!result && !error && (
        <p className="text-sm text-slate-500 text-center py-4 flex items-center justify-center gap-2" aria-live="polite">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> กำลังตรวจความพร้อมระบบ
        </p>
      )}
    </section>
  );
};

// ── what each mode means ────────────────────────────────────────────────────
// The buttons live in the control center; this is the reference card for
// choosing between them. Same SYSTEM_MODES list, so the words never drift.
const ModeGuide = () => {
  const { stats } = useElectionState();
  const systemMode = stats?.systemMode || "AUTO";
  return (
    <section className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200" aria-labelledby="mode-guide-title">
      <h3 id="mode-guide-title" className="text-base font-semibold text-slate-900">แต่ละโหมดใช้ตอนไหน</h3>
      <p className="text-sm text-slate-500 mt-1">การเปลี่ยนโหมดทำที่ศูนย์ควบคุม หน้านี้มีไว้อ่านประกอบการตัดสินใจ</p>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {SYSTEM_MODES.map((m) => {
          const isActive = systemMode === m.id;
          const Icon = m.Icon;
          return (
            <div
              key={m.id}
              className={`p-4 rounded-lg border ${isActive ? "border-[#8A2680] bg-purple-50/60" : "border-slate-200 bg-white"}`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#8A2680]" : "text-slate-500"}`} aria-hidden />
                <span className={`text-sm font-semibold ${isActive ? "text-[#8A2680]" : "text-slate-900"}`}>{m.short} ({m.thai})</span>
                {isActive && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#8A2680]/30 text-[#8A2680]">
                    <Check className="w-3 h-3" aria-hidden /> ใช้อยู่ตอนนี้
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed break-words">{m.when}</p>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed break-words">
                นักศึกษาเห็น {m.students}
              </p>
              {m.note && (
                <p className="text-[11px] font-medium text-amber-800 mt-1.5 flex items-start gap-1 leading-relaxed break-words">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />{m.note}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

const SettingsTab = () => {
  const { stats } = useElectionState();
  // SEC-MOCK2, null = not known yet (the badge stays neutral until it is)
  const mockLoginStatus = stats && typeof stats.mockLoginProviderRegistered === "boolean"
    ? { providerRegistered: stats.mockLoginProviderRegistered }
    : null;

  return (
    <div className="space-y-5 max-w-6xl">
      <MockLoginStatusBadge status={mockLoginStatus} />
      <ReadinessCard />
      <ModeGuide />

      {/* Danger zone. Every line describes real behaviour in /api/admin/dashboard
          (POST), do not reword it away from what the route does.
          2026-07-28: the "clear votes" and "clear parties and members" buttons were
          removed (UI and server action). On production the fms_app account has no
          DELETE on the Ballot table by design (scripts/sql/ballot-grants.sql), so the
          buttons would fail on the day, and the yearly wipe is a staff job done in
          the database anyway: scripts/sql/annual-reset.sql */}
      <section className="rounded-xl border border-red-200 bg-white overflow-hidden" aria-labelledby="annual-title">
        <div className="flex items-start gap-3 px-5 py-4 bg-red-50 border-b border-red-200">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" aria-hidden />
          <div className="min-w-0">
            <h3 id="annual-title" className="text-base font-semibold text-red-800 break-words">
              ขึ้นปีการศึกษาใหม่
            </h3>
            <p className="text-xs text-red-700/80 mt-0.5 leading-relaxed break-words">
              การล้างข้อมูลกู้คืนไม่ได้ และไม่มีปุ่มในหน้านี้โดยตั้งใจ การรับรองผลอยู่ในขั้นตอนปิดการเลือกตั้งที่ศูนย์ควบคุม
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {/* The yearly wipe has no button. Say where it is done instead, so staff
              do not look for a button they saw last year and not find it. */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 break-words">
              <Trash2 className="w-4 h-4 shrink-0" aria-hidden />
              ล้างข้อมูลขึ้นปีใหม่ ทำที่ฐานข้อมูล ไม่ใช่ที่หน้านี้
            </h4>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed break-words">
              การล้างคะแนน บัตร และรายชื่อพรรค ทำโดยเจ้าหน้าที่ที่ดูแลฐานข้อมูลด้วย
              <code className="mx-1 px-1 py-0.5 bg-slate-200/70 rounded text-[11px]">scripts/sql/annual-reset.sql</code>
              หลังสำรองข้อมูลปีเก่าแล้ว
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">
              ทำไมไม่มีปุ่ม: บัญชีฐานข้อมูลที่เว็บใช้ถูกตั้งให้ <strong>เพิ่มบัตรได้แต่ลบบัตรไม่ได้</strong>
              โดยตั้งใจ เป็นหลักประกันว่าผลเลือกตั้งที่ลงไปแล้วแก้ไม่ได้ แม้แต่จากหน้าแอดมิน
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsTab;
