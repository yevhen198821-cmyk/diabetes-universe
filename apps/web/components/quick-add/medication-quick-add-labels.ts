import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

export interface MedicationQuickAddSaveLabels {
  readonly saveErrorDescription: string;
  readonly saveErrorTitle: string;
  readonly saving: string;
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

export function resolveMedicationQuickAddSaveLabels(
  localization: LocalizationPlatform,
): MedicationQuickAddSaveLabels {
  return {
    saveErrorDescription: translate(
      localization,
      asTranslationKey('quick-add.medication.saveError.description'),
    ),
    saveErrorTitle: translate(
      localization,
      asTranslationKey('quick-add.medication.saveError.title'),
    ),
    saving: translate(
      localization,
      asTranslationKey('quick-add.medication.saving'),
    ),
  };
}
