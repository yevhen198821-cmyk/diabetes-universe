import type { ActivityQuickAddSubmitRequest } from './activity-quick-add-submit';
import {
  prepareActivityQuickAddSubmit,
  serializeActivityQuickAddRetryPayload,
  type ActivityQuickAddFormState,
  type ActivityQuickAddSubmitInvalidField,
} from './activity-quick-add-submit';
import {
  clearQuickAddSubmitIdentity,
  createQuickAddSubmitIdentityState,
  reconcileQuickAddSubmitEventId,
  type QuickAddSubmitIdentityState,
} from './quick-add-submit-identity-model';

export type ActivityQuickAddSubmitIdentityState = QuickAddSubmitIdentityState;

export function createActivityQuickAddSubmitIdentityState(): ActivityQuickAddSubmitIdentityState {
  return createQuickAddSubmitIdentityState();
}

export type PrepareActivityQuickAddSubmitResult =
  | {
      readonly type: 'invalid';
      readonly field: ActivityQuickAddSubmitInvalidField;
      readonly message?: string;
    }
  | {
      readonly type: 'prepared';
      readonly request: ActivityQuickAddSubmitRequest;
    };

export function prepareActivityQuickAddSubmitWithIdentity(input: {
  readonly formState: ActivityQuickAddFormState;
  readonly identity: ActivityQuickAddSubmitIdentityState;
}): PrepareActivityQuickAddSubmitResult {
  const prepared = prepareActivityQuickAddSubmit(input.formState);

  if (prepared.type === 'invalid') {
    return prepared;
  }

  const eventId = reconcileQuickAddSubmitEventId(
    input.identity,
    'activity',
    prepared.entry.time,
    serializeActivityQuickAddRetryPayload(prepared.entry),
  );

  return {
    request: { entry: prepared.entry, eventId },
    type: 'prepared',
  };
}

export async function persistPreparedActivityQuickAddSubmit(input: {
  readonly identity: ActivityQuickAddSubmitIdentityState;
  readonly onSubmit: (request: ActivityQuickAddSubmitRequest) => Promise<void>;
  readonly request: ActivityQuickAddSubmitRequest;
}): Promise<{ readonly type: 'success' } | { readonly type: 'error' }> {
  try {
    await input.onSubmit(input.request);
    clearQuickAddSubmitIdentity(input.identity);
    return { type: 'success' };
  } catch {
    return { type: 'error' };
  }
}

export function resetActivityQuickAddSubmitIdentity(
  identity: ActivityQuickAddSubmitIdentityState,
): void {
  clearQuickAddSubmitIdentity(identity);
}
