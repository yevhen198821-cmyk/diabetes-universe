import type { TimelineEvent } from '@diabetes-universe/types';

export type TimelineStoreStatus = 'error' | 'loading' | 'ready';

export type TimelineStoreErrorCode =
  | 'TIMELINE_REPOSITORY_INITIALIZE_FAILED'
  | 'TIMELINE_REPOSITORY_NOT_INITIALIZED'
  | 'TIMELINE_REPOSITORY_READ_FAILED'
  | 'TIMELINE_REPOSITORY_WRITE_FAILED'
  | 'TIMELINE_STORE_UNKNOWN_ERROR';

export interface TimelineStoreState {
  readonly error?: string;
  readonly errorCode?: TimelineStoreErrorCode;
  readonly events: readonly TimelineEvent[];
  readonly status: TimelineStoreStatus;
}

export type TimelineStoreAction =
  | {
      readonly type: 'setLoading';
    }
  | {
      readonly events: readonly TimelineEvent[];
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

function cloneTimelineEvents(
  events: readonly TimelineEvent[],
): readonly TimelineEvent[] {
  return events.map((event) => ({ ...event }));
}

export function createReadyTimelineStoreState(
  events: readonly TimelineEvent[],
): TimelineStoreState {
  return {
    events: cloneTimelineEvents(events),
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
