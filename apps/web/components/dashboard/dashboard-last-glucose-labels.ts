import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

export interface DashboardLastGlucoseLabels {
  readonly defaultEmpty: string;
  readonly defaultError: string;
  readonly eyebrow: string;
  readonly fresh: string;
  readonly loading: string;
  readonly stale: string;
  readonly title: string;
  readonly unavailable: string;
}

export interface DashboardLastGlucoseTimeLabels {
  readonly justNow: string;
  readonly today: string;
  readonly yesterday: string;
}

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const DASHBOARD_LAST_GLUCOSE_TRANSLATION_KEYS = {
  defaultEmpty: asTranslationKey('dashboard.lastGlucose.empty.default'),
  defaultError: asTranslationKey('dashboard.lastGlucose.error.default'),
  eyebrow: asTranslationKey('dashboard.lastGlucose.eyebrow'),
  fresh: asTranslationKey('dashboard.lastGlucose.fresh'),
  loading: asTranslationKey('dashboard.lastGlucose.loading'),
  stale: asTranslationKey('dashboard.lastGlucose.stale'),
  title: asTranslationKey('dashboard.lastGlucose.title'),
  unavailable: asTranslationKey('dashboard.lastGlucose.unavailable'),
} as const;

const DASHBOARD_LAST_GLUCOSE_TIME_TRANSLATION_KEYS = {
  justNow: asTranslationKey('dashboard.lastGlucose.time.justNow'),
  today: asTranslationKey('dashboard.lastGlucose.time.today'),
  yesterday: asTranslationKey('dashboard.lastGlucose.time.yesterday'),
} as const;

function translateDashboardLastGlucoseKey(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

/**
 * Resolves localized Dashboard Last Glucose block labels from the platform runtime.
 */
export function resolveDashboardLastGlucoseLabels(
  localization: LocalizationPlatform,
): DashboardLastGlucoseLabels {
  return {
    defaultEmpty: translateDashboardLastGlucoseKey(
      localization,
      DASHBOARD_LAST_GLUCOSE_TRANSLATION_KEYS.defaultEmpty,
    ),
    defaultError: translateDashboardLastGlucoseKey(
      localization,
      DASHBOARD_LAST_GLUCOSE_TRANSLATION_KEYS.defaultError,
    ),
    eyebrow: translateDashboardLastGlucoseKey(
      localization,
      DASHBOARD_LAST_GLUCOSE_TRANSLATION_KEYS.eyebrow,
    ),
    fresh: translateDashboardLastGlucoseKey(
      localization,
      DASHBOARD_LAST_GLUCOSE_TRANSLATION_KEYS.fresh,
    ),
    loading: translateDashboardLastGlucoseKey(
      localization,
      DASHBOARD_LAST_GLUCOSE_TRANSLATION_KEYS.loading,
    ),
    stale: translateDashboardLastGlucoseKey(
      localization,
      DASHBOARD_LAST_GLUCOSE_TRANSLATION_KEYS.stale,
    ),
    title: translateDashboardLastGlucoseKey(
      localization,
      DASHBOARD_LAST_GLUCOSE_TRANSLATION_KEYS.title,
    ),
    unavailable: translateDashboardLastGlucoseKey(
      localization,
      DASHBOARD_LAST_GLUCOSE_TRANSLATION_KEYS.unavailable,
    ),
  };
}

export function resolveDashboardLastGlucoseTimeLabels(
  localization: LocalizationPlatform,
): DashboardLastGlucoseTimeLabels {
  return {
    justNow: translateDashboardLastGlucoseKey(
      localization,
      DASHBOARD_LAST_GLUCOSE_TIME_TRANSLATION_KEYS.justNow,
    ),
    today: translateDashboardLastGlucoseKey(
      localization,
      DASHBOARD_LAST_GLUCOSE_TIME_TRANSLATION_KEYS.today,
    ),
    yesterday: translateDashboardLastGlucoseKey(
      localization,
      DASHBOARD_LAST_GLUCOSE_TIME_TRANSLATION_KEYS.yesterday,
    ),
  };
}

export const dashboardLastGlucoseTranslationKeys =
  DASHBOARD_LAST_GLUCOSE_TRANSLATION_KEYS;

export const dashboardLastGlucoseTimeTranslationKeys =
  DASHBOARD_LAST_GLUCOSE_TIME_TRANSLATION_KEYS;
