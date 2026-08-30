import {
  INSULIN_PREPARATION_OTHER_ID,
  isInsulinAdministrationContext,
  isInsulinPreparationId,
  mapLegacyInsulinAdministrationContext,
} from '@diabetes-universe/medical-domain';
import type {
  InsulinAdministrationContext,
  InsulinPreparationId,
} from '@diabetes-universe/types';

import type { InsulinPresentationLabels } from './insulin-presentation-labels';

/**
 * UI typo guard for manually entered insulin doses.
 *
 * This is input protection only. It is not a clinical ceiling and the domain
 * transport bound (500) is unchanged.
 */
export const INSULIN_EDIT_UI_DOSE_MAXIMUM = 100;

/** Stored insulin fields the edit transition may read. */
export interface InsulinEditSourceEvent {
  readonly administrationContext?: InsulinAdministrationContext;
  readonly context?: string;
  readonly doseUnits: number;
  readonly preparation: string;
  readonly preparationId?: InsulinPreparationId;
}

/**
 * Insulin-specific edit state.
 *
 * `preparationId === null` means the event carries no catalogue identity and
 * the user has not made an explicit catalogue selection. `administrationContext
 * === null` means an unmatched legacy `context` string is being preserved
 * verbatim. `contextEdited` separates an initialized semantic selection from an
 * explicit user choice, so dose/time-only saves never convert a legacy
 * `context` into a semantic write.
 */
export interface InsulinEditSelection {
  readonly administrationContext: InsulinAdministrationContext | null;
  readonly contextEdited: boolean;
  readonly dose: string;
  readonly otherName: string;
  readonly preparationId: InsulinPreparationId | null;
}

export interface InsulinEditPreparationTransition {
  readonly preparation: string;
  /** `null` keeps the event unmatched; the caller must omit the field. */
  readonly preparationId: InsulinPreparationId | null;
}

export type InsulinEditContextTransition =
  | {
      readonly kind: 'preserve';
    }
  | {
      readonly kind: 'semantic';
      readonly administrationContext: InsulinAdministrationContext;
    };

export interface InsulinEditTransition {
  readonly context: InsulinEditContextTransition;
  readonly doseUnits: number;
  readonly preparation: InsulinEditPreparationTransition;
}

export type InsulinEditTransitionErrorCode =
  'insulin.dose.out_of_ui_bound' | 'insulin.preparation.other_name_required';

export interface InsulinEditTransitionErrors {
  readonly dose?: InsulinEditTransitionErrorCode;
  readonly otherName?: InsulinEditTransitionErrorCode;
}

export type InsulinEditTransitionResult =
  | {
      readonly ok: true;
      readonly transition: InsulinEditTransition;
    }
  | {
      readonly ok: false;
      readonly errors: InsulinEditTransitionErrors;
    };

export function formatInsulinEditDoseInput(doseUnits: number): string {
  return Number.isInteger(doseUnits)
    ? doseUnits.toString()
    : doseUnits.toString().replace('.', ',');
}

export function parseInsulinEditDoseInput(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');

  if (normalized.length === 0) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Returns the unmatched legacy `context` text an edit must preserve verbatim,
 * or `null` when the context can be represented semantically.
 */
export function resolveInsulinEditLegacyContextText(
  event: Pick<InsulinEditSourceEvent, 'administrationContext' | 'context'>,
): string | null {
  if (isInsulinAdministrationContext(event.administrationContext)) {
    return null;
  }

  if (mapLegacyInsulinAdministrationContext(event.context).matched) {
    return null;
  }

  if (typeof event.context === 'string' && event.context.trim().length > 0) {
    return event.context;
  }

  return null;
}

/**
 * Builds the initial insulin edit selection from a stored event.
 *
 * Identity is read only from `preparationId`. The legacy display string is
 * never matched against catalogue display names.
 */
export function createInsulinEditSelection(
  event: InsulinEditSourceEvent,
): InsulinEditSelection {
  const preparationId = isInsulinPreparationId(event.preparationId)
    ? event.preparationId
    : null;
  const legacyMapping = mapLegacyInsulinAdministrationContext(event.context);
  const administrationContext = isInsulinAdministrationContext(
    event.administrationContext,
  )
    ? event.administrationContext
    : legacyMapping.matched
      ? legacyMapping.administrationContext
      : null;

  return {
    administrationContext,
    contextEdited: false,
    dose: formatInsulinEditDoseInput(event.doseUnits),
    otherName:
      preparationId === INSULIN_PREPARATION_OTHER_ID ? event.preparation : '',
    preparationId,
  };
}

function resolvePreparationTransition(
  event: InsulinEditSourceEvent,
  selection: InsulinEditSelection,
  labels: InsulinPresentationLabels,
): InsulinEditPreparationTransition | 'other_name_required' {
  if (selection.preparationId === null) {
    return { preparation: event.preparation, preparationId: null };
  }

  if (selection.preparationId === INSULIN_PREPARATION_OTHER_ID) {
    const otherName = selection.otherName.trim();

    if (otherName.length === 0) {
      return 'other_name_required';
    }

    const unchanged =
      event.preparationId === INSULIN_PREPARATION_OTHER_ID &&
      otherName === event.preparation.trim();

    return {
      preparation: unchanged ? event.preparation : otherName,
      preparationId: INSULIN_PREPARATION_OTHER_ID,
    };
  }

  return {
    preparation:
      selection.preparationId === event.preparationId
        ? event.preparation
        : labels.preparations[selection.preparationId],
    preparationId: selection.preparationId,
  };
}

function resolveContextTransition(
  selection: InsulinEditSelection,
): InsulinEditContextTransition {
  if (!selection.contextEdited || selection.administrationContext === null) {
    return { kind: 'preserve' };
  }

  return {
    administrationContext: selection.administrationContext,
    kind: 'semantic',
  };
}

/**
 * Resolves one atomic insulin edit save.
 *
 * A catalogue identity and its display snapshot are always resolved together,
 * so an ID can never be saved alongside another entry's snapshot. An explicit
 * semantic context choice replaces the legacy string; anything else preserves
 * the stored context fields untouched.
 */
export function resolveInsulinEditTransition(input: {
  readonly event: InsulinEditSourceEvent;
  readonly labels: InsulinPresentationLabels;
  readonly selection: InsulinEditSelection;
}): InsulinEditTransitionResult {
  const errors: {
    dose?: InsulinEditTransitionErrorCode;
    otherName?: InsulinEditTransitionErrorCode;
  } = {};
  const doseUnits = parseInsulinEditDoseInput(input.selection.dose);

  if (
    doseUnits === null ||
    doseUnits <= 0 ||
    doseUnits > INSULIN_EDIT_UI_DOSE_MAXIMUM
  ) {
    errors.dose = 'insulin.dose.out_of_ui_bound';
  }

  const preparation = resolvePreparationTransition(
    input.event,
    input.selection,
    input.labels,
  );

  if (preparation === 'other_name_required') {
    errors.otherName = 'insulin.preparation.other_name_required';
  }

  if (preparation === 'other_name_required' || doseUnits === null) {
    return { errors, ok: false };
  }

  if (Object.keys(errors).length > 0) {
    return { errors, ok: false };
  }

  return {
    ok: true,
    transition: {
      context: resolveContextTransition(input.selection),
      doseUnits,
      preparation,
    },
  };
}
