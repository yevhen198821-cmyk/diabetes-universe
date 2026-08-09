import assert from 'node:assert/strict';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import { createInMemoryTimelineRepository } from '@diabetes-universe/timeline';

import {
  createTimelineSemanticEventEditDraft,
  updateSemanticTimelineEventFromDraft,
} from '../../../components/timeline/timeline-event-detail-model.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../platform/integration/tests/integration-dom-setup.mjs';
import {
  semanticGlucoseEarly,
  semanticInsulinLater,
} from './testing/timeline-store-test-fixtures.mjs';
import { TimelineStoreProvider, useTimelineStore } from './timeline-store.tsx';

after(() => {
  teardownIntegrationDom();
});

const semanticGlucoseC = {
  concentrationMmolPerL: 7.1,
  context: 'after_meal',
  createdAt: '2026-08-09T09:00:00.000Z',
  id: 'glucose-c',
  kind: 'glucose',
  occurredAt: '2026-08-02T06:00:00.000Z',
  schemaVersion: 1,
  source: 'manual',
  updatedAt: '2026-08-09T09:00:00.000Z',
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

test('routine store initialize does not record migration evidence', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [semanticGlucoseEarly, semanticInsulinLater],
  });
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    assert.equal(
      mounted.currentStore.getMigrationRecord('glucose-0800'),
      undefined,
    );
    assert.equal(
      mounted.currentStore.getMigrationRecord('insulin-0805'),
      undefined,
    );
    assert.equal(mounted.currentStore.diagnostics.migrationRecordCount, 0);
    assert.equal(mounted.currentStore.diagnostics.quarantinedCount, 0);
  } finally {
    await mounted.unmount();
  }
});

test('routine store update does not create migration evidence', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [semanticGlucoseEarly, semanticInsulinLater],
  });
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    const semanticGlucoseA = mounted.currentStore.events.find(
      (event) => event.id === 'glucose-0800',
    );

    await act(async () => {
      mounted.currentStore.updateEvent({
        ...semanticGlucoseA,
        concentrationMmolPerL: 7,
        updatedAt: '2026-08-09T09:00:00.000Z',
      });
    });
    await waitFor(
      () =>
        mounted.currentStore.events.find((event) => event.id === 'glucose-0800')
          ?.concentrationMmolPerL === 7,
      'semantic glucose refresh',
    );

    assert.equal(
      mounted.currentStore.getMigrationRecord('glucose-0800'),
      undefined,
    );
    assert.equal(mounted.currentStore.diagnostics.migrationRecordCount, 0);
  } finally {
    await mounted.unmount();
  }
});

test('routine store native semantic add does not create migration evidence', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [semanticGlucoseEarly, semanticInsulinLater],
  });
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    await act(async () => {
      mounted.currentStore.addEvent(semanticGlucoseC);
    });
    await waitFor(
      () =>
        mounted.currentStore.events.some((event) => event.id === 'glucose-c'),
      'added glucose event',
    );

    assert.equal(
      mounted.currentStore.getMigrationRecord('glucose-c'),
      undefined,
    );
    assert.equal(mounted.currentStore.diagnostics.migrationRecordCount, 0);
  } finally {
    await mounted.unmount();
  }
});

test('routine store delete does not leave migration evidence', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [semanticGlucoseEarly, semanticInsulinLater],
  });
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    await act(async () => {
      mounted.currentStore.deleteEvent('glucose-0800');
    });
    await waitFor(
      () =>
        !mounted.currentStore.events.some(
          (event) => event.id === 'glucose-0800',
        ),
      'deleted glucose event',
    );

    assert.equal(
      mounted.currentStore.getMigrationRecord('glucose-0800'),
      undefined,
    );
    assert.equal(mounted.currentStore.diagnostics.migrationRecordCount, 0);
  } finally {
    await mounted.unmount();
  }
});

test('routine store edit flow does not create migration evidence', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [semanticGlucoseEarly],
  });
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    const semanticBefore = mounted.currentStore.events[0];
    const editResult = updateSemanticTimelineEventFromDraft(semanticBefore, {
      ...createTimelineSemanticEventEditDraft(semanticBefore),
      value: '8.2',
    });

    await act(async () => {
      mounted.currentStore.updateEvent(editResult.event);
    });
    await waitFor(
      () => mounted.currentStore.events[0]?.concentrationMmolPerL === 8.2,
      'semantic glucose refresh',
    );

    assert.equal(
      mounted.currentStore.getMigrationRecord('glucose-0800'),
      undefined,
    );
    assert.equal(mounted.currentStore.diagnostics.migrationRecordCount, 0);
  } finally {
    await mounted.unmount();
  }
});
