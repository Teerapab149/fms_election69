import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { transform } = require('next/dist/build/swc');
const source = await readFile(new URL('../../src/hooks/useVoteCast.js', import.meta.url), 'utf8');
const { code } = await transform(source, {
  filename: 'useVoteCast.js', jsc: { parser: { syntax: 'ecmascript' }, target: 'es2020' }, module: { type: 'commonjs' },
});

// Execute the real controller with deterministic hooks and timers. No server,
// browser, authentication, database or vote endpoint is used by these tests.
function harness(quiet = false) {
  const states = [], effects = [], timers = new Map();
  let timerId = 0;
  const fakeReact = {
    useState(value) { const index = states.length; states.push(value); return [value, next => { states[index] = next; }]; },
    useRef(value) { return { current: value }; },
    useEffect(effect) { effects.push(effect); },
    createElement(type, props) { return { type, props }; },
  };
  const sandbox = {
    exports: {}, require(id) { return id === 'react' ? fakeReact : { default: () => null }; },
    window: { matchMedia: () => ({ matches: quiet }) },
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  vm.runInNewContext(code, sandbox);
  const hook = sandbox.exports.useVoteCast({ templateId: 'blossom' });
  const cleanups = effects.map(effect => effect());
  return { ...hook, states, timers, flush() { for (const fn of timers.values()) fn(); timers.clear(); }, dispose() { cleanups.forEach(fn => fn?.()); } };
}

test('successful submission waits for the visual hold, then confirms', async () => {
  const h = harness(); let calls = 0;
  const result = h.playCast(async () => { calls++; return true; });
  await Promise.resolve();
  assert.equal(h.states[0], 'pending'); assert.equal(calls, 1);
  h.flush(); assert.equal(await result, true); assert.equal(h.states[0], 'confirmed');
});

test('animation finishing cannot turn a pending response into success', async () => {
  const h = harness(); let resolve;
  const result = h.playCast(() => new Promise(r => { resolve = r; }));
  h.flush(); await Promise.resolve(); assert.equal(h.states[0], 'pending');
  resolve(false); assert.equal(await result, false); assert.equal(h.states[0], 'idle');
});

test('false and thrown submissions release the guard for retry', async () => {
  const h = harness();
  assert.equal(await h.playCast(async () => false), false); assert.equal(h.timers.size, 0);
  assert.equal(await h.playCast(async () => { throw Error('network'); }), false);
  assert.equal(h.states[0], 'idle');
  const retry = h.playCast(async () => true); h.flush(); assert.equal(await retry, true);
});

test('double confirmation sends exactly one request and remains locked after success', async () => {
  const h = harness(); let count = 0;
  const submit = async () => { count++; return true; };
  const first = h.playCast(submit);
  assert.equal(await h.playCast(submit), false); assert.equal(count, 1);
  h.flush(); await first;
  assert.equal(await h.playCast(submit), false); assert.equal(count, 1);
});

test('reduced motion skips the artificial delay, not the actual submission', async () => {
  const h = harness(true); let calls = 0;
  assert.equal(await h.playCast(async () => { calls++; return true; }), true);
  assert.equal(calls, 1); assert.equal(h.timers.size, 0); assert.equal(h.states[1], true);
});

test('unmount clears hold and prevents a late success navigation', async () => {
  const h = harness(); let resolve;
  const result = h.playCast(() => new Promise(r => { resolve = r; }));
  h.dispose(); assert.equal(h.timers.size, 0); resolve(true);
  assert.equal(await result, false); assert.notEqual(h.states[0], 'confirmed');
});
