import type { IDBPTransaction } from 'idb';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';
import { TIMELINE_INDEXEDDB_STORES as S } from '../persistence/indexeddb/timeline-indexeddb-schema';

export const SYNC_STATE_KEY = 'sync-state-v1';
export const SYNC_INTENT_PREFIX = 'sync-intent:';
export interface LocalSyncIntent {
  key: string;
  mutationId: string;
  localEventId: string;
  operation: 'upsert' | 'delete';
  event?: SemanticTimelineEvent;
  baseRevision?: string;
  dependsOn?: string;
  state: 'pending' | 'in_flight' | 'retryable' | 'conflict' | 'blocked';
  code?: string;
  request?: Record<string, unknown>;
}
export interface LocalSyncState {
  key: typeof SYNC_STATE_KEY;
  enabled: boolean;
  cursor?: string;
}

/** Called inside the same transaction as a user's local write. */
export async function enqueueTimelineSyncIntent(
  tx: IDBPTransaction<unknown, string[], 'readwrite'>,
  localEventId: string,
  operation: 'upsert' | 'delete',
  event?: SemanticTimelineEvent,
) {
  const metadata = tx.objectStore(S.metadata);
  const state = (await metadata.get(SYNC_STATE_KEY)) as
    LocalSyncState | undefined;
  if (!state?.enabled || event?.source === 'demo') return;
  const ack = await tx
    .objectStore(S.adoptionAcknowledgements)
    .get(localEventId);
  const reference = (await metadata.get(`sync-reference:${localEventId}`)) as
    { intentKey: string } | undefined;
  const predecessor = reference
    ? await metadata.get(reference.intentKey)
    : undefined;
  const mutationId = crypto.randomUUID();
  const key = `${SYNC_INTENT_PREFIX}${new Date().toISOString()}:${mutationId}`;
  const intent: LocalSyncIntent = {
    key,
    mutationId,
    localEventId,
    operation,
    event,
    state: 'pending',
    ...(predecessor
      ? { dependsOn: predecessor.key }
      : ack
        ? { baseRevision: ack.canonicalRevision }
        : {}),
  };
  await metadata.put(intent);
  await metadata.put({ key: `sync-reference:${localEventId}`, intentKey: key });
}

export function pendingIntentRange() {
  return IDBKeyRange.bound(SYNC_INTENT_PREFIX, `${SYNC_INTENT_PREFIX}\uffff`);
}
