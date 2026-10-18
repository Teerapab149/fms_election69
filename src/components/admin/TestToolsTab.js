'use client';

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, FlaskConical, Trash2, Database, Users, CheckCircle2, XCircle } from "lucide-react";
import { getPath } from "../../utils/basePath";
import { useElectionState } from "./console/ElectionStateContext";

// Test tools: for a test machine only. The tab exists only when the server
// answers GET /api/admin/test-tools (404 when ADMIN_TEST_TOOLS is not "1"), and
// every action is typed-to-confirm. Nothing here is reversible.

const ACTIONS = [
  {
    id: "SEED_SAMPLE_1",
    action: "SEED_SAMPLE",
    payload: { parties: 1 },
    Icon: Database,
    title: "เพิ่มพรรคตัวอย่าง 1 พรรค",
    desc: "สร้างพรรคตัวอย่างพร้อมสมาชิก 8 คน สโลแกน และนโยบาย กับนักศึกษาทดสอบชั้นปี 1 ถึง 4 จำนวน 24 คน (ไม่มีรูป) ใช้ทดสอบการเลือกตั้งแบบพรรคเดียว ทำได้เมื่อไม่มีบัตรในหีบเท่านั้น",
    phrase: "เพิ่มตัวอย่าง",
    tone: "primary",
  },
  {
    id: "SEED_SAMPLE_2",
    action: "SEED_SAMPLE",
    payload: { parties: 2 },
    Icon: Database,
    title: "เพิ่มพรรคตัวอย่าง 2 พรรค",
    desc: "เหมือนด้านบนแต่สร้าง 2 พรรค ใช้ทดสอบการเลือกตั้งหลายพรรค ทำได้เมื่อไม่มีบัตรในหีบเท่านั้น",
    phrase: "เพิ่มตัวอย่าง",
    tone: "primary",
  },
  {
    id: "CLEAR_BALLOTS",
    action: "CLEAR_BALLOTS",
    Icon: Trash2,
    title: "ล้างบัตร",
    desc: "ลบบัตรทั้งหมดในหีบ คะแนนทุกพรรคเป็นศูนย์ คืนสิทธิ์ให้ผู้ที่เคยโหวต ปลดการรับรองผล ซ่อนผลคะแนน และตั้งโหมดเป็น AUTO ทำเหมือนส่วนแรกของขั้นตอนขึ้นปีการศึกษาใหม่",
    phrase: "ล้างบัตร",
    tone: "danger",
  },
  {
    id: "CLEAR_PARTIES",
    action: "CLEAR_PARTIES",
    Icon: Trash2,
    title: "ล้างพรรคและสมาชิก",
    desc: "ลบพรรคผู้สมัครและสมาชิกทุกพรรค ตัวเลือกงดออกเสียงและไม่รับรองจะถูกปรับให้ตรงกับจำนวนพรรค ไฟล์รูปที่อัปโหลดไว้ยังอยู่บนดิสก์ ไม่ถูกลบ ทำได้เมื่อไม่มีบัตรในหีบเท่านั้น",
    phrase: "ล้างพรรค",
    tone: "danger",
  },
  {
    id: "CLEAR_TEST_VOTERS",
    action: "CLEAR_TEST_VOTERS",
    Icon: Users,
    title: "ลบนักศึกษาทดสอบ",
    desc: "ลบเฉพาะนักศึกษาทดสอบที่รหัสขึ้นต้นด้วย 99 ไม่แตะนักศึกษาจริง แอดมิน หรือเจ้าหน้าที่ ทำได้เมื่อไม่มีบัตรในหีบเท่านั้น",
    phrase: "ลบนักศึกษาทดสอบ",
    tone: "danger",
  },
];

function ActionCard({ item, busy, onRun }) {
  const [typed, setTyped] = useState("");
  const ok = typed.trim() === item.phrase;
  const Icon = item.Icon;
  const danger = item.tone === "danger";
  return (
    <div className={`bg-white rounded-xl border p-5 ${danger ? "border-red-200" : "border-slate-200"}`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${danger ? "bg-red-50 text-red-600" : "bg-purple-50 text-[#8A2680]"}`}>
          <Icon className="w-5 h-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.desc}</p>
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-red-700">ทำแล้วย้อนกลับไม่ได้</p>
      <label className="mt-3 block text-xs text-slate-600">
        พิมพ์ <span className="font-semibold text-slate-900">{item.phrase}</span> เพื่อปลดล็อกปุ่ม
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={busy}
          autoComplete="off"
          spellCheck={false}
          aria-label={`พิมพ์ ${item.phrase} เพื่อยืนยัน`}
          placeholder={item.phrase}
          className="mt-1.5 w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#8A2680]/40 focus:border-[#8A2680] disabled:opacity-50"
        />
      </label>
      <button
        type="button"
        disabled={!ok || busy}
        onClick={async () => { await onRun(item); setTyped(""); }}
        className={`mt-3 inline-flex items-center justify-center gap-2 min-h-[40px] px-4 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${danger ? "bg-red-600 hover:bg-red-700" : "bg-[#8A2680] hover:bg-[#7a2270]"}`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
        {item.title}
      </button>
    </div>
  );
}

export default function TestToolsTab() {
  const { refresh, runReadiness } = useElectionState();
  const [status, setStatus] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, text }

  const load = useCallback(async () => {
    try {
      const res = await fetch(getPath("/api/admin/test-tools"), { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error(res.status === 404 ? "เครื่องมือทดสอบไม่ได้เปิดบนเครื่องนี้" : `สถานะ ${res.status}`);
      setStatus(await res.json());
      setLoadError(null);
    } catch (e) {
      setLoadError(e.message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (item) => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(getPath("/api/admin/test-tools"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: item.action, ...(item.payload || {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ ok: false, text: data.error || `ดำเนินการไม่สำเร็จ (${res.status})` });
      } else {
        setResult({ ok: true, text: data.message });
        if (data.status) setStatus(data.status);
      }
    } catch (e) {
      setResult({ ok: false, text: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" });
    } finally {
      setBusy(false);
      refresh();
      runReadiness();
    }
  };

  const stat = (label, value) => (
    <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-slate-900 tabular-nums">{value === undefined || value === null ? "..." : Number(value).toLocaleString()}</p>
    </div>
  );

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-800">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 text-sm leading-relaxed">
          <p className="font-semibold">เครื่องมือนี้ใช้กับเครื่องทดสอบเท่านั้น</p>
          <p className="text-xs mt-0.5 text-red-700">ล้างบัตรและล้างพรรคได้ ถ้าเปิดบนเครื่องที่ใช้เลือกตั้งจริง ผลเลือกตั้งจะหายถาวร ผลตรวจความพร้อมระบบจะขึ้นไม่ผ่านตราบใดที่เครื่องมือนี้ยังเปิดอยู่</p>
        </div>
      </div>

      {loadError && <div className="p-3 rounded-lg border border-red-200 bg-white text-sm text-red-700" role="alert">{loadError}</div>}

      <section aria-label="ข้อมูลในระบบตอนนี้" className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stat("บัตรในหีบ", status?.ballots)}
        {stat("พรรคผู้สมัคร", status?.parties)}
        {stat("สมาชิกพรรค", status?.members)}
        {stat("ผู้มีสิทธิ์ (ปี 1 ถึง 4)", status?.eligible)}
        {stat(`นักศึกษาทดสอบ (รหัส ${status?.testVoterPrefix || "99"})`, status?.testVoters)}
      </section>

      {status?.certified && (
        <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">ผลถูกรับรองแล้ว ต้องล้างบัตรก่อน จึงจะเพิ่มหรือลบพรรคได้</p>
      )}

      {result && (
        <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${result.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"}`} role="status">
          {result.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />}
          <span className="min-w-0">{result.text}</span>
        </div>
      )}

      <section aria-label="คำสั่ง" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ACTIONS.map((item) => <ActionCard key={item.id} item={item} busy={busy || !status} onRun={run} />)}
      </section>

      <p className="text-xs text-slate-500 flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5" aria-hidden /> เครื่องมือนี้แสดงเฉพาะเมื่อเซิร์ฟเวอร์ตั้งค่า ADMIN_TEST_TOOLS=1</p>
    </div>
  );
}
