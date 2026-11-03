// @ts-check
// The privacy notice and the links to it, in all 8 template families.
//
// For each family, at 1440x860 and 412x880, on the isolated *_e2e database:
//   - the family's own login renders (proved by a DOM marker, not by trusting that
//     the active template switched), carries the privacy link and the sentence
//     about PSU Passport, and the link lands on /privacy
//   - the ballot (multi-party, then single-party) renders, carries the link, does
//     not overflow sideways, and the confirm control is still on screen and is
//     what a click at its centre would hit
//   - /success: the call to action for the evaluation form stays inside the first
//     screen on the phone viewport, and the link is there too
//   - /privacy reads the same under every family and shows the e-mail the faculty
//     set on ตั้งค่าทั่วไป (and none when it is blank)
//
// The template is switched by writing SystemConfig.activeTemplateId directly (the
// site config cache lives 3 s), exactly like security-h1-h2.spec.js does.
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers/auth');
const { prisma, mintSession, castWith, getBallot, uniqueStudentId, adminLogin, API, BASE_PATH, disconnect } = require('./helpers/fixtures');

const FAMILIES = [
  { slug: 'original',        login: 'h1:has-text("PSU PASSPORT")',        ballot: 'main.max-w-4xl' },
  { slug: 'gumroad',         login: '.grl-root',                           ballot: '.gv-root' },
  { slug: 'studio-dark',     login: '.sdl-root',                           ballot: '.sdv-ballot' },
  { slug: 'verdure',         login: '.vdl-root',                           ballot: '.vd-root' },
  { slug: 'blossom',         login: '.bll-root',                           ballot: '.bl-vote-root' },
  { slug: 'receipt',         login: '.rcl-root',                           ballot: '.rc-vote-root' },
  { slug: 'fms-official',    login: '.fo-login',                           ballot: '.fo-root' },
  { slug: 'ballot-official', login: '.bo-root .bl',                        ballot: '.bo-root' },
];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 860 },
  { name: 'phone',   width: 412,  height: 880 },
];
const CTA_RX = /เปิดแบบประเมิน|ทำแบบประเมิน|ดูผลคะแนน|ไปหน้าผลคะแนน|แบบประเมิน/;
const SITE_CACHE_MS = 3600;
const SERVER = process.env.PW_BASE_URL || 'http://localhost:3100';

async function switchTemplate(slug) {
  await prisma().systemConfig.update({ where: { id: 1 }, data: { activeTemplateId: slug } });
  await new Promise((r) => setTimeout(r, SITE_CACHE_MS));
}

async function overflow(page) {
  return page.evaluate(() => ({
    sw: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    iw: window.innerWidth,
  }));
}

// Some families open a single-party ballot behind a "tap to enter" curtain; clear it
// the way a voter would (the classic one has a "skip intro" button).
async function dismissIntro(page) {
  for (let i = 0; i < 2; i++) {
    const skip = page.getByText(/skip intro/i).first();
    if (await skip.isVisible().catch(() => false)) await skip.click().catch(() => {});
    else if (await page.getByText(/TAP TO ENTER|แตะเพื่อเข้า/i).first().isVisible().catch(() => false)) {
      await page.mouse.click(Math.round(page.viewportSize().width / 2), Math.round(page.viewportSize().height / 2));
    }
    await page.waitForTimeout(2200);
  }
}

// What a click at the centre of `el` would actually hit, as a short description.
function coverage(el) {
  const r = el.getBoundingClientRect();
  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  const ok = !!top && (top === el || el.contains(top) || top.contains(el));
  return { ok, by: top ? `${top.tagName.toLowerCase()}.${String(top.className).slice(0, 60)}` : 'nothing', rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] };
}

async function signedInContext(browser, viewport) {
  const studentId = uniqueStudentId();
  const cookie = await mintSession(studentId);
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const [name, ...rest] = cookie.split('=');
  await context.addCookies([{ name, value: rest.join('='), url: SERVER }]);
  return { context, cookie, studentId };
}

test.setTimeout(240000);

test.afterAll(async () => {
  await prisma().systemConfig.update({ where: { id: 1 }, data: { activeTemplateId: 'receipt' } }).catch(() => {});
  await disconnect();
});

for (const fam of FAMILIES) {
  test.describe(`family ${fam.slug}`, () => {
    test.beforeAll(async () => { await switchTemplate(fam.slug); });

    for (const vp of VIEWPORTS) {
      test(`login carries the notice and the link works (${vp.name})`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const page = await context.newPage();
        await page.goto(`${BASE_PATH}/login`, { waitUntil: 'networkidle' });

        await expect(page.locator(fam.login).first(), `DOM marker proves ${fam.slug} login is the one rendered`).toBeVisible();
        const note = page.locator('[data-privacy-note="privacy-note"]').first();
        await note.scrollIntoViewIfNeeded();
        await expect(note).toContainText('PSU Passport');
        const link = page.locator('[data-privacy-link]').first();
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', `${BASE_PATH}/privacy`);
        const o = await overflow(page);
        expect(o.sw, `no sideways scroll on login (${o.sw} > ${o.iw})`).toBeLessThanOrEqual(o.iw + 1);

        await link.click();
        await page.waitForURL('**/privacy', { timeout: 15000 });
        await expect(page.getByRole('heading', { level: 1, name: 'นโยบายความเป็นส่วนตัว' })).toBeVisible();
        await context.close();
      });

      for (const mode of ['multi', 'single']) {
        test(`ballot ${mode}: link, no overflow, confirm still reachable (${vp.name})`, async ({ browser }) => {
          const db = prisma();
          const second = await db.candidate.findFirst({ where: { number: 2 } });
          if (mode === 'single' && second) await db.candidate.delete({ where: { id: second.id } });
          if (mode === 'single') await new Promise((r) => setTimeout(r, SITE_CACHE_MS));
          const { context } = await signedInContext(browser, vp);
          try {
            const page = await context.newPage();
            const hosts = new Set();
            const cspHits = [];
            page.on('request', (r) => { try { hosts.add(new URL(r.url()).host); } catch { /* data: has no host */ } });
            page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) cspHits.push(m.text().slice(0, 140)); });
            await page.goto(`${BASE_PATH}/vote`, { waitUntil: 'networkidle' });
            if (mode === 'multi') await expect(page.locator(fam.ballot).first(), 'ballot marker').toBeVisible({ timeout: 20000 });
            await page.waitForTimeout(2500); // entrance animations
            if (mode === 'single') await dismissIntro(page);

            const link = page.locator('[data-privacy-link]').first();
            await expect(link).toHaveCount(1);
            // reach the end of the page the way a voter does: scroll all the way down
            await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
            await link.scrollIntoViewIfNeeded();
            await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
            await page.waitForTimeout(400);
            await expect(link).toBeVisible();
            const cov = await link.evaluate(coverage);
            console.log(`[link] ${fam.slug} ${mode} ${vp.name} ${JSON.stringify(cov)}`);
            expect(cov.ok, `nothing covers the link at the end of the page, but ${cov.by} does`).toBe(true);
            const vis = await link.evaluate((el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; });
            expect(vis, 'the whole link is inside the viewport').toBe(true);
            const o = await overflow(page);
            expect(o.sw, `no sideways scroll on ballot (${o.sw} > ${o.iw})`).toBeLessThanOrEqual(o.iw + 1);

            const [popup] = await Promise.all([context.waitForEvent('page'), link.click()]);
            await popup.waitForLoadState('domcontentloaded');
            expect(new URL(popup.url()).pathname).toBe(`${BASE_PATH}/privacy`);
            await popup.close();
            await expect(page).toHaveURL(/\/vote/); // the ballot tab is untouched

            // The submit control must be exactly where it was before this change: measure
            // it with the notes on the page and again with them taken out of the layout.
            if (mode === 'multi') {
              await page.evaluate(() => window.scrollTo(0, 0));
              await page.getByText('E2E พรรคเอกภาพ').first().click();
              await page.waitForTimeout(900);
            }
            await page.evaluate(() => window.scrollTo(0, 0));
            const measure = () => page.evaluate((src) => {
              const rx = new RegExp(src);
              const els = [...document.querySelectorAll('button, [role="button"], a')].filter((n) => rx.test((n.textContent || '').trim()) && n.offsetParent !== null);
              return els.map((n) => { const r = n.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; });
            }, /ยืนยันการลงคะแนน|หย่อนบัตร|ส่งบัตร|CONFIRM VOTE|ยืนยัน|เลือกตัวเลือกก่อน/.source);
            const withNote = await measure();
            await page.addStyleTag({ content: '[data-privacy-note]{display:none !important}' });
            await page.waitForTimeout(300);
            const withoutNote = await measure();
            console.log(`[confirm] ${fam.slug} ${mode} ${vp.name} with=${JSON.stringify(withNote)} without=${JSON.stringify(withoutNote)}`);
            expect(withNote.length, 'the submit control is on the page').toBeGreaterThan(0);
            expect(withNote, 'the submit control did not move').toEqual(withoutNote);
            if (mode === 'multi') {
              const c = page.getByRole('button', { name: /ยืนยันการลงคะแนน|หย่อนบัตร|ส่งบัตร/ }).filter({ visible: true }).first();
              await c.scrollIntoViewIfNeeded();
              const cc = await c.evaluate(coverage);
              expect(cc.ok, `a click at the centre of the submit control hits it, but ${cc.by} is on top`).toBe(true);
            }
            // the party's own page too: nothing is asked of any other host, and CSP stays quiet
            const partyId = (await prisma().candidate.findFirst({ where: { number: 1 } })).id;
            await page.goto(`${BASE_PATH}/party?id=${partyId}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1500);
            await page.goto(`${BASE_PATH}/vote`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1500);
            expect([...hosts].filter((h) => !h.startsWith('localhost')), 'no request to any other host').toEqual([]);
            expect(cspHits, 'no CSP violation').toEqual([]);
          } finally {
            await context.close();
            if (mode === 'single' && second) {
              await db.candidate.create({ data: { name: second.name, number: second.number, score: 0, slogan: second.slogan, color: second.color } });
              await new Promise((r) => setTimeout(r, SITE_CACHE_MS));
            }
          }
        });
      }

      test(`success: evaluation CTA inside the first screen, link present (${vp.name})`, async ({ browser }) => {
        const { realParty } = await getBallot();
        const { context, cookie } = await signedInContext(browser, vp);
        try {
          const cast = await castWith(cookie, realParty.id);
          expect(cast.status, cast.text).toBe(200);
          const page = await context.newPage();
          await page.goto(`${BASE_PATH}/success`, { waitUntil: 'networkidle' });
          await page.waitForTimeout(3500); // cast scene / receipt print
          await expect(page.locator('body')).not.toContainText('Access Denied');

          const info = await page.evaluate((src) => {
            const rx = new RegExp(src);
            const nodes = [...document.querySelectorAll('button, a')].filter((n) => rx.test((n.textContent || '').trim()) && n.offsetParent !== null);
            const primary = nodes.find((n) => !/ก่อนดูผลคะแนน/.test(n.textContent) && !n.disabled) || nodes[0];
            const r = primary ? primary.getBoundingClientRect() : null;
            return { vh: window.innerHeight, top: r && Math.round(r.top), bottom: r && Math.round(r.bottom), label: primary && primary.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) };
          }, CTA_RX.source);
          console.log(`[fold] ${fam.slug} ${vp.name} ${JSON.stringify(info)}`);
          expect(info.label, 'a call to action exists').not.toBeNull();
          if (vp.name === 'phone') {
            expect(info.bottom, `CTA "${info.label}" bottom ${info.bottom} inside ${info.vh}`).toBeLessThanOrEqual(info.vh);
          }
          const o = await overflow(page);
          expect(o.sw, 'no sideways scroll on success').toBeLessThanOrEqual(o.iw + 1);
        } finally {
          await context.close();
        }
      });
    }
  });
}

test.describe('the notice itself', () => {
  test.beforeAll(async () => {
    await prisma().systemConfig.update({ where: { id: 1 }, data: { globalConfig: {} } });
    await new Promise((r) => setTimeout(r, SITE_CACHE_MS));
  });

  test('the same page under every family, and no empty contact slot', async ({ browser }) => {
    const seen = new Set();
    for (const fam of FAMILIES) {
      await switchTemplate(fam.slug);
      for (const vp of VIEWPORTS) {
        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const page = await context.newPage();
        const hosts = new Set();
        page.on('request', (r) => { try { hosts.add(new URL(r.url()).host); } catch { /* data: */ } });
        await page.goto(`${BASE_PATH}/privacy`, { waitUntil: 'networkidle' });
        const style = await page.evaluate(() => {
          const el = document.querySelector('[data-privacy-page]');
          return { bg: getComputedStyle(el).backgroundColor, h1: getComputedStyle(document.querySelector('h1')).color };
        });
        seen.add(`${style.bg}|${style.h1}`);
        const o = await overflow(page);
        expect(o.sw, `${fam.slug} ${vp.name}: no sideways scroll on /privacy`).toBeLessThanOrEqual(o.iw + 1);
        await expect(page.locator('[data-privacy-email]')).toHaveCount(0);
        await expect(page.locator('[data-privacy-contact]')).toContainText('ติดต่อคณะวิทยาการจัดการ');
        expect([...hosts].filter((h) => !h.startsWith('localhost')), 'the notice calls nobody else').toEqual([]);
        await context.close();
      }
    }
    expect([...seen].length, 'one look for every family').toBe(1);
  });

  test('the e-mail set in the admin console shows on /privacy, and the readiness check follows', async ({ browser, request }) => {
    const cookie = await adminLogin();
    const headers = { cookie, 'content-type': 'application/json', origin: SERVER };
    const ready = async () => {
      const r = await request.get(API('/api/admin/readiness'), { headers: { cookie } });
      const j = await r.json();
      return (j.checks || []).find((c) => c.id === 'config.privacyContact');
    };
    expect((await ready())?.level, 'blank: a warning').toBe('warn');

    const bad = await request.put(API('/api/admin/global-config'), { headers, data: { globalConfig: { privacyContactEmail: 'a@psu.ac.th,b@psu.ac.th' } } });
    expect(bad.status()).toBe(400);
    const okRes = await request.put(API('/api/admin/global-config'), { headers, data: { globalConfig: { privacyContactEmail: 'dpo-test@psu.ac.th' } } });
    expect(okRes.status(), await okRes.text()).toBe(200);
    expect((await ready())?.level, 'set: pass').toBe('pass');

    await new Promise((r) => setTimeout(r, SITE_CACHE_MS));
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_PATH}/privacy`, { waitUntil: 'networkidle' });
    const mail = page.locator('[data-privacy-email]');
    await expect(mail).toHaveText('dpo-test@psu.ac.th');
    await expect(mail).toHaveAttribute('href', 'mailto:dpo-test@psu.ac.th');
    await context.close();

    const clear = await request.put(API('/api/admin/global-config'), { headers, data: { globalConfig: { privacyContactEmail: '' } } });
    expect(clear.status()).toBe(200);
    expect((await ready())?.level, 'cleared: a warning again').toBe('warn');
  });

  test('cookies as the page documents them', async ({ browser }) => {
    await switchTemplate('receipt');
    const context = await browser.newContext();
    const page = await context.newPage();
    await mockLogin(page, uniqueStudentId());
    await page.waitForLoadState('networkidle');
    const cookies = await context.cookies();
    console.log('[cookies]', JSON.stringify(cookies.map((c) => ({ name: c.name, httpOnly: c.httpOnly, sameSite: c.sameSite, expiresIn: c.expires > 0 ? Math.round(c.expires - Date.now() / 1000) : 'session' }))));
    const names = cookies.map((c) => c.name.replace(/^__(Secure|Host)-/, ''));
    expect(names).toContain('next-auth.session-token');
    const session = cookies.find((c) => c.name.endsWith('next-auth.session-token'));
    expect(session.expires - Date.now() / 1000, 'session cookie lives about an hour').toBeLessThanOrEqual(3600 + 5);
    expect(session.expires - Date.now() / 1000).toBeGreaterThan(3000);
    for (const n of names) expect(['next-auth.session-token', 'next-auth.csrf-token', 'next-auth.callback-url'], `undocumented cookie ${n}`).toContain(n);
    await context.close();
  });
});
