import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

export interface ProfileLanguagePageLabels {
  readonly description: string;
  readonly selected: string;
  readonly title: string;
}

export function resolveProfileLanguagePageLabels(
  localization: LocalizationPlatform,
): ProfileLanguagePageLabels {
  return {
    description: localization.translate({
      key: asTranslationKey('account.profile.language.page.description'),
    }).value,
    selected: localization.translate({
      key: asTranslationKey('account.profile.language.option.selected'),
    }).value,
    title: localization.translate({
      key: asTranslationKey('account.profile.language.page.title'),
    }).value,
  };
}
