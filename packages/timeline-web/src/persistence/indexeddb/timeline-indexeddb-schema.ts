import type {
  SemanticTimelineEvent,
  TimelineEventKind,
} from '@diabetes-universe/types';

export const TIMELINE_INDEXEDDB_DATABASE_NAME = 'diabetes-universe-timeline';
export const TIMELINE_INDEXEDDB_VERSION = 1;
export const TIMELINE_STORAGE_SCHEMA_VERSION = 1;
export const TIMELINE_BOOTSTRAP_VERSION = 1;
export const TIMELINE_SEED_VERSION = 1;

export const TIMELINE_INDEXEDDB_STORES = {
  events: 'timeline_events',
  metadata: 'timeline_metadata',
  quarantine: 'timeline_quarantine',
} as const;

export const TIMELINE_INDEXEDDB_EVENT_INDEXES = {
  byKindOccurredAtId: 'by_kind_occurredAt_id',
  byOccurredAtId: 'by_occurredAt_id',
} as const;

export type TimelineStorageSchemaVersion = 1;
export type TimelineBootstrapVersion = 1;
export type TimelineSeedVersion = 1;

export interface IndexedDbTimelineEventRecord {
  readonly id: string;
  readonly occurredAt: string;
  readonly kind: TimelineEventKind;
  readonly event: SemanticTimelineEvent;
  readonly persistedAt: string;
  readonly storageSchemaVersion: TimelineStorageSchemaVersion;
}

export interface TimelineBootstrapMetadata {
  readonly key: 'bootstrap';
  readonly bootstrapVersion: TimelineBootstrapVersion;
  readonly seedVersion: TimelineSeedVersion;
  readonly completedAt: string;
}

export const TIMELINE_BOOTSTRAP_STATE_METADATA_KEY = 'bootstrap-state';

export type TimelineBootstrapLifecycleStatus = 'migrating' | 'ready' | 'failed';

export interface TimelineIndexedDbBootstrapStateMetadata {
  readonly key: typeof TIMELINE_BOOTSTRAP_STATE_METADATA_KEY;
  readonly status: TimelineBootstrapLifecycleStatus;
  readonly storageSchemaVersion: TimelineStorageSchemaVersion;
  readonly lastMigrationAt?: string;
  readonly updatedAt: string;
  readonly failureCode?: string;
}

export type TimelineStorageQuarantineReason =
  | 'invalid_record_shape'
  | 'unsupported_storage_schema'
  | 'semantic_identity_mismatch'
  | 'invalid_event_schema';

export interface IndexedDbTimelineQuarantineRecord {
  readonly quarantineId: string;
  readonly sourceRecordId?: string;
  readonly reason: TimelineStorageQuarantineReason;
  readonly quarantinedAt: string;
  readonly raw: unknown;
  readonly storageSchemaVersion?: number;
}

export interface TimelineIndexedDbSchemaDefinition {
  readonly databaseName: typeof TIMELINE_INDEXEDDB_DATABASE_NAME;
  readonly databaseVersion: typeof TIMELINE_INDEXEDDB_VERSION;
  readonly eventStore: {
    readonly keyPath: 'id';
    readonly name: typeof TIMELINE_INDEXEDDB_STORES.events;
    readonly indexes: readonly [
      {
        readonly keyPath: readonly ['occurredAt', 'id'];
        readonly name: typeof TIMELINE_INDEXEDDB_EVENT_INDEXES.byOccurredAtId;
        readonly unique: false;
      },
      {
        readonly keyPath: readonly ['kind', 'occurredAt', 'id'];
        readonly name: typeof TIMELINE_INDEXEDDB_EVENT_INDEXES.byKindOccurredAtId;
        readonly unique: false;
      },
    ];
  };
  readonly metadataStore: {
    readonly keyPath: 'key';
    readonly name: typeof TIMELINE_INDEXEDDB_STORES.metadata;
  };
  readonly quarantineStore: {
    readonly keyPath: 'quarantineId';
    readonly name: typeof TIMELINE_INDEXEDDB_STORES.quarantine;
  };
}

export const timelineIndexedDbSchemaV1: TimelineIndexedDbSchemaDefinition = {
  databaseName: TIMELINE_INDEXEDDB_DATABASE_NAME,
  databaseVersion: TIMELINE_INDEXEDDB_VERSION,
  eventStore: {
    keyPath: 'id',
    name: TIMELINE_INDEXEDDB_STORES.events,
    indexes: [
      {
        keyPath: ['occurredAt', 'id'],
        name: TIMELINE_INDEXEDDB_EVENT_INDEXES.byOccurredAtId,
        unique: false,
      },
      {
        keyPath: ['kind', 'occurredAt', 'id'],
        name: TIMELINE_INDEXEDDB_EVENT_INDEXES.byKindOccurredAtId,
        unique: false,
      },
    ],
  },
  metadataStore: {
    keyPath: 'key',
    name: TIMELINE_INDEXEDDB_STORES.metadata,
  },
  quarantineStore: {
    keyPath: 'quarantineId',
    name: TIMELINE_INDEXEDDB_STORES.quarantine,
  },
};
