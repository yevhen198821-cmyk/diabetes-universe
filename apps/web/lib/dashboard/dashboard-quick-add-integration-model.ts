import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { presentGlucoseFromTimelineEvent } from '../medical/glucose/present-glucose-from-timeline-event';
import type { TimelinePresentationDependencies } from '../timeline/presentation';
import { deriveDashboardRecentEventSources } from './dashboard-recent-events-derivation';
import {
  deriveDashboardDaySummaryVisualizations,
  type DashboardDaySummaryVisualizations,
} from './dashboard-day-summary-series';
import { getTimelineCalendarDateKey } from '../timeline/timeline-date-time';
import {
  getLatestGlucoseEvent,
  getTodayActivityTotalSeconds,
  getTodayInsulinTotal,
  getTodayMedicationCount,
  getTodayNutritionTotal,
  getTodayTimelineEvents,
  type TimelineRecentEvent,
} from '../timeline/timeline-selectors';

export interface DashboardDerivedDaySummary {
  readonly dayDate: string;
  readonly displayDayLabel: string;
  readonly glucoseMeasurements: number;
  readonly latestTodayGlucoseDisplay: string | null;
  readonly latestTodayGlucoseDisplayTime: string | null;
  readonly medicationDoses: number;
  readonly totalActivitySeconds: number;
  readonly totalCarbohydrateGrams: number;
  readonly totalInsulinUnits: number;
  readonly visualizations: DashboardDaySummaryVisualizations;
}

export interface DashboardDerivedLastGlucose {
  readonly displayTime: string;
  readonly event: Extract<SemanticTimelineEvent, { kind: 'glucose' }>;
}

export type DashboardDerivedRecentEvent = TimelineRecentEvent;

export interface DashboardTimelineState {
  readonly events: readonly SemanticTimelineEvent[];
}

export interface DashboardQuickAddIntegrationOptions {
  readonly formatDaySummaryDisplayDate?: (referenceTime: Date) => string;
  readonly formatLastGlucoseDisplayTime?: (dateTime: string) => string;
  readonly formatRecentEventDisplayTime?: (dateTime: string) => string;
  readonly locale?: string;
  readonly presentationDependencies: TimelinePresentationDependencies;
  readonly referenceTime?: Date;
  readonly timeZone?: string;
}

export interface DashboardQuickAddIntegrationResult {
  readonly daySummary: DashboardDerivedDaySummary | null;
  readonly lastGlucose: DashboardDerivedLastGlucose | null;
  readonly recentEvents: readonly DashboardDerivedRecentEvent[];
}

function createDashboardDayLabel(
  currentDate: Date,
  timeZone: string | undefined,
  formatDaySummaryDisplayDate: (referenceTime: Date) => string,
): Pick<DashboardDerivedDaySummary, 'dayDate' | 'displayDayLabel'> | null {
  if (Number.isNaN(currentDate.getTime())) {
    return null;
  }

  const dayDate = getTimelineCalendarDateKey(
    currentDate.toISOString(),
    timeZone?.trim() || undefined,
  );

  if (!dayDate) {
    return null;
  }

  const displayDayLabel = formatDaySummaryDisplayDate(currentDate).trim();

  if (displayDayLabel.length === 0) {
    return null;
  }

  return {
    dayDate,
    displayDayLabel,
  };
}

function deriveLastGlucose(
  events: readonly SemanticTimelineEvent[],
  formatLastGlucoseDisplayTime?: (dateTime: string) => string,
): DashboardDerivedLastGlucose | null {
  const latestGlucose = getLatestGlucoseEvent(events);

  if (!latestGlucose || !formatLastGlucoseDisplayTime) {
    return null;
  }

  const displayTime = formatLastGlucoseDisplayTime(
    latestGlucose.occurredAt,
  ).trim();

  if (displayTime.length === 0 || displayTime === '--:--') {
    return null;
  }

  return {
    displayTime,
    event: latestGlucose,
  };
}

function deriveDaySummary(
  events: readonly SemanticTimelineEvent[],
  referenceTime: Date,
  timeZone: string | undefined,
  formatDaySummaryDisplayDate?: (referenceTime: Date) => string,
  presentationDependencies?: TimelinePresentationDependencies,
  formatLastGlucoseDisplayTime?: (dateTime: string) => string,
): DashboardDerivedDaySummary | null {
  if (!formatDaySummaryDisplayDate) {
    return null;
  }

  const dayLabel = createDashboardDayLabel(
    referenceTime,
    timeZone,
    formatDaySummaryDisplayDate,
  );

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
  const totalActivitySeconds = getTodayActivityTotalSeconds(
    events,
    referenceTime,
    timeZone,
  );
  const latestTodayGlucose = getLatestGlucoseEvent(todayEvents);
  let latestTodayGlucoseDisplay: string | null = null;
  let latestTodayGlucoseDisplayTime: string | null = null;

  if (latestTodayGlucose && presentationDependencies) {
    const presentation = presentGlucoseFromTimelineEvent({
      event: latestTodayGlucose,
      formatter: presentationDependencies.formatter,
      glucoseDisplayUnit: presentationDependencies.glucoseDisplayUnit,
      glucoseKindLabel: presentationDependencies.labels.eventKinds.glucose,
      localization: presentationDependencies.localization,
      referenceTime,
      targetRange: presentationDependencies.targetRange,
    });
    const display = presentation.formattedMeasurement.trim();

    latestTodayGlucoseDisplay = display.length > 0 ? display : null;

    if (formatLastGlucoseDisplayTime) {
      const displayTime = formatLastGlucoseDisplayTime(
        latestTodayGlucose.occurredAt,
      ).trim();

      latestTodayGlucoseDisplayTime =
        displayTime.length > 0 && displayTime !== '--:--' ? displayTime : null;
    }
  }

  return {
    dayDate: dayLabel.dayDate,
    displayDayLabel: dayLabel.displayDayLabel,
    glucoseMeasurements,
    latestTodayGlucoseDisplay,
    latestTodayGlucoseDisplayTime,
    medicationDoses,
    totalActivitySeconds,
    totalCarbohydrateGrams,
    totalInsulinUnits,
    visualizations: deriveDashboardDaySummaryVisualizations(
      events,
      referenceTime,
      timeZone,
    ),
  };
}

export function deriveDashboardQuickAddBlocks(
  state: DashboardTimelineState,
  options: DashboardQuickAddIntegrationOptions,
): DashboardQuickAddIntegrationResult {
  const { presentationDependencies } = options;
  const referenceTime = options.referenceTime ?? new Date();
  const timeZone = options.timeZone?.trim() || undefined;
  const recentEvents = options.formatRecentEventDisplayTime
    ? deriveDashboardRecentEventSources(
        state.events,
        presentationDependencies,
        {
          formatDisplayTime: options.formatRecentEventDisplayTime,
        },
      )
    : [];

  return {
    daySummary: deriveDaySummary(
      state.events,
      referenceTime,
      timeZone,
      options.formatDaySummaryDisplayDate,
      presentationDependencies,
      options.formatLastGlucoseDisplayTime,
    ),
    lastGlucose: deriveLastGlucose(
      state.events,
      options.formatLastGlucoseDisplayTime,
    ),
    recentEvents,
  };
}
