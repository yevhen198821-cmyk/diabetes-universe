import type {
  SemanticTimelineEvent,
  TimelineDiagnosticsSnapshot,
} from '@diabetes-universe/types';

import { cloneSemanticTimelineEvents } from '../semantic-timeline-clone';
import { mergeTimelineRepositoryEvents } from './timeline-store-repository-reads';

export type TimelineStoreStatus = 'error' | 'loading' | 'ready';

export type TimelineStoreHistoryLoadStatus = 'idle' | 'loading';

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
  readonly hasMoreHistory: boolean;
  readonly historyLoadErrorCode?: TimelineStoreErrorCode;
  readonly historyLoadStatus: TimelineStoreHistoryLoadStatus;
  readonly nextCursor?: string;
  readonly status: TimelineStoreStatus;
}

export type TimelineStoreAction =
  | {
      readonly type: 'setLoading';
    }
  | {
      readonly events: readonly SemanticTimelineEvent[];
      readonly hasMoreHistory: boolean;
      readonly nextCursor?: string;
      readonly type: 'setReady';
    }
  | {
      readonly error?: string;
      readonly errorCode?: TimelineStoreErrorCode;
      readonly type: 'setError';
    }
  | {
      readonly type: 'setHistoryLoading';
    }
  | {
      readonly events: readonly SemanticTimelineEvent[];
      readonly hasMoreHistory: boolean;
      readonly nextCursor?: string;
      readonly type: 'appendHistoryPage';
    }
  | {
      readonly errorCode: TimelineStoreErrorCode;
      readonly type: 'setHistoryLoadError';
    }
  | {
      readonly event: SemanticTimelineEvent;
      readonly type: 'upsertEvent';
    }
  | {
      readonly eventId: string;
      readonly type: 'removeEvent';
    }
  | {
      readonly events: readonly SemanticTimelineEvent[];
      readonly hasMoreHistory: boolean;
      readonly nextCursor?: string;
      readonly type: 'replaceLoadedEvents';
    };

export const initialTimelineStoreState: TimelineStoreState = {
  events: [],
  hasMoreHistory: false,
  historyLoadStatus: 'idle',
  status: 'loading',
};

export function createReadyTimelineStoreState(
  events: readonly SemanticTimelineEvent[],
  pagination: {
    readonly hasMoreHistory: boolean;
    readonly nextCursor?: string;
  } = { hasMoreHistory: false },
): TimelineStoreState {
  return {
    events: cloneSemanticTimelineEvents(events),
    hasMoreHistory: pagination.hasMoreHistory,
    historyLoadErrorCode: undefined,
    historyLoadStatus: 'idle',
    nextCursor: pagination.nextCursor,
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
      return createReadyTimelineStoreState(action.events, {
        hasMoreHistory: action.hasMoreHistory,
        nextCursor: action.nextCursor,
      });
    case 'setError':
      return {
        error: action.error?.trim() || undefined,
        errorCode: action.errorCode ?? 'TIMELINE_STORE_UNKNOWN_ERROR',
        events: state.events,
        hasMoreHistory: state.hasMoreHistory,
        historyLoadErrorCode: state.historyLoadErrorCode,
        historyLoadStatus: 'idle',
        nextCursor: state.nextCursor,
        status: 'error',
      };
    case 'setHistoryLoading':
      return {
        ...state,
        historyLoadErrorCode: undefined,
        historyLoadStatus: 'loading',
      };
    case 'appendHistoryPage':
      return {
        ...state,
        events: cloneSemanticTimelineEvents(
          mergeTimelineRepositoryEvents(state.events, action.events),
        ),
        hasMoreHistory: action.hasMoreHistory,
        historyLoadErrorCode: undefined,
        historyLoadStatus: 'idle',
        nextCursor: action.nextCursor,
        status: 'ready',
      };
    case 'setHistoryLoadError':
      return {
        ...state,
        hasMoreHistory: false,
        historyLoadErrorCode: action.errorCode,
        historyLoadStatus: 'idle',
        nextCursor: undefined,
        status: 'ready',
      };
    case 'upsertEvent':
      return {
        ...state,
        error: undefined,
        errorCode: undefined,
        events: cloneSemanticTimelineEvents(
          mergeTimelineRepositoryEvents(state.events, [action.event]),
        ),
        status: 'ready',
      };
    case 'removeEvent':
      return {
        ...state,
        error: undefined,
        errorCode: undefined,
        events: state.events.filter((event) => event.id !== action.eventId),
        status: 'ready',
      };
    case 'replaceLoadedEvents':
      return createReadyTimelineStoreState(action.events, {
        hasMoreHistory: action.hasMoreHistory,
        nextCursor: action.nextCursor,
      });
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
