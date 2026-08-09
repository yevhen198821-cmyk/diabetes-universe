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
import { createTimelineSearchFilterModel } from '../../../components/timeline/timeline-search-filter-model.ts';
import { deriveDashboardQuickAddBlocks } from '../../dashboard/dashboard-quick-add-integration-model.ts';
import { createTestTimelinePresentationDependencies } from '../presentation/testing/create-test-timeline-presentation-dependencies.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../platform/integration/tests/integration-dom-setup.mjs';
import { projectSemanticToLegacyRepositoryEvent } from '../temporary-semantic-repository-bridge.ts';
import { TimelineStoreProvider, useTimelineStore } from './timeline-store.tsx';

let presentationDependencies;

test.before(async () => {
  presentationDependencies = await createTestTimelinePresentationDependencies();
});

after(() => {
  teardownIntegrationDom();
});

function createLegacyEvent(id, dateTime, kind = 'glucose', overrides = {}) {
  const defaultsByKind = {
    glucose: { title: 'Глюкоза', value: '6,4 ммоль/л' },
    insulin: { title: 'NovoRapid', value: '4 ЕД' },
  };

  return {
    dateTime,
    id,
    kind,
    source: 'demo',
    ...defaultsByKind[kind],
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

async function mountTimelineStore({ initialEvents, repository } = {}) {
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
        { initialEvents, repository },
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

test('edit flow updates legacy repository mirror and refreshes semantic store', async () => {
  const glucoseEarly = createLegacyEvent(
    'glucose-0800',
    '2026-08-02T05:00:00.000Z',
  );
  const glucoseLatest = createLegacyEvent(
    'glucose-1015',
    '2026-08-02T07:15:00.000Z',
    'glucose',
    { context: 'После завтрака', value: '7,3 ммоль/л' },
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

    const legacyProjection = projectSemanticToLegacyRepositoryEvent(
      semanticBefore,
      presentationDependencies,
    );
    const draft = {
      ...createTimelineEventEditDraft(legacyProjection),
      value: '9.1',
      time: '23:58',
    };
    const editResult = updateTimelineEventFromDraft(legacyProjection, draft);

    assert.equal(editResult.event?.value, '9,1 ммоль/л');
    assert.deepEqual(editResult.errors, {});

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
    const repositoryLegacy = repository
      .getSnapshot()
      .events.find((event) => event.id === 'glucose-1015');

    assertSemanticEventShape(semanticAfter);
    assert.equal(semanticAfter?.concentrationMmolPerL, 9.1);
    assert.equal(semanticAfter?.occurredAt, '2026-08-02T23:58:00.000Z');
    assert.equal(repositoryLegacy?.value, '9,1 ммоль/л');
    assert.equal(
      Object.hasOwn(repositoryLegacy, 'concentrationMmolPerL'),
      false,
    );
  } finally {
    await mounted.unmount();
  }
});

test('dashboard and timeline consumers receive semantic events after edit flow', async () => {
  const glucoseLatest = createLegacyEvent(
    'glucose-1015',
    '2026-08-02T07:15:00.000Z',
    'glucose',
    { context: 'После завтрака', value: '7,3 ммоль/л' },
  );
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseLatest],
  });
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

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
        filter: 'glucose',
        query: '',
      },
      presentationDependencies,
    );

    assert.equal(dashboardBlocks.lastGlucose?.value, '8.2 mmol/L');
    assert.equal(dashboardBlocks.lastGlucose?.dateTime, glucoseLatest.dateTime);
    assert.equal(timelineFilter.filteredEvents.length, 1);
    assert.equal(timelineFilter.filteredEvents[0]?.concentrationMmolPerL, 8.2);
    assertSemanticEventShape(timelineFilter.filteredEvents[0]);
  } finally {
    await mounted.unmount();
  }
});

test('edit flow keeps migration sidecar aligned with semantic events', async () => {
  const insulinLegacy = createLegacyEvent(
    'insulin-0805',
    '2026-08-02T05:05:00.000Z',
    'insulin',
    { context: 'Перед едой' },
  );
  const repository = createInMemoryTimelineRepository({
    seedEvents: [insulinLegacy],
  });
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    assert.equal(mounted.currentStore.diagnostics.migrationRecordCount, 1);

    const semanticBefore = mounted.currentStore.events[0];
    const legacyProjection = projectSemanticToLegacyRepositoryEvent(
      semanticBefore,
      presentationDependencies,
    );
    const editResult = updateTimelineEventFromDraft(legacyProjection, {
      ...createTimelineEventEditDraft(legacyProjection),
      value: '6',
    });

    await act(async () => {
      mounted.currentStore.updateEvent(editResult.event);
    });
    await waitFor(() => {
      const updated = mounted.currentStore.events[0];

      return updated?.kind === 'insulin' && updated.doseUnits === 6;
    }, 'semantic insulin refresh');

    assert.equal(mounted.currentStore.diagnostics.migrationRecordCount, 1);
    assert.equal(mounted.currentStore.diagnostics.quarantinedCount, 0);
    assert.equal(
      mounted.currentStore.getMigrationRecord('insulin-0805')?.eventId,
      'insulin-0805',
    );
    assert.equal(mounted.currentStore.events[0]?.doseUnits, 6);
    assert.equal(repository.getSnapshot().events[0]?.value, '6 ЕД');
  } finally {
    await mounted.unmount();
  }
});
