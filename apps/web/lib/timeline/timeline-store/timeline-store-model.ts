import type {
  MigrationRecord,
  QuarantineRecord,
  SemanticTimelineEvent,
  TimelineDiagnosticsSnapshot,
} from '@diabetes-universe/types';

import { cloneSemanticTimelineEvents } from '../semantic-timeline-clone';

export type TimelineStoreStatus = 'error' | 'loading' | 'ready';

export type TimelineStoreErrorCode =
  | 'TIMELINE_REPOSITORY_INITIALIZE_FAILED'
  | 'TIMELINE_REPOSITORY_NOT_INITIALIZED'
  | 'TIMELINE_REPOSITORY_READ_FAILED'
  | 'TIMELINE_REPOSITORY_WRITE_FAILED'
  | 'TIMELINE_STORE_UNKNOWN_ERROR';

export interface TimelineMigrationStoreState {
  readonly migrationRecords: ReadonlyMap<string, MigrationRecord>;
  readonly quarantinedRecords: readonly QuarantineRecord[];
  readonly unsupportedSchemaCount: number;
}

export interface TimelineStoreState {
  readonly error?: string;
  readonly errorCode?: TimelineStoreErrorCode;
  readonly events: readonly SemanticTimelineEvent[];
  readonly migration: TimelineMigrationStoreState;
  readonly status: TimelineStoreStatus;
}

export type TimelineStoreAction =
  | {
      readonly type: 'setLoading';
    }
  | {
      readonly events: readonly SemanticTimelineEvent[];
      readonly migration: TimelineMigrationStoreState;
      readonly type: 'setReady';
    }
  | {
      readonly error?: string;
      readonly errorCode?: TimelineStoreErrorCode;
      readonly type: 'setError';
    };

export const initialTimelineMigrationStoreState: TimelineMigrationStoreState = {
  migrationRecords: new Map(),
  quarantinedRecords: [],
  unsupportedSchemaCount: 0,
};

export const initialTimelineStoreState: TimelineStoreState = {
  events: [],
  migration: initialTimelineMigrationStoreState,
  status: 'loading',
};

export function createReadyTimelineStoreState(
  events: readonly SemanticTimelineEvent[],
  migration: TimelineMigrationStoreState = initialTimelineMigrationStoreState,
): TimelineStoreState {
  return {
    events: cloneSemanticTimelineEvents(events),
    migration: {
      migrationRecords: new Map(migration.migrationRecords),
      quarantinedRecords: migration.quarantinedRecords.map((record) => ({
        ...record,
        preservedLegacy: { ...record.preservedLegacy },
        raw: { ...record.raw },
      })),
      unsupportedSchemaCount: migration.unsupportedSchemaCount,
    },
    status: 'ready',
  };
}

export function timelineStoreReducer(
  state: TimelineStoreState,
  action: TimelineStoreAction,
): TimelineStoreState {
  switch (action.type) {
    case 'setLoading':
      return initialTimelineStoreState;
    case 'setReady':
      return createReadyTimelineStoreState(action.events, action.migration);
    case 'setError':
      return {
        error: action.error?.trim() || undefined,
        errorCode: action.errorCode ?? 'TIMELINE_STORE_UNKNOWN_ERROR',
        events: state.events,
        migration: state.migration,
        status: 'error',
      };
  }
}

export function createTimelineDiagnosticsFromState(
  state: TimelineStoreState,
): TimelineDiagnosticsSnapshot {
  return {
    activeEventCount: state.events.length,
    migrationRecordCount: state.migration.migrationRecords.size,
    quarantinedCount: state.migration.quarantinedRecords.length,
    quarantinedRecords: state.migration.quarantinedRecords,
    unsupportedSchemaCount: state.migration.unsupportedSchemaCount,
  };
}
