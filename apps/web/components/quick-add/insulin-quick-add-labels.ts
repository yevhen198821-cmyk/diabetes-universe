import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

/**
 * Insulin Quick Add form chrome.
 *
 * Catalogue preparation, administration-context, and grouping labels are NOT
 * declared here: they come from the Wave 4B-II presentation adapter
 * (`resolveInsulinPresentationLabels`) so a single localization source owns
 * insulin semantics.
 */
export interface InsulinQuickAddLabels {
  readonly cancel: string;
  readonly contextLabel: string;
  readonly contextPlaceholder: string;
  readonly contextSheetTitle: string;
  readonly doseError: string;
  readonly doseLabel: string;
  readonly dosePlaceholder: string;
  readonly doseUnit: string;
  readonly otherNameLabel: string;
  readonly otherNamePlaceholder: string;
  readonly otherNameRequiredError: string;
  readonly preparationLabel: string;
  readonly preparationPlaceholder: string;
  readonly preparationSheetTitle: string;
  readonly save: string;
  readonly timeLabel: string;
}

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

function translate(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

export const INSULIN_QUICK_ADD_TRANSLATION_KEYS = {
  cancel: asTranslationKey('quick-add.insulin.cancel'),
  contextLabel: asTranslationKey('quick-add.insulin.contextLabel'),
  contextPlaceholder: asTranslationKey('quick-add.insulin.contextPlaceholder'),
  contextSheetTitle: asTranslationKey('quick-add.insulin.contextSheetTitle'),
  doseError: asTranslationKey('quick-add.insulin.doseError'),
  doseLabel: asTranslationKey('quick-add.insulin.doseLabel'),
  dosePlaceholder: asTranslationKey('quick-add.insulin.dosePlaceholder'),
  doseUnit: asTranslationKey('quick-add.insulin.doseUnit'),
  otherNameLabel: asTranslationKey('quick-add.insulin.otherNameLabel'),
  otherNamePlaceholder: asTranslationKey(
    'quick-add.insulin.otherNamePlaceholder',
  ),
  otherNameRequiredError: asTranslationKey(
    'quick-add.insulin.otherNameRequiredError',
  ),
  preparationLabel: asTranslationKey('quick-add.insulin.preparationLabel'),
  preparationPlaceholder: asTranslationKey(
    'quick-add.insulin.preparationPlaceholder',
  ),
  preparationSheetTitle: asTranslationKey(
    'quick-add.insulin.preparationSheetTitle',
  ),
  save: asTranslationKey('quick-add.insulin.save'),
  timeLabel: asTranslationKey('quick-add.insulin.timeLabel'),
} as const;

export function resolveInsulinQuickAddLabels(
  localization: LocalizationPlatform,
): InsulinQuickAddLabels {
  const keys = INSULIN_QUICK_ADD_TRANSLATION_KEYS;

  return {
    cancel: translate(localization, keys.cancel),
    contextLabel: translate(localization, keys.contextLabel),
    contextPlaceholder: translate(localization, keys.contextPlaceholder),
    contextSheetTitle: translate(localization, keys.contextSheetTitle),
    doseError: translate(localization, keys.doseError),
    doseLabel: translate(localization, keys.doseLabel),
    dosePlaceholder: translate(localization, keys.dosePlaceholder),
    doseUnit: translate(localization, keys.doseUnit),
    otherNameLabel: translate(localization, keys.otherNameLabel),
    otherNamePlaceholder: translate(localization, keys.otherNamePlaceholder),
    otherNameRequiredError: translate(
      localization,
      keys.otherNameRequiredError,
    ),
    preparationLabel: translate(localization, keys.preparationLabel),
    preparationPlaceholder: translate(localization, keys.preparationPlaceholder),
    preparationSheetTitle: translate(localization, keys.preparationSheetTitle),
    save: translate(localization, keys.save),
    timeLabel: translate(localization, keys.timeLabel),
  };
}
