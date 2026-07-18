// Pure unit tests for the SSO → privilege rule (src/lib/auth/roleFromSso.mjs).
// No server needed — runs in the same `npm run smoke` pass as election.test.mjs.
//
// THE invariant these protect (runbook §10): a PSU account that is in neither
// the "staff"/"faculty" SSO group nor ADMIN_STUDENT_IDS must NOT get admin.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roleFromSsoGroups, resolveSsoPrivileges } from '../../src/lib/auth/roleFromSso.mjs';

test('role: staff group → ADMIN, anywhere in the array, any case', () => {
  assert.equal(roleFromSsoGroups(['staff']), 'ADMIN');
  assert.equal(roleFromSsoGroups(['student', 'staff']), 'ADMIN'); // old groups[0] bug
  assert.equal(roleFromSsoGroups(['STAFF']), 'ADMIN');
});

test('role: faculty group → STAFF; staff beats faculty when both present', () => {
  assert.equal(roleFromSsoGroups(['faculty']), 'STAFF');
  assert.equal(roleFromSsoGroups(['faculty', 'staff']), 'ADMIN');
});

test('role: plain/missing/garbage groups → student (never admin)', () => {
  assert.equal(roleFromSsoGroups(['student']), 'student');
  assert.equal(roleFromSsoGroups([]), 'student');
  assert.equal(roleFromSsoGroups(undefined), 'student');
  assert.equal(roleFromSsoGroups('staff'), 'student'); // non-array claim is ignored
  assert.equal(roleFromSsoGroups([null, 42, 'staffing']), 'student'); // no substring match
});

test('privileges: non-staff, non-allowlisted account gets NO admin (the invariant)', () => {
  const p = resolveSsoPrivileges({
    groups: ['student'],
    studentId: '6699999999',
    adminIdsEnv: '6610510149,6610510129',
  });
  assert.deepEqual(p, { role: 'student', isAdmin: false });
});

test('privileges: allowlisted student keeps role=student but gets isAdmin', () => {
  const p = resolveSsoPrivileges({
    groups: ['student'],
    studentId: '6610510149',
    adminIdsEnv: ' 6610510149 , 6610510129 ', // whitespace tolerated
  });
  assert.deepEqual(p, { role: 'student', isAdmin: true });
});

test('privileges: staff/faculty groups grant isAdmin without the allowlist', () => {
  assert.deepEqual(
    resolveSsoPrivileges({ groups: ['staff'], studentId: '6699999999', adminIdsEnv: '' }),
    { role: 'ADMIN', isAdmin: true }
  );
  assert.deepEqual(
    resolveSsoPrivileges({ groups: ['faculty'], studentId: '6699999999', adminIdsEnv: '' }),
    { role: 'STAFF', isAdmin: true }
  );
});

test('privileges: unset env falls back to the legacy admin pair', () => {
  const legacy = resolveSsoPrivileges({ groups: [], studentId: '6610510129' });
  assert.equal(legacy.isAdmin, true);
  const stranger = resolveSsoPrivileges({ groups: [], studentId: '6600000000' });
  assert.equal(stranger.isAdmin, false);
});
