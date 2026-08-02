import type { TimelineEvent } from '@diabetes-universe/types';

import { sortTimelineEvents } from '../timeline-date-time';

export type TimelineStoreStatus = 'error' | 'loading' | 'ready';

export interface TimelineStoreState {
  readonly error?: string;
  readonly events: readonly TimelineEvent[];
  readonly status: TimelineStoreStatus;
}

export type TimelineStoreAction =
  | {
      readonly events: readonly TimelineEvent[];
      readonly type: 'initialize';
    }
  | {
      readonly event: TimelineEvent;
      readonly type: 'add';
    }
  | {
      readonly event: TimelineEvent;
      readonly type: 'update';
    }
  | {
      readonly eventId: string;
      readonly type: 'delete';
    }
  | {
      readonly events: readonly TimelineEvent[];
      readonly type: 'replace';
    }
  | {
      readonly error: string;
      readonly type: 'setError';
    };

export const initialTimelineStoreState: TimelineStoreState = {
  events: [],
  status: 'loading',
};

function normalizeEvents(
  events: readonly TimelineEvent[],
): readonly TimelineEvent[] {
  const byId = new Map<string, TimelineEvent>();

  for (const event of events) {
    byId.set(event.id, event);
  }

  return sortTimelineEvents([...byId.values()]);
}

function replaceEventById(
  events: readonly TimelineEvent[],
  event: TimelineEvent,
): readonly TimelineEvent[] {
  return normalizeEvents(
    events.map((currentEvent) =>
      currentEvent.id === event.id ? event : currentEvent,
    ),
  );
}

export function createReadyTimelineStoreState(
  events: readonly TimelineEvent[],
): TimelineStoreState {
  return {
    events: normalizeEvents(events),
    status: 'ready',
  };
}

export function timelineStoreReducer(
  state: TimelineStoreState,
  action: TimelineStoreAction,
): TimelineStoreState {
  switch (action.type) {
    case 'initialize':
    case 'replace':
      return createReadyTimelineStoreState(action.events);
    case 'add':
      return {
        events: normalizeEvents([...state.events, action.event]),
        status: 'ready',
      };
    case 'update': {
      if (!state.events.some((event) => event.id === action.event.id)) {
        return state;
      }

      return {
        events: replaceEventById(state.events, action.event),
        status: 'ready',
      };
    }
    case 'delete': {
      if (!state.events.some((event) => event.id === action.eventId)) {
        return state;
      }

      return {
        events: state.events.filter((event) => event.id !== action.eventId),
        status: 'ready',
      };
    }
    case 'setError':
      return {
        error: action.error.trim() || 'Unknown Timeline store error.',
        events: state.events,
        status: 'error',
      };
  }
}
