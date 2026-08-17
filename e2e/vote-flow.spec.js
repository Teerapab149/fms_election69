// @ts-check
// v2-R11 Pillar-1 (TRUSTWORTHY) E2E — the headline vote journey, on the ISOLATED
// test DB (`<devName>_e2e`) + `next start` :3100. No dev-DB coupling remains.
//
//   mock login (seeded voter) → /vote shows both parties → select → tray →
//   confirm slip → /success prints the v2-R4a IDENTITY RECEIPT (name + studentId
//   exactly matching the seed fixture) → a re-vote is rejected (UI redirect +
//   API 403) → and in the test DB: Ballot +1, Candidate.score +1, ChainHead.seq
//   +1, and the FULL HMAC chain recomputes cleanly (scripts/lib/chainVerify —
//   the same logic certification uses; imported, not reimplemented).
//
// Template under test: `receipt` (seeded activeTemplateId) — its /success is the
// page that prints the identity receipt. /login falls through to the default
// login (the one with the dev mock panel), so the auth helper works unchanged.
//
// NOTE (audit vs pre-R11 spec): the old expectation "API 400/409 on re-vote" does
// not match the implementation — /api/vote returns **403** both from the friendly
// isVoted pre-check and from the atomic claim guard (vote/route.js). Asserted 403.
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers/auth');
const {
  API,
  getBallot,
  ballotStats,
  candidateScore,
  verifyBallotChain,
  resetVoter,
  disconnect,
} = require('./helpers/fixtures');

// Seeded deterministic voter (e2e/helpers/seed.js) — the identity the receipt
// must print. resetVoter() in beforeAll makes the spec self-healing on re-runs.
const VOTER = { studentId: 'e2e-voter-1', name: 'อีทูอี ผู้ลงคะแนนหนึ่ง' };

test.describe('Vote flow (receipt template, isolated test DB)', () => {
  test.beforeAll(async () => {
    await resetVoter(VOTER.studentId); // guarded raw SQL on the *_e2e DB
  });

  test.afterAll(async () => {
    await disconnect();
  });

  test('login → see 2 parties → cast → identity receipt → re-vote rejected → box +1 & chain verifies', async ({ page }) => {
    const { realParties, realParty } = await getBallot();
    expect(realParties.length, 'seed ships 2 real parties').toBe(2);

    const before = await ballotStats();
    const scoreBefore = await candidateScore(realParty.id);

    // 1. Real NextAuth mock-login → lands on /vote (receipt ballot).
    await mockLogin(page, VOTER.studentId);
    await expect(page.getByRole('heading', { name: 'บัตรลงคะแนนเลือกตั้ง' })).toBeVisible();

    // 2. Both seeded parties are on the ballot.
    for (const p of realParties) {
      await expect(page.locator('.rc-vrow__name', { hasText: p.name }).first()).toBeVisible();
    }

    // 3. Select party #1 → tray confirm ("หย่อนบัตร") → confirm slip → drop.
    await page.locator('.rc-vrow__name', { hasText: realParty.name }).first().click();
    const trayBtn = page.locator('.rc-vbar__btn');
    await expect(trayBtn).toBeEnabled();
    await trayBtn.click();
    // Confirm slip: shows the selection + the final confirm.
    await expect(page.locator('.rc-cslip__title')).toHaveText('ยืนยันการลงคะแนน');
    await page.locator('.rc-cslip__go').click();

    // 4. Success page (ballot-drop scene plays first — generous timeout).
    await page.waitForURL('**/success**', { timeout: 30000 });

    // 5. IDENTITY RECEIPT (v2-R4a): the voter's own name + studentId, exactly the
    //    seeded fixture values. (Never any choice — v2-SEC has no such link.)
    // strict-mode: the phrase appears twice (headline eyebrow + receipt title) —
    // target the receipt's own h1.
    await expect(page.getByRole('heading', { name: 'บันทึกคะแนนแล้ว' })).toBeVisible({ timeout: 15000 });
    const receipt = page.locator('.rc-suc-line', { hasText: 'ผู้ใช้สิทธิ์' });
    await expect(receipt).toContainText(VOTER.name);
    const idLine = page.locator('.rc-suc-line', { hasText: 'รหัสนักศึกษา' });
    await expect(idLine).toContainText(VOTER.studentId);

    // 6. Re-vote is rejected.
    //    UI: a voted user opening /vote is bounced straight back to /success.
    await page.goto('/vote');
    await page.waitForURL('**/success**', { timeout: 20000 });
    //    API: the atomic guard answers 403 (see header note re old 400/409 claim).
    const again = await page.request.post(API('/api/vote'), { data: { candidateId: realParty.id } });
    expect(again.status(), 're-vote must be rejected by the atomic guard').toBe(403);
    expect((await again.json()).error).toMatch(/ใช้สิทธิ/);

    // 7. Test-DB truth: exactly one new chained ballot, one score increment, and
    //    the whole HMAC chain still recomputes cleanly (certification logic).
    const after = await ballotStats();
    expect(after.ballots, 'Ballot +1').toBe(before.ballots + 1);
    expect(after.headSeq, 'ChainHead.seq +1').toBe(before.headSeq + 1);
    expect(await candidateScore(realParty.id), 'score +1').toBe(scoreBefore + 1);

    const chain = await verifyBallotChain();
    // "ballots==voted" is deliberately excluded: resetVoter() (retry harness
    // semantics) legitimately reopens a voter whose ballot already sits in the
    // append-only box, so that count tie only holds on a first pass. The chain
    // itself (integrity + head) and the tally tie (ballots==score) must ALWAYS hold.
    const mustHold = ['chain-integrity', 'head-matches', 'ballots==score'];
    for (const c of chain.checks.filter((x) => mustHold.includes(x.name))) {
      expect(c.ok, `chain check "${c.name}": ${c.detail}`).toBe(true);
    }
  });
});
