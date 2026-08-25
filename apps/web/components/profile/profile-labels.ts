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

import type { ProfileUserCardLabels } from './profile-user-card';

export interface ProfileLabels {
  readonly about: Readonly<{
    readonly description: string;
    readonly subtitle: string;
    readonly title: string;
    readonly versionLabel: string;
  }>;
  readonly comingSoonBadge: string;
  readonly logout: string;
  readonly menu: Readonly<{
    readonly diabetesSettings: Readonly<{
      readonly subtitle: string;
      readonly title: string;
    }>;
    readonly devices: Readonly<{
      readonly subtitle: string;
      readonly title: string;
    }>;
    readonly export: Readonly<{
      readonly subtitle: string;
      readonly title: string;
    }>;
    readonly language: Readonly<{
      readonly subtitle: string;
      readonly title: string;
    }>;
    readonly section: Readonly<{
      readonly data: string;
      readonly devices: string;
      readonly diabetesManagement: string;
      readonly personalization: string;
    }>;
  }>;
  readonly segments: Readonly<{
    readonly profile: string;
    readonly security: string;
    readonly settings: string;
  }>;
  readonly settings: Readonly<{
    readonly description: string;
    readonly theme: Readonly<{
      readonly dark: string;
      readonly light: string;
      readonly subtitle: string;
      readonly title: string;
    }>;
    readonly title: string;
  }>;
  readonly subtitle: string;
  readonly title: string;
  readonly userCard: ProfileUserCardLabels &
    Readonly<{
      readonly fallbackName: string;
    }>;
}

const PROFILE_TRANSLATION_KEYS = {
  aboutDescription: asTranslationKey('account.profile.about.description'),
  aboutSubtitle: asTranslationKey('account.profile.about.subtitle'),
  aboutTitle: asTranslationKey('account.profile.about.title'),
  aboutVersionLabel: asTranslationKey('account.profile.about.versionLabel'),
  comingSoonBadge: asTranslationKey('account.profile.comingSoon.badge'),
  logout: asTranslationKey('account.profile.logout'),
  menuDiabetesSettingsSubtitle: asTranslationKey(
    'account.profile.menu.diabetesSettings.subtitle',
  ),
  menuDiabetesSettingsTitle: asTranslationKey(
    'account.profile.menu.diabetesSettings.title',
  ),
  menuDevicesSubtitle: asTranslationKey(
    'account.profile.menu.devices.subtitle',
  ),
  menuDevicesTitle: asTranslationKey('account.profile.menu.devices.title'),
  menuExportSubtitle: asTranslationKey('account.profile.menu.export.subtitle'),
  menuExportTitle: asTranslationKey('account.profile.menu.export.title'),
  menuLanguageSubtitle: asTranslationKey(
    'account.profile.menu.language.subtitle',
  ),
  menuLanguageTitle: asTranslationKey('account.profile.menu.language.title'),
  menuSectionData: asTranslationKey('account.profile.menu.section.data'),
  menuSectionDevices: asTranslationKey('account.profile.menu.section.devices'),
  menuSectionDiabetesManagement: asTranslationKey(
    'account.profile.menu.section.diabetesManagement',
  ),
  menuSectionPersonalization: asTranslationKey(
    'account.profile.menu.section.personalization',
  ),
  segmentProfile: asTranslationKey('account.profile.segments.profile'),
  segmentSecurity: asTranslationKey('account.profile.segments.security'),
  segmentSettings: asTranslationKey('account.profile.segments.settings'),
  settingsDescription: asTranslationKey('account.profile.settings.description'),
  settingsThemeDark: asTranslationKey('account.profile.settings.theme.dark'),
  settingsThemeLight: asTranslationKey('account.profile.settings.theme.light'),
  settingsThemeSubtitle: asTranslationKey(
    'account.profile.settings.theme.subtitle',
  ),
  settingsThemeTitle: asTranslationKey('account.profile.settings.theme.title'),
  settingsTitle: asTranslationKey('account.profile.settings.title'),
  subtitle: asTranslationKey('account.profile.subtitle'),
  title: asTranslationKey('account.profile.title'),
  userCardAvatarEditAction: asTranslationKey(
    'account.profile.userCard.avatarEditAction',
  ),
  userCardAvatarDialogChoosePhoto: asTranslationKey(
    'account.profile.userCard.avatarDialog.choosePhoto',
  ),
  userCardAvatarDialogDescription: asTranslationKey(
    'account.profile.userCard.avatarDialog.description',
  ),
  userCardAvatarDialogErrorGeneric: asTranslationKey(
    'account.profile.userCard.avatarDialog.error.generic',
  ),
  userCardAvatarDialogErrorInvalidType: asTranslationKey(
    'account.profile.userCard.avatarDialog.error.invalidType',
  ),
  userCardAvatarDialogErrorTooLarge: asTranslationKey(
    'account.profile.userCard.avatarDialog.error.tooLarge',
  ),
  userCardAvatarDialogRemovePhoto: asTranslationKey(
    'account.profile.userCard.avatarDialog.removePhoto',
  ),
  userCardAvatarDialogSave: asTranslationKey(
    'account.profile.userCard.avatarDialog.save',
  ),
  userCardAvatarDialogSuccess: asTranslationKey(
    'account.profile.userCard.avatarDialog.success',
  ),
  userCardAvatarDialogTitle: asTranslationKey(
    'account.profile.userCard.avatarDialog.title',
  ),
  userCardAvatarDialogUploading: asTranslationKey(
    'account.profile.userCard.avatarDialog.uploading',
  ),
  userCardAvatarLabel: asTranslationKey('account.profile.userCard.avatarLabel'),
  userCardEmailLabel: asTranslationKey('account.profile.userCard.emailLabel'),
  userCardFallbackName: asTranslationKey(
    'account.profile.userCard.fallbackName',
  ),
} as const;

export function resolveProfileLabels(
  localization: LocalizationPlatform,
): ProfileLabels {
  return {
    about: {
      description: translate(
        localization,
        PROFILE_TRANSLATION_KEYS.aboutDescription,
      ),
      subtitle: translate(localization, PROFILE_TRANSLATION_KEYS.aboutSubtitle),
      title: translate(localization, PROFILE_TRANSLATION_KEYS.aboutTitle),
      versionLabel: translate(
        localization,
        PROFILE_TRANSLATION_KEYS.aboutVersionLabel,
      ),
    },
    comingSoonBadge: translate(
      localization,
      PROFILE_TRANSLATION_KEYS.comingSoonBadge,
    ),
    logout: translate(localization, PROFILE_TRANSLATION_KEYS.logout),
    menu: {
      diabetesSettings: {
        subtitle: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.menuDiabetesSettingsSubtitle,
        ),
        title: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.menuDiabetesSettingsTitle,
        ),
      },
      devices: {
        subtitle: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.menuDevicesSubtitle,
        ),
        title: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.menuDevicesTitle,
        ),
      },
      export: {
        subtitle: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.menuExportSubtitle,
        ),
        title: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.menuExportTitle,
        ),
      },
      language: {
        subtitle: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.menuLanguageSubtitle,
        ),
        title: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.menuLanguageTitle,
        ),
      },
      section: {
        data: translate(localization, PROFILE_TRANSLATION_KEYS.menuSectionData),
        devices: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.menuSectionDevices,
        ),
        diabetesManagement: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.menuSectionDiabetesManagement,
        ),
        personalization: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.menuSectionPersonalization,
        ),
      },
    },
    segments: {
      profile: translate(localization, PROFILE_TRANSLATION_KEYS.segmentProfile),
      security: translate(
        localization,
        PROFILE_TRANSLATION_KEYS.segmentSecurity,
      ),
      settings: translate(
        localization,
        PROFILE_TRANSLATION_KEYS.segmentSettings,
      ),
    },
    settings: {
      description: translate(
        localization,
        PROFILE_TRANSLATION_KEYS.settingsDescription,
      ),
      theme: {
        dark: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.settingsThemeDark,
        ),
        light: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.settingsThemeLight,
        ),
        subtitle: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.settingsThemeSubtitle,
        ),
        title: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.settingsThemeTitle,
        ),
      },
      title: translate(localization, PROFILE_TRANSLATION_KEYS.settingsTitle),
    },
    subtitle: translate(localization, PROFILE_TRANSLATION_KEYS.subtitle),
    title: translate(localization, PROFILE_TRANSLATION_KEYS.title),
    userCard: {
      avatar: {
        avatarLabel: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.userCardAvatarLabel,
        ),
        choosePhoto: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.userCardAvatarDialogChoosePhoto,
        ),
        close: translate(
          localization,
          asTranslationKey('common.actions.close'),
        ),
        description: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.userCardAvatarDialogDescription,
        ),
        editAction: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.userCardAvatarEditAction,
        ),
        errorGeneric: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.userCardAvatarDialogErrorGeneric,
        ),
        errorInvalidType: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.userCardAvatarDialogErrorInvalidType,
        ),
        errorTooLarge: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.userCardAvatarDialogErrorTooLarge,
        ),
        removePhoto: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.userCardAvatarDialogRemovePhoto,
        ),
        save: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.userCardAvatarDialogSave,
        ),
        success: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.userCardAvatarDialogSuccess,
        ),
        title: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.userCardAvatarDialogTitle,
        ),
        uploading: translate(
          localization,
          PROFILE_TRANSLATION_KEYS.userCardAvatarDialogUploading,
        ),
      },
      emailLabel: translate(
        localization,
        PROFILE_TRANSLATION_KEYS.userCardEmailLabel,
      ),
      fallbackName: translate(
        localization,
        PROFILE_TRANSLATION_KEYS.userCardFallbackName,
      ),
    },
  };
}
