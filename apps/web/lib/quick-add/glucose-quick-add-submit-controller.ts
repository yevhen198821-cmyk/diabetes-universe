import type {
  GlucoseMeasurementContext,
  GlucoseQuickAddEntry,
} from '@diabetes-universe/types';

import { parseGlucoseInput } from './format-glucose';
import type { GlucoseQuickAddSubmitRequest } from './glucose-quick-add-submit';
import {
  beginGlucoseQuickAddSubmitEventId,
  clearGlucoseQuickAddSubmitIdentity,
  type GlucoseQuickAddSubmitIdentityState,
} from './glucose-quick-add-submit-model';

export interface GlucoseQuickAddFormState {
  readonly value: string;
  readonly time: string;
  readonly context: GlucoseMeasurementContext | undefined;
}

export interface ExecuteGlucoseQuickAddSubmitInput {
  readonly canEnterValue: boolean;
  readonly formState: GlucoseQuickAddFormState;
  readonly glucoseDisplayUnit: 'mg_per_dl' | 'mmol_per_l' | null | undefined;
  readonly identity: GlucoseQuickAddSubmitIdentityState;
  readonly isSubmitting: boolean;
  readonly onSubmit: (request: GlucoseQuickAddSubmitRequest) => Promise<void>;
  readonly valueOutOfRangeMessage: string;
}

export type ExecuteGlucoseQuickAddSubmitResult =
  | { readonly type: 'ignored' }
  | { readonly type: 'invalid-value'; readonly message: string }
  | { readonly type: 'error'; readonly message: string }
  | { readonly type: 'success' };

export async function executeGlucoseQuickAddSubmit({
  canEnterValue,
  formState,
  glucoseDisplayUnit,
  identity,
  isSubmitting,
  onSubmit,
  valueOutOfRangeMessage,
}: ExecuteGlucoseQuickAddSubmitInput): Promise<ExecuteGlucoseQuickAddSubmitResult> {
  if (!canEnterValue || !glucoseDisplayUnit || isSubmitting) {
    return { type: 'ignored' };
  }

  const parsedValue = parseGlucoseInput(formState.value, glucoseDisplayUnit);

  if (parsedValue === null) {
    return { type: 'invalid-value', message: valueOutOfRangeMessage };
  }

  const entry: GlucoseQuickAddEntry = {
    context: formState.context,
    time: formState.time,
    valueMmol: parsedValue,
  };
  const eventId = beginGlucoseQuickAddSubmitEventId(identity, entry.time);

  try {
    await onSubmit({ entry, eventId });
    clearGlucoseQuickAddSubmitIdentity(identity);
    return { type: 'success' };
  } catch {
    return {
      message: 'save failed',
      type: 'error',
    };
  }
}

export function resetGlucoseQuickAddSubmitIdentity(
  identity: GlucoseQuickAddSubmitIdentityState,
): void {
  clearGlucoseQuickAddSubmitIdentity(identity);
}
