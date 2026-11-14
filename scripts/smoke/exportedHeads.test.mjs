// lib/chainVerify checkExportedHeads: the box against heads kept outside the database (F3).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { checkExportedHeads } = require("../../src/lib/chainVerify.js");

const box = (n) => Array.from({ length: n }, (_, i) => ({ seq: i + 1, rowHash: `hash${i + 1}`.padEnd(64, "0") }));
const line = (seq, head, at = "2026-02-06T03:00:00.000Z") => `${at}\thead=${head}\tseq=${seq}\tballots=${seq}`;
const h = (seq) => `hash${seq}`.padEnd(64, "0");

test("heads exported from this box are all found in it", () => {
  const log = [line(0, "GENESIS"), line(10, h(10)), line(25, h(25)), "", line(40, h(40))].join("\n");
  const r = checkExportedHeads(log, box(40));
  assert.equal(r.ok, true);
  assert.equal(r.checked, 4);
  assert.deepEqual(r.latest, { at: "2026-02-06T03:00:00.000Z", seq: 40 });
  // the box may have grown since the last export
  assert.equal(checkExportedHeads(log, box(55)).ok, true);
});

test("a box that lost its tail is caught, and says how many ballots are gone", () => {
  const log = [line(10, h(10)), line(40, h(40))].join("\r\n");
  const r = checkExportedHeads(log, box(30));
  assert.equal(r.ok, false);
  assert.equal(r.problems.length, 1);
  assert.match(r.problems[0], /หายไป 10 ใบ/);
});

test("a rewritten chain is caught at the first exported seq whose hash changed", () => {
  const rewritten = box(40).map((b) => (b.seq >= 20 ? { ...b, rowHash: "f".repeat(64) } : b));
  const r = checkExportedHeads([line(10, h(10)), line(25, h(25)), line(40, h(40))].join("\n"), rewritten);
  assert.equal(r.ok, false);
  assert.equal(r.problems.length, 2);
  assert.match(r.problems[0], /ลำดับที่ 25/);
});

test("an unreadable line is a problem, not a line to skip", () => {
  const r = checkExportedHeads(`2026-02-06T03:00:00.000Z\tNO_CHAIN_HEAD\tseq=?\tballots=3\n${line(3, h(3))}`, box(3));
  assert.equal(r.ok, false);
  assert.equal(r.checked, 1);
  assert.equal(checkExportedHeads("", box(3)).checked, 0);
});
