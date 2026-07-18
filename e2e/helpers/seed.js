// @ts-check
// e2e/helpers/seed.js — the SMALL fixture the isolated test DB is born with.
//
// Called by e2e/global.setup.js after `prisma migrate deploy`. Deliberately tiny
// (unlike prisma/seed.js which mints 500 voters): the suite mostly mints its own
// fresh `e2e-*` voters through mock-login, so the seed only needs a valid ballot
// and enough eligible voters for the deterministic specs.
//
// Seeded state:
//   - SystemConfig id=1, systemMode MANUAL_OPEN (voting forced open, clock-free),
//     showResult=false, activeTemplateId "receipt" — the flagship family whose
//     /success prints the v2-R4a identity receipt the vote-flow spec asserts.
//     (/login falls through to the DEFAULT login for "receipt", which is the one
//     carrying the dev mock-login panel — studio-dark/gumroad/verdure would not.)
//   - 2 real parties (number 1, 2) + งดออกเสียง (0) + ไม่รับรอง (-1) special options
//   - 3 eligible voters (ปี 1-4), isVoted=false
//   - 1 admin (isAdmin=true) so adminLogin() can mint an admin_token
//   - ChainHead reset to GENESIS, empty Ballot box  → #ballots==sum(score)==#voted==0
//
// No ballot crypto is needed here (the box starts empty); votes appended by the
// tests use the app's own /api/vote path, which chains them for real.
const bcrypt = require('bcryptjs');
const { testPrisma, truncateAll } = require('./testDb');

// Kept in sync with prisma/seed.js admin bootstrap + scripts/smoke defaults so
// adminLogin()'s password shape (`${email}+${ADMIN_PASSWORD_AUTH_EXTRA}`) works.
const ADMIN_STUDENT_ID = '6610510149';
const ADMIN_EMAIL = '6610510149@email.psu.ac.th';

/** Wipe + reseed the test DB to a known baseline. Idempotent (safe to re-run). */
async function seedTestDb() {
  const db = testPrisma();

  // Guarded wipe (truncateAll asserts current_database() ends with _e2e).
  await truncateAll(db);

  // Chain tip → genesis (empty box).
  await db.chainHead.upsert({
    where: { id: 1 },
    update: { head: 'GENESIS', seq: 0 },
    create: { id: 1, head: 'GENESIS', seq: 0 },
  });

  // SystemConfig — MANUAL_OPEN so the vote/abstain specs never depend on the
  // wall clock. closed.spec flips systemMode to ENDED via a guarded helper.
  await db.systemConfig.create({
    data: {
      id: 1,
      isVoteOpen: true,
      showResult: false,
      systemMode: 'MANUAL_OPEN',
      googleFormUrl: 'https://docs.google.com/forms/d/e/EXAMPLE_E2E/viewform',
      activeTemplateId: 'receipt',
    },
  });

  // Parties: two real (multi-party ballot → 2 parties visible on /vote) + the two
  // special options. Disapprove (-1) is only *selectable* on a single-party
  // ballot; it lives in the DB harmlessly and is never voted by the suite.
  await db.candidate.createMany({
    data: [
      { name: 'E2E พรรคเอกภาพ', number: 1, score: 0, slogan: 'ทดสอบระบบเลือกตั้ง', color: '#8A2680' },
      { name: 'E2E พรรคก้าวไกล', number: 2, score: 0, slogan: 'ทดสอบระบบเลือกตั้ง', color: '#2680A2' },
      { name: 'งดออกเสียง', number: 0, score: 0 },
      { name: 'ไม่รับรอง', number: -1, score: 0 },
    ],
  });

  // A couple of real members on party #1 so readiness/content checks see content.
  const party1 = await db.candidate.findFirst({ where: { number: 1 } });
  if (party1) {
    await db.member.createMany({
      data: [
        { studentId: 'e2e-mem-1', name: 'อีทูอี หัวหน้าพรรค', number: 1, imageUrl: '/images/placeholder.png', position: 'นายกสโมสรนักศึกษา', major: 'บัญชี', candidateId: party1.id },
        { studentId: 'e2e-mem-2', name: 'อีทูอี รองหัวหน้า', number: 2, imageUrl: '/images/placeholder.png', position: 'อุปนายก', major: 'การตลาด', candidateId: party1.id },
      ],
    });
  }

  // Eligible voters (ปี 1-4), unvoted — for deterministic specs that log in as a
  // known identity. Most specs still mint fresh e2e-* ids through mock-login.
  await db.user.createMany({
    data: [
      { studentId: 'e2e-voter-1', name: 'อีทูอี ผู้ลงคะแนนหนึ่ง', email: 'e2e-voter-1@mock.dev', facultyId: '30', role: 'student', year: 'ปี 1', gender: 'M', major: 'ACC', isVoted: false, isFormCompleted: false, isAdmin: false },
      { studentId: 'e2e-voter-2', name: 'อีทูอี ผู้ลงคะแนนสอง', email: 'e2e-voter-2@mock.dev', facultyId: '30', role: 'student', year: 'ปี 2', gender: 'F', major: 'MKT', isVoted: false, isFormCompleted: false, isAdmin: false },
      { studentId: 'e2e-voter-3', name: 'อีทูอี ผู้ลงคะแนนสาม', email: 'e2e-voter-3@mock.dev', facultyId: '30', role: 'student', year: 'ปี 3', gender: 'M', major: 'BIS', isVoted: false, isFormCompleted: false, isAdmin: false },
    ],
  });

  // Admin — password left as bootstrap shape (no passwordHash) so the login route
  // accepts `${email}+${ADMIN_PASSWORD_AUTH_EXTRA}` on first use, exactly like dev.
  const secret = process.env.ADMIN_PASSWORD_AUTH_EXTRA;
  const admin = {
    studentId: ADMIN_STUDENT_ID,
    name: 'E2E Admin',
    email: ADMIN_EMAIL,
    gender: 'M',
    major: 'BIS',
    year: 'ปี 3',
    yearStatus: '3',
    isVoted: false,
    role: 'ADMIN',
    isAdmin: true,
  };
  // If the secret is present, pre-hash so login works without the bootstrap path
  // mutating the row mid-suite; otherwise leave hash null (bootstrap path).
  if (secret) {
    admin.passwordHash = await bcrypt.hash(`${ADMIN_EMAIL}+${secret}`, 12);
  }
  await db.user.create({ data: admin });

  return { parties: 4, voters: 3, admin: ADMIN_STUDENT_ID };
}

module.exports = { seedTestDb, ADMIN_STUDENT_ID, ADMIN_EMAIL };
