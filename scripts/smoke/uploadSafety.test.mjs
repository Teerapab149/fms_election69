import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  MAX_UPLOAD_FILE_BYTES,
  MAX_UPLOAD_REQUEST_BYTES,
  requestTooLarge,
  firstOversizedFile,
  parseNumericId,
  safeFilePart,
} from '../../src/lib/media/uploadSafety.mjs';

test('parseNumericId: a whole positive integer or nothing', () => {
  assert.equal(parseNumericId('1'), 1);
  assert.equal(parseNumericId('42'), 42);
  for (const bad of ['', ' 1', '1 ', '0', '-1', '1.5', '1e3', '1abc', 'abc', '1/../../x', '1%2F..', '٣', '1234567890', null, undefined, 5]) {
    assert.equal(parseNumericId(bad), null, JSON.stringify(bad));
  }
});

test('safeFilePart: no separator and no dot survives, so a name cannot leave its folder', () => {
  const targetDir = path.join(path.sep, 'srv', 'public', 'images', 'members', 'party_1');
  const hostile = [
    '../../../../../../etc/cron.d/x',
    '..\\..\\..\\windows\\x',
    '../../../../../../.specs/tmp/escA',
    'a/b',
    '..',
    '.',
    '....//....//',
    'x\0y',
    '/abs/path',
    'C:\\Windows\\x',
  ];
  for (const h of hostile) {
    const part = safeFilePart(h);
    assert.match(part, /^[A-Za-z0-9_-]+$/, `${JSON.stringify(h)} -> ${part}`);
    // the exact shape the route builds: <position>_<studentId>_<time>.<ext>
    const written = path.join(targetDir, `400_${part}_abc12.webp`);
    assert.ok(written.startsWith(targetDir + path.sep), `${JSON.stringify(h)} escaped: ${written}`);
    assert.equal(path.dirname(written), targetDir, `${JSON.stringify(h)} went into a subfolder`);
  }
  // the names real studentIds and the e2e fixtures use are left alone
  assert.equal(safeFilePart('9950000101'), '9950000101');
  assert.equal(safeFilePart('e2e-mem-1'), 'e2e-mem-1');
  assert.equal(safeFilePart('bulk_7'), 'bulk_7');
  // nothing usable left: the fallback, never an empty name
  assert.equal(safeFilePart(''), 'x');
  assert.equal(safeFilePart(null), 'x');
  assert.equal(safeFilePart('../..'), 'x');
  assert.equal(safeFilePart('..', 'id_9'), 'id_9');
  assert.ok(safeFilePart('a'.repeat(500)).length <= 40);
});

test('requestTooLarge: only a Content-Length over the cap is refused', () => {
  assert.equal(requestTooLarge(String(MAX_UPLOAD_REQUEST_BYTES)), false, 'exactly the cap passes');
  assert.equal(requestTooLarge(String(MAX_UPLOAD_REQUEST_BYTES + 1)), true);
  assert.equal(requestTooLarge('63000000'), false, 'the 63 MB party form of P-LOG-145 passes');
  assert.equal(requestTooLarge('1000000000'), true);
  for (const unknown of [null, undefined, '', 'abc']) assert.equal(requestTooLarge(unknown), false, String(unknown));
});

test('firstOversizedFile: finds a big file among small ones, ignores text fields', () => {
  const small = new Blob([new Uint8Array(1024)]);
  const atCap = new Blob([new Uint8Array(MAX_UPLOAD_FILE_BYTES)]);
  const big = new Blob([new Uint8Array(MAX_UPLOAD_FILE_BYTES + 1)]);

  const ok = new FormData();
  ok.append('name', 'x'.repeat(MAX_UPLOAD_FILE_BYTES + 5)); // a long text field is not a file
  ok.append('file', small, 'a.jpg');
  ok.append('member_file_1', atCap, 'b.jpg');
  assert.equal(firstOversizedFile(ok), null);

  const bad = new FormData();
  bad.append('file', small, 'a.jpg');
  bad.append('member_file_7', big, 'huge.jpg');
  const found = firstOversizedFile(bad);
  assert.equal(found.key, 'member_file_7');
  assert.equal(found.name, 'huge.jpg');
  assert.equal(found.size, MAX_UPLOAD_FILE_BYTES + 1);
});

test('the party form that used to work still fits: 30 members x 2 MB, or 63 MB in one request', () => {
  const form = new FormData();
  for (let i = 0; i < 30; i++) form.append(`member_file_m${i}`, new Blob([new Uint8Array(2 * 1024 * 1024)]), 'm.jpg');
  assert.equal(firstOversizedFile(form), null);
  assert.equal(requestTooLarge(String(30 * 2 * 1024 * 1024 + 4096)), false);
});
