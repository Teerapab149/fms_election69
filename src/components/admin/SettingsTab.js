'use client';

import { useState, useEffect } from 'react';
import { getPath } from "../../utils/basePath";
import CompletedActionModal from "../CompletedActionModal";
import ErrorActionModal from "../ErrorActionModal";
import ConfirmModal from "../ConfirmModal";
import { AlertTriangle, CalendarDays, Power, PieChart as PieIcon, Trash2, Hourglass, Zap, X, Loader2, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { resolveElectionDates, parseBangkok, formatThaiDate, formatThaiTime } from "../../utils/electionConfig";
import { useGlobalConfig } from "../../contexts/GlobalConfigContext";

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
  pass: { Icon: CheckCircle2, cls: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  warn: { Icon: AlertTriangle, cls: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  fail: { Icon: XCircle, cls: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
};

const ReadinessCard = () => {
  const globalConfig = useGlobalConfig();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const { CAMPAIGN_START, ELECTION_START, ELECTION_END } = resolveElectionDates(globalConfig);
  const scheduleRows = [
    { label: "เปิดตัวผู้สมัคร", key: "campaignStartAt", date: CAMPAIGN_START },
    { label: "เปิดหีบ", key: "electionStartAt", date: ELECTION_START },
    { label: "ปิดหีบ", key: "electionEndAt", date: ELECTION_END },
  ];

  const runCheck = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(getPath("/api/admin/readiness"), { credentials: "include" });
      if (!res.ok) throw new Error(`สถานะ ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("ตรวจไม่สำเร็จ — " + e.message);
    } finally {
      setRunning(false);
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

      {result && (
        <div>
          {/* สรุปหัว + ปุ่มปิดผลการตรวจ (ผลยาว ไม่ควรค้างเต็มหน้าจอ) */}
          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm font-bold">
            <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> ผ่าน {result.summary.pass}</span>
            <span className="flex items-center gap-1.5 text-amber-600"><AlertTriangle className="w-4 h-4" /> เตือน {result.summary.warn}</span>
            <span className="flex items-center gap-1.5 text-red-600"><XCircle className="w-4 h-4" /> ไม่ผ่าน {result.summary.fail}</span>
            <button
              onClick={() => setResult(null)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 transition-colors max-md:min-h-[40px] max-md:px-4"
            >
              <X className="w-3.5 h-3.5" />
              ปิดผลการตรวจ
            </button>
          </div>

          <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
            {result.checks.map((c) => {
              const lv = READINESS_LEVEL[c.level] || READINESS_LEVEL.warn;
              const Icon = lv.Icon;
              return (
                <div key={c.id} className={`flex items-start gap-3 p-3 rounded-xl border ${lv.bg} ${lv.border}`}>
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${lv.cls}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{c.detail}</p>
                  </div>
                </div>
              );
            })}
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

const SettingsTab = () => {
  const [systemMode, setSystemMode] = useState("AUTO");
  const [isShowResult, setIsShowResult] = useState(false);
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

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(getPath('/api/admin/dashboard'), { credentials: 'include' });
        const data = await res.json();
        if (data.stats) {
          setSystemMode(data.stats.systemMode || "AUTO");
          setIsShowResult(data.stats.showResult);
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
    fetchConfig();
  }, []);

  const handleConfirmAction = async () => {
    if (!activeModal) return;

    setProcessing(true);
    try {
      let action = activeModal;
      let body = { action };

      if (action === 'SET_MODE') {
        body.mode = pendingMode;
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
          setSuccessMessage({ title: 'บันทึกสำเร็จ!', msg: `เปลี่ยนโหมดระบบเป็น ${pendingMode} เรียบร้อยแล้ว` });
          setSystemMode(pendingMode);
        } else if (action === 'TOGGLE_SHOW_RESULT') {
          setSuccessMessage({ title: 'บันทึกสำเร็จ!', msg: 'การตั้งค่าการแสดงผลได้ถูกเปลี่ยนแปลงเรียบร้อยแล้ว' });
          setIsShowResult(!isShowResult);
        } else if (action === 'ANONYMIZE_BALLOTS') {
          // ⚠️ AUD-COPY · v2-SEC: action นี้ "ไม่ได้ลบ" อะไรเลย — มันตั้งธง
          // globalConfig.ballotsAnonymized = true (ธงรับรองผล) เท่านั้น
          // (dashboard/route.js POST). ไม่มีลิงก์ผู้ลงคะแนน→พรรคในฐานข้อมูลตั้งแต่แรก
          // (Ballot ไม่มี userId, User ไม่มี candidateId) ข้อความเดิมเขียนว่า
          // "ความเชื่อมโยง...ถูกลบถาวรแล้ว" ซึ่งผิด และขัดกับการ์ดในหน้าเดียวกัน
          setSuccessMessage({ title: 'รับรองผลเรียบร้อย!', msg: 'ปักธงรับรองผลแล้ว คะแนนรวมของทุกพรรคถูกล็อกไว้ครบ · บัตรทุกใบไม่มีลิงก์ถึงผู้ลงคะแนนอยู่แล้วตั้งแต่ตอนบันทึก จึงไม่มีข้อมูลรายบุคคลเหลือให้ลบ' });
        }
        setIsSuccessOpen(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage({ title: `ดำเนินการไม่สำเร็จ (${res.status})`, msg: errData.error || res.statusText });
        setIsErrorOpen(true);
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
              {SYSTEM_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  disabled={systemMode === m.id || processing} // ✅ Disable if same mode or processing
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all max-md:justify-center ${systemMode === m.id
                    ? `${m.color} text-white shadow-lg cursor-default`
                    : 'text-slate-500 hover:bg-slate-300 disabled:opacity-50'
                    }`}
                >
                  <m.Icon className="w-4 h-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Status Badge */}
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 py-3 px-4 bg-white/60 rounded-xl border border-dashed border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Status:</span>
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-2 h-2 shrink-0 rounded-full animate-pulse ${activeMode.dot}`} />
              <span className="text-sm font-black text-slate-700 break-words">{activeMode.status}</span>
            </div>
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ADM-MOBILE: <768px this stacks — the row layout squeezed the copy into a
            ~113px column and shrank the 64px toggle track to 45px (knob spilled out). */}
        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-100 max-md:flex-col max-md:items-start max-md:gap-5">
          <div>
            <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-purple-600" />
              การแสดงผลคะแนน
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              คะแนนจะเปิดให้ดูในหน้าผลคะแนนก็ต่อเมื่อเปิดสวิตช์นี้เท่านั้น · ปิดหีบอย่างเดียวยังไม่แสดงผล
            </p>
            <p className="text-[11px] font-bold text-amber-600 mt-1.5 flex items-start gap-1 leading-relaxed break-words">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              ไม่ควรเปิดระหว่างที่ยังเปิดให้ลงคะแนน เพราะคะแนนที่เห็นระหว่างทางอาจชี้นำคนที่ยังไม่ได้โหวต ทำให้การเลือกตั้งไม่ยุติธรรม · ปลอดภัยเมื่อเปิดหลังปิดหีบแล้ว
            </p>
          </div>

          <div className="flex items-center gap-4 max-md:w-full max-md:justify-between">
            <span className={`text-sm font-bold transition-colors ${isShowResult ? 'text-green-600' : 'text-red-500'}`}>
              {loading ? '' : (isShowResult ? '🟢 แสดงผล' : '🔴 ซ่อนผล')}
            </span>

            {loading ? '' : (
              <button
                onClick={() => setActiveModal('TOGGLE_SHOW_RESULT')}
                disabled={loading || processing}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shrink-0 max-md:before:absolute max-md:before:-inset-1.5 max-md:before:content-[''] ${isShowResult ? 'bg-green-500' : 'bg-gray-300'
                  } ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
              >
                <span className={`${isShowResult ? 'translate-x-9' : 'translate-x-1'} inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md`} />
              </button>
            )}
          </div>
        </div>

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
                โซนอันตราย · การกระทำที่กู้คืนไม่ได้
              </h4>
              <p className="text-xs text-red-700/70 mt-0.5 leading-relaxed break-words">
                ปุ่มในกล่องนี้เปลี่ยนข้อมูลจริงอย่างถาวร ไม่มีปุ่มย้อนกลับ อ่านคำอธิบายให้ครบก่อนกด
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

            {/* ANONYMIZE_BALLOTS (v2-SEC = ปักธงรับรองผล) — ต้อง ENDED/พ้นเวลาปิดหีบ
                + showResult จึงจะผ่าน guard; ตั้ง globalConfig.ballotsAnonymized = true */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 sm:p-5 bg-white rounded-xl border border-indigo-100 transition-colors hover:border-indigo-300">
              <div className="min-w-0">
                <h5 className="text-base font-bold text-indigo-800 flex items-center gap-2 break-words">
                  <Power className="w-4 h-4 shrink-0" />
                  ลบข้อมูลการลงคะแนนรายบุคคล (รับรองผล)
                </h5>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed break-words">
                  ปิดผลอย่างเป็นทางการ — ปักธงว่าคะแนนถูกล็อกแล้ว เครื่องมือตรวจสอบจะไม่แก้ไขฐานข้อมูลอีก · คะแนนรวมของทุกพรรคยังอยู่ครบ และบัตรทุกใบไม่มีลิงก์ถึงผู้ลงคะแนนอยู่แล้วตั้งแต่ตอนบันทึก จึงไม่มีข้อมูลว่า “ใครเลือกพรรคใด” เหลือให้ลบ
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">
                  ใช้เมื่อ ปิดหีบและเผยแพร่ผลเรียบร้อยแล้ว ต้องการรับรองผลเป็นครั้งสุดท้าย
                </p>
                <p className="text-[11px] font-bold text-indigo-600 mt-1.5 leading-relaxed break-words">
                  กู้คืนไม่ได้ · กดได้เฉพาะหลังปิดหีบและเปิดการแสดงผลคะแนนแล้วเท่านั้น
                </p>
              </div>

              <button
                onClick={() => setActiveModal('ANONYMIZE_BALLOTS')}
                disabled={processing || !isShowResult}
                title={!isShowResult ? 'ต้องเผยแพร่ผลก่อน' : ''}
                className="shrink-0 self-start flex items-center gap-2 px-5 py-2.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-indigo-600"
              >
                <Power className="w-4 h-4" />
                Anonymize
              </button>
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
        title="เปลี่ยนโหมดการทำงาน?"
        message={`คุณกำลังจะเปลี่ยนโหมดระบบเป็น "${pendingMode}" ยืนยันการดำเนินการหรือไม่?`}
        variant="primary"
        isLoading={processing}
      />

      <ConfirmModal
        isOpen={activeModal === 'TOGGLE_SHOW_RESULT'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleConfirmAction}
        title={isShowResult ? "ซ่อนผลคะแนน?" : "แสดงผลคะแนน?"}
        /* ⚠️ AUD-COPY · results/route.js: hideTally = !showResult ปิดคะแนนรายพรรคกับ
           "ทุกคน" รวมแอดมิน (ไม่มี bypass) แต่ showBreakdown = isAdmin || showResult
           ทำให้ความคืบหน้าการใช้สิทธิ์ยังอยู่ในแท็บภาพรวมของแอดมินเสมอ ข้อความเดิมบอกว่า
           "ข้อมูลสถิติ" ถูกปิดกั้นด้วย ซึ่งไม่จริงสำหรับแอดมิน */
        message={isShowResult
          ? "เมื่อซ่อนผลคะแนน คะแนนของแต่ละพรรคจะถูกปิดจากทุกคนรวมถึงแอดมินเอง · ความคืบหน้าการใช้สิทธิ์ในแท็บภาพรวมยังดูได้ตามปกติ"
          : "เมื่อแสดงผลคะแนน ทุกคนจะสามารถเข้าดูผลโหวตได้ทันที แม้ระบบโหวตจะปิดอยู่"}
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
        title="ลบข้อมูลการลงคะแนนรายบุคคล (รับรองผล)?"
        message={`นี่คือการปักธงรับรองผลครั้งสุดท้าย — คะแนนรวมของทุกพรรคถูกล็อก เครื่องมือตรวจสอบจะไม่แก้ไขฐานข้อมูลอีก · ระบบไม่เคยเก็บว่าใครเลือกพรรคใด บัตรทุกใบถูกบันทึกแบบไม่มีชื่อผู้ลงคะแนนอยู่แล้ว จึงไม่มีข้อมูลรายบุคคลเหลือให้ลบ · กดแล้วย้อนกลับไม่ได้`}
        variant="danger"
        isLoading={processing}
      />

    </div >
    </div>
  )
};

export default SettingsTab;
