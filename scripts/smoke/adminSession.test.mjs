// lib/auth/adminSession: what ends an admin session before its two hours are up (F8).
import { test } from "node:test";
import assert from "node:assert/strict";
import { passwordVersion, sessionEndedAt, isSessionCurrent } from "../../src/lib/auth/adminSession.mjs";

const HASH_A = "$2b$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const HASH_B = "$2b$12$bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const T = 1_800_000_000_000;

test("the fingerprint follows the hash and gives nothing of it away", () => {
  assert.equal(passwordVersion(HASH_A), passwordVersion(HASH_A));
  assert.notEqual(passwordVersion(HASH_A), passwordVersion(HASH_B));
  assert.match(passwordVersion(HASH_A), /^[0-9a-f]{16}$/);
  assert.ok(!HASH_A.includes(passwordVersion(HASH_A)));
  assert.equal(passwordVersion(""), null);
  assert.equal(passwordVersion(undefined), null);
});

test("a token is good only against the password it was issued with", () => {
  const token = { pv: passwordVersion(HASH_A), ist: T };
  assert.equal(isSessionCurrent(token, { currentHash: HASH_A, globalConfig: {}, userId: 7 }), true);
  // password rotated
  assert.equal(isSessionCurrent(token, { currentHash: HASH_B, globalConfig: {}, userId: 7 }), false);
  // no password on record at all
  assert.equal(isSessionCurrent(token, { currentHash: null, globalConfig: {}, userId: 7 }), false);
  // a token from before the pv claim existed
  assert.equal(isSessionCurrent({ ist: T }, { currentHash: HASH_A, globalConfig: {}, userId: 7 }), false);
  assert.equal(isSessionCurrent(undefined, { currentHash: HASH_A, globalConfig: {}, userId: 7 }), false);
});

test("signing out ends every token issued up to that moment, for that account only", () => {
  const token = { pv: passwordVersion(HASH_A), ist: T };
  const cfg = (at, id = 7) => ({ adminSessionsEndedAt: { [id]: at } });
  assert.equal(isSessionCurrent(token, { currentHash: HASH_A, globalConfig: cfg(T + 1), userId: 7 }), false);
  assert.equal(isSessionCurrent(token, { currentHash: HASH_A, globalConfig: cfg(T), userId: 7 }), false);
  // signed in again one millisecond after signing out
  assert.equal(isSessionCurrent({ ...token, ist: T + 1 }, { currentHash: HASH_A, globalConfig: cfg(T), userId: 7 }), true);
  // somebody else signing out does not touch this account
  assert.equal(isSessionCurrent(token, { currentHash: HASH_A, globalConfig: cfg(T + 5000, 8), userId: 7 }), true);
  // no ist claim: falls back to iat (seconds)
  assert.equal(isSessionCurrent({ pv: token.pv, iat: T / 1000 + 10 }, { currentHash: HASH_A, globalConfig: cfg(T), userId: 7 }), true);
  assert.equal(isSessionCurrent({ pv: token.pv, iat: T / 1000 - 10 }, { currentHash: HASH_A, globalConfig: cfg(T), userId: 7 }), false);
});

test("a missing or garbled sign-out record reads as never signed out", () => {
  assert.equal(sessionEndedAt(null, 7), null);
  assert.equal(sessionEndedAt({}, 7), null);
  assert.equal(sessionEndedAt({ adminSessionsEndedAt: { 7: "x" } }, 7), null);
  assert.equal(sessionEndedAt({ adminSessionsEndedAt: { 7: T } }, 7), T);
});
