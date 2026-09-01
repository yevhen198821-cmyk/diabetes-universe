import type { InsulinPresentationLabels } from '../medical/insulin';
import type { InsulinQuickAddSubmitRequest } from './insulin-quick-add-submit';
import {
  prepareInsulinQuickAddSubmit,
  serializeInsulinQuickAddRetryPayload,
  type InsulinQuickAddFormState,
  type InsulinQuickAddSubmitInvalidField,
} from './insulin-quick-add-submit';
import {
  clearQuickAddSubmitIdentity,
  createQuickAddSubmitIdentityState,
  reconcileQuickAddSubmitEventId,
  type QuickAddSubmitIdentityState,
} from './quick-add-submit-identity-model';

export type InsulinQuickAddSubmitIdentityState = QuickAddSubmitIdentityState;

export function createInsulinQuickAddSubmitIdentityState(): InsulinQuickAddSubmitIdentityState {
  return createQuickAddSubmitIdentityState();
}

export type PrepareInsulinQuickAddSubmitResult =
  | {
      readonly type: 'invalid';
      readonly field: InsulinQuickAddSubmitInvalidField;
    }
  | {
      readonly type: 'prepared';
      readonly request: InsulinQuickAddSubmitRequest;
    };

export interface PrepareInsulinQuickAddSubmitInput {
  readonly formState: InsulinQuickAddFormState;
  readonly identity: InsulinQuickAddSubmitIdentityState;
  readonly labels: InsulinPresentationLabels;
}

export interface PersistPreparedInsulinQuickAddSubmitInput {
  readonly identity: InsulinQuickAddSubmitIdentityState;
  readonly onSubmit: (request: InsulinQuickAddSubmitRequest) => Promise<void>;
  readonly request: InsulinQuickAddSubmitRequest;
}

export type PersistPreparedInsulinQuickAddSubmitResult =
  { readonly type: 'success' } | { readonly type: 'error' };

export function prepareInsulinQuickAddSubmitWithIdentity({
  formState,
  identity,
  labels,
}: PrepareInsulinQuickAddSubmitInput): PrepareInsulinQuickAddSubmitResult {
  const prepared = prepareInsulinQuickAddSubmit({ formState, labels });

  if (prepared.type === 'invalid') {
    return prepared;
  }

  const eventId = reconcileQuickAddSubmitEventId(
    identity,
    'insulin',
    prepared.entry.time,
    serializeInsulinQuickAddRetryPayload(prepared.entry),
  );

  return {
    request: { entry: prepared.entry, eventId },
    type: 'prepared',
  };
}

export async function persistPreparedInsulinQuickAddSubmit({
  identity,
  onSubmit,
  request,
}: PersistPreparedInsulinQuickAddSubmitInput): Promise<PersistPreparedInsulinQuickAddSubmitResult> {
  try {
    await onSubmit(request);
    clearQuickAddSubmitIdentity(identity);
    return { type: 'success' };
  } catch {
    return { type: 'error' };
  }
}

export function resetInsulinQuickAddSubmitIdentity(
  identity: InsulinQuickAddSubmitIdentityState,
): void {
  clearQuickAddSubmitIdentity(identity);
}
