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

export interface PrepareGlucoseQuickAddSubmitInput {
  readonly canEnterValue: boolean;
  readonly formState: GlucoseQuickAddFormState;
  readonly glucoseDisplayUnit: 'mg_per_dl' | 'mmol_per_l' | null | undefined;
  readonly identity: GlucoseQuickAddSubmitIdentityState;
  readonly valueOutOfRangeMessage: string;
}

export type PrepareGlucoseQuickAddSubmitResult =
  | { readonly type: 'unavailable' }
  | { readonly type: 'invalid-value'; readonly message: string }
  | {
      readonly type: 'prepared';
      readonly request: GlucoseQuickAddSubmitRequest;
    };

export interface PersistPreparedGlucoseQuickAddSubmitInput {
  readonly identity: GlucoseQuickAddSubmitIdentityState;
  readonly onSubmit: (request: GlucoseQuickAddSubmitRequest) => Promise<void>;
  readonly request: GlucoseQuickAddSubmitRequest;
}

export type PersistPreparedGlucoseQuickAddSubmitResult =
  { readonly type: 'success' } | { readonly type: 'error' };

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
  | { readonly type: 'error' }
  | { readonly type: 'success' };

export function prepareGlucoseQuickAddSubmit({
  canEnterValue,
  formState,
  glucoseDisplayUnit,
  identity,
  valueOutOfRangeMessage,
}: PrepareGlucoseQuickAddSubmitInput): PrepareGlucoseQuickAddSubmitResult {
  if (!canEnterValue || !glucoseDisplayUnit) {
    return { type: 'unavailable' };
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

  return {
    request: { entry, eventId },
    type: 'prepared',
  };
}

export async function persistPreparedGlucoseQuickAddSubmit({
  identity,
  onSubmit,
  request,
}: PersistPreparedGlucoseQuickAddSubmitInput): Promise<PersistPreparedGlucoseQuickAddSubmitResult> {
  try {
    await onSubmit(request);
    clearGlucoseQuickAddSubmitIdentity(identity);
    return { type: 'success' };
  } catch {
    return { type: 'error' };
  }
}

export async function executeGlucoseQuickAddSubmit({
  canEnterValue,
  formState,
  glucoseDisplayUnit,
  identity,
  isSubmitting,
  onSubmit,
  valueOutOfRangeMessage,
}: ExecuteGlucoseQuickAddSubmitInput): Promise<ExecuteGlucoseQuickAddSubmitResult> {
  if (isSubmitting) {
    return { type: 'ignored' };
  }

  const prepared = prepareGlucoseQuickAddSubmit({
    canEnterValue,
    formState,
    glucoseDisplayUnit,
    identity,
    valueOutOfRangeMessage,
  });

  if (prepared.type === 'unavailable') {
    return { type: 'ignored' };
  }

  if (prepared.type === 'invalid-value') {
    return prepared;
  }

  const persisted = await persistPreparedGlucoseQuickAddSubmit({
    identity,
    onSubmit,
    request: prepared.request,
  });

  return persisted.type === 'success' ? { type: 'success' } : { type: 'error' };
}

export function resetGlucoseQuickAddSubmitIdentity(
  identity: GlucoseQuickAddSubmitIdentityState,
): void {
  clearGlucoseQuickAddSubmitIdentity(identity);
}
