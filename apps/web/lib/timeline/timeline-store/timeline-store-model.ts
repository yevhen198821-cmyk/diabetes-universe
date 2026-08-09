import type {
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
  | 'TIMELINE_REPOSITORY_STORAGE_UNAVAILABLE'
  | 'TIMELINE_REPOSITORY_STORAGE_OPEN_BLOCKED'
  | 'TIMELINE_REPOSITORY_STORAGE_QUOTA_EXCEEDED'
  | 'TIMELINE_REPOSITORY_SCHEMA_UPGRADE_FAILED'
  | 'TIMELINE_REPOSITORY_INVALID_CURSOR'
  | 'TIMELINE_REPOSITORY_QUARANTINE_FAILED'
  | 'TIMELINE_REPOSITORY_BOOTSTRAP_INCONSISTENT'
  | 'TIMELINE_STORE_UNKNOWN_ERROR';

export interface TimelineStoreState {
  readonly error?: string;
  readonly errorCode?: TimelineStoreErrorCode;
  readonly events: readonly SemanticTimelineEvent[];
  readonly status: TimelineStoreStatus;
}

export type TimelineStoreAction =
  | {
      readonly type: 'setLoading';
    }
  | {
      readonly events: readonly SemanticTimelineEvent[];
      readonly type: 'setReady';
    }
  | {
      readonly error?: string;
      readonly errorCode?: TimelineStoreErrorCode;
      readonly type: 'setError';
    };

export const initialTimelineStoreState: TimelineStoreState = {
  events: [],
  status: 'loading',
};

export function createReadyTimelineStoreState(
  events: readonly SemanticTimelineEvent[],
): TimelineStoreState {
  return {
    events: cloneSemanticTimelineEvents(events),
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
      return createReadyTimelineStoreState(action.events);
    case 'setError':
      return {
        error: action.error?.trim() || undefined,
        errorCode: action.errorCode ?? 'TIMELINE_STORE_UNKNOWN_ERROR',
        events: state.events,
        status: 'error',
      };
  }
}

export function createTimelineDiagnosticsFromState(
  state: TimelineStoreState,
): TimelineDiagnosticsSnapshot {
  return {
    activeEventCount: state.events.length,
    migrationRecordCount: 0,
    quarantinedCount: 0,
    quarantinedRecords: [],
    unsupportedSchemaCount: 0,
  };
}
