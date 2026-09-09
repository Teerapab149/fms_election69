import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminRedirectUrl } from '../../src/lib/auth/adminRedirectUrl.mjs';

test('production admin redirect uses NEXTAUTH_URL instead of container request origin', () => {
  const url = buildAdminRedirectUrl(
    '/admin/login',
    'http://localhost:3000/admin',
    {
      NODE_ENV: 'production',
      NEXTAUTH_URL: 'https://ovs.fms.psu.ac.th',
      BASE_PATH: '',
    }
  );

  assert.equal(url.href, 'https://ovs.fms.psu.ac.th/admin/login');
});

test('development admin redirect keeps the current localhost origin and port', () => {
  const url = buildAdminRedirectUrl(
    '/admin/login',
    'http://localhost:3000/admin',
    {
      NODE_ENV: 'development',
      NEXTAUTH_URL: 'https://ovs.fms.psu.ac.th',
      BASE_PATH: '',
    }
  );

  assert.equal(url.href, 'http://localhost:3000/admin/login');
});

test('production redirect applies a configured base path exactly once', () => {
  const url = buildAdminRedirectUrl(
    'admin',
    'http://localhost:3000/admin/login',
    {
      NODE_ENV: 'production',
      NEXTAUTH_URL: 'https://example.ac.th/fms-ovs',
      BASE_PATH: '/fms-ovs/',
    }
  );

  assert.equal(url.href, 'https://example.ac.th/fms-ovs/admin');
});
