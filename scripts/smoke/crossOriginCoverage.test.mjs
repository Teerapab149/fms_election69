// Every API route that changes state must be reached by the cross-origin check, one
// way or the other:
//   - matched by src/middleware.js (the default), or
//   - excluded from its matcher and then calling rejectCrossOrigin() itself, first,
//     in every POST/PUT/PATCH/DELETE handler.
// A route is excluded because Next buffers bodies that pass through middleware and
// cuts them at 10 MB (the uploads), or because middleware costs about 22% of vote
// throughput (/api/vote); see the comment above `config` in the middleware. This
// test reads the real matcher and the real route files, so a new upload route that
// is added to the exclusions without the helper, or a helper call that gets deleted,
// fails here instead of silently opening the CSRF hole again.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const API_DIR = path.join(ROOT, 'src/app/api');
const UNSAFE = ['POST', 'PUT', 'PATCH', 'DELETE'];
// excluded for reasons other than size: NextAuth has its own CSRF token, media is GET only
const NOT_ABOUT_SIZE = new Set(['api/auth', 'api/media']);

function matcherExclusions() {
  const src = fs.readFileSync(path.join(ROOT, 'src/middleware.js'), 'utf8');
  const m = src.match(/matcher:\s*\[\s*'([^']+)'/);
  assert.ok(m, 'could not find the matcher literal in src/middleware.js');
  const look = m[1].match(/\(\?!(.*)\)\.\*\)/);
  assert.ok(look, 'matcher no longer has the (?!...) exclusion shape this test understands');
  return look[1]
    .replace(/\(\?:\/\|\$\)/g, '@END') // its own "|" must not split the list
    .split('|')
    .filter((t) => t.startsWith('api/'))
    .map((t) => t.replace('@END', '').replace(/\/$/, ''));
}

function routeFiles(dir = API_DIR, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) routeFiles(p, out);
    else if (e.name === 'route.js') out.push(p);
  }
  return out;
}

const urlOf = (file) => path.relative(path.join(ROOT, 'src/app'), path.dirname(file)).split(path.sep).join('/');
const isExcluded = (url, ex) => ex.some((x) => url === x || url.startsWith(`${x}/`));

// source of one exported handler: from its `export ... function NAME` to the next export
function handlerBody(src, name) {
  const re = new RegExp(`export\\s+(?:async\\s+)?function\\s+${name}\\b`);
  const m = re.exec(src);
  if (!m) return null;
  const rest = src.slice(m.index + m[0].length);
  const next = rest.search(/\nexport\s/);
  return next === -1 ? rest : rest.slice(0, next);
}

test('every exclusion in the middleware matcher maps to a real route or a known reason', () => {
  const ex = matcherExclusions();
  const urls = routeFiles().map(urlOf);
  for (const x of ex) {
    if (NOT_ABOUT_SIZE.has(x)) continue;
    assert.ok(urls.some((u) => u === x || u.startsWith(`${x}/`)), `matcher excludes ${x} but no route exists there`);
  }
});

test('media and auth exclusions are not state-changing routes the check would miss', () => {
  const media = routeFiles().filter((f) => urlOf(f).startsWith('api/media'));
  for (const f of media) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of UNSAFE) assert.equal(handlerBody(src, m), null, `${urlOf(f)} exports ${m} but is excluded as GET-only`);
  }
});

test('every route excluded from the middleware calls rejectCrossOrigin first in each unsafe handler', () => {
  const ex = matcherExclusions().filter((x) => !NOT_ABOUT_SIZE.has(x));
  assert.ok(ex.length > 0, 'expected at least the upload routes to be excluded');
  for (const file of routeFiles().filter((f) => isExcluded(urlOf(f), ex))) {
    const src = fs.readFileSync(file, 'utf8');
    assert.match(src, /from\s+["'][^"']*security\/crossOriginGuard["']/, `${urlOf(file)} must import crossOriginGuard`);
    let handlers = 0;
    for (const method of UNSAFE) {
      const body = handlerBody(src, method);
      if (body === null) continue;
      handlers++;
      const call = body.indexOf('rejectCrossOrigin(');
      assert.ok(call !== -1, `${urlOf(file)} ${method} does not call rejectCrossOrigin`);
      const early = body.search(/adminGuard\(|requireAdmin\(|getServerSession\(|rateLimit\(|\.formData\(|\.json\(|\.text\(|\.arrayBuffer\(|db\./);
      assert.ok(early === -1 || call < early, `${urlOf(file)} ${method} reads the body or touches auth/db before rejectCrossOrigin`);
    }
    assert.ok(handlers > 0, `${urlOf(file)} is excluded but exports no unsafe handler`);
  }
});

test('every route that reads a request body is either matched by the middleware or guards itself', () => {
  const ex = matcherExclusions().filter((x) => !NOT_ABOUT_SIZE.has(x));
  const readers = routeFiles().filter((f) => /\.formData\(|\.arrayBuffer\(|\.blob\(/.test(fs.readFileSync(f, 'utf8')));
  assert.ok(readers.length >= 2, 'expected the two upload routes to be found');
  for (const file of readers) {
    const url = urlOf(file);
    if (!isExcluded(url, ex)) continue; // matched by middleware: checked there
    assert.match(fs.readFileSync(file, 'utf8'), /rejectCrossOrigin\(/, `${url} is excluded from middleware and must guard itself`);
  }
});

test('the excluded routes are exactly the two upload routes and the vote route', () => {
  assert.deepEqual(
    matcherExclusions().filter((x) => !NOT_ABOUT_SIZE.has(x)).sort(),
    ['api/admin/candidates', 'api/admin/global-config/banner', 'api/vote'],
  );
});
