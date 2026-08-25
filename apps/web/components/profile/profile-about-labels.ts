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

export interface ProfileAboutLabels {
  readonly comingSoonBadge: string;
  readonly description: string;
  readonly page: Readonly<{
    readonly buildInfoLabel: string;
    readonly ecosystem: Readonly<{
      readonly description: string;
      readonly title: string;
    }>;
    readonly medical: Readonly<{
      readonly description: string;
      readonly title: string;
    }>;
    readonly productName: string;
    readonly rows: Readonly<{
      readonly accountDeletion: string;
      readonly contactSupport: string;
      readonly dataExport: string;
      readonly dataManagement: string;
      readonly licenses: string;
      readonly openSourceLicenses: string;
      readonly privacyPolicy: string;
      readonly reportIssue: string;
      readonly supportCenter: string;
      readonly termsOfUse: string;
    }>;
    readonly sections: Readonly<{
      readonly help: string;
      readonly legal: string;
      readonly privacyAndData: string;
      readonly technical: string;
    }>;
    readonly title: string;
  }>;
  readonly title: string;
  readonly versionLabel: string;
}

const PROFILE_ABOUT_TRANSLATION_KEYS = {
  comingSoonBadge: asTranslationKey('account.profile.comingSoon.badge'),
  description: asTranslationKey('account.profile.about.description'),
  pageBuildInfoLabel: asTranslationKey(
    'account.profile.about.page.buildInfoLabel',
  ),
  pageEcosystemDescription: asTranslationKey(
    'account.profile.about.page.ecosystem.description',
  ),
  pageEcosystemTitle: asTranslationKey(
    'account.profile.about.page.ecosystem.title',
  ),
  pageMedicalDescription: asTranslationKey(
    'account.profile.about.page.medical.description',
  ),
  pageMedicalTitle: asTranslationKey(
    'account.profile.about.page.medical.title',
  ),
  pageProductName: asTranslationKey('dashboard.header.brandName'),
  pageRowAccountDeletion: asTranslationKey(
    'account.profile.about.page.rows.accountDeletion',
  ),
  pageRowContactSupport: asTranslationKey(
    'account.profile.about.page.rows.contactSupport',
  ),
  pageRowDataExport: asTranslationKey(
    'account.profile.about.page.rows.dataExport',
  ),
  pageRowDataManagement: asTranslationKey(
    'account.profile.about.page.rows.dataManagement',
  ),
  pageRowLicenses: asTranslationKey('account.profile.about.page.rows.licenses'),
  pageRowOpenSourceLicenses: asTranslationKey(
    'account.profile.about.page.rows.openSourceLicenses',
  ),
  pageRowPrivacyPolicy: asTranslationKey(
    'account.profile.about.page.rows.privacyPolicy',
  ),
  pageRowReportIssue: asTranslationKey(
    'account.profile.about.page.rows.reportIssue',
  ),
  pageRowSupportCenter: asTranslationKey(
    'account.profile.about.page.rows.supportCenter',
  ),
  pageRowTermsOfUse: asTranslationKey(
    'account.profile.about.page.rows.termsOfUse',
  ),
  pageSectionHelp: asTranslationKey('account.profile.about.page.sections.help'),
  pageSectionLegal: asTranslationKey(
    'account.profile.about.page.sections.legal',
  ),
  pageSectionPrivacyAndData: asTranslationKey(
    'account.profile.about.page.sections.privacyAndData',
  ),
  pageSectionTechnical: asTranslationKey(
    'account.profile.about.page.sections.technical',
  ),
  pageTitle: asTranslationKey('account.profile.about.page.title'),
  title: asTranslationKey('account.profile.about.title'),
  versionLabel: asTranslationKey('account.profile.about.versionLabel'),
} as const;

export function resolveProfileAboutLabels(
  localization: LocalizationPlatform,
): ProfileAboutLabels {
  return {
    comingSoonBadge: translate(
      localization,
      PROFILE_ABOUT_TRANSLATION_KEYS.comingSoonBadge,
    ),
    description: translate(
      localization,
      PROFILE_ABOUT_TRANSLATION_KEYS.description,
    ),
    page: {
      buildInfoLabel: translate(
        localization,
        PROFILE_ABOUT_TRANSLATION_KEYS.pageBuildInfoLabel,
      ),
      ecosystem: {
        description: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageEcosystemDescription,
        ),
        title: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageEcosystemTitle,
        ),
      },
      medical: {
        description: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageMedicalDescription,
        ),
        title: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageMedicalTitle,
        ),
      },
      productName: translate(
        localization,
        PROFILE_ABOUT_TRANSLATION_KEYS.pageProductName,
      ),
      rows: {
        accountDeletion: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageRowAccountDeletion,
        ),
        contactSupport: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageRowContactSupport,
        ),
        dataExport: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageRowDataExport,
        ),
        dataManagement: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageRowDataManagement,
        ),
        licenses: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageRowLicenses,
        ),
        openSourceLicenses: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageRowOpenSourceLicenses,
        ),
        privacyPolicy: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageRowPrivacyPolicy,
        ),
        reportIssue: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageRowReportIssue,
        ),
        supportCenter: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageRowSupportCenter,
        ),
        termsOfUse: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageRowTermsOfUse,
        ),
      },
      sections: {
        help: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageSectionHelp,
        ),
        legal: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageSectionLegal,
        ),
        privacyAndData: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageSectionPrivacyAndData,
        ),
        technical: translate(
          localization,
          PROFILE_ABOUT_TRANSLATION_KEYS.pageSectionTechnical,
        ),
      },
      title: translate(localization, PROFILE_ABOUT_TRANSLATION_KEYS.pageTitle),
    },
    title: translate(localization, PROFILE_ABOUT_TRANSLATION_KEYS.title),
    versionLabel: translate(
      localization,
      PROFILE_ABOUT_TRANSLATION_KEYS.versionLabel,
    ),
  };
}
