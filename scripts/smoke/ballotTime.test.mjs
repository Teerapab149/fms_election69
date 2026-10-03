import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { hourWindow } from '../../src/components/v2/shared/election/voteTime.mjs';

const require = createRequire(import.meta.url);
const { hourFloor, hourBucketBangkok } = require('../../src/lib/ballotChain.js');

// H3: User.votedAt is floored to the hour so ORDER BY votedAt cannot reproduce
// Ballot.seq (cast order). The floor must agree with Ballot.hourBucket.

test('hourFloor drops minutes, seconds and milliseconds', () => {
  const d = hourFloor(Date.parse('2026-10-03T02:52:16.743Z'));
  assert.equal(d.toISOString(), '2026-10-03T02:00:00.000Z');
});

test('hourFloor leaves an exact hour untouched and is idempotent', () => {
  const t = Date.parse('2026-10-03T02:00:00.000Z');
  assert.equal(hourFloor(t).getTime(), t);
  assert.equal(hourFloor(hourFloor(t + 1234567).getTime()).getTime(), hourFloor(t + 1234567).getTime());
});

test('two votes seconds apart collapse to one votedAt (no cast order left)', () => {
  const a = hourFloor(Date.parse('2026-10-03T02:52:10.563Z'));
  const b = hourFloor(Date.parse('2026-10-03T02:52:12.808Z'));
  assert.equal(a.getTime(), b.getTime());
});

test('floor agrees with the ballot hour bucket across the Bangkok day boundary', () => {
  // 17:59:59Z on the 2nd = 00:59:59 Bangkok on the 3rd
  const now = Date.parse('2026-10-02T17:59:59.999Z');
  const f = hourFloor(now);
  assert.equal(f.toISOString(), '2026-10-02T17:00:00.000Z');
  assert.equal(hourBucketBangkok(now), '2569-10-03T00');
  assert.equal(hourBucketBangkok(f.getTime()), hourBucketBangkok(now));
});

test('the success screens read the stored hour as a window, never a minute', () => {
  const w = hourWindow(hourFloor(Date.parse('2026-10-03T02:52:16.743Z')));
  assert.match(w, /ช่วง 09\.00–10\.00 น\.$/);
  assert.doesNotMatch(w, /:\d\d/);
});
