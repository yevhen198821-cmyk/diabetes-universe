import assert from 'node:assert/strict';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import { createInMemoryTimelineRepository } from '@diabetes-universe/timeline';

import {
  createTimelineEventEditDraft,
  updateTimelineEventFromDraft,
} from '../../../components/timeline/timeline-event-detail-model.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../platform/integration/tests/integration-dom-setup.mjs';
import { projectSemanticToLegacyRepositoryEvent } from '../temporary-semantic-repository-bridge.ts';
import { createTestTimelinePresentationDependencies } from '../presentation/testing/create-test-timeline-presentation-dependencies.ts';
import { TimelineStoreProvider, useTimelineStore } from './timeline-store.tsx';

let presentationDependencies;

test.before(async () => {
  presentationDependencies = await createTestTimelinePresentationDependencies();
});

after(() => {
  teardownIntegrationDom();
});

const glucoseA = {
  context: 'Перед завтраком',
  dateTime: '2026-08-02T05:00:00.000Z',
  id: 'glucose-a',
  kind: 'glucose',
  source: 'demo',
  title: 'Глюкоза',
  value: '6,4 ммоль/л',
};

const insulinB = {
  context: 'Перед едой',
  dateTime: '2026-08-02T05:05:00.000Z',
  id: 'insulin-b',
  kind: 'insulin',
  source: 'demo',
  title: 'NovoRapid',
  value: '4 ЕД',
};

const glucoseC = {
  context: 'После еды',
  dateTime: '2026-08-02T06:00:00.000Z',
  id: 'glucose-c',
  kind: 'glucose',
  source: 'demo',
  title: 'Глюкоза',
  value: '7,1 ммоль/л',
};

async function flushAsyncWork() {
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });
}

async function waitFor(predicate, description, maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (predicate()) {
      return;
    }

    await flushAsyncWork();
  }

  throw new Error(`Timed out waiting for ${description}`);
}

async function mountTimelineStore({ repository } = {}) {
  setupIntegrationDom();

  let currentStore;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  function StoreProbe() {
    const store = useTimelineStore();
    currentStore = store;

    return createElement('div', {
      'data-status': store.status,
      'data-testid': 'timeline-store-probe',
    });
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
      if (!currentStore) {
        throw new Error('Timeline store was not rendered.');
      }

      return currentStore;
    },
    async unmount() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
      teardownIntegrationDom();
    },
  };
}

test('store initialize records stable migration evidence for seeded events', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseA, insulinB],
  });
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    const recordA = mounted.currentStore.getMigrationRecord('glucose-a');
    const recordB = mounted.currentStore.getMigrationRecord('insulin-b');

    assert.ok(recordA?.migratedAt);
    assert.ok(recordB?.migratedAt);
    assert.equal(recordA?.preservedLegacy.value, '6,4 ммоль/л');
    assert.equal(recordB?.preservedLegacy.value, '4 ЕД');
  } finally {
    await mounted.unmount();
  }
});

test('store update keeps migration evidence for unchanged events', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseA, insulinB],
  });
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    const recordABefore = structuredClone(
      mounted.currentStore.getMigrationRecord('glucose-a'),
    );
    const recordBBefore = structuredClone(
      mounted.currentStore.getMigrationRecord('insulin-b'),
    );

    await act(async () => {
      mounted.currentStore.updateEvent({
        ...glucoseA,
        value: '7,0 ммоль/л',
      });
    });
    await waitFor(
      () =>
        mounted.currentStore.events.find((event) => event.id === 'glucose-a')
          ?.concentrationMmolPerL === 7,
      'semantic glucose refresh',
    );

    assert.deepEqual(
      mounted.currentStore.getMigrationRecord('glucose-a'),
      recordABefore,
    );
    assert.deepEqual(
      mounted.currentStore.getMigrationRecord('insulin-b'),
      recordBBefore,
    );
  } finally {
    await mounted.unmount();
  }
});

test('store add preserves existing migration evidence and records only the new event', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseA, insulinB],
  });
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    const recordABefore = structuredClone(
      mounted.currentStore.getMigrationRecord('glucose-a'),
    );
    const recordBBefore = structuredClone(
      mounted.currentStore.getMigrationRecord('insulin-b'),
    );

    await act(async () => {
      mounted.currentStore.addEvent(glucoseC);
    });
    await waitFor(
      () =>
        mounted.currentStore.events.some((event) => event.id === 'glucose-c'),
      'added glucose event',
    );

    const recordC = mounted.currentStore.getMigrationRecord('glucose-c');

    assert.deepEqual(
      mounted.currentStore.getMigrationRecord('glucose-a'),
      recordABefore,
    );
    assert.deepEqual(
      mounted.currentStore.getMigrationRecord('insulin-b'),
      recordBBefore,
    );
    assert.ok(recordC?.migratedAt);
    assert.notEqual(recordC?.migratedAt, recordABefore?.migratedAt);
  } finally {
    await mounted.unmount();
  }
});

test('store delete removes only deleted migration evidence', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseA, insulinB],
  });
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    const recordBBefore = structuredClone(
      mounted.currentStore.getMigrationRecord('insulin-b'),
    );

    await act(async () => {
      mounted.currentStore.deleteEvent('glucose-a');
    });
    await waitFor(
      () =>
        !mounted.currentStore.events.some((event) => event.id === 'glucose-a'),
      'deleted glucose event',
    );

    assert.equal(
      mounted.currentStore.getMigrationRecord('glucose-a'),
      undefined,
    );
    assert.deepEqual(
      mounted.currentStore.getMigrationRecord('insulin-b'),
      recordBBefore,
    );
  } finally {
    await mounted.unmount();
  }
});

test('store compatibility edit does not restamp migration evidence', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseA],
  });
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    const recordBefore = structuredClone(
      mounted.currentStore.getMigrationRecord('glucose-a'),
    );
    const semanticBefore = mounted.currentStore.events[0];
    const legacyProjection = projectSemanticToLegacyRepositoryEvent(
      semanticBefore,
      presentationDependencies,
    );
    const editResult = updateTimelineEventFromDraft(legacyProjection, {
      ...createTimelineEventEditDraft(legacyProjection),
      value: '8.2',
    });

    await act(async () => {
      mounted.currentStore.updateEvent(editResult.event);
    });
    await waitFor(
      () => mounted.currentStore.events[0]?.concentrationMmolPerL === 8.2,
      'semantic glucose refresh',
    );

    assert.deepEqual(
      mounted.currentStore.getMigrationRecord('glucose-a'),
      recordBefore,
    );
  } finally {
    await mounted.unmount();
  }
});
