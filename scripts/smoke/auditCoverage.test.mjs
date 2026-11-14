// Every admin API route that changes state must leave an AdminAuditLog row (F7).
// Reads the real route files, so a new admin route added without the audit helper
// fails here instead of quietly going unrecorded. Each exported POST / PUT / PATCH /
// DELETE handler must call audited(), writeAudit() or insert the row itself.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const ADMIN_DIR = path.join(ROOT, 'src/app/api/admin');
const UNSAFE = ['POST', 'PUT', 'PATCH', 'DELETE'];
const AUDIT_CALL = /\baudited\(|\bwriteAudit\(|adminAuditLog\.create\(|\bauditToolAction\(|\blogScheduleChange\(|\bloginAudit\(/g;

function routeFiles(dir = ADMIN_DIR, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) routeFiles(p, out);
    else if (e.name === 'route.js') out.push(p);
  }
  return out;
}

test('every state-changing admin handler writes an audit row', () => {
  const missing = [];
  let handlers = 0;
  for (const file of routeFiles()) {
    const src = fs.readFileSync(file, 'utf8');
    const methods = UNSAFE.filter((m) => new RegExp(`export\\s+(?:async\\s+)?function\\s+${m}\\b`).test(src));
    if (methods.length === 0) continue;
    handlers += methods.length;
    // at least one audit call per mutating handler in the file
    const calls = (src.match(AUDIT_CALL) || []).length;
    if (calls < methods.length) {
      missing.push(`${path.relative(ROOT, file).split(path.sep).join('/')} (${methods.join(', ')}: ${calls} audit call(s))`);
    }
  }
  assert.ok(handlers >= 13, `expected to find the admin handlers, found ${handlers}`);
  assert.deepEqual(missing, [], 'admin routes that change state without an audit row');
});
