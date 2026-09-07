import type { NoteQuickAddEntry } from '@diabetes-universe/types';

import { validateNoteQuickAddEntry } from './validate-note-quick-add';

export interface NoteQuickAddSubmitRequest {
  readonly entry: NoteQuickAddEntry;
  readonly eventId: string;
}

export interface NoteQuickAddFormState {
  readonly text: string;
  readonly time: string;
  readonly title: string;
}

export type NoteQuickAddSubmitInvalidField = 'text' | 'time' | 'title';

export type NoteQuickAddSubmitResult =
  | {
      readonly type: 'prepared';
      readonly entry: NoteQuickAddEntry;
    }
  | {
      readonly type: 'invalid';
      readonly field: NoteQuickAddSubmitInvalidField;
      readonly message?: string;
    };

export function prepareNoteQuickAddSubmit(
  formState: NoteQuickAddFormState,
): NoteQuickAddSubmitResult {
  const entry: NoteQuickAddEntry = {
    text: formState.text,
    time: formState.time,
    title: formState.title.trim() || undefined,
  };
  const validationError = validateNoteQuickAddEntry(entry);

  if (validationError) {
    if (validationError.includes('Заголовок')) {
      return { field: 'title', message: validationError, type: 'invalid' };
    }

    if (formState.time.trim().length === 0) {
      return { field: 'time', message: validationError, type: 'invalid' };
    }

    return { field: 'text', message: validationError, type: 'invalid' };
  }

  return { entry, type: 'prepared' };
}

export function serializeNoteQuickAddRetryPayload(
  entry: NoteQuickAddEntry,
): string {
  return JSON.stringify({
    text: entry.text.trim(),
    time: entry.time,
    title: entry.title ?? '',
  });
}
