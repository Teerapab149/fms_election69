// scripts/audit/repro-02-embargo-peek.mjs
//
//   node scripts/audit/repro-02-embargo-peek.mjs
//
// No database needed. Drives the REAL guard functions the admin API uses
// (src/lib/election/adminGuards.mjs — the same calls api/admin/dashboard and
// api/admin/global-config make) through the sequence a committee admin could
// click in the middle of election day:
//
//   close box → publish tally → hide tally → reopen box
//
// The file's own stated rule is "a box whose tally is public never reopens".
// If every step returns null (= allowed), the rule only holds while the tally is
// CURRENTLY shown; a tally that was shown and hidden again does not count.
import {
  checkSetMode, checkShowResult, checkScheduleChange, isBoxClosed,
} from "../../src/lib/election/adminGuards.mjs";

const H = 3600_000;
const now = Date.UTC(2026, 1, 6, 5, 0, 0);      // mid-election
const start = new Date(now - 3 * H);
const end = new Date(now + 4 * H);              // polls close in 4 hours

function run(title, steps) {
  console.log(`\n== ${title}`);
  const st = { systemMode: "AUTO", showResult: false, certified: false, start, end };
  let allowed = true;
  for (const s of steps) {
    const err = s.guard(st);
    console.log(`  ${err === null ? "ALLOWED" : "REFUSED"}  ${s.label}${err ? `  → ${err}` : ""}`);
    if (err !== null) { allowed = false; break; }
    s.apply(st);
    console.log(`           state: mode=${st.systemMode} showResult=${st.showResult} boxClosed=${isBoxClosed({ systemMode: st.systemMode, end: st.end, now })} end=${st.end.toISOString()}`);
  }
  console.log(allowed
    ? "  => CONFIRMED: the tally was public while voters remained, and the box took votes again afterwards."
    : "  => not reproduced: a guard stopped the sequence.");
  return allowed;
}

const setMode = (mode) => ({
  label: `SET_MODE ${mode}`,
  guard: (st) => checkSetMode({ mode, showResult: st.showResult, certified: st.certified, end: st.end, now }),
  apply: (st) => { st.systemMode = mode; },
});
const setShow = (value) => ({
  label: `SET_SHOW_RESULT ${value}${value ? "   <-- /api/results now returns every party's score to anyone" : ""}`,
  guard: (st) => checkShowResult({ value, systemMode: st.systemMode, end: st.end, now, certified: st.certified }),
  apply: (st) => { st.showResult = value; },
});
const setEnd = (nextEnd, label) => ({
  label,
  guard: (st) => checkScheduleChange({
    systemMode: st.systemMode, showResult: st.showResult, certified: st.certified,
    prevStart: st.start, prevEnd: st.end, nextStart: st.start, nextEnd, now,
  }),
  apply: (st) => { st.end = nextEnd; },
});

const a = run("A. via the mode switch", [setMode("ENDED"), setShow(true), setShow(false), setMode("AUTO")]);
const b = run("B. via the schedule (never leaves AUTO)", [
  setEnd(new Date(now - 60_000), "SET_SCHEDULE end := one minute ago"),
  setShow(true), setShow(false),
  setEnd(end, "SET_SCHEDULE end := original time"),
]);
const c = run("C. reopen with MANUAL_OPEN after the scheduled end", [
  setEnd(new Date(now - 60_000), "SET_SCHEDULE end := one minute ago"),
  setShow(true), setShow(false), setMode("MANUAL_OPEN"),
]);
console.log(`\nsummary: A=${a} B=${b} C=${c}`);
