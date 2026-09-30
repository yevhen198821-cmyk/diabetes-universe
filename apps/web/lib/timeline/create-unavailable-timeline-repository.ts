import {
  TimelineRepositoryError,
  type TimelineRepository,
} from '@diabetes-universe/timeline';

/** Unresolved ownership cannot publish a ready history or accept writes. */
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
    initialize: async () => {
      throw new TimelineRepositoryError(
        'TIMELINE_REPOSITORY_STORAGE_UNAVAILABLE',
      );
    },
    getSnapshot: () => ({ events: [] }),
    getById: async () => null,
    queryEvents: async () => ({ events: [] }),
    addEvent: rejectWrite,
    updateEvent: rejectWrite,
    deleteEvent: rejectWrite,
    replaceEvents: rejectWrite,
  };
}
