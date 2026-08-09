import assert from 'node:assert/strict';
import test from 'node:test';

import { liftLegacyToSemantic } from '@diabetes-universe/timeline';

import { mapTimelineEventCardPresentation } from '../timeline/presentation/timeline-presentation-mapper.ts';
import { createTestTimelinePresentationDependencies } from '../timeline/presentation/testing/create-test-timeline-presentation-dependencies.ts';
import { liftRepositorySnapshot } from '../timeline/migration/lift-repository-snapshot.ts';
import { preservedLegacyDemoTimelineEvents } from './preserved-legacy-demo-timeline-events.ts';
import { timelineEvents as semanticDemoTimelineEvents } from './timeline.ts';

const MIGRATED_AT = '2026-08-09T08:30:00.000Z';

const REPRESENTATIVE_DEMO_EVENT_IDS = [
  'glucose-0800',
  'insulin-0805',
  'nutrition-0820',
  'glucose-1015',
  'medication-1130',
  'activity-1500',
  'note-1200',
];

function countByKind(events) {
  return events.reduce((counts, event) => {
    counts[event.kind] = (counts[event.kind] ?? 0) + 1;
    return counts;
  }, {});
}

function compareSemanticMeaning(left, right) {
  assert.equal(left.id, right.id);
  assert.equal(left.kind, right.kind);
  assert.equal(left.occurredAt, right.occurredAt);
  assert.equal(left.source, right.source);

  switch (left.kind) {
    case 'glucose':
      assert.equal(left.concentrationMmolPerL, right.concentrationMmolPerL);
      assert.equal(left.context, right.context);
      break;
    case 'insulin':
      assert.equal(left.doseUnits, right.doseUnits);
      assert.equal(left.preparation, right.preparation);
      assert.equal(left.context, right.context);
      break;
    case 'nutrition':
      assert.equal(left.carbohydratesGrams, right.carbohydratesGrams);
      assert.equal(left.mealType, right.mealType);
      assert.equal(left.mode, right.mode);
      break;
    case 'medication':
      assert.equal(left.dose, right.dose);
      assert.equal(left.doseUnit, right.doseUnit);
      assert.equal(left.medicationName, right.medicationName);
      break;
    case 'activity':
      assert.equal(left.durationSeconds, right.durationSeconds);
      assert.equal(left.activityType, right.activityType);
      break;
    case 'note':
      assert.equal(left.title, right.title);
      assert.equal(left.body, right.body);
      break;
    default:
      assert.fail(`Unexpected kind: ${left.kind}`);
  }
}

test('semantic demo fixture inventory has unique ids and canonical fields', () => {
  const ids = semanticDemoTimelineEvents.map((event) => event.id);
  const uniqueIds = new Set(ids);

  assert.equal(uniqueIds.size, semanticDemoTimelineEvents.length);

  for (const event of semanticDemoTimelineEvents) {
    assert.equal(event.schemaVersion, 1);
    assert.equal(event.source, 'demo');
    assert.equal(Number.isNaN(Date.parse(event.occurredAt)), false);
    assert.equal(Object.hasOwn(event, 'dateTime'), false);
    assert.equal(Object.hasOwn(event, 'value'), false);
  }
});

test('semantic demo fixture counts by kind', () => {
  assert.deepEqual(countByKind(semanticDemoTimelineEvents), {
    activity: 1,
    glucose: 2,
    insulin: 1,
    medication: 1,
    note: 25,
    nutrition: 1,
  });
  assert.equal(semanticDemoTimelineEvents.length, 31);
});

test('preserved legacy demo dataset lifts with zero quarantine', () => {
  const lifted = liftRepositorySnapshot(preservedLegacyDemoTimelineEvents, {
    migratedAt: MIGRATED_AT,
  });

  assert.equal(lifted.events.length, preservedLegacyDemoTimelineEvents.length);
  assert.equal(
    lifted.migrationRecords.size,
    preservedLegacyDemoTimelineEvents.length,
  );
  assert.equal(lifted.quarantinedRecords.length, 0);
  assert.equal(lifted.unsupportedSchemaCount, 0);
});

test('legacy demo v0 migration matches current semantic demo source', () => {
  const lifted = liftRepositorySnapshot(preservedLegacyDemoTimelineEvents, {
    migratedAt: MIGRATED_AT,
  });
  const semanticById = new Map(
    semanticDemoTimelineEvents.map((event) => [event.id, event]),
  );

  assert.equal(lifted.events.length, semanticDemoTimelineEvents.length);

  for (const migratedEvent of lifted.events) {
    const currentSemantic = semanticById.get(migratedEvent.id);

    assert.ok(
      currentSemantic,
      `Missing semantic demo event for ${migratedEvent.id}`,
    );
    compareSemanticMeaning(migratedEvent, currentSemantic);
  }
});

test('representative semantic demo events map through P3d presentation', async () => {
  const presentationDependencies =
    await createTestTimelinePresentationDependencies();
  const representativeEvents = semanticDemoTimelineEvents.filter((event) =>
    REPRESENTATIVE_DEMO_EVENT_IDS.includes(event.id),
  );

  assert.equal(
    representativeEvents.length,
    REPRESENTATIVE_DEMO_EVENT_IDS.length,
  );

  const presentationById = new Map(
    representativeEvents.map((event) => [
      event.id,
      mapTimelineEventCardPresentation(
        event,
        presentationDependencies,
        '08:00',
      ),
    ]),
  );

  const glucose = presentationById.get('glucose-0800');
  assert.match(glucose?.value ?? '', /6\.4/);

  const insulin = presentationById.get('insulin-0805');
  assert.equal(insulin?.title, 'NovoRapid');
  assert.equal(insulin?.value, '4');

  const nutrition = presentationById.get('nutrition-0820');
  assert.equal(nutrition?.title, 'Breakfast');
  assert.equal(nutrition?.value, '42');

  const medication = presentationById.get('medication-1130');
  assert.equal(medication?.title, 'Метформин');
  assert.equal(medication?.value, '400');

  const activity = presentationById.get('activity-1500');
  assert.equal(activity?.title, 'Прогулка');

  const note = presentationById.get('note-1200');
  assert.equal(note?.title, 'Самочувствие');
});

test('every preserved legacy demo event lifts with migration evidence', () => {
  for (const legacyEvent of preservedLegacyDemoTimelineEvents) {
    const result = liftLegacyToSemantic(legacyEvent, {
      migratedAt: MIGRATED_AT,
    });

    assert.equal(result.status, 'ok', `Expected ok for ${legacyEvent.id}`);

    if (result.status !== 'ok') {
      continue;
    }

    assert.equal(result.migration.migratedFrom, 'legacy_presentation');
    assert.equal(result.migration.sourceSchemaVersion, 0);
    assert.equal(result.migration.preservedLegacy.value, legacyEvent.value);
  }
});
