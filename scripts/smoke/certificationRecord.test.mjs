// lib/certificationRecord: what certification pins down, and how a later check
// reads it. Pure, so it runs without a database.
import { test } from "node:test";
import assert from "node:assert/strict";
import rec from "../../src/lib/certificationRecord.js";

const {
  CERT_KEYS,
  buildCertifiedRecord,
  explainVerifyFailure,
  readCertifiedRecord,
  compareToCertified,
  formatCertifiedRecordText,
} = rec;

const live = (over = {}) => ({
  candidates: [
    { number: 2, name: "พรรคสอง", score: 4 },
    { number: -1, name: "ไม่รับรอง", score: 0 },
    { number: 1, name: "พรรคหนึ่ง", score: 7 },
    { number: 0, name: "งดออกเสียง", score: 1 },
  ],
  ballots: 12,
  head: "abc123",
  ...over,
});

const certifiedConfig = (extra = {}) => ({
  ballotsAnonymized: true,
  certifiedAt: "2026-11-02T10:00:00.000Z",
  certifiedBy: "เจ้าหน้าที่",
  ...buildCertifiedRecord(live()),
  ...extra,
});

test("the record lists every option sorted by number, null score counted as 0", () => {
  const r = buildCertifiedRecord({
    candidates: [{ number: 1, name: "ก", score: null }, { number: -1, name: "ข", score: 2 }],
    ballots: 2,
    head: "h",
  });
  assert.deepEqual(r.certifiedTally, [{ number: -1, name: "ข", score: 2 }, { number: 1, name: "ก", score: 0 }]);
  assert.equal(r.certifiedBallots, 2);
  assert.equal(r.certifiedChainHead, "h");
});

test("every key the certification writes is protected from the settings form", () => {
  for (const k of ["ballotsAnonymized", "certifiedAt", "certifiedBy", "certifiedByUsername",
    "certifiedTally", "certifiedBallots", "certifiedChainHead"]) {
    assert.ok(CERT_KEYS.includes(k), k);
  }
});

test("compare: not certified, certified without a record, and a clean match", () => {
  assert.equal(compareToCertified({}, live()).state, "none");
  assert.equal(compareToCertified(null, live()).state, "none");
  assert.equal(compareToCertified({ ballotsAnonymized: true }, live()).state, "legacy");
  assert.deepEqual(compareToCertified(certifiedConfig(), live()), { state: "match", differences: [] });
});

test("compare: a changed score, ballot count or chain head is named", () => {
  const edited = live();
  edited.candidates.find((c) => c.number === 1).score = 8;
  const a = compareToCertified(certifiedConfig(), edited);
  assert.equal(a.state, "mismatch");
  assert.equal(a.differences.length, 1);
  assert.match(a.differences[0], /เบอร์ 1/);
  assert.match(a.differences[0], /รับรองไว้ 7 คะแนน ตอนนี้ 8 คะแนน/);

  assert.match(compareToCertified(certifiedConfig(), live({ ballots: 13 })).differences.join("\n"), /รับรองไว้ 12 ใบ ตอนนี้ 13 ใบ/);
  assert.match(compareToCertified(certifiedConfig(), live({ head: "zzz" })).differences.join("\n"), /ปลายโซ่/);
});

test("compare: an option added or removed after certification is a mismatch", () => {
  const added = live({ candidates: [...live().candidates, { number: 3, name: "พรรคสาม", score: 0 }] });
  assert.match(compareToCertified(certifiedConfig(), added).differences.join("\n"), /เบอร์ 3/);
  const removed = live({ candidates: live().candidates.filter((c) => c.number !== 2) });
  assert.match(compareToCertified(certifiedConfig(), removed).differences.join("\n"), /เบอร์ 2/);
});

test("compare: a half-written record is reported, not read as legacy", () => {
  const cfg = certifiedConfig();
  delete cfg.certifiedChainHead;
  const r = compareToCertified(cfg, live());
  assert.equal(r.state, "mismatch");
  assert.match(r.differences[0], /certifiedChainHead/);
});

test("the refusal reasons are plain Thai and name the numbers", () => {
  const base = { counts: { ballots: 5, scoreSum: 6, voted: 5 }, firstBreak: null };
  const broken = explainVerifyFailure({ ...base, checks: [{ name: "chain-integrity", ok: false }], firstBreak: { seq: 3 } });
  assert.match(broken, /ลำดับที่ 3/);
  assert.match(explainVerifyFailure({ ...base, checks: [{ name: "chain-integrity", ok: true }, { name: "head-matches", ok: false }] }), /ปลายโซ่/);
  const drift = explainVerifyFailure({ ...base, checks: [{ name: "chain-integrity", ok: true }, { name: "head-matches", ok: true }, { name: "ballots==score", ok: false }] });
  assert.match(drift, /5 ใบ/);
  assert.match(drift, /6 คะแนน/);
  assert.match(drift, /5 คน/);
  for (const s of [broken, drift]) assert.ok(!s.endsWith("."), "Thai sentence has no trailing period");
});

test("readCertifiedRecord is null unless certified with a tally", () => {
  assert.equal(readCertifiedRecord({}), null);
  assert.equal(readCertifiedRecord({ ballotsAnonymized: true }), null);
  assert.equal(readCertifiedRecord({ certifiedTally: [] }), null);
  const r = readCertifiedRecord(certifiedConfig());
  assert.equal(r.certifiedBallots, 12);
  assert.equal(r.certifiedChainHead, "abc123");
});

test("the copy staff keep carries the tally, the count and the head, with no decoration", () => {
  const text = formatCertifiedRecordText(readCertifiedRecord(certifiedConfig()), { electionName: "SAMO 50" });
  assert.match(text, /SAMO 50/);
  assert.match(text, /1 {2}พรรคหนึ่ง {2}7/);
  assert.match(text, /จำนวนบัตรในหีบ: 12/);
  assert.match(text, /ปลายโซ่บัตร: abc123/);
  assert.ok(!/[\u00B7\u2192\u2190\u2014]/.test(text), "no middle dot, arrow or em dash");
});
