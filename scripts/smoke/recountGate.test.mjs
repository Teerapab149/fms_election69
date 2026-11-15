// checkRecount (src/lib/certificationRecord.js): certification needs the
// per-option numbers from the offline recount (decrypt-recount.js) and refuses
// unless each equals Candidate.score. SECURITY-AUDIT-2026-11 F1: moving votes
// between parties with the total unchanged passes every other check.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { checkRecount } = require('../../src/lib/certificationRecord.js');

const BOX = [
  { number: -1, name: 'ไม่รับรอง', score: 0 },
  { number: 0, name: 'งดออกเสียง', score: 5 },
  { number: 1, name: 'พรรค A', score: 35 },
  { number: 2, name: 'พรรค B', score: 20 },
];
const TRUE_COUNT = { '-1': 0, 0: 5, 1: 35, 2: 20 };

test('matching numbers for every option pass', () => {
  assert.equal(checkRecount(BOX, TRUE_COUNT), null);
});

test('digit strings from the form are accepted, with spaces around them', () => {
  assert.equal(checkRecount(BOX, { '-1': '0', 0: ' 5', 1: '35 ', 2: '20' }), null);
});

test('the F1 case: 20 votes moved from A to B, totals unchanged, is refused with 409', () => {
  const tampered = BOX.map((c) => (c.number === 1 ? { ...c, score: 15 } : c.number === 2 ? { ...c, score: 40 } : c));
  const r = checkRecount(tampered, TRUE_COUNT);
  assert.equal(r?.status, 409);
  assert.match(r.error, /เบอร์ 1 \(พรรค A\) ในระบบ 15 นับซ้ำ 35/);
  assert.match(r.error, /เบอร์ 2 \(พรรค B\) ในระบบ 40 นับซ้ำ 20/);
  assert.doesNotMatch(r.error, /งดออกเสียง ในระบบ/);
});

test('no recount at all is refused with 400 and says where the numbers come from', () => {
  for (const missing of [undefined, null, 'abc', [], 5]) {
    const r = checkRecount(BOX, missing);
    assert.equal(r?.status, 400, String(missing));
    assert.match(r.error, /decrypt-recount\.js/);
  }
});

test('an option left blank is named', () => {
  const r = checkRecount(BOX, { '-1': 0, 0: 5, 1: 35, 2: '' });
  assert.equal(r?.status, 400);
  assert.match(r.error, /เบอร์ 2 \(พรรค B\)/);
});

test('negative, decimal and non-numeric counts are refused', () => {
  for (const bad of [-1, 1.5, '3a', '1e2', NaN]) {
    const r = checkRecount(BOX, { ...TRUE_COUNT, 1: bad });
    assert.equal(r?.status, 400, String(bad));
  }
});

test('a number that is not on the ballot is refused', () => {
  const r = checkRecount(BOX, { ...TRUE_COUNT, 7: 0 });
  assert.equal(r?.status, 400);
  assert.match(r.error, /7/);
});

test('the certification route calls checkRecount inside the locked transaction, after verifyChain', () => {
  const src = fs.readFileSync(new URL('../../src/app/api/admin/dashboard/route.js', import.meta.url), 'utf8');
  const verify = src.indexOf('await verifyChain(tx, secret)');
  const gate = src.indexOf('checkRecount(candidates, body.recount)');
  const flag = src.indexOf('ballotsAnonymized: true,');
  assert.ok(verify > 0 && gate > verify && flag > gate, 'order: verifyChain, checkRecount, then the flag');
});

test('the certification window never shows the system scores', () => {
  const src = fs.readFileSync(new URL('../../src/components/admin/console/CertifyModal.js', import.meta.url), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
  assert.doesNotMatch(code, /\bscore\b/);
});
