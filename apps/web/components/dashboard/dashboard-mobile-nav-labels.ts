import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

export interface DashboardMobileNavLabels {
  readonly account: string;
  readonly home: string;
  readonly quickAdd: string;
  readonly timeline: string;
}

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const DASHBOARD_MOBILE_NAV_TRANSLATION_KEYS = {
  account: asTranslationKey('dashboard.navigation.account'),
  home: asTranslationKey('dashboard.navigation.home'),
  quickAdd: asTranslationKey('dashboard.navigation.quickAdd'),
  timeline: asTranslationKey('dashboard.navigation.timeline'),
} as const;

function translateDashboardMobileNavKey(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

export function resolveDashboardMobileNavLabels(
  localization: LocalizationPlatform,
): DashboardMobileNavLabels {
  return {
    account: translateDashboardMobileNavKey(
      localization,
      DASHBOARD_MOBILE_NAV_TRANSLATION_KEYS.account,
    ),
    home: translateDashboardMobileNavKey(
      localization,
      DASHBOARD_MOBILE_NAV_TRANSLATION_KEYS.home,
    ),
    quickAdd: translateDashboardMobileNavKey(
      localization,
      DASHBOARD_MOBILE_NAV_TRANSLATION_KEYS.quickAdd,
    ),
    timeline: translateDashboardMobileNavKey(
      localization,
      DASHBOARD_MOBILE_NAV_TRANSLATION_KEYS.timeline,
    ),
  };
}
