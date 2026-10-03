// @ts-check
// H3 — can a voter be lined up with their ballot? On the ISOLATED test DB.
//
// Two linkages existed between the voter's row and the anonymous Ballot row, both
// of which survive without the RSA key (the key only reveals WHAT, these reveal
// WHICH ROW belongs to WHOM):
//   1. User.votedAt was stored to the millisecond and Ballot.seq is cast order, so
//      sorting voters by votedAt reproduces seq order.
//   2. The vote claims the User row and inserts the Ballot row in ONE Postgres
//      transaction, so both tuples carry the SAME system column xmin:
//        SELECT u."studentId", b.seq FROM "User" u JOIN "Ballot" b ON u.xmin = b.xmin
//      names the voter of every ballot exactly, whatever the timestamp precision.
//
// What this spec pins:
//   - votedAt is an hour (zero minutes/seconds/ms) the moment a vote lands;
//   - ordering voters by votedAt says nothing about cast order any more;
//   - the xmin join is MEASURED before certification (the residual window — printed,
//     not asserted, so the number in the report is reproducible) and must be EMPTY
//     after certification (the staff-rehearsal spec asserts that half, since it is
//     the spec that certifies).
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers/auth');
const {
  API,
  prisma,
  assertLiveTestDb,
  uniqueStudentId,
  getBallot,
  disconnect,
} = require('./helpers/fixtures');

const CAST = 4;

test.describe('Ballot unlinkability (H3, isolated test DB)', () => {
  test.afterAll(async () => {
    await disconnect();
  });

  test('votedAt is hour-coarse and carries no cast order', async ({ browser }) => {
    test.setTimeout(180_000);
    await assertLiveTestDb();
    const { realParties } = await getBallot();
    const ids = [];

    // cast one after another, with a real gap, so the OLD millisecond votedAt
    // would have been strictly increasing in cast order
    for (let i = 0; i < CAST; i++) {
      const id = uniqueStudentId();
      ids.push(id);
      const ctx = await browser.newContext();
      try {
        const page = await ctx.newPage();
        await mockLogin(page, id);
        const res = await page.request.post(API('/api/vote'), { data: { candidateId: realParties[i % 2].id } });
        expect(res.status(), `cast #${i + 1}`).toBe(200);
      } finally {
        await ctx.close();
      }
      await new Promise((r) => setTimeout(r, 40));
    }

    const rows = await prisma().$queryRawUnsafe(
      `SELECT "studentId", "votedAt" FROM "User" WHERE "studentId" = ANY($1::text[]) ORDER BY "votedAt", "studentId"`,
      ids
    );
    // eslint-disable-next-line no-console
    console.log('[H3] votedAt of the voters just minted:\n' + rows.map((r) => `  ${r.studentId}  ${r.votedAt.toISOString()}`).join('\n'));
    expect(rows).toHaveLength(CAST);

    // 1. every votedAt is exactly on the hour
    for (const r of rows) {
      const d = r.votedAt;
      expect([d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()], `votedAt of ${r.studentId}`).toEqual([0, 0, 0]);
    }
    const offHour = await prisma().$queryRawUnsafe(
      `SELECT count(*)::int AS n FROM "User" WHERE "votedAt" IS NOT NULL AND "votedAt" <> date_trunc('hour', "votedAt")`
    );
    expect(offHour[0].n, 'no voter anywhere in the DB keeps a sub-hour votedAt').toBe(0);

    // 2. ordering by votedAt no longer reproduces cast order: the voters minted a
    //    few hundred ms apart are one indistinguishable group unless the run
    //    straddles an hour boundary, which can split it into at most two.
    const distinct = new Set(rows.map((r) => r.votedAt.getTime()));
    expect(distinct.size, 'cast-order resolution left in votedAt').toBeLessThanOrEqual(2);

    // 3. the xmin join — measured, printed (before certification this is the
    //    documented residual window: claim + ballot share one transaction)
    const joined = await prisma().$queryRawUnsafe(
      `SELECT u."studentId", b.seq FROM "User" u JOIN "Ballot" b ON u.xmin = b.xmin ORDER BY b.seq`
    );
    const total = await prisma().$queryRawUnsafe(`SELECT count(*)::int AS n FROM "Ballot"`);
    // eslint-disable-next-line no-console
    console.log(`[H3] pre-certification xmin join: ${joined.length} of ${total[0].n} ballots linked\n` + joined.map((r) => `  seq ${r.seq}  <-  ${r.studentId}`).join('\n'));
  });
});
