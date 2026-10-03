// @ts-check
// H1 + H2 regression (2026-09-25) on the ISOLATED test DB + prod build (:3100).
//
// H1 — an admin must not be able to run JavaScript on a public page through
//      theme/template configuration. Proven three ways:
//        a) every admin write path (page-layout PUT, template POST/PUT) answers
//           400 to breakout payloads, and still accepts legitimate values
//        b) BYPASS: the payloads are written straight into the DB (as if a route
//           forgot to validate, or an old row predates the gate) and the real
//           pages are loaded in a real browser — the payload must not execute,
//           must not appear as markup, and a logged-in voter must NOT get a vote
//           cast for them
//        c) the CSP header is nonce-based, the app still hydrates under it, and a
//           script injected without the nonce is blocked by the browser
// H2 — the admin dashboard must not carry live per-party scores until results
//      are revealed; after reveal, the existing behaviour (scores visible) holds.
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers/auth');
const {
  API,
  prisma,
  uniqueStudentId,
  getBallot,
  candidateScore,
  setShowResult,
  adminLogin,
  assertLiveTestDb,
  disconnect,
} = require('./helpers/fixtures');

// Every payload tries to flip window.__h1pwned (or cast a vote). None may succeed.
const BREAKOUT = 'red}</style><script>window.__h1pwned=1;fetch("/api/vote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({candidateId:CANDIDATE})})</script><style>';
const IMG_BREAKOUT = '#fff</style><img src=x onerror="window.__h1pwned=2"><style>';
const EVIL_ID = 'x"] {} </style><script>window.__h1pwned=3</script><style>[x="';

let adminCookie = '';

test.describe('H1 — theme/template values cannot execute script', () => {
  test.beforeAll(async () => {
    adminCookie = await adminLogin();
  });
  test.afterAll(async () => {
    await disconnect();
  });

  const put = (path, body) =>
    fetch(API(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify(body),
    });
  const post = (path, body) =>
    fetch(API(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify(body),
    });

  test('a) admin APIs reject breakout payloads (400) and accept legit themes (200)', async () => {
    const db = prisma();
    const before = await db.systemConfig.findUnique({ where: { id: 1 }, select: { pageLayout: true } });
    try {
      const bad = [
        { themeTokens: { '--color-primary': BREAKOUT } },
        { themeTokens: { '--shadow-card': IMG_BREAKOUT } },
        { themeTokens: { '--color-primary': 'red; background: url(https://evil.example/x)' } },
        { elementVars: { home: { 'hero-title': { '--x': BREAKOUT } } } },
        { elementVars: { home: { [EVIL_ID]: { '--x': 'red' } } } },
        { elementVars: { home: { 'hero-title': { '--x: red} </style><script>1</script>': 'red' } } } },
        { elementCss: { home: { 'hero-title': 'color: red;</style><script>1</script>' } } },
        { elementCss: { home: { [EVIL_ID]: 'color: red;' } } },
        { elementCss: { home: { 'hero-title': 'color: red} body{display:none' } } },
      ];
      for (const body of bad) {
        const r = await put('/api/admin/page-layout', body);
        expect(r.status, `page-layout must reject ${JSON.stringify(body).slice(0, 80)}`).toBe(400);
      }

      // legitimate values keep working — the theme system is not broken
      const ok = await put('/api/admin/page-layout', {
        ...(before?.pageLayout || {}),
        themeTokens: { '--color-primary': '#8A2680', '--radius-card': '20px', '--font-body': "var(--font-kanit), 'Kanit', system-ui, sans-serif" },
        elementVars: { home: { 'voteCTA-button': { '--btn-bg-gradient': 'linear-gradient(135deg, #8A2680 0%, #601A59 100%)' } } },
        elementCss: { home: { 'hero-title': 'letter-spacing: 0.01em;' } },
      });
      expect(ok.status, 'legit page-layout PUT').toBe(200);

      // templates: create rejects, update rejects, legit create works
      const slug = `e2e-h1-${Date.now()}`;
      const r1 = await post('/api/admin/templates', {
        slug: `${slug}-bad`, name: 'bad', pages: {}, elements: {}, theme: { tokens: { '--color-primary': BREAKOUT } },
      });
      expect(r1.status, 'template POST with breakout token').toBe(400);
      const r2 = await post('/api/admin/templates', {
        slug: `${slug}-bad2`, name: 'bad2', pages: {}, theme: { tokens: {} }, elements: { [EVIL_ID]: { vars: { '--x': 'red' } } },
      });
      expect(r2.status, 'template POST with malicious element id').toBe(400);

      const created = await post('/api/admin/templates', {
        slug, name: 'legit', pages: {}, elements: { 'voteCTA-button': { vars: { '--btn-bg': '#8A2680' } } }, theme: { tokens: { '--color-primary': '#8A2680' } },
      });
      expect(created.status, 'legit template POST').toBe(201);
      const r3 = await put(`/api/admin/templates/${slug}`, { theme: { tokens: { '--color-primary': IMG_BREAKOUT } } });
      expect(r3.status, 'template PUT with breakout token').toBe(400);
      const r4 = await put(`/api/admin/templates/${slug}`, { elements: { 'hero-title': { vars: { '--x': BREAKOUT } } } });
      expect(r4.status, 'template PUT with breakout var').toBe(400);
      const r5 = await put(`/api/admin/templates/${slug}`, { theme: { tokens: { '--color-primary': '#601A59' } } });
      expect(r5.status, 'legit template PUT').toBe(200);
      await db.template.delete({ where: { slug } });
    } finally {
      await db.systemConfig.update({ where: { id: 1 }, data: { pageLayout: before?.pageLayout ?? undefined } });
    }
  });

  test('b) payloads written straight into the DB still cannot run on public pages', async ({ page }) => {
    await assertLiveTestDb();
    const db = prisma();
    const { realParty } = await getBallot();
    const breakout = BREAKOUT.replace('CANDIDATE', String(realParty.id));
    const before = await db.systemConfig.findUnique({ where: { id: 1 }, select: { pageLayout: true, activeTemplateId: true } });
    const evilSlug = `e2e-h1-evil-${Date.now()}`;
    const scoreBefore = await candidateScore(realParty.id);

    // A DB template carrying the payloads, made the ACTIVE template — this is the
    // getTemplate → layout.js → buildTemplateStyles path, no API involved.
    await db.template.create({
      data: {
        slug: evilSlug, name: 'evil', isBuiltIn: false, isLocked: false, visibility: 'private', schemaVersion: 'v1', pages: {},
        theme: { tokens: { '--color-primary': breakout, '--color-bg': '#F8F9FD', '--shadow-card': IMG_BREAKOUT } },
        elements: { [EVIL_ID]: { vars: { '--x': 'red' } }, 'hero-title': { vars: { '--y': breakout } } },
      },
    });
    const evilLayout = {
      ...(before?.pageLayout || {}),
      themeTokens: { '--color-accent': breakout, '--color-text': '#0F172A' },
      elementVars: { home: { [EVIL_ID]: { '--x': 'red' } }, vote: { 'hero-title': { '--z': breakout } } },
      elementCss: { home: { [EVIL_ID]: 'color: red;', 'hero-title': 'color: red;</style><script>window.__h1pwned=4</script>' }, vote: { 'meet-title': 'color:red} body{display:none' } },
    };
    await db.systemConfig.update({ where: { id: 1 }, data: { pageLayout: evilLayout, activeTemplateId: evilSlug } });

    const dialogs = [];
    page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });

    try {
      // a real voter, logged in, visiting the pages the payload targets
      const studentId = uniqueStudentId();
      await mockLogin(page, studentId);

      for (const path of ['/', '/vote', '/results', '/candidates']) {
        const resp = await page.goto(path, { waitUntil: 'networkidle' });
        expect(resp?.status(), `${path} renders`).toBeLessThan(500);
        const html = await resp.text();
        // The payload strings DO appear in the RSC flight data (the page receives
        // pageLayout/template as props), but there React has escaped every `<` to
        // < inside a JSON string — inert data. What must never appear is the
        // payload as live markup, or any <script> the server did not nonce.
        expect(html, `${path}: payload never appears as live markup`).not.toMatch(/<script>window\.__h1pwned|<img src=x onerror|<\/style><script/i);
        const scriptTags = html.match(/<script\b[^>]*>/gi) || [];
        const nonced = scriptTags.filter((t) => /\bnonce="[^"]+"/.test(t));
        expect(nonced.length, `${path}: every <script> in the SSR HTML carries the server nonce`).toBe(scriptTags.length);
        const pwned = await page.evaluate(() => /** @type {any} */ (window).__h1pwned);
        expect(pwned, `${path}: payload must not execute`).toBeUndefined();
        const styleText = await page.evaluate(() => [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n'));
        expect(styleText, `${path}: no breakout survives in any <style>`).not.toMatch(/<\/style|<script|onerror/i);
      }

      // the legit tokens in the same maps still render (theme not collateral damage)
      const layoutCss = await page.evaluate(() => [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n'));
      expect(layoutCss).toContain('--color-text: #0F172A;');
      expect(layoutCss).toContain('--color-bg: #F8F9FD;');

      // the decisive check: no ballot was cast on this voter's behalf
      await page.waitForTimeout(1000);
      const voter = await db.user.findUnique({ where: { studentId }, select: { isVoted: true } });
      expect(voter?.isVoted, 'no vote was cast by an injected script').toBe(false);
      expect(await candidateScore(realParty.id)).toBe(scoreBefore);
      expect(dialogs).toEqual([]);
    } finally {
      await db.systemConfig.update({
        where: { id: 1 },
        data: { pageLayout: before?.pageLayout ?? undefined, activeTemplateId: before?.activeTemplateId ?? 'receipt' },
      });
      await db.template.delete({ where: { slug: evilSlug } });
    }
  });

  test('c) nonce-based CSP: app hydrates under it, a nonce-less script is blocked', async ({ page }) => {
    const violations = [];
    page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) violations.push(m.text()); });

    const resp = await page.goto('/', { waitUntil: 'networkidle' });
    const csp = resp?.headers()['content-security-policy'] || '';
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("'unsafe-eval'");
    const h = resp?.headers() || {};
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-frame-options']).toBe('SAMEORIGIN');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');

    // every script Next rendered carries the per-request nonce
    const nonce = csp.match(/'nonce-([^']+)'/)[1];
    const scripts = await page.evaluate(() => [...document.querySelectorAll('script')].map((s) => ({ nonce: s.nonce, src: s.src })));
    expect(scripts.length).toBeGreaterThan(0);
    for (const s of scripts) expect(s.nonce, `script ${s.src || '(inline)'} has the nonce`).toBe(nonce);

    // the app actually hydrated (client JS ran): React attached its root
    const hydrated = await page.evaluate(() => Object.keys(document.body).some((k) => k.startsWith('__react')) || !!document.querySelector('[data-reactroot]') || document.querySelectorAll('script[src*="_next/static"]').length > 0);
    expect(hydrated).toBe(true);

    // no CSP violation from the app's own code
    expect(violations, 'the app itself triggers no CSP violation').toEqual([]);

    // What a successful H1 injection looks like to the browser: nonce-less script
    // markup INSIDE the server's HTML (parser-inserted), under the server's real
    // CSP header. Splice exactly that into the real / response — the browser must
    // refuse it even though the render-layer sanitiser is out of the picture.
    const probe = await page.context().newPage();
    const probeViolations = [];
    probe.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) probeViolations.push(m.text()); });
    await probe.route('**/', async (route) => {
      if (route.request().resourceType() !== 'document') return route.continue();
      const real = await route.fetch();
      const body = (await real.text()).replace(
        '<style>',
        '<script>window.__cspProbe=1</script><img src=x onerror="window.__cspProbe=2"><style>'
      );
      await route.fulfill({ response: real, body });
    });
    await probe.goto('/', { waitUntil: 'networkidle' });
    expect(await probe.evaluate(() => /** @type {any} */ (window).__cspProbe), 'injected nonce-less script/handler did not run').toBeUndefined();
    expect(probeViolations.length, 'browser reported the blocked injection').toBeGreaterThan(0);
    await probe.close();
  });
});

test.describe('H2 — dashboard carries no live score until results are revealed', () => {
  test.beforeAll(async () => {
    if (!adminCookie) adminCookie = await adminLogin();
  });
  test.afterAll(async () => {
    await disconnect();
  });

  const dashboard = () => fetch(API('/api/admin/dashboard'), { headers: { cookie: adminCookie } });

  test('showResult=false → no score key on any candidate, not even in the raw JSON', async ({ page }) => {
    // make sure a real, non-zero tally exists so "absent" is not "zero by accident"
    const { realParty } = await getBallot();
    await mockLogin(page, uniqueStudentId());
    const v = await page.request.post(API('/api/vote'), { data: { candidateId: realParty.id } });
    expect(v.status()).toBe(200);
    expect(await candidateScore(realParty.id)).toBeGreaterThan(0);

    const restore = await setShowResult(false);
    try {
      const r = await dashboard();
      expect(r.status).toBe(200);
      const raw = await r.text();
      const j = JSON.parse(raw);

      // Test 1 — every candidate object lacks score entirely
      expect(j.candidates.length).toBeGreaterThan(0);
      for (const c of j.candidates) expect(Object.prototype.hasOwnProperty.call(c, 'score'), `candidate ${c.number} has no score`).toBe(false);
      // only the intended fields are present
      for (const c of j.candidates) expect(Object.keys(c).sort()).toEqual(['color', 'id', 'logoUrl', 'name', 'number', 'slogan']);

      // Test 2 — the serialized body has no score anywhere
      expect(raw).not.toMatch(/"score"/);

      // same class of leak: saving a party's content must not echo the tally back
      const form = new FormData();
      form.set('slogan', realParty.slogan || 'ทดสอบระบบเลือกตั้ง');
      const put = await fetch(API(`/api/admin/candidates?id=${realParty.id}`), { method: 'PUT', headers: { cookie: adminCookie }, body: form });
      expect(put.status).toBe(200);
      expect(await put.text()).not.toMatch(/"score"/);

      // the rest of the dashboard still works
      expect(j.stats.showResult).toBe(false);
      expect(typeof j.stats.votedCount).toBe('number');
    } finally {
      await restore();
    }
  });

  test('showResult=true → existing behaviour: scores visible and equal to the tally', async () => {
    const restore = await setShowResult(true);
    try {
      const j = await (await dashboard()).json();
      for (const c of j.candidates) {
        expect(typeof c.score, `candidate ${c.number} has a score after reveal`).toBe('number');
        expect(c.score).toBe(await candidateScore(c.id));
      }
      // and the public results API reveals the same numbers.
      // Public /api/results serves a shared in-process snapshot (TTL
      // RESULTS_SNAP_TTL_MS in src/lib/election/resultsCache.mjs). A reveal made
      // through /api/admin/dashboard busts it at once, but setShowResult() writes
      // the DB directly, so the old hidden body may be served for up to one TTL —
      // by design. Poll until the reveal lands, bounded by TTL + 2 s slack.
      const { RESULTS_SNAP_TTL_MS } = await import('../src/lib/election/resultsCache.mjs');
      const deadline = Date.now() + RESULTS_SNAP_TTL_MS + 2000;
      let pub = await (await fetch(API('/api/results'))).json();
      while (pub.isRevealed !== true && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 250));
        pub = await (await fetch(API('/api/results'))).json();
      }
      expect(pub.isRevealed, `public /api/results revealed within ${RESULTS_SNAP_TTL_MS + 2000} ms`).toBe(true);
      for (const c of pub.candidates) expect(c.score).toBe(await candidateScore(c.id));
    } finally {
      await restore();
    }
  });
});
