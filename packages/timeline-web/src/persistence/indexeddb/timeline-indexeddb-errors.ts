import { TimelineRepositoryError } from '@diabetes-universe/timeline';

import { TimelineIndexedDbSchemaUpgradeError } from './timeline-indexeddb-upgrade';

export function normalizeIndexedDbOpenError(
  error: unknown,
): TimelineRepositoryError {
  if (error instanceof TimelineRepositoryError) {
    return error;
  }

  if (error instanceof TimelineIndexedDbSchemaUpgradeError) {
    return new TimelineRepositoryError(
      'TIMELINE_REPOSITORY_SCHEMA_UPGRADE_FAILED',
    );
  }

  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    if (error.name === 'QuotaExceededError') {
      return new TimelineRepositoryError(
        'TIMELINE_REPOSITORY_STORAGE_QUOTA_EXCEEDED',
      );
    }

    if (error.name === 'VersionError' || error.name === 'AbortError') {
      return new TimelineRepositoryError(
        'TIMELINE_REPOSITORY_SCHEMA_UPGRADE_FAILED',
      );
    }
  }

  if (error instanceof Error && error.message === 'indexedDB is not defined') {
    return new TimelineRepositoryError(
      'TIMELINE_REPOSITORY_STORAGE_UNAVAILABLE',
    );
  }

  return new TimelineRepositoryError('TIMELINE_REPOSITORY_INITIALIZE_FAILED');
}
