'use client';

import {
  TimelineRepositoryError,
  createInMemoryTimelineRepository,
  type TimelineRepository,
  type TimelineRepositoryMutationResult,
} from '@diabetes-universe/timeline';
import type {
  MigrationRecord,
  SemanticTimelineEvent,
  TimelineDiagnosticsSnapshot,
  TimelineEvent,
} from '@diabetes-universe/types';
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
import { liftRepositorySnapshot } from '../migration/lift-repository-snapshot';
import {
  initialTimelineMigrationStoreState,
  initialTimelineStoreState,
  createTimelineDiagnosticsFromState,
  timelineStoreReducer,
  type TimelineMigrationStoreState,
  type TimelineStoreErrorCode,
  type TimelineStoreStatus,
} from './timeline-store-model';

export interface TimelineStoreValue {
  /**
   * Temporary P3c compatibility bridge.
   *
   * Quick Add still creates legacy `TimelineEvent` records. Repository writes
   * remain legacy until P3e introduces the semantic write path. Application
   * state is refreshed from lifted semantic snapshots after each mutation.
   */
  readonly addEvent: (event: TimelineEvent) => void;
  readonly deleteEvent: (eventId: string) => void;
  readonly diagnostics: TimelineDiagnosticsSnapshot;
  readonly error?: string;
  readonly events: readonly SemanticTimelineEvent[];
  readonly getMigrationRecord: (eventId: string) => MigrationRecord | undefined;
  readonly replaceEvents: (events: readonly TimelineEvent[]) => void;
  readonly status: TimelineStoreStatus;
  readonly updateEvent: (event: TimelineEvent) => void;
}

interface TimelineStoreProviderProps {
  readonly children: ReactNode;
  readonly initialEvents?: readonly TimelineEvent[];
  readonly repository?: TimelineRepository;
}

const TimelineStoreContext = createContext<TimelineStoreValue | null>(null);

function createDefaultTimelineRepository(
  initialEvents: readonly TimelineEvent[],
): TimelineRepository {
  return createInMemoryTimelineRepository({ seedEvents: initialEvents });
}

function resolveTimelineStoreErrorCode(error: unknown): TimelineStoreErrorCode {
  if (error instanceof TimelineRepositoryError) {
    return error.code;
  }

  return 'TIMELINE_STORE_UNKNOWN_ERROR';
}

function createMigrationContext(migratedAt: string) {
  return { migratedAt };
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
  const migrationStateRef = useRef<TimelineMigrationStoreState>(
    initialTimelineMigrationStoreState,
  );

  const dispatchReadySnapshot = useCallback(() => {
    const migratedAt = new Date().toISOString();
    const previousEvidence = migrationStateRef.current;
    const lifted = liftRepositorySnapshot(
      timelineRepository.getSnapshot().events,
      createMigrationContext(migratedAt),
      {
        migrationRecords: previousEvidence.migrationRecords,
        quarantinedRecords: previousEvidence.quarantinedRecords,
      },
    );
    const migration = {
      migrationRecords: lifted.migrationRecords,
      quarantinedRecords: lifted.quarantinedRecords,
      unsupportedSchemaCount: lifted.unsupportedSchemaCount,
    };

    migrationStateRef.current = migration;

    dispatch({
      events: lifted.events,
      migration,
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
    (event: TimelineEvent) => {
      enqueueRepositoryMutation(() => timelineRepository.addEvent(event));
    },
    [enqueueRepositoryMutation, timelineRepository],
  );

  const updateEvent = useCallback(
    (event: TimelineEvent) => {
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
    (events: readonly TimelineEvent[]) => {
      enqueueRepositoryMutation(() => timelineRepository.replaceEvents(events));
    },
    [enqueueRepositoryMutation, timelineRepository],
  );

  const diagnostics = useMemo(
    () => createTimelineDiagnosticsFromState(state),
    [state],
  );

  const getMigrationRecord = useCallback(
    (eventId: string) => state.migration.migrationRecords.get(eventId),
    [state.migration.migrationRecords],
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
      getMigrationRecord,
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
