import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

import type { DashboardRecentEventCategory } from './dashboard-recent-events-model';

export type DashboardRecentEventsCategoryLabels = Record<
  DashboardRecentEventCategory,
  string
>;

export interface DashboardRecentEventsLabels {
  readonly categories: DashboardRecentEventsCategoryLabels;
  readonly defaultEmpty: string;
  readonly defaultError: string;
  readonly loading: string;
  readonly title: string;
  readonly unavailable: string;
  readonly viewAll: string;
}

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const DASHBOARD_RECENT_EVENTS_TRANSLATION_KEYS = {
  categories: {
    activity: asTranslationKey('dashboard.recentEvents.categories.activity'),
    insulin: asTranslationKey('dashboard.recentEvents.categories.insulin'),
    medication: asTranslationKey(
      'dashboard.recentEvents.categories.medication',
    ),
    nutrition: asTranslationKey('dashboard.recentEvents.categories.nutrition'),
  },
  defaultEmpty: asTranslationKey('dashboard.recentEvents.empty.default'),
  defaultError: asTranslationKey('dashboard.recentEvents.error.default'),
  loading: asTranslationKey('dashboard.recentEvents.loading'),
  title: asTranslationKey('dashboard.recentEvents.title'),
  unavailable: asTranslationKey('dashboard.recentEvents.unavailable'),
  viewAll: asTranslationKey('dashboard.recentEvents.viewAll'),
} as const;

function translateDashboardRecentEventsKey(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

/**
 * Resolves localized Dashboard Recent Events block labels from the platform runtime.
 */
export function resolveDashboardRecentEventsLabels(
  localization: LocalizationPlatform,
): DashboardRecentEventsLabels {
  return {
    categories: {
      activity: translateDashboardRecentEventsKey(
        localization,
        DASHBOARD_RECENT_EVENTS_TRANSLATION_KEYS.categories.activity,
      ),
      insulin: translateDashboardRecentEventsKey(
        localization,
        DASHBOARD_RECENT_EVENTS_TRANSLATION_KEYS.categories.insulin,
      ),
      medication: translateDashboardRecentEventsKey(
        localization,
        DASHBOARD_RECENT_EVENTS_TRANSLATION_KEYS.categories.medication,
      ),
      nutrition: translateDashboardRecentEventsKey(
        localization,
        DASHBOARD_RECENT_EVENTS_TRANSLATION_KEYS.categories.nutrition,
      ),
    },
    defaultEmpty: translateDashboardRecentEventsKey(
      localization,
      DASHBOARD_RECENT_EVENTS_TRANSLATION_KEYS.defaultEmpty,
    ),
    defaultError: translateDashboardRecentEventsKey(
      localization,
      DASHBOARD_RECENT_EVENTS_TRANSLATION_KEYS.defaultError,
    ),
    loading: translateDashboardRecentEventsKey(
      localization,
      DASHBOARD_RECENT_EVENTS_TRANSLATION_KEYS.loading,
    ),
    title: translateDashboardRecentEventsKey(
      localization,
      DASHBOARD_RECENT_EVENTS_TRANSLATION_KEYS.title,
    ),
    unavailable: translateDashboardRecentEventsKey(
      localization,
      DASHBOARD_RECENT_EVENTS_TRANSLATION_KEYS.unavailable,
    ),
    viewAll: translateDashboardRecentEventsKey(
      localization,
      DASHBOARD_RECENT_EVENTS_TRANSLATION_KEYS.viewAll,
    ),
  };
}

export const dashboardRecentEventsTranslationKeys =
  DASHBOARD_RECENT_EVENTS_TRANSLATION_KEYS;
