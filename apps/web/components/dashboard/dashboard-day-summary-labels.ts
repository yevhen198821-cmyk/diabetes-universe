import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

export interface DashboardDaySummaryLabels {
  readonly defaultEmpty: string;
  readonly defaultError: string;
  readonly eyebrow: string;
  readonly glucoseMeasurements: string;
  readonly loading: string;
  readonly medicationDoses: string;
  readonly title: string;
  readonly totalCarbohydrates: string;
  readonly totalInsulin: string;
  readonly unavailable: string;
  readonly units: Readonly<{
    readonly compactInsulinDose: string;
    readonly compactMassG: string;
  }>;
}

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS = {
  defaultEmpty: asTranslationKey('dashboard.daySummary.empty.default'),
  defaultError: asTranslationKey('dashboard.daySummary.error.default'),
  eyebrow: asTranslationKey('dashboard.daySummary.eyebrow'),
  glucoseMeasurements: asTranslationKey(
    'dashboard.daySummary.metrics.glucoseMeasurements',
  ),
  loading: asTranslationKey('dashboard.daySummary.loading'),
  medicationDoses: asTranslationKey(
    'dashboard.daySummary.metrics.medicationDoses',
  ),
  title: asTranslationKey('dashboard.daySummary.title'),
  totalCarbohydrates: asTranslationKey(
    'dashboard.daySummary.metrics.totalCarbohydrates',
  ),
  totalInsulin: asTranslationKey('dashboard.daySummary.metrics.totalInsulin'),
  unavailable: asTranslationKey('dashboard.daySummary.unavailable'),
} as const;

const DASHBOARD_DAY_SUMMARY_COMPACT_UNIT_TRANSLATION_KEYS = {
  compactInsulinDose: asTranslationKey('timeline.units.insulinDose'),
  compactMassG: asTranslationKey('timeline.units.massG'),
} as const;

function translateDashboardDaySummaryKey(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

/**
 * Resolves localized Dashboard Day Summary block labels from the platform runtime.
 */
export function resolveDashboardDaySummaryLabels(
  localization: LocalizationPlatform,
): DashboardDaySummaryLabels {
  return {
    defaultEmpty: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.defaultEmpty,
    ),
    defaultError: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.defaultError,
    ),
    eyebrow: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.eyebrow,
    ),
    glucoseMeasurements: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.glucoseMeasurements,
    ),
    loading: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.loading,
    ),
    medicationDoses: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.medicationDoses,
    ),
    title: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.title,
    ),
    totalCarbohydrates: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.totalCarbohydrates,
    ),
    totalInsulin: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.totalInsulin,
    ),
    unavailable: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.unavailable,
    ),
    units: {
      compactInsulinDose: translateDashboardDaySummaryKey(
        localization,
        DASHBOARD_DAY_SUMMARY_COMPACT_UNIT_TRANSLATION_KEYS.compactInsulinDose,
      ),
      compactMassG: translateDashboardDaySummaryKey(
        localization,
        DASHBOARD_DAY_SUMMARY_COMPACT_UNIT_TRANSLATION_KEYS.compactMassG,
      ),
    },
  };
}

export const dashboardDaySummaryTranslationKeys =
  DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS;
