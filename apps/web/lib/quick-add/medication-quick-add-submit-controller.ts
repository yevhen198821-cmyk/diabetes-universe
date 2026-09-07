import type { MedicationQuickAddSubmitRequest } from './medication-quick-add-submit';
import {
  prepareMedicationQuickAddSubmit,
  serializeMedicationQuickAddRetryPayload,
  type MedicationQuickAddFormState,
  type MedicationQuickAddSubmitInvalidField,
} from './medication-quick-add-submit';
import {
  clearQuickAddSubmitIdentity,
  createQuickAddSubmitIdentityState,
  reconcileQuickAddSubmitEventId,
  type QuickAddSubmitIdentityState,
} from './quick-add-submit-identity-model';

export type MedicationQuickAddSubmitIdentityState = QuickAddSubmitIdentityState;

export function createMedicationQuickAddSubmitIdentityState(): MedicationQuickAddSubmitIdentityState {
  return createQuickAddSubmitIdentityState();
}

export type PrepareMedicationQuickAddSubmitResult =
  | {
      readonly type: 'invalid';
      readonly field: MedicationQuickAddSubmitInvalidField;
    }
  | {
      readonly type: 'prepared';
      readonly request: MedicationQuickAddSubmitRequest;
    };

export function prepareMedicationQuickAddSubmitWithIdentity(input: {
  readonly formState: MedicationQuickAddFormState;
  readonly identity: MedicationQuickAddSubmitIdentityState;
}): PrepareMedicationQuickAddSubmitResult {
  const prepared = prepareMedicationQuickAddSubmit(input.formState);

  if (prepared.type === 'invalid') {
    return prepared;
  }

  const eventId = reconcileQuickAddSubmitEventId(
    input.identity,
    'medication',
    prepared.entry.time,
    serializeMedicationQuickAddRetryPayload(prepared.entry),
  );

  return {
    request: { entry: prepared.entry, eventId },
    type: 'prepared',
  };
}

export async function persistPreparedMedicationQuickAddSubmit(input: {
  readonly identity: MedicationQuickAddSubmitIdentityState;
  readonly onSubmit: (
    request: MedicationQuickAddSubmitRequest,
  ) => Promise<void>;
  readonly request: MedicationQuickAddSubmitRequest;
}): Promise<{ readonly type: 'success' } | { readonly type: 'error' }> {
  try {
    await input.onSubmit(input.request);
    clearQuickAddSubmitIdentity(input.identity);
    return { type: 'success' };
  } catch {
    return { type: 'error' };
  }
}

export function resetMedicationQuickAddSubmitIdentity(
  identity: MedicationQuickAddSubmitIdentityState,
): void {
  clearQuickAddSubmitIdentity(identity);
}
