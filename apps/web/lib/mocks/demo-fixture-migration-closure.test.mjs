import assert from 'node:assert/strict';
import test from 'node:test';

import { liftLegacyToSemantic } from '@diabetes-universe/timeline';

import { mapTimelineEventCardPresentation } from '../timeline/presentation/timeline-presentation-mapper.ts';
import { createTestTimelinePresentationDependencies } from '../timeline/presentation/testing/create-test-timeline-presentation-dependencies.ts';
import { liftRepositorySnapshot } from '../timeline/migration/lift-repository-snapshot.ts';
import { timelineEvents as productionDemoTimelineEvents } from './timeline.ts';

const MIGRATED_AT = '2026-08-09T08:30:00.000Z';
const APPROVED_KINDS = new Set([
  'activity',
  'glucose',
  'insulin',
  'medication',
  'note',
  'nutrition',
]);

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

function assertNoLegacyPresentationFields(event) {
  assert.equal(Object.hasOwn(event, 'value'), false);
  assert.equal(Object.hasOwn(event, 'unit'), false);
  assert.equal(Object.hasOwn(event, 'dateTime'), false);

  if (event.kind !== 'note') {
    assert.equal(Object.hasOwn(event, 'title'), false);
  }
}

function assertSemanticIntegrity(legacyEvent, semanticEvent, migrationRecord) {
  assert.equal(semanticEvent.schemaVersion, 1);
  assert.equal(semanticEvent.id, legacyEvent.id);
  assert.equal(semanticEvent.source, legacyEvent.source ?? 'manual');
  assert.equal(semanticEvent.occurredAt, legacyEvent.dateTime);

  assertNoLegacyPresentationFields(semanticEvent);

  switch (semanticEvent.kind) {
    case 'glucose':
      assert.equal(typeof semanticEvent.concentrationMmolPerL, 'number');
      assert.ok(semanticEvent.concentrationMmolPerL > 0);
      break;
    case 'insulin':
      assert.equal(typeof semanticEvent.doseUnits, 'number');
      assert.ok(semanticEvent.doseUnits > 0);
      assert.equal(typeof semanticEvent.preparation, 'string');
      break;
    case 'nutrition':
      assert.equal(typeof semanticEvent.carbohydratesGrams, 'number');
      assert.ok(semanticEvent.carbohydratesGrams > 0);
      break;
    case 'medication':
      assert.equal(typeof semanticEvent.dose, 'number');
      assert.ok(semanticEvent.dose > 0);
      assert.equal(typeof semanticEvent.doseUnit, 'string');
      assert.equal(typeof semanticEvent.medicationName, 'string');
      break;
    case 'activity':
      assert.equal(typeof semanticEvent.durationSeconds, 'number');
      assert.ok(semanticEvent.durationSeconds > 0);
      break;
    case 'note':
      assert.equal(typeof semanticEvent.body, 'string');
      assert.ok(semanticEvent.body.trim().length > 0);
      break;
    default:
      assert.fail(`Unexpected semantic kind: ${semanticEvent.kind}`);
  }

  assert.equal(migrationRecord.eventId, semanticEvent.id);
  assert.equal(migrationRecord.migratedFrom, 'legacy_presentation');
  assert.equal(migrationRecord.sourceSchemaVersion, 0);
  assert.equal(migrationRecord.preservedLegacy.title, legacyEvent.title);
  assert.equal(migrationRecord.preservedLegacy.value, legacyEvent.value);

  if (legacyEvent.unit) {
    assert.equal(migrationRecord.preservedLegacy.unit, legacyEvent.unit);
  }

  if (legacyEvent.context) {
    assert.equal(migrationRecord.preservedLegacy.context, legacyEvent.context);
  }
}

test('production demo fixture inventory has unique ids and approved kinds only', () => {
  const ids = productionDemoTimelineEvents.map((event) => event.id);
  const uniqueIds = new Set(ids);

  assert.equal(uniqueIds.size, productionDemoTimelineEvents.length);

  for (const event of productionDemoTimelineEvents) {
    assert.ok(APPROVED_KINDS.has(event.kind), `Unexpected kind: ${event.kind}`);
    assert.equal(typeof event.id, 'string');
    assert.ok(event.id.trim().length > 0);
    assert.equal(Number.isNaN(Date.parse(event.dateTime)), false);
    assert.equal(event.source, 'demo');
  }
});

test('production demo fixture counts by kind', () => {
  assert.deepEqual(countByKind(productionDemoTimelineEvents), {
    activity: 1,
    glucose: 2,
    insulin: 1,
    medication: 1,
    note: 25,
    nutrition: 1,
  });
  assert.equal(productionDemoTimelineEvents.length, 31);
});

test('production demo dataset lifts with zero quarantine and full migration coverage', () => {
  const lifted = liftRepositorySnapshot(productionDemoTimelineEvents, {
    migratedAt: MIGRATED_AT,
  });

  assert.equal(lifted.events.length, productionDemoTimelineEvents.length);
  assert.equal(
    lifted.migrationRecords.size,
    productionDemoTimelineEvents.length,
  );
  assert.equal(lifted.quarantinedRecords.length, 0);
  assert.equal(lifted.unsupportedSchemaCount, 0);

  const semanticIds = new Set(lifted.events.map((event) => event.id));
  assert.equal(semanticIds.size, productionDemoTimelineEvents.length);
});

test('every production demo event passes per-record semantic integrity and migration evidence checks', () => {
  for (const legacyEvent of productionDemoTimelineEvents) {
    const result = liftLegacyToSemantic(legacyEvent, {
      migratedAt: MIGRATED_AT,
    });

    assert.equal(result.status, 'ok', `Expected ok for ${legacyEvent.id}`);

    if (result.status !== 'ok') {
      continue;
    }

    assertSemanticIntegrity(legacyEvent, result.event, result.migration);
  }
});

test('representative demo events map through P3d presentation without structural regression', async () => {
  const presentationDependencies =
    await createTestTimelinePresentationDependencies();
  const lifted = liftRepositorySnapshot(
    productionDemoTimelineEvents.filter((event) =>
      REPRESENTATIVE_DEMO_EVENT_IDS.includes(event.id),
    ),
    { migratedAt: MIGRATED_AT },
  );

  assert.equal(lifted.events.length, REPRESENTATIVE_DEMO_EVENT_IDS.length);

  const presentationById = new Map(
    lifted.events.map((event) => {
      const presentation = mapTimelineEventCardPresentation(
        event,
        presentationDependencies,
        '08:00',
      );

      return [event.id, presentation];
    }),
  );

  const glucose = presentationById.get('glucose-0800');
  assert.match(glucose?.value ?? '', /6\.4/);
  assert.match(glucose?.unit ?? '', /mmol\/L/i);

  const insulin = presentationById.get('insulin-0805');
  assert.equal(insulin?.title, 'NovoRapid');
  assert.equal(insulin?.value, '4');
  assert.equal(insulin?.unit, 'U');

  const nutrition = presentationById.get('nutrition-0820');
  assert.equal(nutrition?.title, 'Breakfast');
  assert.equal(nutrition?.value, '42');
  assert.match(nutrition?.unit ?? '', /g carbs/);

  const postMealGlucose = presentationById.get('glucose-1015');
  assert.match(postMealGlucose?.value ?? '', /7\.3/);

  const medication = presentationById.get('medication-1130');
  assert.equal(medication?.title, 'Метформин');
  assert.equal(medication?.value, '400');
  assert.equal(medication?.unit, 'mg');

  const activity = presentationById.get('activity-1500');
  assert.equal(activity?.title, 'Прогулка');
  assert.match(activity?.value ?? '', /30/);
  assert.match(activity?.unit ?? '', /min/i);

  const note = presentationById.get('note-1200');
  assert.equal(note?.title, 'Самочувствие');
  assert.match(note?.value ?? '', /усталость/i);
});

test('production demo fixtures do not include negative quarantine regression cases', () => {
  const suspiciousIds = productionDemoTimelineEvents
    .map((event) => event.id)
    .filter((id) => /bad|invalid|unknown|malformed|quarantine/i.test(id));

  assert.deepEqual(suspiciousIds, []);
});
