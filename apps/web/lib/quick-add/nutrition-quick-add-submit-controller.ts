import type { NutritionItemSnapshot } from '@diabetes-universe/types';

import {
  prepareNutritionQuickAddSubmit,
  serializeNutritionQuickAddRetryPayload,
  type NutritionQuickAddMealType,
  type NutritionQuickAddSubmitErrorCode,
  type NutritionQuickAddSubmitRequest,
} from './nutrition-quick-add-submit';
import {
  clearQuickAddSubmitIdentity,
  createQuickAddSubmitIdentityState,
  reconcileQuickAddSubmitEventId,
  type QuickAddSubmitIdentityState,
} from './quick-add-submit-identity-model';

export type NutritionQuickAddSubmitIdentityState = QuickAddSubmitIdentityState;

export function createNutritionQuickAddSubmitIdentityState(): NutritionQuickAddSubmitIdentityState {
  return createQuickAddSubmitIdentityState();
}

export interface NutritionQuickAddFormSubmitInput {
  readonly carbohydratesGrams: number;
  readonly items?: readonly NutritionItemSnapshot[];
  readonly mealType: NutritionQuickAddMealType;
  readonly note?: string;
  readonly time: string;
}

export type PrepareNutritionQuickAddSubmitResult =
  | {
      readonly type: 'invalid';
      readonly error: NutritionQuickAddSubmitErrorCode;
    }
  | {
      readonly type: 'prepared';
      readonly request: NutritionQuickAddSubmitRequest;
    };

export interface PrepareNutritionQuickAddSubmitWithIdentityInput {
  readonly identity: NutritionQuickAddSubmitIdentityState;
  readonly input: NutritionQuickAddFormSubmitInput;
}

export interface PersistPreparedNutritionQuickAddSubmitInput {
  readonly identity: NutritionQuickAddSubmitIdentityState;
  readonly onSubmit: (request: NutritionQuickAddSubmitRequest) => Promise<void>;
  readonly request: NutritionQuickAddSubmitRequest;
}

export type PersistPreparedNutritionQuickAddSubmitResult =
  { readonly type: 'success' } | { readonly type: 'error' };

export function prepareNutritionQuickAddSubmitWithIdentity({
  identity,
  input,
}: PrepareNutritionQuickAddSubmitWithIdentityInput): PrepareNutritionQuickAddSubmitResult {
  const prepared = prepareNutritionQuickAddSubmit(input);

  if (!prepared.ok) {
    return { error: prepared.error, type: 'invalid' };
  }

  const eventId = reconcileQuickAddSubmitEventId(
    identity,
    'nutrition',
    prepared.value.time,
    serializeNutritionQuickAddRetryPayload(prepared.value),
  );

  return {
    request: { entry: prepared.value, eventId },
    type: 'prepared',
  };
}

export async function persistPreparedNutritionQuickAddSubmit({
  identity,
  onSubmit,
  request,
}: PersistPreparedNutritionQuickAddSubmitInput): Promise<PersistPreparedNutritionQuickAddSubmitResult> {
  try {
    await onSubmit(request);
    clearQuickAddSubmitIdentity(identity);
    return { type: 'success' };
  } catch {
    return { type: 'error' };
  }
}

export function resetNutritionQuickAddSubmitIdentity(
  identity: NutritionQuickAddSubmitIdentityState,
): void {
  clearQuickAddSubmitIdentity(identity);
}
