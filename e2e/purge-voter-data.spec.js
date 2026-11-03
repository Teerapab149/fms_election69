// @ts-check
// scripts/sql/purge-voter-data.sql on the isolated *_e2e database, run exactly as
// written (comments stripped, statements split) through Prisma, since psql is not
// part of the toolchain.
//
//   - a box that still holds a ballot: refused, nothing deleted, clear message
//   - after annual-reset.sql: only ordinary students go; admins and STAFF stay and
//     can still sign in; the Template a deleted user authored survives (author null)
//   - a new SSO-style sign-in (mock-login upserts the same way) creates a fresh row
//
// The database is re-seeded in afterAll: annual-reset and the purge are exactly the
// operations that destroy what the other specs rely on.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { seedTestDb } = require('./helpers/seed');
const { mintSession, castWith, getBallot, prisma, adminLogin, assertLiveTestDb, uniqueStudentId, API, disconnect } = require('./helpers/fixtures');

function statementsOf(file, { keepTx = false } = {}) {
  const raw = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
  const noComments = raw.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
  // split on a semicolon that ends a line, but never inside a $$ block
  const out = [];
  let cur = '';
  let inDollar = false;
  for (const line of noComments.split('\n')) {
    if (line.includes('$$')) inDollar = (line.match(/\$\$/g) || []).length % 2 === 1 ? !inDollar : inDollar;
    cur += line + '\n';
    if (!inDollar && /;\s*$/.test(line)) { out.push(cur.trim()); cur = ''; }
  }
  return out.filter((s) => keepTx || !/^(BEGIN|COMMIT);$/i.test(s));
}

async function runFile(file) {
  const db = prisma();
  await assertLiveTestDb();
  await db.$transaction(statementsOf(file).map((s) => db.$executeRawUnsafe(s)));
}

test.describe.configure({ mode: 'serial' });

const RUN = `${Date.now()}`;
let studentIds = [];

test.afterAll(async () => {
  await seedTestDb();
  await disconnect();
});

test('a box that still holds ballots refuses the purge and deletes nothing', async () => {
  const db = prisma();
  const { realParty } = await getBallot();
  const s1 = `e2e-purge-a-${RUN}`;
  const s2 = `e2e-purge-b-${RUN}`;
  studentIds = [s1, s2];
  const cookie = await mintSession(s1);
  await mintSession(s2);
  expect((await castWith(cookie, realParty.id)).status).toBe(200);

  const before = await db.user.count();
  await expect(runFile('scripts/sql/purge-voter-data.sql')).rejects.toThrow(/หีบยังมีบัตร/);
  expect(await db.user.count(), 'nothing deleted').toBe(before);
  expect(await db.user.findUnique({ where: { studentId: s1 } })).not.toBeNull();
});

test('after annual-reset only ordinary students are removed; admins and STAFF stay and sign in', async () => {
  const db = prisma();
  const staffId = `e2e-purge-staff-${RUN}`;
  const admin2 = `e2e-purge-admin-${RUN}`;
  await db.user.create({ data: { studentId: staffId, name: 'เจ้าหน้าที่ทดสอบ', role: 'STAFF', isAdmin: false, year: null } });
  await db.user.create({ data: { studentId: admin2, name: 'แอดมินทดสอบ', role: 'student', isAdmin: true, year: 'ปี 4' } });
  const regular = await db.user.findUnique({ where: { studentId: studentIds[0] } });
  const tpl = await db.template.create({ data: { slug: `e2e-purge-${RUN}`, name: 'ทดสอบ', authorId: regular.id, pages: {}, elements: {}, theme: {} } });

  await runFile('scripts/sql/annual-reset.sql');
  expect(await db.ballot.count(), 'annual-reset emptied the box').toBe(0);
  await runFile('scripts/sql/purge-voter-data.sql');

  const left = await db.user.findMany({ select: { studentId: true, isAdmin: true, role: true } });
  expect(left.filter((u) => !u.isAdmin && u.role !== 'STAFF'), 'no ordinary student is left').toEqual([]);
  expect(left.map((u) => u.studentId)).toEqual(expect.arrayContaining([staffId, admin2]));
  expect(await db.user.findUnique({ where: { studentId: studentIds[0] } })).toBeNull();
  const t = await db.template.findUnique({ where: { id: tpl.id } });
  expect(t, 'the template survives').not.toBeNull();
  expect(t.authorId, 'with no author').toBeNull();

  const adminCookie = await adminLogin();
  expect(adminCookie).toMatch(/^admin_token=/);
  const dash = await fetch(API('/api/admin/readiness'), { headers: { cookie: adminCookie } });
  expect(dash.status, 'the seeded admin still works').toBe(200);
});

test('running it again is harmless, and a fresh sign-in creates a new row', async () => {
  const db = prisma();
  await runFile('scripts/sql/purge-voter-data.sql');
  const fresh = uniqueStudentId();
  await mintSession(fresh);
  const row = await db.user.findUnique({ where: { studentId: fresh } });
  expect(row, 'sign-in upserted a new user').not.toBeNull();
  expect(row.isVoted).toBe(false);
});
