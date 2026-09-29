// The v2 shared layer: the rules every template inherits instead of re-implementing.
// Run: node --test scripts/smoke/v2Shared.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { hourWindow } from "../../src/components/v2/shared/election/voteTime.mjs";
import { resultsView } from "../../src/components/v2/shared/results/resultsView.mjs";
import { partyContent } from "../../src/components/v2/shared/party/partyContent.mjs";

// ── rule 11: never finer than the ballot row's hour bucket ──
test("hourWindow gives the Bangkok hour window, never minutes", () => {
  const s = hourWindow("2026-02-06T03:24:07.000Z"); // 10:24 in Bangkok
  assert.match(s, /ช่วง 10\.00–11\.00 น\.$/);
  assert.doesNotMatch(s, /24/, "the minute must not appear");
});
test("hourWindow wraps midnight and rejects bad input", () => {
  assert.match(hourWindow("2026-02-06T16:59:00.000Z"), /ช่วง 23\.00–00\.00 น\.$/); // 23:59 Bangkok
  assert.equal(hourWindow(null), null);
  assert.equal(hourWindow("not a date"), null);
});

// ── rule 7: nothing about the count leaks before the reveal ──
const CANDS = [
  { id: 1, number: 1, name: "A", score: 120 },
  { id: 2, number: 2, name: "B", score: 300 },
  { id: 0, number: 0, name: "งดออกเสียง", score: 40 },
  { id: -1, number: -1, name: "ไม่รับรอง", score: 10 },
];
test("sealed rows come back in ballot order with no score on them", () => {
  const { rows } = resultsView({ candidates: CANDS, totalVotes: 470, revealed: false });
  assert.deepEqual(rows.map((r) => r.number), [1, 2, 0, -1]);
  for (const r of rows) {
    assert.equal("score" in r, false, `row ${r.number} carries a score before the reveal`);
    assert.equal("share" in r, false);
  }
});
test("revealed rows are sorted by score with shares of the total", () => {
  const { rows } = resultsView({ candidates: CANDS, totalVotes: 470, revealed: true });
  assert.deepEqual(rows.map((r) => r.number), [2, 1, 0, -1]);
  assert.ok(Math.abs(rows[0].share - (300 / 470) * 100) < 1e-9);
});
test("turnout and group tables", () => {
  const v = resultsView({
    candidates: CANDS, totalVotes: 470, revealed: true,
    demographics: { totalEligible: 940, byYear: [{ name: "ปี 1", value: 3 }, { name: "ปี 2", count: 1 }, { name: " ", value: 9 }], byMajor: [] },
    groups: [{ key: "byYear", label: "ชั้นปี" }, { key: "byMajor", label: "สาขา" }],
  });
  assert.equal(v.eligible, 940);
  assert.equal(v.turnout, 50);
  assert.equal(v.demo.length, 1, "an empty group is dropped");
  assert.deepEqual(v.demo[0].rows.map((r) => [r.name, r.value, r.share]), [["ปี 1", 3, 75], ["ปี 2", 1, 25]]);
});

// ── party content: same rules for every template ──
const DEPS = {
  src: (p) => (p ? `/b${p}` : null),
  normalizeImageUrls: (v) => (Array.isArray(v) ? v : v ? [v] : []),
  sortMembersByPosition: (m) => [...m].sort((a, b) => a.rank - b.rank),
  positionRank: (pos) => ({ นายก: 1, รองนายก: 2, เลขา: 4 }[pos] ?? 9),
};
test("gallery exists only with more than one group photo", () => {
  assert.deepEqual(partyContent({ groupImageUrls: ["/1.jpg"] }, DEPS).gallery, []);
  const c = partyContent({ groupImageUrls: ["/1.jpg", "/2.jpg", "/3.jpg"] }, DEPS);
  assert.equal(c.cover, "/b/1.jpg");
  assert.deepEqual(c.gallery, ["/b/2.jpg", "/b/3.jpg"]);
});
test("placeholder and empty sections are dropped", () => {
  const c = partyContent({ missions: ["ยังไม่มีข้อมูลพันธกิจ", "ทำจริง"], policies: [{ title: "" }, { title: "นโยบาย 1", desc: "d" }], logoMeaning: "\n a \n\n" }, DEPS);
  assert.deepEqual(c.missions, ["ทำจริง"]);
  assert.deepEqual(c.policies, [{ title: "นโยบาย 1", desc: "d" }]);
  assert.deepEqual(c.story, ["a"]);
});
test("team tiers: president, vice presidents, everyone else", () => {
  const members = [{ name: "c", position: "เลขา", rank: 3 }, { name: "a", position: "นายก", rank: 1 }, { name: "b", position: "รองนายก", rank: 2 }];
  const { tiers } = partyContent({ members }, DEPS);
  assert.deepEqual(tiers.lead.map((m) => m.name), ["a"]);
  assert.deepEqual(tiers.vice.map((m) => m.name), ["b"]);
  assert.deepEqual(tiers.rest.map((m) => m.name), ["c"]);
});
