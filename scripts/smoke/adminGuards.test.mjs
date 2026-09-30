// lib/election/adminGuards — what the committee may do to a running election.
// The rule: the tally is public only once the box is closed, and a box whose
// tally is public never reopens.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isBoxClosed, checkShowResult, checkSetMode, describeModeChange } from "../../src/lib/election/adminGuards.mjs";

const H = 3600e3;
const now = Date.UTC(2026, 9, 1, 5, 0);
const before = { start: new Date(now + 2 * H), end: new Date(now + 10 * H) };
const during = { start: new Date(now - 2 * H), end: new Date(now + 5 * H) };
const after  = { start: new Date(now - 20 * H), end: new Date(now - 5 * H) };

test("the box is closed only when ENDED or AUTO past the end", () => {
  assert.equal(isBoxClosed({ systemMode: "ENDED", end: during.end, now }), true);
  assert.equal(isBoxClosed({ systemMode: "AUTO", end: after.end, now }), true);
  assert.equal(isBoxClosed({ systemMode: "AUTO", end: during.end, now }), false);
  assert.equal(isBoxClosed({ systemMode: "AUTO", end: before.end, now }), false);
  // paused mid-election and forced open (even late) are not closed
  assert.equal(isBoxClosed({ systemMode: "PAUSE", end: after.end, now }), false);
  assert.equal(isBoxClosed({ systemMode: "MANUAL_OPEN", end: after.end, now }), false);
});

test("results cannot be published while votes can still be cast", () => {
  for (const [mode, sched] of [["AUTO", during], ["AUTO", before], ["MANUAL_OPEN", after], ["PAUSE", during]]) {
    assert.ok(checkShowResult({ value: true, systemMode: mode, end: sched.end, now }), `${mode} should refuse`);
  }
  assert.equal(checkShowResult({ value: true, systemMode: "ENDED", end: during.end, now }), null);
  assert.equal(checkShowResult({ value: true, systemMode: "AUTO", end: after.end, now }), null);
});

test("hiding results is always allowed; the value must be a real boolean", () => {
  assert.equal(checkShowResult({ value: false, systemMode: "MANUAL_OPEN", end: during.end, now }), null);
  assert.ok(checkShowResult({ value: "true", systemMode: "ENDED", end: during.end, now }));
  assert.ok(checkShowResult({ value: undefined, systemMode: "ENDED", end: during.end, now }));
});

test("a published tally never goes back to a box that can take votes", () => {
  const shown = { showResult: true, certified: false, now };
  assert.ok(checkSetMode({ ...shown, mode: "MANUAL_OPEN", end: after.end }));
  assert.ok(checkSetMode({ ...shown, mode: "PAUSE", end: after.end }));
  assert.ok(checkSetMode({ ...shown, mode: "AUTO", end: during.end }));
  // AUTO past the end stays closed, so it is fine
  assert.equal(checkSetMode({ ...shown, mode: "AUTO", end: after.end }), null);
  assert.equal(checkSetMode({ ...shown, mode: "ENDED", end: during.end }), null);
  // hidden: every mode is allowed
  for (const mode of ["AUTO", "MANUAL_OPEN", "PAUSE", "ENDED"]) {
    assert.equal(checkSetMode({ showResult: false, certified: false, now, mode, end: during.end }), null);
  }
});

test("certification freezes the mode; unknown modes are refused", () => {
  assert.ok(checkSetMode({ mode: "AUTO", showResult: false, certified: true, end: after.end, now }));
  assert.equal(checkSetMode({ mode: "ENDED", showResult: true, certified: true, end: after.end, now }), null);
  assert.ok(checkSetMode({ mode: "OPEN", showResult: false, certified: false, end: after.end, now }));
});

test("the confirm text says what the change does", () => {
  assert.match(describeModeChange({ from: "ENDED", to: "MANUAL_OPEN", ...during, now }), /เปิดอีกครั้ง/);
  assert.match(describeModeChange({ from: "ENDED", to: "AUTO", ...during, now }), /เปิดอีกครั้งทันที/);
  assert.match(describeModeChange({ from: "PAUSE", to: "AUTO", ...before, now }), /เปิดเองเมื่อถึงเวลา/);
  assert.match(describeModeChange({ from: "AUTO", to: "AUTO", ...after, now }), /ยังปิดอยู่/);
  assert.match(describeModeChange({ from: "AUTO", to: "ENDED", ...during, now }), /ปิดหีบทันที/);
});
