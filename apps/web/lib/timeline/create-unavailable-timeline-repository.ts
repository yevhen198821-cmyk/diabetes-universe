import {
  TimelineRepositoryError,
  type TimelineRepository,
} from '@diabetes-universe/timeline';

/** An unresolved owner may render empty reads, but must never accept writes. */
export function createUnavailableTimelineRepository(
  onWriteAttempt?: () => void,
): TimelineRepository {
  const rejectWrite = async (): Promise<never> => {
    onWriteAttempt?.();
    throw new TimelineRepositoryError(
      'TIMELINE_REPOSITORY_STORAGE_UNAVAILABLE',
    );
  };

  return {
    initialize: async () => {},
    getSnapshot: () => ({ events: [] }),
    getById: async () => null,
    queryEvents: async () => ({ events: [] }),
    addEvent: rejectWrite,
    updateEvent: rejectWrite,
    deleteEvent: rejectWrite,
    replaceEvents: rejectWrite,
  };
}
