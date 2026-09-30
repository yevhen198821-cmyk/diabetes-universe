import { IndexedDbTimelineRepository } from '../persistence/indexeddb/timeline-indexeddb-repository';
import { openTimelineIndexedDB } from '../persistence/indexeddb/timeline-indexeddb-open';
import { createTimelineAdoptionLocalStore } from './timeline-adoption-local-store';
import {
  TimelineAdoptionOrchestrator,
  type TimelineAdoptionTransport,
} from './timeline-adoption-orchestrator';

async function run(databaseName: string, transport: TimelineAdoptionTransport) {
  const opened = await openTimelineIndexedDB({ databaseName });
  const repository = new IndexedDbTimelineRepository({ databaseName });
  try {
    await repository.initialize();
    return await new TimelineAdoptionOrchestrator({
      repository,
      localStore: createTimelineAdoptionLocalStore(opened.connection.database),
      transport,
    }).run();
  } finally {
    repository.close();
    opened.connection.close();
  }
}

export async function runTimelineLocalAdoption(
  databaseName: string,
  transport: TimelineAdoptionTransport,
) {
  if (!globalThis.navigator?.locks) throw new Error('SYNC_LOCK_UNAVAILABLE');
  return navigator.locks.request(`du-sync:${databaseName}`, () =>
    run(databaseName, transport),
  );
}
