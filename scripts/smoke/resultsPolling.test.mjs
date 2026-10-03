// The results page's live loop, both ends of it.
//   resultsPollDelay — how often a tab asks, from what the server last said
//     (not the student's clock: the old loop stopped at the scheduled end, so
//     tabs open at closing time never saw ประกาศผล).
//   resultsCache — the few-second shared snapshot /api/results serves the
//     public, and the bust that keeps it from holding a reveal (or a hide) back.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resultsPollDelay } from '../../src/lib/election/resultsPolling.mjs';
import {
  RESULTS_SNAP_TTL_MS as TTL,
  getSnap, setSnap, bustResultsSnap, resultsSnapGen, loadResultsSnap,
} from '../../src/lib/election/resultsCache.mjs';

const mid = () => 0.5; // no jitter
const rows = [
  ['revealed and certified: slow keep-alive', { status: 'ENDED', isRevealed: true, certified: { by: 'x', at: 'y' } }, 300_000],
  ['revealed, not certified: the banner can still appear', { status: 'ENDED', isRevealed: true, certified: null }, 20_000],
  ['closed, awaiting the announcement', { status: 'ENDED', isRevealed: false, certified: null }, 5_000],
  ['polls open', { status: 'ONGOING', isRevealed: false }, 10_000],
  ['paused', { status: 'CLOSED', isRevealed: false }, 15_000],
  ['before the polls open', { status: 'WAITING', isRevealed: false }, 30_000],
  ['before the campaign', { status: 'PRE_CAMPAIGN', isRevealed: false }, 30_000],
  ['nothing known yet (first fetch failed)', {}, 30_000],
];
for (const [name, input, want] of rows) {
  test(`resultsPollDelay: ${name}`, () => {
    assert.equal(resultsPollDelay(input, mid), want);
  });
}

test('resultsPollDelay: never stops polling, whatever the state', () => {
  for (const [, input] of rows) assert.ok(resultsPollDelay(input, mid) > 0);
  assert.ok(resultsPollDelay(undefined, mid) > 0);
});

test('resultsPollDelay: jitter stays within ±10%', () => {
  const input = { status: 'ENDED', isRevealed: false };
  assert.equal(resultsPollDelay(input, () => 0), 4_500);
  assert.equal(resultsPollDelay(input, () => 0.999999), 5_500);
  for (let i = 0; i < 200; i++) {
    const d = resultsPollDelay(input);
    assert.ok(d >= 4_500 && d <= 5_500, `out of range: ${d}`);
  }
});

beforeEach(() => bustResultsSnap());

test('resultsCache: a stored body is served until the TTL, then not', () => {
  const body = { status: 'ENDED' };
  assert.equal(getSnap(1_000), null);
  assert.equal(setSnap(body, resultsSnapGen(), 1_000), true);
  assert.equal(getSnap(1_000), body);
  assert.equal(getSnap(1_000 + TTL - 1), body);
  assert.equal(getSnap(1_000 + TTL), null);
});

test('resultsCache: bust drops the snapshot at once', () => {
  setSnap({ status: 'ENDED' }, resultsSnapGen(), 1_000);
  bustResultsSnap();
  assert.equal(getSnap(1_001), null);
});

test('resultsCache: a body computed before a bust is never stored', () => {
  // read "revealed", admin presses hide (bust), then the old read lands
  const gen = resultsSnapGen();
  bustResultsSnap();
  assert.equal(setSnap({ isRevealed: true }, gen, 1_000), false);
  assert.equal(getSnap(1_000), null);
});

test('resultsCache: concurrent misses share one computation', async () => {
  let calls = 0;
  let release;
  const gate = new Promise((r) => { release = r; });
  const compute = async () => { calls++; await gate; return { status: 'ENDED', n: calls }; };
  const now = () => 5_000;
  const all = Promise.all([loadResultsSnap(compute, now), loadResultsSnap(compute, now), loadResultsSnap(compute, now)]);
  release();
  const [a, b, c] = await all;
  assert.equal(calls, 1);
  assert.equal(a, b);
  assert.equal(b, c);
  // stored, so the next caller inside the TTL does not compute either
  assert.equal(await loadResultsSnap(compute, now), a);
  assert.equal(calls, 1);
});

test('resultsCache: a bust during a computation starts a fresh one and drops the old body', async () => {
  let release;
  const gate = new Promise((r) => { release = r; });
  const old = loadResultsSnap(async () => { await gate; return { isRevealed: true }; }, () => 1_000);
  bustResultsSnap();
  const fresh = await loadResultsSnap(async () => ({ isRevealed: false }), () => 1_000);
  assert.deepEqual(fresh, { isRevealed: false });
  release();
  await old;
  assert.deepEqual(getSnap(1_000), { isRevealed: false });
});

test('resultsCache: a failed computation is not stored and does not block the next', async () => {
  const boom = loadResultsSnap(async () => { throw new Error('db down'); }, () => 1_000);
  await assert.rejects(boom, /db down/);
  assert.equal(getSnap(1_000), null);
  let calls = 0;
  const body = await loadResultsSnap(async () => { calls++; return { status: 'ONGOING' }; }, () => 1_000);
  assert.equal(calls, 1);
  assert.deepEqual(body, { status: 'ONGOING' });
});
