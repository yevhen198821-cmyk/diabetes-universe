import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

export interface DashboardDaySummaryLabels {
  readonly activity: string;
  readonly defaultEmpty: string;
  readonly defaultError: string;
  readonly eyebrow: string;
  readonly glucose: string;
  readonly loading: string;
  readonly title: string;
  readonly totalCarbohydrates: string;
  readonly totalForDay: string;
  readonly totalInsulin: string;
  readonly unavailable: string;
  readonly units: Readonly<{
    readonly compactInsulinDose: string;
    readonly compactMassG: string;
  }>;
  readonly viewDetails: string;
}

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS = {
  activity: asTranslationKey('dashboard.daySummary.metrics.activity'),
  defaultEmpty: asTranslationKey('dashboard.daySummary.empty.default'),
  defaultError: asTranslationKey('dashboard.daySummary.error.default'),
  eyebrow: asTranslationKey('dashboard.daySummary.eyebrow'),
  glucose: asTranslationKey('dashboard.daySummary.metrics.glucose'),
  loading: asTranslationKey('dashboard.daySummary.loading'),
  title: asTranslationKey('dashboard.daySummary.title'),
  totalCarbohydrates: asTranslationKey(
    'dashboard.daySummary.metrics.totalCarbohydrates',
  ),
  totalForDay: asTranslationKey('dashboard.daySummary.metrics.totalForDay'),
  totalInsulin: asTranslationKey('dashboard.daySummary.metrics.totalInsulin'),
  unavailable: asTranslationKey('dashboard.daySummary.unavailable'),
  viewDetails: asTranslationKey('dashboard.daySummary.viewDetails'),
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

export function resolveDashboardDaySummaryLabels(
  localization: LocalizationPlatform,
): DashboardDaySummaryLabels {
  return {
    activity: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.activity,
    ),
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
    glucose: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.glucose,
    ),
    loading: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.loading,
    ),
    title: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.title,
    ),
    totalCarbohydrates: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.totalCarbohydrates,
    ),
    totalForDay: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.totalForDay,
    ),
    totalInsulin: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.totalInsulin,
    ),
    unavailable: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.unavailable,
    ),
    viewDetails: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.viewDetails,
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
