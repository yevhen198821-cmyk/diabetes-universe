import assert from 'node:assert/strict';
import test from 'node:test';

import { projectSemanticToLegacyRepositoryEvent } from '../temporary-semantic-repository-bridge.ts';
import { createTestTimelinePresentationDependencies } from '../presentation/testing/create-test-timeline-presentation-dependencies.ts';
import { liftRepositorySnapshot } from './lift-repository-snapshot.ts';
import { createMigrationSidecarStore } from './migration-sidecar-store.ts';
import { createQuarantineRegistry } from './quarantine-registry.ts';

let presentationDependencies;

test.before(async () => {
  presentationDependencies = await createTestTimelinePresentationDependencies();
});

const INITIAL_MIGRATED_AT = '2026-08-09T08:30:00.000Z';
const REFRESH_MIGRATED_AT = '2026-08-09T09:45:00.000Z';

const glucoseA = {
  context: 'Перед завтраком',
  dateTime: '2026-08-02T05:00:00.000Z',
  id: 'glucose-a',
  kind: 'glucose',
  source: 'demo',
  title: 'Глюкоза',
  value: '6,4 ммоль/л',
};

const insulinB = {
  context: 'Перед едой',
  dateTime: '2026-08-02T05:05:00.000Z',
  id: 'insulin-b',
  kind: 'insulin',
  source: 'demo',
  title: 'NovoRapid',
  value: '4 ЕД',
};

const glucoseC = {
  context: 'После еды',
  dateTime: '2026-08-02T06:00:00.000Z',
  id: 'glucose-c',
  kind: 'glucose',
  source: 'demo',
  title: 'Глюкоза',
  value: '7,1 ммоль/л',
};

const badMedication = {
  context: 'После еды',
  dateTime: '2026-08-02T08:30:00.000Z',
  id: 'medication-bad',
  kind: 'medication',
  source: 'demo',
  title: 'Метформин',
  unit: 'таблетка',
  value: '400',
};

function createPreviousEvidence(snapshot) {
  return {
    migrationRecords: snapshot.migrationRecords,
    quarantinedRecords: snapshot.quarantinedRecords,
  };
}

test('initialize records migration evidence for each lifted legacy event', () => {
  const initial = liftRepositorySnapshot([glucoseA, insulinB], {
    migratedAt: INITIAL_MIGRATED_AT,
  });

  const recordA = initial.migrationRecords.get('glucose-a');
  const recordB = initial.migrationRecords.get('insulin-b');

  assert.equal(recordA?.migratedAt, INITIAL_MIGRATED_AT);
  assert.equal(recordB?.migratedAt, INITIAL_MIGRATED_AT);
  assert.equal(recordA?.preservedLegacy.value, '6,4 ммоль/л');
  assert.equal(recordB?.preservedLegacy.value, '4 ЕД');
});

test('update one event keeps migration evidence for unchanged events', () => {
  const initial = liftRepositorySnapshot([glucoseA, insulinB], {
    migratedAt: INITIAL_MIGRATED_AT,
  });
  const recordA = initial.migrationRecords.get('glucose-a');
  const recordB = initial.migrationRecords.get('insulin-b');

  const refreshed = liftRepositorySnapshot(
    [{ ...glucoseA, value: '7,0 ммоль/л' }, insulinB],
    { migratedAt: REFRESH_MIGRATED_AT },
    createPreviousEvidence(initial),
  );

  assert.deepEqual(refreshed.migrationRecords.get('glucose-a'), recordA);
  assert.deepEqual(refreshed.migrationRecords.get('insulin-b'), recordB);
  assert.equal(
    refreshed.events.find((event) => event.id === 'glucose-a')
      ?.concentrationMmolPerL,
    7,
  );
});

test('add event preserves existing migration evidence and records only the new event', () => {
  const initial = liftRepositorySnapshot([glucoseA, insulinB], {
    migratedAt: INITIAL_MIGRATED_AT,
  });
  const recordA = initial.migrationRecords.get('glucose-a');
  const recordB = initial.migrationRecords.get('insulin-b');

  const refreshed = liftRepositorySnapshot(
    [glucoseA, insulinB, glucoseC],
    { migratedAt: REFRESH_MIGRATED_AT },
    createPreviousEvidence(initial),
  );
  const recordC = refreshed.migrationRecords.get('glucose-c');

  assert.deepEqual(refreshed.migrationRecords.get('glucose-a'), recordA);
  assert.deepEqual(refreshed.migrationRecords.get('insulin-b'), recordB);
  assert.equal(recordC?.migratedAt, REFRESH_MIGRATED_AT);
  assert.notEqual(recordC?.migratedAt, recordA?.migratedAt);
});

test('delete event removes only deleted migration evidence', () => {
  const initial = liftRepositorySnapshot([glucoseA, insulinB], {
    migratedAt: INITIAL_MIGRATED_AT,
  });
  const recordB = initial.migrationRecords.get('insulin-b');

  const refreshed = liftRepositorySnapshot(
    [insulinB],
    { migratedAt: REFRESH_MIGRATED_AT },
    createPreviousEvidence(initial),
  );

  assert.equal(refreshed.migrationRecords.has('glucose-a'), false);
  assert.deepEqual(refreshed.migrationRecords.get('insulin-b'), recordB);
});

test('compatibility edit round-trip does not restamp migration evidence', () => {
  const initial = liftRepositorySnapshot([glucoseA], {
    migratedAt: INITIAL_MIGRATED_AT,
  });
  const recordA = initial.migrationRecords.get('glucose-a');
  const semanticBefore = initial.events[0];
  const legacyProjection = projectSemanticToLegacyRepositoryEvent(
    semanticBefore,
    presentationDependencies,
  );
  const editedLegacy = {
    ...legacyProjection,
    value: '8,2 ммоль/л',
  };

  const refreshed = liftRepositorySnapshot(
    [editedLegacy],
    { migratedAt: REFRESH_MIGRATED_AT },
    createPreviousEvidence(initial),
  );

  assert.deepEqual(refreshed.migrationRecords.get('glucose-a'), recordA);
  assert.equal(refreshed.events[0]?.concentrationMmolPerL, 8.2);
});

test('unrelated repository refresh keeps quarantine identity and timestamp', () => {
  const initial = liftRepositorySnapshot([glucoseA, badMedication], {
    migratedAt: INITIAL_MIGRATED_AT,
  });
  const quarantine = initial.quarantinedRecords[0];

  const refreshed = liftRepositorySnapshot(
    [glucoseA, badMedication, insulinB],
    { migratedAt: REFRESH_MIGRATED_AT },
    createPreviousEvidence(initial),
  );
  const refreshedQuarantine = refreshed.quarantinedRecords.find(
    (record) => record.raw.id === 'medication-bad',
  );

  assert.equal(refreshedQuarantine?.quarantineId, quarantine.quarantineId);
  assert.equal(refreshedQuarantine?.quarantinedAt, quarantine.quarantinedAt);
  assert.deepEqual(
    refreshedQuarantine?.preservedLegacy,
    quarantine.preservedLegacy,
  );
});

test('migration and quarantine snapshots remain immutable after exposure', () => {
  const initial = liftRepositorySnapshot([glucoseA, badMedication], {
    migratedAt: INITIAL_MIGRATED_AT,
  });
  const sidecar = createMigrationSidecarStore();
  const quarantine = createQuarantineRegistry();

  sidecar.replace(initial.migrationRecords);
  quarantine.replace(initial.quarantinedRecords);

  const sidecarSnapshot = sidecar.getSnapshot();
  const quarantineSnapshot = quarantine.getSnapshot();

  sidecarSnapshot.records.clear();
  quarantineSnapshot.records.push({
    quarantineId: 'mutated',
    preservedLegacy: {},
    quarantinedAt: INITIAL_MIGRATED_AT,
    raw: glucoseA,
    reason: 'invalid_numeric',
    recoverable: true,
  });

  assert.equal(sidecar.count, 1);
  assert.equal(quarantine.count, 1);
});
