'use client';

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { getPath } from "../../../utils/basePath";
import { formatClock } from "./electionStatus";

// Live turnout (participation) by year, major and gender. PARTICIPATION ONLY:
// counts of who has voted against who is eligible, never which party a group
// chose. The committee uses it to chase the groups that have not turned out.
// Bars colour by turnout share (low = amber so the weak groups stand out) and
// the major list is sorted lowest first.

const YEAR_ORDER = ["ปี 1", "ปี 2", "ปี 3", "ปี 4"];

function sortYears(rows) {
  return [...rows]
    .filter((r) => r.name !== "อื่นๆ")
    .sort((a, b) => {
      const ia = YEAR_ORDER.indexOf(a.name);
      const ib = YEAR_ORDER.indexOf(b.name);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
}

// the API already sends Thai labels (ชาย, หญิง, ไม่ระบุ); this keeps an older
// server response readable too
const GENDER_THAI = { m: "ชาย", male: "ชาย", f: "หญิง", female: "หญิง" };
function sortGender(rows) {
  const order = ["ชาย", "หญิง"];
  return rows
    .map((g) => ({ ...g, name: GENDER_THAI[String(g.name).toLowerCase()] || g.name }))
    .sort((a, b) => {
      const ia = order.indexOf(a.name);
      const ib = order.indexOf(b.name);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
}

function TurnoutGroup({ title, rows, sortByTurnout = false }) {
  if (!rows || rows.length === 0) return null;
  const data = [...rows];
  if (sortByTurnout) {
    data.sort((a, b) => {
      const pa = a.eligible > 0 ? a.value / a.eligible : 0;
      const pb = b.eligible > 0 ? b.value / b.eligible : 0;
      return pa - pb;
    });
  }
  const sumVoted = data.reduce((n, r) => n + r.value, 0);
  const sumElig = data.reduce((n, r) => n + (r.eligible || 0), 0);
  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <span className="text-[11px] text-slate-500 tabular-nums">รวม {sumVoted.toLocaleString()}/{sumElig.toLocaleString()}</span>
      </div>
      <div className="space-y-3">
        {data.map((r, i) => {
          const elig = r.eligible || 0;
          const pct = elig > 0 ? (r.value / elig) * 100 : 0;
          const color = pct >= 60 ? "#059669" : pct >= 30 ? "#d97706" : "#dc2626";
          return (
            <div key={r.name || i}>
              <div className="flex items-center justify-between text-xs mb-1 gap-2">
                <span className="font-medium text-slate-700 truncate">{r.name || "ไม่ระบุ"}</span>
                <span className="text-slate-500 shrink-0 tabular-nums">
                  {r.value.toLocaleString()}/{elig.toLocaleString()}{" "}
                  <span style={{ color }} className="font-semibold">{pct.toFixed(0)}%</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TurnoutBreakdown() {
  const [demo, setDemo] = useState({ byYear: [], byMajor: [], byGender: [] });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        // admin identity = httpOnly admin_token cookie, sent automatically
        const res = await fetch(getPath("/api/results"), { credentials: "include", cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const s = data.stats || {};
        setDemo({
          byYear: sortYears(s.byYear || []),
          byMajor: s.byMajor || [],
          byGender: sortGender(s.byGender || []),
        });
        setLastUpdated(new Date());
        setFailed(false);
      } catch (err) {
        console.error("turnout fetch failed:", err);
        if (!cancelled) setFailed(true);
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const hasData = demo.byYear.length || demo.byMajor.length || demo.byGender.length;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 mb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">การใช้สิทธิ์แยกตามกลุ่ม</h3>
          <p className="text-xs text-slate-500 mt-0.5">ใช้ติดตามกลุ่มที่ยังมาน้อย ไม่แสดงว่าเลือกพรรคใด</p>
        </div>
        <div className="text-xs tabular-nums" aria-live="polite">
          {failed ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-red-600">
              <WifiOff className="w-3.5 h-3.5" aria-hidden />
              เชื่อมต่อไม่ได้{lastUpdated ? ` (ข้อมูลล่าสุด ${formatClock(lastUpdated)})` : ""}
            </span>
          ) : lastUpdated ? (
            <span className="text-slate-500">อัปเดตล่าสุด {formatClock(lastUpdated)}</span>
          ) : (
            <span className="text-slate-400">กำลังโหลด</span>
          )}
        </div>
      </div>
      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TurnoutGroup title="ชั้นปี" rows={demo.byYear} />
          <TurnoutGroup title="สาขา (เรียงจากน้อยสุด)" rows={demo.byMajor} sortByTurnout />
          <TurnoutGroup title="เพศ" rows={demo.byGender} />
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-sm text-slate-500">
          ความคืบหน้าการใช้สิทธิ์แยกตามกลุ่มจะแสดงเมื่อเริ่มเปิดลงคะแนน
        </div>
      )}
    </section>
  );
}
