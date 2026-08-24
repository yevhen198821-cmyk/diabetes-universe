import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

export interface DashboardDaySummaryChartAriaLabels {
  readonly activity: (count: number) => string;
  readonly glucose: (count: number) => string;
  readonly insulin: (count: number) => string;
  readonly nutrition: (count: number) => string;
}

export interface DashboardDaySummaryLabels {
  readonly activity: string;
  readonly chartAria: DashboardDaySummaryChartAriaLabels;
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
  chartAria: {
    activity: {
      multiple: asTranslationKey(
        'dashboard.daySummary.chartAria.activity.multiple',
      ),
      none: asTranslationKey('dashboard.daySummary.chartAria.activity.none'),
      single: asTranslationKey(
        'dashboard.daySummary.chartAria.activity.single',
      ),
    },
    glucose: {
      multiple: asTranslationKey(
        'dashboard.daySummary.chartAria.glucose.multiple',
      ),
      none: asTranslationKey('dashboard.daySummary.chartAria.glucose.none'),
      single: asTranslationKey('dashboard.daySummary.chartAria.glucose.single'),
    },
    insulin: {
      multiple: asTranslationKey(
        'dashboard.daySummary.chartAria.insulin.multiple',
      ),
      none: asTranslationKey('dashboard.daySummary.chartAria.insulin.none'),
      single: asTranslationKey('dashboard.daySummary.chartAria.insulin.single'),
    },
    nutrition: {
      multiple: asTranslationKey(
        'dashboard.daySummary.chartAria.nutrition.multiple',
      ),
      none: asTranslationKey('dashboard.daySummary.chartAria.nutrition.none'),
      single: asTranslationKey(
        'dashboard.daySummary.chartAria.nutrition.single',
      ),
    },
  },
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

function createChartAriaResolver(
  localization: LocalizationPlatform,
  keys: {
    readonly multiple: TranslationKey;
    readonly none: TranslationKey;
    readonly single: TranslationKey;
  },
): (count: number) => string {
  return (count: number) => {
    if (count === 0) {
      return translateDashboardDaySummaryKey(localization, keys.none);
    }

    if (count === 1) {
      return translateDashboardDaySummaryKey(localization, keys.single);
    }

    return translateDashboardDaySummaryKey(localization, keys.multiple).replace(
      '{count}',
      String(count),
    );
  };
}

export function resolveDashboardDaySummaryLabels(
  localization: LocalizationPlatform,
): DashboardDaySummaryLabels {
  return {
    activity: translateDashboardDaySummaryKey(
      localization,
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.activity,
    ),
    chartAria: {
      activity: createChartAriaResolver(
        localization,
        DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.chartAria.activity,
      ),
      glucose: createChartAriaResolver(
        localization,
        DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.chartAria.glucose,
      ),
      insulin: createChartAriaResolver(
        localization,
        DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.chartAria.insulin,
      ),
      nutrition: createChartAriaResolver(
        localization,
        DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.chartAria.nutrition,
      ),
    },
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

export const dashboardDaySummaryTranslationKeyList: readonly TranslationKey[] =
  [
    DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.activity,
    DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.defaultEmpty,
    DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.defaultError,
    DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.eyebrow,
    DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.glucose,
    DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.loading,
    DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.title,
    DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.totalCarbohydrates,
    DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.totalForDay,
    DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.totalInsulin,
    DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.unavailable,
    DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.viewDetails,
    ...Object.values(DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.chartAria.activity),
    ...Object.values(DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.chartAria.glucose),
    ...Object.values(DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.chartAria.insulin),
    ...Object.values(
      DASHBOARD_DAY_SUMMARY_TRANSLATION_KEYS.chartAria.nutrition,
    ),
  ];
