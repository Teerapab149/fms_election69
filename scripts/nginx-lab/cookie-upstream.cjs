// Isolated diagnostic fixture: no real credentials, database, or OAuth calls.
const http = require('node:http');
const { encode } = require('next-auth/jwt');
const { SessionStore, defaultCookies } = require('../../node_modules/next-auth/core/lib/cookie.js');
const { serialize } = require('cookie');

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://fixture');
    const bytes = Number(url.searchParams.get('bytes') || 0);
    if (![0, 2048, 4096, 8192, 16384].includes(bytes)) {
      res.writeHead(400).end('Unsupported fixture size');
      return;
    }
    const value = await encode({
      secret: 'isolated-nginx-lab-not-a-production-secret',
      token: { sub: 'synthetic-user', name: 'Synthetic Test', id_token: 'x'.repeat(bytes) },
    });
    const store = new SessionStore(defaultCookies(true).sessionToken, { cookies: {} }, { debug() {} });
    const cookies = store.chunk(value).map(c => serialize(c.name, c.value, c.options));
    res.writeHead(302, {
      'Set-Cookie': cookies,
      Location: '/login',
      'Cache-Control': 'no-store',
      'X-Lab-Cookie-Bytes': String(cookies.reduce((n, c) => n + Buffer.byteLength(c) + 14, 0)),
      'X-Lab-Cookie-Chunks': String(cookies.length),
    }).end();
  } catch {
    res.writeHead(500).end('Fixture failed');
  }
}).listen(3100, '0.0.0.0');
