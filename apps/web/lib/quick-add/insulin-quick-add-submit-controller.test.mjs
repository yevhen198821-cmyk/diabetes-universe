import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveInsulinPresentationLabels } from '../medical/insulin/insulin-presentation-labels.ts';
import { createTestPlatformRuntime } from '../platform/react/testing/create-test-platform-runtime.ts';
import {
  createInsulinQuickAddSubmitIdentityState,
  persistPreparedInsulinQuickAddSubmit,
  prepareInsulinQuickAddSubmitWithIdentity,
  resetInsulinQuickAddSubmitIdentity,
} from './insulin-quick-add-submit-controller.ts';

const baseFormState = {
  administrationContext: 'before_meal',
  dose: '4',
  otherName: '',
  preparationId: 'insulin.prep.aspart_novorapid',
  time: '08:30',
};

let labels;

test.before(async () => {
  labels = resolveInsulinPresentationLabels(
    (await createTestPlatformRuntime()).localization,
  );
});

test('prepareInsulinQuickAddSubmitWithIdentity rejects invalid dose without creating submit identity', () => {
  const identity = createInsulinQuickAddSubmitIdentityState();

  const prepared = prepareInsulinQuickAddSubmitWithIdentity({
    formState: { ...baseFormState, dose: 'not-a-number' },
    identity,
    labels,
  });

  assert.equal(prepared.type, 'invalid');
  assert.equal(prepared.field, 'dose');
  assert.equal(identity.pendingEventId, null);
});

test('prepareInsulinQuickAddSubmitWithIdentity prepares stable request for valid entry', () => {
  const identity = createInsulinQuickAddSubmitIdentityState();

  const prepared = prepareInsulinQuickAddSubmitWithIdentity({
    formState: baseFormState,
    identity,
    labels,
  });

  assert.equal(prepared.type, 'prepared');
  assert.match(prepared.request.eventId, /^insulin-0830-/);
  assert.equal(
    prepared.request.entry.preparationId,
    'insulin.prep.aspart_novorapid',
  );
  assert.equal(prepared.request.entry.administrationContext, 'before_meal');
});

test('persistPreparedInsulinQuickAddSubmit preserves identity on failure', async () => {
  const identity = createInsulinQuickAddSubmitIdentityState();
  const prepared = prepareInsulinQuickAddSubmitWithIdentity({
    formState: baseFormState,
    identity,
    labels,
  });

  assert.equal(prepared.type, 'prepared');

  const result = await persistPreparedInsulinQuickAddSubmit({
    identity,
    onSubmit: async () => {
      throw new Error('write failed');
    },
    request: prepared.request,
  });

  assert.equal(result.type, 'error');
  assert.equal(identity.pendingEventId, prepared.request.eventId);
});

test('persistPreparedInsulinQuickAddSubmit clears identity only on success', async () => {
  const identity = createInsulinQuickAddSubmitIdentityState();
  const prepared = prepareInsulinQuickAddSubmitWithIdentity({
    formState: baseFormState,
    identity,
    labels,
  });

  assert.equal(prepared.type, 'prepared');

  const result = await persistPreparedInsulinQuickAddSubmit({
    identity,
    onSubmit: async () => {},
    request: prepared.request,
  });

  assert.equal(result.type, 'success');
  assert.equal(identity.pendingEventId, null);
});

test('retry after failure reuses the same stable full event id', async () => {
  const identity = createInsulinQuickAddSubmitIdentityState();
  const eventIds = [];
  let attempt = 0;

  const firstPrepared = prepareInsulinQuickAddSubmitWithIdentity({
    formState: baseFormState,
    identity,
    labels,
  });
  assert.equal(firstPrepared.type, 'prepared');

  const firstPersist = await persistPreparedInsulinQuickAddSubmit({
    identity,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
      attempt += 1;
      if (attempt === 1) {
        throw new Error('write failed');
      }
    },
    request: firstPrepared.request,
  });
  assert.equal(firstPersist.type, 'error');

  const retryPrepared = prepareInsulinQuickAddSubmitWithIdentity({
    formState: { ...baseFormState, dose: '5', time: '08:31' },
    identity,
    labels,
  });
  assert.equal(retryPrepared.type, 'prepared');

  const secondPersist = await persistPreparedInsulinQuickAddSubmit({
    identity,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
    },
    request: retryPrepared.request,
  });

  assert.equal(secondPersist.type, 'success');
  assert.equal(eventIds.length, 2);
  assert.equal(eventIds[0], eventIds[1]);
});

test('resetInsulinQuickAddSubmitIdentity clears pending identity explicitly', () => {
  const identity = createInsulinQuickAddSubmitIdentityState();

  prepareInsulinQuickAddSubmitWithIdentity({
    formState: baseFormState,
    identity,
    labels,
  });
  assert.notEqual(identity.pendingEventId, null);

  resetInsulinQuickAddSubmitIdentity(identity);
  assert.equal(identity.pendingEventId, null);
});
