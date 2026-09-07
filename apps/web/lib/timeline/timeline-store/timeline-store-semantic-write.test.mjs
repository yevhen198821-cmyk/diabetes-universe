import assert from 'node:assert/strict';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import {
  TimelineRepositoryError,
  createInMemoryTimelineRepository,
} from '@diabetes-universe/timeline';

import { createSemanticActivityTimelineEvent } from '../semantic-creators/create-semantic-activity-timeline-event.ts';
import { createSemanticGlucoseTimelineEvent } from '../semantic-creators/create-semantic-glucose-timeline-event.ts';
import { createSemanticInsulinTimelineEvent } from '../semantic-creators/create-semantic-insulin-timeline-event.ts';
import { createSemanticMedicationTimelineEvent } from '../semantic-creators/create-semantic-medication-timeline-event.ts';
import { createSemanticNoteTimelineEvent } from '../semantic-creators/create-semantic-note-timeline-event.ts';
import { createSemanticNutritionTimelineEvent } from '../semantic-creators/create-semantic-nutrition-timeline-event.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../platform/integration/tests/integration-dom-setup.mjs';
import { TimelineStoreProvider, useTimelineStore } from './timeline-store.tsx';

after(() => {
  teardownIntegrationDom();
});

const fixedClock = {
  now: () => new Date('2026-08-02T10:15:00.000Z'),
};

async function mountTimelineStore({ repository } = {}) {
  setupIntegrationDom();

  let currentStore;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  function StoreProbe() {
    currentStore = useTimelineStore();

    return createElement('div');
  }

  await act(async () => {
    root.render(
      createElement(
        TimelineStoreProvider,
        { repository },
        createElement(StoreProbe),
      ),
    );
  });

  return {
    get currentStore() {
      return currentStore;
    },
    async unmount() {
      await act(async () => root.unmount());
      container.remove();
      teardownIntegrationDom();
    },
  };
}

test('native semantic add does not create migration evidence', async () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });
  const mounted = await mountTimelineStore({ repository });

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const semanticEvent = createSemanticGlucoseTimelineEvent(
      {
        context: 'Натощак',
        time: '08:00',
        valueMmol: 6.1,
      },
      { clock: fixedClock },
    );

    await act(async () => {
      mounted.currentStore.addEvent(semanticEvent);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    assert.equal(mounted.currentStore.events.length, 1);
    assert.equal(mounted.currentStore.diagnostics.migrationRecordCount, 0);
    assert.equal(mounted.currentStore.diagnostics.quarantinedCount, 0);

    const repositoryEvent = repository
      .getSnapshot()
      .events.find((event) => event.id === semanticEvent.id);

    assert.equal(repositoryEvent?.kind, 'glucose');
    assert.equal(repositoryEvent?.concentrationMmolPerL, 6.1);
    assert.equal(Object.hasOwn(repositoryEvent ?? {}, 'value'), false);
  } finally {
    await mounted.unmount();
  }
});

test('repository failure does not commit native semantic mutation', async () => {
  const repository = {
    addCalls: 0,
    async initialize() {},
    getSnapshot() {
      return { events: [] };
    },
    async queryEvents() {
      return { events: [] };
    },
    async addEvent() {
      this.addCalls += 1;
      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
    },
    async updateEvent() {
      return { status: 'not-found' };
    },
    async deleteEvent() {
      return { status: 'not-found' };
    },
    async replaceEvents() {
      return { status: 'applied' };
    },
  };
  const mounted = await mountTimelineStore({ repository });

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const semanticEvent = createSemanticGlucoseTimelineEvent(
      {
        context: 'Натощак',
        time: '08:00',
        valueMmol: 6.1,
      },
      { clock: fixedClock },
    );

    await act(async () => {
      mounted.currentStore.addEvent(semanticEvent);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    assert.equal(repository.addCalls, 1);
    assert.equal(mounted.currentStore.events.length, 0);
    assert.equal(mounted.currentStore.status, 'error');
  } finally {
    await mounted.unmount();
  }
});

test('addEventAsync resolves after applied and rejects on repository failure', async () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });
  const mounted = await mountTimelineStore({ repository });
  let failingMounted;

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const semanticEvent = createSemanticGlucoseTimelineEvent(
      {
        time: '08:00',
        valueMmol: 6.1,
      },
      { clock: fixedClock },
    );

    await act(async () => {
      await mounted.currentStore.addEventAsync(semanticEvent);
    });

    assert.equal(mounted.currentStore.events.length, 1);

    const failingRepository = {
      addCalls: 0,
      async initialize() {},
      getSnapshot() {
        return { events: [] };
      },
      async queryEvents() {
        return { events: [] };
      },
      async addEvent() {
        this.addCalls += 1;
        throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
      },
      async updateEvent() {
        return { status: 'not-found' };
      },
      async deleteEvent() {
        return { status: 'not-found' };
      },
      async replaceEvents() {
        return { status: 'applied' };
      },
    };
    failingMounted = await mountTimelineStore({
      repository: failingRepository,
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await assert.rejects(
        failingMounted.currentStore.addEventAsync(semanticEvent),
        (error) =>
          error instanceof TimelineRepositoryError &&
          error.code === 'TIMELINE_REPOSITORY_WRITE_FAILED',
      );
    });

    assert.equal(failingRepository.addCalls, 1);
    assert.equal(failingMounted.currentStore.events.length, 0);
  } finally {
    await mounted.unmount();
  }
});

test('retry with stable event id creates exactly one stored glucose event', async () => {
  let addCalls = 0;
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });
  const originalAddEvent = repository.addEvent.bind(repository);
  const mounted = await mountTimelineStore({ repository });

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const semanticEvent = createSemanticGlucoseTimelineEvent(
      {
        time: '08:30',
        valueMmol: 5.9,
      },
      { clock: fixedClock, id: 'glucose-0830-retry-id' },
    );

    repository.addEvent = async (event) => {
      addCalls += 1;

      if (addCalls === 1) {
        throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
      }

      return originalAddEvent(event);
    };

    await act(async () => {
      await assert.rejects(mounted.currentStore.addEventAsync(semanticEvent));
    });

    await act(async () => {
      await mounted.currentStore.addEventAsync(semanticEvent);
    });

    assert.equal(addCalls, 2);
    assert.equal(mounted.currentStore.events.length, 1);
    assert.equal(mounted.currentStore.events[0]?.id, 'glucose-0830-retry-id');
    assert.equal(mounted.currentStore.events[0]?.source, 'manual');
  } finally {
    await mounted.unmount();
  }
});

test('retry with stable event id creates exactly one stored insulin event', async () => {
  let addCalls = 0;
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });
  const originalAddEvent = repository.addEvent.bind(repository);
  const mounted = await mountTimelineStore({ repository });

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const semanticEvent = createSemanticInsulinTimelineEvent(
      {
        administrationContext: 'before_meal',
        doseUnits: 4,
        preparation: 'NovoRapid',
        preparationId: 'insulin.prep.aspart_novorapid',
        time: '08:30',
      },
      { clock: fixedClock, id: 'insulin-0830-retry-id' },
    );

    repository.addEvent = async (event) => {
      addCalls += 1;

      if (addCalls === 1) {
        throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
      }

      return originalAddEvent(event);
    };

    await act(async () => {
      await assert.rejects(mounted.currentStore.addEventAsync(semanticEvent));
    });

    await act(async () => {
      await mounted.currentStore.addEventAsync(semanticEvent);
    });

    assert.equal(addCalls, 2);
    assert.equal(mounted.currentStore.events.length, 1);
    assert.equal(mounted.currentStore.events[0]?.id, 'insulin-0830-retry-id');
    assert.equal(
      mounted.currentStore.events[0]?.preparationId,
      'insulin.prep.aspart_novorapid',
    );
    assert.equal(
      mounted.currentStore.events[0]?.administrationContext,
      'before_meal',
    );
    assert.equal(
      Object.hasOwn(mounted.currentStore.events[0] ?? {}, 'context'),
      false,
    );
  } finally {
    await mounted.unmount();
  }
});

test('updateEventAsync resolves after applied and rejects on repository failure', async () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });
  const mounted = await mountTimelineStore({ repository });

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const semanticEvent = createSemanticNutritionTimelineEvent(
      {
        carbohydratesGrams: 12.12,
        mealType: 'breakfast',
        time: '08:00',
      },
      { clock: fixedClock, id: 'nutrition-0800-edit-id' },
    );

    await act(async () => {
      await mounted.currentStore.addEventAsync(semanticEvent);
    });

    const updated = {
      ...semanticEvent,
      carbohydratesGrams: 15,
      mealType: 'lunch',
      updatedAt: '2026-09-06T12:00:00.000Z',
    };

    await act(async () => {
      await mounted.currentStore.updateEventAsync(updated);
    });

    assert.equal(mounted.currentStore.events[0]?.carbohydratesGrams, 15);
    assert.equal(mounted.currentStore.events[0]?.id, 'nutrition-0800-edit-id');

    repository.updateEvent = async () => {
      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
    };

    await act(async () => {
      await assert.rejects(mounted.currentStore.updateEventAsync(updated));
    });
  } finally {
    await mounted.unmount();
  }
});

test('rejected medication add is not durable and retry writes exactly one record', async () => {
  let addCalls = 0;
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });
  const originalAddEvent = repository.addEvent.bind(repository);
  const mounted = await mountTimelineStore({ repository });

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const semanticEvent = createSemanticMedicationTimelineEvent(
      {
        dose: 500,
        medication: { id: 'metformin', name: 'Метформин' },
        time: '08:15',
        unit: 'мг',
      },
      { clock: fixedClock, id: 'medication-0815-retry-id' },
    );

    repository.addEvent = async (event) => {
      addCalls += 1;

      if (addCalls === 1) {
        throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
      }

      return originalAddEvent(event);
    };

    await act(async () => {
      await assert.rejects(mounted.currentStore.addEventAsync(semanticEvent));
    });

    assert.equal(mounted.currentStore.events.length, 0);
    assert.equal(repository.getSnapshot().events.length, 0);

    await act(async () => {
      await mounted.currentStore.addEventAsync(semanticEvent);
    });

    assert.equal(addCalls, 2);
    assert.equal(mounted.currentStore.events.length, 1);
    assert.equal(
      mounted.currentStore.events[0]?.id,
      'medication-0815-retry-id',
    );
  } finally {
    await mounted.unmount();
  }
});

test('rejected activity add is not durable and retry writes exactly one record', async () => {
  let addCalls = 0;
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });
  const originalAddEvent = repository.addEvent.bind(repository);
  const mounted = await mountTimelineStore({ repository });

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const semanticEvent = createSemanticActivityTimelineEvent(
      {
        activityType: 'Ходьба',
        durationMinutes: 30,
        time: '09:00',
      },
      { clock: fixedClock, id: 'activity-0900-retry-id' },
    );

    repository.addEvent = async (event) => {
      addCalls += 1;

      if (addCalls === 1) {
        throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
      }

      return originalAddEvent(event);
    };

    await act(async () => {
      await assert.rejects(mounted.currentStore.addEventAsync(semanticEvent));
    });

    await act(async () => {
      await mounted.currentStore.addEventAsync(semanticEvent);
    });

    assert.equal(addCalls, 2);
    assert.equal(mounted.currentStore.events.length, 1);
    assert.equal(mounted.currentStore.events[0]?.id, 'activity-0900-retry-id');
  } finally {
    await mounted.unmount();
  }
});

test('rejected note add is not durable and retry writes exactly one record', async () => {
  let addCalls = 0;
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });
  const originalAddEvent = repository.addEvent.bind(repository);
  const mounted = await mountTimelineStore({ repository });

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const semanticEvent = createSemanticNoteTimelineEvent(
      {
        text: 'Самочувствие нормальное',
        time: '10:00',
        title: 'Утро',
      },
      { clock: fixedClock, id: 'note-1000-retry-id' },
    );

    repository.addEvent = async (event) => {
      addCalls += 1;

      if (addCalls === 1) {
        throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
      }

      return originalAddEvent(event);
    };

    await act(async () => {
      await assert.rejects(mounted.currentStore.addEventAsync(semanticEvent));
    });

    await act(async () => {
      await mounted.currentStore.addEventAsync(semanticEvent);
    });

    assert.equal(addCalls, 2);
    assert.equal(mounted.currentStore.events.length, 1);
    assert.equal(mounted.currentStore.events[0]?.id, 'note-1000-retry-id');
  } finally {
    await mounted.unmount();
  }
});

test('rejected glucose edit leaves the original durable record unchanged', async () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });
  const mounted = await mountTimelineStore({ repository });

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const original = createSemanticGlucoseTimelineEvent(
      { time: '08:00', valueMmol: 6.4 },
      { clock: fixedClock, id: 'glucose-0800-edit-id' },
    );

    await act(async () => {
      await mounted.currentStore.addEventAsync(original);
    });

    const originalAddEvent = repository.updateEvent.bind(repository);
    repository.updateEvent = async () => {
      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
    };

    await act(async () => {
      await assert.rejects(
        mounted.currentStore.updateEventAsync({
          ...original,
          concentrationMmolPerL: 7.2,
          updatedAt: '2026-09-07T12:00:00.000Z',
        }),
      );
    });

    assert.equal(mounted.currentStore.events[0]?.concentrationMmolPerL, 6.4);
    assert.equal(
      repository.getSnapshot().events[0]?.concentrationMmolPerL,
      6.4,
    );

    repository.updateEvent = originalAddEvent;

    await act(async () => {
      await mounted.currentStore.updateEventAsync({
        ...original,
        concentrationMmolPerL: 7.2,
        updatedAt: '2026-09-07T12:00:00.000Z',
      });
    });

    assert.equal(mounted.currentStore.events[0]?.id, 'glucose-0800-edit-id');
    assert.equal(mounted.currentStore.events[0]?.concentrationMmolPerL, 7.2);
    assert.equal(repository.getSnapshot().events.length, 1);
  } finally {
    await mounted.unmount();
  }
});

test('rejected insulin edit leaves the original durable record unchanged', async () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });
  const mounted = await mountTimelineStore({ repository });

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const original = createSemanticInsulinTimelineEvent(
      {
        administrationContext: 'before_meal',
        doseUnits: 4,
        preparation: 'NovoRapid',
        preparationId: 'insulin.prep.aspart_novorapid',
        time: '08:05',
      },
      { clock: fixedClock, id: 'insulin-0805-edit-id' },
    );

    await act(async () => {
      await mounted.currentStore.addEventAsync(original);
    });

    const originalUpdate = repository.updateEvent.bind(repository);
    repository.updateEvent = async () => {
      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
    };

    await act(async () => {
      await assert.rejects(
        mounted.currentStore.updateEventAsync({
          ...original,
          doseUnits: 6,
          updatedAt: '2026-09-07T12:00:00.000Z',
        }),
      );
    });

    assert.equal(mounted.currentStore.events[0]?.doseUnits, 4);
    assert.equal(repository.getSnapshot().events[0]?.doseUnits, 4);

    repository.updateEvent = originalUpdate;

    await act(async () => {
      await mounted.currentStore.updateEventAsync({
        ...original,
        doseUnits: 6,
        updatedAt: '2026-09-07T12:00:00.000Z',
      });
    });

    assert.equal(mounted.currentStore.events[0]?.id, 'insulin-0805-edit-id');
    assert.equal(mounted.currentStore.events[0]?.doseUnits, 6);
    assert.equal(repository.getSnapshot().events.length, 1);
  } finally {
    await mounted.unmount();
  }
});

test('rejected edits for remaining kinds keep one record and retry the same id', async () => {
  const cases = [
    {
      create: () =>
        createSemanticMedicationTimelineEvent(
          {
            dose: 500,
            medication: { id: 'metformin', name: 'Метформин' },
            time: '08:15',
            unit: 'мг',
          },
          { clock: fixedClock, id: 'medication-0815-edit-id' },
        ),
      mutate: (event) => ({ ...event, dose: 850 }),
      read: (event) => event.dose,
      rejected: 500,
      updated: 850,
    },
    {
      create: () =>
        createSemanticActivityTimelineEvent(
          {
            activityType: 'Ходьба',
            durationMinutes: 30,
            time: '09:00',
          },
          { clock: fixedClock, id: 'activity-0900-edit-id' },
        ),
      mutate: (event) => ({ ...event, durationSeconds: 2700 }),
      read: (event) => event.durationSeconds,
      rejected: 1800,
      updated: 2700,
    },
    {
      create: () =>
        createSemanticNoteTimelineEvent(
          {
            text: 'Самочувствие нормальное',
            time: '10:00',
            title: 'Утро',
          },
          { clock: fixedClock, id: 'note-1000-edit-id' },
        ),
      mutate: (event) => ({ ...event, body: 'Обновлённая заметка' }),
      read: (event) => event.body,
      rejected: 'Самочувствие нормальное',
      updated: 'Обновлённая заметка',
    },
  ];

  for (const current of cases) {
    const repository = createInMemoryTimelineRepository({ seedEvents: [] });
    const mounted = await mountTimelineStore({ repository });

    try {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const original = current.create();

      await act(async () => {
        await mounted.currentStore.addEventAsync(original);
      });

      const originalUpdate = repository.updateEvent.bind(repository);
      repository.updateEvent = async () => {
        throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
      };

      await act(async () => {
        await assert.rejects(
          mounted.currentStore.updateEventAsync(current.mutate(original)),
        );
      });

      assert.equal(
        current.read(mounted.currentStore.events[0]),
        current.rejected,
      );
      assert.equal(
        current.read(repository.getSnapshot().events[0]),
        current.rejected,
      );

      repository.updateEvent = originalUpdate;

      await act(async () => {
        await mounted.currentStore.updateEventAsync(current.mutate(original));
      });

      assert.equal(mounted.currentStore.events[0]?.id, original.id);
      assert.equal(
        current.read(mounted.currentStore.events[0]),
        current.updated,
      );
      assert.equal(repository.getSnapshot().events.length, 1);
    } finally {
      await mounted.unmount();
    }
  }
});

test('pending Account A save cannot appear in Account B after store remount', async () => {
  let releaseA = () => {};
  const pendingA = new Promise((resolve) => {
    releaseA = resolve;
  });
  const accountARepository = createInMemoryTimelineRepository({
    seedEvents: [],
  });
  const originalAddA = accountARepository.addEvent.bind(accountARepository);
  accountARepository.addEvent = async (event) => {
    await pendingA;
    return originalAddA(event);
  };
  const accountBRepository = createInMemoryTimelineRepository({
    seedEvents: [],
  });

  const mountedA = await mountTimelineStore({ repository: accountARepository });
  let mountedB;

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const eventA = createSemanticNoteTimelineEvent(
      { text: 'Account A private note', time: '11:00' },
      { clock: fixedClock, id: 'note-a-pending' },
    );

    const addAPromise = mountedA.currentStore.addEventAsync(eventA);

    await mountedA.unmount();

    mountedB = await mountTimelineStore({
      repository: accountBRepository,
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    releaseA();
    await addAPromise.catch(() => {});

    assert.equal(
      accountARepository
        .getSnapshot()
        .events.some((event) => event.id === 'note-a-pending'),
      true,
    );
    assert.equal(mountedB.currentStore.events.length, 0);
    assert.equal(accountBRepository.getSnapshot().events.length, 0);
  } finally {
    if (mountedB) {
      await mountedB.unmount();
    }
  }
});

test('deleteEventAsync resolves after applied and rejects on repository failure', async () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });
  const mounted = await mountTimelineStore({ repository });

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const semanticEvent = createSemanticGlucoseTimelineEvent(
      { time: '08:00', valueMmol: 6.4 },
      { clock: fixedClock, id: 'glucose-0800-delete-id' },
    );

    await act(async () => {
      await mounted.currentStore.addEventAsync(semanticEvent);
    });

    assert.equal(mounted.currentStore.events.length, 1);

    await act(async () => {
      await mounted.currentStore.deleteEventAsync('glucose-0800-delete-id');
    });

    assert.equal(mounted.currentStore.events.length, 0);
    assert.equal(repository.getSnapshot().events.length, 0);

    repository.deleteEvent = async () => {
      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
    };

    await act(async () => {
      await mounted.currentStore.addEventAsync(semanticEvent);
    });

    await act(async () => {
      await assert.rejects(
        mounted.currentStore.deleteEventAsync('glucose-0800-delete-id'),
      );
    });

    assert.equal(mounted.currentStore.events.length, 1);
    assert.equal(repository.getSnapshot().events.length, 1);
  } finally {
    await mounted.unmount();
  }
});

test('deleteEventAsync dispatches remove only after persistence completes', async () => {
  let releaseDelete = () => {};
  const pendingDelete = new Promise((resolve) => {
    releaseDelete = resolve;
  });
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });
  const originalDelete = repository.deleteEvent.bind(repository);
  repository.deleteEvent = async (eventId) => {
    await pendingDelete;
    return originalDelete(eventId);
  };
  const mounted = await mountTimelineStore({ repository });

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const semanticEvent = createSemanticNoteTimelineEvent(
      { text: 'Delete pending note', time: '12:00', title: 'Note' },
      { clock: fixedClock, id: 'note-1200-delete-pending' },
    );

    await act(async () => {
      await mounted.currentStore.addEventAsync(semanticEvent);
    });

    let deletePromise;
    await act(async () => {
      deletePromise = mounted.currentStore.deleteEventAsync(
        'note-1200-delete-pending',
      );
    });

    assert.equal(mounted.currentStore.events.length, 1);

    releaseDelete();
    await act(async () => {
      await deletePromise;
    });

    assert.equal(mounted.currentStore.events.length, 0);
  } finally {
    await mounted.unmount();
  }
});

test('rejected delete leaves the original durable record unchanged and retry removes same id', async () => {
  let deleteCalls = 0;
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });
  const originalDelete = repository.deleteEvent.bind(repository);
  const mounted = await mountTimelineStore({ repository });

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const semanticEvent = createSemanticInsulinTimelineEvent(
      {
        administrationContext: 'before_meal',
        doseUnits: 4,
        preparation: 'NovoRapid',
        preparationId: 'insulin.prep.aspart_novorapid',
        time: '08:05',
      },
      { clock: fixedClock, id: 'insulin-0805-delete-id' },
    );

    await act(async () => {
      await mounted.currentStore.addEventAsync(semanticEvent);
    });

    repository.deleteEvent = async (eventId) => {
      deleteCalls += 1;

      if (deleteCalls === 1) {
        throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
      }

      return originalDelete(eventId);
    };

    await act(async () => {
      await assert.rejects(
        mounted.currentStore.deleteEventAsync('insulin-0805-delete-id'),
      );
    });

    assert.equal(mounted.currentStore.events.length, 1);
    assert.equal(mounted.currentStore.events[0]?.id, 'insulin-0805-delete-id');
    assert.equal(repository.getSnapshot().events.length, 1);

    await act(async () => {
      await mounted.currentStore.deleteEventAsync('insulin-0805-delete-id');
    });

    assert.equal(deleteCalls, 2);
    assert.equal(mounted.currentStore.events.length, 0);
    assert.equal(repository.getSnapshot().events.length, 0);
  } finally {
    await mounted.unmount();
  }
});

test('deleteEventAsync rejects when repository returns a non-applied result', async () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });
  const mounted = await mountTimelineStore({ repository });

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const semanticEvent = createSemanticGlucoseTimelineEvent(
      { time: '08:00', valueMmol: 6.4 },
      { clock: fixedClock, id: 'glucose-0800-delete-reject' },
    );

    await act(async () => {
      await mounted.currentStore.addEventAsync(semanticEvent);
    });

    repository.deleteEvent = async () => ({ status: 'not-found' });

    await act(async () => {
      await assert.rejects(
        mounted.currentStore.deleteEventAsync('glucose-0800-delete-reject'),
      );
    });

    assert.equal(mounted.currentStore.events.length, 1);
    assert.equal(repository.getSnapshot().events.length, 1);
  } finally {
    await mounted.unmount();
  }
});

test('pending Account A delete cannot appear in Account B after store remount', async () => {
  let releaseA = () => {};
  const pendingA = new Promise((resolve) => {
    releaseA = resolve;
  });
  const accountARepository = createInMemoryTimelineRepository({
    seedEvents: [],
  });
  const originalDeleteA = accountARepository.deleteEvent.bind(accountARepository);
  accountARepository.deleteEvent = async (eventId) => {
    await pendingA;
    return originalDeleteA(eventId);
  };
  const accountBRepository = createInMemoryTimelineRepository({
    seedEvents: [],
  });

  const mountedA = await mountTimelineStore({ repository: accountARepository });
  let mountedB;

  try {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const eventA = createSemanticNoteTimelineEvent(
      { text: 'Account A delete target', time: '11:00', title: 'Delete me' },
      { clock: fixedClock, id: 'note-a-delete-pending' },
    );

    await act(async () => {
      await mountedA.currentStore.addEventAsync(eventA);
    });

    const deleteAPromise = mountedA.currentStore.deleteEventAsync(
      'note-a-delete-pending',
    );

    await mountedA.unmount();

    mountedB = await mountTimelineStore({
      repository: accountBRepository,
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    releaseA();
    await deleteAPromise.catch(() => {});

    assert.equal(
      accountARepository
        .getSnapshot()
        .events.some((event) => event.id === 'note-a-delete-pending'),
      false,
    );
    assert.equal(mountedB.currentStore.events.length, 0);
    assert.equal(accountBRepository.getSnapshot().events.length, 0);
  } finally {
    if (mountedB) {
      await mountedB.unmount();
    }
  }
});
