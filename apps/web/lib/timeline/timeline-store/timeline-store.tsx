'use client';

import type { TimelineEvent } from '@diabetes-universe/types';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import { timelineEvents as demoTimelineEvents } from '../../mocks/timeline';
import {
  createReadyTimelineStoreState,
  timelineStoreReducer,
  type TimelineStoreStatus,
} from './timeline-store-model';

export interface TimelineStoreValue {
  readonly addEvent: (event: TimelineEvent) => void;
  readonly deleteEvent: (eventId: string) => void;
  readonly error?: string;
  readonly events: readonly TimelineEvent[];
  readonly replaceEvents: (events: readonly TimelineEvent[]) => void;
  readonly status: TimelineStoreStatus;
  readonly updateEvent: (event: TimelineEvent) => void;
}

interface TimelineStoreProviderProps {
  readonly children: ReactNode;
  readonly initialEvents?: readonly TimelineEvent[];
}

const TimelineStoreContext = createContext<TimelineStoreValue | null>(null);

export function TimelineStoreProvider({
  children,
  initialEvents = demoTimelineEvents,
}: TimelineStoreProviderProps) {
  const [state, dispatch] = useReducer(
    timelineStoreReducer,
    initialEvents,
    createReadyTimelineStoreState,
  );

  const addEvent = useCallback((event: TimelineEvent) => {
    dispatch({ event, type: 'add' });
  }, []);

  const updateEvent = useCallback((event: TimelineEvent) => {
    dispatch({ event, type: 'update' });
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    dispatch({ eventId, type: 'delete' });
  }, []);

  const replaceEvents = useCallback((events: readonly TimelineEvent[]) => {
    dispatch({ events, type: 'replace' });
  }, []);

  const value = useMemo<TimelineStoreValue>(
    () => ({
      addEvent,
      deleteEvent,
      error: state.error,
      events: state.events,
      replaceEvents,
      status: state.status,
      updateEvent,
    }),
    [
      addEvent,
      deleteEvent,
      replaceEvents,
      state.error,
      state.events,
      state.status,
      updateEvent,
    ],
  );

  return (
    <TimelineStoreContext.Provider value={value}>
      {children}
    </TimelineStoreContext.Provider>
  );
}

export function useTimelineStore(): TimelineStoreValue {
  const store = useContext(TimelineStoreContext);

  if (!store) {
    throw new Error(
      'useTimelineStore must be used within TimelineStoreProvider',
    );
  }

  return store;
}
