import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createCapturingAuthEmailDelivery,
  getCapturedMagicLinkEmailForAddress,
  getLastCapturedMagicLinkEmail,
  resetCapturedMagicLinkEmail,
} from './capturing-auth-email-delivery.ts';

test('capturing delivery stores magic links by normalized email', async () => {
  resetCapturedMagicLinkEmail();

  const delivery = createCapturingAuthEmailDelivery();

  await delivery.sendMagicLinkEmail({
    email: 'First@Example.com',
    url: 'http://127.0.0.1:3010/auth/magic-link/first',
  });
  await delivery.sendMagicLinkEmail({
    email: 'second@example.com',
    url: 'http://127.0.0.1:3010/auth/magic-link/second',
  });

  const first = getCapturedMagicLinkEmailForAddress('first@example.com');
  const second = getCapturedMagicLinkEmailForAddress('second@example.com');

  assert.ok(first);
  assert.equal(first.email, 'first@example.com');
  assert.match(first.url, /magic-link\/first$/);

  assert.ok(second);
  assert.equal(second.email, 'second@example.com');
  assert.match(second.url, /magic-link\/second$/);

  const latest = getLastCapturedMagicLinkEmail();
  assert.ok(latest);
  assert.equal(latest.email, 'second@example.com');

  resetCapturedMagicLinkEmail();
});

test('capturing delivery overwrites only the matching email slot', async () => {
  resetCapturedMagicLinkEmail();

  const delivery = createCapturingAuthEmailDelivery();

  await delivery.sendMagicLinkEmail({
    email: 'verified@example.com',
    url: 'http://127.0.0.1:3010/auth/magic-link/verified-old',
  });
  await delivery.sendMagicLinkEmail({
    email: 'passkey@example.com',
    url: 'http://127.0.0.1:3010/auth/magic-link/passkey',
  });
  await delivery.sendMagicLinkEmail({
    email: 'verified@example.com',
    url: 'http://127.0.0.1:3010/auth/magic-link/verified-new',
  });

  const verified = getCapturedMagicLinkEmailForAddress('verified@example.com');
  const passkey = getCapturedMagicLinkEmailForAddress('passkey@example.com');

  assert.ok(verified);
  assert.match(verified.url, /verified-new$/);
  assert.ok(passkey);
  assert.match(passkey.url, /passkey$/);

  resetCapturedMagicLinkEmail();
});
