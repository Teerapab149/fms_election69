// lib/cache/ttlCache.mjs — TTL, single-flight, bust vs. an in-flight load, no cached failures,
// and that bustResultsSnap() (called by dashboard + global-config after every write) busts it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ttlCache, bustAllTtlCaches } from '../../src/lib/cache/ttlCache.mjs';
import { bustResultsSnap } from '../../src/lib/election/resultsCache.mjs';

let n = 0;
const fresh = (ttl = 3000) => ttlCache(`t${++n}`, ttl);

test('serves from cache within TTL, reloads after', async () => {
  const c = fresh(1000); let loads = 0; let t = 0;
  const now = () => t;
  const load = async () => ++loads;
  assert.equal(await c.get('', load, now), 1);
  t = 999; assert.equal(await c.get('', load, now), 1);
  t = 1000; assert.equal(await c.get('', load, now), 2);
});

test('single-flight: concurrent misses share one load', async () => {
  const c = fresh(); let loads = 0;
  const load = async () => { loads++; await new Promise((r) => setTimeout(r, 10)); return 'v'; };
  const r = await Promise.all([c.get('', load), c.get('', load), c.get('', load)]);
  assert.deepEqual(r, ['v', 'v', 'v']); assert.equal(loads, 1);
});

test('keys are independent', async () => {
  const c = fresh();
  assert.equal(await c.get('a', async () => 1), 1);
  assert.equal(await c.get('b', async () => 2), 2);
  assert.equal(await c.get('a', async () => 9), 1);
});

test('bust: next get reloads', async () => {
  const c = fresh(); let v = 'old';
  assert.equal(await c.get('', async () => v), 'old');
  v = 'new'; c.bust();
  assert.equal(await c.get('', async () => v), 'new');
});

test('bust during an in-flight load: the stale result is not stored', async () => {
  const c = fresh(); let release; let v = 'old';
  const slow = c.get('', () => { const seen = v; return new Promise((r) => { release = () => r(seen); }); });
  await new Promise((r) => setTimeout(r, 5));
  v = 'new'; c.bust();               // admin write lands while the old read is out
  release();
  assert.equal(await slow, 'old');   // the caller that started before the write gets its answer…
  assert.equal(await c.get('', async () => v), 'new'); // …but nobody after the bust does
});

test('failures are not cached', async () => {
  const c = fresh(); let k = 0;
  await assert.rejects(c.get('', async () => { k++; throw new Error('db down'); }));
  assert.equal(await c.get('', async () => { k++; return 'ok'; }), 'ok');
  assert.equal(k, 2);
});

test('bustAllTtlCaches and bustResultsSnap reach every named cache', async () => {
  const a = fresh(); const b = fresh(); let v = 1;
  await a.get('', async () => v); await b.get('', async () => v);
  v = 2; bustAllTtlCaches();
  assert.equal(await a.get('', async () => v), 2);
  v = 3; bustResultsSnap();
  assert.equal(await a.get('', async () => v), 3);
  assert.equal(await b.get('', async () => v), 3);
});
