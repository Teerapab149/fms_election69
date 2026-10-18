// utils/testTools: the switch that keeps the admin test tools off the real
// election server, and the sample data the tools write.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isTestToolsEnabled,
  isPermissionError,
  nextFreePartyNumbers,
  buildSampleParty,
  buildSampleVoters,
  TEST_VOTER_PREFIX,
} from "../../src/utils/testTools.mjs";

test("enabled only for the exact string 1", () => {
  assert.equal(isTestToolsEnabled({ ADMIN_TEST_TOOLS: "1" }), true);
  for (const v of [undefined, "", "0", "true", "yes", "TRUE", " 1", "1 ", 1]) {
    assert.equal(isTestToolsEnabled({ ADMIN_TEST_TOOLS: v }), false, String(v));
  }
  assert.equal(isTestToolsEnabled({}), false);
});

test("a NEXT_PUBLIC_ variable never turns it on", () => {
  assert.equal(isTestToolsEnabled({ NEXT_PUBLIC_ADMIN_TEST_TOOLS: "1" }), false);
});

test("party numbers: smallest free positives, special options ignored", () => {
  assert.deepEqual(nextFreePartyNumbers([], 2), [1, 2]);
  assert.deepEqual(nextFreePartyNumbers([1], 1), [2]);
  assert.deepEqual(nextFreePartyNumbers([2, 3], 2), [1, 4]);
  assert.deepEqual(nextFreePartyNumbers([0, -1, 1], 1), [2]);
});

test("sample party: name prefix, 8 members, president and department heads, unique student ids", () => {
  const p = buildSampleParty(3, 0);
  assert.ok(p.name.startsWith("ตัวอย่าง"));
  assert.equal(p.number, 3);
  assert.equal(p.members.length, 8);
  assert.equal(p.members[0].number, 1);
  assert.ok(p.members.some((m) => m.position.startsWith("ประธานฝ่าย")));
  assert.ok(Array.isArray(p.policies) && p.policies.every((x) => x.title && x.desc));
  const ids = p.members.map((m) => m.studentId);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith(TEST_VOTER_PREFIX) && id.length === 10));
  // two parties never share a student id
  const q = buildSampleParty(4, 1);
  assert.equal(new Set([...ids, ...q.members.map((m) => m.studentId)]).size, 16);
});

test("sample voters: valid years only, test prefix on every id, unique", () => {
  const v = buildSampleVoters(24);
  assert.equal(v.length, 24);
  assert.ok(v.every((x) => x.studentId.startsWith(TEST_VOTER_PREFIX) && x.studentId.length === 10));
  assert.equal(new Set(v.map((x) => x.studentId)).size, 24);
  assert.deepEqual([...new Set(v.map((x) => x.year))].sort(), ["ปี 1", "ปี 2", "ปี 3", "ปี 4"]);
  assert.ok(v.some((x) => x.gender === null));
  assert.ok(v.every((x) => x.role === "student"));
});

test("permission errors are recognised, other errors are not", () => {
  assert.equal(isPermissionError({ code: "42501" }), true);
  assert.equal(isPermissionError(new Error('permission denied for table "Ballot"')), true);
  assert.equal(isPermissionError(new Error("must be owner of sequence Ballot_seq_seq")), true);
  assert.equal(isPermissionError(new Error("connection refused")), false);
  assert.equal(isPermissionError(null), false);
});
