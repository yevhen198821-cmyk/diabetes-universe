import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

function translate(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

export interface GlucoseQuickAddLabels {
  readonly contextLabel: string;
  readonly contextSheetTitle: string;
  readonly save: string;
  readonly timeLabel: string;
  readonly unitGateDescription: string;
  readonly unitGateTitle: string;
  readonly unitMg: string;
  readonly unitMmol: string;
  readonly unitRequiredError: string;
  readonly unitSaving: string;
  readonly valueLabel: string;
  readonly valueOutOfRangeError: string;
}

const KEYS = {
  contextLabel: asTranslationKey('quickAdd.glucose.contextLabel'),
  contextSheetTitle: asTranslationKey('quickAdd.glucose.contextSheetTitle'),
  save: asTranslationKey('quickAdd.glucose.save'),
  timeLabel: asTranslationKey('quickAdd.glucose.timeLabel'),
  unitGateDescription: asTranslationKey(
    'quickAdd.glucose.unitGate.description',
  ),
  unitGateTitle: asTranslationKey('quickAdd.glucose.unitGate.title'),
  unitMg: asTranslationKey('quickAdd.glucose.unitMg'),
  unitMmol: asTranslationKey('quickAdd.glucose.unitMmol'),
  unitRequiredError: asTranslationKey('quickAdd.glucose.unitRequiredError'),
  unitSaving: asTranslationKey('quickAdd.glucose.unitSaving'),
  valueLabel: asTranslationKey('quickAdd.glucose.valueLabel'),
  valueOutOfRangeError: asTranslationKey(
    'quickAdd.glucose.valueOutOfRangeError',
  ),
} as const;

export function resolveGlucoseQuickAddLabels(
  localization: LocalizationPlatform,
): GlucoseQuickAddLabels {
  return {
    contextLabel: translate(localization, KEYS.contextLabel),
    contextSheetTitle: translate(localization, KEYS.contextSheetTitle),
    save: translate(localization, KEYS.save),
    timeLabel: translate(localization, KEYS.timeLabel),
    unitGateDescription: translate(localization, KEYS.unitGateDescription),
    unitGateTitle: translate(localization, KEYS.unitGateTitle),
    unitMg: translate(localization, KEYS.unitMg),
    unitMmol: translate(localization, KEYS.unitMmol),
    unitRequiredError: translate(localization, KEYS.unitRequiredError),
    unitSaving: translate(localization, KEYS.unitSaving),
    valueLabel: translate(localization, KEYS.valueLabel),
    valueOutOfRangeError: translate(localization, KEYS.valueOutOfRangeError),
  };
}
