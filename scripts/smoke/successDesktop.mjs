// Desktop/tablet geometry check for the success composition. The phone fix moved
// the identity block and the artwork out of the story <section>; the two-column
// composition is rebuilt from grid placement, so this asserts the rebuild landed
// where the old markup did: story and identity in column 1, artwork in column 2.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const TOKEN = fs.readFileSync(process.env.TEMP + '/qa-admin-token.txt', 'utf8').trim();
const OUT = process.env.TEMP + '/qa/desktop';
fs.mkdirSync(OUT, { recursive: true });
const SLUGS = (process.env.QA_SLUGS || 'original,blossom,gumroad,studio-dark,verdure,fms-official').split(',');
const VIEWPORTS = [{ n: 'w1440', w: 1440, h: 900 }, { n: 'w1024', w: 1024, h: 800 }, { n: 'w768', w: 768, h: 900 }];

const browser = await chromium.launch();
const pad = (s, n) => String(s ?? '-').padEnd(n);
console.log(pad('vp', 8) + pad('slug', 14) + pad('story x/y', 14) + pad('person x/y', 14) + pad('art x/y', 14) + pad('next x/y', 14) + 'overlap');
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  await ctx.addCookies([{ name: 'admin_token', value: TOKEN, domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  for (const slug of SLUGS) {
    await page.goto(`http://localhost:3000/template-preview?slug=${slug}&page=success&variant=locked`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(900);
    const m = await page.evaluate(() => {
      const b = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), bottom: Math.round(r.bottom + window.scrollY) }; };
      const story = b('.vx-story') || b('.os-success section:first-of-type');
      const person = b('.vx-person') || b('.os-identity');
      const art = b('.vx-illustration');
      const next = b('.vx-next') || b('.os-next');
      const over = (a, c) => a && c && a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.bottom && c.y < a.bottom;
      return { story, person, art, next, overlap: [['story/person', over(story, person)], ['story/next', over(story, next)], ['person/next', over(person, next)], ['art/next', over(art, next)]].filter(([, v]) => v).map(([k]) => k).join(',') || 'none' };
    });
    const f = (o) => o ? `${o.x}/${o.y}` : '-';
    console.log(pad(vp.n, 8) + pad(slug, 14) + pad(f(m.story), 14) + pad(f(m.person), 14) + pad(f(m.art), 14) + pad(f(m.next), 14) + m.overlap);
    await page.screenshot({ path: path.join(OUT, `${vp.n}-${slug}.png`), fullPage: false });
  }
  await ctx.close();
}
await browser.close();
