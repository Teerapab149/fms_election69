// Contrast guard for the success page's action buttons.
//
// The primary action changes ELEMENT between states — a <button> while the
// evaluation form is still to do, an <a> once it is done — and every family shell
// carries a blanket link rule. Verdure's `.vd-root a:not(.vd-btn){color:inherit}`
// is specificity (0,2,1) and used to outrank the single-class
// `.vx-verdure .vx-primary` (0,2,0): the finished state rendered cream text on a
// cream pill, i.e. an empty capsule, and only in that one state, on one family.
// Nothing in a build, a lint or a DOM assertion catches that — only comparing the
// painted colours does.
//
//   node scripts/smoke/successButtonContrast.mjs
//   QA_SLUGS=verdure node scripts/smoke/successButtonContrast.mjs
//
// Needs the dev server on :3000 and an admin_token (preview is admin-gated).
// Exits non-zero if any button falls under the luminance threshold.
import { chromium } from 'playwright';
import fs from 'node:fs';

const tokenFile = process.env.QA_TOKEN_FILE || (process.env.TEMP + '/qa-admin-token.txt');
const TOKEN = process.env.QA_ADMIN_TOKEN || fs.readFileSync(tokenFile, 'utf8').trim();
const SLUGS = (process.env.QA_SLUGS || 'original,blossom,gumroad,studio-dark,verdure,fms-official,receipt').split(',');
const MIN_DELTA = Number(process.env.QA_MIN_DELTA || 40); // perceived-luminance points

const lum = (c) => {
  const str = String(c || '').trim();
  const m = str.match(/[\d.]+/g);
  if (!m) return NaN;
  // color-mix() computes to color(srgb r g b) with 0..1 channels; rgb() is 0..255.
  const k = str.startsWith('color(') ? 255 : 1;
  return 0.299 * +m[0] * k + 0.587 * +m[1] * k + 0.114 * +m[2] * k;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([{ name: 'admin_token', value: TOKEN, domain: 'localhost', path: '/' }]);
const page = await ctx.newPage();

const rows = [];
for (const slug of SLUGS) {
  for (const variant of ['locked', 'unlocked']) {
    await page.goto(`http://localhost:3000/template-preview?slug=${slug}&page=success&variant=${variant}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(800);
    const found = await page.evaluate(() => {
      const sel = '.vx-button, .os-action:not(:disabled), .rc-suc-cta, .rc-suc-home, .rc-results-link';
      // A ghost button on a gradient panel is white over rgba(255,255,255,.08) over
      // purple — reading only its own background-color says white-on-white and cries
      // wolf. Collect the painted layers up the tree and composite them, and treat a
      // gradient ancestor as its background-color (every panel here sets a solid
      // fallback under its background-image for exactly this reason).
      const parse = (c) => { const m = String(c).match(/[\d.]+/g); return m ? { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] } : null; };
      const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
      const backdrop = (el) => {
        const layers = [];
        for (let p = el; p; p = p.parentElement) {
          const c = parse(getComputedStyle(p).backgroundColor);
          if (c && c.a > 0) { layers.push(c); if (c.a === 1) break; }
        }
        if (!layers.length) return { r: 255, g: 255, b: 255, a: 1 };
        return layers.reduceRight((acc, c) => over(c, acc), { r: 255, g: 255, b: 255, a: 1 });
      };
      return [...document.querySelectorAll(sel)]
        .filter((e) => e.offsetParent !== null)
        .map((e) => {
          const cs = getComputedStyle(e);
          const b = backdrop(e);
          return {
            text: (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 24), tag: e.tagName,
            color: cs.color, bg: `rgb(${Math.round(b.r)}, ${Math.round(b.g)}, ${Math.round(b.b)})`,
          };
        })
        .filter((r) => r.text);
    });
    for (const f of found) {
      const d = Math.abs(lum(f.color) - lum(f.bg));
      rows.push({ slug, variant, ...f, delta: Number.isNaN(d) ? null : Math.round(d) });
    }
  }
}
await browser.close();

const pad = (s, n) => String(s ?? '-').padEnd(n);
const bad = rows.filter((r) => r.delta !== null && r.delta < MIN_DELTA);
console.log(pad('slug', 14) + pad('variant', 10) + pad('tag', 7) + pad('label', 26) + pad('color', 22) + pad('bg', 22) + 'Δlum');
for (const r of rows) console.log(pad(r.slug, 14) + pad(r.variant, 10) + pad(r.tag, 7) + pad(r.text, 26) + pad(r.color, 22) + pad(r.bg, 22) + (r.delta ?? '-') + (bad.includes(r) ? '   <-- UNREADABLE' : ''));
console.log(`\n${rows.length} buttons checked, threshold Δlum >= ${MIN_DELTA}`);
if (bad.length) { console.log(`${bad.length} UNREADABLE`); process.exit(1); }
console.log('all readable');
