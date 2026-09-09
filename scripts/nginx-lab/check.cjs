const http = require('node:http');
const assert = require('node:assert/strict');
function request(port, bytes, cookie) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path: `/?bytes=${bytes}`,
      maxHeaderSize: 65536, headers: cookie ? { Cookie: cookie } : {},
    }, res => {
      res.resume();
      res.on('end', () => resolve(res));
    }).on('error', reject);
  });
}
(async () => {
  for (const bytes of [0, 2048, 4096, 8192, 16384]) {
    const baseline = await request(8180, bytes);
    const fixed = await request(8181, bytes);
    assert.equal(baseline.statusCode, bytes >= 4096 ? 502 : 302);
    assert.equal(fixed.statusCode, 302);
    console.log(`id_token=${bytes}B baseline=${baseline.statusCode} fixed=${fixed.statusCode} cookie_headers=${fixed.headers['x-lab-cookie-bytes']}B chunks=${fixed.headers['x-lab-cookie-chunks']}`);
    // 16KB ID tokens exceed Node's default *request* header limit after encoding.
    // Do not hide that separate limit by claiming arbitrary-size tokens work.
    if (bytes <= 8192) {
      const cookie = fixed.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
      assert.equal((await request(8181, 0, cookie)).statusCode, 302);
    }
  }
  console.log('PASS: 5 response comparisons + 4 cookie round trips');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
