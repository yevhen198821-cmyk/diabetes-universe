import {
  TIMELINE_INDEXEDDB_ADOPTION_INDEXES,
  TIMELINE_INDEXEDDB_EVENT_INDEXES,
  TIMELINE_INDEXEDDB_STORES,
  TIMELINE_INDEXEDDB_VERSION,
} from './timeline-indexeddb-schema';

export class TimelineIndexedDbSchemaUpgradeError extends Error {
  constructor() {
    super('TIMELINE_INDEXEDDB_SCHEMA_UPGRADE_FAILED');
    this.name = 'TimelineIndexedDbSchemaUpgradeError';
  }
}

function assertFreshDatabase(database: IDBDatabase): void {
  for (const storeName of Object.values(TIMELINE_INDEXEDDB_STORES)) {
    if (database.objectStoreNames.contains(storeName)) {
      throw new TimelineIndexedDbSchemaUpgradeError();
    }
  }
}

function createV1Stores(database: IDBDatabase): void {
  const eventStore = database.createObjectStore(
    TIMELINE_INDEXEDDB_STORES.events,
    {
      keyPath: 'id',
    },
  );
  eventStore.createIndex(
    TIMELINE_INDEXEDDB_EVENT_INDEXES.byOccurredAtId,
    ['occurredAt', 'id'],
    { unique: false },
  );
  eventStore.createIndex(
    TIMELINE_INDEXEDDB_EVENT_INDEXES.byKindOccurredAtId,
    ['kind', 'occurredAt', 'id'],
    { unique: false },
  );

  database.createObjectStore(TIMELINE_INDEXEDDB_STORES.metadata, {
    keyPath: 'key',
  });
  database.createObjectStore(TIMELINE_INDEXEDDB_STORES.quarantine, {
    keyPath: 'quarantineId',
  });
}

function upgradeToV2(database: IDBDatabase): void {
  if (
    !database.objectStoreNames.contains(
      TIMELINE_INDEXEDDB_STORES.adoptionAcknowledgements,
    )
  ) {
    const ackStore = database.createObjectStore(
      TIMELINE_INDEXEDDB_STORES.adoptionAcknowledgements,
      { keyPath: 'localEventId' },
    );
    ackStore.createIndex(
      TIMELINE_INDEXEDDB_ADOPTION_INDEXES.byAdoptedAt,
      'adoptedAt',
      { unique: false },
    );
  }

  if (
    !database.objectStoreNames.contains(
      TIMELINE_INDEXEDDB_STORES.adoptionSessions,
    )
  ) {
    database.createObjectStore(TIMELINE_INDEXEDDB_STORES.adoptionSessions, {
      keyPath: 'clientAdoptionRunId',
    });
  }

  if (
    !database.objectStoreNames.contains(
      TIMELINE_INDEXEDDB_STORES.adoptionQuarantine,
    )
  ) {
    database.createObjectStore(TIMELINE_INDEXEDDB_STORES.adoptionQuarantine, {
      keyPath: 'quarantineId',
    });
  }
}

export function applyTimelineIndexedDbSchemaUpgrade(
  database: IDBDatabase,
  oldVersion: number,
  newVersion: number | null,
): void {
  const targetVersion = newVersion ?? TIMELINE_INDEXEDDB_VERSION;

  if (oldVersion >= TIMELINE_INDEXEDDB_VERSION) {
    return;
  }

  if (oldVersion === 0) {
    assertFreshDatabase(database);
    createV1Stores(database);
    if (targetVersion >= 2) {
      upgradeToV2(database);
    }
    return;
  }

  if (oldVersion === 1 && targetVersion >= 2) {
    upgradeToV2(database);
    return;
  }

  throw new TimelineIndexedDbSchemaUpgradeError();
}
