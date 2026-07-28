// Pure unit tests for the SSO → role mapping (src/lib/auth/roleFromSso.mjs).
// No server needed — runs in the same `npm run smoke` pass as election.test.mjs.
//
// THE invariant these protect (runbook §10): signing in with PSU SSO decides
// nothing about admin. `role` is a label for which group the account came from;
// the only thing that grants admin is User.isAdmin, written by scripts/admin.js,
// and using it still needs the shared password at /admin/login.
//
// Until 2026-07-28 this file asserted the opposite ("staff/faculty groups grant
// isAdmin without the allowlist") — that was the hole: PSU controls who is in
// the staff group, so PSU effectively controlled who could drive our admin API.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as mod from '../../src/lib/auth/roleFromSso.mjs';

const { roleFromSsoGroups } = mod;

test('role: staff group → ADMIN, anywhere in the array, any case', () => {
  assert.equal(roleFromSsoGroups(['staff']), 'ADMIN');
  assert.equal(roleFromSsoGroups(['student', 'staff']), 'ADMIN'); // old groups[0] bug
  assert.equal(roleFromSsoGroups(['STAFF']), 'ADMIN');
});

test('role: faculty group → STAFF; staff beats faculty when both present', () => {
  assert.equal(roleFromSsoGroups(['faculty']), 'STAFF');
  assert.equal(roleFromSsoGroups(['faculty', 'staff']), 'ADMIN');
});

test('role: plain/missing/garbage groups → student', () => {
  assert.equal(roleFromSsoGroups(['student']), 'student');
  assert.equal(roleFromSsoGroups([]), 'student');
  assert.equal(roleFromSsoGroups(undefined), 'student');
  assert.equal(roleFromSsoGroups('staff'), 'student'); // non-array claim is ignored
  assert.equal(roleFromSsoGroups([null, 42, 'staffing']), 'student'); // no substring match
});

test('the module hands out no privilege at all — role is the only export', () => {
  // If something ever adds an isAdmin/privilege export here again, this fails and
  // whoever added it has to come read the header above first.
  assert.deepEqual(Object.keys(mod).sort(), ['roleFromSsoGroups']);
});

test('a staff-group sign-in returns a role string, never a grant object', () => {
  const r = roleFromSsoGroups(['staff']);
  assert.equal(typeof r, 'string');
  assert.ok(!('isAdmin' in Object(r)), 'no isAdmin rides along with the role');
});
