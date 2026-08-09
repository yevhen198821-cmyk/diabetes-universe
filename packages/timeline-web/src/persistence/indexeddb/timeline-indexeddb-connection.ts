import type { IDBPDatabase } from 'idb';
import { TimelineRepositoryError } from '@diabetes-universe/timeline';

import type { TimelineBootstrapRuntimeState } from './timeline-indexeddb-bootstrap';

export type TimelineIndexedDbLifecyclePhase =
  'uninitialized' | 'migrating' | 'ready' | 'failed' | 'closed';

export interface TimelineIndexedDbConnection {
  readonly phase: TimelineIndexedDbLifecyclePhase;
  readonly bootstrapState: TimelineBootstrapRuntimeState;
  readonly database: IDBPDatabase;
  close(): void;
}

export function createTimelineIndexedDbConnection(
  database: IDBPDatabase,
  bootstrapState: TimelineBootstrapRuntimeState,
): TimelineIndexedDbConnection {
  let phase: TimelineIndexedDbLifecyclePhase =
    bootstrapState.phase === 'ready' ? 'ready' : 'failed';
  let closed = false;

  database.addEventListener('close', () => {
    if (!closed) {
      closed = true;
      phase = 'closed';
    }
  });

  return {
    get phase() {
      return phase;
    },
    get bootstrapState() {
      return bootstrapState;
    },
    get database() {
      if (closed || phase === 'closed') {
        throw new TimelineRepositoryError(
          'TIMELINE_REPOSITORY_NOT_INITIALIZED',
        );
      }

      return database;
    },
    close() {
      if (!closed) {
        closed = true;
        database.close();
        phase = 'closed';
      }
    },
  };
}
