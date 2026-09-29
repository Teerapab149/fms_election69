"use client";

// A date-and-time picker that reads the way a Thai admin reads a date:
// Thai month names, พ.ศ. years, weeks starting on Sunday with Thai day
// initials, a 24-hour clock ("08.30 น."). The browser's own datetime-local
// picker offered none of that — English months, ค.ศ., AM/PM, and whatever
// colour scheme the OS happened to be in.
//
// The value in and out is unchanged: "YYYY-MM-DDTHH:mm", Bangkok wall-clock
// (utils/electionConfig → parseBangkok reads it). Nothing that stores or reads
// these settings had to change.

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const DAY_INITIALS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const pad = (n) => String(n).padStart(2, "0");

// "2027-02-06T08:30" → parts; anything else → null
function parse(value) {
  const m = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return { y: +m[1], mo: +m[2] - 1, d: +m[3], h: +m[4], mi: +m[5] };
}
const format = ({ y, mo, d, h, mi }) => `${y}-${pad(mo + 1)}-${pad(d)}T${pad(h)}:${pad(mi)}`;
// weekday of a calendar date, independent of the host's time zone
const weekday = (y, mo, d) => new Date(Date.UTC(y, mo, d)).getUTCDay();
const daysIn = (y, mo) => new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();

// One part of the time (hours or minutes) that you type into — the segmented
// time field most platforms use, rather than a long dropdown or 5-minute
// steps. Any value 0..max; two digits (or one that cannot start a valid
// two-digit value) moves on to the next part; ↑ ↓ step by one and wrap.
function TimeSegment({ label, value, max, onCommit, inputRef, nextRef = null }) {
  const [draft, setDraft] = useState(null);   // what is being typed; null = show the value
  const tens = Math.floor(max / 10);          // 2 for hours, 5 for minutes

  return (
    <input
      ref={inputRef} type="text" inputMode="numeric" aria-label={label}
      value={draft ?? pad(value)}
      onFocus={(e) => { setDraft(pad(value)); e.target.select(); }}
      onBlur={() => setDraft(null)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(-2);
        setDraft(digits);
        if (digits === "") return;
        const n = Math.min(+digits, max);
        onCommit(n);
        if ((digits.length === 2 || +digits[0] > tens) && nextRef?.current) nextRef.current.focus();
      }}
      onKeyDown={(e) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        const n = (value + (e.key === "ArrowUp" ? 1 : -1) + max + 1) % (max + 1);
        onCommit(n);
        setDraft(pad(n));
      }}
      className="w-8 h-8 text-center text-[15px] font-bold tabular-nums text-slate-800 bg-transparent rounded focus:bg-[#8A2680]/10 focus:outline-none"
    />
  );
}

// today as Bangkok sees it
function bangkokToday() {
  const x = new Date(Date.now() + 7 * 3600 * 1000);
  return { y: x.getUTCFullYear(), mo: x.getUTCMonth(), d: x.getUTCDate() };
}

export default function ThaiDateTimeField({ id, value, onChange, defaultTime = { h: 8, mi: 30 } }) {
  const v = parse(value);
  const today = bangkokToday();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => ({ y: v?.y ?? today.y, mo: v?.mo ?? today.mo }));
  // days → (tap the header) months of that year → (tap again) a page of years;
  // picking a year goes to its months, picking a month goes to its days
  const [mode, setMode] = useState("days");
  const rootRef = useRef(null);
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const popId = useId();

  // re-centre on the chosen month every time it opens
  useEffect(() => {
    if (open) { setView({ y: v?.y ?? today.y, mo: v?.mo ?? today.mo }); setMode("days"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // close on a click outside or Escape (focus goes back to the field)
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); rootRef.current?.querySelector("button")?.focus(); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const time = v ? { h: v.h, mi: v.mi } : defaultTime;
  const pickDay = (d) => onChange(format({ y: view.y, mo: view.mo, d, ...time }));
  const setTime = (patch) => {
    const base = v ?? { y: view.y, mo: view.mo, d: Math.min(today.d, daysIn(view.y, view.mo)) };
    onChange(format({ ...base, ...time, ...patch }));
  };
  // ‹ › move by a month, a year or a page of years, depending on what is showing
  const step = (delta) => setView(({ y, mo }) => {
    if (mode === "months") return { y: y + delta, mo };
    if (mode === "years") return { y: y + delta * 12, mo };
    const m = mo + delta;
    return { y: y + Math.floor(m / 12), mo: ((m % 12) + 12) % 12 };
  });
  // the page of years is centred on the year shown, so the next few years —
  // the likely pick when setting up an election — are always on it
  const yearPageStart = view.y - 5;
  const headerLabel = mode === "days" ? `${MONTHS[view.mo]} ${view.y + 543}`
    : mode === "months" ? `${view.y + 543}`
    : `${yearPageStart + 543} – ${yearPageStart + 11 + 543}`;
  const stepLabel = mode === "days" ? "เดือน" : mode === "months" ? "ปี" : "ช่วงปี";

  // the month grid: blanks before the 1st, then the days
  const lead = weekday(view.y, view.mo, 1);
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysIn(view.y, view.mo) }, (_, i) => i + 1)];

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id} type="button" onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? popId : undefined}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-white text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#8A2680]/15 ${open ? "border-[#8A2680]" : "border-slate-200 hover:border-slate-300"}`}
      >
        <CalendarDays className="w-4 h-4 text-[#8A2680] shrink-0" aria-hidden />
        {v ? (
          <span className="min-w-0 leading-tight">
            <span className="block text-sm text-slate-800">วัน{DAYS[weekday(v.y, v.mo, v.d)]}ที่ {v.d} {MONTHS_SHORT[v.mo]} {v.y + 543}</span>
            <span className="block text-sm font-bold text-slate-800 tabular-nums">{pad(v.h)}.{pad(v.mi)} น.</span>
          </span>
        ) : (
          <span className="text-sm text-slate-400 py-2">เลือกวันและเวลา</span>
        )}
      </button>

      {open && (
        <div id={popId} role="dialog" aria-label="เลือกวันและเวลา"
          className="absolute z-30 mt-2 left-0 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          {/* month */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => step(-1)} aria-label={`${stepLabel}ก่อนหน้า`}
              className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
            {/* the header is the way up: month → year → page of years */}
            <button type="button"
              onClick={() => setMode(mode === "days" ? "months" : "years")}
              disabled={mode === "years"}
              aria-label={mode === "days" ? "เลือกเดือนหรือปี" : mode === "months" ? "เลือกปี" : undefined}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[15px] font-bold text-slate-800 tabular-nums enabled:hover:bg-slate-100 disabled:cursor-default">
              {headerLabel}
              {mode !== "years" && <ChevronDown className="w-3.5 h-3.5 text-slate-400" aria-hidden />}
            </button>
            <button type="button" onClick={() => step(1)} aria-label={`${stepLabel}ถัดไป`}
              className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
          </div>

          {/* months of the year shown */}
          {mode === "months" && (
            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS_SHORT.map((m, i) => {
                const chosen = v && v.y === view.y && v.mo === i;
                const isNow = today.y === view.y && today.mo === i;
                return (
                  <button key={m} type="button" onClick={() => { setView({ y: view.y, mo: i }); setMode("days"); }}
                    aria-label={`${MONTHS[i]} ${view.y + 543}`}
                    className={`h-11 rounded-lg text-sm transition-colors ${
                      chosen ? "bg-[#8A2680] text-white font-bold"
                      : isNow ? "ring-1 ring-inset ring-[#8A2680]/40 text-[#8A2680] font-bold hover:bg-[#8A2680]/5"
                      : "text-slate-700 hover:bg-slate-100"}`}>
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {/* a page of twelve years */}
          {mode === "years" && (
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 12 }, (_, i) => yearPageStart + i).map((y) => {
                const chosen = v && v.y === y;
                const isNow = today.y === y;
                return (
                  <button key={y} type="button" onClick={() => { setView({ y, mo: view.mo }); setMode("months"); }}
                    className={`h-11 rounded-lg text-sm tabular-nums transition-colors ${
                      chosen ? "bg-[#8A2680] text-white font-bold"
                      : isNow ? "ring-1 ring-inset ring-[#8A2680]/40 text-[#8A2680] font-bold hover:bg-[#8A2680]/5"
                      : "text-slate-700 hover:bg-slate-100"}`}>
                    {y + 543}
                  </button>
                );
              })}
            </div>
          )}

          {/* days */}
          {mode === "days" && (
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAY_INITIALS.map((d, i) => (
              <span key={d} className={`text-[11px] font-bold pb-1 ${i === 0 ? "text-red-400" : "text-slate-400"}`}>{d}</span>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <span key={`b${i}`} />;
              const chosen = v && v.y === view.y && v.mo === view.mo && v.d === d;
              const isToday = today.y === view.y && today.mo === view.mo && today.d === d;
              return (
                <button key={d} type="button" onClick={() => pickDay(d)} aria-pressed={!!chosen}
                  aria-label={`${d} ${MONTHS[view.mo]} ${view.y + 543}`}
                  className={`h-9 rounded-lg text-sm tabular-nums transition-colors ${
                    chosen ? "bg-[#8A2680] text-white font-bold"
                    : isToday ? "ring-1 ring-inset ring-[#8A2680]/40 text-[#8A2680] font-bold hover:bg-[#8A2680]/5"
                    : "text-slate-700 hover:bg-slate-100"}`}>
                  {d}
                </button>
              );
            })}
          </div>
          )}

          {/* time: 24-hour, the Thai way ("08.30 น."), typed to the minute */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-700 mr-auto">เวลา</span>
            <span className="inline-flex items-center h-10 px-1.5 rounded-lg border border-slate-200 focus-within:border-[#8A2680] focus-within:ring-2 focus-within:ring-[#8A2680]/15">
              <TimeSegment label="ชั่วโมง" value={time.h} max={23} onCommit={(h) => setTime({ h })} inputRef={hourRef} nextRef={minuteRef} />
              <span className="text-slate-400 px-0.5">.</span>
              <TimeSegment label="นาที" value={time.mi} max={59} onCommit={(mi) => setTime({ mi })} inputRef={minuteRef} />
            </span>
            <span className="text-sm text-slate-600">น.</span>
          </div>
          <p className="mt-1.5 text-right text-[11px] text-slate-400">พิมพ์ตัวเลข หรือกด ↑ ↓ เพื่อปรับทีละ 1</p>

          <div className="mt-3 flex items-center justify-between">
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}
              className="text-[13px] text-slate-500 hover:text-red-600">ล้างค่า</button>
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-1.5 rounded-lg bg-[#8A2680] hover:bg-[#6E1F67] text-white text-[13px] font-bold">เสร็จ</button>
          </div>
        </div>
      )}
    </div>
  );
}
