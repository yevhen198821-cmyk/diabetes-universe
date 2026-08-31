import assert from 'node:assert/strict';
import test from 'node:test';

import { createSemanticInsulinTimelineEvent } from './create-semantic-insulin-timeline-event.ts';

const fixedClock = {
  now: () => new Date('2026-08-02T10:15:00.000Z'),
};

const catalogueEntry = {
  administrationContext: 'before_meal',
  doseUnits: 4,
  preparation: 'NovoRapid',
  preparationId: 'insulin.prep.aspart_novorapid',
  time: '09:00',
};

function create(overrides = {}, options = {}) {
  return createSemanticInsulinTimelineEvent(
    { ...catalogueEntry, ...overrides },
    { clock: fixedClock, ...options },
  );
}

test('the semantic insulin event carries catalogue identity and its snapshot', () => {
  const event = create();

  assert.equal(event.kind, 'insulin');
  assert.equal(event.preparationId, 'insulin.prep.aspart_novorapid');
  assert.equal(event.preparation, 'NovoRapid');
  assert.equal(event.doseUnits, 4);
  assert.equal(event.administrationContext, 'before_meal');
});

test('the semantic insulin event never emits legacy or derived fields', () => {
  const event = create();

  assert.equal(Object.hasOwn(event, 'context'), false);
  assert.equal(Object.hasOwn(event, 'preparationCategory'), false);
  assert.equal(Object.hasOwn(event, 'grouping'), false);
  assert.equal(Object.hasOwn(event, 'title'), false);
  assert.equal(Object.hasOwn(event, 'value'), false);
  assert.equal(Object.hasOwn(event, 'unit'), false);
  assert.equal(Object.hasOwn(event, 'dateTime'), false);
});

test('the semantic insulin event key set is exactly the Wave 4C contract', () => {
  assert.deepEqual(Object.keys(create()).sort(), [
    'administrationContext',
    'createdAt',
    'doseUnits',
    'id',
    'kind',
    'occurredAt',
    'preparation',
    'preparationId',
    'schemaVersion',
    'source',
    'updatedAt',
  ]);
});

test('the semantic insulin event accepts an explicit retry-safe id', () => {
  const event = create(catalogueEntry, { id: 'insulin-0900-retry-id' });

  assert.equal(event.id, 'insulin-0900-retry-id');
});

test('the envelope keeps manual source, schema version 1, and clock timestamps', () => {
  const event = create();

  assert.equal(event.source, 'manual');
  assert.equal(event.schemaVersion, 1);
  assert.equal(event.createdAt, '2026-08-02T10:15:00.000Z');
  assert.equal(event.updatedAt, event.createdAt);
  assert.match(event.occurredAt, /T09:00:00/);
  assert.match(event.id, /^insulin-0900-/);
});

test('a two-decimal dose is stored without rounding', () => {
  assert.equal(create({ doseUnits: 12.25 }).doseUnits, 12.25);
  assert.equal(create({ doseUnits: 4.5 }).doseUnits, 4.5);
  assert.equal(String(create({ doseUnits: 12.25 }).doseUnits), '12.25');
});

test('an Other entry stores the user-entered snapshot with the Other identity', () => {
  const event = create({
    preparation: 'Pharmacy own-brand insulin',
    preparationId: 'insulin.prep.other',
  });

  assert.equal(event.preparationId, 'insulin.prep.other');
  assert.equal(event.preparation, 'Pharmacy own-brand insulin');
});

test('every semantic administration context is persisted verbatim', () => {
  for (const administrationContext of [
    'before_meal',
    'after_meal',
    'correction',
    'basal',
    'other',
    'unspecified',
  ]) {
    const event = create({ administrationContext });

    assert.equal(event.administrationContext, administrationContext);
    assert.equal(Object.hasOwn(event, 'context'), false);
  }
});

test('the snapshot is trimmed without altering catalogue identity', () => {
  const event = create({ preparation: '  NovoRapid  ' });

  assert.equal(event.preparation, 'NovoRapid');
  assert.equal(event.preparationId, 'insulin.prep.aspart_novorapid');
});

test('no localized context label is ever persisted', () => {
  const serialized = JSON.stringify(create({ administrationContext: 'basal' }));

  for (const label of ['Basal', 'Базальный', 'Перед едой', 'Not specified']) {
    assert.equal(
      serialized.includes(label),
      false,
      `${label} is not persisted`,
    );
  }
});
