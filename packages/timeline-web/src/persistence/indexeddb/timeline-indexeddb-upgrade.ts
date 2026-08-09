import {
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

export function applyTimelineIndexedDbSchemaUpgrade(
  database: IDBDatabase,
  oldVersion: number,
  newVersion: number | null,
): void {
  if (oldVersion >= TIMELINE_INDEXEDDB_VERSION) {
    return;
  }

  if (oldVersion !== 0 || newVersion !== TIMELINE_INDEXEDDB_VERSION) {
    throw new TimelineIndexedDbSchemaUpgradeError();
  }

  assertFreshDatabase(database);

  const eventStore = database.createObjectStore(TIMELINE_INDEXEDDB_STORES.events, {
    keyPath: 'id',
  });
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
