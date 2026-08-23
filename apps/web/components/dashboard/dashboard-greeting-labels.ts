import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

export interface DashboardGreetingLabels {
  readonly contextToday: string;
  readonly greetingAfternoon: string;
  readonly greetingEvening: string;
  readonly greetingMorning: string;
  readonly greetingNight: string;
}

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const DASHBOARD_GREETING_TRANSLATION_KEYS = {
  contextToday: asTranslationKey('dashboard.header.context.today'),
  greetingAfternoon: asTranslationKey('dashboard.header.greeting.afternoon'),
  greetingEvening: asTranslationKey('dashboard.header.greeting.evening'),
  greetingMorning: asTranslationKey('dashboard.header.greeting.morning'),
  greetingNight: asTranslationKey('dashboard.header.greeting.night'),
} as const;

function translateDashboardGreetingKey(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

export function resolveDashboardGreetingLabels(
  localization: LocalizationPlatform,
): DashboardGreetingLabels {
  return {
    contextToday: translateDashboardGreetingKey(
      localization,
      DASHBOARD_GREETING_TRANSLATION_KEYS.contextToday,
    ),
    greetingAfternoon: translateDashboardGreetingKey(
      localization,
      DASHBOARD_GREETING_TRANSLATION_KEYS.greetingAfternoon,
    ),
    greetingEvening: translateDashboardGreetingKey(
      localization,
      DASHBOARD_GREETING_TRANSLATION_KEYS.greetingEvening,
    ),
    greetingMorning: translateDashboardGreetingKey(
      localization,
      DASHBOARD_GREETING_TRANSLATION_KEYS.greetingMorning,
    ),
    greetingNight: translateDashboardGreetingKey(
      localization,
      DASHBOARD_GREETING_TRANSLATION_KEYS.greetingNight,
    ),
  };
}

export type DashboardGreetingPeriod =
  'afternoon' | 'evening' | 'morning' | 'night';

export function resolveDashboardGreetingPeriod(
  referenceTime: Date,
): DashboardGreetingPeriod {
  const hour = referenceTime.getHours();

  if (hour >= 5 && hour < 12) {
    return 'morning';
  }

  if (hour >= 12 && hour < 17) {
    return 'afternoon';
  }

  if (hour >= 17 && hour < 22) {
    return 'evening';
  }

  return 'night';
}

export function createDashboardGreetingMessage(
  labels: DashboardGreetingLabels,
  referenceTime: Date,
): string {
  switch (resolveDashboardGreetingPeriod(referenceTime)) {
    case 'morning':
      return labels.greetingMorning;
    case 'afternoon':
      return labels.greetingAfternoon;
    case 'evening':
      return labels.greetingEvening;
    case 'night':
      return labels.greetingNight;
  }
}
