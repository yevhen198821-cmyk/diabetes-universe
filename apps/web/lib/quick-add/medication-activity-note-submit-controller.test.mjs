import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createActivityQuickAddSubmitIdentityState,
  persistPreparedActivityQuickAddSubmit,
  prepareActivityQuickAddSubmitWithIdentity,
} from './activity-quick-add-submit-controller.ts';
import {
  createMedicationQuickAddSubmitIdentityState,
  persistPreparedMedicationQuickAddSubmit,
  prepareMedicationQuickAddSubmitWithIdentity,
} from './medication-quick-add-submit-controller.ts';
import {
  createNoteQuickAddSubmitIdentityState,
  persistPreparedNoteQuickAddSubmit,
  prepareNoteQuickAddSubmitWithIdentity,
} from './note-quick-add-submit-controller.ts';

const medicationForm = {
  context: 'после еды',
  dose: '500',
  medication: { id: 'metformin', name: 'Метформин' },
  note: 'утро',
  time: '08:15',
  unit: 'мг',
};

const activityForm = {
  activityType: 'Ходьба',
  duration: '30',
  note: '',
  time: '09:00',
};

const noteForm = {
  text: 'Самочувствие нормальное',
  time: '10:00',
  title: 'Утро',
};

async function persistMedication(formState, identity, onSubmit) {
  const prepared = prepareMedicationQuickAddSubmitWithIdentity({
    formState,
    identity,
  });

  if (prepared.type === 'invalid') {
    return { persist: null, prepared };
  }

  return {
    persist: await persistPreparedMedicationQuickAddSubmit({
      identity,
      onSubmit,
      request: prepared.request,
    }),
    prepared,
  };
}

async function persistActivity(formState, identity, onSubmit) {
  const prepared = prepareActivityQuickAddSubmitWithIdentity({
    formState,
    identity,
  });

  if (prepared.type === 'invalid') {
    return { persist: null, prepared };
  }

  return {
    persist: await persistPreparedActivityQuickAddSubmit({
      identity,
      onSubmit,
      request: prepared.request,
    }),
    prepared,
  };
}

async function persistNote(formState, identity, onSubmit) {
  const prepared = prepareNoteQuickAddSubmitWithIdentity({
    formState,
    identity,
  });

  if (prepared.type === 'invalid') {
    return { persist: null, prepared };
  }

  return {
    persist: await persistPreparedNoteQuickAddSubmit({
      identity,
      onSubmit,
      request: prepared.request,
    }),
    prepared,
  };
}

test('medication successful durable save uses a stable event id', async () => {
  const identity = createMedicationQuickAddSubmitIdentityState();
  const eventIds = [];
  const result = await persistMedication(
    medicationForm,
    identity,
    async (request) => {
      eventIds.push(request.eventId);
    },
  );

  assert.equal(result.prepared.type, 'prepared');
  assert.equal(result.persist?.type, 'success');
  assert.match(eventIds[0] ?? '', /^medication-0815-/);
  assert.equal(identity.pendingEventId, null);
});

test('medication persistence rejection keeps the form identity for retry', async () => {
  const identity = createMedicationQuickAddSubmitIdentityState();
  const first = await persistMedication(medicationForm, identity, async () => {
    throw new Error('write failed');
  });

  assert.equal(first.persist?.type, 'error');
  assert.equal(identity.pendingEventId, first.prepared.request.eventId);

  const retry = await persistMedication(
    medicationForm,
    identity,
    async () => {},
  );
  assert.equal(retry.persist?.type, 'success');
  assert.equal(retry.prepared.request.eventId, first.prepared.request.eventId);
});

test('medication changed semantic field after failure allocates a new event id', async () => {
  const identity = createMedicationQuickAddSubmitIdentityState();
  const first = await persistMedication(medicationForm, identity, async () => {
    throw new Error('write failed');
  });
  const retry = await persistMedication(
    { ...medicationForm, dose: '850' },
    identity,
    async () => {},
  );

  assert.notEqual(
    retry.prepared.request.eventId,
    first.prepared.request.eventId,
  );
});

test('activity successful durable save and unchanged retry reuse one id', async () => {
  const identity = createActivityQuickAddSubmitIdentityState();
  const first = await persistActivity(activityForm, identity, async () => {
    throw new Error('write failed');
  });
  const retry = await persistActivity(activityForm, identity, async () => {});

  assert.equal(first.persist?.type, 'error');
  assert.equal(retry.persist?.type, 'success');
  assert.equal(retry.prepared.request.eventId, first.prepared.request.eventId);
});

test('activity duration change after failure allocates a new event id', async () => {
  const identity = createActivityQuickAddSubmitIdentityState();
  const first = await persistActivity(activityForm, identity, async () => {
    throw new Error('write failed');
  });
  const retry = await persistActivity(
    { ...activityForm, duration: '45' },
    identity,
    async () => {},
  );

  assert.notEqual(
    retry.prepared.request.eventId,
    first.prepared.request.eventId,
  );
});

test('note successful durable save and unchanged retry reuse one id', async () => {
  const identity = createNoteQuickAddSubmitIdentityState();
  const first = await persistNote(noteForm, identity, async () => {
    throw new Error('write failed');
  });
  const retry = await persistNote(noteForm, identity, async () => {});

  assert.equal(first.persist?.type, 'error');
  assert.equal(retry.persist?.type, 'success');
  assert.equal(retry.prepared.request.eventId, first.prepared.request.eventId);
});

test('note body change after failure allocates a new event id', async () => {
  const identity = createNoteQuickAddSubmitIdentityState();
  const first = await persistNote(noteForm, identity, async () => {
    throw new Error('write failed');
  });
  const retry = await persistNote(
    { ...noteForm, text: 'Другое самочувствие' },
    identity,
    async () => {},
  );

  assert.notEqual(
    retry.prepared.request.eventId,
    first.prepared.request.eventId,
  );
});

test('medication context note and time changes after failure allocate a new event id', async () => {
  const identity = createMedicationQuickAddSubmitIdentityState();
  const first = await persistMedication(medicationForm, identity, async () => {
    throw new Error('write failed');
  });
  const contextRetry = await persistMedication(
    { ...medicationForm, context: 'натощак' },
    identity,
    async () => {
      throw new Error('write failed');
    },
  );
  const noteRetry = await persistMedication(
    { ...medicationForm, context: 'натощак', note: 'вечер' },
    identity,
    async () => {
      throw new Error('write failed');
    },
  );
  const timeRetry = await persistMedication(
    { ...medicationForm, context: 'натощак', note: 'вечер', time: '21:00' },
    identity,
    async () => {},
  );

  assert.notEqual(
    contextRetry.prepared.request.eventId,
    first.prepared.request.eventId,
  );
  assert.notEqual(
    noteRetry.prepared.request.eventId,
    contextRetry.prepared.request.eventId,
  );
  assert.notEqual(
    timeRetry.prepared.request.eventId,
    noteRetry.prepared.request.eventId,
  );
});

test('activity type note and time changes after failure allocate a new event id', async () => {
  const identity = createActivityQuickAddSubmitIdentityState();
  const first = await persistActivity(activityForm, identity, async () => {
    throw new Error('write failed');
  });
  const typeRetry = await persistActivity(
    { ...activityForm, activityType: 'Бег' },
    identity,
    async () => {
      throw new Error('write failed');
    },
  );
  const noteRetry = await persistActivity(
    { ...activityForm, activityType: 'Бег', note: 'парк' },
    identity,
    async () => {
      throw new Error('write failed');
    },
  );
  const timeRetry = await persistActivity(
    { ...activityForm, activityType: 'Бег', note: 'парк', time: '18:30' },
    identity,
    async () => {},
  );

  assert.notEqual(
    typeRetry.prepared.request.eventId,
    first.prepared.request.eventId,
  );
  assert.notEqual(
    noteRetry.prepared.request.eventId,
    typeRetry.prepared.request.eventId,
  );
  assert.notEqual(
    timeRetry.prepared.request.eventId,
    noteRetry.prepared.request.eventId,
  );
});

test('note title and time changes after failure allocate a new event id', async () => {
  const identity = createNoteQuickAddSubmitIdentityState();
  const first = await persistNote(noteForm, identity, async () => {
    throw new Error('write failed');
  });
  const titleRetry = await persistNote(
    { ...noteForm, title: 'Вечер' },
    identity,
    async () => {
      throw new Error('write failed');
    },
  );
  const timeRetry = await persistNote(
    { ...noteForm, title: 'Вечер', time: '21:15' },
    identity,
    async () => {},
  );

  assert.notEqual(
    titleRetry.prepared.request.eventId,
    first.prepared.request.eventId,
  );
  assert.notEqual(
    timeRetry.prepared.request.eventId,
    titleRetry.prepared.request.eventId,
  );
});
