import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { clientIp, rateLimit } from '../../src/lib/rateLimit.js';

const req = (headers) => ({ headers: { get: (k) => headers[k.toLowerCase()] ?? null } });

afterEach(() => { delete process.env.TRUSTED_PROXY_HOPS; });

// nginx writes `X-Forwarded-For $proxy_add_x_forwarded_for`: whatever the client sent,
// then the address nginx itself accepted the connection from.
test('behind one nginx the client IP is the entry nginx appended, not the first one', () => {
  assert.equal(clientIp(req({ 'x-forwarded-for': '203.0.113.7' })), '203.0.113.7');
  assert.equal(clientIp(req({ 'x-forwarded-for': '1.2.3.4, 203.0.113.7' })), '203.0.113.7', 'a made-up first entry is ignored');
  assert.equal(clientIp(req({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.9.9.9, 203.0.113.7' })), '203.0.113.7');
  assert.equal(clientIp(req({ 'x-forwarded-for': '  1.2.3.4 ,  203.0.113.7  ' })), '203.0.113.7', 'spaces are trimmed');
});

test('spoofing the header cannot dodge the limiter: every forged first entry lands in the same bucket', () => {
  const key = (xff) => `spoof-test:${clientIp(req({ 'x-forwarded-for': xff }))}`;
  const results = [];
  for (let i = 1; i <= 12; i++) {
    results.push(rateLimit(key(`198.51.100.${i}, 203.0.113.50`), { limit: 10, windowMs: 60_000 }).ok);
  }
  assert.deepEqual(results, [...Array(10).fill(true), false, false]);
});

test('different real visitors behind nginx still get different buckets', () => {
  const key = (xff) => `real-test:${clientIp(req({ 'x-forwarded-for': xff }))}`;
  for (let i = 1; i <= 15; i++) {
    assert.equal(rateLimit(key(`203.0.113.${i}`), { limit: 1, windowMs: 60_000 }).ok, true, `visitor ${i}`);
  }
});

test('TRUSTED_PROXY_HOPS counts proxies of ours from the right', () => {
  const xff = '1.2.3.4, 203.0.113.7, 10.0.0.2'; // forged, real client, nginx's own upstream (a load balancer)
  assert.equal(clientIp(req({ 'x-forwarded-for': xff })), '10.0.0.2');
  process.env.TRUSTED_PROXY_HOPS = '2';
  assert.equal(clientIp(req({ 'x-forwarded-for': xff })), '203.0.113.7');
  process.env.TRUSTED_PROXY_HOPS = '3';
  assert.equal(clientIp(req({ 'x-forwarded-for': xff })), '1.2.3.4');
  process.env.TRUSTED_PROXY_HOPS = '9';
  assert.equal(clientIp(req({ 'x-forwarded-for': xff })), '1.2.3.4', 'more hops than entries falls back to the first');
  for (const junk of ['0', '-2', 'abc', '']) {
    process.env.TRUSTED_PROXY_HOPS = junk;
    assert.equal(clientIp(req({ 'x-forwarded-for': xff })), '10.0.0.2', `junk ${JSON.stringify(junk)} means 1`);
  }
});

test('no usable X-Forwarded-For: x-real-ip, then "unknown"', () => {
  assert.equal(clientIp(req({ 'x-real-ip': '192.0.2.9' })), '192.0.2.9');
  assert.equal(clientIp(req({ 'x-forwarded-for': ' , ,', 'x-real-ip': '192.0.2.9' })), '192.0.2.9');
  assert.equal(clientIp(req({})), 'unknown');
  assert.equal(clientIp({}), 'unknown');
});
