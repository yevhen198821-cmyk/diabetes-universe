import assert from 'node:assert/strict';
import test from 'node:test';

import { createProfileUserCardModel } from './profile-user-model.ts';

const fallbackLabels = {
  fallbackName: 'Account',
};

test('createProfileUserCardModel uses display name and email from principal', () => {
  const model = createProfileUserCardModel(
    {
      accountId: 'acc-1',
      displayName: 'Alex Example',
      email: 'alex@example.com',
      emailVerified: true,
    },
    fallbackLabels,
    'en-GB',
  );

  assert.equal(model.displayName, 'Alex Example');
  assert.equal(model.email, 'alex@example.com');
  assert.equal(model.showEmail, true);
  assert.equal(model.avatarInitials, 'AE');
});

test('createProfileUserCardModel falls back when display name is missing', () => {
  const model = createProfileUserCardModel(
    {
      accountId: 'acc-2',
      displayName: null,
      email: 'user@example.com',
      emailVerified: false,
    },
    fallbackLabels,
    'en-GB',
  );

  assert.equal(model.displayName, 'Account');
  assert.equal(model.avatarInitials, null);
  assert.equal(model.showEmail, true);
});

test('createProfileUserCardModel hides email when absent', () => {
  const model = createProfileUserCardModel(
    {
      accountId: 'acc-3',
      displayName: 'Alex',
      email: '   ',
      emailVerified: false,
    },
    fallbackLabels,
    'en-GB',
  );

  assert.equal(model.showEmail, false);
});

test('createProfileUserCardModel does not fabricate medical profile fields', () => {
  const model = createProfileUserCardModel(
    {
      accountId: 'acc-4',
      displayName: 'Alex Example',
      email: 'alex@example.com',
      emailVerified: true,
    },
    fallbackLabels,
    'en-GB',
  );

  assert.deepEqual(Object.keys(model).sort(), [
    'avatarInitials',
    'displayName',
    'email',
    'showEmail',
  ]);
});
