// @ts-check
// Admin console, pressed through a real browser on the ISOLATED test DB
// (`<devName>_e2e`) + prod build. The console was rebuilt (control center, general
// settings, parties, theme chooser, readiness, manual); the cases below walk the
// screens as they are now. Closing the box, publishing, certifying and the staff
// account are in staff-rehearsal.spec.js, and are not repeated here.
//
// Nothing here changes election state: edits are typed and then cancelled, the
// theme change is cancelled at the confirm dialog, and the DB is checked after.
//
// One committee login (API) is shared by every case through the admin_token
// cookie. /api/admin/login allows 10 attempts / 5 min per X-Forwarded-For and
// every spec's adminLogin() shares the unmarked bucket, so the cases that
// type credentials into the form carry their own made-up address.
const { test, expect } = require('@playwright/test');
const { E2E_ADMIN_PASSWORD, ADMIN_STUDENT_ID } = require('./helpers/seed');
const { BASE_PATH, SERVER, prisma, adminLogin, disconnect } = require('./helpers/fixtures');

const ADMIN = `${BASE_PATH}/admin`;
const LOGIN = `${BASE_PATH}/admin/login`;

// sidebar label, top-bar title and a heading that only that tab renders
const TABS = [
  { id: 'overview', label: 'ศูนย์ควบคุม', heading: 'โหมดการทำงานของระบบ' },
  { id: 'globalConfig', label: 'ตั้งค่าทั่วไป', heading: 'ตั้งค่าทั่วไป' },
  { id: 'candidates', label: 'จัดการผู้สมัคร', heading: 'พรรคผู้สมัคร' },
  { id: 'pageDesign', label: 'เลือกธีม', heading: 'เลือกธีมเว็บไซต์' },
  { id: 'settings', label: 'ความพร้อมและระบบ', heading: 'ตรวจความพร้อมระบบ' },
  { id: 'manual', label: 'คู่มือใช้งาน', heading: 'คู่มือใช้งาน ทำอะไรก่อนหลัง' },
];

const RUN = Number(`${Date.now()}`.slice(-6));
let xffSeq = 0;
const nextXff = () => `203.0.113.${(RUN + ++xffSeq) % 250 + 1}`;

/** @type {string} */
let adminToken = '';

/** Fresh page that is already signed in as the committee admin. */
async function adminPage(browser, viewport) {
  const ctx = await browser.newContext(viewport ? { viewport } : {});
  await ctx.addCookies([{ name: 'admin_token', value: adminToken, url: SERVER }]);
  const page = await ctx.newPage();
  /** @type {string[]} */
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  return { ctx, page, pageErrors };
}

async function openTab(page, id, heading) {
  await page.goto(`${ADMIN}?tab=${id}`);
  await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible({ timeout: 20000 });
}

test.describe('Admin console (isolated test DB)', () => {
  test.beforeAll(async () => {
    adminToken = (await adminLogin()).replace('admin_token=', '');
  });

  test.afterAll(async () => {
    await disconnect();
  });

  test('login page: form fields, show-password eye, and a wrong password stays on the page with an error', async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': nextXff() } });
    const page = await ctx.newPage();
    await page.goto(LOGIN);

    await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบจัดการ' })).toBeVisible();
    const user = page.locator('#admin-username');
    const pass = page.locator('#admin-password');
    await expect(user).toBeVisible();
    await expect(pass).toHaveAttribute('type', 'password');
    await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true })).toBeVisible();

    await pass.fill('x-secret');
    await page.getByRole('button', { name: 'แสดงรหัสผ่าน' }).click();
    await expect(pass).toHaveAttribute('type', 'text');

    await user.fill(ADMIN_STUDENT_ID);
    await pass.fill('definitely-not-the-password');
    await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/admin\/login/);
    const cookies = await ctx.cookies();
    expect(cookies.find((c) => c.name === 'admin_token')).toBeUndefined();
    await ctx.close();
  });

  test('login with the committee password lands on the console and shows who is signed in', async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': nextXff() } });
    const page = await ctx.newPage();
    await page.goto(LOGIN);
    await page.locator('#admin-username').fill(ADMIN_STUDENT_ID);
    await page.locator('#admin-password').fill(E2E_ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
    await page.waitForURL(/\/admin(\?|$)/, { timeout: 20000 });

    const header = page.locator('header');
    await expect(header.getByText('ผู้ดูแลระบบ', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(header.getByText(ADMIN_STUDENT_ID)).toBeVisible();
    await ctx.close();
  });

  test('without a session /admin sends the visitor to the login page and shows no console', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(ADMIN);
    await page.waitForURL(/\/admin\/login/, { timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบจัดการ' })).toBeVisible();
    await expect(page.locator('aside[aria-label="เมนูหลัก"]')).toHaveCount(0);
    await ctx.close();
  });

  test('sidebar lists every menu item, marks the current one, and each tab shows its own content', async ({ browser }) => {
    const { ctx, page, pageErrors } = await adminPage(browser);
    await page.goto(ADMIN);

    const side = page.locator('aside[aria-label="เมนูหลัก"]');
    await expect(side).toBeVisible({ timeout: 20000 });
    for (const t of TABS) await expect(side.getByRole('button', { name: t.label, exact: true })).toBeVisible();
    await expect(side.getByRole('button', { name: 'ออกจากระบบ' })).toBeVisible();
    // the test tools stay out of the menu unless the server switches them on
    await expect(side.getByRole('button', { name: 'เครื่องมือทดสอบ' })).toHaveCount(0);

    for (const t of TABS) {
      await side.getByRole('button', { name: t.label, exact: true }).click();
      await expect(page.getByRole('heading', { name: t.heading, exact: true }).first()).toBeVisible({ timeout: 20000 });
      await expect(side.getByRole('button', { name: t.label, exact: true })).toHaveAttribute('aria-current', 'page');
      await expect(page.locator('main')).toBeVisible();
      await expect(page.getByText('Something went wrong')).toHaveCount(0);
    }
    expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);
    await ctx.close();
  });

  test('control center: the current mode matches the DB and only the current mode is locked', async ({ browser }) => {
    const { ctx, page } = await adminPage(browser);
    await openTab(page, 'overview', 'โหมดการทำงานของระบบ');

    const cfg = await prisma().systemConfig.findUnique({ where: { id: 1 }, select: { systemMode: true } });
    expect(cfg.systemMode).toBe('MANUAL_OPEN'); // the seed; OPEN on screen
    const group = page.getByRole('group', { name: 'เลือกโหมดระบบ' });
    const current = group.locator('button[aria-pressed="true"]');
    await expect(current).toHaveCount(1);
    await expect(current).toContainText('OPEN');
    await expect(current).toContainText('ใช้อยู่ตอนนี้');
    await expect(current).toBeDisabled();

    // the closing steps show, and the turnout card equals what the server counts
    // (specs that ran earlier in the same run already cast votes, so no fixed number)
    await expect(page.getByRole('heading', { name: 'ขั้นตอนปิดการเลือกตั้ง' })).toBeVisible();
    const api = await page.request.get(`${BASE_PATH}/api/admin/dashboard`);
    expect(api.status()).toBe(200);
    const { votedCount, totalVoters } = (await api.json()).stats;
    expect(totalVoters).toBeGreaterThan(0);
    await expect(page.getByText('ผู้ใช้สิทธิ์แล้ว')).toBeVisible();
    await expect(page.locator('p', { hasText: `${votedCount.toLocaleString()} / ${totalVoters.toLocaleString()} คน` }).first()).toBeVisible();
    await ctx.close();
  });

  test('parties tab: both seeded parties as cards, and a card opens the edit dialog with its name', async ({ browser }) => {
    const { ctx, page } = await adminPage(browser);
    await openTab(page, 'candidates', 'พรรคผู้สมัคร');

    const parties = await prisma().candidate.findMany({ where: { number: { gt: 0 } }, orderBy: { number: 'asc' }, select: { name: true } });
    expect(parties.length).toBe(2);
    await expect(page.getByText(`${parties.length} พรรค`, { exact: true })).toBeVisible();
    for (const p of parties) await expect(page.getByText(p.name, { exact: true }).first()).toBeVisible();
    // the two special options are made by the system and are not listed as parties
    await expect(page.getByText('งดออกเสียง', { exact: true })).toHaveCount(0);

    await page.getByText(parties[0].name, { exact: true }).first().click();
    const dialogName = page.locator('input[value="' + parties[0].name + '"]');
    await expect(dialogName.first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'ปิด', exact: true }).first().click();
    await expect(dialogName).toHaveCount(0);
    await ctx.close();
  });

  test('theme chooser: the live theme is marked, and cancelling the confirm dialog changes nothing', async ({ browser }) => {
    const { ctx, page } = await adminPage(browser);
    await openTab(page, 'pageDesign', 'เลือกธีมเว็บไซต์');

    const before = await prisma().systemConfig.findUnique({ where: { id: 1 }, select: { activeTemplateId: true } });
    await expect(page.getByText('กำลังใช้งานอยู่')).toBeVisible();

    // pick any other family from the list, then try to apply it
    const other = page.locator('[role="button"][aria-label^="เลือกธีม "]:visible').filter({ hasNotText: 'Receipt Paper' }).first();
    await expect(other).toBeVisible();
    const otherName = ((await other.getAttribute('aria-label')) || '').replace('เลือกธีม ', '');
    await other.click();
    await expect(page.getByRole('heading', { name: otherName, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'ใช้ธีมนี้', exact: true }).click();

    await expect(page.getByRole('heading', { name: /^ใช้ธีม “.+”\?$/ })).toBeVisible();
    // the box is open in this DB, so the dialog must warn about changing mid-vote
    await expect(page.getByText('หีบกำลังเปิดรับคะแนนอยู่')).toBeVisible();
    await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
    await expect(page.getByRole('heading', { name: /^ใช้ธีม “/ })).toHaveCount(0);

    const after = await prisma().systemConfig.findUnique({ where: { id: 1 }, select: { activeTemplateId: true } });
    expect(after.activeTemplateId).toBe(before.activeTemplateId);
    await ctx.close();
  });

  test('general settings: rows open to their fields, edits are counted, and cancel puts every value back', async ({ browser }) => {
    const { ctx, page } = await adminPage(browser);
    await openTab(page, 'globalConfig', 'ตั้งค่าทั่วไป');

    await expect(page.getByRole('heading', { name: /^เตรียมการเลือกตั้ง / })).toBeVisible();
    await expect(page.getByRole('progressbar')).toBeVisible();
    // no changes yet, so no save bar
    await expect(page.getByRole('button', { name: 'บันทึก', exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: /^ครั้งที่และปีการศึกษา/ }).click();
    const year = page.locator('#gc-academicYearTh');
    const prefix = page.locator('#gc-electionNamePrefix');
    await expect(year).toBeVisible();
    const yearBefore = await year.inputValue();
    const prefixBefore = await prefix.inputValue();

    await year.fill('2570');
    await expect(year).toHaveValue('2570');
    await expect(page.getByText(/แก้ไข 1 ช่อง ยังไม่ได้บันทึก/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'บันทึก', exact: true })).toBeEnabled();

    await prefix.fill('SAMO TEST');
    await expect(page.getByText(/แก้ไข 2 ช่อง ยังไม่ได้บันทึก/)).toBeVisible();

    await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
    await expect(year).toHaveValue(yearBefore);
    await expect(prefix).toHaveValue(prefixBefore);
    await expect(page.getByText(/ยังไม่ได้บันทึก/)).toHaveCount(0);
    await ctx.close();
  });

  test('general settings: organization names take emoji and angle brackets, and a 200 character name does not break the layout', async ({ browser }) => {
    const { ctx, page, pageErrors } = await adminPage(browser);
    await openTab(page, 'globalConfig', 'ตั้งค่าทั่วไป');

    await page.getByRole('button', { name: /^ข้อมูลองค์กร/ }).click();
    const committee = page.locator('#gc-committeeName');
    await expect(committee).toBeVisible();

    const odd = 'สโมสรนักศึกษา 🚀 <test>';
    await committee.fill(odd);
    await expect(committee).toHaveValue(odd);
    // the typed field is counted, along with the full name built from it
    await expect(page.getByText(/แก้ไข \d+ ช่อง ยังไม่ได้บันทึก/)).toBeVisible();

    const long = 'A'.repeat(200);
    await committee.fill(long);
    await expect(committee).toHaveValue(long);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'page grew a horizontal scrollbar').toBeLessThanOrEqual(0);
    await expect(page.locator('main')).toBeVisible();

    await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
    await expect(committee).not.toHaveValue(long);
    expect(pageErrors).toEqual([]);
    await ctx.close();
  });

  test('leaving general settings with unsaved edits asks first, staying keeps the edit, leaving writes nothing', async ({ browser }) => {
    const { ctx, page } = await adminPage(browser);
    await openTab(page, 'globalConfig', 'ตั้งค่าทั่วไป');
    await page.getByRole('button', { name: /^ครั้งที่และปีการศึกษา/ }).click();
    await page.locator('#gc-academicYearTh').fill('2571');

    await page.locator('aside[aria-label="เมนูหลัก"]').getByRole('button', { name: 'ศูนย์ควบคุม', exact: true }).click();
    // a dialog stands in the way and the control center has not opened
    const ask = page.getByRole('alertdialog');
    await expect(ask).toBeVisible();
    await expect(ask).toContainText('ยังไม่ได้บันทึกการแก้ไขในตั้งค่าทั่วไป');
    await expect(page.getByRole('heading', { name: 'โหมดการทำงานของระบบ' })).toHaveCount(0);

    // staying keeps the typed value on the same screen
    await ask.getByRole('button', { name: 'กลับไปบันทึก' }).click();
    await expect(ask).toHaveCount(0);
    await expect(page.locator('#gc-academicYearTh')).toHaveValue('2571');

    // leaving without saving goes on to the control center, and nothing was written
    await page.locator('aside[aria-label="เมนูหลัก"]').getByRole('button', { name: 'ศูนย์ควบคุม', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'ออกโดยไม่บันทึก' }).click();
    await expect(page.getByRole('heading', { name: 'โหมดการทำงานของระบบ' })).toBeVisible({ timeout: 15000 });
    const saved = await prisma().systemConfig.findUnique({ where: { id: 1 }, select: { globalConfig: true } });
    expect(JSON.stringify(saved.globalConfig || {})).not.toContain('2571');
    await ctx.close();
  });

  test('readiness tab: the check ran, counts add up to the rows shown, and the re-check button works', async ({ browser }) => {
    const { ctx, page } = await adminPage(browser);
    await openTab(page, 'settings', 'ตรวจความพร้อมระบบ');

    await expect(page.getByText(/ตรวจล่าสุด \d{1,2}:\d{2}/)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('กำหนดการปัจจุบัน')).toBeVisible();

    // the same numbers the API reports for this DB
    const res = await page.request.get(`${BASE_PATH}/api/admin/readiness`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.checks.length).toBeGreaterThan(0);
    const { pass, warn, fail } = body.summary;
    expect(pass + warn + fail).toBe(body.checks.length);
    await expect(page.getByText(`ผ่าน ${pass}`, { exact: true })).toBeVisible();
    await expect(page.getByText(`เตือน ${warn}`, { exact: true })).toBeVisible();
    await expect(page.getByText(`ไม่ผ่าน ${fail}`, { exact: true })).toBeVisible();
    expect(body.testToolsEnabled).toBe(false);

    // the seed has two parties with no logo: the readiness list must say so
    await expect(page.getByText('ความครบถ้วนของข้อมูลพรรค', { exact: true })).toBeVisible();
    await expect(page.getByText(/มีพรรคผู้สมัคร 2 พรรค/).first()).toBeVisible();

    const recheck = page.getByRole('button', { name: 'ตรวจซ้ำ', exact: true });
    await expect(recheck).toBeEnabled();
    await recheck.click();
    await expect(recheck).toBeEnabled({ timeout: 20000 });
    await expect(page.getByText(/ตรวจล่าสุด \d{1,2}:\d{2}/)).toBeVisible();
    await ctx.close();
  });

  test('manual tab: chips jump to the tab they name', async ({ browser }) => {
    const { ctx, page } = await adminPage(browser);
    await openTab(page, 'manual', 'คู่มือใช้งาน ทำอะไรก่อนหลัง');
    await expect(page.getByText('เข้าสู่ระบบ', { exact: false }).first()).toBeVisible();

    await page.locator('main').getByRole('button', { name: 'ตั้งค่าทั่วไป', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'ตั้งค่าทั่วไป', exact: true }).first()).toBeVisible({ timeout: 15000 });
    await ctx.close();
  });

  test('phone width: the menu hides behind a button and opens as a drawer', async ({ browser }) => {
    const { ctx, page } = await adminPage(browser, { width: 390, height: 844 });
    await page.goto(ADMIN);
    const open = page.getByRole('button', { name: 'เปิดเมนู' });
    await expect(open).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'โหมดการทำงานของระบบ' })).toBeVisible();

    await open.click();
    const side = page.locator('aside[aria-label="เมนูหลัก"]');
    await side.getByRole('button', { name: 'ตั้งค่าทั่วไป', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'ตั้งค่าทั่วไป', exact: true }).first()).toBeVisible({ timeout: 15000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await ctx.close();
  });

  test('logout ends the session: the console is gone and /admin asks for a login again', async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-For': nextXff() } });
    const page = await ctx.newPage();
    await page.goto(LOGIN);
    await page.locator('#admin-username').fill(ADMIN_STUDENT_ID);
    await page.locator('#admin-password').fill(E2E_ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
    await page.waitForURL(/\/admin(\?|$)/, { timeout: 20000 });
    await expect(page.locator('aside[aria-label="เมนูหลัก"]')).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
    await page.waitForURL(/\/admin\/login/, { timeout: 20000 });
    await page.goto(ADMIN);
    await page.waitForURL(/\/admin\/login/, { timeout: 20000 });
    await expect(page.locator('aside[aria-label="เมนูหลัก"]')).toHaveCount(0);
    await ctx.close();
  });
});
