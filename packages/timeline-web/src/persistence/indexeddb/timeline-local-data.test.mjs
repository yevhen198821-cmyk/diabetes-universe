import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import test from 'node:test';
import { exportTimelineLocalData } from './timeline-local-data.ts';
import { openTimelineIndexedDB } from './timeline-indexeddb-open.ts';
import { TIMELINE_INDEXEDDB_STORES } from './timeline-indexeddb-schema.ts';

test('export includes complete history and quarantine from only the selected profile', async () => {
  const name = `export-${crypto.randomUUID()}`;
  const opened = await openTimelineIndexedDB({ databaseName: name });
  const tx = opened.connection.database.transaction(
    [TIMELINE_INDEXEDDB_STORES.events, TIMELINE_INDEXEDDB_STORES.quarantine],
    'readwrite',
  );
  for (let i = 0; i < 205; i++)
    await tx
      .objectStore(TIMELINE_INDEXEDDB_STORES.events)
      .put({ id: `e-${i}`, event: { id: `e-${i}` } });
  await tx
    .objectStore(TIMELINE_INDEXEDDB_STORES.quarantine)
    .put({ quarantineId: 'q-1', raw: { value: 123 } });
  await tx.done;
  opened.connection.close();
  const archive = await exportTimelineLocalData(name);
  assert.equal(archive.stores[TIMELINE_INDEXEDDB_STORES.events].length, 205);
  assert.equal(archive.stores[TIMELINE_INDEXEDDB_STORES.quarantine].length, 1);
  assert.equal(archive.scope, 'current-browser-profile');
  assert.equal(archive.version, 1);
  const other = await exportTimelineLocalData(`${name}-other`);
  assert.equal(other.stores[TIMELINE_INDEXEDDB_STORES.events].length, 0);
});
