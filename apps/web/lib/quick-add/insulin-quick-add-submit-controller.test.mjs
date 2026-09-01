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

async function prepareAndPersist({ formState, identity, onSubmit }) {
  const prepared = prepareInsulinQuickAddSubmitWithIdentity({
    formState,
    identity,
    labels,
  });

  if (prepared.type === 'invalid') {
    return { prepared, persist: null };
  }

  const persist = await persistPreparedInsulinQuickAddSubmit({
    identity,
    onSubmit,
    request: prepared.request,
  });

  return { prepared, persist };
}

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

test('failure then unchanged retry reuses the same stable full event id', async () => {
  const identity = createInsulinQuickAddSubmitIdentityState();
  const eventIds = [];
  let attempt = 0;

  const first = await prepareAndPersist({
    formState: baseFormState,
    identity,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
      attempt += 1;
      if (attempt === 1) {
        throw new Error('write failed');
      }
    },
  });
  assert.equal(first.prepared.type, 'prepared');
  assert.equal(first.persist?.type, 'error');

  const retry = await prepareAndPersist({
    formState: baseFormState,
    identity,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
    },
  });

  assert.equal(retry.persist?.type, 'success');
  assert.equal(eventIds.length, 2);
  assert.equal(eventIds[0], eventIds[1]);
});

test('failure then changed dose allocates a new event id', async () => {
  const identity = createInsulinQuickAddSubmitIdentityState();
  const eventIds = [];
  let attempt = 0;

  await prepareAndPersist({
    formState: baseFormState,
    identity,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
      attempt += 1;
      if (attempt === 1) {
        throw new Error('write failed');
      }
    },
  });

  const retry = await prepareAndPersist({
    formState: { ...baseFormState, dose: '5' },
    identity,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
    },
  });

  assert.equal(retry.prepared.type, 'prepared');
  assert.equal(retry.persist?.type, 'success');
  assert.notEqual(eventIds[0], eventIds[1]);
});

test('failure then changed time allocates a new event id from the new time', async () => {
  const identity = createInsulinQuickAddSubmitIdentityState();
  const eventIds = [];
  let attempt = 0;

  await prepareAndPersist({
    formState: baseFormState,
    identity,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
      attempt += 1;
      if (attempt === 1) {
        throw new Error('write failed');
      }
    },
  });

  const retry = await prepareAndPersist({
    formState: { ...baseFormState, time: '08:31' },
    identity,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
    },
  });

  assert.equal(retry.prepared.type, 'prepared');
  assert.equal(retry.persist?.type, 'success');
  assert.notEqual(eventIds[0], eventIds[1]);
  assert.match(eventIds[0] ?? '', /^insulin-0830-/);
  assert.match(eventIds[1] ?? '', /^insulin-0831-/);
});

test('failure then changed preparation allocates a new event id', async () => {
  const identity = createInsulinQuickAddSubmitIdentityState();
  const eventIds = [];
  let attempt = 0;

  await prepareAndPersist({
    formState: baseFormState,
    identity,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
      attempt += 1;
      if (attempt === 1) {
        throw new Error('write failed');
      }
    },
  });

  const retry = await prepareAndPersist({
    formState: {
      ...baseFormState,
      preparationId: 'insulin.prep.glargine_lantus',
    },
    identity,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
    },
  });

  assert.equal(retry.persist?.type, 'success');
  assert.notEqual(eventIds[0], eventIds[1]);
});

test('failure then changed administrationContext allocates a new event id', async () => {
  const identity = createInsulinQuickAddSubmitIdentityState();
  const eventIds = [];
  let attempt = 0;

  await prepareAndPersist({
    formState: baseFormState,
    identity,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
      attempt += 1;
      if (attempt === 1) {
        throw new Error('write failed');
      }
    },
  });

  const retry = await prepareAndPersist({
    formState: {
      ...baseFormState,
      administrationContext: 'correction',
    },
    identity,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
    },
  });

  assert.equal(retry.persist?.type, 'success');
  assert.notEqual(eventIds[0], eventIds[1]);
});

test('failure then changed Other name allocates a new event id', async () => {
  const identity = createInsulinQuickAddSubmitIdentityState();
  const eventIds = [];
  let attempt = 0;
  const otherBase = {
    ...baseFormState,
    otherName: 'Pharmacy own-brand insulin',
    preparationId: 'insulin.prep.other',
  };

  await prepareAndPersist({
    formState: otherBase,
    identity,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
      attempt += 1;
      if (attempt === 1) {
        throw new Error('write failed');
      }
    },
  });

  const retry = await prepareAndPersist({
    formState: {
      ...otherBase,
      otherName: 'Different pharmacy insulin',
    },
    identity,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
    },
  });

  assert.equal(retry.persist?.type, 'success');
  assert.notEqual(eventIds[0], eventIds[1]);
});

test('invalid edit after failure does not invoke persistence', async () => {
  const identity = createInsulinQuickAddSubmitIdentityState();
  let submitCount = 0;

  await prepareAndPersist({
    formState: baseFormState,
    identity,
    onSubmit: async () => {
      submitCount += 1;
      throw new Error('write failed');
    },
  });

  const invalid = prepareInsulinQuickAddSubmitWithIdentity({
    formState: { ...baseFormState, dose: 'not-a-number' },
    identity,
    labels,
  });

  assert.equal(invalid.type, 'invalid');
  assert.equal(submitCount, 1);
  assert.notEqual(identity.pendingEventId, null);
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
  assert.equal(identity.pendingRetryPayloadKey, null);
});
