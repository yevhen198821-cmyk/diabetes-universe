import type { SemanticTimelineEvent } from '@diabetes-universe/types';
import { openTimelineIndexedDB } from '../persistence/indexeddb/timeline-indexeddb-open';
import { TIMELINE_INDEXEDDB_STORES as S } from '../persistence/indexeddb/timeline-indexeddb-schema';
import { createIndexedDbTimelineEventRecord } from '../persistence/indexeddb/timeline-indexeddb-record';
import {
  enqueueTimelineSyncIntent,
  pendingIntentRange,
  SYNC_STATE_KEY,
  type LocalSyncState,
  type LocalSyncIntent,
} from './timeline-sync-local';

export interface SyncChange {
  resourceId: string;
  revision: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  event: SemanticTimelineEvent;
  lifecycleState: 'active' | 'deleted';
}
export interface TimelineSyncTransport {
  push(mutation: Record<string, unknown>): Promise<{
    mutationId: string;
    status: 'acknowledged' | 'retryable' | 'conflict' | 'blocked';
    resourceId?: string;
    revision?: string;
    lifecycleState?: 'active' | 'deleted';
    code?: string;
  }>;
  pull(
    cursor?: string,
  ): Promise<{ changes: SyncChange[]; nextCursor: string; hasMore: boolean }>;
}

async function enable(databaseName: string, transport: TimelineSyncTransport) {
  // Readiness probe before changing durable local behavior.
  await transport.pull();
  const opened = await openTimelineIndexedDB({ databaseName });
  try {
    const db = opened.connection.database;
    const tx = db.transaction(
      [S.metadata, S.adoptionAcknowledgements, S.events],
      'readwrite',
    );
    const metadata = tx.objectStore(S.metadata);
    const current = (await metadata.get(SYNC_STATE_KEY)) as
      LocalSyncState | undefined;
    if (current?.enabled) {
      await tx.done;
      return;
    }
    let ack = await tx.objectStore(S.adoptionAcknowledgements).openCursor();
    while (ack) {
      await metadata.put({
        key: `sync-canonical:${ack.value.canonicalResourceId}`,
        localEventId: ack.value.localEventId,
      });
      ack = await ack.continue();
    }
    // Explicit adoption must finish first; an enabled profile starts with all
    // historical non-demo records mapped, so no legacy record is silently lost.
    let event = await tx.objectStore(S.events).openCursor();
    while (event) {
      if (
        event.value.event.source !== 'demo' &&
        !(await tx.objectStore(S.adoptionAcknowledgements).get(event.value.id))
      ) {
        tx.abort();
        await tx.done.catch(() => {});
        throw new Error('SYNC_ADOPTION_REQUIRED');
      }
      event = await event.continue();
    }
    await metadata.put({ ...current, key: SYNC_STATE_KEY, enabled: true });
    // Reconcile the current local snapshot against each adoption revision.
    // This captures edits/deletions made during or after one-time adoption.
    let adopted = await tx.objectStore(S.adoptionAcknowledgements).openCursor();
    while (adopted) {
      const local = await tx
        .objectStore(S.events)
        .get(adopted.value.localEventId);
      await enqueueTimelineSyncIntent(
        tx,
        adopted.value.localEventId,
        local ? 'upsert' : 'delete',
        local?.event,
      );
      adopted = await adopted.continue();
    }
    await tx.done;
  } finally {
    opened.connection.close();
  }
}

export async function readTimelineSyncState(databaseName: string) {
  const opened = await openTimelineIndexedDB({ databaseName });
  try {
    const db = opened.connection.database;
    const state = (await db.get(S.metadata, SYNC_STATE_KEY)) as
      LocalSyncState | undefined;
    const intents = (await db.getAll(
      S.metadata,
      pendingIntentRange(),
    )) as LocalSyncIntent[];
    return {
      enabled: state?.enabled === true,
      pending: intents.filter(
        (i) => i.state !== 'conflict' && i.state !== 'blocked',
      ).length,
      conflicts: intents.filter(
        (i) => i.state === 'conflict' || i.state === 'blocked',
      ).length,
    };
  } finally {
    opened.connection.close();
  }
}

async function run(databaseName: string, transport: TimelineSyncTransport) {
  const opened = await openTimelineIndexedDB({ databaseName });
  const db = opened.connection.database;
  try {
    const state = (await db.get(S.metadata, SYNC_STATE_KEY)) as
      LocalSyncState | undefined;
    if (!state?.enabled) return;
    const all = (await db.getAll(
      S.metadata,
      pendingIntentRange(),
    )) as LocalSyncIntent[];
    const intents = all
      .filter((i) => i.state !== 'blocked' && i.state !== 'conflict')
      .slice(0, 100);
    for (const intent of intents) {
      if (intent.state === 'blocked' || intent.state === 'conflict') continue;
      const prepare = db.transaction(
        [S.metadata, S.adoptionAcknowledgements],
        'readwrite',
      );
      const metadata = prepare.objectStore(S.metadata);
      if (intent.dependsOn && (await metadata.get(intent.dependsOn))) {
        await prepare.done;
        continue;
      }
      const ack = await prepare
        .objectStore(S.adoptionAcknowledgements)
        .get(intent.localEventId);
      let request = intent.request;
      if (!request) {
        if (intent.operation === 'delete' && !ack) {
          await metadata.delete(intent.key);
          await prepare.done;
          continue;
        }
        request = {
          mutationId: intent.mutationId,
          ...(intent.operation === 'delete'
            ? {
                operation: 'delete',
                resourceId: ack.canonicalResourceId,
                baseRevision: intent.baseRevision ?? ack.canonicalRevision,
              }
            : ack
              ? {
                  operation: 'update',
                  resourceId: ack.canonicalResourceId,
                  baseRevision: intent.baseRevision ?? ack.canonicalRevision,
                  event: intent.event,
                }
              : { operation: 'create', event: intent.event }),
        };
      }
      await metadata.put({ ...intent, request, state: 'in_flight' });
      await prepare.done;
      let outcome;
      try {
        outcome = await transport.push(request);
      } catch {
        await db.put(S.metadata, { ...intent, request, state: 'retryable' });
        return;
      }
      if (outcome.mutationId !== intent.mutationId)
        throw new Error('SYNC_RESPONSE_INVALID');
      const acknowledge = db.transaction(
        [S.metadata, S.adoptionAcknowledgements],
        'readwrite',
      );
      if (
        outcome.status === 'acknowledged' &&
        outcome.resourceId &&
        outcome.revision
      ) {
        await acknowledge.objectStore(S.adoptionAcknowledgements).put({
          localEventId: intent.localEventId,
          canonicalResourceId: outcome.resourceId,
          canonicalRevision: outcome.revision,
          adoptedAt: new Date().toISOString(),
          adoptionSessionId: 'sync',
          storageSchemaVersion: 1,
        });
        await acknowledge.objectStore(S.metadata).put({
          key: `sync-canonical:${outcome.resourceId}`,
          localEventId: intent.localEventId,
        });
        await acknowledge.objectStore(S.metadata).delete(intent.key);
      } else {
        await acknowledge.objectStore(S.metadata).put({
          ...intent,
          request,
          state: outcome.status === 'acknowledged' ? 'blocked' : outcome.status,
          code: outcome.code ?? 'SYNC_RESPONSE_INVALID',
        });
      }
      await acknowledge.done;
      if (outcome.status === 'retryable') return;
    }
    let cursor = ((await db.get(S.metadata, SYNC_STATE_KEY)) as LocalSyncState)
      .cursor;
    // Bound each cycle; continue from the durable checkpoint next time.
    for (let page = 0; page < 10; page++) {
      const result = await transport.pull(cursor);
      const tx = db.transaction(
        [S.metadata, S.events, S.adoptionAcknowledgements],
        'readwrite',
      );
      const metadata = tx.objectStore(S.metadata);
      for (const change of result.changes) {
        const mapping = await metadata.get(
          `sync-canonical:${change.resourceId}`,
        );
        const localEventId = mapping?.localEventId ?? change.resourceId;
        const ref = await metadata.get(`sync-reference:${localEventId}`);
        const pending = ref
          ? ((await metadata.get(ref.intentKey)) as LocalSyncIntent | undefined)
          : undefined;
        const ack = await tx
          .objectStore(S.adoptionAcknowledgements)
          .get(localEventId);
        if (pending) {
          if (
            change.revision !== (pending.baseRevision ?? ack?.canonicalRevision)
          ) {
            await metadata.put({
              ...pending,
              state: 'conflict',
              code:
                change.lifecycleState === 'deleted'
                  ? 'UPDATE_AFTER_DELETE'
                  : 'STALE_UPDATE',
            });
            await metadata.put({
              key: `sync-server:${change.resourceId}`,
              change,
            });
          }
          if (change.lifecycleState === 'deleted')
            await tx.objectStore(S.events).delete(localEventId);
        } else if (change.lifecycleState === 'deleted') {
          await tx.objectStore(S.events).delete(localEventId);
        } else {
          const event = {
            ...change.event,
            id: localEventId,
            createdAt: change.createdAt,
            updatedAt: change.updatedAt,
          };
          await tx
            .objectStore(S.events)
            .put(
              createIndexedDbTimelineEventRecord(
                event,
                new Date().toISOString(),
              ),
            );
        }
        await metadata.put({
          key: `sync-canonical:${change.resourceId}`,
          localEventId,
        });
        await tx.objectStore(S.adoptionAcknowledgements).put({
          localEventId,
          canonicalResourceId: change.resourceId,
          canonicalRevision: change.revision,
          adoptedAt: new Date().toISOString(),
          adoptionSessionId: 'sync',
          storageSchemaVersion: 1,
        });
      }
      await metadata.put({
        key: SYNC_STATE_KEY,
        enabled: true,
        cursor: result.nextCursor,
      });
      await tx.done;
      cursor = result.nextCursor;
      if (!result.hasMore) break;
    }
  } finally {
    opened.connection.close();
  }
}

export async function runTimelineSync(
  databaseName: string,
  transport: TimelineSyncTransport,
) {
  // Same-origin tabs share a lock. Without Web Locks, do not risk two drainers
  // racing acknowledgements; the UI reports the unsupported environment.
  if (!globalThis.navigator?.locks) throw new Error('SYNC_LOCK_UNAVAILABLE');
  return navigator.locks.request(`du-sync:${databaseName}`, () =>
    run(databaseName, transport),
  );
}

export async function enableTimelineSync(
  databaseName: string,
  transport: TimelineSyncTransport,
) {
  if (!globalThis.navigator?.locks) throw new Error('SYNC_LOCK_UNAVAILABLE');
  return navigator.locks.request(`du-sync:${databaseName}`, () =>
    enable(databaseName, transport),
  );
}
