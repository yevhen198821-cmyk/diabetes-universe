import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTimelineSemanticEventEditDraft,
  updateSemanticTimelineEventFromDraft,
} from './timeline-event-detail-model.ts';

const glucoseSemantic = {
  concentrationMmolPerL: 6.4,
  context: 'after_meal',
  createdAt: '2026-08-02T07:00:00.000Z',
  id: 'event-1',
  kind: 'glucose',
  occurredAt: '2026-08-02T08:00:00.000Z',
  schemaVersion: 1,
  source: 'manual',
  updatedAt: '2026-08-02T07:00:00.000Z',
};
const now = new Date('2026-08-02T12:00:00.000Z');

test('creates semantic edit draft for glucose', () => {
  const draft = createTimelineSemanticEventEditDraft(glucoseSemantic);

  assert.equal(draft.value, '6,4');
  assert.equal(draft.context, 'После еды');
});

test('updates semantic glucose while preserving createdAt', () => {
  const draft = {
    ...createTimelineSemanticEventEditDraft(glucoseSemantic),
    time: '23:59',
    value: '8.8',
  };
  const result = updateSemanticTimelineEventFromDraft(
    glucoseSemantic,
    draft,
    now,
  );

  assert.deepEqual(result.errors, {});
  assert.equal(result.event?.id, glucoseSemantic.id);
  assert.equal(result.event?.kind, glucoseSemantic.kind);
  assert.equal(result.event?.source, glucoseSemantic.source);
  assert.equal(result.event?.createdAt, glucoseSemantic.createdAt);
  assert.equal(result.event?.updatedAt, now.toISOString());
  assert.equal(result.event?.concentrationMmolPerL, 8.8);
});

test('validates glucose range on semantic edit', () => {
  const result = updateSemanticTimelineEventFromDraft(
    glucoseSemantic,
    {
      ...createTimelineSemanticEventEditDraft(glucoseSemantic),
      value: '41',
    },
    now,
  );

  assert.equal(result.event, null);
  assert.ok(result.errors.value);
});

test('requires medication canonical unit mapping on semantic edit', () => {
  const medicationSemantic = {
    createdAt: '2026-08-02T07:00:00.000Z',
    dose: 400,
    doseUnit: 'mass.mg',
    id: 'medication-1',
    kind: 'medication',
    medicationName: 'Метформин',
    occurredAt: '2026-08-02T08:00:00.000Z',
    schemaVersion: 1,
    source: 'manual',
    updatedAt: '2026-08-02T07:00:00.000Z',
  };
  const result = updateSemanticTimelineEventFromDraft(
    medicationSemantic,
    {
      ...createTimelineSemanticEventEditDraft(medicationSemantic),
      unit: '',
    },
    now,
  );

  assert.equal(result.event, null);
  assert.equal(result.errors.unit, 'Укажите единицу лекарства.');
});

test('note semantic edit keeps title undefined when blank', () => {
  const noteSemantic = {
    body: 'Текст',
    createdAt: '2026-08-02T07:00:00.000Z',
    id: 'note-1',
    kind: 'note',
    occurredAt: '2026-08-02T08:00:00.000Z',
    schemaVersion: 1,
    source: 'manual',
    updatedAt: '2026-08-02T07:00:00.000Z',
  };
  const result = updateSemanticTimelineEventFromDraft(
    noteSemantic,
    {
      ...createTimelineSemanticEventEditDraft(noteSemantic),
      title: '',
      value: 'Обновлённый текст',
    },
    now,
  );

  assert.equal(result.event?.title, undefined);
  assert.equal(result.event?.body, 'Обновлённый текст');
});
