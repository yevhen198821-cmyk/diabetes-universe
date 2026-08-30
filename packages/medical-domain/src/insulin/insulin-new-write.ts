import type {
  InsulinAdministrationContext,
  InsulinPreparationId,
} from '@diabetes-universe/types';

import { resolveInsulinNewWriteAdministrationContext } from './insulin-administration-context';
import {
  INSULIN_PREPARATION_OTHER_ID,
  isInsulinPreparationId,
} from './insulin-catalogue';
import {
  type InsulinCanonicalDoseValidationErrorCode,
  validateInsulinCanonicalDose,
} from './insulin-dose';

export interface PrepareInsulinNewWriteInput {
  readonly preparationId: unknown;
  readonly preparation: unknown;
  readonly doseUnits: unknown;
  readonly administrationContext?: unknown;
}

export interface InsulinNewWritePayload {
  readonly preparationId: InsulinPreparationId;
  readonly preparation: string;
  readonly doseUnits: number;
  readonly administrationContext: InsulinAdministrationContext;
}

export type InsulinNewWriteErrorCode =
  | 'insulin.preparation_id.invalid'
  | 'insulin.preparation.snapshot_empty'
  | 'insulin.preparation.other_name_required'
  | InsulinCanonicalDoseValidationErrorCode
  | 'insulin.administration_context.invalid';

export type InsulinNewWriteResult =
  | {
      readonly ok: true;
      readonly value: InsulinNewWritePayload;
    }
  | {
      readonly ok: false;
      readonly error: InsulinNewWriteErrorCode;
    };

function readTrimmedSnapshot(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Presentation-neutral new-write contract for later Wave 4C consumption.
 *
 * Rejects invalid input instead of repairing it. Does not invent localized
 * Other labels, write legacy `context`, persist grouping, or touch clocks,
 * IDs, locales, or persistence.
 */
export function prepareInsulinNewWrite(
  input: PrepareInsulinNewWriteInput,
): InsulinNewWriteResult {
  if (!isInsulinPreparationId(input.preparationId)) {
    return { ok: false, error: 'insulin.preparation_id.invalid' };
  }

  const snapshot = readTrimmedSnapshot(input.preparation);

  if (input.preparationId === INSULIN_PREPARATION_OTHER_ID) {
    if (snapshot === null) {
      return { ok: false, error: 'insulin.preparation.other_name_required' };
    }
  } else if (snapshot === null) {
    return { ok: false, error: 'insulin.preparation.snapshot_empty' };
  }

  const doseResult = validateInsulinCanonicalDose(input.doseUnits);

  if (!doseResult.ok) {
    return doseResult;
  }

  const contextResult = resolveInsulinNewWriteAdministrationContext(
    input.administrationContext,
  );

  if (!contextResult.ok) {
    return contextResult;
  }

  return {
    ok: true,
    value: {
      preparationId: input.preparationId,
      preparation: snapshot,
      doseUnits: doseResult.doseUnits,
      administrationContext: contextResult.administrationContext,
    },
  };
}
