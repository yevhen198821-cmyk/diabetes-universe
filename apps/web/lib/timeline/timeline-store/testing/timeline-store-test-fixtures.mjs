import assert from 'node:assert/strict';

import { createTestTimelinePresentationDependencies } from '../../presentation/testing/create-test-timeline-presentation-dependencies.ts';

let cachedPresentationDependencies;

export async function getTestTimelinePresentationDependencies() {
  if (!cachedPresentationDependencies) {
    cachedPresentationDependencies =
      await createTestTimelinePresentationDependencies();
  }

  return cachedPresentationDependencies;
}

export const semanticGlucoseEarly = {
  concentrationMmolPerL: 6.4,
  createdAt: '2026-08-09T08:30:00.000Z',
  id: 'glucose-0800',
  kind: 'glucose',
  occurredAt: '2026-08-02T05:00:00.000Z',
  schemaVersion: 1,
  source: 'demo',
  updatedAt: '2026-08-09T08:30:00.000Z',
};

export const semanticInsulinLater = {
  context: 'Перед едой',
  createdAt: '2026-08-09T08:30:00.000Z',
  doseUnits: 4,
  id: 'insulin-0805',
  kind: 'insulin',
  occurredAt: '2026-08-02T05:05:00.000Z',
  preparation: 'NovoRapid',
  schemaVersion: 1,
  source: 'demo',
  updatedAt: '2026-08-09T08:30:00.000Z',
};

export function assertSemanticEventShape(event) {
  assert.equal(Object.hasOwn(event, 'title'), false);
  assert.equal(Object.hasOwn(event, 'value'), false);
  assert.equal(Object.hasOwn(event, 'dateTime'), false);
  assert.equal(typeof event.occurredAt, 'string');
  assert.equal(event.schemaVersion, 1);
}
