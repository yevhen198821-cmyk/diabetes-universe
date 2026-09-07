import type { NoteQuickAddSubmitRequest } from './note-quick-add-submit';
import {
  prepareNoteQuickAddSubmit,
  serializeNoteQuickAddRetryPayload,
  type NoteQuickAddFormState,
  type NoteQuickAddSubmitInvalidField,
} from './note-quick-add-submit';
import {
  clearQuickAddSubmitIdentity,
  createQuickAddSubmitIdentityState,
  reconcileQuickAddSubmitEventId,
  type QuickAddSubmitIdentityState,
} from './quick-add-submit-identity-model';

export type NoteQuickAddSubmitIdentityState = QuickAddSubmitIdentityState;

export function createNoteQuickAddSubmitIdentityState(): NoteQuickAddSubmitIdentityState {
  return createQuickAddSubmitIdentityState();
}

export type PrepareNoteQuickAddSubmitResult =
  | {
      readonly type: 'invalid';
      readonly field: NoteQuickAddSubmitInvalidField;
      readonly message?: string;
    }
  | {
      readonly type: 'prepared';
      readonly request: NoteQuickAddSubmitRequest;
    };

export function prepareNoteQuickAddSubmitWithIdentity(input: {
  readonly formState: NoteQuickAddFormState;
  readonly identity: NoteQuickAddSubmitIdentityState;
}): PrepareNoteQuickAddSubmitResult {
  const prepared = prepareNoteQuickAddSubmit(input.formState);

  if (prepared.type === 'invalid') {
    return prepared;
  }

  const eventId = reconcileQuickAddSubmitEventId(
    input.identity,
    'note',
    prepared.entry.time,
    serializeNoteQuickAddRetryPayload(prepared.entry),
  );

  return {
    request: { entry: prepared.entry, eventId },
    type: 'prepared',
  };
}

export async function persistPreparedNoteQuickAddSubmit(input: {
  readonly identity: NoteQuickAddSubmitIdentityState;
  readonly onSubmit: (request: NoteQuickAddSubmitRequest) => Promise<void>;
  readonly request: NoteQuickAddSubmitRequest;
}): Promise<{ readonly type: 'success' } | { readonly type: 'error' }> {
  try {
    await input.onSubmit(input.request);
    clearQuickAddSubmitIdentity(input.identity);
    return { type: 'success' };
  } catch {
    return { type: 'error' };
  }
}

export function resetNoteQuickAddSubmitIdentity(
  identity: NoteQuickAddSubmitIdentityState,
): void {
  clearQuickAddSubmitIdentity(identity);
}
