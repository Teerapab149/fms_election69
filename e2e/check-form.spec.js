// @ts-check
// T4 — /api/check-form answers for the SIGNED-IN voter only.
//
// It used to take ?studentId= with no auth: anyone could probe any student id
// (404 = not on the roll, 200 = on it + form status). Now the identity comes from
// the session and the query param is ignored entirely. This spec signs in voter A
// (form NOT done) and asks about voter B (form done) by id — the answer must be
// A's own `false`, and B's id must never appear in the response.
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers/auth');
const { API, prisma, uniqueStudentId, disconnect } = require('./helpers/fixtures');

/** Eligible voter row, same shape as helpers/seed.js + createIneligibleUser. */
async function createVoter(studentId, isFormCompleted) {
  await prisma().user.create({
    data: {
      studentId,
      name: 'E2E Check-Form',
      email: `${studentId}@mock.dev`,
      facultyId: '30',
      role: 'student',
      year: 'ปี 1',
      gender: 'M',
      major: 'ACC',
      isVoted: false,
      isFormCompleted,
      isAdmin: false,
    },
  });
}

test.describe('check-form is session-only (isolated test DB)', () => {
  test.afterAll(async () => {
    await disconnect();
  });

  test('no session → 401, with or without ?studentId=', async () => {
    for (const route of ['/api/check-form', '/api/check-form?studentId=anything']) {
      const r = await fetch(API(route));
      expect(r.status, `${route} without a session must be 401`).toBe(401);
      const body = await r.json();
      expect(body).not.toHaveProperty('isFormCompleted');
    }
  });

  test("signed-in voter A asking about voter B gets A's own status", async ({ page }) => {
    const a = uniqueStudentId();
    const b = uniqueStudentId();
    await createVoter(a, false);
    await createVoter(b, true);

    // Session cookie now lives in the page context → page.request reuses it.
    await mockLogin(page, a);

    const res = await page.request.get(API('/api/check-form?studentId=' + b));
    expect(res.status()).toBe(200);
    expect(res.headers()['cache-control']).toContain('no-store');
    const text = await res.text();
    expect(text, "response must never echo the other voter's id").not.toContain(b);
    expect(JSON.parse(text)).toEqual({ isFormCompleted: false });
  });
});
