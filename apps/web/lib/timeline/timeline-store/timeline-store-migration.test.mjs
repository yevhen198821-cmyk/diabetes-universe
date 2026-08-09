import assert from 'node:assert/strict';
import test from 'node:test';

import { timelineEvents as demoTimelineEvents } from '../../mocks/timeline.ts';
import { liftRepositorySnapshot } from '../migration/lift-repository-snapshot.ts';
import { createMigrationSidecarStore } from '../migration/migration-sidecar-store.ts';
import { createQuarantineRegistry } from '../migration/quarantine-registry.ts';
import { createTimelineDiagnosticsSnapshot } from '../migration/timeline-migration-diagnostics.ts';
import {
  createReadyTimelineStoreState,
  createTimelineDiagnosticsFromState,
  timelineStoreReducer,
} from './timeline-store-model.ts';

const MIGRATED_AT = '2026-08-09T08:30:00.000Z';

const glucoseLegacy = {
  context: 'Перед завтраком',
  dateTime: '2026-08-02T05:00:00.000Z',
  id: 'glucose-0800',
  kind: 'glucose',
  source: 'demo',
  title: 'Глюкоза',
  value: '6,4 ммоль/л',
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

const nutritionLegacy = {
  context: 'После инсулина',
  dateTime: '2026-08-02T05:20:00.000Z',
  id: 'nutrition-0820',
  kind: 'nutrition',
  source: 'demo',
  title: 'Завтрак',
  value: '42 г углеводов',
};

const medicationLegacy = {
  context: 'После еды',
  dateTime: '2026-08-02T08:30:00.000Z',
  id: 'medication-1130',
  kind: 'medication',
  source: 'demo',
  title: 'Метформин',
  unit: 'мг',
  value: '400',
};

const activityLegacy = {
  context: 'После обеда',
  dateTime: '2026-08-01T12:00:00.000Z',
  id: 'activity-1500',
  kind: 'activity',
  source: 'demo',
  title: 'Прогулка',
  unit: 'минут',
  value: '30',
};

const noteLegacy = {
  dateTime: '2026-07-30T09:00:00.000Z',
  id: 'note-1200',
  kind: 'note',
  source: 'demo',
  title: 'Самочувствие',
  value: 'Чувствую усталость после обеда',
};

test('liftRepositorySnapshot lifts all six kinds into semantic events', () => {
  const lifted = liftRepositorySnapshot(
    [
      glucoseLegacy,
      insulinLegacy,
      nutritionLegacy,
      medicationLegacy,
      activityLegacy,
      noteLegacy,
    ],
    { migratedAt: MIGRATED_AT },
  );

  assert.equal(lifted.events.length, 6);
  assert.deepEqual([...lifted.events.map((event) => event.kind)].sort(), [
    'activity',
    'glucose',
    'insulin',
    'medication',
    'note',
    'nutrition',
  ]);
  assert.equal(lifted.migrationRecords.size, 6);
  assert.equal(lifted.quarantinedRecords.length, 0);
});

test('liftRepositorySnapshot isolates quarantined records from active events', () => {
  const lifted = liftRepositorySnapshot(
    [
      glucoseLegacy,
      {
        ...medicationLegacy,
        id: 'medication-bad-unit',
        unit: 'таблетка',
      },
    ],
    { migratedAt: MIGRATED_AT },
  );

  assert.equal(lifted.events.length, 1);
  assert.equal(lifted.quarantinedRecords.length, 1);
  assert.equal(lifted.quarantinedRecords[0].raw.id, 'medication-bad-unit');
});

test('migration sidecar and quarantine registry expose immutable snapshots', () => {
  const lifted = liftRepositorySnapshot([glucoseLegacy], {
    migratedAt: MIGRATED_AT,
  });
  const sidecar = createMigrationSidecarStore();
  const quarantine = createQuarantineRegistry();

  sidecar.replace(lifted.migrationRecords);
  quarantine.replace(lifted.quarantinedRecords);

  const sidecarSnapshot = sidecar.getSnapshot();
  const quarantineSnapshot = quarantine.getSnapshot();

  sidecarSnapshot.records.clear();
  quarantineSnapshot.records.push({
    quarantineId: 'mutated',
    preservedLegacy: {},
    quarantinedAt: MIGRATED_AT,
    raw: glucoseLegacy,
    reason: 'invalid_numeric',
    recoverable: true,
  });

  assert.equal(sidecar.count, 1);
  assert.equal(quarantine.count, 0);
});

test('diagnostics snapshot reports active, migration, and quarantine counts', () => {
  const lifted = liftRepositorySnapshot(
    [glucoseLegacy, { ...insulinLegacy, value: 'не число', id: 'bad-insulin' }],
    { migratedAt: MIGRATED_AT },
  );
  const sidecar = createMigrationSidecarStore();
  const quarantine = createQuarantineRegistry();

  sidecar.replace(lifted.migrationRecords);
  quarantine.replace(lifted.quarantinedRecords);

  const diagnostics = createTimelineDiagnosticsSnapshot({
    activeEventCount: lifted.events.length,
    migrationSidecar: sidecar.getSnapshot(),
    quarantineRegistry: quarantine.getSnapshot(),
    unsupportedSchemaCount: lifted.unsupportedSchemaCount,
  });

  assert.equal(diagnostics.activeEventCount, 1);
  assert.equal(diagnostics.migrationRecordCount, 1);
  assert.equal(diagnostics.quarantinedCount, 1);
  assert.equal(diagnostics.quarantinedRecords[0].raw.id, 'bad-insulin');
});

test('demo fixtures lift with zero quarantine records', () => {
  const lifted = liftRepositorySnapshot(demoTimelineEvents, {
    migratedAt: MIGRATED_AT,
  });

  assert.equal(lifted.quarantinedRecords.length, 0);
  assert.equal(lifted.unsupportedSchemaCount, 0);
  assert.equal(lifted.events.length, demoTimelineEvents.length);
});

test('semantic ready store state does not expose legacy presentation fields', () => {
  const lifted = liftRepositorySnapshot([glucoseLegacy], {
    migratedAt: MIGRATED_AT,
  });
  const state = createReadyTimelineStoreState(lifted.events, {
    migrationRecords: lifted.migrationRecords,
    quarantinedRecords: lifted.quarantinedRecords,
    unsupportedSchemaCount: 0,
  });

  assert.equal(state.events[0].kind, 'glucose');
  assert.equal(state.events[0].concentrationMmolPerL, 6.4);
  assert.equal(Object.hasOwn(state.events[0], 'title'), false);
  assert.equal(Object.hasOwn(state.events[0], 'value'), false);
});

test('createTimelineDiagnosticsFromState mirrors store migration state', () => {
  const lifted = liftRepositorySnapshot([glucoseLegacy, insulinLegacy], {
    migratedAt: MIGRATED_AT,
  });
  const state = createReadyTimelineStoreState(lifted.events, {
    migrationRecords: lifted.migrationRecords,
    quarantinedRecords: lifted.quarantinedRecords,
    unsupportedSchemaCount: 0,
  });

  const diagnostics = createTimelineDiagnosticsFromState(state);

  assert.equal(diagnostics.activeEventCount, 2);
  assert.equal(diagnostics.migrationRecordCount, 2);
  assert.equal(diagnostics.quarantinedCount, 0);
});

test('setReady stores semantic events and migration sidecar state', () => {
  const lifted = liftRepositorySnapshot([glucoseLegacy], {
    migratedAt: MIGRATED_AT,
  });
  const state = timelineStoreReducer(
    {
      events: [],
      migration: {
        migrationRecords: new Map(),
        quarantinedRecords: [],
        unsupportedSchemaCount: 0,
      },
      status: 'loading',
    },
    {
      events: lifted.events,
      migration: {
        migrationRecords: lifted.migrationRecords,
        quarantinedRecords: lifted.quarantinedRecords,
        unsupportedSchemaCount: 0,
      },
      type: 'setReady',
    },
  );

  assert.equal(state.status, 'ready');
  assert.equal(state.events[0].schemaVersion, 1);
  assert.equal(
    state.migration.migrationRecords.get('glucose-0800')?.eventId,
    'glucose-0800',
  );
});
