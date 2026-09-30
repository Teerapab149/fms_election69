'use client';

import { useState, useEffect } from 'react';
import { getPath } from "../../utils/basePath";
import CompletedActionModal from "../CompletedActionModal";
import ErrorActionModal from "../ErrorActionModal";
import ConfirmModal from "../ConfirmModal";
import { AlertTriangle, CalendarDays, Power, PieChart as PieIcon, Trash2, Hourglass, Zap, X, Loader2, CheckCircle2, XCircle, ShieldCheck, Wrench } from "lucide-react";
import { resolveElectionDates, parseBangkok, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";
import { checkSetMode, describeModeChange, MODE_LABEL } from "../../lib/election/adminGuards.mjs";

// ── SEC-MOCK2 · สถานะการเข้าสู่ระบบจำลอง (read-only) ─────────────────────────
// แสดงให้แอดมินเห็นทันทีโดยไม่ต้องกด "ตรวจตอนนี้". ค่าที่ใช้มาจาก GET
// /api/admin/dashboard ซึ่งอ่านฝั่ง server ตอน runtime — ห้ามอ่าน
// NEXT_PUBLIC_ENABLE_MOCK_LOGIN ตรงนี้ เพราะถูก inline ตอน build จึงรายงานสถานะ
// ของเครื่องที่ build ไม่ใช่เซิร์ฟเวอร์ที่กำลังรัน (บั๊กชนิดเดียวกับ ade160e)
// ตัวที่ "ให้สิทธิ์" จริงคือ providerRegistered — SEC-MOCK3 ตัด buttonVisible ทิ้งแล้ว
// เพราะปุ่มบนหน้า login อ่าน /api/auth/providers ตอน runtime จึงเป็นเงาของค่านี้เสมอ
// ⛔ ห้ามมีปุ่ม/สวิตช์เปิด-ปิดตรงนี้ — เป็นการตัดสินใจของเจ้าของระบบ (ดู DECISIONS.md)
const MockLoginStatusBadge = ({ status }) => {
  // ยังไม่รู้สถานะ (ก่อน fetch เสร็จ) — ต้องเป็นกลาง ห้ามโชว์สีเขียว "ปลอดภัย" ไปก่อน
  if (!status) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-2xl border bg-slate-50 border-slate-200">
        <Loader2 className="w-5 h-5 shrink-0 mt-0.5 text-slate-400 animate-spin" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">การเข้าสู่ระบบจำลอง · กำลังตรวจสอบสถานะ</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            กำลังอ่านค่าจากเซิร์ฟเวอร์ที่กำลังรันอยู่
          </p>
        </div>
      </div>
    );
  }

  const { providerRegistered } = status;

  // SEC-MOCK3: มีสองสถานะพอ ไม่มี "warn" อีกแล้ว — ปุ่มบนหน้า login อ่านจาก
  // /api/auth/providers ตอน runtime จึงเป็นเงาของ provider เสมอ สถานะ "ปิดแล้วแต่ปุ่ม
  // ยังโชว์" เกิดขึ้นไม่ได้ในทางโค้ดอีกต่อไป
  const tone = providerRegistered ? "danger" : "safe";
  const TONES = {
    danger: { box: "bg-rose-50 border-rose-200", icon: "text-rose-600", title: "text-rose-700" },
    safe: { box: "bg-emerald-50 border-emerald-100", icon: "text-emerald-600", title: "text-emerald-700" },
  };
  const t = TONES[tone];

  const title =
    tone === "danger"
      ? "การเข้าสู่ระบบจำลอง · เส้นทางเปิดอยู่บนเซิร์ฟเวอร์นี้"
      : "การเข้าสู่ระบบจำลอง · ปิดสนิท";

  const detail =
    tone === "danger"
      ? "mock-login provider ถูกลงทะเบียนอยู่ ใครที่รู้ URL callback ของ NextAuth เข้าระบบเป็นนักศึกษาคนใดก็ได้โดยไม่ต้องใช้รหัสผ่าน — เป็นเรื่องปกติของเครื่องนักพัฒนา และปิดเองอัตโนมัติเมื่อรันเป็น production build จึงไม่มีสวิตช์ให้กดตรงนี้"
      : "provider ไม่ถูกลงทะเบียนบนเซิร์ฟเวอร์นี้ และปุ่มบนหน้า login ก็ไม่แสดงตามไปด้วย — เข้าระบบได้ทางเดียวคือ PSU SSO จริง";

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${t.box}`}>
      {tone === "safe" ? (
        <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${t.icon}`} />
      ) : (
        <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${t.icon}`} />
      )}
      <div className="min-w-0">
        <p className={`text-sm font-bold ${t.title}`}>{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
};

// ── ADM-1 · Election readiness check ────────────────────────────────────────
// ปุ่มเดียวที่กรรมการกดก่อนวันจริงเพื่อดูทุกอย่างที่ยังไม่พร้อม. read-only ล้วน —
// เรียก GET /api/admin/readiness แล้วแสดงผลตาม level (pass/warn/fail).
const READINESS_LEVEL = {
  pass: { Icon: CheckCircle2, cls: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100",
    label: "ผ่าน", chip: "text-emerald-600", chipOn: "bg-emerald-600 text-white border-emerald-600", rank: 2 },
  warn: { Icon: AlertTriangle, cls: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100",
    label: "เตือน", chip: "text-amber-600", chipOn: "bg-amber-500 text-white border-amber-500", rank: 1 },
  fail: { Icon: XCircle, cls: "text-red-600", bg: "bg-red-50", border: "border-red-100",
    label: "ไม่ผ่าน", chip: "text-red-600", chipOn: "bg-red-600 text-white border-red-600", rank: 0 },
};
// เรียง ไม่ผ่าน → เตือน → ผ่าน เสมอ คนกดตรวจเพื่อหา "อะไรยังไม่พร้อม" ไม่ได้กดมาอ่าน
// ของที่ผ่านแล้ว ของเดิมเรียงตามลำดับที่ API ตรวจ ข้อที่พังจึงไปแอบอยู่กลางรายการ
const LEVEL_ORDER = ["fail", "warn", "pass"];

const ReadinessCard = () => {
  const globalConfig = useGlobalConfig();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fixing, setFixing] = useState(false);
  const [fixMessage, setFixMessage] = useState(null);
  // null = แสดงทุกระดับ · "fail" | "warn" | "pass" = ดูเฉพาะระดับนั้น
  const [levelFilter, setLevelFilter] = useState(null);

  const { CAMPAIGN_START, ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);
  const scheduleRows = [
    { label: "เปิดตัวผู้สมัคร", key: "campaignStartAt", date: CAMPAIGN_START },
    { label: "เปิดหีบ", key: "electionStartAt", date: ELECTION_START },
    { label: "ปิดหีบ", key: "electionEndAt", date: ELECTION_END },
  ];

  // เรียงก่อนเสมอ แล้วค่อยกรอง — ตัวเลขบนชิปยังนับจากผลเต็มชุด ไม่ใช่จากที่กรองแล้ว
  const sortedChecks = result
    ? [...result.checks].sort((a, b) => {
        const ra = READINESS_LEVEL[a.level]?.rank ?? 1;
        const rb = READINESS_LEVEL[b.level]?.rank ?? 1;
        return ra - rb;   // ลำดับเดิมภายในระดับเดียวกันคงไว้ (sort เสถียรใน JS)
      })
    : [];
  const visibleChecks = levelFilter ? sortedChecks.filter((c) => c.level === levelFilter) : sortedChecks;

  const runCheck = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(getPath("/api/admin/readiness"), { credentials: "include" });
      if (!res.ok) throw new Error(`สถานะ ${res.status}`);
      const data = await res.json();
      setResult(data);
      setLevelFilter(null);
    } catch (e) {
      setError("ตรวจไม่สำเร็จ — " + e.message);
    } finally {
      setRunning(false);
    }
  };

  // ซ่อมตัวเลือกในบัตรให้ตรงกับจำนวนพรรคจริง (งดออกเสียง เบอร์ 0 · ไม่รับรอง เบอร์ -1)
  // ปุ่มนี้โผล่เฉพาะตอน readiness ฟ้องว่าตัวเลือกขาด แล้วตรวจซ้ำให้เองหลังซ่อมเสร็จ
  const syncBallotOptions = async () => {
    setFixing(true);
    setError(null);
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
      await runCheck();
    } catch (e) {
      setError("สร้างตัวเลือกไม่สำเร็จ — " + e.message);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-[#8A2680]/10 text-[#8A2680] p-2.5 rounded-xl"><ShieldCheck className="h-6 w-6" /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-700">ตรวจความพร้อมระบบ · READINESS</h3>
            <p className="text-sm text-slate-500">กดก่อนวันเลือกตั้งจริงเพื่อดูทุกอย่างที่ยังไม่พร้อม</p>
          </div>
        </div>
        <button
          onClick={runCheck}
          disabled={running}
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#8A2680] text-white rounded-lg font-bold text-sm shadow-md hover:bg-[#7a2270] transition-all disabled:opacity-50"
        >
          {running ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังตรวจ</> : <><ShieldCheck className="w-4 h-4" /> ตรวจตอนนี้</>}
        </button>
      </div>

      {/* สรุป schedule ปัจจุบัน (resolved จริง) */}
      <div className="mb-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">กำหนดการปัจจุบัน</h4>
        <div className="space-y-2">
          {scheduleRows.map((r) => {
            const fromDb = parseBangkok(globalConfig?.[r.key]) !== null;
            return (
              <div key={r.key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-bold text-slate-600">{r.label}</span>
                <span className="flex items-center gap-2">
                  <span className="text-slate-700">{formatThaiDate(r.date)} · {formatThaiTime(r.date)}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${fromDb ? "bg-[#8A2680]/10 text-[#8A2680]" : "bg-slate-200 text-slate-500"}`}>
                    {fromDb ? "DB" : "ค่าเริ่มต้น"}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start justify-between gap-3">
          <span className="min-w-0">{error}</span>
          <button
            onClick={() => setError(null)}
            title="ปิดข้อความนี้"
            className="shrink-0 text-red-400 hover:text-red-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {fixMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-start justify-between gap-3">
          <span className="min-w-0">{fixMessage}</span>
          <button
            onClick={() => setFixMessage(null)}
            title="ปิดข้อความนี้"
            className="shrink-0 text-emerald-400 hover:text-emerald-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {result && (
        <div>
          {/* สรุปหัว + ปุ่มปิดผลการตรวจ (ผลยาว ไม่ควรค้างเต็มหน้าจอ) */}
          <div className="flex flex-wrap items-center gap-2 mb-4 text-sm font-bold">
            {/* ชิปสรุปเป็นปุ่มกรองในตัว — กดเพื่อดูเฉพาะระดับนั้น กดซ้ำเพื่อกลับมาดูทั้งหมด
                ตัวเลขยังนับจากผลเต็มชุดเสมอ ไม่เปลี่ยนตามตัวกรอง */}
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors max-md:min-h-[40px]
                    ${on ? lv.chipOn : `bg-white border-slate-200 ${lv.chip} hover:bg-slate-50`}
                    ${count === 0 && !on ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <LvIcon className="w-4 h-4" /> {lv.label} {count}
                </button>
              );
            })}
            {levelFilter && (
              <button
                type="button"
                onClick={() => setLevelFilter(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 transition-colors max-md:min-h-[40px]"
              >
                ดูทั้งหมด
              </button>
            )}
            <button
              onClick={() => setResult(null)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 transition-colors max-md:min-h-[40px] max-md:px-4"
            >
              <X className="w-3.5 h-3.5" />
              ปิดผลการตรวจ
            </button>
          </div>

          <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
            {visibleChecks.map((c) => {
              const lv = READINESS_LEVEL[c.level] || READINESS_LEVEL.warn;
              const Icon = lv.Icon;
              return (
                <div key={c.id} className={`flex items-start gap-3 p-3 rounded-xl border ${lv.bg} ${lv.border}`}>
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${lv.cls}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{c.detail}</p>
                    {/* ข้อเดียวที่ซ่อมได้ด้วยปุ่ม: ตัวเลือกพิเศษของบัตรหายไปจากฐานข้อมูล
                        (เกิดกับ DB ที่ตั้งพรรคไว้ก่อนระบบ sync จะมี หรือ import ข้อมูลมา) */}
                    {c.id === "candidates.single" && c.level !== "pass" && (
                      <button
                        onClick={syncBallotOptions}
                        disabled={fixing}
                        className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#8A2680] text-white text-xs font-bold hover:bg-[#7a2270] transition-colors disabled:opacity-50 max-md:min-h-[40px] max-md:px-4"
                      >
                        {fixing
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังสร้าง</>
                          : <><Wrench className="w-3.5 h-3.5" /> สร้างตัวเลือกที่ขาดให้อัตโนมัติ</>}
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
        </div>
      )}

      {!result && !error && (
        <p className="text-sm text-slate-400 text-center py-4">กด “ตรวจตอนนี้” เพื่อเริ่มตรวจความพร้อม</p>
      )}
    </div>
  );
};

// ── ADM-SETTINGS · โหมดระบบ 4 แบบ ────────────────────────────────────────────
// แหล่งเดียวของทั้งปุ่มเลือกโหมดและการ์ดคำอธิบาย เพื่อไม่ให้ข้อความสองที่หลุดจากกัน.
// คำอธิบายอิงพฤติกรรมจริง: SET_MODE เขียน SystemConfig.systemMode แล้ว
// resolveElectionDates()/check-status เอาไปตัดสินว่าหีบเปิดหรือปิด.
const SYSTEM_MODES = [
  {
    id: 'AUTO',
    label: 'AUTO (อัตโนมัติ)',
    color: 'bg-green-500',
    dot: 'bg-green-500',
    ring: 'border-green-300 bg-green-50',
    text: 'text-green-700',
    Icon: CalendarDays,
    status: 'ระบบทำงานอัตโนมัติตามกำหนดเวลา',
    when: 'ใช้เมื่อกำหนดการแน่นอนแล้ว — ระบบดูวันเวลาใน “ตั้งค่าทั่วไป” แล้วเปิด-ปิดหีบเอง (โหมดปกติ)',
    students: 'หน้านับถอยหลังก่อนถึงเวลา แล้วโหวตได้เองเมื่อถึงเวลาเปิดหีบ',
  },
  {
    id: 'MANUAL_OPEN',
    label: 'OPEN (เปิดระบบ)',
    color: 'bg-blue-600',
    dot: 'bg-blue-600',
    ring: 'border-blue-300 bg-blue-50',
    text: 'text-blue-700',
    Icon: Zap,
    status: 'เปิดรับคะแนนด้วยตนเอง (Force Open)',
    when: 'ใช้เมื่อตั้ง AUTO ไว้แล้วระบบไม่เปิดหีบตามเวลาที่กำหนด จึงต้องเปิดเอง หรือต้องการเปิดก่อนกำหนด/ทดสอบระบบ — บังคับเปิดรับคะแนนทันที ไม่สนวันเวลาที่ตั้งไว้',
    students: 'หน้าลงคะแนนทันที แม้ยังไม่ถึงเวลาเปิดหีบตามกำหนด',
    // owner 2026-10-01: OPEN stays open on purpose — say so wherever it is chosen
    note: 'OPEN จะไม่เปลี่ยนเป็น ENDED เอง แม้เลยเวลาปิดหีบแล้ว · เมื่อหมดเวลาเลือกตั้ง ต้องกลับมากด ENDED ด้วยตัวเอง',
  },
  {
    id: 'PAUSE',
    label: 'PAUSE (ระงับ)',
    color: 'bg-orange-500',
    dot: 'bg-orange-500',
    ring: 'border-orange-300 bg-orange-50',
    text: 'text-orange-700',
    Icon: Hourglass,
    status: 'ระงับการโหวตชั่วคราว (maintenance)',
    when: 'ใช้เมื่อต้องแก้ข้อมูลกลางคันหรือระบบมีปัญหา แล้วจะกลับมาเปิดต่อ — หยุดรับคะแนนชั่วคราว',
    students: 'หน้าพักระบบ โหวตไม่ได้จนกว่าจะเปลี่ยนโหมดกลับ',
  },
  {
    id: 'ENDED',
    label: 'ENDED (ปิดระบบ)',
    color: 'bg-red-500',
    dot: 'bg-red-500',
    ring: 'border-red-300 bg-red-50',
    text: 'text-red-700',
    Icon: Power,
    status: 'ปิดการเลือกตั้งอย่างเป็นทางการ',
    when: 'ใช้เมื่อการเลือกตั้งจบแล้ว หรือตั้ง AUTO ไว้แล้วระบบไม่ปิดหีบตามเวลาที่กำหนด จึงต้องปิดเอง — ปิดหีบอย่างเป็นทางการ ไม่รับคะแนนอีก',
    students: 'หน้าปิดหีบ และดูผลคะแนนได้เมื่อเปิดการแสดงผล',
  },
];

// ── ขั้นตอนปิดการเลือกตั้ง ─────────────────────────────────────────────────────
// What happens after voting, in the only order that is safe: close the box →
// publish → (optionally) staff certify. Each step's button opens only when the
// one before is done; the server enforces the same order (lib/election/
// adminGuards + the certify guard), this screen shows it. No IT-check step:
// the committee publishes straight after closing (owner 2026-10-01).
const STEP_STYLE = {
  done:    { badge: 'bg-green-600 text-white border-green-600', row: 'bg-white border-green-200', label: 'เสร็จแล้ว', labelCls: 'text-green-700' },
  current: { badge: 'bg-[#8A2680] text-white border-[#8A2680]', row: 'bg-white border-[#8A2680]/40 shadow-sm', label: 'ขั้นนี้', labelCls: 'text-[#8A2680]' },
  locked:  { badge: 'bg-white text-slate-400 border-slate-300', row: 'bg-slate-50 border-slate-200', label: 'รอขั้นก่อนหน้า', labelCls: 'text-slate-500' },
};

const ClosingSteps = ({ systemMode, boxClosed, isShowResult, certified, schedule, processing, onCloseBox, onPublish, onHide, onCertify }) => {
  const endText = schedule.end ? formatThaiDate(schedule.end) + ' · ' + formatThaiTime(schedule.end) : '';
  const closedHow = systemMode === 'ENDED' ? 'ปิดด้วยโหมด ENDED' : 'ปิดตามเวลา' + (endText ? ' · ' + endText : '');
  const done = [boxClosed, isShowResult || certified, certified];
  const current = done.findIndex((d) => !d);
  const state = (i) => (done[i] ? 'done' : i === current ? 'current' : 'locked');
  const btn = 'shrink-0 inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed';

  const steps = [
    {
      title: 'ปิดหีบ',
      desc: 'หยุดรับคะแนน · โหมด AUTO ปิดเองเมื่อถึงเวลาปิดหีบ · ถ้าใช้ OPEN อยู่ ต้องกด ENDED เอง',
      status: boxClosed ? closedHow : 'หีบยังเปิดรับคะแนนอยู่',
      action: !boxClosed && !certified && (
        <button type="button" onClick={onCloseBox} disabled={processing} className={btn + ' bg-red-600 text-white hover:bg-red-700'}>
          <Power className="w-4 h-4" /> ปิดหีบตอนนี้ (ENDED)
        </button>
      ),
    },
    {
      title: 'ประกาศผล',
      desc: 'เปิดให้ทุกคนเห็นคะแนนรายพรรคและสถิติผู้ใช้สิทธิ์ที่หน้าผลคะแนน · เมื่อประกาศแล้ว เปิดหีบอีกไม่ได้จนกว่าจะซ่อนผล',
      status: isShowResult ? 'ประกาศแล้ว · ทุกคนเห็นผลคะแนน' : (boxClosed ? 'พร้อมประกาศ' : 'ประกาศได้หลังปิดหีบ'),
      action: isShowResult
        ? (!certified && (
          <button type="button" onClick={onHide} disabled={processing} className={btn + ' bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'}>
            ซ่อนผล
          </button>))
        : (
          <button type="button" onClick={onPublish} disabled={processing || !boxClosed}
            title={!boxClosed ? 'ประกาศได้หลังปิดหีบแล้วเท่านั้น' : undefined}
            className={btn + ' bg-[#8A2680] text-white hover:bg-[#7a2270]'}>
            <PieIcon className="w-4 h-4" /> ประกาศผล
          </button>
        ),
    },
    {
      title: 'รับรองผลอย่างเป็นทางการ',
      optional: true,
      desc: 'บัญชีเจ้าหน้าที่คณะเท่านั้น (กรรมการสโมฯ กดไม่ได้) · บันทึกชื่อผู้รับรองกับวันเวลา ขึ้นเป็นแถบรับรองบนหน้าผลคะแนน · ไม่มีการลบข้อมูลใด ๆ · กดแล้วย้อนกลับไม่ได้ เปิดหีบใหม่ไม่ได้อีกในการเลือกตั้งครั้งนี้',
      status: certified ? 'รับรองแล้ว' : (isShowResult && boxClosed ? 'พร้อมรับรอง' : 'รับรองได้หลังประกาศผล'),
      action: !certified && (
        <button type="button" onClick={onCertify} disabled={processing || !isShowResult || !boxClosed}
          title={!isShowResult ? 'ต้องประกาศผลก่อน' : undefined}
          className={btn + ' bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-600 hover:text-white'}>
          <ShieldCheck className="w-4 h-4" /> รับรองผล
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 max-sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <h4 className="text-lg font-bold text-slate-800">ขั้นตอนปิดการเลือกตั้ง</h4>
      <p className="text-sm text-slate-500 mt-1">ทำตามลำดับ · ปุ่มของขั้นถัดไปจะกดได้เมื่อขั้นก่อนหน้าเสร็จแล้ว</p>
      <ol className="mt-5 space-y-3">
        {steps.map((st, i) => {
          const k = state(i); const sty = STEP_STYLE[k];
          return (
            <li key={st.title} className={'flex gap-4 p-4 rounded-xl border ' + sty.row + ' max-sm:flex-col max-sm:gap-3 max-sm:p-3'}>
              <div className="flex gap-4 max-sm:gap-3 min-w-0 flex-1">
                <span className={'shrink-0 w-9 h-9 max-sm:w-7 max-sm:h-7 max-sm:text-xs rounded-full border-2 flex items-center justify-center text-sm font-black ' + sty.badge} aria-hidden>
                  {k === 'done' ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="text-base font-bold text-slate-800">{st.title}</h5>
                    <span className={'text-[11px] font-bold ' + sty.labelCls}>· {sty.label}</span>
                    {st.optional && <span className="text-[11px] font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">ไม่บังคับ</span>}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">{st.desc}</p>
                  <p className={'text-xs font-bold mt-1.5 break-words ' + (k === 'done' ? 'text-green-700' : 'text-slate-700')}>{st.status}</p>
                </div>
              </div>
              {st.action && <div className="sm:self-center max-sm:pl-10">{st.action}</div>}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

const SettingsTab = () => {
  const [systemMode, setSystemMode] = useState("AUTO");
  const [isShowResult, setIsShowResult] = useState(false);
  // from the server: whether the box is closed now, the schedule, certification —
  // the same facts the API checks (lib/election/adminGuards)
  const [boxClosed, setBoxClosed] = useState(false);
  const [schedule, setSchedule] = useState({ start: null, end: null });
  const [certified, setCertified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  // SEC-MOCK2 · null = ยังไม่รู้ (badge แสดงสถานะเป็นกลางจนกว่าจะรู้จริง)
  const [mockLoginStatus, setMockLoginStatus] = useState(null);

  const [activeModal, setActiveModal] = useState(null);
  const [pendingMode, setPendingMode] = useState(null);

  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', msg: '' });

  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', msg: '' });

  // re-read after every action instead of flipping local state: another admin
  // may have changed something in the meantime, and the screen must show what
  // the server now holds
  const fetchConfig = async () => {
      try {
        const res = await fetch(getPath('/api/admin/dashboard'), { credentials: 'include' });
        const data = await res.json();
        if (data.stats) {
          setSystemMode(data.stats.systemMode || "AUTO");
          setIsShowResult(data.stats.showResult);
          setBoxClosed(!!data.stats.boxClosed);
          setCertified(!!data.stats.certified);
          setSchedule({ start: data.stats.electionStart ? new Date(data.stats.electionStart) : null, end: data.stats.electionEnd ? new Date(data.stats.electionEnd) : null });
          if (typeof data.stats.mockLoginProviderRegistered === "boolean") {
            setMockLoginStatus({ providerRegistered: data.stats.mockLoginProviderRegistered });
          }
        }
      } catch (error) {
        console.error("Failed to fetch config", error);
      } finally {
        setLoading(false);
      }
  };
  useEffect(() => { fetchConfig(); }, []);

  const handleConfirmAction = async () => {
    if (!activeModal) return;

    setProcessing(true);
    try {
      let action = activeModal;
      let body = { action };

      if (action === 'SET_MODE') {
        body.mode = pendingMode;
      }
      if (action === 'SET_SHOW_RESULT') {
        body.value = !isShowResult; // the value the admin saw the switch offer
      }

      const res = await fetch(getPath('/api/admin/dashboard'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setActiveModal(null);

      if (res.ok) {
        if (action === 'SET_MODE') {
          setSuccessMessage({ title: 'บันทึกสำเร็จ!', msg: `เปลี่ยนโหมดระบบเป็น ${MODE_LABEL[pendingMode] || pendingMode} เรียบร้อยแล้ว` });
        } else if (action === 'SET_SHOW_RESULT') {
          setSuccessMessage({ title: 'บันทึกสำเร็จ!', msg: isShowResult ? 'ซ่อนผลคะแนนแล้ว' : 'เปิดแสดงผลคะแนนแล้ว ทุกคนดูผลได้ที่หน้าผลคะแนน' });
        } else if (action === 'ANONYMIZE_BALLOTS') {
          // ⚠️ AUD-COPY · v2-SEC: action นี้ "ไม่ได้ลบ" อะไรเลย — มันตั้งธง
          // globalConfig.ballotsAnonymized = true (ธงรับรองผล) เท่านั้น
          // (dashboard/route.js POST). ไม่มีลิงก์ผู้ลงคะแนน→พรรคในฐานข้อมูลตั้งแต่แรก
          // (Ballot ไม่มี userId, User ไม่มี candidateId) ข้อความเดิมเขียนว่า
          // "ความเชื่อมโยง...ถูกลบถาวรแล้ว" ซึ่งผิด และขัดกับการ์ดในหน้าเดียวกัน
          setSuccessMessage({ title: 'รับรองผลเรียบร้อย!', msg: 'ปักธงรับรองผลแล้ว คะแนนรวมของทุกพรรคถูกล็อกไว้ครบ · บัตรทุกใบไม่มีลิงก์ถึงผู้ลงคะแนนอยู่แล้วตั้งแต่ตอนบันทึก จึงไม่มีข้อมูลรายบุคคลเหลือให้ลบ' });
        }
        setIsSuccessOpen(true);
        fetchConfig();
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage({ title: `ดำเนินการไม่สำเร็จ (${res.status})`, msg: errData.error || res.statusText });
        setIsErrorOpen(true);
        fetchConfig();
      }
    } catch (error) {
      console.error("Action failed!", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleModeChange = (newMode) => {
    if (newMode === systemMode) return; // ✅ Prevent redundant actions
    setPendingMode(newMode);
    setActiveModal('SET_MODE');
  };

  // โหมดที่ใช้อยู่ (fallback = AUTO ให้ตรงกับ default ฝั่ง API)
  const activeMode = SYSTEM_MODES.find((m) => m.id === systemMode) || SYSTEM_MODES[0];

  return (
    <div className="space-y-6">
    <MockLoginStatusBadge status={mockLoginStatus} />
    <ReadinessCard />
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl"><Power className="h-6 w-6" /></div>
        <h3 className="text-xl font-bold text-slate-700">ตั้งค่าระบบเลือกตั้ง (System Mode)</h3>
      </div>

      <div className='space-y-6'>
        {/* --- 3-WAY MODE SELECTOR --- */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-800">ระบบการทำงาน</h4>
              <p className="text-sm text-slate-500">เลือกโหมดการทำงานของระบบให้เหมาะสมกับสถานการณ์ปัจจุบัน</p>
            </div>

            {/* ADM-MOBILE: <768px the four buttons become a full-width stack (1 col
                <640, 2 cols 640-767) so each stays a comfortable tap target instead
                of a ragged left-aligned pile. max-md: only → desktop CSS untouched. */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200 max-md:grid max-md:grid-cols-1 sm:max-md:grid-cols-2">
              {SYSTEM_MODES.map((m) => {
                const blocked = systemMode !== m.id && checkSetMode({ mode: m.id, showResult: isShowResult, certified, end: schedule.end });
                return (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  title={blocked || undefined}
                  disabled={systemMode === m.id || processing || !!blocked}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all max-md:justify-center ${systemMode === m.id
                    ? `${m.color} text-white shadow-lg cursor-default`
                    : 'text-slate-500 hover:bg-slate-300 disabled:opacity-50'
                    }`}
                >
                  <m.Icon className="w-4 h-4" />
                  {m.label}
                </button>
                );
              })}
            </div>
          </div>
          {isShowResult && !certified && (
            <p className="mt-3 text-xs font-bold text-amber-700 flex items-start gap-1.5 leading-relaxed break-words">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              ผลคะแนนกำลังแสดงอยู่ จึงเปิดหีบหรือพักระบบไม่ได้ · ถ้าต้องเปิดหีบอีกครั้ง ให้ปิดการแสดงผลก่อน
            </p>
          )}

          {/* Current Status Badge */}
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 py-3 px-4 bg-white/60 rounded-xl border border-dashed border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Status:</span>
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-2 h-2 shrink-0 rounded-full animate-pulse ${activeMode.dot}`} />
              <span className="text-sm font-black text-slate-700 break-words">{activeMode.status}</span>
            </div>
            {activeMode.note && (
              <span className="basis-full text-xs font-bold text-blue-700 break-words">{activeMode.note}</span>
            )}
          </div>

          {/* ── คู่มือเลือกโหมด — โหมดไหนใช้กรณีไหน ─────────────────────────── */}
          <div className="mt-5">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">แต่ละโหมดใช้ตอนไหน</h5>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {SYSTEM_MODES.map((m) => {
                const isActive = systemMode === m.id;
                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl border transition-colors ${isActive ? `${m.ring} shadow-sm` : 'border-slate-200 bg-white'}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`w-2.5 h-2.5 shrink-0 rounded-full ${m.dot}`} />
                      <span className={`text-sm font-black ${isActive ? m.text : 'text-slate-700'}`}>{m.label}</span>
                      {isActive && (
                        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-500 uppercase tracking-wider">
                          ใช้อยู่ตอนนี้
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed break-words">{m.when}</p>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed break-words">
                      นักศึกษาเห็น {m.students}
                    </p>
                    {m.note && (
                      <p className="text-[11px] font-bold text-blue-700 mt-1.5 flex items-start gap-1 leading-relaxed break-words">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{m.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <ClosingSteps
          systemMode={systemMode} boxClosed={boxClosed} isShowResult={isShowResult} certified={certified}
          schedule={schedule} processing={processing || loading}
          onCloseBox={() => handleModeChange('ENDED')}
          onPublish={() => setActiveModal('SET_SHOW_RESULT')}
          onHide={() => setActiveModal('SET_SHOW_RESULT')}
          onCertify={() => setActiveModal('ANONYMIZE_BALLOTS')}
        />

        <div className='p-3' />

        {/* ── โซนอันตราย — คำอธิบายทุกบรรทัดอิงพฤติกรรมจริงใน /api/admin/dashboard
            (POST) ตรง ๆ ห้ามแก้ถ้อยคำให้หลุดจากสิ่งที่ route ทำจริง
            2026-07-28: ปุ่ม "ล้างคะแนน" กับ "ล้างพรรคและสมาชิก" ถูกถอดออก (ทั้ง UI และ
            action ฝั่ง server) — บน production บัญชี fms_app ไม่มีสิทธิ์ DELETE บนตาราง
            Ballot โดยตั้งใจ (scripts/sql/ballot-grants.sql) ปุ่มจึงพังแน่นอนวันที่กด
            และการล้างข้อมูลขึ้นปีใหม่เป็นงานที่เจ้าหน้าที่ทำที่ฐานข้อมูลอยู่แล้ว
            → scripts/sql/annual-reset.sql */}
        <div className="rounded-2xl border-2 border-red-200 bg-red-50/40 overflow-hidden">
          <div className="flex items-start gap-3 px-5 py-4 bg-red-50 border-b border-red-200">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <div className="min-w-0">
              <h4 className="text-base sm:text-lg font-black text-red-800 break-words">
                ขึ้นปีการศึกษาใหม่
              </h4>
              <p className="text-xs text-red-700/70 mt-0.5 leading-relaxed break-words">
                การล้างข้อมูลกู้คืนไม่ได้ และไม่มีปุ่มในหน้านี้โดยตั้งใจ · การรับรองผลย้ายไปอยู่ในขั้นตอนปิดการเลือกตั้งด้านบน
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            {/* การล้างข้อมูลขึ้นปีใหม่ไม่มีปุ่มแล้ว — อธิบายว่าไปทำที่ไหนแทน ไม่ปล่อยให้
                เจ้าหน้าที่หาปุ่มที่เคยเห็นเมื่อปีก่อนแล้วไม่เจอ */}
            <div className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200">
              <h5 className="text-base font-bold text-slate-700 flex items-center gap-2 break-words">
                <Trash2 className="w-4 h-4 shrink-0" />
                ล้างข้อมูลขึ้นปีใหม่ — ทำที่ฐานข้อมูล ไม่ใช่ที่หน้านี้
              </h5>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed break-words">
                การล้างคะแนน บัตร และรายชื่อพรรค ทำโดยเจ้าหน้าที่ที่ดูแลฐานข้อมูลด้วย
                <code className="mx-1 px-1 py-0.5 bg-slate-100 rounded text-[11px]">scripts/sql/annual-reset.sql</code>
                หลังสำรองข้อมูลปีเก่าแล้ว
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">
                ทำไมไม่มีปุ่ม: บัญชีฐานข้อมูลที่เว็บใช้ถูกตั้งให้ <strong>เพิ่มบัตรได้แต่ลบบัตรไม่ได้</strong>
                โดยตั้งใจ — เป็นหลักประกันว่าผลเลือกตั้งที่ลงไปแล้วแก้ไม่ได้ แม้แต่จากหน้าแอดมิน
              </p>
            </div>

          </div>
        </div>
      </div>

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
        isOpen={activeModal === 'SET_MODE'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        title={`เปลี่ยนเป็น ${MODE_LABEL[pendingMode] || pendingMode}?`}
        message={describeModeChange({ from: systemMode, to: pendingMode, start: schedule.start, end: schedule.end })}
        variant="primary"
        isLoading={processing}
      />

      <ConfirmModal
        isOpen={activeModal === 'SET_SHOW_RESULT'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        title={isShowResult ? "ซ่อนผลคะแนน?" : "ประกาศผลคะแนน?"}
        /* ⚠️ AUD-COPY · results/route.js: hideTally = !showResult ปิดคะแนนรายพรรคกับ
           "ทุกคน" รวมแอดมิน (ไม่มี bypass) แต่ showBreakdown = isAdmin || showResult
           ทำให้ความคืบหน้าการใช้สิทธิ์ยังอยู่ในแท็บภาพรวมของแอดมินเสมอ ข้อความเดิมบอกว่า
           "ข้อมูลสถิติ" ถูกปิดกั้นด้วย ซึ่งไม่จริงสำหรับแอดมิน */
        message={isShowResult
          ? "เมื่อซ่อนผลคะแนน คะแนนของแต่ละพรรคจะถูกปิดจากทุกคนรวมถึงแอดมินเอง · ความคืบหน้าการใช้สิทธิ์ในแท็บภาพรวมยังดูได้ตามปกติ"
          : "ทุกคนจะเห็นคะแนนรายพรรคและสถิติผู้ใช้สิทธิ์ที่หน้าผลคะแนนทันที · เมื่อประกาศแล้ว จะเปิดหีบอีกไม่ได้จนกว่าจะซ่อนผลก่อน"}
        variant="primary"
        isLoading={processing}
      />

      <ConfirmModal
        isOpen={activeModal === 'ANONYMIZE_BALLOTS'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        /* ⚠️ AUD-COPY · ข้อความนี้ต้องตรงกับการ์ดในโซนอันตรายและกับ dashboard/route.js:
           ANONYMIZE_BALLOTS ตั้งธง ballotsAnonymized = true (รับรองผล) เท่านั้น ไม่ลบข้อมูลใด
           ของเดิมเขียนว่าความเชื่อมโยง "ใครเลือกพรรคใด" จะถูกลบถาวร ซึ่งไม่จริง — ลิงก์นั้น
           ไม่เคยถูกเก็บ (v2-SEC) จึงไม่มีอะไรให้ลบ */
        title="รับรองผลอย่างเป็นทางการ?"
        message={`นี่คือการปักธงรับรองผลครั้งสุดท้าย — คะแนนรวมของทุกพรรคถูกล็อก เครื่องมือตรวจสอบจะไม่แก้ไขฐานข้อมูลอีก · ระบบไม่เคยเก็บว่าใครเลือกพรรคใด บัตรทุกใบถูกบันทึกแบบไม่มีชื่อผู้ลงคะแนนอยู่แล้ว จึงไม่มีข้อมูลรายบุคคลเหลือให้ลบ · กดแล้วย้อนกลับไม่ได้`}
        variant="danger"
        isLoading={processing}
      />

    </div >
    </div>
  )
};

export default SettingsTab;
