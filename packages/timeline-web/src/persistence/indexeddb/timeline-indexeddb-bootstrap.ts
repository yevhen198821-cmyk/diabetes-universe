import type { IDBPDatabase } from 'idb';
import { TimelineRepositoryError } from '@diabetes-universe/timeline';

import {
  TIMELINE_BOOTSTRAP_STATE_METADATA_KEY,
  TIMELINE_BOOTSTRAP_VERSION,
  TIMELINE_INDEXEDDB_STORES,
  TIMELINE_SEED_VERSION,
  TIMELINE_STORAGE_SCHEMA_VERSION,
  type TimelineBootstrapMetadata,
  type TimelineIndexedDbBootstrapStateMetadata,
} from './timeline-indexeddb-schema';
import { isTimelineBootstrapMetadata } from './timeline-indexeddb-validation';

export type TimelineBootstrapPhase =
  'uninitialized' | 'migrating' | 'ready' | 'failed';

export interface TimelineBootstrapRuntimeState {
  readonly phase: TimelineBootstrapPhase;
  readonly metadata: TimelineBootstrapMetadata | null;
  readonly error: TimelineRepositoryError | null;
}

export interface TimelineIndexedDbBootstrapDependencies {
  readonly now?: () => string;
}

async function readMetadataRecord(
  database: IDBPDatabase,
  key: string,
): Promise<unknown> {
  return database
    .transaction(TIMELINE_INDEXEDDB_STORES.metadata, 'readonly')
    .objectStore(TIMELINE_INDEXEDDB_STORES.metadata)
    .get(key);
}

async function countStoreRecords(
  database: IDBPDatabase,
  storeName: string,
): Promise<number> {
  return database
    .transaction(storeName, 'readonly')
    .objectStore(storeName)
    .count();
}

function createBootstrapMetadata(
  completedAt: string,
): TimelineBootstrapMetadata {
  return {
    key: 'bootstrap',
    bootstrapVersion: TIMELINE_BOOTSTRAP_VERSION,
    seedVersion: TIMELINE_SEED_VERSION,
    completedAt,
  };
}

function createBootstrapStateMetadata(
  status: TimelineIndexedDbBootstrapStateMetadata['status'],
  updatedAt: string,
  options: {
    readonly lastMigrationAt?: string;
    readonly failureCode?: string;
  } = {},
): TimelineIndexedDbBootstrapStateMetadata {
  return {
    key: TIMELINE_BOOTSTRAP_STATE_METADATA_KEY,
    status,
    storageSchemaVersion: TIMELINE_STORAGE_SCHEMA_VERSION,
    updatedAt,
    ...options,
  };
}

async function writeFirstRunBootstrap(
  database: IDBPDatabase,
  completedAt: string,
): Promise<TimelineBootstrapMetadata> {
  const bootstrapMetadata = createBootstrapMetadata(completedAt);
  const transaction = database.transaction(
    TIMELINE_INDEXEDDB_STORES.metadata,
    'readwrite',
  );
  const metadataStore = transaction.objectStore(
    TIMELINE_INDEXEDDB_STORES.metadata,
  );

  metadataStore.put(
    createBootstrapStateMetadata('migrating', completedAt, {
      lastMigrationAt: completedAt,
    }),
  );
  metadataStore.put(bootstrapMetadata);
  metadataStore.put(createBootstrapStateMetadata('ready', completedAt));

  await transaction.done;

  return bootstrapMetadata;
}

export async function runTimelineIndexedDbBootstrap(
  database: IDBPDatabase,
  dependencies: TimelineIndexedDbBootstrapDependencies = {},
): Promise<TimelineBootstrapRuntimeState> {
  const now = dependencies.now ?? (() => new Date().toISOString());
  const completedAt = now();

  const existingBootstrap = await readMetadataRecord(database, 'bootstrap');

  if (existingBootstrap !== undefined) {
    if (!isTimelineBootstrapMetadata(existingBootstrap)) {
      return {
        phase: 'failed',
        metadata: null,
        error: new TimelineRepositoryError(
          'TIMELINE_REPOSITORY_BOOTSTRAP_INCONSISTENT',
        ),
      };
    }

    return {
      phase: 'ready',
      metadata: existingBootstrap,
      error: null,
    };
  }

  const [eventCount, quarantineCount] = await Promise.all([
    countStoreRecords(database, TIMELINE_INDEXEDDB_STORES.events),
    countStoreRecords(database, TIMELINE_INDEXEDDB_STORES.quarantine),
  ]);

  if (eventCount > 0 || quarantineCount > 0) {
    return {
      phase: 'failed',
      metadata: null,
      error: new TimelineRepositoryError(
        'TIMELINE_REPOSITORY_BOOTSTRAP_INCONSISTENT',
      ),
    };
  }

  try {
    const metadata = await writeFirstRunBootstrap(database, completedAt);

    return {
      phase: 'ready',
      metadata,
      error: null,
    };
  } catch {
    return {
      phase: 'failed',
      metadata: null,
      error: new TimelineRepositoryError(
        'TIMELINE_REPOSITORY_INITIALIZE_FAILED',
      ),
    };
  }
}
