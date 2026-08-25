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

export interface ProfileSecurityLabels {
  readonly passkeysUnavailable: Readonly<{
    readonly description: string;
    readonly title: string;
  }>;
  readonly sessionsLink: Readonly<{
    readonly subtitle: string;
    readonly title: string;
  }>;
}

const PROFILE_SECURITY_TRANSLATION_KEYS = {
  passkeysUnavailableDescription: asTranslationKey(
    'account.profile.security.passkeysUnavailable.description',
  ),
  passkeysUnavailableTitle: asTranslationKey(
    'account.profile.security.passkeysUnavailable.title',
  ),
  sessionsLinkSubtitle: asTranslationKey(
    'account.profile.security.sessionsLink.subtitle',
  ),
  sessionsLinkTitle: asTranslationKey(
    'account.profile.security.sessionsLink.title',
  ),
} as const;

export function resolveProfileSecurityLabels(
  localization: LocalizationPlatform,
): ProfileSecurityLabels {
  return {
    passkeysUnavailable: {
      description: translate(
        localization,
        PROFILE_SECURITY_TRANSLATION_KEYS.passkeysUnavailableDescription,
      ),
      title: translate(
        localization,
        PROFILE_SECURITY_TRANSLATION_KEYS.passkeysUnavailableTitle,
      ),
    },
    sessionsLink: {
      subtitle: translate(
        localization,
        PROFILE_SECURITY_TRANSLATION_KEYS.sessionsLinkSubtitle,
      ),
      title: translate(
        localization,
        PROFILE_SECURITY_TRANSLATION_KEYS.sessionsLinkTitle,
      ),
    },
  };
}
