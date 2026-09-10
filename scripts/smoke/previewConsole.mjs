// Console sweep over every /template-preview surface.
//
// Catches the class of defect that only shows up once the page runs: hydration
// attribute/text mismatches, React warnings, uncaught errors and failed requests.
// Run it after any change to a template family, a shell or a shared page
// component — a mismatch here is silent in production but means React threw away
// the server markup for that subtree.
//
//   node scripts/smoke/previewConsole.mjs
//   QA_SLUGS=blossom,receipt node scripts/smoke/previewConsole.mjs
//
// Needs the dev server on :3000 and an admin_token (the preview route is behind
// the admin gate — see src/middleware.js ADMIN_TOOL_PAGES). Point QA_TOKEN_FILE
// at a file holding the cookie value, or set QA_ADMIN_TOKEN.
import { chromium } from 'playwright';
import fs from 'node:fs';

const tokenFile = process.env.QA_TOKEN_FILE || (process.env.TEMP + '/qa-admin-token.txt');
const TOKEN = process.env.QA_ADMIN_TOKEN || fs.readFileSync(tokenFile, 'utf8').trim();

const SLUGS = (process.env.QA_SLUGS || 'original,blossom,gumroad,studio-dark,verdure,fms-official,receipt,classic,modern-dark,playful,minimal').split(',');
const SURFACES = [
  { page: 'home' }, { page: 'candidates' }, { page: 'party' },
  { page: 'vote', variant: 'multi' }, { page: 'vote', variant: 'single' },
  { page: 'results', variant: 'locked' }, { page: 'results', variant: 'revealed' },
  { page: 'success', variant: 'locked' }, { page: 'success', variant: 'unlocked' },
  { page: 'closed', variant: 'waiting' }, { page: 'closed', variant: 'ended' },
];
const VIEWPORT = { width: Number(process.env.QA_W || 1280), height: Number(process.env.QA_H || 900) };

// Dev-server noise that says nothing about the page under test.
const IGNORE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /webpack-hmr|hot-update/i,
  /Next\.js \(.*\) is outdated/i,
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VIEWPORT });
await ctx.addCookies([{ name: 'admin_token', value: TOKEN, domain: 'localhost', path: '/' }]);
const page = await ctx.newPage();

let bucket = [];
page.on('console', (m) => {
  if (!['error', 'warning'].includes(m.type())) return;
  const t = m.text();
  if (IGNORE.some((r) => r.test(t))) return;
  bucket.push(`${m.type()}: ${t.replace(/\s+/g, ' ').slice(0, 180)}`);
});
page.on('pageerror', (e) => bucket.push(`pageerror: ${String(e).replace(/\s+/g, ' ').slice(0, 180)}`));
page.on('requestfailed', (r) => {
  const f = r.failure()?.errorText || '';
  if (/ERR_ABORTED/.test(f)) return; // navigation-cancelled fetches
  bucket.push(`requestfailed: ${f} ${r.url().slice(0, 110)}`);
});

const findings = [];
let checked = 0;
for (const slug of SLUGS) {
  for (const s of SURFACES) {
    const url = `http://localhost:3000/template-preview?slug=${slug}&page=${s.page}${s.variant ? `&variant=${s.variant}` : ''}`;
    bucket = [];
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    } catch (e) {
      bucket.push(`navigation: ${String(e).split('\n')[0].slice(0, 140)}`);
    }
    await page.waitForTimeout(700);
    checked += 1;
    const uniq = [...new Set(bucket)];
    if (uniq.length) findings.push({ slug, surface: `${s.page}${s.variant ? '/' + s.variant : ''}`, issues: uniq });
  }
}
await browser.close();

console.log(`checked ${checked} preview surfaces at ${VIEWPORT.width}x${VIEWPORT.height}`);
if (!findings.length) { console.log('CLEAN — no console errors, page errors or failed requests'); process.exit(0); }
for (const f of findings) {
  console.log(`\n${f.slug} · ${f.surface}`);
  for (const i of f.issues) console.log('   ' + i);
}
console.log(`\n${findings.length} of ${checked} surfaces reported something`);
process.exit(1);
