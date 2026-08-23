import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

export interface DashboardQuickActionsLabels {
  readonly title: string;
}

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const DASHBOARD_QUICK_ACTIONS_TRANSLATION_KEYS = {
  title: asTranslationKey('dashboard.quickActions.title'),
} as const;

function translateDashboardQuickActionsKey(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

export function resolveDashboardQuickActionsLabels(
  localization: LocalizationPlatform,
): DashboardQuickActionsLabels {
  return {
    title: translateDashboardQuickActionsKey(
      localization,
      DASHBOARD_QUICK_ACTIONS_TRANSLATION_KEYS.title,
    ),
  };
}
