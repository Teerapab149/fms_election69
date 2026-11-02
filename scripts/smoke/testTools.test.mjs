// utils/testTools: the switch that keeps the admin test tools off the real
// election server, and the sample data the tools write.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isTestToolsEnabled,
  isTestToolsSwitchOn,
  databaseNameOf,
  isTestDatabaseName,
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

const PROD = { ADMIN_TEST_TOOLS: "1", NODE_ENV: "production" };

test("database name is read from the URL, query string and credentials ignored", () => {
  assert.equal(databaseNameOf("postgresql://u:p%40ss@localhost:5432/fms_election?schema=public"), "fms_election");
  assert.equal(databaseNameOf("postgresql://u:p@db.example:5432/fms_election_e2e"), "fms_election_e2e");
  assert.equal(databaseNameOf(undefined), "");
  assert.equal(databaseNameOf("not a url"), "");
});

test("only _e2e and _test databases count as throwaway", () => {
  for (const n of ["fms_election_e2e", "fms_cert_e2e", "ovs_test"]) assert.equal(isTestDatabaseName(n), true, n);
  for (const n of ["fms_election", "fms_e2e_backup", "ovs_testing", "e2e", "_test", "", undefined, "fms-election_e2e"]) {
    assert.equal(isTestDatabaseName(n), false, String(n));
  }
});

test("on a production build the tools need a throwaway database as well as the switch", () => {
  assert.equal(isTestToolsEnabled({ ...PROD, DATABASE_URL: "postgresql://u:p@h:5432/fms_election" }), false);
  assert.equal(isTestToolsEnabled({ ...PROD, DATABASE_URL: "postgresql://u:p@h:5432/fms_election?schema=public" }), false);
  assert.equal(isTestToolsEnabled({ ...PROD }), false, "no DATABASE_URL");
  assert.equal(isTestToolsEnabled({ ...PROD, DATABASE_URL: "postgresql://u:p@h:5432/fms_election_e2e" }), true);
  assert.equal(isTestToolsEnabled({ ...PROD, DATABASE_URL: "postgresql://u:p@h:5432/ovs_test" }), true);
  // the database alone never turns them on
  assert.equal(isTestToolsEnabled({ NODE_ENV: "production", DATABASE_URL: "postgresql://u:p@h:5432/x_e2e" }), false);
});

test("outside production the switch alone decides, so the owner's dev machine is unchanged", () => {
  const url = "postgresql://u:p@h:5432/fms_election";
  assert.equal(isTestToolsEnabled({ ADMIN_TEST_TOOLS: "1", NODE_ENV: "development", DATABASE_URL: url }), true);
  assert.equal(isTestToolsEnabled({ ADMIN_TEST_TOOLS: "1", DATABASE_URL: url }), true);
  assert.equal(isTestToolsEnabled({ NODE_ENV: "development", DATABASE_URL: url }), false);
});

test("the readiness check still sees a stale switch on a real database", () => {
  const env = { ...PROD, DATABASE_URL: "postgresql://u:p@h:5432/fms_election" };
  assert.equal(isTestToolsSwitchOn(env), true);
  assert.equal(isTestToolsEnabled(env), false);
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
