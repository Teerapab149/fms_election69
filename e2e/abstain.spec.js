// @ts-check
// v2-R11 — abstain (งดออกเสียง) counts into the abstain option and NEVER touches
// a real party's tally. Isolated test DB + :3100.
//
// The cast goes through the real session (UI mock-login → session cookie →
// page.request POST /api/vote), then the tallies are read straight from the
// test DB — the public API masks scores pre-reveal, so the DB is the truth here.
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers/auth');
const {
  API,
  getBallot,
  candidateScore,
  ballotStats,
  resetVoter,
  disconnect,
} = require('./helpers/fixtures');

// Seeded deterministic voter #2 (e2e/helpers/seed.js) — reset via guarded raw
// SQL so re-runs of this file inside one session stay green.
const VOTER_ID = 'e2e-voter-2';

test.describe('Abstain (งดออกเสียง) — isolated test DB', () => {
  test.beforeAll(async () => {
    await resetVoter(VOTER_ID);
  });

  test.afterAll(async () => {
    await disconnect();
  });

  test('abstain vote → abstain +1, every real party unchanged, ballot box +1', async ({ page }) => {
    const { abstain, realParties } = await getBallot();
    expect(abstain, 'ballot must offer งดออกเสียง (number 0)').toBeTruthy();

    const abstainBefore = await candidateScore(abstain.id);
    const realBefore = new Map();
    for (const p of realParties) realBefore.set(p.id, await candidateScore(p.id));
    const boxBefore = await ballotStats();

    await mockLogin(page, VOTER_ID);
    const res = await page.request.post(API('/api/vote'), { data: { candidateId: abstain.id } });
    expect(res.status(), 'abstain cast should succeed').toBe(200);
    expect((await res.json()).success).toBe(true);

    // Tallies (test-DB truth): abstain +1, real parties untouched, box +1.
    expect(await candidateScore(abstain.id), 'abstain +1').toBe(abstainBefore + 1);
    for (const p of realParties) {
      expect(await candidateScore(p.id), `party "${p.name}" untouched`).toBe(realBefore.get(p.id));
    }
    const boxAfter = await ballotStats();
    expect(boxAfter.ballots, 'Ballot +1').toBe(boxBefore.ballots + 1);
    expect(boxAfter.headSeq, 'ChainHead.seq +1').toBe(boxBefore.headSeq + 1);
  });
});
