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

import { createSemanticGlucoseTimelineEvent } from '../semantic-creators/create-semantic-glucose-timeline-event.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../platform/integration/tests/integration-dom-setup.mjs';
import { projectSemanticEventForRepositoryWrite } from '../timeline-semantic-write.ts';
import { getTestTimelinePresentationDependencies } from './testing/timeline-store-test-fixtures.mjs';
import { TimelineStoreProvider, useTimelineStore } from './timeline-store.tsx';

let presentationDependencies;

test.before(async () => {
  presentationDependencies = await getTestTimelinePresentationDependencies();
});

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
        { presentationDependencies, repository },
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
    assert.equal(
      mounted.currentStore.getMigrationRecord(semanticEvent.id),
      undefined,
    );
    assert.equal(mounted.currentStore.diagnostics.migrationRecordCount, 0);
    assert.equal(mounted.currentStore.diagnostics.quarantinedCount, 0);
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

test('semantic store projects legacy repository payload at write boundary only', () => {
  const semanticEvent = createSemanticGlucoseTimelineEvent(
    {
      context: 'Натощак',
      time: '08:00',
      valueMmol: 6.1,
    },
    { clock: fixedClock },
  );
  const legacy = projectSemanticEventForRepositoryWrite(
    semanticEvent,
    presentationDependencies,
  );

  assert.equal(legacy.kind, 'glucose');
  assert.equal(typeof legacy.value, 'string');
  assert.equal(Object.hasOwn(legacy, 'concentrationMmolPerL'), false);
});
