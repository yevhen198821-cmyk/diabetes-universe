import type { IDBPDatabase } from 'idb';

import {
  TIMELINE_ADOPTION_STORAGE_SCHEMA_VERSION,
  TIMELINE_INDEXEDDB_STORES,
  TIMELINE_SOURCE_NAMESPACE_METADATA_KEY,
  type IndexedDbTimelineAdoptionAcknowledgement,
  type IndexedDbTimelineAdoptionSession,
  type TimelineAdoptionSessionLifecycle,
} from '../persistence/indexeddb/timeline-indexeddb-schema';

export interface TimelineAdoptionLocalStore {
  ensureSourceNamespace(createNamespace: () => string): Promise<string>;
  hasAcknowledgement(localEventId: string): Promise<boolean>;
  saveAcknowledgement(
    acknowledgement: IndexedDbTimelineAdoptionAcknowledgement,
  ): Promise<void>;
  saveSessionCheckpoint(
    session: IndexedDbTimelineAdoptionSession,
  ): Promise<void>;
  getSessionByRunId(
    clientAdoptionRunId: string,
  ): Promise<IndexedDbTimelineAdoptionSession | null>;
  getResumableSessionCheckpoint(): Promise<IndexedDbTimelineAdoptionSession | null>;
}

interface TimelineSourceNamespaceRecord {
  readonly key: typeof TIMELINE_SOURCE_NAMESPACE_METADATA_KEY;
  readonly sourceNamespace: string;
  readonly createdAt: string;
}

const RESUMABLE_LIFECYCLES: readonly TimelineAdoptionSessionLifecycle[] = [
  'open',
  'failed',
];

function isResumableLifecycle(
  lifecycle: TimelineAdoptionSessionLifecycle,
): boolean {
  return RESUMABLE_LIFECYCLES.includes(lifecycle);
}

export function createTimelineAdoptionLocalStore(
  database: IDBPDatabase,
): TimelineAdoptionLocalStore {
  return {
    async ensureSourceNamespace(createNamespace) {
      const tx = database.transaction(
        TIMELINE_INDEXEDDB_STORES.metadata,
        'readwrite',
      );
      const store = tx.objectStore(TIMELINE_INDEXEDDB_STORES.metadata);
      const existing = (await store.get(
        TIMELINE_SOURCE_NAMESPACE_METADATA_KEY,
      )) as TimelineSourceNamespaceRecord | undefined;

      if (existing?.sourceNamespace) {
        await tx.done;
        return existing.sourceNamespace;
      }

      const record: TimelineSourceNamespaceRecord = {
        key: TIMELINE_SOURCE_NAMESPACE_METADATA_KEY,
        sourceNamespace: createNamespace(),
        createdAt: new Date().toISOString(),
      };
      await store.put(record);
      await tx.done;
      return record.sourceNamespace;
    },

    async hasAcknowledgement(localEventId) {
      const tx = database.transaction(
        TIMELINE_INDEXEDDB_STORES.adoptionAcknowledgements,
        'readonly',
      );
      const record = await tx
        .objectStore(TIMELINE_INDEXEDDB_STORES.adoptionAcknowledgements)
        .get(localEventId);
      await tx.done;
      return Boolean(record);
    },

    async saveAcknowledgement(acknowledgement) {
      const tx = database.transaction(
        TIMELINE_INDEXEDDB_STORES.adoptionAcknowledgements,
        'readwrite',
      );
      await tx
        .objectStore(TIMELINE_INDEXEDDB_STORES.adoptionAcknowledgements)
        .put(acknowledgement);
      await tx.done;
    },

    async saveSessionCheckpoint(session) {
      const tx = database.transaction(
        TIMELINE_INDEXEDDB_STORES.adoptionSessions,
        'readwrite',
      );
      const store = tx.objectStore(TIMELINE_INDEXEDDB_STORES.adoptionSessions);
      const existing = (await store.get(session.clientAdoptionRunId)) as
        IndexedDbTimelineAdoptionSession | undefined;

      const record: IndexedDbTimelineAdoptionSession = {
        ...session,
        createdAt: existing?.createdAt ?? session.createdAt,
        updatedAt: new Date().toISOString(),
        storageSchemaVersion: TIMELINE_ADOPTION_STORAGE_SCHEMA_VERSION,
      };
      await store.put(record);
      await tx.done;
    },

    async getSessionByRunId(clientAdoptionRunId) {
      const tx = database.transaction(
        TIMELINE_INDEXEDDB_STORES.adoptionSessions,
        'readonly',
      );
      const record = await tx
        .objectStore(TIMELINE_INDEXEDDB_STORES.adoptionSessions)
        .get(clientAdoptionRunId);
      await tx.done;
      return (record as IndexedDbTimelineAdoptionSession | undefined) ?? null;
    },

    async getResumableSessionCheckpoint() {
      const tx = database.transaction(
        TIMELINE_INDEXEDDB_STORES.adoptionSessions,
        'readonly',
      );
      const records = (await tx
        .objectStore(TIMELINE_INDEXEDDB_STORES.adoptionSessions)
        .getAll()) as IndexedDbTimelineAdoptionSession[];
      await tx.done;

      const resumable = records
        .filter((record) => isResumableLifecycle(record.lifecycle))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

      return resumable[0] ?? null;
    },
  };
}
