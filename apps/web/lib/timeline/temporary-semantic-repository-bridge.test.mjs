import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestTimelinePresentationDependencies } from './presentation/testing/create-test-timeline-presentation-dependencies.ts';
import { liftLegacyTestFixture } from './testing/lift-legacy-test-fixtures.ts';
import { projectSemanticToLegacyRepositoryEvent } from './temporary-semantic-repository-bridge.ts';

let dependencies;

test.before(async () => {
  dependencies = await createTestTimelinePresentationDependencies();
});

const glucoseLegacy = {
  context: 'Перед завтраком',
  dateTime: '2026-08-02T07:15:00.000Z',
  id: 'glucose-1015',
  kind: 'glucose',
  source: 'demo',
  title: 'Глюкоза',
  value: '7,3 ммоль/л',
};

const insulinLegacy = {
  context: 'Перед едой',
  dateTime: '2026-08-02T05:05:00.000Z',
  id: 'insulin-0805',
  kind: 'insulin',
  source: 'demo',
  title: 'NovoRapid',
  value: '4 ЕД',
};

test('projectSemanticToLegacyRepositoryEvent reconstructs legacy glucose fields', () => {
  const semantic = liftLegacyTestFixture(glucoseLegacy);
  const legacy = projectSemanticToLegacyRepositoryEvent(semantic, dependencies);

  assert.equal(legacy.kind, 'glucose');
  assert.equal(legacy.id, 'glucose-1015');
  assert.equal(legacy.dateTime, '2026-08-02T07:15:00.000Z');
  assert.equal(legacy.value, '7,3 ммоль/л');
  assert.equal(legacy.unit, 'ммоль/л');
  assert.equal(legacy.title, 'Глюкоза');
});

test('projectSemanticToLegacyRepositoryEvent maps glucose semantic context to legacy label', () => {
  const semantic = liftLegacyTestFixture({
    ...glucoseLegacy,
    context: 'Перед завтраком',
  });
  const legacy = projectSemanticToLegacyRepositoryEvent(semantic, dependencies);

  assert.equal(legacy.context, 'Перед едой');
});

test('projectSemanticToLegacyRepositoryEvent reconstructs legacy insulin fields', () => {
  const semantic = liftLegacyTestFixture(insulinLegacy);
  const legacy = projectSemanticToLegacyRepositoryEvent(semantic, dependencies);

  assert.equal(legacy.value, '4 ЕД');
  assert.equal(legacy.unit, 'ЕД');
  assert.equal(legacy.title, 'NovoRapid');
});
