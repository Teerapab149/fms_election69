import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSameOrigin, UNSAFE_METHODS, BAD_ORIGIN_BODY } from '../../src/lib/security/sameOrigin.mjs';

const PROD = 'https://ovs.fms.psu.ac.th';
const HOST = 'ovs.fms.psu.ac.th';

// [label, input, expected ok]
const CASES = [
  // Sec-Fetch-Site wins whenever the browser sent it
  ['sec-fetch-site same-origin', { secFetchSite: 'same-origin', host: HOST, nextAuthUrl: PROD }, true],
  ['sec-fetch-site same-origin, case-insensitive', { secFetchSite: 'Same-Origin', host: HOST, nextAuthUrl: PROD }, true],
  ['sec-fetch-site same-site (sibling *.psu.ac.th)', { secFetchSite: 'same-site', origin: 'https://evil.psu.ac.th', host: HOST, nextAuthUrl: PROD }, false],
  ['sec-fetch-site cross-site', { secFetchSite: 'cross-site', host: HOST, nextAuthUrl: PROD }, false],
  ['sec-fetch-site none (typed URL)', { secFetchSite: 'none', host: HOST, nextAuthUrl: PROD }, false],
  ['same-origin header cannot be outvoted by a bad Origin', { secFetchSite: 'same-origin', origin: 'https://evil.psu.ac.th', host: HOST, nextAuthUrl: PROD }, true],
  ['cross-site header cannot be rescued by a good Origin', { secFetchSite: 'cross-site', origin: PROD, host: HOST, nextAuthUrl: PROD }, false],

  // Origin only
  ['origin equals host', { origin: PROD, host: HOST, nextAuthUrl: PROD }, true],
  ['origin equals host, host header upper-case', { origin: PROD, host: 'OVS.FMS.PSU.AC.TH', nextAuthUrl: PROD }, true],
  ['origin with default port 443 equals host', { origin: 'https://ovs.fms.psu.ac.th:443', host: HOST, nextAuthUrl: PROD }, true],
  ['evil.psu.ac.th (same-site, other origin)', { origin: 'https://evil.psu.ac.th', host: HOST, nextAuthUrl: PROD }, false],
  ['host as a prefix of an attacker host', { origin: 'https://ovs.fms.psu.ac.th.evil.com', host: HOST, nextAuthUrl: PROD }, false],
  ['host as a suffix of an attacker host', { origin: 'https://evilovs.fms.psu.ac.th', host: HOST, nextAuthUrl: PROD }, false],
  ['userinfo trick (host is after the @)', { origin: 'https://ovs.fms.psu.ac.th@evil.com', host: HOST, nextAuthUrl: PROD }, false],
  ['parent domain', { origin: 'https://fms.psu.ac.th', host: HOST, nextAuthUrl: PROD }, false],
  ['other port on the same hostname', { origin: 'https://ovs.fms.psu.ac.th:8443', host: HOST, nextAuthUrl: PROD }, false],
  ['Origin "null"', { origin: 'null', host: HOST, nextAuthUrl: PROD }, false],
  ['malformed Origin', { origin: 'not a url', host: HOST, nextAuthUrl: PROD }, false],
  ['non-web Origin scheme', { origin: 'chrome-extension://abcdef', host: 'abcdef', nextAuthUrl: PROD }, false],
  ['empty-string Origin counts as absent', { origin: '', host: HOST, nextAuthUrl: PROD }, true],

  // behind a proxy that rewrites Host: only NEXTAUTH_URL can vouch
  ['proxy rewrote Host, Origin equals NEXTAUTH_URL', { origin: PROD, host: 'web:3000', nextAuthUrl: PROD }, true],
  ['proxy rewrote Host, evil Origin', { origin: 'https://evil.psu.ac.th', host: 'web:3000', nextAuthUrl: PROD }, false],
  ['http vs https against NEXTAUTH_URL (scheme is compared)', { origin: 'http://ovs.fms.psu.ac.th', host: 'web:3000', nextAuthUrl: PROD }, false],
  ['https vs http NEXTAUTH_URL (scheme is compared)', { origin: 'https://localhost:3100', host: 'web:3000', nextAuthUrl: 'http://localhost:3100' }, false],
  ['NEXTAUTH_URL with a base path still matches by origin', { origin: PROD, host: 'web:3000', nextAuthUrl: `${PROD}/fms-ovs` }, true],
  ['NEXTAUTH_URL unset and Host rewritten', { origin: PROD, host: 'web:3000', nextAuthUrl: undefined }, false],
  ['NEXTAUTH_URL garbage and Host rewritten', { origin: PROD, host: 'web:3000', nextAuthUrl: 'not a url' }, false],
  ['Host header missing, Origin equals NEXTAUTH_URL', { origin: PROD, nextAuthUrl: PROD }, true],
  ['Host header missing, no NEXTAUTH_URL', { origin: PROD }, false],
  ['Host header malformed', { origin: PROD, host: 'a b/c', nextAuthUrl: undefined }, false],

  // local development
  ['localhost origin equals host', { origin: 'http://localhost:3100', host: 'localhost:3100' }, true],
  ['localhost on another port', { origin: 'http://localhost:3105', host: 'localhost:3100', nextAuthUrl: 'http://localhost:3100' }, false],

  // neither header: non-browser client, no ambient cookie
  ['no headers at all', { host: HOST, nextAuthUrl: PROD }, true],
  ['no input at all', undefined, true],
];

for (const [label, input, expected] of CASES) {
  test(`checkSameOrigin: ${label} -> ${expected ? 'allowed' : 'refused'}`, () => {
    const verdict = checkSameOrigin(input);
    assert.equal(verdict.ok, expected, `${label}: ${JSON.stringify(verdict)}`);
    assert.equal(typeof verdict.reason, 'string');
  });
}

test('only state-changing methods are checked', () => {
  assert.deepEqual([...UNSAFE_METHODS].sort(), ['DELETE', 'PATCH', 'POST', 'PUT']);
});

test('the refusal body carries the stable code and a Thai sentence with no trailing period', () => {
  assert.equal(BAD_ORIGIN_BODY.code, 'BAD_ORIGIN');
  assert.match(BAD_ORIGIN_BODY.error, /[฀-๿]/);
  assert.ok(!BAD_ORIGIN_BODY.error.endsWith('.'));
  const banned = [0xb7, 0x2192, 0x2190, 0x2014].map((c) => String.fromCharCode(c));
  assert.ok(!banned.some((ch) => BAD_ORIGIN_BODY.error.includes(ch)));
});
