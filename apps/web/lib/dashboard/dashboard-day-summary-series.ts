import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { getTodayTimelineEvents } from '../timeline/timeline-selectors';

export interface DashboardDaySummaryGlucosePoint {
  readonly concentrationMmolPerL: number;
}

export interface DashboardDaySummaryInsulinMark {
  readonly doseUnits: number;
}

export interface DashboardDaySummaryNutritionMark {
  readonly carbohydratesGrams: number;
}

export interface DashboardDaySummaryActivityMark {
  readonly durationSeconds: number;
}

export interface DashboardDaySummaryVisualizations {
  readonly activity: readonly DashboardDaySummaryActivityMark[];
  readonly glucose: readonly DashboardDaySummaryGlucosePoint[];
  readonly insulin: readonly DashboardDaySummaryInsulinMark[];
  readonly nutrition: readonly DashboardDaySummaryNutritionMark[];
}

export const EMPTY_DASHBOARD_DAY_SUMMARY_VISUALIZATIONS: DashboardDaySummaryVisualizations =
  {
    activity: [],
    glucose: [],
    insulin: [],
    nutrition: [],
  };

export function deriveDashboardDaySummaryVisualizations(
  events: readonly SemanticTimelineEvent[],
  referenceTime: Date,
  timeZone?: string,
): DashboardDaySummaryVisualizations {
  const todayEvents = getTodayTimelineEvents(events, referenceTime, timeZone);

  return {
    activity: todayEvents
      .filter(
        (
          event,
        ): event is Extract<SemanticTimelineEvent, { kind: 'activity' }> =>
          event.kind === 'activity',
      )
      .map((event) => ({
        durationSeconds: event.durationSeconds,
      })),
    glucose: todayEvents
      .filter(
        (event): event is Extract<SemanticTimelineEvent, { kind: 'glucose' }> =>
          event.kind === 'glucose',
      )
      .map((event) => ({
        concentrationMmolPerL: event.concentrationMmolPerL,
      })),
    insulin: todayEvents
      .filter(
        (event): event is Extract<SemanticTimelineEvent, { kind: 'insulin' }> =>
          event.kind === 'insulin',
      )
      .map((event) => ({
        doseUnits: event.doseUnits,
      })),
    nutrition: todayEvents
      .filter(
        (
          event,
        ): event is Extract<SemanticTimelineEvent, { kind: 'nutrition' }> =>
          event.kind === 'nutrition',
      )
      .map((event) => ({
        carbohydratesGrams: event.carbohydratesGrams,
      })),
  };
}
