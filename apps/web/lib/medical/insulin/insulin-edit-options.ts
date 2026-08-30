import {
  INSULIN_ADMINISTRATION_CONTEXTS,
  INSULIN_PREPARATION_IDS,
  resolveInsulinPresentationGrouping,
  type InsulinPresentationGrouping,
} from '@diabetes-universe/medical-domain';
import type {
  InsulinAdministrationContext,
  InsulinPreparationId,
} from '@diabetes-universe/types';

import type { InsulinPresentationLabels } from './insulin-presentation-labels';

export interface InsulinPreparationOption {
  readonly id: InsulinPreparationId;
  readonly label: string;
}

export interface InsulinPreparationOptionGroup {
  readonly grouping: InsulinPresentationGrouping;
  readonly label: string;
  readonly options: readonly InsulinPreparationOption[];
}

export interface InsulinAdministrationContextOption {
  readonly id: InsulinAdministrationContext;
  readonly label: string;
}

const GROUPING_ORDER = [
  'rapid_acting',
  'long_acting',
  'unspecified',
] as const satisfies readonly InsulinPresentationGrouping[];

/**
 * Groups catalogue entries for the edit picker.
 *
 * Grouping comes only from `resolveInsulinPresentationGrouping`; it is chrome
 * and is never written to the event.
 */
export function resolveInsulinPreparationOptionGroups(
  labels: InsulinPresentationLabels,
): readonly InsulinPreparationOptionGroup[] {
  return GROUPING_ORDER.map((grouping) => ({
    grouping,
    label: labels.groupings[grouping],
    options: INSULIN_PREPARATION_IDS.filter(
      (preparationId) =>
        resolveInsulinPresentationGrouping(preparationId) === grouping,
    ).map((preparationId) => ({
      id: preparationId,
      label: labels.preparations[preparationId],
    })),
  })).filter((group) => group.options.length > 0);
}

export function resolveInsulinAdministrationContextOptions(
  labels: InsulinPresentationLabels,
): readonly InsulinAdministrationContextOption[] {
  return INSULIN_ADMINISTRATION_CONTEXTS.map((context) => ({
    id: context,
    label: labels.contexts[context],
  }));
}
