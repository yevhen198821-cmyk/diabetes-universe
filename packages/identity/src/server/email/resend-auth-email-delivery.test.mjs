import assert from 'node:assert/strict';
import test from 'node:test';

import { createResendAuthEmailDelivery } from './resend-auth-email-delivery.ts';

const payload = {
  email: 'tester@example.com',
  url: 'https://example.com/api/auth/magic-link/secret-token',
};

test('Resend API rejection fails delivery without exposing recipient or token', async () => {
  const logs = [];
  const previousError = console.error;
  console.error = (...args) => logs.push(args);

  try {
    const delivery = createResendAuthEmailDelivery(
      { apiKey: 're_test', fromAddress: 'onboarding@resend.dev' },
      {
        emails: {
          send: async () => ({
            data: null,
            error: {
              name: 'validation_error',
              message: `Provider rejected ${payload.email} ${payload.url}`,
            },
          }),
        },
      },
    );

    await assert.rejects(
      delivery.sendMagicLinkEmail(payload),
      /Auth email delivery failed/,
    );
    assert.equal(logs.length, 1);
    assert.deepEqual(logs[0][1], { category: 'validation_error' });
    assert.doesNotMatch(JSON.stringify(logs), /tester@|secret-token|re_test/);
  } finally {
    console.error = previousError;
  }
});

test('Resend successful response completes delivery', async () => {
  const delivery = createResendAuthEmailDelivery(
    { apiKey: 're_test', fromAddress: 'onboarding@resend.dev' },
    {
      emails: {
        send: async () => ({ data: { id: 'email-id' }, error: null }),
      },
    },
  );

  await delivery.sendMagicLinkEmail(payload);
});
