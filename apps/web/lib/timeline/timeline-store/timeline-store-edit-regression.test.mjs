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
  updateTimelineEventFromDraft,
} from '../../../components/timeline/timeline-event-detail-model.ts';
import { createTestTimelineInsulinEditCopy } from '../../../components/timeline/testing/create-test-timeline-insulin-edit-copy.ts';
import { createTimelineSearchFilterModel } from '../../../components/timeline/timeline-search-filter-model.ts';
import { createTestTimelineFilterOptions } from '../testing/create-test-timeline-filter-options.ts';
import { deriveDashboardQuickAddBlocks } from '../../dashboard/dashboard-quick-add-integration-model.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../platform/integration/tests/integration-dom-setup.mjs';
import { semanticInsulinLater } from './testing/timeline-store-test-fixtures.mjs';
import { getTestTimelinePresentationDependencies } from './testing/timeline-store-test-fixtures.mjs';
import { TimelineStoreProvider, useTimelineStore } from './timeline-store.tsx';

let presentationDependencies;

test.before(async () => {
  presentationDependencies = await getTestTimelinePresentationDependencies();
});

after(() => {
  teardownIntegrationDom();
});

function createSemanticGlucoseEvent(id, occurredAt, overrides = {}) {
  return {
    concentrationMmolPerL: 6.4,
    createdAt: '2026-08-09T08:30:00.000Z',
    id,
    kind: 'glucose',
    occurredAt,
    schemaVersion: 1,
    source: 'demo',
    updatedAt: '2026-08-09T08:30:00.000Z',
    ...overrides,
  };
}

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
      'data-event-ids': store.events.map((event) => event.id).join(','),
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

function assertSemanticEventShape(event) {
  assert.equal(Object.hasOwn(event, 'title'), false);
  assert.equal(Object.hasOwn(event, 'value'), false);
  assert.equal(Object.hasOwn(event, 'dateTime'), false);
  assert.equal(typeof event.occurredAt, 'string');
  assert.equal(event.schemaVersion, 1);
}

test('edit flow updates semantic repository and refreshes semantic store', async () => {
  const glucoseEarly = createSemanticGlucoseEvent(
    'glucose-0800',
    '2026-08-02T05:00:00.000Z',
  );
  const glucoseLatest = createSemanticGlucoseEvent(
    'glucose-1015',
    '2026-08-02T07:15:00.000Z',
    { concentrationMmolPerL: 7.3, context: 'after_meal' },
  );
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseEarly, glucoseLatest],
  });
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    const semanticBefore = mounted.currentStore.events.find(
      (event) => event.id === 'glucose-1015',
    );

    assert.equal(semanticBefore?.kind, 'glucose');
    assert.equal(semanticBefore?.concentrationMmolPerL, 7.3);

    const draft = {
      ...createTimelineSemanticEventEditDraft(semanticBefore),
      value: '9.1',
      time: '23:58',
    };
    const editResult = updateSemanticTimelineEventFromDraft(
      semanticBefore,
      draft,
    );

    assert.deepEqual(editResult.errors, {});
    assert.equal(editResult.event?.concentrationMmolPerL, 9.1);

    await act(async () => {
      mounted.currentStore.updateEvent(editResult.event);
    });
    await waitFor(() => {
      const updated = mounted.currentStore.events.find(
        (event) => event.id === 'glucose-1015',
      );

      return (
        updated?.kind === 'glucose' && updated.concentrationMmolPerL === 9.1
      );
    }, 'semantic glucose refresh');

    const semanticAfter = mounted.currentStore.events.find(
      (event) => event.id === 'glucose-1015',
    );
    const repositorySemantic = repository
      .getSnapshot()
      .events.find((event) => event.id === 'glucose-1015');

    assertSemanticEventShape(semanticAfter);
    assert.equal(semanticAfter?.concentrationMmolPerL, 9.1);
    assert.equal(semanticAfter?.occurredAt, '2026-08-02T23:58:00.000Z');
    assert.equal(repositorySemantic?.concentrationMmolPerL, 9.1);
    assert.equal(repositorySemantic?.occurredAt, '2026-08-02T23:58:00.000Z');
  } finally {
    await mounted.unmount();
  }
});

test('dashboard and timeline consumers receive semantic events after edit flow', async () => {
  const glucoseLatest = createSemanticGlucoseEvent(
    'glucose-1015',
    '2026-08-02T07:15:00.000Z',
    { concentrationMmolPerL: 7.3, context: 'after_meal' },
  );
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseLatest],
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
    await waitFor(() => {
      const updated = mounted.currentStore.events[0];

      return (
        updated?.kind === 'glucose' && updated.concentrationMmolPerL === 8.2
      );
    }, 'semantic glucose refresh');

    const semanticEvents = mounted.currentStore.events;
    const dashboardBlocks = deriveDashboardQuickAddBlocks(
      { events: semanticEvents },
      {
        formatDaySummaryDisplayDate: () => 'Sunday, 2 August 2026',
        formatLastGlucoseDisplayTime: () => '07:15',
        referenceTime: new Date('2026-08-02T10:00:00.000Z'),
        timeZone: 'UTC',
        presentationDependencies,
      },
    );
    const timelineFilter = createTimelineSearchFilterModel(
      semanticEvents,
      {
        dateFilter: { preset: '30days' },
        filter: 'glucose',
        query: '',
      },
      presentationDependencies,
      createTestTimelineFilterOptions({
        referenceDate: new Date('2026-08-02T10:00:00.000Z'),
        timeZone: 'UTC',
      }),
    );

    assert.equal(dashboardBlocks.lastGlucose?.event.concentrationMmolPerL, 8.2);
    assert.equal(
      dashboardBlocks.lastGlucose?.event.occurredAt,
      glucoseLatest.occurredAt,
    );
    assert.equal(timelineFilter.filteredEvents.length, 1);
    assert.equal(timelineFilter.filteredEvents[0]?.concentrationMmolPerL, 8.2);
    assertSemanticEventShape(timelineFilter.filteredEvents[0]);
  } finally {
    await mounted.unmount();
  }
});

test('edit flow keeps zero migration diagnostics for semantic repository events', async () => {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [semanticInsulinLater],
  });
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    assert.equal(mounted.currentStore.diagnostics.migrationRecordCount, 0);

    const semanticBefore = mounted.currentStore.events[0];
    const draft = createTimelineSemanticEventEditDraft(semanticBefore);
    const editResult = updateTimelineEventFromDraft({
      copy: await createTestTimelineInsulinEditCopy(),
      draft: {
        ...draft,
        insulin: { ...draft.insulin, dose: '6', doseEdited: true },
      },
      event: semanticBefore,
    });

    await act(async () => {
      mounted.currentStore.updateEvent(editResult.event);
    });
    await waitFor(() => {
      const updated = mounted.currentStore.events[0];

      return updated?.kind === 'insulin' && updated.doseUnits === 6;
    }, 'semantic insulin refresh');

    assert.equal(mounted.currentStore.diagnostics.migrationRecordCount, 0);
    assert.equal(mounted.currentStore.diagnostics.quarantinedCount, 0);
    assert.equal(mounted.currentStore.events[0]?.doseUnits, 6);
    assert.equal(repository.getSnapshot().events[0]?.doseUnits, 6);
  } finally {
    await mounted.unmount();
  }
});
