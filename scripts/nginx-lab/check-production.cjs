// Synthetic session, signed ONLY with the isolated lab's public test secret.
const http = require('node:http');
const assert = require('node:assert/strict');
const { encode } = require('next-auth/jwt');
const { SessionStore, defaultCookies } = require('../../node_modules/next-auth/core/lib/cookie.js');
(async () => {
  const token = await encode({
    secret: 'isolated-nginx-lab-session-secret-not-for-deployment',
    token: { sub: 'synthetic-lab-user', name: 'Synthetic Lab User', isAdmin: false, id_token: 'x'.repeat(8192) },
  });
  const store = new SessionStore(defaultCookies(false).sessionToken, { cookies: {} }, { debug() {} });
  const cookie = store.chunk(token).map(c => `${c.name}=${c.value}`).join('; ');
  await new Promise((resolve, reject) => {
    const req = http.get({ hostname: '127.0.0.1', port: 8182, path: '/api/auth/session',
      maxHeaderSize: 65536, headers: { Cookie: cookie },
    }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          assert.equal(res.statusCode, 200);
          const session = JSON.parse(body);
          assert.equal(session.id_token.length, 8192);
          assert.equal(session.user.isAdmin, false);
          assert.ok(res.headers['set-cookie']?.length >= 3);
          console.log('PASS: production NextAuth session 200, 8192B ID token preserved, refreshed cookies received, isAdmin=false');
          resolve();
        } catch (error) { reject(error); }
      });
    });
    req.setTimeout(10000, () => req.destroy(new Error('Lab request timed out')));
    req.on('error', reject);
  });
})().catch(error => { console.error(error.message); process.exitCode = 1; });
