import {
  INSULIN_PREPARATION_OTHER_ID,
  prepareInsulinNewWrite,
} from '@diabetes-universe/medical-domain';
import type {
  InsulinAdministrationContext,
  InsulinPreparationId,
  InsulinQuickAddEntry,
} from '@diabetes-universe/types';

import type { InsulinPresentationLabels } from '../medical/insulin';
import { parseInsulinQuickAddDoseInput } from './insulin-quick-add-dose';

export interface InsulinQuickAddSubmitRequest {
  readonly entry: InsulinQuickAddEntry;
  readonly eventId: string;
}

/**
 * Insulin Quick Add form state.
 *
 * `preparationId` is the only identity the form tracks. `otherName` is only
 * meaningful while `insulin.prep.other` is selected and is never submitted for
 * a catalogue preparation. `administrationContext === null` means the user made
 * no choice; the domain foundation normalizes that to `unspecified`.
 */
export interface InsulinQuickAddFormState {
  readonly administrationContext: InsulinAdministrationContext | null;
  readonly dose: string;
  readonly otherName: string;
  readonly preparationId: InsulinPreparationId | null;
  readonly time: string;
}

export type InsulinQuickAddSubmitInvalidField =
  'dose' | 'otherName' | 'preparation' | 'time';

export type InsulinQuickAddSubmitResult =
  | {
      readonly type: 'prepared';
      readonly entry: InsulinQuickAddEntry;
    }
  | {
      readonly type: 'invalid';
      readonly field: InsulinQuickAddSubmitInvalidField;
    };

/**
 * Resolves the display snapshot that travels with a catalogue identity.
 *
 * A catalogue entry always resolves through the localized presentation
 * adapter. `insulin.prep.other` resolves to the trimmed user-entered name, so
 * a translated "Other" label can never become the stored snapshot.
 */
export function resolveInsulinQuickAddPreparationSnapshot(input: {
  readonly labels: InsulinPresentationLabels;
  readonly otherName: string;
  readonly preparationId: InsulinPreparationId;
}): string | null {
  if (input.preparationId === INSULIN_PREPARATION_OTHER_ID) {
    const trimmed = input.otherName.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  return input.labels.preparations[input.preparationId];
}

/**
 * Validates one manual insulin Quick Add submit and produces the semantic
 * entry.
 *
 * Order of the boundary: manual syntax/precision/UI-ceiling first, then the
 * canonical domain contract through `prepareInsulinNewWrite`. Only a successful
 * domain payload becomes an `InsulinQuickAddEntry`.
 */
export function prepareInsulinQuickAddSubmit(input: {
  readonly formState: InsulinQuickAddFormState;
  readonly labels: InsulinPresentationLabels;
}): InsulinQuickAddSubmitResult {
  const { formState, labels } = input;

  if (formState.preparationId === null) {
    return { field: 'preparation', type: 'invalid' };
  }

  if (formState.time.trim().length === 0) {
    return { field: 'time', type: 'invalid' };
  }

  const snapshot = resolveInsulinQuickAddPreparationSnapshot({
    labels,
    otherName: formState.otherName,
    preparationId: formState.preparationId,
  });

  if (snapshot === null) {
    return { field: 'otherName', type: 'invalid' };
  }

  const doseUnits = parseInsulinQuickAddDoseInput(formState.dose);

  if (doseUnits === null) {
    return { field: 'dose', type: 'invalid' };
  }

  const prepared = prepareInsulinNewWrite({
    administrationContext: formState.administrationContext ?? undefined,
    doseUnits,
    preparation: snapshot,
    preparationId: formState.preparationId,
  });

  if (!prepared.ok) {
    return {
      field:
        prepared.error === 'insulin.preparation.other_name_required'
          ? 'otherName'
          : prepared.error === 'insulin.preparation_id.invalid'
            ? 'preparation'
            : 'dose',
      type: 'invalid',
    };
  }

  return {
    entry: {
      administrationContext: prepared.value.administrationContext,
      doseUnits: prepared.value.doseUnits,
      preparation: prepared.value.preparation,
      preparationId: prepared.value.preparationId,
      time: formState.time,
    },
    type: 'prepared',
  };
}

/**
 * Stable serialization of the persisted insulin semantic payload used to decide
 * whether a failed save retry reuses the same event identity.
 */
export function serializeInsulinQuickAddRetryPayload(
  entry: InsulinQuickAddEntry,
): string {
  return JSON.stringify({
    administrationContext: entry.administrationContext,
    doseUnits: entry.doseUnits,
    preparation: entry.preparation,
    preparationId: entry.preparationId,
    time: entry.time,
  });
}
