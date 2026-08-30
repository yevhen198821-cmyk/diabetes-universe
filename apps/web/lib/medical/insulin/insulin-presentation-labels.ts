import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';
import {
  INSULIN_ADMINISTRATION_CONTEXTS,
  INSULIN_PREPARATION_IDS,
  type InsulinPresentationGrouping,
} from '@diabetes-universe/medical-domain';
import type {
  InsulinAdministrationContext,
  InsulinPreparationId,
} from '@diabetes-universe/types';

/**
 * Localized insulin chrome.
 *
 * Preparation display names are catalogue chrome used for pickers and for the
 * snapshot written when a user explicitly selects a catalogue entry. Grouping
 * labels are presentation chrome only and are never persisted.
 */
export interface InsulinPresentationLabels {
  readonly contexts: Readonly<Record<InsulinAdministrationContext, string>>;
  readonly groupings: Readonly<Record<InsulinPresentationGrouping, string>>;
  readonly preparations: Readonly<Record<InsulinPreparationId, string>>;
}

const INSULIN_PRESENTATION_GROUPINGS = [
  'rapid_acting',
  'long_acting',
  'unspecified',
] as const satisfies readonly InsulinPresentationGrouping[];

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

function translate(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

function preparationTranslationKey(
  preparationId: InsulinPreparationId,
): TranslationKey {
  return asTranslationKey(
    `timeline.insulinPreparation.${preparationId.slice('insulin.prep.'.length)}`,
  );
}

export function resolveInsulinPresentationLabels(
  localization: LocalizationPlatform,
): InsulinPresentationLabels {
  const contexts = {} as Record<InsulinAdministrationContext, string>;

  for (const context of INSULIN_ADMINISTRATION_CONTEXTS) {
    contexts[context] = translate(
      localization,
      asTranslationKey(`timeline.insulinContext.${context}`),
    );
  }

  const groupings = {} as Record<InsulinPresentationGrouping, string>;

  for (const grouping of INSULIN_PRESENTATION_GROUPINGS) {
    groupings[grouping] = translate(
      localization,
      asTranslationKey(`timeline.insulinGrouping.${grouping}`),
    );
  }

  const preparations = {} as Record<InsulinPreparationId, string>;

  for (const preparationId of INSULIN_PREPARATION_IDS) {
    preparations[preparationId] = translate(
      localization,
      preparationTranslationKey(preparationId),
    );
  }

  return { contexts, groupings, preparations };
}
