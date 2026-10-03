// What a student is told after pressing confirm (src/lib/election/voteOutcome.mjs).
// Before this, every failure was alert(error.message): a 502 page from the proxy
// surfaced as "Unexpected token '<'", and a timeout after the commit said "failed,
// try again" about a vote that had been counted. The rule under test: "not
// recorded" only when our own handler said so; anything unclear is re-checked.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyVoteResponse as classify, classifyRecheck, voteErrorFor } from '../../src/lib/election/voteOutcome.mjs';

const json = (o) => JSON.stringify(o);
const refusal = (status, code, error = 'ข้อความจากเซิร์ฟเวอร์') => ({ ok: false, status, bodyText: json({ code, error }) });

test('2xx with success:true is the only ok', () => {
  assert.equal(classify({ ok: true, status: 200, bodyText: json({ success: true }) }).kind, 'ok');
});

test('2xx without success:true is unclear, not ok and not failed', () => {
  for (const bodyText of ['', '{}', json({ success: false }), '<html>ok</html>', 'null', '[]']) {
    assert.equal(classify({ ok: true, status: 200, bodyText }).kind, 'unclear', bodyText);
  }
});

const codes = [
  [401, 'UNAUTHENTICATED', 'login'],
  [429, 'RATE_LIMITED', 'notice'],
  [503, 'NOT_READY', 'notice'],
  [403, 'CERTIFIED', 'closed'],
  [403, 'PAUSED', 'closed'],
  [403, 'ENDED', 'closed'],
  [403, 'NOT_STARTED', 'closed'],
  [403, 'AUTO_CLOSED', 'closed'],
  [400, 'BAD_REQUEST', 'notice'],
  [400, 'BAD_CHOICE', 'notice'],
  [404, 'USER_NOT_FOUND', 'blocked'],
  [403, 'INELIGIBLE', 'blocked'],
  [403, 'ALREADY_VOTED', 'voted'],
  [500, 'SERVER', 'failed'],
];
for (const [status, code, kind] of codes) {
  test(`${status} ${code} → ${kind}`, () => {
    const r = classify(refusal(status, code));
    assert.equal(r.kind, kind);
    assert.equal(r.code, code);
  });
}

test('a JSON code wins over the status class (NOT_READY 503, SERVER 500 are answers, not gateway noise)', () => {
  assert.equal(classify(refusal(503, 'NOT_READY')).kind, 'notice');
  assert.equal(classify(refusal(500, 'SERVER')).kind, 'failed');
  // and a gateway 5xx without our code stays unclear
  assert.equal(classify({ ok: false, status: 503, bodyText: json({ error: 'Service Unavailable' }) }).kind, 'unclear');
});

test('HTML, empty and garbage bodies are unclear whatever the status', () => {
  const html = '<html><body><h1>502 Bad Gateway</h1></body></html>';
  for (const status of [400, 403, 413, 429, 500, 502, 504]) {
    assert.equal(classify({ ok: false, status, bodyText: html }).kind, 'unclear', `HTML ${status}`);
    assert.equal(classify({ ok: false, status, bodyText: '' }).kind, 'unclear', `empty ${status}`);
  }
  assert.equal(classify({ ok: false, status: 502, bodyText: '{"code":' }).kind, 'unclear');
  assert.equal(classify().kind, 'unclear');
});

test('a 4xx JSON refusal without a known code is still a refusal before any write', () => {
  assert.equal(classify({ ok: false, status: 401, bodyText: json({ error: 'x' }) }).kind, 'login');
  const r = classify({ ok: false, status: 403, bodyText: json({ error: 'คุณใช้สิทธิ์เลือกตั้งไปแล้ว' }) });
  assert.equal(r.kind, 'notice');
  assert.equal(r.message, 'คุณใช้สิทธิ์เลือกตั้งไปแล้ว');
});

test('re-check: voted → ok, no session → login, voter not voted → retry, failure → unknown', () => {
  assert.equal(classifyRecheck({ statusData: { isVoted: true, voter: {} } }).kind, 'ok');
  // signed-out answer: isVoted:false with no voter block says nothing about this ballot
  assert.equal(classifyRecheck({ statusData: { isVoted: false } }).kind, 'login');
  assert.equal(classifyRecheck({ statusData: { isVoted: false, voter: { studentId: '1' } } }).kind, 'unclear-retry');
  assert.equal(classifyRecheck({ failed: true }).kind, 'unknown');
  assert.equal(classifyRecheck({ statusData: null }).kind, 'unknown');
});

const NOT_RECORDED = /ยังไม่ถูกบันทึก/;

test('"not recorded" is said only after our handler\'s SERVER answer', () => {
  assert.match(voteErrorFor(classify(refusal(500, 'SERVER'))).message, NOT_RECORDED);
  for (const outcome of [{ kind: 'unclear-retry' }, { kind: 'unknown' }, { kind: 'login' }, { kind: 'unclear' }]) {
    const e = voteErrorFor(outcome);
    assert.doesNotMatch(`${e.title} ${e.message}`, NOT_RECORDED, outcome.kind);
  }
});

test('error objects: ok is null; kinds, actions and the close rule', () => {
  assert.equal(voteErrorFor({ kind: 'ok' }), null);
  const failed = voteErrorFor({ kind: 'failed' });
  assert.equal(failed.kind, 'retry');
  assert.ok(failed.dismissLabel, 'retry can be closed back onto the ballot');
  assert.equal(voteErrorFor({ kind: 'unclear-retry' }).kind, 'retry');
  for (const k of ['unknown', 'voted', 'login', 'closed', 'blocked', 'notice']) {
    const e = voteErrorFor({ kind: k });
    assert.equal(e.kind, k);
    assert.ok(e.title && e.message && e.actionLabel, k);
    assert.equal(e.dismissLabel, null, `${k} has one button`);
  }
  assert.equal(voteErrorFor({ kind: 'voted' }).actionLabel, 'ไปหน้ายืนยันการใช้สิทธิ์');
  // an unclear outcome that skipped the re-check still gets the careful copy
  assert.equal(voteErrorFor({ kind: 'unclear' }).kind, 'unknown');
});

test('the server sentence is shown where it explains the reason, ours where it is about the situation', () => {
  const closed = voteErrorFor(classify(refusal(403, 'ENDED', 'ปิดหีบแล้ว ไม่รับลงคะแนนเพิ่ม')));
  assert.equal(closed.message, 'ปิดหีบแล้ว ไม่รับลงคะแนนเพิ่ม');
  const limited = voteErrorFor(classify(refusal(429, 'RATE_LIMITED', 'ดำเนินการบ่อยเกินไป ลองใหม่ใน 12 วินาที')));
  assert.equal(limited.message, 'ดำเนินการบ่อยเกินไป ลองใหม่ใน 12 วินาที');
  const voted = voteErrorFor(classify(refusal(403, 'ALREADY_VOTED', 'คุณใช้สิทธิ์เลือกตั้งไปแล้ว')));
  assert.equal(voted.message, 'บัตรที่ส่งไว้ก่อนหน้านี้คือบัตรที่ถูกนับ');
});

test('no parser or English text ever reaches the student', () => {
  const inputs = [
    { ok: false, status: 502, bodyText: '<html>Bad Gateway</html>' },
    { ok: false, status: 504, bodyText: 'upstream timed out' },
    { ok: true, status: 200, bodyText: 'Unexpected token' },
  ];
  for (const input of inputs) {
    const outcome = classify(input);
    assert.equal(outcome.message, null);
    const e = voteErrorFor(outcome.kind === 'unclear' ? classifyRecheck({ failed: true }) : outcome);
    assert.doesNotMatch(`${e.title} ${e.message}`, /[A-Za-z]/);
  }
});
