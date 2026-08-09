import type { TimelineRepositoryErrorCode } from '@diabetes-universe/timeline';
import type {
  SemanticTimelineEvent,
  TimelineDiagnosticsSnapshot,
} from '@diabetes-universe/types';

import { cloneSemanticTimelineEvents } from '../semantic-timeline-clone';

export type TimelineStoreStatus = 'error' | 'loading' | 'ready';

export type TimelineStoreErrorCode = TimelineRepositoryErrorCode | 'TIMELINE_STORE_UNKNOWN_ERROR';

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
