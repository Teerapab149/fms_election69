import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readApiError, TOO_LARGE_MESSAGE } from '../../src/utils/apiError.mjs';

const jsonRes = (status, body) => ({ status, json: async () => body });
const htmlRes = (status) => ({ status, json: async () => { throw new SyntaxError("Unexpected token '<'"); } });

test('our own JSON refusal wins, including a 413 with its own sentence', async () => {
  assert.equal(await readApiError(jsonRes(400, { error: 'เลขพรรคซ้ำ' }), 'x'), 'เลขพรรคซ้ำ');
  assert.equal(await readApiError(jsonRes(413, { error: 'มีรูปที่ใหญ่เกิน 20 MB' }), 'x'), 'มีรูปที่ใหญ่เกิน 20 MB');
});

test('an HTML error page from the proxy never throws; 413 says the file is too large', async () => {
  assert.equal(await readApiError(htmlRes(413), 'x'), TOO_LARGE_MESSAGE);
  assert.match(TOO_LARGE_MESSAGE, /ใหญ่เกิน/);
  assert.match(TOO_LARGE_MESSAGE, /IT/);
});

test('other non-JSON answers use the fallback', async () => {
  assert.equal(await readApiError(htmlRes(502), 'บันทึกไม่สำเร็จ (รหัส 502)'), 'บันทึกไม่สำเร็จ (รหัส 502)');
  assert.equal(await readApiError(jsonRes(500, {}), 'f'), 'f');
  assert.equal(await readApiError(jsonRes(500, { error: '  ' }), 'f'), 'f');
  assert.equal(await readApiError(jsonRes(500, null), 'f'), 'f');
});
