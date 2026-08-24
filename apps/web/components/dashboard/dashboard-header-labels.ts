import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

export interface DashboardHeaderLabels {
  readonly addEvent: string;
  readonly avatar: string;
  readonly avatarAction: string;
  readonly brandLineAccent: string;
  readonly brandLinePrimary: string;
  readonly brandName: string;
  readonly currentDate: string;
  readonly dateUnavailable: string;
  readonly defaultError: string;
  readonly loading: string;
  readonly productName: string;
}

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const DASHBOARD_HEADER_TRANSLATION_KEYS = {
  addEvent: asTranslationKey('dashboard.header.addEvent'),
  avatar: asTranslationKey('dashboard.header.avatar.label'),
  avatarAction: asTranslationKey('dashboard.header.avatar.action'),
  brandLineAccent: asTranslationKey('dashboard.header.brandLineAccent'),
  brandLinePrimary: asTranslationKey('dashboard.header.brandLinePrimary'),
  brandName: asTranslationKey('dashboard.header.brandName'),
  currentDate: asTranslationKey('dashboard.header.date.label'),
  dateUnavailable: asTranslationKey('dashboard.header.date.unavailable'),
  defaultError: asTranslationKey('dashboard.header.error.default'),
  loading: asTranslationKey('dashboard.header.loading'),
  productName: asTranslationKey('dashboard.header.title'),
} as const;

function translateDashboardHeaderKey(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

/**
 * Resolves localized Dashboard Header labels from the platform localization runtime.
 */
export function resolveDashboardHeaderLabels(
  localization: LocalizationPlatform,
): DashboardHeaderLabels {
  return {
    addEvent: translateDashboardHeaderKey(
      localization,
      DASHBOARD_HEADER_TRANSLATION_KEYS.addEvent,
    ),
    avatar: translateDashboardHeaderKey(
      localization,
      DASHBOARD_HEADER_TRANSLATION_KEYS.avatar,
    ),
    avatarAction: translateDashboardHeaderKey(
      localization,
      DASHBOARD_HEADER_TRANSLATION_KEYS.avatarAction,
    ),
    brandLineAccent: translateDashboardHeaderKey(
      localization,
      DASHBOARD_HEADER_TRANSLATION_KEYS.brandLineAccent,
    ),
    brandLinePrimary: translateDashboardHeaderKey(
      localization,
      DASHBOARD_HEADER_TRANSLATION_KEYS.brandLinePrimary,
    ),
    brandName: translateDashboardHeaderKey(
      localization,
      DASHBOARD_HEADER_TRANSLATION_KEYS.brandName,
    ),
    currentDate: translateDashboardHeaderKey(
      localization,
      DASHBOARD_HEADER_TRANSLATION_KEYS.currentDate,
    ),
    dateUnavailable: translateDashboardHeaderKey(
      localization,
      DASHBOARD_HEADER_TRANSLATION_KEYS.dateUnavailable,
    ),
    defaultError: translateDashboardHeaderKey(
      localization,
      DASHBOARD_HEADER_TRANSLATION_KEYS.defaultError,
    ),
    loading: translateDashboardHeaderKey(
      localization,
      DASHBOARD_HEADER_TRANSLATION_KEYS.loading,
    ),
    productName: translateDashboardHeaderKey(
      localization,
      DASHBOARD_HEADER_TRANSLATION_KEYS.productName,
    ),
  };
}

export const dashboardHeaderTranslationKeys = DASHBOARD_HEADER_TRANSLATION_KEYS;
