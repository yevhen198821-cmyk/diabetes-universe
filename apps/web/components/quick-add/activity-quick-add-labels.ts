import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

export interface ActivityQuickAddSaveLabels {
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

export function resolveActivityQuickAddSaveLabels(
  localization: LocalizationPlatform,
): ActivityQuickAddSaveLabels {
  return {
    saveErrorDescription: translate(
      localization,
      asTranslationKey('quick-add.activity.saveError.description'),
    ),
    saveErrorTitle: translate(
      localization,
      asTranslationKey('quick-add.activity.saveError.title'),
    ),
    saving: translate(
      localization,
      asTranslationKey('quick-add.activity.saving'),
    ),
  };
}
