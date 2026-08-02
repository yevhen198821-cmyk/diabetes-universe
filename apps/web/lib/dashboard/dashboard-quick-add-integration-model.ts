import type { TimelineEvent } from '@diabetes-universe/types';

import { formatInsulinDose } from '../quick-add/format-insulin';
import { formatNutritionCarbs } from '../quick-add/format-nutrition';
import { getTimelineCalendarDateKey } from '../timeline/timeline-date-time';
import {
  getLatestGlucoseEvent,
  getRecentTimelineEvents,
  getTodayInsulinTotal,
  getTodayMedicationCount,
  getTodayNutritionTotal,
  getTodayTimelineEvents,
} from '../timeline/timeline-selectors';

export interface DashboardDerivedAiInsight {
  readonly displayTime: string;
  readonly generatedAt: string;
  readonly id: string;
  readonly relatedEventIds: readonly string[];
  readonly summary: string;
  readonly title: string;
}

export interface DashboardDerivedDaySummary {
  readonly dayDate: string;
  readonly displayDayLabel: string;
  readonly glucoseMeasurements: number;
  readonly medicationDoses: number;
  readonly remindersCompleted: number;
  readonly remindersTotal: number;
  readonly totalCarbohydrates: string;
  readonly totalInsulin: string;
}

export interface DashboardDerivedLastGlucose {
  readonly dateTime: string;
  readonly displayTime: string;
  readonly value: string;
}

export interface DashboardDerivedRecentEvent {
  readonly category: 'activity' | 'insulin' | 'medication' | 'nutrition';
  readonly context: string;
  readonly dateTime: string;
  readonly displayTime: string;
  readonly id: string;
  readonly title: string;
  readonly unit: string;
  readonly value: string;
}

export interface DashboardTimelineState {
  readonly events: readonly TimelineEvent[];
}

export interface DashboardQuickAddIntegrationOptions {
  readonly aiInsight?: DashboardDerivedAiInsight | null;
  readonly formatLastGlucoseDisplayTime?: (dateTime: string) => string;
  readonly locale?: string;
  readonly referenceTime?: Date;
  readonly remindersCompleted?: number;
  readonly remindersTotal?: number;
  readonly timeZone?: string;
}

export interface DashboardQuickAddIntegrationResult {
  readonly aiInsight: DashboardDerivedAiInsight | null;
  readonly daySummary: DashboardDerivedDaySummary | null;
  readonly lastGlucose: DashboardDerivedLastGlucose | null;
  readonly recentEvents: readonly DashboardDerivedRecentEvent[];
}

const DEFAULT_LOCALE = 'ru-RU';

function createDashboardDayLabel(
  currentDate: Date,
  locale: string,
  timeZone?: string,
): Pick<DashboardDerivedDaySummary, 'dayDate' | 'displayDayLabel'> | null {
  if (Number.isNaN(currentDate.getTime())) {
    return null;
  }

  try {
    const normalizedLocale = locale.trim();
    const normalizedTimeZone = timeZone?.trim();
    const supportedLocales = Intl.DateTimeFormat.supportedLocalesOf([
      normalizedLocale,
    ]);

    if (supportedLocales.length === 0) {
      return null;
    }

    const displayDayLabel = new Intl.DateTimeFormat(normalizedLocale, {
      day: 'numeric',
      month: 'long',
      timeZone: normalizedTimeZone || undefined,
      weekday: 'long',
    }).format(currentDate);
    const dayDate = getTimelineCalendarDateKey(
      currentDate.toISOString(),
      normalizedTimeZone || undefined,
    );

    if (!dayDate) {
      return null;
    }

    const trimmedLabel = displayDayLabel.trim();

    if (trimmedLabel.length === 0) {
      return null;
    }

    return {
      dayDate,
      displayDayLabel: trimmedLabel,
    };
  } catch {
    return null;
  }
}

function deriveLastGlucose(
  events: readonly TimelineEvent[],
  formatLastGlucoseDisplayTime?: (dateTime: string) => string,
): DashboardDerivedLastGlucose | null {
  const latestGlucose = getLatestGlucoseEvent(events);

  if (!latestGlucose || !formatLastGlucoseDisplayTime) {
    return null;
  }

  const displayTime = formatLastGlucoseDisplayTime(
    latestGlucose.dateTime,
  ).trim();

  if (displayTime.length === 0 || displayTime === '--:--') {
    return null;
  }

  return {
    dateTime: latestGlucose.dateTime,
    displayTime,
    value: latestGlucose.value,
  };
}

function deriveDaySummary(
  events: readonly TimelineEvent[],
  referenceTime: Date,
  locale: string,
  timeZone: string | undefined,
  remindersCompleted: number,
  remindersTotal: number,
): DashboardDerivedDaySummary | null {
  const dayLabel = createDashboardDayLabel(referenceTime, locale, timeZone);

  if (!dayLabel) {
    return null;
  }

  const todayEvents = getTodayTimelineEvents(events, referenceTime, timeZone);
  const glucoseMeasurements = todayEvents.filter(
    (event) => event.kind === 'glucose',
  ).length;
  const medicationDoses = getTodayMedicationCount(
    events,
    referenceTime,
    timeZone,
  );
  const totalInsulinUnits = getTodayInsulinTotal(
    events,
    referenceTime,
    timeZone,
  );
  const totalCarbohydrateGrams = getTodayNutritionTotal(
    events,
    referenceTime,
    timeZone,
  );

  return {
    dayDate: dayLabel.dayDate,
    displayDayLabel: dayLabel.displayDayLabel,
    glucoseMeasurements,
    medicationDoses,
    remindersCompleted,
    remindersTotal,
    totalCarbohydrates: `${formatNutritionCarbs(totalCarbohydrateGrams)} г`,
    totalInsulin: `${formatInsulinDose(totalInsulinUnits)} ЕД`,
  };
}

export function deriveDashboardQuickAddBlocks(
  state: DashboardTimelineState,
  options: DashboardQuickAddIntegrationOptions = {},
): DashboardQuickAddIntegrationResult {
  const referenceTime = options.referenceTime ?? new Date();
  const locale = options.locale ?? DEFAULT_LOCALE;
  const timeZone = options.timeZone?.trim() || undefined;
  const remindersCompleted = options.remindersCompleted ?? 0;
  const remindersTotal = options.remindersTotal ?? 0;

  const recentEvents = getRecentTimelineEvents(state.events, {
    locale,
    timeZone,
  });

  return {
    aiInsight: options.aiInsight ?? null,
    daySummary: deriveDaySummary(
      state.events,
      referenceTime,
      locale,
      timeZone,
      remindersCompleted,
      remindersTotal,
    ),
    lastGlucose: deriveLastGlucose(
      state.events,
      options.formatLastGlucoseDisplayTime,
    ),
    recentEvents,
  };
}
