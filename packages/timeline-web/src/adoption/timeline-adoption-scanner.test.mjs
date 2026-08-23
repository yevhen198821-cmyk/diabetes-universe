import assert from 'node:assert/strict';
import test from 'node:test';

import { InMemoryTimelineRepository } from '@diabetes-universe/timeline';

import { scanTimelineForAdoption } from './timeline-adoption-scanner.ts';

test('scanner excludes demo and classifies eligible manual events', async () => {
  const repository = new InMemoryTimelineRepository();
  await repository.initialize();
  await repository.addEvent({
    id: 'evt-demo',
    occurredAt: '2026-08-14T08:00:00.000Z',
    createdAt: '2026-08-14T08:00:00.000Z',
    updatedAt: '2026-08-14T08:00:00.000Z',
    schemaVersion: 1,
    source: 'demo',
    kind: 'glucose',
    concentrationMmolPerL: 5.0,
    context: 'fasting',
  });
  await repository.initialize();
  await repository.addEvent({
    id: 'evt-manual',
    occurredAt: '2026-08-14T09:00:00.000Z',
    createdAt: '2026-08-14T09:00:00.000Z',
    updatedAt: '2026-08-14T09:00:00.000Z',
    schemaVersion: 1,
    source: 'manual',
    kind: 'glucose',
    concentrationMmolPerL: 5.4,
    context: 'fasting',
  });

  const scan = await scanTimelineForAdoption({
    repository,
    isAcknowledged: () => false,
  });

  const demo = scan.find((item) => item.localEventId === 'evt-demo');
  const manual = scan.find((item) => item.localEventId === 'evt-manual');

  assert.equal(demo?.classification, 'excluded_demo');
  assert.equal(manual?.classification, 'eligible');
});
