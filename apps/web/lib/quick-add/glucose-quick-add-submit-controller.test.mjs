import assert from 'node:assert/strict';
import test from 'node:test';

import {
  executeGlucoseQuickAddSubmit,
  resetGlucoseQuickAddSubmitIdentity,
} from './glucose-quick-add-submit-controller.ts';
import { createGlucoseQuickAddSubmitIdentityState } from './glucose-quick-add-submit-model.ts';

const baseFormState = {
  context: undefined,
  time: '08:30',
  value: '6.4',
};

test('executeGlucoseQuickAddSubmit ignores duplicate submits while pending', async () => {
  let submitCount = 0;
  let resolveSubmit;
  const submitPromise = new Promise((resolve) => {
    resolveSubmit = resolve;
  });
  const identity = createGlucoseQuickAddSubmitIdentityState();

  const first = executeGlucoseQuickAddSubmit({
    canEnterValue: true,
    formState: baseFormState,
    glucoseDisplayUnit: 'mmol_per_l',
    identity,
    isSubmitting: false,
    onSubmit: async () => {
      submitCount += 1;
      await submitPromise;
    },
    valueOutOfRangeMessage: 'invalid',
  });
  const second = executeGlucoseQuickAddSubmit({
    canEnterValue: true,
    formState: baseFormState,
    glucoseDisplayUnit: 'mmol_per_l',
    identity,
    isSubmitting: true,
    onSubmit: async () => {
      submitCount += 1;
    },
    valueOutOfRangeMessage: 'invalid',
  });

  assert.equal((await second).type, 'ignored');
  resolveSubmit();
  assert.equal((await first).type, 'success');
  assert.equal(submitCount, 1);
});

test('executeGlucoseQuickAddSubmit retries reuse stable full event id after time change', async () => {
  const eventIds = [];
  let attempt = 0;
  const identity = createGlucoseQuickAddSubmitIdentityState();

  const first = await executeGlucoseQuickAddSubmit({
    canEnterValue: true,
    formState: baseFormState,
    glucoseDisplayUnit: 'mmol_per_l',
    identity,
    isSubmitting: false,
    onSubmit: async ({ eventId }) => {
      eventIds.push(eventId);
      attempt += 1;

      if (attempt === 1) {
        throw new Error('write failed');
      }
    },
    valueOutOfRangeMessage: 'invalid',
  });
  const second = await executeGlucoseQuickAddSubmit({
    canEnterValue: true,
    formState: {
      ...baseFormState,
      time: '08:31',
      value: '6.5',
    },
    glucoseDisplayUnit: 'mmol_per_l',
    identity,
    isSubmitting: false,
    onSubmit: async ({ eventId }) => {
      eventIds.push(eventId);
    },
    valueOutOfRangeMessage: 'invalid',
  });

  assert.equal(first.type, 'error');
  assert.equal(second.type, 'success');
  assert.equal(eventIds.length, 2);
  assert.equal(eventIds[0], eventIds[1]);
  assert.match(eventIds[0] ?? '', /^glucose-0830-/);
});

test('executeGlucoseQuickAddSubmit clears identity only after success', async () => {
  const identity = createGlucoseQuickAddSubmitIdentityState();

  const failed = await executeGlucoseQuickAddSubmit({
    canEnterValue: true,
    formState: baseFormState,
    glucoseDisplayUnit: 'mmol_per_l',
    identity,
    isSubmitting: false,
    onSubmit: async () => {
      throw new Error('write failed');
    },
    valueOutOfRangeMessage: 'invalid',
  });

  assert.equal(failed.type, 'error');
  assert.notEqual(identity.pendingEventId, null);

  resetGlucoseQuickAddSubmitIdentity(identity);
  assert.equal(identity.pendingEventId, null);
});

test('error then retry then success uses one logical identity', async () => {
  const eventIds = [];
  let attempt = 0;
  const identity = createGlucoseQuickAddSubmitIdentityState();

  await executeGlucoseQuickAddSubmit({
    canEnterValue: true,
    formState: baseFormState,
    glucoseDisplayUnit: 'mmol_per_l',
    identity,
    isSubmitting: false,
    onSubmit: async ({ eventId }) => {
      eventIds.push(eventId);
      attempt += 1;

      if (attempt === 1) {
        throw new Error('write failed');
      }
    },
    valueOutOfRangeMessage: 'invalid',
  });

  await executeGlucoseQuickAddSubmit({
    canEnterValue: true,
    formState: {
      ...baseFormState,
      context: 'fasting',
    },
    glucoseDisplayUnit: 'mmol_per_l',
    identity,
    isSubmitting: false,
    onSubmit: async ({ eventId }) => {
      eventIds.push(eventId);
    },
    valueOutOfRangeMessage: 'invalid',
  });

  assert.equal(eventIds.length, 2);
  assert.equal(new Set(eventIds).size, 1);
});
