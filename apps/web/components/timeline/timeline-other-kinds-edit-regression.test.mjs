import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestTimelineInsulinEditCopy } from './testing/create-test-timeline-insulin-edit-copy.ts';
import {
  createTimelineSemanticEventEditDraft,
  updateTimelineEventFromDraft,
} from './timeline-event-detail-model.ts';

const now = new Date('2026-08-03T09:00:00.000Z');

const envelope = {
  createdAt: '2026-08-02T05:00:00.000Z',
  occurredAt: '2026-08-02T05:05:00.000Z',
  schemaVersion: 1,
  source: 'manual',
  updatedAt: '2026-08-02T05:05:00.000Z',
};

const events = {
  activity: {
    ...envelope,
    activityType: 'Прогулка',
    durationSeconds: 1800,
    id: 'activity-1',
    kind: 'activity',
    note: 'Парк',
  },
  glucose: {
    ...envelope,
    concentrationMmolPerL: 6.4,
    context: 'after_meal',
    id: 'glucose-1',
    kind: 'glucose',
  },
  medication: {
    ...envelope,
    context: 'После еды',
    dose: 400,
    doseUnit: 'mass.mg',
    id: 'medication-1',
    kind: 'medication',
    medicationName: 'Метформин',
  },
  note: {
    ...envelope,
    body: 'Наблюдение',
    id: 'note-1',
    kind: 'note',
    title: 'День',
  },
  nutrition: {
    ...envelope,
    carbohydratesGrams: 42,
    id: 'nutrition-1',
    kind: 'nutrition',
    mealType: 'breakfast',
    mode: 'manual',
  },
};

let copy;

test.before(async () => {
  copy = await createTestTimelineInsulinEditCopy();
});

function save(event, draftOverrides = {}) {
  return updateTimelineEventFromDraft({
    copy,
    draft: {
      ...createTimelineSemanticEventEditDraft(event),
      ...draftOverrides,
    },
    event,
    now,
  });
}

test('non-insulin kinds keep the generic string edit draft', () => {
  for (const [kind, event] of Object.entries(events)) {
    const draft = createTimelineSemanticEventEditDraft(event);

    assert.equal(draft.variant, 'generic', `${kind} stays generic`);
    assert.equal('insulin' in draft, false, `${kind} has no insulin state`);
    assert.equal(typeof draft.title, 'string');
    assert.equal(typeof draft.value, 'string');
    assert.equal(typeof draft.context, 'string');
  }
});

test('glucose edit still maps its localized context label back to the semantic value', () => {
  const result = save(events.glucose, { value: '9,1' });

  assert.deepEqual(result.errors, {});
  assert.equal(result.event.concentrationMmolPerL, 9.1);
  assert.equal(result.event.context, 'after_meal');
  assert.equal(result.event.updatedAt, now.toISOString());
});

test('glucose keeps its own 40 mmol/L guard', () => {
  assert.equal(
    save(events.glucose, { value: '40' }).event.concentrationMmolPerL,
    40,
  );
  assert.equal(save(events.glucose, { value: '41' }).event, null);
});

test('medication edit still writes name, dose, unit, note, and free-text context', () => {
  const result = save(events.medication, {
    context: 'Перед сном',
    note: 'После ужина',
    title: 'Метформин 500',
    unit: 'г',
    value: '1',
  });

  assert.equal(result.event.medicationName, 'Метформин 500');
  assert.equal(result.event.dose, 1);
  assert.equal(result.event.doseUnit, 'mass.g');
  assert.equal(result.event.note, 'После ужина');
  assert.equal(result.event.context, 'Перед сном');
});

test('nutrition edit still maps the meal type title and carbohydrate value', () => {
  const result = save(events.nutrition, { title: 'Обед', value: '55' });

  assert.equal(result.event.mealType, 'lunch');
  assert.equal(result.event.carbohydratesGrams, 55);
});

test('activity edit still converts minutes to duration seconds', () => {
  const result = save(events.activity, { value: '45' });

  assert.equal(result.event.durationSeconds, 2700);
  assert.equal(result.event.activityType, 'Прогулка');
});

test('note edit still enforces the 500 character body bound', () => {
  assert.equal(save(events.note, { value: '' }).event, null);
  assert.equal(save(events.note, { value: 'x'.repeat(501) }).event, null);
  assert.equal(
    save(events.note, { value: 'x'.repeat(500) }).event.body.length,
    500,
  );
});

test('non-insulin kinds never gain insulin semantic fields', () => {
  for (const [kind, event] of Object.entries(events)) {
    const result = save(event);

    assert.ok(result.event, `${kind} saves`);
    assert.equal('preparationId' in result.event, false);
    assert.equal('administrationContext' in result.event, false);
    assert.equal(result.event.id, event.id);
    assert.equal(result.event.createdAt, event.createdAt);
    assert.equal(result.event.schemaVersion, 1);
  }
});
