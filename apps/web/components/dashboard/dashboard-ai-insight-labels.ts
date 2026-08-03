import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

export interface DashboardAiInsightLabels {
  readonly defaultEmpty: string;
  readonly defaultError: string;
  readonly disclaimer: string;
  readonly eyebrow: string;
  readonly loading: string;
  readonly relatedEventsLabel: string;
  readonly relatedEventsNone: string;
  readonly title: string;
  readonly unavailable: string;
}

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const DASHBOARD_AI_INSIGHT_TRANSLATION_KEYS = {
  defaultEmpty: asTranslationKey('dashboard.aiInsight.empty.default'),
  defaultError: asTranslationKey('dashboard.aiInsight.error.default'),
  disclaimer: asTranslationKey('dashboard.aiInsight.disclaimer'),
  eyebrow: asTranslationKey('dashboard.aiInsight.eyebrow'),
  loading: asTranslationKey('dashboard.aiInsight.loading'),
  relatedEventsLabel: asTranslationKey(
    'dashboard.aiInsight.relatedEvents.label',
  ),
  relatedEventsNone: asTranslationKey('dashboard.aiInsight.relatedEvents.none'),
  title: asTranslationKey('dashboard.aiInsight.title'),
  unavailable: asTranslationKey('dashboard.aiInsight.unavailable'),
} as const;

function translateDashboardAiInsightKey(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

/**
 * Resolves localized Dashboard AI Insight block labels from the platform runtime.
 */
export function resolveDashboardAiInsightLabels(
  localization: LocalizationPlatform,
): DashboardAiInsightLabels {
  return {
    defaultEmpty: translateDashboardAiInsightKey(
      localization,
      DASHBOARD_AI_INSIGHT_TRANSLATION_KEYS.defaultEmpty,
    ),
    defaultError: translateDashboardAiInsightKey(
      localization,
      DASHBOARD_AI_INSIGHT_TRANSLATION_KEYS.defaultError,
    ),
    disclaimer: translateDashboardAiInsightKey(
      localization,
      DASHBOARD_AI_INSIGHT_TRANSLATION_KEYS.disclaimer,
    ),
    eyebrow: translateDashboardAiInsightKey(
      localization,
      DASHBOARD_AI_INSIGHT_TRANSLATION_KEYS.eyebrow,
    ),
    loading: translateDashboardAiInsightKey(
      localization,
      DASHBOARD_AI_INSIGHT_TRANSLATION_KEYS.loading,
    ),
    relatedEventsLabel: translateDashboardAiInsightKey(
      localization,
      DASHBOARD_AI_INSIGHT_TRANSLATION_KEYS.relatedEventsLabel,
    ),
    relatedEventsNone: translateDashboardAiInsightKey(
      localization,
      DASHBOARD_AI_INSIGHT_TRANSLATION_KEYS.relatedEventsNone,
    ),
    title: translateDashboardAiInsightKey(
      localization,
      DASHBOARD_AI_INSIGHT_TRANSLATION_KEYS.title,
    ),
    unavailable: translateDashboardAiInsightKey(
      localization,
      DASHBOARD_AI_INSIGHT_TRANSLATION_KEYS.unavailable,
    ),
  };
}

export const dashboardAiInsightTranslationKeys =
  DASHBOARD_AI_INSIGHT_TRANSLATION_KEYS;
