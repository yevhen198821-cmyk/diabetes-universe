import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

export interface DashboardLastGlucoseLabels {
  readonly defaultEmpty: string;
  readonly defaultError: string;
  readonly eyebrow: string;
  readonly loading: string;
  readonly stale: string;
  readonly title: string;
  readonly unavailable: string;
}

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const DASHBOARD_LAST_GLUCOSE_TRANSLATION_KEYS = {
  defaultEmpty: asTranslationKey('dashboard.lastGlucose.empty.default'),
  defaultError: asTranslationKey('dashboard.lastGlucose.error.default'),
  eyebrow: asTranslationKey('dashboard.lastGlucose.eyebrow'),
  loading: asTranslationKey('dashboard.lastGlucose.loading'),
  stale: asTranslationKey('dashboard.lastGlucose.stale'),
  title: asTranslationKey('dashboard.lastGlucose.title'),
  unavailable: asTranslationKey('dashboard.lastGlucose.unavailable'),
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

export const dashboardLastGlucoseTranslationKeys =
  DASHBOARD_LAST_GLUCOSE_TRANSLATION_KEYS;
