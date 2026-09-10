import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const TOKEN = fs.readFileSync(process.env.TEMP + '/qa-admin-token.txt', 'utf8').trim();
const OUT = process.argv[2] || (process.env.TEMP + '/qa/shots');
fs.mkdirSync(OUT, { recursive: true });

const SLUGS = (process.env.QA_SLUGS || 'original,blossom,gumroad,studio-dark,verdure,fms-official,receipt').split(',');
const VARIANTS = ['locked', 'unlocked'];
const VIEWPORTS = (process.env.QA_VPS || 'iphone:390:844,android:412:915,small:360:740')
  .split(',').map(s => { const [n, w, h] = s.split(':'); return { n, w: +w, h: +h }; });

const CTA_RX = 'เปิดแบบประเมิน|ทำแบบประเมิน|ดูผลคะแนน|ไปหน้าผลคะแนน|แบบประเมิน';

const browser = await chromium.launch();
const rows = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2 });
  await ctx.addCookies([{ name: 'admin_token', value: TOKEN, domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  for (const slug of SLUGS) {
    for (const variant of VARIANTS) {
      const url = `http://localhost:3000/template-preview?slug=${slug}&page=success&variant=${variant}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      } catch { /* measure whatever rendered */ }
      await page.waitForTimeout(1200);
      await page.evaluate(() => window.scrollTo(0, 0));
      const info = await page.evaluate((rxSrc) => {
        const rx = new RegExp(rxSrc);
        const nodes = [...document.querySelectorAll('button, a')];
        const hits = nodes.filter(n => rx.test((n.textContent || '').trim()) && n.offsetParent !== null);
        const primary = hits.find(n => !/ก่อนดูผลคะแนน/.test(n.textContent) && !n.disabled) || hits[0];
        const r = primary ? primary.getBoundingClientRect() : null;
        return {
          vh: window.innerHeight,
          docH: document.documentElement.scrollHeight,
          label: primary ? primary.textContent.trim().replace(/\s+/g, ' ').slice(0, 34) : null,
          top: r ? Math.round(r.top) : null,
          bottom: r ? Math.round(r.bottom) : null,
          count: hits.length,
        };
      }, CTA_RX);
      const visible = info.bottom !== null && info.bottom <= info.vh && info.top >= 0;
      rows.push({ vp: vp.n, w: vp.w, h: vp.h, slug, variant, ...info, visible });
      await page.screenshot({ path: path.join(OUT, `${vp.n}-${slug}-${variant}.png`) });
    }
  }
  await ctx.close();
}
await browser.close();

const pad = (s, n) => String(s ?? '-').padEnd(n);
console.log(pad('viewport', 10) + pad('slug', 14) + pad('variant', 10) + pad('vh', 6) + pad('docH', 7) + pad('cta.top', 9) + pad('cta.bot', 9) + pad('inFold', 8) + 'label');
for (const r of rows) console.log(pad(`${r.w}x${r.h}`, 10) + pad(r.slug, 14) + pad(r.variant, 10) + pad(r.vh, 6) + pad(r.docH, 7) + pad(r.top, 9) + pad(r.bottom, 9) + pad(r.visible ? 'YES' : 'NO', 8) + (r.label || 'NOT FOUND'));
fs.writeFileSync(path.join(OUT, 'rows.json'), JSON.stringify(rows, null, 2));
