'use client';

import {
  TimelineRepositoryError,
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
  type ReactNode,
} from 'react';

import { cloneSemanticTimelineEvents } from '../semantic-timeline-clone';
import { createWebTimelineRepository } from '../create-web-timeline-repository';
import {
  createTimelineDiagnosticsFromState,
  initialTimelineStoreState,
  timelineStoreReducer,
  type TimelineStoreErrorCode,
  type TimelineStoreHistoryLoadStatus,
  type TimelineStoreStatus,
} from './timeline-store-model';
import {
  loadTimelineRepositoryFirstPage,
  loadTimelineRepositoryNextPage,
} from './timeline-store-repository-reads';

export interface TimelineStoreValue {
  readonly addEvent: (event: SemanticTimelineEvent) => void;
  readonly deleteEvent: (eventId: string) => void;
  readonly diagnostics: ReturnType<typeof createTimelineDiagnosticsFromState>;
  readonly error?: string;
  readonly events: readonly SemanticTimelineEvent[];
  readonly hasMoreHistory: boolean;
  readonly historyLoadErrorCode?: TimelineStoreErrorCode;
  readonly historyLoadStatus: TimelineStoreHistoryLoadStatus;
  readonly loadMoreHistory: () => void;
  readonly replaceEvents: (events: readonly SemanticTimelineEvent[]) => void;
  readonly status: TimelineStoreStatus;
  readonly updateEvent: (event: SemanticTimelineEvent) => void;
}

interface TimelineStoreProviderProps {
  readonly children: ReactNode;
  readonly repository?: TimelineRepository;
}

const TimelineStoreContext = createContext<TimelineStoreValue | null>(null);

function resolveTimelineStoreErrorCode(error: unknown): TimelineStoreErrorCode {
  if (error instanceof TimelineRepositoryError) {
    return error.code;
  }

  return 'TIMELINE_STORE_UNKNOWN_ERROR';
}

export function TimelineStoreProvider({
  children,
  repository: repositoryOverride,
}: TimelineStoreProviderProps) {
  const isMountedRef = useRef(false);
  const operationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const timelineRepository = useMemo(
    () => repositoryOverride ?? createWebTimelineRepository(),
    [repositoryOverride],
  );
  const [state, dispatch] = useReducer(
    timelineStoreReducer,
    initialTimelineStoreState,
  );

  const dispatchReadySnapshot = useCallback(async () => {
    const page = await loadTimelineRepositoryFirstPage(timelineRepository);

    if (isMountedRef.current) {
      dispatch({
        events: cloneSemanticTimelineEvents(page.events),
        hasMoreHistory: page.hasMoreHistory,
        nextCursor: page.nextCursor,
        type: 'setReady',
      });
    }
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
          await dispatchReadySnapshot();
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
    (
      mutation: () => Promise<TimelineRepositoryMutationResult>,
      onApplied?: () => void,
    ): void => {
      const mutationOperation = operationQueueRef.current
        .then(async () => {
          const result = await mutation();

          if (isMountedRef.current && result.status === 'applied') {
            onApplied?.();
          }
        })
        .catch((error: unknown) => {
          if (isMountedRef.current) {
            dispatchRepositoryError(error);
          }
        });

      operationQueueRef.current = mutationOperation;
    },
    [dispatchRepositoryError],
  );

  const loadMoreHistory = useCallback(() => {
    if (
      state.historyLoadStatus === 'loading' ||
      !state.hasMoreHistory ||
      state.nextCursor === undefined
    ) {
      return;
    }

    const cursor = state.nextCursor;
    const loadOperation = operationQueueRef.current
      .then(async () => {
        if (!isMountedRef.current) {
          return;
        }

        dispatch({ type: 'setHistoryLoading' });

        try {
          const page = await loadTimelineRepositoryNextPage(
            timelineRepository,
            cursor,
          );

          if (!isMountedRef.current) {
            return;
          }

          dispatch({
            events: page.events,
            hasMoreHistory: page.hasMoreHistory,
            nextCursor: page.nextCursor,
            type: 'appendHistoryPage',
          });
        } catch (error: unknown) {
          if (!isMountedRef.current) {
            return;
          }

          const errorCode = resolveTimelineStoreErrorCode(error);
          dispatch({
            errorCode,
            type: 'setHistoryLoadError',
          });
        }
      })
      .catch((error: unknown) => {
        if (isMountedRef.current) {
          dispatchRepositoryError(error);
        }
      });

    operationQueueRef.current = loadOperation;
  }, [
    dispatchRepositoryError,
    state.hasMoreHistory,
    state.historyLoadStatus,
    state.nextCursor,
    timelineRepository,
  ]);

  const addEvent = useCallback(
    (event: SemanticTimelineEvent) => {
      enqueueRepositoryMutation(
        () => timelineRepository.addEvent(event),
        () => {
          dispatch({ event, type: 'upsertEvent' });
        },
      );
    },
    [enqueueRepositoryMutation, timelineRepository],
  );

  const updateEvent = useCallback(
    (event: SemanticTimelineEvent) => {
      enqueueRepositoryMutation(
        () => timelineRepository.updateEvent(event),
        () => {
          dispatch({ event, type: 'upsertEvent' });
        },
      );
    },
    [enqueueRepositoryMutation, timelineRepository],
  );

  const deleteEvent = useCallback(
    (eventId: string) => {
      enqueueRepositoryMutation(
        () => timelineRepository.deleteEvent(eventId),
        () => {
          dispatch({ eventId, type: 'removeEvent' });
        },
      );
    },
    [enqueueRepositoryMutation, timelineRepository],
  );

  const replaceEvents = useCallback(
    (events: readonly SemanticTimelineEvent[]) => {
      enqueueRepositoryMutation(
        () => timelineRepository.replaceEvents(events),
        () => {
          void dispatchReadySnapshot();
        },
      );
    },
    [dispatchReadySnapshot, enqueueRepositoryMutation, timelineRepository],
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
      hasMoreHistory: state.hasMoreHistory,
      historyLoadErrorCode: state.historyLoadErrorCode,
      historyLoadStatus: state.historyLoadStatus,
      loadMoreHistory,
      replaceEvents,
      status: state.status,
      updateEvent,
    }),
    [
      addEvent,
      deleteEvent,
      diagnostics,
      loadMoreHistory,
      replaceEvents,
      state.error,
      state.events,
      state.hasMoreHistory,
      state.historyLoadErrorCode,
      state.historyLoadStatus,
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
