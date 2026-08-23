import type {
  SemanticTimelineEvent,
  TimelineEventKind,
} from '@diabetes-universe/types';

export const TIMELINE_INDEXEDDB_DATABASE_NAME = 'diabetes-universe-timeline';
export const TIMELINE_INDEXEDDB_VERSION = 2;
export const TIMELINE_STORAGE_SCHEMA_VERSION = 1;
export const TIMELINE_ADOPTION_STORAGE_SCHEMA_VERSION = 1;
export const TIMELINE_BOOTSTRAP_VERSION = 1;
export const TIMELINE_SEED_VERSION = 1;

export const TIMELINE_INDEXEDDB_STORES = {
  events: 'timeline_events',
  metadata: 'timeline_metadata',
  quarantine: 'timeline_quarantine',
  adoptionAcknowledgements: 'timeline_adoption_acknowledgements',
  adoptionSessions: 'timeline_adoption_sessions',
  adoptionQuarantine: 'timeline_adoption_quarantine',
} as const;

export const TIMELINE_INDEXEDDB_EVENT_INDEXES = {
  byKindOccurredAtId: 'by_kind_occurredAt_id',
  byOccurredAtId: 'by_occurredAt_id',
} as const;

export const TIMELINE_INDEXEDDB_ADOPTION_INDEXES = {
  byAdoptedAt: 'by_adoptedAt',
} as const;

export const TIMELINE_SOURCE_NAMESPACE_METADATA_KEY = 'source-namespace';

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

export interface TimelineSourceNamespaceMetadata {
  readonly key: typeof TIMELINE_SOURCE_NAMESPACE_METADATA_KEY;
  readonly sourceNamespace: string;
  readonly createdAt: string;
}

export type TimelineAdoptionSessionLifecycle =
  'open' | 'failed' | 'completed' | 'cancelled';

export interface IndexedDbTimelineAdoptionAcknowledgement {
  readonly localEventId: string;
  readonly canonicalResourceId: string;
  readonly canonicalRevision: string;
  readonly adoptedAt: string;
  readonly adoptionSessionId: string;
  readonly storageSchemaVersion: typeof TIMELINE_ADOPTION_STORAGE_SCHEMA_VERSION;
}

export interface IndexedDbTimelineAdoptionSession {
  readonly clientAdoptionRunId: string;
  readonly adoptionSessionId?: string;
  readonly lifecycle: TimelineAdoptionSessionLifecycle;
  readonly checkpoint: {
    readonly lastSubmittedLocalEventId?: string;
    readonly eligibleCount?: number;
    readonly adoptedCount?: number;
    readonly failedCount?: number;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly storageSchemaVersion: typeof TIMELINE_ADOPTION_STORAGE_SCHEMA_VERSION;
}

export type TimelineAdoptionQuarantineReason =
  | 'adoption_schema_unsupported'
  | 'adoption_legacy_ambiguous'
  | 'adoption_source_conflict';

export interface IndexedDbTimelineAdoptionQuarantineRecord {
  readonly quarantineId: string;
  readonly localEventId?: string;
  readonly reason: TimelineAdoptionQuarantineReason;
  readonly quarantinedAt: string;
  readonly detail?: string;
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
