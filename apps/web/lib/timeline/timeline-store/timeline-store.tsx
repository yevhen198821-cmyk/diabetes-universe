'use client';

import {
  TimelineRepositoryError,
  createInMemoryTimelineRepository,
  type TimelineRepository,
  type TimelineRepositoryMutationResult,
} from '@diabetes-universe/timeline';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { timelineEvents as demoTimelineEvents } from '../../mocks/timeline';
import { cloneSemanticTimelineEvents } from '../semantic-timeline-clone';
import {
  createTimelineDiagnosticsFromState,
  getMigrationRecord,
  initialTimelineStoreState,
  timelineStoreReducer,
  type TimelineStoreErrorCode,
  type TimelineStoreStatus,
} from './timeline-store-model';

export interface TimelineStoreValue {
  readonly addEvent: (event: SemanticTimelineEvent) => void;
  readonly deleteEvent: (eventId: string) => void;
  readonly diagnostics: ReturnType<typeof createTimelineDiagnosticsFromState>;
  readonly error?: string;
  readonly events: readonly SemanticTimelineEvent[];
  readonly getMigrationRecord: typeof getMigrationRecord;
  readonly replaceEvents: (events: readonly SemanticTimelineEvent[]) => void;
  readonly status: TimelineStoreStatus;
  readonly updateEvent: (event: SemanticTimelineEvent) => void;
}

interface TimelineStoreProviderProps {
  readonly children: ReactNode;
  readonly initialEvents?: readonly SemanticTimelineEvent[];
  readonly repository?: TimelineRepository;
}

const TimelineStoreContext = createContext<TimelineStoreValue | null>(null);

function createDefaultTimelineRepository(
  initialEvents: readonly SemanticTimelineEvent[],
): TimelineRepository {
  return createInMemoryTimelineRepository({ seedEvents: initialEvents });
}

function resolveTimelineStoreErrorCode(error: unknown): TimelineStoreErrorCode {
  if (error instanceof TimelineRepositoryError) {
    return error.code;
  }

  return 'TIMELINE_STORE_UNKNOWN_ERROR';
}

export function TimelineStoreProvider({
  children,
  initialEvents = demoTimelineEvents,
  repository,
}: TimelineStoreProviderProps) {
  const isMountedRef = useRef(false);
  const operationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [timelineRepository] = useState<TimelineRepository>(
    () => repository ?? createDefaultTimelineRepository(initialEvents),
  );
  const [state, dispatch] = useReducer(
    timelineStoreReducer,
    initialTimelineStoreState,
  );

  const dispatchReadySnapshot = useCallback(() => {
    dispatch({
      events: cloneSemanticTimelineEvents(
        timelineRepository.getSnapshot().events,
      ),
      type: 'setReady',
    });
  }, [timelineRepository]);

  const dispatchRepositoryError = useCallback((error: unknown) => {
    dispatch({
      errorCode: resolveTimelineStoreErrorCode(error),
      type: 'setError',
    });
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    dispatch({ type: 'setLoading' });

    const initializeOperation = operationQueueRef.current
      .then(async () => {
        await timelineRepository.initialize();

        if (isMountedRef.current) {
          dispatchReadySnapshot();
        }
      })
      .catch((error: unknown) => {
        if (isMountedRef.current) {
          dispatchRepositoryError(error);
        }
      });

    operationQueueRef.current = initializeOperation;

    return () => {
      isMountedRef.current = false;
    };
  }, [dispatchReadySnapshot, dispatchRepositoryError, timelineRepository]);

  const enqueueRepositoryMutation = useCallback(
    (mutation: () => Promise<TimelineRepositoryMutationResult>): void => {
      const mutationOperation = operationQueueRef.current
        .then(async () => {
          const result = await mutation();

          if (isMountedRef.current && result.status === 'applied') {
            dispatchReadySnapshot();
          }
        })
        .catch((error: unknown) => {
          if (isMountedRef.current) {
            dispatchRepositoryError(error);
          }
        });

      operationQueueRef.current = mutationOperation;
    },
    [dispatchReadySnapshot, dispatchRepositoryError],
  );

  const addEvent = useCallback(
    (event: SemanticTimelineEvent) => {
      enqueueRepositoryMutation(() => timelineRepository.addEvent(event));
    },
    [enqueueRepositoryMutation, timelineRepository],
  );

  const updateEvent = useCallback(
    (event: SemanticTimelineEvent) => {
      enqueueRepositoryMutation(() => timelineRepository.updateEvent(event));
    },
    [enqueueRepositoryMutation, timelineRepository],
  );

  const deleteEvent = useCallback(
    (eventId: string) => {
      enqueueRepositoryMutation(() => timelineRepository.deleteEvent(eventId));
    },
    [enqueueRepositoryMutation, timelineRepository],
  );

  const replaceEvents = useCallback(
    (events: readonly SemanticTimelineEvent[]) => {
      enqueueRepositoryMutation(() => timelineRepository.replaceEvents(events));
    },
    [enqueueRepositoryMutation, timelineRepository],
  );

  const diagnostics = useMemo(
    () => createTimelineDiagnosticsFromState(state),
    [state],
  );

  const value = useMemo<TimelineStoreValue>(
    () => ({
      addEvent,
      deleteEvent,
      diagnostics,
      error: state.error,
      events: state.events,
      getMigrationRecord,
      replaceEvents,
      status: state.status,
      updateEvent,
    }),
    [
      addEvent,
      deleteEvent,
      diagnostics,
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
