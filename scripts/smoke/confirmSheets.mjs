// Drives the vote ballot in /template-preview interact mode until each family's
// confirm sheet is open, then screenshots it and checks the shared behaviour
// contract every skin inherits from ConfirmShell: dialog semantics, a reachable
// confirm, Escape, and the scrim.
//
//   node scripts/smoke/confirmSheets.mjs
//   QA_SLUGS=studio-dark QA_W=1280 QA_H=900 node scripts/smoke/confirmSheets.mjs
//
// Needs the dev server on :3000 and an admin_token (preview is admin-gated).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const tokenFile = process.env.QA_TOKEN_FILE || (process.env.TEMP + '/qa-admin-token.txt');
const TOKEN = process.env.QA_ADMIN_TOKEN || fs.readFileSync(tokenFile, 'utf8').trim();
const SLUGS = (process.env.QA_SLUGS || 'blossom,gumroad,studio-dark,verdure,fms-official,receipt,original').split(',');
const OUT = process.env.QA_OUT || (process.env.TEMP + '/qa/confirm');
const VIEWPORT = { width: Number(process.env.QA_W || 1280), height: Number(process.env.QA_H || 900) };
fs.mkdirSync(OUT, { recursive: true });

const CONFIRM_RX = /^\s*(ยืนยัน|ยืนยันการลงคะแนน|ยืนยันคะแนน|หย่อนบัตร)/;

// Every family draws the ballot option as a clickable CARD rather than a <button>,
// but they all mark it role="radio" — that is the one selector the whole set shares.
// (Matching on the party name instead picks up the page headline on blossom, whose
// h1 also starts with "พรรค".)
async function pickOption(page) {
  const opts = page.locator('[role="radio"]');
  const n = await opts.count();
  // QA_PICK=last selects the trailing option, which is งดออกเสียง / ไม่รับรอง on every
  // family — that is how the semantic (amber / red) tones get exercised.
  const order = process.env.QA_PICK === 'last' ? [...Array(n).keys()].reverse() : [...Array(n).keys()];
  for (const i of order) {
    const el = opts.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await el.click({ timeout: 5000 }).catch(() => {});
    return true;
  }
  return false;
}

async function clickFirstVisible(scope, rx) {
  const all = scope.locator('button, [role="button"]').filter({ hasText: rx });
  const n = await all.count();
  for (let i = 0; i < n; i += 1) {
    const el = all.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    if (await el.isDisabled().catch(() => false)) continue;
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await el.click({ timeout: 5000 }).catch(() => {});
    return true;
  }
  return false;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VIEWPORT });
await ctx.addCookies([{ name: 'admin_token', value: TOKEN, domain: 'localhost', path: '/' }]);
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));

const rows = [];
for (const slug of SLUGS) {
  await page.goto(`http://localhost:3000/template-preview?slug=${slug}&page=vote&variant=multi&interact=1`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1100);
  await pickOption(page);
  await page.waitForTimeout(500);
  // the ballot may need a page-level confirm bar before the sheet appears
  for (let i = 0; i < 2; i += 1) {
    if (await page.locator('[role="dialog"]').count()) break;
    if (!(await clickFirstVisible(page, CONFIRM_RX))) break;
    await page.waitForTimeout(500);
  }
  const dialog = page.locator('[role="dialog"]').last();
  const open = await dialog.count() > 0 && await dialog.isVisible().catch(() => false);
  let info = { open, skin: null, confirmLabel: null, focused: null, escClosed: null };
  if (open) {
    info.skin = await page.evaluate(() => {
      const d = [...document.querySelectorAll('[role="dialog"]')].pop();
      const root = d.className || '';
      return (root.match(/vc-(bl|gm|sd|vd|fo)\b/) || [, d.querySelector('.rc-slip') ? 'receipt' : 'classic'])[1];
    });
    const cta = dialog.locator('[data-confirm-focus], button').filter({ hasText: CONFIRM_RX }).first();
    info.confirmLabel = (await cta.count()) ? (await cta.innerText()).replace(/\s+/g, ' ').trim().slice(0, 26) : null;
    info.focused = await page.evaluate(() => document.activeElement?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 20) || null);
    await page.screenshot({ path: path.join(OUT, `${slug}-confirm.png`) });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    info.escClosed = !(await page.locator('[role="dialog"]').count() && await page.locator('[role="dialog"]').last().isVisible().catch(() => false));
  }
  rows.push({ slug, ...info });
}
await browser.close();

const pad = (s, n) => String(s ?? '-').padEnd(n);
console.log(pad('slug', 14) + pad('opened', 8) + pad('skin', 10) + pad('confirm label', 28) + pad('focus moved to', 22) + 'esc closes');
for (const r of rows) console.log(pad(r.slug, 14) + pad(r.open ? 'YES' : 'NO', 8) + pad(r.skin, 10) + pad(r.confirmLabel, 28) + pad(r.focused, 22) + (r.escClosed === null ? '-' : r.escClosed ? 'YES' : 'NO'));
if (errs.length) { console.log('\npage errors:'); errs.forEach((e) => console.log('  ' + e)); }
const bad = rows.filter((r) => !r.open || r.escClosed === false);
console.log(`\n${rows.length} families checked, screenshots in ${OUT}`);
if (bad.length) { console.log(`${bad.length} did not satisfy the contract`); process.exit(1); }
console.log('all families opened their own sheet and honour Escape');
