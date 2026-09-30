import { openTimelineIndexedDB } from './timeline-indexeddb-open';
import { TIMELINE_INDEXEDDB_STORES } from './timeline-indexeddb-schema';

/** Explicit user export: one readonly transaction, including quarantined history. */
export async function exportTimelineLocalData(databaseName: string) {
  const result = await openTimelineIndexedDB({ databaseName });
  try {
    if (result.bootstrapState.phase !== 'ready') {
      throw new Error('TIMELINE_REPOSITORY_INITIALIZE_FAILED');
    }
    const database = result.connection.database;
    const stores = Object.values(TIMELINE_INDEXEDDB_STORES);
    const tx = database.transaction(stores, 'readonly');
    const entries = await Promise.all(
      stores.map(
        async (name) => [name, await tx.objectStore(name).getAll()] as const,
      ),
    );
    await tx.done;
    return {
      format: 'diabetes-universe-local',
      version: 1,
      exportedAt: new Date().toISOString(),
      scope: 'current-browser-profile',
      stores: Object.fromEntries(entries),
    };
  } finally {
    result.connection.close();
  }
}

/** Only call after explicit user confirmation; never affects auth or cloud data. */
export async function deleteTimelineLocalData(
  databaseName: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('LOCAL_DATA_DELETE_FAILED'));
  });
}
