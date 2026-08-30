import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';
import type { GlucoseMeasurementContext } from '@diabetes-universe/types';

import {
  glucoseMeasurementContextIds,
  type GlucoseContextOption,
} from '../../lib/quick-add/glucose-context-options';

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
  readonly addContext: string;
  readonly changeContext: string;
  readonly clearContext: string;
  readonly contextLabel: string;
  readonly contextSheetTitle: string;
  readonly loading: string;
  readonly save: string;
  readonly saveErrorDescription: string;
  readonly saveErrorTitle: string;
  readonly saving: string;
  readonly settingsErrorDescription: string;
  readonly settingsErrorRetry: string;
  readonly settingsErrorTitle: string;
  readonly settingsUnconfiguredAction: string;
  readonly settingsUnconfiguredDescription: string;
  readonly settingsUnconfiguredTitle: string;
  readonly timeLabel: string;
  readonly unitMg: string;
  readonly unitMmol: string;
  readonly valueLabel: string;
  readonly valueOutOfRangeError: string;
}

const KEYS = {
  addContext: asTranslationKey('quick-add.glucose.addContext'),
  changeContext: asTranslationKey('quick-add.glucose.changeContext'),
  clearContext: asTranslationKey('quick-add.glucose.clearContext'),
  contextLabel: asTranslationKey('quick-add.glucose.contextLabel'),
  contextSheetTitle: asTranslationKey('quick-add.glucose.contextSheetTitle'),
  loading: asTranslationKey('quick-add.glucose.loading'),
  save: asTranslationKey('quick-add.glucose.save'),
  saveErrorDescription: asTranslationKey(
    'quick-add.glucose.saveError.description',
  ),
  saveErrorTitle: asTranslationKey('quick-add.glucose.saveError.title'),
  saving: asTranslationKey('quick-add.glucose.saving'),
  settingsErrorDescription: asTranslationKey(
    'quick-add.glucose.settingsError.description',
  ),
  settingsErrorRetry: asTranslationKey('quick-add.glucose.settingsError.retry'),
  settingsErrorTitle: asTranslationKey('quick-add.glucose.settingsError.title'),
  settingsUnconfiguredAction: asTranslationKey(
    'quick-add.glucose.settingsUnconfigured.action',
  ),
  settingsUnconfiguredDescription: asTranslationKey(
    'quick-add.glucose.settingsUnconfigured.description',
  ),
  settingsUnconfiguredTitle: asTranslationKey(
    'quick-add.glucose.settingsUnconfigured.title',
  ),
  timeLabel: asTranslationKey('quick-add.glucose.timeLabel'),
  unitMg: asTranslationKey('quick-add.glucose.unitMg'),
  unitMmol: asTranslationKey('quick-add.glucose.unitMmol'),
  valueLabel: asTranslationKey('quick-add.glucose.valueLabel'),
  valueOutOfRangeError: asTranslationKey(
    'quick-add.glucose.valueOutOfRangeError',
  ),
} as const;

const CONTEXT_LABEL_KEYS: Readonly<
  Record<GlucoseMeasurementContext, TranslationKey>
> = {
  after_meal: asTranslationKey('timeline.glucoseContext.after_meal'),
  before_meal: asTranslationKey('timeline.glucoseContext.before_meal'),
  bedtime: asTranslationKey('timeline.glucoseContext.bedtime'),
  fasting: asTranslationKey('timeline.glucoseContext.fasting'),
  other: asTranslationKey('timeline.glucoseContext.other'),
};

export function resolveGlucoseQuickAddLabels(
  localization: LocalizationPlatform,
): GlucoseQuickAddLabels {
  return {
    addContext: translate(localization, KEYS.addContext),
    changeContext: translate(localization, KEYS.changeContext),
    clearContext: translate(localization, KEYS.clearContext),
    contextLabel: translate(localization, KEYS.contextLabel),
    contextSheetTitle: translate(localization, KEYS.contextSheetTitle),
    loading: translate(localization, KEYS.loading),
    save: translate(localization, KEYS.save),
    saveErrorDescription: translate(localization, KEYS.saveErrorDescription),
    saveErrorTitle: translate(localization, KEYS.saveErrorTitle),
    saving: translate(localization, KEYS.saving),
    settingsErrorDescription: translate(
      localization,
      KEYS.settingsErrorDescription,
    ),
    settingsErrorRetry: translate(localization, KEYS.settingsErrorRetry),
    settingsErrorTitle: translate(localization, KEYS.settingsErrorTitle),
    settingsUnconfiguredAction: translate(
      localization,
      KEYS.settingsUnconfiguredAction,
    ),
    settingsUnconfiguredDescription: translate(
      localization,
      KEYS.settingsUnconfiguredDescription,
    ),
    settingsUnconfiguredTitle: translate(
      localization,
      KEYS.settingsUnconfiguredTitle,
    ),
    timeLabel: translate(localization, KEYS.timeLabel),
    unitMg: translate(localization, KEYS.unitMg),
    unitMmol: translate(localization, KEYS.unitMmol),
    valueLabel: translate(localization, KEYS.valueLabel),
    valueOutOfRangeError: translate(localization, KEYS.valueOutOfRangeError),
  };
}

export function resolveGlucoseContextOptions(
  localization: LocalizationPlatform,
): readonly GlucoseContextOption[] {
  return glucoseMeasurementContextIds.map((id) => ({
    id,
    label: translate(localization, CONTEXT_LABEL_KEYS[id]),
  }));
}

export function resolveGlucoseContextLabel(
  localization: LocalizationPlatform,
  context: GlucoseMeasurementContext,
): string {
  return translate(localization, CONTEXT_LABEL_KEYS[context]);
}
