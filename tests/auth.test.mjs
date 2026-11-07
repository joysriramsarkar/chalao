import test from 'node:test';
import assert from 'node:assert/strict';

import { safeEqual, verifyAdminCredentials } from '../src/lib/auth.ts';

test('safeEqual compares strings without length shortcuts', () => {
  assert.equal(safeEqual('admin', 'admin'), true);
  assert.equal(safeEqual('admin', 'Admin'), false);
  assert.equal(safeEqual('admin', 'admin '), false);
  assert.equal(safeEqual('', ''), true);
});

test('admin credentials come from the environment', () => {
  const original = {
    NODE_ENV: process.env.NODE_ENV,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  };

  try {
    process.env.NODE_ENV = 'development';
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;

    // Documented development fallback.
    assert.equal(verifyAdminCredentials('admin', 'echo123'), true);
    assert.equal(verifyAdminCredentials('ADMIN', 'echo123'), true);
    assert.equal(verifyAdminCredentials('admin', 'wrong'), false);

    process.env.ADMIN_PASSWORD = 'a-strong-password';
    assert.equal(verifyAdminCredentials('admin', 'echo123'), false);
    assert.equal(verifyAdminCredentials('admin', 'a-strong-password'), true);

    process.env.ADMIN_USERNAME = 'operator';
    assert.equal(verifyAdminCredentials('admin', 'a-strong-password'), false);
    assert.equal(verifyAdminCredentials('operator', 'a-strong-password'), true);

    // Production must not fall back to the demo password.
    process.env.NODE_ENV = 'production';
    delete process.env.ADMIN_PASSWORD;
    assert.equal(verifyAdminCredentials('operator', 'echo123'), false);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
