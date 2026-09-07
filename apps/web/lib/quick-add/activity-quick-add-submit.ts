import type { ActivityQuickAddEntry } from '@diabetes-universe/types';

import {
  parseActivityDurationInput,
  validateActivityQuickAddEntry,
} from './format-activity';

export interface ActivityQuickAddSubmitRequest {
  readonly entry: ActivityQuickAddEntry;
  readonly eventId: string;
}

export interface ActivityQuickAddFormState {
  readonly activityType: string;
  readonly duration: string;
  readonly note: string;
  readonly time: string;
}

export type ActivityQuickAddSubmitInvalidField =
  'activityType' | 'duration' | 'time';

export type ActivityQuickAddSubmitResult =
  | {
      readonly type: 'prepared';
      readonly entry: ActivityQuickAddEntry;
    }
  | {
      readonly type: 'invalid';
      readonly field: ActivityQuickAddSubmitInvalidField;
      readonly message?: string;
    };

export function prepareActivityQuickAddSubmit(
  formState: ActivityQuickAddFormState,
): ActivityQuickAddSubmitResult {
  if (formState.activityType.trim().length === 0) {
    return { field: 'activityType', type: 'invalid' };
  }

  if (formState.time.trim().length === 0) {
    return { field: 'time', type: 'invalid' };
  }

  const durationMinutes = parseActivityDurationInput(formState.duration);

  if (durationMinutes === null) {
    return { field: 'duration', type: 'invalid' };
  }

  const entry: ActivityQuickAddEntry = {
    activityType: formState.activityType,
    durationMinutes,
    note: formState.note.trim() || undefined,
    time: formState.time,
  };
  const validationError = validateActivityQuickAddEntry(entry);

  if (validationError) {
    return { field: 'duration', message: validationError, type: 'invalid' };
  }

  return { entry, type: 'prepared' };
}

export function serializeActivityQuickAddRetryPayload(
  entry: ActivityQuickAddEntry,
): string {
  return JSON.stringify({
    activityType: entry.activityType,
    durationMinutes: entry.durationMinutes,
    note: entry.note ?? '',
    time: entry.time,
  });
}
