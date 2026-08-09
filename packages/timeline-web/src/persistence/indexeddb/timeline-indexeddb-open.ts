import { openDB, type IDBPDatabase } from 'idb';
import { TimelineRepositoryError } from '@diabetes-universe/timeline';

import {
  runTimelineIndexedDbBootstrap,
  type TimelineBootstrapRuntimeState,
} from './timeline-indexeddb-bootstrap';
import {
  createTimelineIndexedDbConnection,
  type TimelineIndexedDbConnection,
} from './timeline-indexeddb-connection';
import { normalizeIndexedDbOpenError } from './timeline-indexeddb-errors';
import {
  TIMELINE_INDEXEDDB_DATABASE_NAME,
  TIMELINE_INDEXEDDB_VERSION,
} from './timeline-indexeddb-schema';
import { applyTimelineIndexedDbSchemaUpgrade } from './timeline-indexeddb-upgrade';

export interface TimelineIndexedDbOpenOptions {
  readonly databaseName?: string;
  readonly now?: () => string;
}

export interface TimelineIndexedDbOpenResult {
  readonly connection: TimelineIndexedDbConnection;
  readonly bootstrapState: TimelineBootstrapRuntimeState;
}

function resolveIndexedDbFactory(): IDBFactory {
  const factory = globalThis.indexedDB;

  if (!factory) {
    throw new TimelineRepositoryError(
      'TIMELINE_REPOSITORY_STORAGE_UNAVAILABLE',
    );
  }

  return factory;
}

async function openIndexedDbDatabase(
  options: TimelineIndexedDbOpenOptions,
): Promise<IDBPDatabase> {
  resolveIndexedDbFactory();
  const databaseName = options.databaseName ?? TIMELINE_INDEXEDDB_DATABASE_NAME;
  let blockedReject: ((error: TimelineRepositoryError) => void) | undefined;

  const blockedPromise = new Promise<never>((_, reject) => {
    blockedReject = reject;
  });

  const openPromise = openDB(databaseName, TIMELINE_INDEXEDDB_VERSION, {
    upgrade(database, oldVersion, newVersion) {
      try {
        applyTimelineIndexedDbSchemaUpgrade(
          database as unknown as IDBDatabase,
          oldVersion,
          newVersion,
        );
      } catch {
        throw new TimelineRepositoryError(
          'TIMELINE_REPOSITORY_SCHEMA_UPGRADE_FAILED',
        );
      }
    },
    blocked() {
      blockedReject?.(
        new TimelineRepositoryError('TIMELINE_REPOSITORY_STORAGE_OPEN_BLOCKED'),
      );
    },
    blocking(_currentVersion, _blockedVersion, event) {
      const target = event.target;
      if (
        target &&
        typeof target === 'object' &&
        'close' in target &&
        typeof target.close === 'function'
      ) {
        target.close();
      }
    },
    terminated() {
      // Connection termination is handled when subsequent operations fail.
    },
  });

  try {
    return await Promise.race([openPromise, blockedPromise]);
  } catch (error) {
    throw normalizeIndexedDbOpenError(error);
  }
}

export async function openTimelineIndexedDB(
  options: TimelineIndexedDbOpenOptions = {},
): Promise<TimelineIndexedDbOpenResult> {
  let database: IDBPDatabase | null = null;

  try {
    database = await openIndexedDbDatabase(options);

    const bootstrapState = await runTimelineIndexedDbBootstrap(database, {
      now: options.now,
    });

    if (bootstrapState.phase === 'failed' || bootstrapState.error) {
      const error =
        bootstrapState.error ??
        new TimelineRepositoryError('TIMELINE_REPOSITORY_INITIALIZE_FAILED');
      database.close();
      throw error;
    }

    return {
      connection: createTimelineIndexedDbConnection(database, bootstrapState),
      bootstrapState,
    };
  } catch (error) {
    if (database) {
      database.close();
    }

    throw normalizeIndexedDbOpenError(error);
  }
}

export interface IndexedDbTimelineRepositoryFoundation {
  initialize(): Promise<TimelineIndexedDbConnection>;
  getConnection(): TimelineIndexedDbConnection | null;
}

export function createIndexedDbTimelineRepositoryFoundation(
  options: TimelineIndexedDbOpenOptions = {},
): IndexedDbTimelineRepositoryFoundation {
  let connection: TimelineIndexedDbConnection | null = null;

  return {
    getConnection() {
      return connection;
    },
    async initialize() {
      if (connection?.phase === 'ready') {
        return connection;
      }

      const result = await openTimelineIndexedDB(options);
      connection = result.connection;
      return connection;
    },
  };
}
